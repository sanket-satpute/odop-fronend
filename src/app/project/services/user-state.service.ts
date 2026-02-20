// src/app/services/user-state.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, fromEvent } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Customer } from '../models/customer';
import { Vendor } from '../models/vendor';
import { Admin } from '../models/admin';

@Injectable({
  providedIn: 'root'
})
export class UserStateService implements OnDestroy {
  private destroy$ = new Subject<void>();

  private customerSubject = new BehaviorSubject<Customer | null>(null);
  private vendorSubject = new BehaviorSubject<Vendor | null>(null);
  private adminSubject = new BehaviorSubject<Admin | null>(null);

  // Cart and Wishlist sync subjects
  private cartCountSubject = new BehaviorSubject<number>(0);
  private wishlistCountSubject = new BehaviorSubject<number>(0);

  customer$ = this.customerSubject.asObservable();
  vendor$ = this.vendorSubject.asObservable();
  admin$ = this.adminSubject.asObservable();

  // Observables for cart/wishlist counts
  cartCount$ = this.cartCountSubject.asObservable();
  wishlistCount$ = this.wishlistCountSubject.asObservable();

  constructor() {
    // Listen for storage events from other tabs
    this.initStorageListener();
  }

  private initStorageListener(): void {
    fromEvent<StorageEvent>(window, 'storage')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (!event.key) return;

        switch (event.key) {
          case 'customer':
            this.handleCustomerStorageChange(event.newValue);
            break;
          case 'vendor':
            this.handleVendorStorageChange(event.newValue);
            break;
          case 'admin':
            this.handleAdminStorageChange(event.newValue);
            break;
          case 'cart_update':
          case 'wishlist_update':
            this.handleCartWishlistUpdate(event.key, event.newValue);
            break;
          case 'logout_event':
            // Handle logout from another tab
            this.logoutAll(false); // false = don't broadcast again
            break;
        }
      });
  }

  private handleCustomerStorageChange(newValue: string | null): void {
    if (newValue) {
      try {
        const customer = JSON.parse(newValue);
        this.customerSubject.next(customer);
        this.updateCartWishlistCounts(customer);
      } catch (e) {
        console.error('Error parsing customer from storage:', e);
      }
    } else {
      this.customerSubject.next(null);
      this.cartCountSubject.next(0);
      this.wishlistCountSubject.next(0);
    }
  }

  private handleVendorStorageChange(newValue: string | null): void {
    if (newValue) {
      try {
        const vendor = JSON.parse(newValue);
        this.vendorSubject.next(vendor);
      } catch (e) {
        console.error('Error parsing vendor from storage:', e);
      }
    } else {
      this.vendorSubject.next(null);
    }
  }

  private handleAdminStorageChange(newValue: string | null): void {
    if (newValue) {
      try {
        const admin = JSON.parse(newValue);
        this.adminSubject.next(admin);
      } catch (e) {
        console.error('Error parsing admin from storage:', e);
      }
    } else {
      this.adminSubject.next(null);
    }
  }

  private handleCartWishlistUpdate(key: string, value: string | null): void {
    if (!value) return;
    try {
      const data = JSON.parse(value);
      if (key === 'cart_update') {
        this.cartCountSubject.next(data.count || 0);
        // Update customer object if available and trigger change detection
        if (this.customer && data.items) {
          this.customer.cartProductIds = data.items;
          this.customerSubject.next(this.customer);
        }
      } else if (key === 'wishlist_update') {
        this.wishlistCountSubject.next(data.count || 0);
        // Update customer object if available and trigger change detection
        if (this.customer && data.items) {
          this.customer.wishlistProductIds = data.items;
          this.customerSubject.next(this.customer);
        }
      }
    } catch (e) {
      console.error('Error parsing cart/wishlist update:', e);
    }
  }

  private updateCartWishlistCounts(customer: Customer): void {
    this.cartCountSubject.next(customer.cartProductIds?.length || 0);
    this.wishlistCountSubject.next(customer.wishlistProductIds?.length || 0);
  }

  get customer(): Customer | null {
    return this.customerSubject.value;
  }

  set customer(value: Customer | null) {
    this.customerSubject.next(value);
    if (value) {
      this.saveUserToStorage(value);
      this.updateCartWishlistCounts(value);
    } else {
      this.cartCountSubject.next(0);
      this.wishlistCountSubject.next(0);
    }
  }

  get vendor(): Vendor | null {
    return this.vendorSubject.value;
  }

  set vendor(value: Vendor | null) {
    this.vendorSubject.next(value);
    if (value) {
      this.saveUserToStorage(value);
    }
  }

  get admin(): Admin | null {
    return this.adminSubject.value;
  }

  set admin(value: Admin | null) {
    this.adminSubject.next(value);
    if (value) {
      this.saveUserToStorage(value);
    }
  }

  // Broadcast cart update to other tabs
  broadcastCartUpdate(cartItems: string[]): void {
    const updateData = {
      count: cartItems.length,
      items: cartItems,
      timestamp: Date.now()
    };
    localStorage.setItem('cart_update', JSON.stringify(updateData));
    this.cartCountSubject.next(cartItems.length);

    // Update customer object AND trigger change detection
    if (this.customer) {
      this.customer.cartProductIds = cartItems;
      this.customerSubject.next(this.customer); // Emit new value to trigger UI update
      this.saveUserToStorage(this.customer);
    }
  }

  // Broadcast wishlist update to other tabs
  broadcastWishlistUpdate(wishlistItems: string[]): void {
    const updateData = {
      count: wishlistItems.length,
      items: wishlistItems,
      timestamp: Date.now()
    };
    localStorage.setItem('wishlist_update', JSON.stringify(updateData));
    this.wishlistCountSubject.next(wishlistItems.length);

    // Update customer object AND trigger change detection
    if (this.customer) {
      this.customer.wishlistProductIds = wishlistItems;
      this.customerSubject.next(this.customer); // Emit new value to trigger UI update
      this.saveUserToStorage(this.customer);
    }
  }

  logoutAll(broadcast: boolean = true) {
    // Broadcast logout to other tabs first
    if (broadcast) {
      localStorage.setItem('logout_event', Date.now().toString());
    }

    // Clear all user data from localStorage
    localStorage.removeItem('customer');
    localStorage.removeItem('vendor');
    localStorage.removeItem('admin');
    localStorage.removeItem('jwt');
    localStorage.removeItem('cart_update');
    localStorage.removeItem('wishlist_update');

    // Then clear the subjects
    this.customerSubject.next(null);
    this.vendorSubject.next(null);
    this.adminSubject.next(null);
    this.cartCountSubject.next(0);
    this.wishlistCountSubject.next(0);
  }

  saveUserToStorage(user: Customer | Vendor | Admin | null) {
    if (!user) {
      console.warn('No user to save to storage');
      return;
    }
    if ('customerId' in user) {
      localStorage.setItem('customer', JSON.stringify(user));
    } else if ('vendorId' in user) {
      localStorage.setItem('vendor', JSON.stringify(user));
    } else if ('adminId' in user) {
      localStorage.setItem('admin', JSON.stringify(user));
    }
  }

  loadUserFromStorage() {
    // Load user if saved
    const storedCustomer = localStorage.getItem('customer');
    const storedVendor = localStorage.getItem('vendor');
    const storedAdmin = localStorage.getItem('admin');

    if (storedCustomer) {
      try {
        const customer = JSON.parse(storedCustomer);
        this.customerSubject.next(customer);
        this.updateCartWishlistCounts(customer);
      } catch (e) {
        localStorage.removeItem('customer');
      }
    } else if (storedVendor) {
      try {
        const vendor = JSON.parse(storedVendor);
        this.vendorSubject.next(vendor);
      } catch (e) {
        localStorage.removeItem('vendor');
      }
    } else if (storedAdmin) {
      try {
        const admin = JSON.parse(storedAdmin);
        this.adminSubject.next(admin);
      } catch (e) {
        localStorage.removeItem('admin');
      }
    }
  }

  // Check if any user is logged in
  isLoggedIn(): boolean {
    return !!(this.customer || this.vendor || this.admin);
  }

  // Get current user type
  getUserType(): 'customer' | 'vendor' | 'admin' | null {
    if (this.customer) return 'customer';
    if (this.vendor) return 'vendor';
    if (this.admin) return 'admin';
    return null;
  }

  // Get current user (regardless of type)
  getCurrentUser(): Customer | Vendor | Admin | null {
    return this.customer || this.vendor || this.admin;
  }

  /**
   * Check if the JWT token stored in localStorage is expired.
   * 
   * HOW IT WORKS:
   * A JWT token has 3 parts separated by dots: header.payload.signature
   * The payload (middle part) is a Base64-encoded JSON that contains an "exp" field
   * — the expiration time as a Unix timestamp (seconds since epoch).
   * We decode it, multiply by 1000 (to convert to milliseconds), and compare with Date.now().
   * 
   * WHY NO API CALL:
   * We can check expiry entirely on the client side because the expiration is embedded
   * in the token itself. No need to call the server just to check if it's expired.
   * 
   * RETURNS: true if expired or invalid, false if valid or no token exists
   */
  isTokenExpired(): boolean {
    const token = localStorage.getItem('jwt');
    if (!token) return false; // No token = user was never logged in, not an expiry issue
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      const expirationMs = payload.exp * 1000; // Convert seconds to milliseconds
      return expirationMs < Date.now();
    } catch {
      // If we can't decode the token, treat it as expired/invalid
      return true;
    }
  }

  /**
   * Get the email of the last logged-in user from localStorage.
   * 
   * WHY: When showing the re-login dialog, we need to pre-fill the email field
   * so the user doesn't have to type it again. The email is stored in the user
   * object (customer/vendor/admin) in localStorage.
   * 
   * RETURNS: The email string, or null if no user is stored.
   */
  getStoredEmail(): string | null {
    const storedCustomer = localStorage.getItem('customer');
    if (storedCustomer) {
      try { return JSON.parse(storedCustomer).emailAddress || null; } catch { return null; }
    }
    const storedVendor = localStorage.getItem('vendor');
    if (storedVendor) {
      try { return JSON.parse(storedVendor).emailAddress || null; } catch { return null; }
    }
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      try { return JSON.parse(storedAdmin).emailAddress || null; } catch { return null; }
    }
    return null;
  }

  /**
   * Get the role of the last logged-in user from localStorage.
   * 
   * WHY: When calling the /authenticate endpoint again, we need to pass the role
   * so the backend knows which user collection to search in.
   * 
   * RETURNS: 'customer' | 'vendor' | 'admin' | null
   */
  getStoredRole(): 'customer' | 'vendor' | 'admin' | null {
    if (localStorage.getItem('customer')) return 'customer';
    if (localStorage.getItem('vendor')) return 'vendor';
    if (localStorage.getItem('admin')) return 'admin';
    return null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

