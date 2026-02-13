import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { GlobalVariable } from '../global/global';

// Backend DTOs matching WishlistController
export interface WishlistItemDto {
  productId: string;
  productName: string;
  productPrice?: number;
  price?: number;
  discountedPrice?: number;
  productImage?: string;
  productImageURL?: string;
  vendorName?: string;
  vendorId?: string;
  category?: string;
  stockStatus?: string;
  addedAt: string;
  inStock: boolean;
}

export interface WishlistResponse {
  customerId: string;
  items: WishlistItemDto[];
  totalItems: number;
  updatedAt: string;
}

export interface WishlistActionResponse {
  success: boolean;
  message: string;
  productId: string;
  action: 'ADDED' | 'REMOVED' | 'CLEARED';
  wishlistCount: number;
}

export interface WishlistCheckResponse {
  productId: string;
  inWishlist: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private readonly baseUrl = GlobalVariable.BASE_API_URL + 'wishlist';
  
  // Observable for real-time wishlist updates
  private wishlistSubject = new BehaviorSubject<WishlistItemDto[]>([]);
  public wishlist$ = this.wishlistSubject.asObservable();
  
  // Track wishlist count
  private wishlistCountSubject = new BehaviorSubject<number>(0);
  public wishlistCount$ = this.wishlistCountSubject.asObservable();
  
  // Track product IDs in wishlist for quick lookup
  private wishlistProductIds = new Set<string>();

  constructor(private http: HttpClient) { }

  // ============== LOAD WISHLIST ==============

  /**
   * Load wishlist for current authenticated user
   * Backend uses JWT token to identify customer
   */
  loadWishlist(): Observable<WishlistResponse> {
    return this.http.get<WishlistResponse>(`${this.baseUrl}`).pipe(
      tap(response => {
        this.wishlistSubject.next(response.items);
        this.wishlistCountSubject.next(response.totalItems);
        this.wishlistProductIds = new Set(response.items.map(item => item.productId));
      }),
      catchError(error => {
        if (error.status === 404 || error.status === 401) {
          this.wishlistSubject.next([]);
          this.wishlistCountSubject.next(0);
          this.wishlistProductIds.clear();
          return of({
            customerId: '',
            items: [],
            totalItems: 0,
            updatedAt: new Date().toISOString()
          } as WishlistResponse);
        }
        throw error;
      })
    );
  }

  /**
   * Get current wishlist from cache
   */
  getCurrentWishlist(): WishlistItemDto[] {
    return this.wishlistSubject.value;
  }

  /**
   * Get current wishlist count
   */
  getWishlistCount(): number {
    return this.wishlistCountSubject.value;
  }

  // ============== ADD TO WISHLIST ==============

  /**
   * Add product to wishlist
   * Backend uses JWT for customer identification
   */
  addToWishlist(productId: string): Observable<WishlistActionResponse> {
    return this.http.post<WishlistActionResponse>(`${this.baseUrl}/${productId}`, {}).pipe(
      tap(response => {
        if (response.success) {
          this.wishlistProductIds.add(productId);
          this.wishlistCountSubject.next(response.wishlistCount);
          this.loadWishlist().subscribe({
            error: (err) => console.error('Failed to reload wishlist:', err)
          });
        }
      }),
      catchError(error => {
        console.error('Failed to add to wishlist:', error);
        throw error;
      })
    );
  }

  // ============== REMOVE FROM WISHLIST ==============

  /**
   * Remove product from wishlist
   */
  removeFromWishlist(productId: string): Observable<WishlistActionResponse> {
    return this.http.delete<WishlistActionResponse>(`${this.baseUrl}/${productId}`).pipe(
      tap(response => {
        if (response.success) {
          this.wishlistProductIds.delete(productId);
          this.wishlistCountSubject.next(response.wishlistCount);
          const currentItems = this.wishlistSubject.value.filter(
            item => item.productId !== productId
          );
          this.wishlistSubject.next(currentItems);
        }
      }),
      catchError(error => {
        console.error('Failed to remove from wishlist:', error);
        throw error;
      })
    );
  }

  // ============== CHECK IF IN WISHLIST ==============

  /**
   * Check if product is in wishlist (API call)
   */
  checkInWishlist(productId: string): Observable<WishlistCheckResponse> {
    return this.http.get<WishlistCheckResponse>(`${this.baseUrl}/check/${productId}`);
  }

  /**
   * Check if product is in wishlist (from cache - faster)
   */
  isInWishlist(productId: string): boolean {
    return this.wishlistProductIds.has(productId);
  }

  // ============== CLEAR WISHLIST ==============

  /**
   * Clear entire wishlist
   */
  clearWishlist(): Observable<WishlistActionResponse> {
    return this.http.delete<WishlistActionResponse>(`${this.baseUrl}/clear`).pipe(
      tap(response => {
        if (response.success) {
          this.wishlistSubject.next([]);
          this.wishlistCountSubject.next(0);
          this.wishlistProductIds.clear();
        }
      }),
      catchError(error => {
        console.error('Failed to clear wishlist:', error);
        throw error;
      })
    );
  }

  // ============== GET COUNT ==============

  /**
   * Get wishlist count from API
   */
  fetchWishlistCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/count`).pipe(
      map(response => response.count),
      tap(count => this.wishlistCountSubject.next(count)),
      catchError(() => of(0))
    );
  }

  // ============== TOGGLE WISHLIST ==============

  /**
   * Toggle product in wishlist (add if not present, remove if present)
   */
  toggleWishlist(productId: string): Observable<WishlistActionResponse> {
    if (this.isInWishlist(productId)) {
      return this.removeFromWishlist(productId);
    } else {
      return this.addToWishlist(productId);
    }
  }

  // ============== HEALTH CHECK ==============

  /**
   * Check if wishlist service is healthy
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // ============== HELPER METHODS ==============

  /**
   * Reset local state (call on logout)
   */
  resetState(): void {
    this.wishlistSubject.next([]);
    this.wishlistCountSubject.next(0);
    this.wishlistProductIds.clear();
  }

  /**
   * Check if wishlist is empty
   */
  isEmpty(): boolean {
    return this.wishlistCountSubject.value === 0;
  }

  /**
   * Get product IDs in wishlist
   */
  getProductIds(): string[] {
    return Array.from(this.wishlistProductIds);
  }

  // ============== LOCAL STORAGE (for guests) ==============

  /**
   * Save wishlist to local storage (for non-logged-in users)
   */
  saveToLocalStorage(productIds: string[]): void {
    localStorage.setItem('guest_wishlist', JSON.stringify(productIds));
  }

  /**
   * Get wishlist from local storage
   */
  getFromLocalStorage(): string[] {
    const stored = localStorage.getItem('guest_wishlist');
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Add to local storage wishlist
   */
  addToLocalWishlist(productId: string): void {
    const items = this.getFromLocalStorage();
    if (!items.includes(productId)) {
      items.push(productId);
      this.saveToLocalStorage(items);
    }
  }

  /**
   * Remove from local storage wishlist
   */
  removeFromLocalWishlist(productId: string): void {
    const items = this.getFromLocalStorage();
    const filtered = items.filter(id => id !== productId);
    this.saveToLocalStorage(filtered);
  }

  /**
   * Check if product is in local wishlist
   */
  isInLocalWishlist(productId: string): boolean {
    return this.getFromLocalStorage().includes(productId);
  }

  /**
   * Clear local wishlist
   */
  clearLocalWishlist(): void {
    localStorage.removeItem('guest_wishlist');
  }
}
