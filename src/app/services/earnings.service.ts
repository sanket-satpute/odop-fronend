import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

// ==================== INTERFACES ====================

export interface EarningsOverview {
  totalEarnings: number;
  pendingPayouts: number;
  availableBalance: number;
  lifetimeEarnings: number;
  earningsChangePercent: number;
  ordersChangePercent: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  platformFee: number;
  platformFeeRate: number;
  netEarnings: number;
  period: string;
  startDate: string;
  endDate: string;
  breakdown: EarningsBreakdown[];
  topProducts: EarningsByProduct[];
}

export interface EarningsBreakdown {
  date: string;
  earnings: number;
  orders: number;
  avgOrderValue: number;
}

export interface EarningsByProduct {
  productId: string;
  productName: string;
  productImage: string;
  unitsSold: number;
  totalEarnings: number;
  percentage: number;
}

export interface Transaction {
  transactionId: string;
  orderId: string;
  vendorId: string;
  type: string; // SALE, REFUND, PAYOUT, PLATFORM_FEE
  amount: number;
  netAmount: number;
  platformFee: number;
  status: string;
  description: string;
  customerName?: string;
  productName?: string;
  quantity?: number;
  createdAt: string;
}

export interface TransactionPage {
  transactions: Transaction[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  totalCredits: number;
  totalDebits: number;
  netTotal: number;
}

export interface Payout {
  payoutId: string;
  vendorId: string;
  amount: number;
  status: string; // PENDING, PROCESSING, COMPLETED, FAILED
  paymentMethod: string;
  bankName?: string;
  accountNumberMasked?: string;
  ifscCode?: string;
  upiId?: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  transactionId?: string;
  remarks?: string;
}

export interface PayoutRequest {
  vendorId: string;
  amount: number;
  paymentMethod: string; // BANK_TRANSFER, UPI
  bankAccountId?: string;
  upiId?: string;
  remarks?: string;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class EarningsService {

  private readonly apiUrl = `${environment.apiUrl}/odop/earnings`;
  
  // State management
  private earningsOverviewSubject = new BehaviorSubject<EarningsOverview | null>(null);
  public earningsOverview$ = this.earningsOverviewSubject.asObservable();
  
  private transactionsSubject = new BehaviorSubject<TransactionPage | null>(null);
  public transactions$ = this.transactionsSubject.asObservable();
  
  private payoutsSubject = new BehaviorSubject<Payout[]>([]);
  public payouts$ = this.payoutsSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ==================== EARNINGS OVERVIEW ====================

  /**
   * Get earnings overview for a vendor
   * @param vendorId Vendor ID
   * @param period Time period (WEEK, MONTH, QUARTER, YEAR, ALL_TIME)
   */
  getEarningsOverview(vendorId: string, period: string = 'MONTH'): Observable<EarningsOverview> {
    const params = new HttpParams().set('period', period);
    
    this.loadingSubject.next(true);
    return this.http.get<EarningsOverview>(`${this.apiUrl}/vendor/${vendorId}/overview`, { params })
      .pipe(
        tap(overview => {
          this.earningsOverviewSubject.next(overview);
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Get chart data for earnings breakdown
   */
  getEarningsChart(vendorId: string, period: string = 'MONTH'): Observable<EarningsBreakdown[]> {
    const params = new HttpParams().set('period', period);
    return this.http.get<EarningsBreakdown[]>(`${this.apiUrl}/vendor/${vendorId}/chart`, { params });
  }

  /**
   * Get top earning products
   */
  getTopProducts(vendorId: string, period: string = 'MONTH'): Observable<EarningsByProduct[]> {
    const params = new HttpParams().set('period', period);
    return this.http.get<EarningsByProduct[]>(`${this.apiUrl}/vendor/${vendorId}/top-products`, { params });
  }

  // ==================== TRANSACTIONS ====================

  /**
   * Get paginated transaction history
   * @param vendorId Vendor ID
   * @param type Transaction type filter (SALE, REFUND, PAYOUT)
   * @param page Page number (0-indexed)
   * @param size Page size
   */
  getTransactions(
    vendorId: string,
    type?: string,
    page: number = 0,
    size: number = 20
  ): Observable<TransactionPage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<TransactionPage>(`${this.apiUrl}/vendor/${vendorId}/transactions`, { params })
      .pipe(
        tap(transactions => this.transactionsSubject.next(transactions))
      );
  }

  /**
   * Export transactions to CSV/Excel
   */
  exportTransactions(vendorId: string, format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    return this.http.get(`${this.apiUrl}/vendor/${vendorId}/transactions/export`, {
      params,
      responseType: 'blob'
    });
  }

  // ==================== PAYOUTS ====================

  /**
   * Get payout history
   * @param vendorId Vendor ID
   * @param limit Maximum records to return
   */
  getPayoutHistory(vendorId: string, limit: number = 10): Observable<Payout[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<Payout[]>(`${this.apiUrl}/vendor/${vendorId}/payouts`, { params })
      .pipe(
        tap(payouts => this.payoutsSubject.next(payouts))
      );
  }

  /**
   * Request a payout withdrawal
   */
  requestPayout(vendorId: string, request: PayoutRequest): Observable<Payout> {
    return this.http.post<Payout>(`${this.apiUrl}/vendor/${vendorId}/payout`, request)
      .pipe(
        tap(payout => {
          // Add new payout to the beginning of the list
          const currentPayouts = this.payoutsSubject.getValue();
          this.payoutsSubject.next([payout, ...currentPayouts]);
        })
      );
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Format currency amount
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format percentage change with sign
   */
  formatPercentChange(percent: number): string {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'COMPLETED': 'status-success',
      'PENDING': 'status-warning',
      'PROCESSING': 'status-info',
      'FAILED': 'status-error',
      'REVERSED': 'status-error',
      'SALE': 'status-success',
      'REFUND': 'status-warning',
      'PAYOUT': 'status-info'
    };
    return statusMap[status] || 'status-default';
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    this.earningsOverviewSubject.next(null);
    this.transactionsSubject.next(null);
    this.payoutsSubject.next([]);
  }
}
