import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ==================== INTERFACES ====================

export interface GeneralSettings {
  platformName: string;
  primaryEmail: string;
  supportEmail: string;
  timezone: string;
  language: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  minPasswordLength: number;
  sessionTimeout: number;
  loginAttemptLimit: number;
  requireSpecialChars: boolean;
  captchaEnabled: boolean;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  senderEmail: string;
  senderName: string;
  encryptionType: string;
}

export interface NotificationSettings {
  systemEmailAlerts: boolean;
  pushNotifications: boolean;
  orderNotifications: boolean;
  userMessageAlerts: boolean;
  soundAlerts: boolean;
  vibrationAlerts: boolean;
}

export interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  scheduledStart: string;
  scheduledEnd: string;
}

export interface PaymentSettings {
  razorpayKeyId: string;
  razorpayTestMode: boolean;
  platformCommissionPercent: number;
}

export interface SocialSettings {
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
}

export interface ContactSettings {
  contactAddress: string;
  contactPhone: string;
  contactWhatsapp: string;
}

export interface PlatformSettings {
  id?: string;
  // General
  platformName: string;
  primaryEmail: string;
  supportEmail: string;
  timezone: string;
  language: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  // Security
  twoFactorEnabled: boolean;
  minPasswordLength: number;
  sessionTimeout: number;
  loginAttemptLimit: number;
  requireSpecialChars: boolean;
  captchaEnabled: boolean;
  // Email
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  senderEmail: string;
  senderName: string;
  encryptionType: string;
  // Notifications
  systemEmailAlerts: boolean;
  pushNotifications: boolean;
  orderNotifications: boolean;
  userMessageAlerts: boolean;
  soundAlerts: boolean;
  vibrationAlerts: boolean;
  // Maintenance
  maintenanceEnabled: boolean;
  maintenanceMessage: string;
  maintenanceScheduledStart: string;
  maintenanceScheduledEnd: string;
  // Payment
  razorpayKeyId: string;
  razorpayTestMode: boolean;
  platformCommissionPercent: number;
  // Social
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  // Contact
  contactAddress: string;
  contactPhone: string;
  contactWhatsapp: string;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class PlatformSettingsService {
  private readonly apiUrl = `${environment.apiUrl}/odop/settings`;

  // State management
  private settingsSubject = new BehaviorSubject<PlatformSettings | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  settings$ = this.settingsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ==================== ALL SETTINGS ====================

  getAllSettings(): Observable<PlatformSettings> {
    this.loadingSubject.next(true);
    return this.http.get<PlatformSettings>(this.apiUrl).pipe(
      tap(settings => {
        this.settingsSubject.next(settings);
        this.loadingSubject.next(false);
      }),
      catchError(err => {
        console.error('Failed to load settings:', err);
        this.loadingSubject.next(false);
        return of(this.getDefaultSettings());
      })
    );
  }

  updateAllSettings(settings: Partial<PlatformSettings>): Observable<PlatformSettings> {
    return this.http.put<PlatformSettings>(this.apiUrl, settings).pipe(
      tap(updated => this.settingsSubject.next(updated))
    );
  }

  // ==================== GENERAL SETTINGS ====================

  getGeneralSettings(): Observable<GeneralSettings> {
    return this.http.get<GeneralSettings>(`${this.apiUrl}/general`);
  }

  updateGeneralSettings(settings: Partial<GeneralSettings>): Observable<PlatformSettings> {
    return this.http.put<PlatformSettings>(`${this.apiUrl}/general`, settings);
  }

  // ==================== SECURITY SETTINGS ====================

  getSecuritySettings(): Observable<SecuritySettings> {
    return this.http.get<SecuritySettings>(`${this.apiUrl}/security`);
  }

  updateSecuritySettings(settings: Partial<SecuritySettings>): Observable<PlatformSettings> {
    return this.http.put<PlatformSettings>(`${this.apiUrl}/security`, settings);
  }

  // ==================== EMAIL SETTINGS ====================

  getEmailSettings(): Observable<EmailSettings> {
    return this.http.get<EmailSettings>(`${this.apiUrl}/email`);
  }

  updateEmailSettings(settings: Partial<EmailSettings>): Observable<PlatformSettings> {
    return this.http.put<PlatformSettings>(`${this.apiUrl}/email`, settings);
  }

  // ==================== NOTIFICATION SETTINGS ====================

  getNotificationSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${this.apiUrl}/notifications`);
  }

  updateNotificationSettings(settings: Partial<NotificationSettings>): Observable<PlatformSettings> {
    return this.http.put<PlatformSettings>(`${this.apiUrl}/notifications`, settings);
  }

  // ==================== MAINTENANCE SETTINGS ====================

  getMaintenanceSettings(): Observable<MaintenanceSettings> {
    return this.http.get<MaintenanceSettings>(`${this.apiUrl}/maintenance`);
  }

  updateMaintenanceSettings(settings: Partial<MaintenanceSettings>): Observable<PlatformSettings> {
    return this.http.put<PlatformSettings>(`${this.apiUrl}/maintenance`, settings);
  }

  getMaintenanceStatus(): Observable<{ enabled: boolean; message: string }> {
    return this.http.get<{ enabled: boolean; message: string }>(`${this.apiUrl}/public/maintenance`);
  }

  // ==================== PAYMENT SETTINGS ====================

  getPaymentSettings(): Observable<PaymentSettings> {
    return this.http.get<PaymentSettings>(`${this.apiUrl}/payment`);
  }

  updatePaymentSettings(settings: Partial<PaymentSettings>): Observable<PlatformSettings> {
    return this.http.put<PlatformSettings>(`${this.apiUrl}/payment`, settings);
  }

  // ==================== SOCIAL SETTINGS ====================

  getSocialSettings(): Observable<SocialSettings> {
    return this.http.get<SocialSettings>(`${this.apiUrl}/social`);
  }

  updateSocialSettings(settings: Partial<SocialSettings>): Observable<PlatformSettings> {
    return this.http.put<PlatformSettings>(`${this.apiUrl}/social`, settings);
  }

  getPublicSocialSettings(): Observable<SocialSettings> {
    return this.http.get<SocialSettings>(`${this.apiUrl}/public/social`);
  }

  // ==================== CONTACT SETTINGS ====================

  getContactSettings(): Observable<ContactSettings> {
    return this.http.get<ContactSettings>(`${this.apiUrl}/contact`);
  }

  updateContactSettings(settings: Partial<ContactSettings>): Observable<PlatformSettings> {
    return this.http.put<PlatformSettings>(`${this.apiUrl}/contact`, settings);
  }

  getPublicContactSettings(): Observable<ContactSettings> {
    return this.http.get<ContactSettings>(`${this.apiUrl}/public/contact`);
  }

  // ==================== HELPERS ====================

  private getDefaultSettings(): PlatformSettings {
    return {
      platformName: 'ODOP - One District One Product',
      primaryEmail: 'admin@odop.in',
      supportEmail: 'support@odop.in',
      timezone: 'Asia/Kolkata',
      language: 'en',
      accentColor: '#FF6B00',
      logoUrl: '',
      faviconUrl: '',
      twoFactorEnabled: false,
      minPasswordLength: 8,
      sessionTimeout: 30,
      loginAttemptLimit: 5,
      requireSpecialChars: true,
      captchaEnabled: false,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUsername: '',
      senderEmail: 'noreply@odop.in',
      senderName: 'ODOP Platform',
      encryptionType: 'tls',
      systemEmailAlerts: true,
      pushNotifications: true,
      orderNotifications: true,
      userMessageAlerts: true,
      soundAlerts: false,
      vibrationAlerts: false,
      maintenanceEnabled: false,
      maintenanceMessage: 'We are currently performing scheduled maintenance.',
      maintenanceScheduledStart: '',
      maintenanceScheduledEnd: '',
      razorpayKeyId: '',
      razorpayTestMode: true,
      platformCommissionPercent: 5.0,
      facebookUrl: '',
      twitterUrl: '',
      instagramUrl: '',
      linkedinUrl: '',
      youtubeUrl: '',
      contactAddress: '',
      contactPhone: '',
      contactWhatsapp: ''
    };
  }
}
