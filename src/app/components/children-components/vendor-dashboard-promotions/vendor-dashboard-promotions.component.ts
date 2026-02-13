import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { CouponService, Coupon, CouponDto } from '../../../project/services/coupon.service';
import { UserStateService } from '../../../project/services/user-state.service';
import { VendorDto as Vendor } from '../../../project/models/vendor';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Promotion {
  id: string;
  name: string;
  code: string;
  type: 'discount' | 'coupon' | 'flash-sale' | 'bundle';
  discountValue: number;
  discountType: 'percentage' | 'fixed';
  startDate: Date;
  endDate: Date;
  status: 'active' | 'scheduled' | 'expired' | 'draft';
  usageCount: number;
  usageLimit: number;
  applicableProducts: number;
  minimumOrder?: number;
  maximumDiscount?: number;
  revenue: number;
  original?: Coupon;
}

interface CouponCode {
  id: string;
  code: string;
  discount: string;
  usedCount: number;
  totalCount: number;
  expiresIn: string;
}

@Component({
  selector: 'app-vendor-dashboard-promotions',
  templateUrl: './vendor-dashboard-promotions.component.html',
  styleUrls: ['./vendor-dashboard-promotions.component.css']
})
export class VendorDashboardPromotionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading states
  isLoading = false;
  loadError: string | null = null;
  vendorId: string = '';

  promotions: Promotion[] = [];
  coupons: CouponCode[] = [];

  // Stats
  activePromotions: number = 0;
  totalRevenue: number = 0;
  totalRedemptions: number = 0;
  conversionRate: number = 0;

  filterStatus: string = 'all';
  showCreateModal: boolean = false;

  constructor(
    private couponService: CouponService,
    private userStateService: UserStateService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.initializeVendor();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeVendor(): void {
    this.userStateService.vendor$
      .pipe(takeUntil(this.destroy$))
      .subscribe((vendor: Vendor | null) => {
        if (vendor && vendor.vendorId) {
          this.vendorId = vendor.vendorId;
          this.loadPromotions();
        } else {
          this.loadError = 'Vendor not authenticated';
        }
      });
  }

  loadPromotions(): void {
    this.isLoading = true;
    this.loadError = null;

    // Load all coupons (in future, filter by vendorId if backend supports it)
    this.couponService.getAllCoupons()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (coupons: Coupon[]) => {
          this.processPromotions(coupons);
        },
        error: (error) => {
          console.error('Error loading promotions:', error);
          this.loadError = error.error?.message || 'Failed to load promotions. Please try again.';
        }
      });
  }

  private processPromotions(coupons: Coupon[]): void {
    // Map coupons to promotions
    this.promotions = coupons.map(c => this.mapCouponToPromotion(c));
    
    // Map to simple coupon display
    this.coupons = coupons.filter(c => c.isActive).map(c => ({
      id: c.code,
      code: c.code,
      discount: this.couponService.formatDiscount(c),
      usedCount: c.usageCount,
      totalCount: c.usageLimit || 0,
      expiresIn: this.getExpiresIn(new Date(c.validUntil))
    }));

    // Calculate stats
    this.calculateStats();
  }

  private mapCouponToPromotion(coupon: Coupon): Promotion {
    const now = new Date();
    const startDate = new Date(coupon.validFrom);
    const endDate = new Date(coupon.validUntil);
    
    let status: 'active' | 'scheduled' | 'expired' | 'draft';
    if (!coupon.isActive) {
      status = 'draft';
    } else if (endDate < now) {
      status = 'expired';
    } else if (startDate > now) {
      status = 'scheduled';
    } else {
      status = 'active';
    }

    return {
      id: coupon.code,
      name: coupon.description || coupon.code,
      code: coupon.code,
      type: this.getPromotionType(coupon.discountType),
      discountValue: coupon.discountValue,
      discountType: coupon.discountType === 'PERCENTAGE' ? 'percentage' : 'fixed',
      startDate: startDate,
      endDate: endDate,
      status: status,
      usageCount: coupon.usageCount,
      usageLimit: coupon.usageLimit || 0,
      applicableProducts: (coupon.applicableProducts?.length || 0) + (coupon.applicableCategories?.length || 0),
      minimumOrder: coupon.minimumOrderAmount,
      maximumDiscount: coupon.maximumDiscount,
      revenue: (coupon as any).revenue || coupon.usageCount * (coupon.discountValue || 0),
      original: coupon
    };
  }

  private getPromotionType(discountType: string): 'discount' | 'coupon' | 'flash-sale' | 'bundle' {
    switch (discountType) {
      case 'PERCENTAGE': return 'discount';
      case 'FIXED_AMOUNT': return 'coupon';
      case 'FREE_SHIPPING': return 'flash-sale';
      default: return 'coupon';
    }
  }

  private getExpiresIn(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  }

  private calculateStats(): void {
    this.activePromotions = this.promotions.filter(p => p.status === 'active').length;
    this.totalRedemptions = this.promotions.reduce((sum, p) => sum + p.usageCount, 0);
    // Revenue calculation would need additional data from backend
    this.totalRevenue = this.totalRedemptions * 500; // Estimated average order value
    this.conversionRate = this.totalRedemptions > 0 ? 
      Math.round((this.totalRedemptions / (this.promotions.reduce((sum, p) => sum + (p.usageLimit || 100), 0))) * 1000) / 10 : 0;
  }

  getTypeIcon(type: string): string {
    switch(type) {
      case 'discount': return 'fa-percent';
      case 'coupon': return 'fa-ticket-alt';
      case 'flash-sale': return 'fa-bolt';
      case 'bundle': return 'fa-box-open';
      default: return 'fa-tag';
    }
  }

  getTypeLabel(type: string): string {
    switch(type) {
      case 'discount': return 'Discount';
      case 'coupon': return 'Coupon';
      case 'flash-sale': return 'Flash Sale';
      case 'bundle': return 'Bundle Deal';
      default: return 'Promotion';
    }
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  formatDiscount(promo: Promotion): string {
    if (promo.discountType === 'percentage') {
      return `${promo.discountValue}% OFF`;
    }
    return `₹${promo.discountValue} OFF`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  getProgressPercentage(used: number, total: number): number {
    if (total === 0) return 0;
    return Math.min((used / total) * 100, 100);
  }

  get filteredPromotions(): Promotion[] {
    if (this.filterStatus === 'all') return this.promotions;
    return this.promotions.filter(p => p.status === this.filterStatus);
  }

  createPromotion(): void {
    this.showCreateModal = true;
  }

  editPromotion(promo: Promotion): void {
    console.log('Edit promotion:', promo);
    // TODO: Implement edit modal with couponService.updateCoupon()
  }

  duplicatePromotion(promo: Promotion): void {
    if (!promo.original) return;
    
    const newCoupon: CouponDto = {
      code: promo.code + '_COPY',
      description: promo.name + ' (Copy)',
      discountType: promo.original.discountType,
      discountValue: promo.discountValue,
      minimumOrderAmount: promo.minimumOrder,
      maximumDiscount: promo.maximumDiscount,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usageLimit: promo.usageLimit,
      isActive: false
    };

    this.couponService.createCoupon(newCoupon)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Promotion duplicated successfully', 'Close', { duration: 3000 });
          this.loadPromotions();
        },
        error: (error) => {
          this.snackBar.open('Failed to duplicate promotion', 'Close', { duration: 3000 });
          console.error('Error duplicating promotion:', error);
        }
      });
  }

  deletePromotion(promo: Promotion): void {
    if (confirm(`Are you sure you want to delete "${promo.name}"?`)) {
      this.couponService.deleteCoupon(promo.code)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Promotion deleted successfully', 'Close', { duration: 3000 });
            this.loadPromotions();
          },
          error: (error) => {
            this.snackBar.open('Failed to delete promotion', 'Close', { duration: 3000 });
            console.error('Error deleting promotion:', error);
          }
        });
    }
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code);
    this.snackBar.open('Code copied to clipboard', 'Close', { duration: 2000 });
  }

  refreshPromotions(): void {
    this.loadPromotions();
  }
}
