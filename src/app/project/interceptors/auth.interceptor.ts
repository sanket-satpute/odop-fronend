import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { UserStateService } from '../services/user-state.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ReLoginDialogComponent, ReLoginDialogData } from '../../components/dialogs/re-login-dialog/re-login-dialog.component';

/**
 * HTTP Interceptor that automatically attaches JWT token to outgoing requests
 * and handles 401/403 errors.
 * 
 * KEY CHANGE: When a 401 is received with the X-Token-Expired header, instead
 * of silently logging the user out, we open a ReLoginDialog so they can
 * re-authenticate with just their password and continue where they left off.
 * 
 * WHY: Previously, the user would be silently logged out and redirected to home,
 * losing whatever they were doing. Now they get a chance to quickly re-login.
 * 
 * CONCURRENT REQUEST HANDLING: We use isRefreshing + refreshTokenSubject to ensure
 * that only ONE re-login dialog is shown even if multiple API requests fail with 401
 * at the same time. All subsequent 401s wait for the first dialog to complete.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  // List of endpoints that don't require authentication
  private publicEndpoints = [
    '/authenticate',
    '/create_account',
    '/check_customer_exists',
    '/check_admin_exists',
    '/check_vendor_exists',
    '/odop/product/get_all',
    '/odop/product/featured',
    '/odop/product/get_products_by_category',
    '/odop/product/search',
    '/odop/product/get_product_id/',
    '/odop/vendor/get_all_vendors',
    '/odop/category/get_all_categories',
    '/odop/district/get_all_districts',
    '/odop/district/get_products_by_district'
  ];

  constructor(
    private userStateService: UserStateService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip authentication for public endpoints
    if (this.isPublicEndpoint(request.url)) {
      return next.handle(request);
    }

    // Get token from user state
    const token = this.getToken();

    // If we have a token, clone the request and add the Authorization header
    if (token) {
      request = this.addTokenToRequest(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Check if this is specifically a token expiry (backend sends X-Token-Expired header)
          const isTokenExpired = error.headers?.get('X-Token-Expired') === 'true';

          if (isTokenExpired) {
            // Token expired → show re-login dialog instead of silent logout
            return this.handleTokenExpired(request, next);
          } else {
            // Generic 401 (wrong credentials, etc.) → just throw the error
            return throwError(() => error);
          }
        } else if (error.status === 403) {
          // Forbidden - user doesn't have permission
          console.warn('Access forbidden:', request.url);
          return throwError(() => error);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if the request URL is a public endpoint that doesn't need auth
   */
  private isPublicEndpoint(url: string): boolean {
    return this.publicEndpoints.some(endpoint => url.includes(endpoint));
  }

  /**
   * Get JWT token from storage
   */
  private getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      // Primary token key
      const jwt = localStorage.getItem('jwt');
      if (jwt) return jwt;

      const authToken = localStorage.getItem('auth_token');
      if (authToken) return authToken;

      // Legacy key
      const jwtToken = localStorage.getItem('jwtToken');
      if (jwtToken) return jwtToken;

      // Check user state storage keys (customer, vendor, admin)
      const customer = localStorage.getItem('customer');
      if (customer) {
        try {
          const data = JSON.parse(customer);
          if (data.token) return data.token;
        } catch { }
      }

      const vendor = localStorage.getItem('vendor');
      if (vendor) {
        try {
          const data = JSON.parse(vendor);
          if (data.token) return data.token;
        } catch { }
      }

      const admin = localStorage.getItem('admin');
      if (admin) {
        try {
          const data = JSON.parse(admin);
          if (data.token) return data.token;
        } catch { }
      }

      // Also check in alternative user state storage keys
      const customerData = localStorage.getItem('customer_data');
      if (customerData) {
        try {
          const data = JSON.parse(customerData);
          if (data.token) return data.token;
        } catch { }
      }

      const vendorData = localStorage.getItem('vendor_data');
      if (vendorData) {
        try {
          const data = JSON.parse(vendorData);
          if (data.token) return data.token;
        } catch { }
      }

      const adminData = localStorage.getItem('admin_data');
      if (adminData) {
        try {
          const data = JSON.parse(adminData);
          if (data.token) return data.token;
        } catch { }
      }
    }
    return null;
  }

  /**
   * Clone the request and add Authorization header
   */
  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Handle token expiry by showing the re-login dialog.
   * 
   * HOW IT WORKS:
   * 1. If no dialog is currently open (isRefreshing === false):
   *    - Set isRefreshing = true to prevent duplicate dialogs
   *    - Get the user's stored email and role from localStorage
   *    - Open the ReLoginDialogComponent with this data
   *    - Wait for the dialog to close
   *    - If user re-logged in successfully → retry ALL queued requests with new token
   *    - If user cancelled → logout and clear everything
   *  
   * 2. If a dialog is already open (isRefreshing === true):
   *    - This means another request already triggered the dialog
   *    - Wait for the refreshTokenSubject to emit a new token
   *    - When it does, retry this request with the new token
   * 
   * WHY THIS PATTERN:
   * Without this, if 5 API calls fail at the same time with expired token,
   * we'd get 5 re-login dialogs stacked on top of each other. This pattern
   * ensures only 1 dialog opens and all other requests wait for it.
   */
  private handleTokenExpired(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Get stored user info for the re-login dialog
      const email = this.userStateService.getStoredEmail();
      const role = this.userStateService.getStoredRole();

      if (!email || !role) {
        // No stored user info → fall back to full logout
        this.refreshTokenSubject.next('');
        this.performFullLogout();
        return throwError(() => new Error('Session expired - no stored user info'));
      }

      // Open the re-login dialog
      const dialogRef = this.dialog.open(ReLoginDialogComponent, {
        width: '440px',
        maxWidth: '95vw',
        disableClose: true, // Force user to either re-login or cancel
        data: { email, role } as ReLoginDialogData
      });

      return dialogRef.afterClosed().pipe(
        switchMap((result: any) => {
          this.isRefreshing = false;

          if (result?.success && result?.jwt) {
            // User re-logged in successfully → emit new token to retry queued requests
            this.refreshTokenSubject.next(result.jwt);
            // Retry the original failed request with the new token
            return next.handle(this.addTokenToRequest(request, result.jwt));
          } else {
            // User cancelled or dialog closed without success → they're already logged out
            // (the dialog's onCancel() calls logoutAll())
            // Emit an empty token to release queued requests and let finalize() run.
            this.refreshTokenSubject.next('');
            return EMPTY; // Don't throw error, the dialog already handled navigation
          }
        })
      );
    }

    // Another request triggered this while the dialog is open → wait for the new token
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        if (!token) {
          return EMPTY;
        }
        return next.handle(this.addTokenToRequest(request, token));
      })
    );
  }

  /**
   * Fallback: Full logout when we can't show the re-login dialog
   * (e.g., no stored email/role found)
   */
  private performFullLogout(): void {
    this.isRefreshing = false;
    this.userStateService.logoutAll();

    // Clear additional token keys
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('jwt');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('customer_data');
      localStorage.removeItem('vendor_data');
      localStorage.removeItem('admin_data');
    }

    this.router.navigate(['/']);
  }
}
