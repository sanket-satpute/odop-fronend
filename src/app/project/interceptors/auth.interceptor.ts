import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { UserStateService } from '../services/user-state.service';
import { Router } from '@angular/router';

/**
 * HTTP Interceptor that automatically attaches JWT token to outgoing requests
 * and handles 401/403 errors
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

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
    private router: Router
  ) {}

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
          // Token expired or invalid - redirect to login
          return this.handle401Error(request, next);
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
    // Try to get token from localStorage
    if (typeof localStorage !== 'undefined') {
      // Check primary token keys
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
        } catch {}
      }

      const vendor = localStorage.getItem('vendor');
      if (vendor) {
        try {
          const data = JSON.parse(vendor);
          if (data.token) return data.token;
        } catch {}
      }

      const admin = localStorage.getItem('admin');
      if (admin) {
        try {
          const data = JSON.parse(admin);
          if (data.token) return data.token;
        } catch {}
      }

      // Also check in alternative user state storage keys
      const customerData = localStorage.getItem('customer_data');
      if (customerData) {
        try {
          const data = JSON.parse(customerData);
          if (data.token) return data.token;
        } catch {}
      }

      const vendorData = localStorage.getItem('vendor_data');
      if (vendorData) {
        try {
          const data = JSON.parse(vendorData);
          if (data.token) return data.token;
        } catch {}
      }

      const adminData = localStorage.getItem('admin_data');
      if (adminData) {
        try {
          const data = JSON.parse(adminData);
          if (data.token) return data.token;
        } catch {}
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
   * Handle 401 Unauthorized errors
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // For now, just logout and redirect to home
      // In the future, you could implement token refresh here
      console.warn('Session expired, redirecting to login...');
      
      // Clear user state
      this.userStateService.logoutAll();
      
      // Clear tokens
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('jwt');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('customer');
        localStorage.removeItem('vendor');
        localStorage.removeItem('admin');
        localStorage.removeItem('customer_data');
        localStorage.removeItem('vendor_data');
        localStorage.removeItem('admin_data');
      }
      
      // Redirect to home
      this.router.navigate(['/']);
      
      this.isRefreshing = false;
      return throwError(() => new Error('Session expired'));
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token != null),
      take(1),
      switchMap(token => next.handle(this.addTokenToRequest(request, token)))
    );
  }
}
