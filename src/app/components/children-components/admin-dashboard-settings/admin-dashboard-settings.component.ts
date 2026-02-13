import { Component, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlatformSettingsService, PlatformSettings } from '../../../services/platform-settings.service';

interface GeneralSettings {
  platformName: string;
  primaryEmail: string;
  supportEmail: string;
  timezone: string;
  language: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  minPasswordLength: number;
  sessionTimeout: number;
  loginAttemptLimit: number;
  requireSpecialChars: boolean;
  captchaEnabled: boolean;
}

interface ProfileSettings {
  avatarUrl: string;
  fullName: string;
  email: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  senderEmail: string;
  senderName: string;
  encryptionType: string;
}

interface NotificationSettings {
  systemEmailAlerts: boolean;
  pushNotifications: boolean;
  orderNotifications: boolean;
  userMessageAlerts: boolean;
  soundAlerts: boolean;
  vibrationAlerts: boolean;
}

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  scheduledStart: string;
  scheduledEnd: string;
}

interface Settings {
  general: GeneralSettings;
  security: SecuritySettings;
  profile: ProfileSettings;
  email: EmailSettings;
  notifications: NotificationSettings;
  maintenance: MaintenanceSettings;
}

@Component({
  selector: 'app-admin-dashboard-settings',
  templateUrl: './admin-dashboard-settings.component.html',
  styleUrls: ['./admin-dashboard-settings.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class AdminDashboardSettingsComponent implements OnInit {
  activeTab: string = 'general';
  saving: boolean = false;
  sendingTest: boolean = false;
  showSuccessMessage: boolean = false;

  settings: Settings = {
    general: {
      platformName: 'Admin Dashboard',
      primaryEmail: 'admin@platform.com',
      supportEmail: 'support@platform.com',
      timezone: 'UTC',
      language: 'en',
      accentColor: '#FFA500',
      logoUrl: '',
      faviconUrl: ''
    },
    security: {
      twoFactorEnabled: false,
      minPasswordLength: 8,
      sessionTimeout: 30,
      loginAttemptLimit: 5,
      requireSpecialChars: true,
      captchaEnabled: false
    },
    profile: {
      avatarUrl: '',
      fullName: 'Admin User',
      email: 'admin@platform.com',
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      senderEmail: 'noreply@platform.com',
      senderName: 'Platform Admin',
      encryptionType: 'tls'
    },
    notifications: {
      systemEmailAlerts: true,
      pushNotifications: true,
      orderNotifications: true,
      userMessageAlerts: true,
      soundAlerts: false,
      vibrationAlerts: false
    },
    maintenance: {
      enabled: false,
      message: 'We are currently performing scheduled maintenance. Please check back shortly.',
      scheduledStart: '',
      scheduledEnd: ''
    }
  };

  constructor(
    private snackBar: MatSnackBar,
    private platformSettingsService: PlatformSettingsService
  ) { }

  ngOnInit(): void {
    this.loadSettings();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  async saveAllSettings(): Promise<void> {
    this.saving = true;
    
    try {
      // Save general settings
      await this.platformSettingsService.updateGeneralSettings(this.settings.general).toPromise();
      
      // Save security settings
      await this.platformSettingsService.updateSecuritySettings(this.settings.security).toPromise();
      
      // Save email settings
      await this.platformSettingsService.updateEmailSettings(this.settings.email).toPromise();
      
      // Save notification settings
      await this.platformSettingsService.updateNotificationSettings(this.settings.notifications).toPromise();
      
      // Save maintenance settings
      await this.platformSettingsService.updateMaintenanceSettings(this.settings.maintenance).toPromise();
      
      this.showSuccessMessage = true;
      this.snackBar.open('Settings saved successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      this.snackBar.open('Failed to save settings. Please try again.', 'Close', {
        duration: 4000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    } finally {
      this.saving = false;
    }
  }

  async sendTestEmail(): Promise<void> {
    this.sendingTest = true;
    
    try {
      // Simulate API call
      await this.delay(1500);
      
      // Here you would typically call your email service
      // await this.emailService.sendTestEmail(this.settings.email);
      
      // Show success message
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
      
    } catch (error) {
      console.error('Error sending test email:', error);
      // Handle error - show error message
    } finally {
      this.sendingTest = false;
    }
  }

  // File upload validation constants
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  /**
   * Validate file upload
   */
  private validateFile(file: File, maxSize: number = this.MAX_FILE_SIZE): { valid: boolean; error?: string } {
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP, or SVG).' };
    }
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit.` };
    }
    return { valid: true };
  }

  onLogoUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        this.snackBar.open(validation.error!, 'Close', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.settings.general.logoUrl = e.target.result;
        this.snackBar.open('Logo uploaded successfully!', 'Close', {
          duration: 2000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      };
      reader.readAsDataURL(file);
    }
  }

  onFaviconUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const validation = this.validateFile(file, 1 * 1024 * 1024); // 1MB for favicon
      if (!validation.valid) {
        this.snackBar.open(validation.error!, 'Close', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.settings.general.faviconUrl = e.target.result;
        this.snackBar.open('Favicon uploaded successfully!', 'Close', {
          duration: 2000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      };
      reader.readAsDataURL(file);
    }
  }

  onAvatarUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const validation = this.validateFile(file, 2 * 1024 * 1024); // 2MB for avatar
      if (!validation.valid) {
        this.snackBar.open(validation.error!, 'Close', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.settings.profile.avatarUrl = e.target.result;
        this.snackBar.open('Avatar uploaded successfully!', 'Close', {
          duration: 2000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      };
      reader.readAsDataURL(file);
    }
  }

  openPasswordDialog(): void {
    // Here you would typically open a modal or dialog for password change
    this.snackBar.open('Password change dialog coming soon!', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
    
    // Example implementation:
    // const dialogRef = this.dialog.open(PasswordChangeDialogComponent, {
    //   width: '400px',
    //   data: { currentEmail: this.settings.profile.email }
    // });
    
    // dialogRef.afterClosed().subscribe(result => {
    //   if (result) {
    //     console.log('Password changed successfully');
    //   }
    // });
  }

  private loadSettings(): void {
    // Load settings from backend API
    this.platformSettingsService.getAllSettings().subscribe({
      next: (platformSettings) => {
        // Map platform settings to component settings structure
        this.settings = {
          general: {
            platformName: platformSettings.platformName || 'Admin Dashboard',
            primaryEmail: platformSettings.primaryEmail || 'admin@platform.com',
            supportEmail: platformSettings.supportEmail || 'support@platform.com',
            timezone: platformSettings.timezone || 'UTC',
            language: platformSettings.language || 'en',
            accentColor: platformSettings.accentColor || '#FFA500',
            logoUrl: platformSettings.logoUrl || '',
            faviconUrl: platformSettings.faviconUrl || ''
          },
          security: {
            twoFactorEnabled: platformSettings.twoFactorEnabled || false,
            minPasswordLength: platformSettings.minPasswordLength || 8,
            sessionTimeout: platformSettings.sessionTimeout || 30,
            loginAttemptLimit: platformSettings.loginAttemptLimit || 5,
            requireSpecialChars: platformSettings.requireSpecialChars ?? true,
            captchaEnabled: platformSettings.captchaEnabled || false
          },
          profile: {
            avatarUrl: '',
            fullName: 'Admin User',
            email: platformSettings.primaryEmail || 'admin@platform.com',
            notifications: {
              email: platformSettings.systemEmailAlerts ?? true,
              push: platformSettings.pushNotifications ?? true,
              sms: false
            }
          },
          email: {
            smtpHost: platformSettings.smtpHost || 'smtp.gmail.com',
            smtpPort: platformSettings.smtpPort || 587,
            senderEmail: platformSettings.senderEmail || 'noreply@platform.com',
            senderName: platformSettings.senderName || 'Platform Admin',
            encryptionType: platformSettings.encryptionType || 'tls'
          },
          notifications: {
            systemEmailAlerts: platformSettings.systemEmailAlerts ?? true,
            pushNotifications: platformSettings.pushNotifications ?? true,
            orderNotifications: platformSettings.orderNotifications ?? true,
            userMessageAlerts: platformSettings.userMessageAlerts ?? true,
            soundAlerts: platformSettings.soundAlerts ?? false,
            vibrationAlerts: platformSettings.vibrationAlerts ?? false
          },
          maintenance: {
            enabled: platformSettings.maintenanceEnabled || false,
            message: platformSettings.maintenanceMessage || 'We are currently performing scheduled maintenance. Please check back shortly.',
            scheduledStart: platformSettings.maintenanceScheduledStart || '',
            scheduledEnd: platformSettings.maintenanceScheduledEnd || ''
          }
        };
      },
      error: (err) => {
        console.error('Failed to load settings:', err);
        this.snackBar.open('Failed to load settings. Using defaults.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods for form validation
  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isFormValid(): boolean {
    const { general, security, profile, email } = this.settings;
    
    return (
      general.platformName.trim() !== '' &&
      this.isEmailValid(general.primaryEmail) &&
      this.isEmailValid(general.supportEmail) &&
      security.minPasswordLength >= 6 &&
      security.sessionTimeout > 0 &&
      security.loginAttemptLimit > 0 &&
      profile.fullName.trim() !== '' &&
      this.isEmailValid(profile.email) &&
      email.smtpHost.trim() !== '' &&
      email.smtpPort > 0 &&
      this.isEmailValid(email.senderEmail) &&
      email.senderName.trim() !== ''
    );
  }

  // Method to handle color change
  onAccentColorChange(color: string): void {
    this.settings.general.accentColor = color;
    // You can also update CSS custom properties here if needed
    document.documentElement.style.setProperty('--accent-color', color);
  }

  // Method to reset settings to defaults
  resetToDefaults(): void {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      this.settings = {
        general: {
          platformName: 'Admin Dashboard',
          primaryEmail: 'admin@platform.com',
          supportEmail: 'support@platform.com',
          timezone: 'UTC',
          language: 'en',
          accentColor: '#FFA500',
          logoUrl: '',
          faviconUrl: ''
        },
        security: {
          twoFactorEnabled: false,
          minPasswordLength: 8,
          sessionTimeout: 30,
          loginAttemptLimit: 5,
          requireSpecialChars: true,
          captchaEnabled: false
        },
        profile: {
          avatarUrl: '',
          fullName: 'Admin User',
          email: 'admin@platform.com',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        },
        email: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          senderEmail: 'noreply@platform.com',
          senderName: 'Platform Admin',
          encryptionType: 'tls'
        },
        notifications: {
          systemEmailAlerts: true,
          pushNotifications: true,
          orderNotifications: true,
          userMessageAlerts: true,
          soundAlerts: false,
          vibrationAlerts: false
        },
        maintenance: {
          enabled: false,
          message: 'We are currently performing scheduled maintenance. Please check back shortly.',
          scheduledStart: '',
          scheduledEnd: ''
        }
      };
    }
  }

  // Method to export settings
  exportSettings(): void {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'admin-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // Method to import settings
  importSettings(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          this.settings = { ...this.settings, ...importedSettings };
          
          this.showSuccessMessage = true;
          setTimeout(() => {
            this.showSuccessMessage = false;
          }, 3000);
        } catch (error) {
          this.snackBar.open('Invalid settings file format.', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      };
      reader.readAsText(file);
    }
  }
}