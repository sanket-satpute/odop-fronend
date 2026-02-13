import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentTheme = new BehaviorSubject<ThemeMode>(this.getStoredTheme());
  private isDark = new BehaviorSubject<boolean>(false);

  currentTheme$ = this.currentTheme.asObservable();
  isDark$ = this.isDark.asObservable();

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initializeTheme();
    this.listenToSystemChanges();
  }

  private getStoredTheme(): ThemeMode {
    const stored = localStorage.getItem('odop-theme') as ThemeMode;
    return stored || 'light';
  }

  private initializeTheme(): void {
    const theme = this.getStoredTheme();
    this.applyTheme(theme);
  }

  private listenToSystemChanges(): void {
    this.mediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme.value === 'system') {
        this.updateDarkMode(e.matches);
      }
    });
  }

  setTheme(theme: ThemeMode): void {
    localStorage.setItem('odop-theme', theme);
    this.currentTheme.next(theme);
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    const current = this.currentTheme.value;
    if (current === 'light') {
      this.setTheme('dark');
    } else if (current === 'dark') {
      this.setTheme('light');
    } else {
      // If system, toggle to explicit opposite
      this.setTheme(this.isDark.value ? 'light' : 'dark');
    }
  }

  private applyTheme(theme: ThemeMode): void {
    let shouldBeDark = false;

    if (theme === 'system') {
      shouldBeDark = this.mediaQuery.matches;
    } else {
      shouldBeDark = theme === 'dark';
    }

    this.updateDarkMode(shouldBeDark);
  }

  private updateDarkMode(isDark: boolean): void {
    this.isDark.next(isDark);
    
    if (isDark) {
      this.renderer.addClass(document.body, 'dark-mode');
      this.renderer.removeClass(document.body, 'light-mode');
    } else {
      this.renderer.addClass(document.body, 'light-mode');
      this.renderer.removeClass(document.body, 'dark-mode');
    }

    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#1a1a2e' : '#FFA500');
    }
  }

  getCurrentTheme(): ThemeMode {
    return this.currentTheme.value;
  }

  getIsDark(): boolean {
    return this.isDark.value;
  }
}
