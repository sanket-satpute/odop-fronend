import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DataHandlerService {
  private static readonly NOT_AVAILABLE = 'N/A';
  private static readonly NOT_FOUND = 'Not Found';

  /**
   * Safely handles undefined or null values
   * @param value The value to check
   * @param defaultValue Optional default value if the main value is empty
   */
  public safeValue(value: any, defaultValue: string = DataHandlerService.NOT_AVAILABLE): string {
    return value || defaultValue;
  }

  /**
   * Formats currency values
   * @param amount The amount to format
   * @param currency The currency code (default: INR)
   */
  public formatCurrency(amount: number | null | undefined, currency: string = 'INR'): string {
    if (amount == null) return DataHandlerService.NOT_AVAILABLE;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Formats date values
   * @param date The date to format
   * @param format Optional format specification
   */
  public formatDate(date: Date | string | null | undefined): string {
    if (!date) return DataHandlerService.NOT_AVAILABLE;
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formats phone numbers
   * @param phone The phone number to format
   */
  public formatPhone(phone: string | number | null | undefined): string {
    if (!phone) return DataHandlerService.NOT_AVAILABLE;
    const phoneStr = phone.toString().trim();
    if (!phoneStr.match(/^\d{10}$/)) return phoneStr;
    return phoneStr.replace(/(\d{3})(\d{3})(\d{4})/, '+91 $1-$2-$3');
  }

  /**
   * Creates a full name from parts
   * @param firstName First name
   * @param lastName Last name
   */
  public formatFullName(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) return DataHandlerService.NOT_AVAILABLE;
    return [firstName, lastName].filter(Boolean).join(' ');
  }

  /**
   * Formats address parts into a full address
   * @param addressParts Object containing address components
   */
  public formatAddress(addressParts: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }): string {
    if (!addressParts || Object.keys(addressParts).length === 0) {
      return DataHandlerService.NOT_AVAILABLE;
    }
    return Object.values(addressParts)
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Handles error messages
   * @param error The error object
   */
  public handleError(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.error?.message) return error.error.message;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
  }

  /**
   * Creates a loading state handler
   */
  public createLoadingState() {
    const loadingSubject = new BehaviorSubject<boolean>(false);
    
    return {
      loading$: loadingSubject.asObservable(),
      startLoading: () => loadingSubject.next(true),
      stopLoading: () => loadingSubject.next(false),
      withLoading: <T>(observable: Observable<T>): Observable<T> => {
        return new Observable<T>(subscriber => {
          loadingSubject.next(true);
          return observable.subscribe({
            next: (value) => subscriber.next(value),
            error: (error) => {
              loadingSubject.next(false);
              subscriber.error(error);
            },
            complete: () => {
              loadingSubject.next(false);
              subscriber.complete();
            }
          });
        });
      }
    };
  }

  // Cart management
  private cartItems: any[] = [];
  private cartSubject = new BehaviorSubject<any[]>([]);
  public cart$ = this.cartSubject.asObservable();

  /**
   * Add item to cart
   * @param item The product item to add
   */
  public addToCart(item: any): void {
    const existingItem = this.cartItems.find(i => i.productId === item.productId);
    if (existingItem) {
      existingItem.quantity += item.quantity || 1;
    } else {
      this.cartItems.push({
        ...item,
        quantity: item.quantity || 1
      });
    }
    this.cartSubject.next([...this.cartItems]);
  }

  /**
   * Remove item from cart
   * @param productId The product ID to remove
   */
  public removeFromCart(productId: string): void {
    this.cartItems = this.cartItems.filter(i => i.productId !== productId);
    this.cartSubject.next([...this.cartItems]);
  }

  /**
   * Get cart items
   */
  public getCartItems(): any[] {
    return [...this.cartItems];
  }

  // Wishlist management
  private wishlistItems: any[] = [];
  private wishlistSubject = new BehaviorSubject<any[]>([]);
  public wishlist$ = this.wishlistSubject.asObservable();

  /**
   * Add item to wishlist
   * @param item The product item to add
   */
  public addToWishlist(item: any): void {
    const exists = this.wishlistItems.find(i => i.id === item.id);
    if (!exists) {
      this.wishlistItems.push(item);
      this.wishlistSubject.next([...this.wishlistItems]);
    }
  }

  /**
   * Remove item from wishlist
   * @param itemId The item ID to remove
   */
  public removeFromWishlist(itemId: string): void {
    this.wishlistItems = this.wishlistItems.filter(i => i.id !== itemId);
    this.wishlistSubject.next([...this.wishlistItems]);
  }

  /**
   * Get wishlist items
   */
  public getWishlistItems(): any[] {
    return [...this.wishlistItems];
  }
}