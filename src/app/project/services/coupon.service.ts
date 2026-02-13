import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { GlobalVariable } from '../global/global';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export interface Coupon {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  isActive: boolean;
  applicableCategories?: string[];
  applicableProducts?: string[];
  excludedProducts?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CouponDto {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  perUserLimit?: number;
  isActive?: boolean;
  applicableCategories?: string[];
  applicableProducts?: string[];
  excludedProducts?: string[];
}

export interface ApplyCouponRequest {
  couponCode: string;
  customerId: string;
  orderAmount: number;
  productIds?: string[];
  categoryIds?: string[];
}

export interface CouponValidationResponse {
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  finalAmount: number;
  message: string;
  discountType?: DiscountType;
}

@Injectable({
  providedIn: 'root'
})
export class CouponService {

  private readonly baseUrl = GlobalVariable.BASE_API_URL + 'coupon';
  
  // Track applied coupon
  private appliedCouponSubject = new BehaviorSubject<CouponValidationResponse | null>(null);
  public appliedCoupon$ = this.appliedCouponSubject.asObservable();

  constructor(private http: HttpClient) { }

  // ============== VALIDATE & APPLY ==============

  /**
   * Validate and apply a coupon code
   * Returns discount amount and final amount
   */
  validateCoupon(request: ApplyCouponRequest): Observable<CouponValidationResponse> {
    return this.http.post<CouponValidationResponse>(`${this.baseUrl}/validate`, request).pipe(
      tap(response => {
        if (response.valid) {
          this.appliedCouponSubject.next(response);
        }
      }),
      catchError(error => {
        this.appliedCouponSubject.next(null);
        throw error;
      })
    );
  }

  /**
   * Remove applied coupon
   */
  removeCoupon(): void {
    this.appliedCouponSubject.next(null);
  }

  /**
   * Get currently applied coupon
   */
  getAppliedCoupon(): CouponValidationResponse | null {
    return this.appliedCouponSubject.value;
  }

  // ============== GET AVAILABLE COUPONS ==============

  /**
   * Get all available/active coupons for customers
   */
  getAvailableCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(`${this.baseUrl}/available`);
  }

  /**
   * Get coupon by code
   */
  getCouponByCode(code: string): Observable<Coupon> {
    return this.http.get<Coupon>(`${this.baseUrl}/${code}`);
  }

  // ============== ADMIN: COUPON MANAGEMENT ==============

  /**
   * Get all coupons (Admin only)
   */
  getAllCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(`${this.baseUrl}`);
  }

  /**
   * Create a new coupon (Admin only)
   */
  createCoupon(couponDto: CouponDto): Observable<Coupon> {
    return this.http.post<Coupon>(`${this.baseUrl}`, couponDto);
  }

  /**
   * Update an existing coupon (Admin only)
   */
  updateCoupon(code: string, couponDto: CouponDto): Observable<Coupon> {
    return this.http.put<Coupon>(`${this.baseUrl}/${code}`, couponDto);
  }

  /**
   * Delete a coupon (Admin only)
   */
  deleteCoupon(code: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${code}`);
  }

  // ============== HEALTH CHECK ==============

  /**
   * Check if coupon service is healthy
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // ============== HELPER METHODS ==============

  /**
   * Calculate discount for display
   */
  formatDiscount(coupon: Coupon): string {
    switch (coupon.discountType) {
      case 'PERCENTAGE':
        return `${coupon.discountValue}% OFF`;
      case 'FIXED_AMOUNT':
        return `₹${coupon.discountValue} OFF`;
      case 'FREE_SHIPPING':
        return 'FREE SHIPPING';
      default:
        return '';
    }
  }

  /**
   * Check if coupon is expired
   */
  isCouponExpired(coupon: Coupon): boolean {
    return new Date(coupon.validUntil) < new Date();
  }

  /**
   * Check if coupon is not yet active
   */
  isCouponNotYetActive(coupon: Coupon): boolean {
    return new Date(coupon.validFrom) > new Date();
  }

  /**
   * Check if coupon usage limit is reached
   */
  isUsageLimitReached(coupon: Coupon): boolean {
    if (!coupon.usageLimit) return false;
    return coupon.usageCount >= coupon.usageLimit;
  }
}
