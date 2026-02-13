import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { UserStateService } from './user-state.service';

export interface WalletTransaction {
  transactionId: string;
  type: 'credit' | 'debit' | 'refund' | 'cashback' | 'bonus';
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  timestamp: Date;
}

export interface Wallet {
  walletId: string;
  customerId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  isLocked: boolean;
  lockReason?: string;
  transactions: WalletTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletSummary {
  exists: boolean;
  balance: number;
  currency: string;
  isActive: boolean;
  isLocked: boolean;
  totalTransactions: number;
  totalCredits: number;
  totalDebits: number;
  totalRefunds: number;
  totalCashback: number;
}

export interface BalanceCheckResult {
  hasSufficientBalance: boolean;
  currentBalance: number;
  requestedAmount: number;
  shortfall: number;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private readonly apiUrl = environment.apiUrl;
  
  private walletSubject = new BehaviorSubject<Wallet | null>(null);
  public wallet$ = this.walletSubject.asObservable();
  
  private balanceSubject = new BehaviorSubject<number>(0);
  public balance$ = this.balanceSubject.asObservable();

  constructor(
    private http: HttpClient,
    private userStateService: UserStateService
  ) {}

  private getCustomerId(): string {
    return this.userStateService.customer?.customerId || '';
  }

  private getBaseUrl(): string {
    const customerId = this.getCustomerId();
    return `${this.apiUrl}/odop/customer/${customerId}/wallet`;
  }

  /**
   * Get wallet details
   */
  getWallet(): Observable<Wallet> {
    return this.http.get<Wallet>(this.getBaseUrl())
      .pipe(
        tap(wallet => {
          this.walletSubject.next(wallet);
          this.balanceSubject.next(wallet.balance);
        })
      );
  }

  /**
   * Get wallet balance only
   */
  getBalance(): Observable<{ balance: number; currency: string }> {
    return this.http.get<{ balance: number; currency: string }>(`${this.getBaseUrl()}/balance`)
      .pipe(
        tap(result => this.balanceSubject.next(result.balance))
      );
  }

  /**
   * Get wallet summary with statistics
   */
  getWalletSummary(): Observable<WalletSummary> {
    return this.http.get<WalletSummary>(`${this.getBaseUrl()}/summary`);
  }

  /**
   * Add money to wallet
   */
  addMoney(amount: number, description?: string): Observable<Wallet> {
    const payload = {
      amount,
      description: description || 'Wallet top-up'
    };
    
    return this.http.post<Wallet>(`${this.getBaseUrl()}/add`, payload)
      .pipe(
        tap(wallet => {
          this.walletSubject.next(wallet);
          this.balanceSubject.next(wallet.balance);
        })
      );
  }

  /**
   * Pay using wallet
   */
  payUsingWallet(amount: number, orderId: string): Observable<Wallet> {
    const payload = { amount, orderId };
    
    return this.http.post<Wallet>(`${this.getBaseUrl()}/pay`, payload)
      .pipe(
        tap(wallet => {
          this.walletSubject.next(wallet);
          this.balanceSubject.next(wallet.balance);
        })
      );
  }

  /**
   * Withdraw funds from wallet
   */
  withdrawFunds(amount: number, method?: string): Observable<Wallet> {
    const payload = {
      amount,
      method: method || 'bank_transfer'
    };

    return this.http.post<Wallet>(`${this.getBaseUrl()}/withdraw`, payload)
      .pipe(
        tap(wallet => {
          this.walletSubject.next(wallet);
          this.balanceSubject.next(wallet.balance);
        })
      );
  }

  /**
   * Apply voucher bonus to wallet
   */
  applyVoucherBonus(voucherCode: string, bonusAmount: number): Observable<Wallet> {
    const payload = {
      voucherCode,
      bonusAmount
    };

    return this.http.post<Wallet>(`${this.getBaseUrl()}/voucher/apply`, payload)
      .pipe(
        tap(wallet => {
          this.walletSubject.next(wallet);
          this.balanceSubject.next(wallet.balance);
        })
      );
  }

  /**
   * Check if sufficient balance exists
   */
  checkBalance(amount: number): Observable<BalanceCheckResult> {
    const params = new HttpParams().set('amount', amount.toString());
    return this.http.get<BalanceCheckResult>(`${this.getBaseUrl()}/check-balance`, { params });
  }

  /**
   * Get all transactions
   */
  getTransactions(): Observable<WalletTransaction[]> {
    return this.http.get<WalletTransaction[]>(`${this.getBaseUrl()}/transactions`);
  }

  /**
   * Get recent transactions
   */
  getRecentTransactions(limit: number = 10): Observable<WalletTransaction[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<WalletTransaction[]>(`${this.getBaseUrl()}/transactions/recent`, { params });
  }

  /**
   * Get transactions by type
   */
  getTransactionsByType(type: string): Observable<WalletTransaction[]> {
    return this.http.get<WalletTransaction[]>(`${this.getBaseUrl()}/transactions/type/${type}`);
  }

  /**
   * Get current balance synchronously from cache
   */
  get currentBalance(): number {
    return this.balanceSubject.value;
  }

  /**
   * Get current wallet synchronously from cache
   */
  get currentWallet(): Wallet | null {
    return this.walletSubject.value;
  }

  /**
   * Helper method to get transaction type info
   */
  getTransactionTypeInfo(type: string): { label: string; color: string; icon: string } {
    const typeMap: { [key: string]: { label: string; color: string; icon: string } } = {
      'credit': { label: 'Credit', color: '#4CAF50', icon: 'fa-plus-circle' },
      'debit': { label: 'Debit', color: '#f44336', icon: 'fa-minus-circle' },
      'refund': { label: 'Refund', color: '#2196F3', icon: 'fa-undo' },
      'cashback': { label: 'Cashback', color: '#FF9800', icon: 'fa-gift' },
      'bonus': { label: 'Bonus', color: '#9C27B0', icon: 'fa-star' },
      'topup': { label: 'Top-up', color: '#4CAF50', icon: 'fa-wallet' }
    };
    return typeMap[type] || { label: type, color: '#9E9E9E', icon: 'fa-circle' };
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }
}
