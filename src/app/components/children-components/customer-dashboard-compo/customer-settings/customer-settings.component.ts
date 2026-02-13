import { Component, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomerPreferencesService, NotificationChannels, ConnectedService, AppearanceSettings, SecuritySettings, ActiveSession } from '../../../../services/customer-preferences.service';
import { UserStateService } from '../../../../project/services/user-state.service';

// setting's
interface NotificationSettings {
  app: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

@Component({
  selector: 'app-customer-settings',
  templateUrl: './customer-settings.component.html',
  styleUrls: ['./customer-settings.component.css']
})
export class CustomerSettingsComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private customerId: string = '';
  
  // Loading states
  isLoading: boolean = false;
  loadError: string = '';
  isSaving: boolean = false;

  // variables
  notificationSettings: NotificationSettings = {
    app: true,
    email: true,
    sms: false,
    whatsapp: true
  };

  // Security settings
  twoFactorEnabled: boolean = false;

  // Appearance settings
  themeMode: 'light' | 'dark' | 'system' = 'light';
  fontSize: 'small' | 'medium' | 'large' = 'medium';
  highContrast: boolean = false;

  // Connected services
  connectedServices: ConnectedService[] = [];

  // Track changes
  hasChanges: boolean = false;

  // Original settings for comparison
  private originalSettings: any = {};

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    private preferencesService: CustomerPreferencesService,
    private userState: UserStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.customerId = this.userState.customer?.customerId || '';
    if (this.customerId) {
      this.loadPreferences();
    } else {
      this.loadDefaultSettings();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load preferences from API
   */
  private loadPreferences(): void {
    this.isLoading = true;
    this.loadError = '';

    this.preferencesService.getPreferences(this.customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prefs) => {
          // Map notification channels
          this.notificationSettings = {
            app: prefs.notificationChannels.app,
            email: prefs.notificationChannels.email,
            sms: prefs.notificationChannels.sms,
            whatsapp: prefs.notificationChannels.whatsapp
          };

          // Map security settings
          this.twoFactorEnabled = prefs.securitySettings?.twoFactorEnabled || false;

          // Map appearance settings
          this.themeMode = prefs.appearanceSettings?.themeMode || 'light';
          this.fontSize = prefs.appearanceSettings?.fontSize || 'medium';
          this.highContrast = prefs.appearanceSettings?.highContrast || false;

          // Map connected services
          this.connectedServices = prefs.connectedServices || [];

          // Apply appearance settings
          this.preferencesService.applyTheme(this.themeMode);
          this.preferencesService.applyFontSize(this.fontSize);

          this.saveOriginalSettings();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load preferences:', error);
          this.loadError = 'Failed to load settings';
          this.loadDefaultSettings();
          this.isLoading = false;
        }
      });
  }

  /**
   * Load default settings when API fails
   */
  private loadDefaultSettings(): void {
    this.connectedServices = [
      { id: 'aadhaar', name: 'Aadhaar', icon: 'aadhaar-icon', connected: false },
      { id: 'digilocker', name: 'DigiLocker', icon: 'digilocker-icon', connected: false },
      { id: 'umang', name: 'UMANG', icon: 'umang-icon', connected: false },
      { id: 'cowin', name: 'CoWIN', icon: 'cowin-icon', connected: false },
      { id: 'google', name: 'Google', icon: 'fa-google', connected: false },
      { id: 'facebook', name: 'Facebook', icon: 'fa-facebook-f', connected: false }
    ];
    this.saveOriginalSettings();
  }

  // normal methods
   private saveOriginalSettings(): void {
    this.originalSettings = {
      notifications: { ...this.notificationSettings },
      twoFactor: this.twoFactorEnabled,
      themeMode: this.themeMode,
      fontSize: this.fontSize,
      highContrast: this.highContrast,
      services: this.connectedServices.map(s => ({ ...s }))
    };
  }

  /**
   * Check if settings have changed
   */
  private checkForChanges(): void {
    const currentSettings = {
      notifications: { ...this.notificationSettings },
      twoFactor: this.twoFactorEnabled,
      themeMode: this.themeMode,
      fontSize: this.fontSize,
      highContrast: this.highContrast,
      services: this.connectedServices.map(s => ({ ...s }))
    };

    this.hasChanges = JSON.stringify(currentSettings) !== JSON.stringify(this.originalSettings);
  }

  /**
   * Toggle notification setting
   */
  toggleNotification(type: keyof NotificationSettings): void {
    this.notificationSettings[type] = !this.notificationSettings[type];
    this.checkForChanges();
    this.showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} notifications ${this.notificationSettings[type] ? 'enabled' : 'disabled'}`);
  }

  /**
   * Toggle two-factor authentication
   */
  toggleTwoFactor(): void {
    if (this.twoFactorEnabled) {
      this.confirmAction('Disable Two-Factor Authentication', 'Are you sure you want to disable 2FA? This will make your account less secure.')
        .then(() => {
          this.twoFactorEnabled = false;
          this.checkForChanges();
          this.showToast('Two-Factor Authentication disabled');
        });
    } else {
      this.twoFactorEnabled = true;
      this.checkForChanges();
      this.showToast('Two-Factor Authentication enabled');
      // In a real app, you would show a setup modal here
    }
  }

  /**
   * View active sessions
   */
  viewActiveSessions(): void {
    if (!this.customerId) {
      this.showToast('Please sign in to view active sessions', 'error');
      return;
    }

    this.preferencesService.getActiveSessions(this.customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sessions: ActiveSession[]) => {
          if (!sessions || sessions.length === 0) {
            this.showToast('No active sessions found');
            return;
          }

          const sessionSummary = sessions
            .slice(0, 5)
            .map((s, i) => `${i + 1}. ${s.deviceName || 'Unknown Device'} (${s.ipAddress || 'N/A'})${s.current ? ' [Current]' : ''}`)
            .join('\n');

          alert(`Active Sessions (${sessions.length})\n\n${sessionSummary}`);
        },
        error: () => {
          this.showToast('Failed to fetch active sessions', 'error');
        }
      });
  }

  /**
   * Download user data
   */
  downloadData(): void {
    if (!this.customerId) {
      this.showToast('Please sign in to download your data', 'error');
      return;
    }

    this.preferencesService.exportCustomerData(this.customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const fileName = `odop-customer-data-${this.customerId}-${new Date().toISOString().split('T')[0]}.json`;
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const link = this.document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          window.URL.revokeObjectURL(url);
          this.showToast('Your data export is ready', 'success');
        },
        error: () => {
          this.showToast('Failed to download data', 'error');
        }
      });
  }

  /**
   * Deactivate account
   */
  deactivateAccount(): void {
    this.confirmAction(
      'Deactivate Account', 
      'This action cannot be undone. Your account and all associated data will be permanently deleted.'
    ).then(() => {
      if (!this.customerId) {
        this.showToast('Please sign in to manage account status', 'error');
        return;
      }

      this.preferencesService.deactivateAccount(this.customerId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showToast('Account deactivated successfully', 'success');
            this.router.navigate(['/login']);
          },
          error: () => {
            this.showToast('Failed to deactivate account', 'error');
          }
        });
    });
  }

  /**
   * Set theme mode
   */
  setThemeMode(mode: 'light' | 'dark' | 'system'): void {
    this.themeMode = mode;
    this.checkForChanges();
    this.showToast(`Theme set to ${mode}`);
    
    // Remove existing theme classes
    this.renderer.removeClass(this.document.body, 'theme-light');
    this.renderer.removeClass(this.document.body, 'theme-dark');
    
    if (mode === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.renderer.addClass(this.document.body, prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      this.renderer.addClass(this.document.body, `theme-${mode}`);
    }
  }

  /**
   * Set font size
   */
  setFontSize(size: 'small' | 'medium' | 'large'): void {
    this.fontSize = size;
    this.checkForChanges();
    this.showToast(`Font size set to ${size}`);
    
    // Apply font size to document root using Renderer2
    const fontSizeMap = { small: '14px', medium: '16px', large: '18px' };
    this.renderer.setStyle(this.document.documentElement, 'fontSize', fontSizeMap[size]);
  }

  /**
   * Toggle high contrast mode
   */
  toggleHighContrast(): void {
    this.highContrast = !this.highContrast;
    this.checkForChanges();
    this.showToast(`High contrast mode ${this.highContrast ? 'enabled' : 'disabled'}`);
    
    // Apply high contrast to document body using Renderer2
    if (this.highContrast) {
      this.renderer.addClass(this.document.body, 'high-contrast');
    } else {
      this.renderer.removeClass(this.document.body, 'high-contrast');
    }
  }

  /**
   * Toggle connected service
   */
  toggleService(service: ConnectedService): void {
    const action = service.connected ? 'disconnect' : 'connect';
    const message = `Are you sure you want to ${action} ${service.name}?`;
    
    this.confirmAction(`${action.charAt(0).toUpperCase() + action.slice(1)} Service`, message)
      .then(() => {
        if (this.customerId) {
          // Use API to toggle service
          if (service.connected) {
            this.preferencesService.disconnectService(this.customerId, service.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  service.connected = false;
                  this.checkForChanges();
                  this.showToast(`${service.name} disconnected`);
                },
                error: (error) => {
                  this.showToast(`Failed to disconnect ${service.name}`, 'error');
                }
              });
          } else {
            // In real app, this would redirect to OAuth or show modal for external ID
            const externalId = `ext_${Date.now()}`;
            this.preferencesService.connectService(this.customerId, service.id, externalId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  service.connected = true;
                  this.checkForChanges();
                  this.showToast(`${service.name} connected`);
                },
                error: (error) => {
                  this.showToast(`Failed to connect ${service.name}`, 'error');
                }
              });
          }
        } else {
          // Local fallback
          service.connected = !service.connected;
          this.checkForChanges();
          this.showToast(`${service.name} ${service.connected ? 'connected' : 'disconnected'}`);
        }
      });
  }

  /**
   * Save all changes
   */
  async saveChanges(): Promise<void> {
    if (!this.hasChanges) {
      this.showToast('No changes to save');
      return;
    }

    this.isSaving = true;
    const saveButton = document.querySelector('.save-btn') as HTMLButtonElement;
    if (saveButton) {
      saveButton.classList.add('loading');
    }

    try {
      if (this.customerId) {
        // Save to API
        await this.saveSettingsToAPI();
      }
      
      // Update original settings
      this.saveOriginalSettings();
      this.hasChanges = false;
      
      this.showToast('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showToast('Failed to save settings. Please try again.', 'error');
    } finally {
      this.isSaving = false;
      if (saveButton) {
        saveButton.classList.remove('loading');
      }
    }
  }

  /**
   * Save settings to API
   */
  private async saveSettingsToAPI(): Promise<void> {
    // Update notification channels
    const channels: NotificationChannels = {
      app: this.notificationSettings.app,
      email: this.notificationSettings.email,
      sms: this.notificationSettings.sms,
      whatsapp: this.notificationSettings.whatsapp,
      push: true
    };

    await this.preferencesService.updateNotificationChannels(this.customerId, channels).toPromise();

    // Update appearance settings
    const appearance: AppearanceSettings = {
      themeMode: this.themeMode,
      fontSize: this.fontSize,
      highContrast: this.highContrast,
      accentColor: '#FF6B35',
      compactMode: false,
      animations: true
    };

    await this.preferencesService.updateAppearanceSettings(this.customerId, appearance).toPromise();

    // Update security settings (2FA toggle)
    if (this.twoFactorEnabled !== this.originalSettings.twoFactor) {
      if (this.twoFactorEnabled) {
        await this.preferencesService.enableTwoFactor(this.customerId).toPromise();
      } else {
        await this.preferencesService.disableTwoFactor(this.customerId).toPromise();
      }
    }
  }

  /**
   * Save settings to backend (deprecated - use saveSettingsToAPI)
   */
  private async saveSettingsToBackend(): Promise<void> {
    return this.saveSettingsToAPI();
  }

  /**
   * Show confirmation dialog using browser confirm (can be replaced with MatDialog)
   */
  private confirmAction(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const result = window.confirm(`${title}\n\n${message}`);
      resolve(result);
    });
  }

  /**
   * Show toast notification using MatSnackBar
   */
  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const panelClass = type === 'error' ? ['error-snackbar'] : 
                       type === 'success' ? ['success-snackbar'] : [];
    
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: panelClass
    });
  }

  /**
   * Utility function to create delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle keyboard events for accessibility
   */
  onKeyDown(event: KeyboardEvent, action: () => void): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }

  getServiceIconType(service: ConnectedService): 'font' | 'text' {
    return service.icon?.startsWith('fa-') ? 'font' : 'text';
  }

  getServiceTextIcon(service: ConnectedService): string {
    return (service.name || '?').substring(0, 1).toUpperCase();
  }
}
