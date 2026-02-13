import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

/**
 * Supported languages in ODOP
 */
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag?: string;
}

/**
 * Available languages
 */
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', direction: 'ltr', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', direction: 'ltr', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', direction: 'ltr', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', direction: 'ltr', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', direction: 'ltr', flag: '🇮🇳' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', direction: 'ltr', flag: '🇮🇳' }
];

/**
 * Default language
 */
export const DEFAULT_LANGUAGE = 'en';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  
  private currentLang = new BehaviorSubject<string>(DEFAULT_LANGUAGE);
  private translations: { [key: string]: any } = {};
  private loadedLanguages: Set<string> = new Set();

  // Observable for language changes
  currentLang$ = this.currentLang.asObservable();

  constructor(private http: HttpClient) {
    // Initialize with saved language or browser language
    this.initializeLanguage();
  }

  /**
   * Initialize language from storage or browser settings
   */
  private initializeLanguage(): void {
    let savedLang = localStorage.getItem('odop-language');
    
    if (!savedLang) {
      // Try to detect from browser
      const browserLang = navigator.language.split('-')[0];
      if (this.isLanguageSupported(browserLang)) {
        savedLang = browserLang;
      } else {
        savedLang = DEFAULT_LANGUAGE;
      }
    }

    this.setLanguage(savedLang);
  }

  /**
   * Get current language code
   */
  getCurrentLanguage(): string {
    return this.currentLang.getValue();
  }

  /**
   * Get current language object
   */
  getCurrentLanguageInfo(): Language | undefined {
    return SUPPORTED_LANGUAGES.find(l => l.code === this.getCurrentLanguage());
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): Language[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(langCode: string): boolean {
    return SUPPORTED_LANGUAGES.some(l => l.code === langCode);
  }

  /**
   * Set current language
   */
  setLanguage(langCode: string): Observable<boolean> {
    if (!this.isLanguageSupported(langCode)) {
      console.warn(`Language ${langCode} is not supported. Falling back to ${DEFAULT_LANGUAGE}`);
      langCode = DEFAULT_LANGUAGE;
    }

    // If already loaded, just switch
    if (this.loadedLanguages.has(langCode)) {
      this.currentLang.next(langCode);
      localStorage.setItem('odop-language', langCode);
      this.updateDocumentDirection(langCode);
      return of(true);
    }

    // Load translations file
    return this.loadTranslations(langCode).pipe(
      tap(success => {
        if (success) {
          this.currentLang.next(langCode);
          localStorage.setItem('odop-language', langCode);
          this.updateDocumentDirection(langCode);
        }
      })
    );
  }

  /**
   * Load translations from JSON file
   */
  private loadTranslations(langCode: string): Observable<boolean> {
    return this.http.get<any>(`/assets/i18n/${langCode}.json`).pipe(
      tap(translations => {
        this.translations[langCode] = translations;
        this.loadedLanguages.add(langCode);
      }),
      map(() => true),
      catchError(error => {
        console.error(`Failed to load translations for ${langCode}:`, error);
        
        // Fall back to English if not already trying English
        if (langCode !== DEFAULT_LANGUAGE && !this.loadedLanguages.has(DEFAULT_LANGUAGE)) {
          return this.loadTranslations(DEFAULT_LANGUAGE);
        }
        
        return of(false);
      })
    );
  }

  /**
   * Get translation by key
   * @param key - Dot notation key like 'nav.home' or 'product.addToCart'
   * @param params - Optional parameters for interpolation
   */
  translate(key: string, params?: { [key: string]: any }): string {
    const langCode = this.getCurrentLanguage();
    const translations = this.translations[langCode];

    if (!translations) {
      // Try to load synchronously from cache or return key
      return this.getNestedValue(this.translations[DEFAULT_LANGUAGE], key) || key;
    }

    let value = this.getNestedValue(translations, key);

    // Fall back to default language if key not found
    if (!value && langCode !== DEFAULT_LANGUAGE) {
      value = this.getNestedValue(this.translations[DEFAULT_LANGUAGE], key);
    }

    // If still not found, return the key itself
    if (!value) {
      return key;
    }

    // Interpolate parameters
    if (params) {
      value = this.interpolate(value, params);
    }

    return value;
  }

  /**
   * Shorthand for translate
   */
  t(key: string, params?: { [key: string]: any }): string {
    return this.translate(key, params);
  }

  /**
   * Get instant translation (synchronous, uses cached values)
   */
  instant(key: string, params?: { [key: string]: any }): string {
    return this.translate(key, params);
  }

  /**
   * Get translation as observable (for async pipe)
   */
  get(key: string, params?: { [key: string]: any }): Observable<string> {
    return this.currentLang$.pipe(
      map(() => this.translate(key, params))
    );
  }

  /**
   * Preload multiple languages
   */
  preloadLanguages(langCodes: string[]): Observable<boolean[]> {
    const loads = langCodes
      .filter(code => !this.loadedLanguages.has(code))
      .map(code => this.loadTranslations(code));
    
    return loads.length > 0 
      ? new Observable(observer => {
          Promise.all(loads.map(obs => obs.toPromise()))
            .then(results => {
              observer.next(results as boolean[]);
              observer.complete();
            })
            .catch(err => observer.error(err));
        })
      : of([]);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, key: string): string | null {
    if (!obj || !key) return null;

    const keys = key.split('.');
    let current = obj;

    for (const k of keys) {
      if (current[k] === undefined) {
        return null;
      }
      current = current[k];
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Interpolate parameters in translation string
   * Replaces {{param}} with actual values
   */
  private interpolate(value: string, params: { [key: string]: any }): string {
    return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? String(params[paramKey]) : match;
    });
  }

  /**
   * Update document direction for RTL languages
   */
  private updateDocumentDirection(langCode: string): void {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    if (lang) {
      document.documentElement.dir = lang.direction;
      document.documentElement.lang = langCode;
    }
  }

  /**
   * Get formatted date in current locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const langCode = this.getCurrentLanguage();
    const locale = langCode === 'en' ? 'en-IN' : `${langCode}-IN`;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    
    return new Intl.DateTimeFormat(locale, options || defaultOptions).format(date);
  }

  /**
   * Get formatted currency in current locale
   */
  formatCurrency(amount: number, currency: string = 'INR'): string {
    const langCode = this.getCurrentLanguage();
    const locale = langCode === 'en' ? 'en-IN' : `${langCode}-IN`;
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Get formatted number in current locale
   */
  formatNumber(num: number): string {
    const langCode = this.getCurrentLanguage();
    const locale = langCode === 'en' ? 'en-IN' : `${langCode}-IN`;
    
    return new Intl.NumberFormat(locale).format(num);
  }
}
