import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalVariable } from '../global/global';

// Dashboard Summary
export interface DashboardSummary {
  totalProducts: number;
  totalVendors: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  totalStates: number;
  totalDistricts: number;
  giTaggedProducts: number;
}

// Sales Analytics
export interface TopSellingProduct {
  productId: string;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  vendorName: string;
  category: string;
}

export interface TopVendor {
  vendorId: string;
  vendorName: string;
  shopName: string;
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  state: string;
  district: string;
}

export interface SalesAnalytics {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  topSellingProducts: TopSellingProduct[];
  topVendors: TopVendor[];
  salesByCategory: { [category: string]: number };
  salesByState: { [state: string]: number };
  revenueByMonth: TimeSeriesData[];
  ordersByMonth: TimeSeriesData[];
}

export interface TimeSeriesData {
  period: string;
  value: number;
  label?: string;
}

// Geographic Analytics
export interface StateAnalytics {
  state: string;
  totalProducts: number;
  totalVendors: number;
  totalOrders: number;
  totalRevenue: number;
  giTaggedProducts: number;
  topDistricts: DistrictAnalytics[];
}

export interface DistrictAnalytics {
  district: string;
  state: string;
  totalProducts: number;
  totalVendors: number;
  totalOrders: number;
  totalRevenue: number;
  odopProduct?: string;
}

export interface GeographicAnalytics {
  stateAnalytics: StateAnalytics[];
  topStates: StateAnalytics[];
  topDistricts: DistrictAnalytics[];
}

// Vendor Analytics
export interface ProductPerformance {
  productId: string;
  productName: string;
  totalOrders: number;
  totalQuantity: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
}

export interface VendorAnalytics {
  vendorId: string;
  vendorName: string;
  shopName: string;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averageRating: number;
  totalReviews: number;
  productPerformance: ProductPerformance[];
  salesByMonth: TimeSeriesData[];
  ordersByMonth: TimeSeriesData[];
}

// Filter Request
export interface AnalyticsFilter {
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
  startDate?: string;
  endDate?: string;
  state?: string;
  district?: string;
  category?: string;
  vendorId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  private readonly baseUrl = GlobalVariable.BASE_API_URL + 'analytics';

  constructor(private http: HttpClient) { }

  // ============== DASHBOARD ==============

  /**
   * Get dashboard summary (Admin only)
   */
  getDashboardSummary(filter?: AnalyticsFilter): Observable<DashboardSummary> {
    let params = this.buildParams(filter);
    return this.http.get<DashboardSummary>(`${this.baseUrl}/dashboard/summary`, { params });
  }

  // ============== SALES ANALYTICS ==============

  /**
   * Get sales analytics (Admin only)
   */
  getSalesAnalytics(filter?: AnalyticsFilter): Observable<SalesAnalytics> {
    let params = this.buildParams(filter);
    return this.http.get<SalesAnalytics>(`${this.baseUrl}/sales`, { params });
  }

  // ============== GEOGRAPHIC ANALYTICS ==============

  /**
   * Get geographic analytics (Admin only)
   */
  getGeographicAnalytics(filter?: AnalyticsFilter): Observable<GeographicAnalytics> {
    let params = this.buildParams(filter);
    return this.http.get<GeographicAnalytics>(`${this.baseUrl}/geographic`, { params });
  }

  // ============== VENDOR ANALYTICS ==============

  /**
   * Get vendor leaderboard (Admin only)
   */
  getVendorLeaderboard(limit: number = 10): Observable<TopVendor[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<TopVendor[]>(`${this.baseUrl}/vendors/leaderboard`, { params });
  }

  /**
   * Get analytics for a specific vendor
   */
  getVendorSummary(vendorId: string, filter?: AnalyticsFilter): Observable<VendorAnalytics> {
    let params = this.buildParams(filter);
    return this.http.get<VendorAnalytics>(`${this.baseUrl}/vendor/${vendorId}/summary`, { params });
  }

  /**
   * Get sales data for a specific vendor
   */
  getVendorSales(vendorId: string, filter?: AnalyticsFilter): Observable<SalesAnalytics> {
    let params = this.buildParams(filter);
    return this.http.get<SalesAnalytics>(`${this.baseUrl}/vendor/${vendorId}/sales`, { params });
  }

  // ============== ODOP SPECIFIC ==============

  /**
   * Get ODOP districts analytics
   */
  getOdopDistricts(state?: string): Observable<DistrictAnalytics[]> {
    let params = new HttpParams();
    if (state) {
      params = params.set('state', state);
    }
    return this.http.get<DistrictAnalytics[]>(`${this.baseUrl}/odop/districts`, { params });
  }

  /**
   * Get GI tagged products analytics
   */
  getGiProductsAnalytics(state?: string): Observable<any> {
    let params = new HttpParams();
    if (state) {
      params = params.set('state', state);
    }
    return this.http.get<any>(`${this.baseUrl}/odop/gi-products`, { params });
  }

  // ============== HEALTH CHECK ==============

  /**
   * Check if analytics service is healthy
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // ============== HELPER METHODS ==============

  private buildParams(filter?: AnalyticsFilter): HttpParams {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.period) params = params.set('period', filter.period);
      if (filter.startDate) params = params.set('startDate', filter.startDate);
      if (filter.endDate) params = params.set('endDate', filter.endDate);
      if (filter.state) params = params.set('state', filter.state);
      if (filter.district) params = params.set('district', filter.district);
      if (filter.category) params = params.set('category', filter.category);
      if (filter.vendorId) params = params.set('vendorId', filter.vendorId);
    }
    
    return params;
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format number with commas
   */
  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-IN').format(num);
  }

  /**
   * Calculate percentage change
   */
  calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }
}
