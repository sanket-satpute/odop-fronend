import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interfaces
export interface SocialLoginRequest {
  provider: 'GOOGLE' | 'FACEBOOK';
  idToken: string;
  accessToken?: string;
  deviceId?: string;
}

export interface SocialLoginResponse {
  token: string;
  user: any;
  userType: string;
  newUser: boolean;
  requiresPhone: boolean;
  message: string;
}

export interface LinkedAccount {
  provider: string;
  email: string;
  name: string;
  pictureUrl: string;
  linkedAt: string;
}

// Declare Google and Facebook SDK types
declare const google: any;
declare const FB: any;

@Injectable({
  providedIn: 'root'
})
export class SocialAuthService {
  private apiUrl = `${environment.apiUrl}/odop/auth/social`;
  
  // State
  private googleInitialized = false;
  private facebookInitialized = false;
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeSocialSDKs();
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize social login SDKs
   */
  private initializeSocialSDKs(): void {
    this.initializeGoogle();
    this.initializeFacebook();
  }

  /**
   * Initialize Google Sign-In
   */
  private initializeGoogle(): void {
    // Load Google SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.googleInitialized = true;
      console.log('Google SDK loaded');
    };
    document.head.appendChild(script);
  }

  /**
   * Initialize Facebook SDK
   */
  private initializeFacebook(): void {
    // Load Facebook SDK
    (window as any).fbAsyncInit = () => {
      FB.init({
        appId: environment.facebookAppId || '',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      this.facebookInitialized = true;
      console.log('Facebook SDK loaded');
    };

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  // ==================== GOOGLE LOGIN ====================

  /**
   * Sign in with Google
   */
  signInWithGoogle(): Observable<SocialLoginResponse> {
    this.loadingSubject.next(true);

    return from(this.getGoogleToken()).pipe(
      switchMap(idToken => {
        const request: SocialLoginRequest = {
          provider: 'GOOGLE',
          idToken: idToken,
          deviceId: this.getDeviceId()
        };
        return this.socialLogin(request);
      }),
      tap({
        next: () => this.loadingSubject.next(false),
        error: () => this.loadingSubject.next(false)
      })
    );
  }

  /**
   * Get Google ID token using new Google Identity Services
   */
  private getGoogleToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.googleInitialized) {
        reject(new Error('Google SDK not initialized'));
        return;
      }

      google.accounts.id.initialize({
        client_id: environment.googleClientId || '',
        callback: (response: any) => {
          if (response.credential) {
            resolve(response.credential);
          } else {
            reject(new Error('No credential received'));
          }
        }
      });

      // Prompt for sign in
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fall back to button click or show error
          this.showGoogleOneTap();
        }
      });
    });
  }

  /**
   * Show Google One Tap prompt
   */
  private showGoogleOneTap(): void {
    google.accounts.id.prompt();
  }

  /**
   * Render Google Sign-In button
   */
  renderGoogleButton(elementId: string): void {
    if (!this.googleInitialized) {
      setTimeout(() => this.renderGoogleButton(elementId), 500);
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId || '',
      callback: (response: any) => this.handleGoogleCallback(response)
    });

    google.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with',
        logo_alignment: 'center'
      }
    );
  }

  private handleGoogleCallback(response: any): void {
    if (response.credential) {
      const request: SocialLoginRequest = {
        provider: 'GOOGLE',
        idToken: response.credential,
        deviceId: this.getDeviceId()
      };
      this.socialLogin(request).subscribe({
        next: (res) => {
          this.handleLoginSuccess(res);
        },
        error: (err) => {
          console.error('Google login error:', err);
        }
      });
    }
  }

  // ==================== FACEBOOK LOGIN ====================

  /**
   * Sign in with Facebook
   */
  signInWithFacebook(): Observable<SocialLoginResponse> {
    this.loadingSubject.next(true);

    return from(this.getFacebookToken()).pipe(
      switchMap(accessToken => {
        const request: SocialLoginRequest = {
          provider: 'FACEBOOK',
          idToken: accessToken,
          accessToken: accessToken,
          deviceId: this.getDeviceId()
        };
        return this.socialLogin(request);
      }),
      tap({
        next: () => this.loadingSubject.next(false),
        error: () => this.loadingSubject.next(false)
      })
    );
  }

  /**
   * Get Facebook access token
   */
  private getFacebookToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.facebookInitialized) {
        reject(new Error('Facebook SDK not initialized'));
        return;
      }

      FB.login((response: any) => {
        if (response.authResponse) {
          resolve(response.authResponse.accessToken);
        } else {
          reject(new Error('Facebook login cancelled or failed'));
        }
      }, { scope: 'email,public_profile' });
    });
  }

  /**
   * Check Facebook login status
   */
  checkFacebookStatus(): Promise<any> {
    return new Promise((resolve) => {
      if (!this.facebookInitialized) {
        resolve(null);
        return;
      }

      FB.getLoginStatus((response: any) => {
        resolve(response);
      });
    });
  }

  /**
   * Facebook logout
   */
  facebookLogout(): void {
    if (this.facebookInitialized) {
      FB.logout();
    }
  }

  // ==================== API CALLS ====================

  /**
   * Social login API call
   */
  socialLogin(request: SocialLoginRequest): Observable<SocialLoginResponse> {
    return this.http.post<SocialLoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        if (response.token) {
          this.storeAuthData(response);
        }
      })
    );
  }

  /**
   * Get linked social accounts
   */
  getLinkedAccounts(userId: string): Observable<LinkedAccount[]> {
    return this.http.get<LinkedAccount[]>(`${this.apiUrl}/linked/${userId}`);
  }

  /**
   * Link additional social account
   */
  linkAccount(userId: string, request: SocialLoginRequest): Observable<SocialLoginResponse> {
    return this.http.post<SocialLoginResponse>(`${this.apiUrl}/link/${userId}`, request);
  }

  /**
   * Unlink social account
   */
  unlinkAccount(userId: string, provider: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/unlink/${userId}/${provider}`
    );
  }

  /**
   * Link Google account to existing user
   */
  linkGoogleAccount(userId: string): Observable<SocialLoginResponse> {
    return from(this.getGoogleToken()).pipe(
      switchMap(idToken => {
        const request: SocialLoginRequest = {
          provider: 'GOOGLE',
          idToken: idToken
        };
        return this.linkAccount(userId, request);
      })
    );
  }

  /**
   * Link Facebook account to existing user
   */
  linkFacebookAccount(userId: string): Observable<SocialLoginResponse> {
    return from(this.getFacebookToken()).pipe(
      switchMap(accessToken => {
        const request: SocialLoginRequest = {
          provider: 'FACEBOOK',
          idToken: accessToken,
          accessToken: accessToken
        };
        return this.linkAccount(userId, request);
      })
    );
  }

  // ==================== HELPER METHODS ====================

  /**
   * Store authentication data
   */
  private storeAuthData(response: SocialLoginResponse): void {
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('user_type', response.userType);
  }

  /**
   * Handle successful login
   */
  private handleLoginSuccess(response: SocialLoginResponse): void {
    if (response.token) {
      this.storeAuthData(response);
      
      // Redirect based on user type and status
      if (response.newUser || response.requiresPhone) {
        // Redirect to complete profile
        window.location.href = '/complete-profile';
      } else {
        // Redirect to dashboard
        window.location.href = response.userType === 'CUSTOMER' ? '/customer/dashboard' : '/vendor/dashboard';
      }
    }
  }

  /**
   * Get or generate device ID
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'web_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Check if Google SDK is ready
   */
  isGoogleReady(): boolean {
    return this.googleInitialized;
  }

  /**
   * Check if Facebook SDK is ready
   */
  isFacebookReady(): boolean {
    return this.facebookInitialized;
  }

  /**
   * Get provider icon
   */
  getProviderIcon(provider: string): string {
    const icons: { [key: string]: string } = {
      GOOGLE: 'assets/icons/google-icon.svg',
      FACEBOOK: 'assets/icons/facebook-icon.svg'
    };
    return icons[provider] || '';
  }

  /**
   * Get provider color
   */
  getProviderColor(provider: string): string {
    const colors: { [key: string]: string } = {
      GOOGLE: '#4285F4',
      FACEBOOK: '#1877F2'
    };
    return colors[provider] || '#000';
  }
}
