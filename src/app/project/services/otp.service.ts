import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer } from 'rxjs';
import { tap, takeWhile } from 'rxjs/operators';
import { GlobalVariable } from '../global/global';

export type OtpPurpose = 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION' | 'TRANSACTION';

export interface SendOtpRequest {
  phoneNumber: string;
  purpose: OtpPurpose;
  customerId?: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  expiresIn?: number; // seconds
  attemptsRemaining?: number;
}

export interface OtpVerificationStatus {
  phoneNumber: string;
  purpose: OtpPurpose;
  verified: boolean;
  verifiedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OtpService {

  private readonly baseUrl = GlobalVariable.BASE_API_URL + 'otp';
  
  // Timer state
  private resendTimerSubject = new BehaviorSubject<number>(0);
  public resendTimer$ = this.resendTimerSubject.asObservable();
  
  private canResendSubject = new BehaviorSubject<boolean>(true);
  public canResend$ = this.canResendSubject.asObservable();

  // Verification state
  private verificationStateSubject = new BehaviorSubject<OtpVerificationStatus | null>(null);
  public verificationState$ = this.verificationStateSubject.asObservable();

  private readonly RESEND_COOLDOWN = 60; // seconds

  constructor(private http: HttpClient) { }

  // ============== SEND OTP ==============

  /**
   * Send OTP to phone number
   */
  sendOtp(request: SendOtpRequest): Observable<OtpResponse> {
    return this.http.post<OtpResponse>(`${this.baseUrl}/send`, request).pipe(
      tap(response => {
        if (response.success) {
          this.startResendTimer();
        }
      })
    );
  }

  /**
   * Resend OTP (after cooldown)
   */
  resendOtp(request: SendOtpRequest): Observable<OtpResponse> {
    return this.http.post<OtpResponse>(`${this.baseUrl}/resend`, request).pipe(
      tap(response => {
        if (response.success) {
          this.startResendTimer();
        }
      })
    );
  }

  // ============== VERIFY OTP ==============

  /**
   * Verify OTP
   */
  verifyOtp(request: VerifyOtpRequest): Observable<OtpResponse> {
    return this.http.post<OtpResponse>(`${this.baseUrl}/verify`, request).pipe(
      tap(response => {
        if (response.success) {
          this.verificationStateSubject.next({
            phoneNumber: request.phoneNumber,
            purpose: request.purpose,
            verified: true,
            verifiedAt: new Date().toISOString()
          });
        }
      })
    );
  }

  // ============== CHECK VERIFICATION ==============

  /**
   * Check if phone is verified for a purpose
   */
  checkVerificationStatus(phoneNumber: string, purpose: OtpPurpose): Observable<OtpVerificationStatus> {
    return this.http.get<OtpVerificationStatus>(
      `${this.baseUrl}/check-verified?phone=${encodeURIComponent(phoneNumber)}&purpose=${purpose}`
    ).pipe(
      tap(status => this.verificationStateSubject.next(status))
    );
  }

  // ============== HEALTH CHECK ==============

  /**
   * Check if OTP service is healthy
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // ============== TIMER MANAGEMENT ==============

  /**
   * Start resend cooldown timer
   */
  private startResendTimer(): void {
    this.canResendSubject.next(false);
    this.resendTimerSubject.next(this.RESEND_COOLDOWN);
    
    timer(0, 1000).pipe(
      takeWhile(() => this.resendTimerSubject.value > 0)
    ).subscribe(() => {
      const current = this.resendTimerSubject.value;
      if (current > 0) {
        this.resendTimerSubject.next(current - 1);
      }
      if (current <= 1) {
        this.canResendSubject.next(true);
      }
    });
  }

  /**
   * Get remaining time for resend
   */
  getResendTimeRemaining(): number {
    return this.resendTimerSubject.value;
  }

  /**
   * Check if can resend OTP
   */
  canResendOtp(): boolean {
    return this.canResendSubject.value;
  }

  // ============== STATE MANAGEMENT ==============

  /**
   * Clear verification state
   */
  clearVerificationState(): void {
    this.verificationStateSubject.next(null);
  }

  /**
   * Get current verification state
   */
  getCurrentVerificationState(): OtpVerificationStatus | null {
    return this.verificationStateSubject.value;
  }

  /**
   * Check if phone is currently verified
   */
  isPhoneVerified(phoneNumber: string, purpose: OtpPurpose): boolean {
    const state = this.verificationStateSubject.value;
    return state !== null && 
           state.phoneNumber === phoneNumber && 
           state.purpose === purpose && 
           state.verified;
  }

  // ============== HELPER METHODS ==============

  /**
   * Format phone number for display (mask middle digits)
   */
  formatPhoneForDisplay(phoneNumber: string): string {
    if (phoneNumber.length < 10) return phoneNumber;
    
    const last4 = phoneNumber.slice(-4);
    const first2 = phoneNumber.slice(0, 2);
    return `${first2}******${last4}`;
  }

  /**
   * Format timer for display (MM:SS)
   */
  formatTimerDisplay(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Validate phone number format
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    // Indian phone number: 10 digits, starts with 6-9
    const pattern = /^[6-9]\d{9}$/;
    return pattern.test(phoneNumber);
  }
}
