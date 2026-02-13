import { Component, OnInit, OnDestroy } from '@angular/core';
import { ThemeService, ThemeMode } from '../../project/services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.css']
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  currentTheme: ThemeMode = 'light';
  isDark = false;
  showMenu = false;
  
  private subscriptions: Subscription[] = [];

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.themeService.currentTheme$.subscribe(theme => {
        this.currentTheme = theme;
      }),
      this.themeService.isDark$.subscribe(isDark => {
        this.isDark = isDark;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  setTheme(theme: ThemeMode): void {
    this.themeService.setTheme(theme);
    this.showMenu = false;
  }

  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  closeMenu(): void {
    this.showMenu = false;
  }

  getThemeIcon(): string {
    if (this.currentTheme === 'system') {
      return 'fa-desktop';
    }
    return this.isDark ? 'fa-moon' : 'fa-sun';
  }

  getThemeLabel(): string {
    switch (this.currentTheme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'Light';
    }
  }
}
