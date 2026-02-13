import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

// Interfaces matching backend models
export interface NotificationChannels {
  app: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
}

export interface NotificationPreference {
  key: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: string;
  loginAlerts: boolean;
  suspiciousActivityAlerts: boolean;
  trustedDevices: number;
  lastPasswordChange: string | null;
}

export interface AppearanceSettings {
  themeMode: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  accentColor: string;
  compactMode: boolean;
  animations: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showPurchaseHistory: boolean;
  showWishlist: boolean;
  allowDataAnalytics: boolean;
  personalizedAds: boolean;
  shareDataWithPartners: boolean;
  showOnlineStatus: boolean;
  allowReviewsOnProfile: boolean;
}

export interface ConnectedService {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  externalId?: string;
  connectedAt?: string;
  lastUsed?: string;
}

export interface RegionalSettings {
  language: string;
  timezone: string;
  currency: string;
}

export interface ActiveSession {
  sessionId: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  loginTime: string;
  lastActive: string;
  current: boolean;
}

export interface CustomerPreferences {
  preferencesId: string;
  customerId: string;
  notificationChannels: NotificationChannels;
  notificationPreferences: { [key: string]: NotificationPreference };
  securitySettings: SecuritySettings;
  appearanceSettings: AppearanceSettings;
  privacySettings: PrivacySettings;
  connectedServices: ConnectedService[];
  language: string;
  timezone: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerPreferencesService {

  private baseUrl = 'http://localhost:50982/odop/customer';

  // Cached preferences
  private preferencesSubject = new BehaviorSubject<CustomerPreferences | null>(null);
  preferences$ = this.preferencesSubject.asObservable();

  // Appearance subject for real-time theme changes
  private appearanceSubject = new BehaviorSubject<AppearanceSettings | null>(null);
  appearance$ = this.appearanceSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ================================
  // Main Preferences Operations
  // ================================

  /**
   * Get all preferences for a customer
   */
  getPreferences(customerId: string): Observable<CustomerPreferences> {
    return this.http.get<CustomerPreferences>(`${this.baseUrl}/${customerId}/preferences`).pipe(
      tap(prefs => {
        this.preferencesSubject.next(prefs);
        this.appearanceSubject.next(prefs.appearanceSettings);
      }),
      catchError(this.handleError('getPreferences'))
    );
  }

  /**
   * Update all preferences
   */
  updatePreferences(customerId: string, preferences: Partial<CustomerPreferences>): Observable<CustomerPreferences> {
    return this.http.put<CustomerPreferences>(`${this.baseUrl}/${customerId}/preferences`, preferences).pipe(
      tap(prefs => this.preferencesSubject.next(prefs)),
      catchError(this.handleError('updatePreferences'))
    );
  }

  /**
   * Get cached preferences
   */
  getCachedPreferences(): CustomerPreferences | null {
    return this.preferencesSubject.getValue();
  }

  // ================================
  // Notification Channel Operations
  // ================================

  /**
   * Get notification channels
   */
  getNotificationChannels(customerId: string): Observable<NotificationChannels> {
    return this.http.get<NotificationChannels>(`${this.baseUrl}/${customerId}/preferences/notifications/channels`).pipe(
      catchError(this.handleError('getNotificationChannels'))
    );
  }

  /**
   * Update notification channels
   */
  updateNotificationChannels(customerId: string, channels: NotificationChannels): Observable<NotificationChannels> {
    return this.http.put<NotificationChannels>(`${this.baseUrl}/${customerId}/preferences/notifications/channels`, channels).pipe(
      tap(channels => {
        const current = this.preferencesSubject.getValue();
        if (current) {
          current.notificationChannels = channels;
          this.preferencesSubject.next(current);
        }
      }),
      catchError(this.handleError('updateNotificationChannels'))
    );
  }

  /**
   * Toggle specific notification channel
   */
  toggleNotificationChannel(customerId: string, channel: string, enabled: boolean): Observable<NotificationChannels> {
    return this.http.patch<NotificationChannels>(
      `${this.baseUrl}/${customerId}/preferences/notifications/channels/${channel}`,
      { enabled }
    ).pipe(
      catchError(this.handleError('toggleNotificationChannel'))
    );
  }

  // ================================
  // Notification Preferences Operations
  // ================================

  /**
   * Get notification preferences by type
   */
  getNotificationPreferences(customerId: string): Observable<{ [key: string]: NotificationPreference }> {
    return this.http.get<{ [key: string]: NotificationPreference }>(
      `${this.baseUrl}/${customerId}/preferences/notifications/preferences`
    ).pipe(
      catchError(this.handleError('getNotificationPreferences'))
    );
  }

  /**
   * Update all notification preferences
   */
  updateNotificationPreferences(customerId: string, preferences: { [key: string]: NotificationPreference }): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/${customerId}/preferences/notifications/preferences`,
      preferences
    ).pipe(
      catchError(this.handleError('updateNotificationPreferences'))
    );
  }

  /**
   * Update specific notification preference
   */
  updateNotificationPreference(customerId: string, key: string, preference: NotificationPreference): Observable<NotificationPreference> {
    return this.http.patch<NotificationPreference>(
      `${this.baseUrl}/${customerId}/preferences/notifications/preferences/${key}`,
      preference
    ).pipe(
      catchError(this.handleError('updateNotificationPreference'))
    );
  }

  // ================================
  // Security Settings Operations
  // ================================

  /**
   * Get security settings
   */
  getSecuritySettings(customerId: string): Observable<SecuritySettings> {
    return this.http.get<SecuritySettings>(`${this.baseUrl}/${customerId}/preferences/security`).pipe(
      catchError(this.handleError('getSecuritySettings'))
    );
  }

  /**
   * Update security settings
   */
  updateSecuritySettings(customerId: string, settings: Partial<SecuritySettings>): Observable<any> {
    return this.http.put(`${this.baseUrl}/${customerId}/preferences/security`, settings).pipe(
      catchError(this.handleError('updateSecuritySettings'))
    );
  }

  /**
   * Enable two-factor authentication
   */
  enableTwoFactor(customerId: string, method: string = 'authenticator'): Observable<any> {
    return this.http.post(`${this.baseUrl}/${customerId}/preferences/security/2fa/enable`, { method }).pipe(
      catchError(this.handleError('enableTwoFactor'))
    );
  }

  /**
   * Disable two-factor authentication
   */
  disableTwoFactor(customerId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${customerId}/preferences/security/2fa/disable`, {}).pipe(
      catchError(this.handleError('disableTwoFactor'))
    );
  }

  /**
   * Add trusted device
   */
  addTrustedDevice(customerId: string, deviceId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${customerId}/preferences/security/devices`, { deviceId }).pipe(
      catchError(this.handleError('addTrustedDevice'))
    );
  }

  /**
   * Remove trusted device
   */
  removeTrustedDevice(customerId: string, deviceId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${customerId}/preferences/security/devices/${deviceId}`).pipe(
      catchError(this.handleError('removeTrustedDevice'))
    );
  }

  // ================================
  // Appearance Settings Operations
  // ================================

  /**
   * Get appearance settings
   */
  getAppearanceSettings(customerId: string): Observable<AppearanceSettings> {
    return this.http.get<AppearanceSettings>(`${this.baseUrl}/${customerId}/preferences/appearance`).pipe(
      tap(settings => this.appearanceSubject.next(settings)),
      catchError(this.handleError('getAppearanceSettings'))
    );
  }

  /**
   * Update appearance settings
   */
  updateAppearanceSettings(customerId: string, settings: AppearanceSettings): Observable<AppearanceSettings> {
    return this.http.put<AppearanceSettings>(`${this.baseUrl}/${customerId}/preferences/appearance`, settings).pipe(
      tap(settings => this.appearanceSubject.next(settings)),
      catchError(this.handleError('updateAppearanceSettings'))
    );
  }

  /**
   * Set theme mode
   */
  setThemeMode(customerId: string, theme: 'light' | 'dark' | 'system'): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${customerId}/preferences/appearance/theme`, { theme }).pipe(
      tap(() => {
        const current = this.appearanceSubject.getValue();
        if (current) {
          current.themeMode = theme;
          this.appearanceSubject.next(current);
        }
      }),
      catchError(this.handleError('setThemeMode'))
    );
  }

  /**
   * Set font size
   */
  setFontSize(customerId: string, fontSize: 'small' | 'medium' | 'large'): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${customerId}/preferences/appearance/font-size`, { fontSize }).pipe(
      tap(() => {
        const current = this.appearanceSubject.getValue();
        if (current) {
          current.fontSize = fontSize;
          this.appearanceSubject.next(current);
        }
      }),
      catchError(this.handleError('setFontSize'))
    );
  }

  // ================================
  // Privacy Settings Operations
  // ================================

  /**
   * Get privacy settings
   */
  getPrivacySettings(customerId: string): Observable<PrivacySettings> {
    return this.http.get<PrivacySettings>(`${this.baseUrl}/${customerId}/preferences/privacy`).pipe(
      catchError(this.handleError('getPrivacySettings'))
    );
  }

  /**
   * Update privacy settings
   */
  updatePrivacySettings(customerId: string, settings: PrivacySettings): Observable<PrivacySettings> {
    return this.http.put<PrivacySettings>(`${this.baseUrl}/${customerId}/preferences/privacy`, settings).pipe(
      catchError(this.handleError('updatePrivacySettings'))
    );
  }

  /**
   * Set profile visibility
   */
  setProfileVisibility(customerId: string, visibility: 'public' | 'private' | 'friends'): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${customerId}/preferences/privacy/visibility`, { visibility }).pipe(
      catchError(this.handleError('setProfileVisibility'))
    );
  }

  /**
   * Toggle data analytics
   */
  toggleDataAnalytics(customerId: string, enabled: boolean): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${customerId}/preferences/privacy/analytics`, { enabled }).pipe(
      catchError(this.handleError('toggleDataAnalytics'))
    );
  }

  // ================================
  // Connected Services Operations
  // ================================

  /**
   * Get connected services
   */
  getConnectedServices(customerId: string): Observable<ConnectedService[]> {
    return this.http.get<ConnectedService[]>(`${this.baseUrl}/${customerId}/preferences/services`).pipe(
      catchError(this.handleError('getConnectedServices'))
    );
  }

  /**
   * Connect a service
   */
  connectService(customerId: string, serviceId: string, externalId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${customerId}/preferences/services/${serviceId}/connect`, { externalId }).pipe(
      catchError(this.handleError('connectService'))
    );
  }

  /**
   * Disconnect a service
   */
  disconnectService(customerId: string, serviceId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${customerId}/preferences/services/${serviceId}/disconnect`, {}).pipe(
      catchError(this.handleError('disconnectService'))
    );
  }

  // ================================
  // Regional Settings Operations
  // ================================

  /**
   * Get regional settings
   */
  getRegionalSettings(customerId: string): Observable<RegionalSettings> {
    return this.http.get<RegionalSettings>(`${this.baseUrl}/${customerId}/preferences/regional`).pipe(
      catchError(this.handleError('getRegionalSettings'))
    );
  }

  /**
   * Update regional settings
   */
  updateRegionalSettings(customerId: string, settings: Partial<RegionalSettings>): Observable<RegionalSettings> {
    return this.http.put<RegionalSettings>(`${this.baseUrl}/${customerId}/preferences/regional`, settings).pipe(
      catchError(this.handleError('updateRegionalSettings'))
    );
  }

  // ================================
  // Account Actions Operations
  // ================================

  /**
   * Get active sessions
   */
  getActiveSessions(customerId: string): Observable<ActiveSession[]> {
    return this.http.get<ActiveSession[]>(`${this.baseUrl}/${customerId}/preferences/security/sessions`).pipe(
      catchError(this.handleError('getActiveSessions'))
    );
  }

  /**
   * Export customer data
   */
  exportCustomerData(customerId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${customerId}/preferences/export`).pipe(
      catchError(this.handleError('exportCustomerData'))
    );
  }

  /**
   * Deactivate customer account
   */
  deactivateAccount(customerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${customerId}/preferences/deactivate`, {}).pipe(
      catchError(this.handleError('deactivateAccount'))
    );
  }

  // ================================
  // Helper Methods
  // ================================

  /**
   * Apply theme to DOM
   */
  applyTheme(theme: 'light' | 'dark' | 'system'): void {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      body.classList.add(`theme-${theme}`);
    }
  }

  /**
   * Apply font size to DOM
   */
  applyFontSize(size: 'small' | 'medium' | 'large'): void {
    const root = document.documentElement;
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--base-font-size', fontSizes[size]);
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): { code: string; name: string }[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'हिन्दी (Hindi)' },
      { code: 'ta', name: 'தமிழ் (Tamil)' },
      { code: 'te', name: 'తెలుగు (Telugu)' },
      { code: 'mr', name: 'मराठी (Marathi)' },
      { code: 'bn', name: 'বাংলা (Bengali)' },
      { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
      { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
      { code: 'ml', name: 'മലയാളം (Malayalam)' },
      { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
      { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' }
    ];
  }

  /**
   * Get available timezones (Indian context)
   */
  getAvailableTimezones(): { code: string; name: string }[] {
    return [
      { code: 'Asia/Kolkata', name: 'India Standard Time (IST)' },
      { code: 'UTC', name: 'Coordinated Universal Time (UTC)' }
    ];
  }

  /**
   * Get notification type display info
   */
  getNotificationTypeInfo(key: string): { icon: string; color: string } {
    const info: { [key: string]: { icon: string; color: string } } = {
      orders: { icon: 'fa-shopping-bag', color: '#4CAF50' },
      promotions: { icon: 'fa-tags', color: '#FF9800' },
      wishlist: { icon: 'fa-heart', color: '#E91E63' },
      reviews: { icon: 'fa-star', color: '#FFC107' },
      newsletter: { icon: 'fa-newspaper', color: '#2196F3' },
      security: { icon: 'fa-shield-alt', color: '#F44336' }
    };
    return info[key] || { icon: 'fa-bell', color: '#9E9E9E' };
  }

  /**
   * Error handler
   */
  private handleError(operation: string) {
    return (error: any): Observable<never> => {
      console.error(`${operation} failed:`, error);
      return throwError(() => new Error(error?.error?.error || `${operation} failed. Please try again.`));
    };
  }
}
