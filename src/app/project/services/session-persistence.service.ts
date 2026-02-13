import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, interval, fromEvent } from 'rxjs';
import { takeUntil, filter, debounceTime } from 'rxjs/operators';
import { UserStateService } from './user-state.service';
import { Router } from '@angular/router';

export interface SessionConfig {
  sessionTimeout: number; // in minutes
  warningTimeout: number; // minutes before session expires to show warning
  rememberMeDuration: number; // in days
  activityEvents: string[];
}

const DEFAULT_CONFIG: SessionConfig = {
  sessionTimeout: 30,
  warningTimeout: 5,
  rememberMeDuration: 30,
  activityEvents: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
};

@Injectable({
  providedIn: 'root'
})
export class SessionPersistenceService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private config: SessionConfig = DEFAULT_CONFIG;
  
  private sessionWarningSubject = new BehaviorSubject<boolean>(false);
  private sessionExpiredSubject = new BehaviorSubject<boolean>(false);
  private lastActivitySubject = new BehaviorSubject<Date>(new Date());
  
  sessionWarning$ = this.sessionWarningSubject.asObservable();
  sessionExpired$ = this.sessionExpiredSubject.asObservable();
  lastActivity$ = this.lastActivitySubject.asObservable();

  private sessionCheckInterval: any;
  private isMonitoring = false;

  constructor(
    private userStateService: UserStateService,
    private router: Router
  ) {
    this.initializeSession();
  }

  private initializeSession(): void {
    // Check for existing session on startup
    this.restoreSession();
    
    // Listen for visibility changes (tab focus)
    fromEvent(document, 'visibilitychange')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (document.visibilityState === 'visible') {
          this.validateSession();
        }
      });
  }

  /**
   * Start monitoring user activity for session timeout
   */
  startSessionMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Track user activity
    this.config.activityEvents.forEach(eventName => {
      fromEvent(document, eventName)
        .pipe(
          takeUntil(this.destroy$),
          debounceTime(1000) // Debounce to prevent excessive updates
        )
        .subscribe(() => {
          this.updateActivity();
        });
    });

    // Check session status every minute
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionStatus();
    }, 60000);

    // Initial check
    this.checkSessionStatus();
  }

  /**
   * Stop session monitoring
   */
  stopSessionMonitoring(): void {
    this.isMonitoring = false;
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
  }

  /**
   * Update last activity timestamp
   */
  private updateActivity(): void {
    const now = new Date();
    this.lastActivitySubject.next(now);
    localStorage.setItem('last_activity', now.toISOString());
    
    // Reset warning if user is active
    if (this.sessionWarningSubject.value) {
      this.sessionWarningSubject.next(false);
    }
  }

  /**
   * Check session status and trigger warnings/expiry
   */
  private checkSessionStatus(): void {
    if (!this.isLoggedIn()) return;

    const lastActivity = this.getLastActivity();
    const now = new Date();
    const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

    // Check if session has expired
    if (minutesSinceActivity >= this.config.sessionTimeout) {
      this.handleSessionExpired();
      return;
    }

    // Check if we should show warning
    const minutesUntilExpiry = this.config.sessionTimeout - minutesSinceActivity;
    if (minutesUntilExpiry <= this.config.warningTimeout && !this.sessionWarningSubject.value) {
      this.sessionWarningSubject.next(true);
    }
  }

  /**
   * Handle session expiration
   */
  private handleSessionExpired(): void {
    this.sessionExpiredSubject.next(true);
    this.stopSessionMonitoring();
    
    // Clear session data
    this.clearSession();
    
    // Redirect to login
    this.router.navigate(['/login'], {
      queryParams: { reason: 'session_expired' }
    });
  }

  /**
   * Extend the current session
   */
  extendSession(): void {
    this.updateActivity();
    this.sessionWarningSubject.next(false);
    this.sessionExpiredSubject.next(false);
  }

  /**
   * Save session with Remember Me option
   */
  saveSession(rememberMe: boolean = false): void {
    const sessionData = {
      created: new Date().toISOString(),
      rememberMe,
      expiresAt: rememberMe 
        ? new Date(Date.now() + this.config.rememberMeDuration * 24 * 60 * 60 * 1000).toISOString()
        : null
    };
    
    if (rememberMe) {
      localStorage.setItem('session_data', JSON.stringify(sessionData));
    } else {
      sessionStorage.setItem('session_data', JSON.stringify(sessionData));
    }
    
    this.updateActivity();
    this.startSessionMonitoring();
  }

  /**
   * Restore session from storage
   */
  private restoreSession(): void {
    // Check localStorage first (Remember Me)
    let sessionData = localStorage.getItem('session_data');
    let storage: Storage = localStorage;
    
    if (!sessionData) {
      sessionData = sessionStorage.getItem('session_data');
      storage = sessionStorage;
    }

    if (!sessionData) return;

    try {
      const data = JSON.parse(sessionData);
      
      // Check if remembered session has expired
      if (data.rememberMe && data.expiresAt) {
        if (new Date(data.expiresAt) < new Date()) {
          this.clearSession();
          return;
        }
      }

      // Validate stored user data exists
      if (this.isLoggedIn()) {
        this.startSessionMonitoring();
      }
    } catch (e) {
      console.error('Error restoring session:', e);
      this.clearSession();
    }
  }

  /**
   * Validate current session
   */
  validateSession(): boolean {
    if (!this.isLoggedIn()) {
      return false;
    }

    const lastActivity = this.getLastActivity();
    const now = new Date();
    const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

    // Check if session is still valid (with some grace period for Remember Me)
    const sessionData = this.getSessionData();
    if (sessionData?.rememberMe) {
      // For Remember Me, check expiry date
      if (sessionData.expiresAt && new Date(sessionData.expiresAt) < now) {
        this.handleSessionExpired();
        return false;
      }
      return true;
    }

    // For regular sessions, check activity timeout
    if (minutesSinceActivity >= this.config.sessionTimeout) {
      this.handleSessionExpired();
      return false;
    }

    return true;
  }

  /**
   * Clear all session data
   */
  clearSession(): void {
    localStorage.removeItem('session_data');
    localStorage.removeItem('last_activity');
    sessionStorage.removeItem('session_data');
    this.sessionWarningSubject.next(false);
    this.sessionExpiredSubject.next(false);
  }

  /**
   * Get last activity timestamp
   */
  private getLastActivity(): Date {
    const stored = localStorage.getItem('last_activity');
    return stored ? new Date(stored) : new Date();
  }

  /**
   * Get session data
   */
  private getSessionData(): any {
    const data = localStorage.getItem('session_data') || sessionStorage.getItem('session_data');
    return data ? JSON.parse(data) : null;
  }

  /**
   * Check if user is logged in
   */
  private isLoggedIn(): boolean {
    return !!(
      this.userStateService.customer ||
      this.userStateService.vendor ||
      this.userStateService.admin ||
      localStorage.getItem('customer') ||
      localStorage.getItem('vendor') ||
      localStorage.getItem('admin')
    );
  }

  /**
   * Get time until session expires (in minutes)
   */
  getTimeUntilExpiry(): number {
    const lastActivity = this.getLastActivity();
    const now = new Date();
    const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
    return Math.max(0, this.config.sessionTimeout - minutesSinceActivity);
  }

  /**
   * Update session configuration
   */
  updateConfig(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopSessionMonitoring();
  }
}
