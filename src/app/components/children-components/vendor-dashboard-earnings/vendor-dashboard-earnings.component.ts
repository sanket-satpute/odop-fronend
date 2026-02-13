import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';
import { EarningsService, EarningsOverview, Transaction, TransactionPage, Payout, PayoutRequest } from '../../../services/earnings.service';
import { UserStateService } from '../../../project/services/user-state.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface EarningsCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
  color: string;
}

interface PayoutSchedule {
  nextPayout: string;
  amount: number;
  accountEnding: string;
}

@Component({
  selector: 'app-vendor-dashboard-earnings',
  templateUrl: './vendor-dashboard-earnings.component.html',
  styleUrls: ['./vendor-dashboard-earnings.component.css']
})
export class VendorDashboardEarningsComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  
  // State
  isLoading = true;
  loadError: string = '';
  vendorId: string = '';
  
  // Data
  earningsOverview: EarningsOverview | null = null;
  transactions: Transaction[] = [];
  payouts: Payout[] = [];
  transactionPage: TransactionPage | null = null;
  
  // Earnings Overview Cards - dynamically populated
  earningsCards: EarningsCard[] = [];

  // Payout Schedule
  payoutSchedule: PayoutSchedule = {
    nextPayout: 'Next Tuesday',
    amount: 0,
    accountEnding: '****'
  };

  // Bank Account Info
  bankAccount = {
    bankName: 'State Bank of India',
    accountNumber: '****4521',
    ifsc: 'SBIN0001234',
    verified: true
  };

  // Monthly Earnings Data (for chart)
  monthlyData: { month: string; amount: number }[] = [];

  selectedPeriod: string = 'MONTH';
  selectedTransactionType: string = '';
  currentPage: number = 0;
  pageSize: number = 10;

  constructor(
    private earningsService: EarningsService,
    private userStateService: UserStateService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Get vendor ID from user state service first, then localStorage fallback
    const currentVendor = this.userStateService.vendor;
    if (currentVendor?.vendorId) {
      this.vendorId = currentVendor.vendorId;
    } else {
      const storedVendor = localStorage.getItem('vendor');
      if (storedVendor) {
        try {
          const vendor = JSON.parse(storedVendor);
          this.vendorId = vendor.vendorId || '';
        } catch (e) {
          this.vendorId = '';
        }
      }
    }

    if (this.vendorId) {
      this.loadEarningsData();
    } else {
      this.loadError = 'Vendor ID not found. Please log in again.';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEarningsData(): void {
    this.isLoading = true;
    this.loadError = '';
    
    // Load earnings overview
    this.earningsService.getEarningsOverview(this.vendorId, this.selectedPeriod)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (overview) => {
          this.earningsOverview = overview;
          this.buildEarningsCards(overview);
          this.buildChartData(overview);
          
          // Load transactions
          this.loadTransactions();
          // Load payouts
          this.loadPayoutHistory();
        },
        error: (error) => {
          console.error('Error loading earnings:', error);
          this.loadError = error.error?.message || 'Failed to load earnings data.';
        }
      });
  }

  private buildEarningsCards(overview: EarningsOverview): void {
    this.earningsCards = [
      {
        title: 'Total Earnings',
        value: this.earningsService.formatCurrency(overview.totalEarnings),
        change: this.earningsService.formatPercentChange(overview.earningsChangePercent),
        changeType: overview.earningsChangePercent >= 0 ? 'positive' : 'negative',
        icon: 'fa-wallet',
        color: 'primary'
      },
      {
        title: 'Lifetime Earnings',
        value: this.earningsService.formatCurrency(overview.lifetimeEarnings),
        change: `${overview.completedOrders} orders`,
        changeType: 'neutral',
        icon: 'fa-chart-line',
        color: 'success'
      },
      {
        title: 'Pending Payout',
        value: this.earningsService.formatCurrency(overview.pendingPayouts),
        change: this.payoutSchedule.nextPayout,
        changeType: 'neutral',
        icon: 'fa-clock',
        color: 'warning'
      },
      {
        title: 'Net Earnings',
        value: this.earningsService.formatCurrency(overview.netEarnings),
        change: `${overview.platformFeeRate}% platform fee`,
        changeType: 'neutral',
        icon: 'fa-receipt',
        color: 'info'
      }
    ];
    
    // Update payout schedule
    this.payoutSchedule.amount = overview.pendingPayouts;
  }

  private buildChartData(overview: EarningsOverview): void {
    if (overview.breakdown && overview.breakdown.length > 0) {
      this.monthlyData = overview.breakdown.map(b => ({
        month: new Date(b.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        amount: b.earnings
      }));
    }
  }

  private loadTransactions(): void {
    this.earningsService.getTransactions(this.vendorId, this.selectedTransactionType, this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.transactionPage = page;
          this.transactions = page.transactions;
        },
        error: (error) => console.error('Error loading transactions:', error)
      });
  }

  private loadPayoutHistory(): void {
    this.earningsService.getPayoutHistory(this.vendorId, 5)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payouts) => {
          this.payouts = payouts;
          if (payouts.length > 0 && payouts[0].status === 'COMPLETED') {
            const lastPayout = payouts[0];
            this.bankAccount.accountNumber = lastPayout.accountNumberMasked || '****';
            if (lastPayout.bankName) {
              this.bankAccount.bankName = lastPayout.bankName;
            }
          }
        },
        error: (error) => console.error('Error loading payouts:', error)
      });
  }

  // UI Actions
  refreshEarnings(): void {
    this.loadEarningsData();
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    this.loadEarningsData();
  }

  onTransactionTypeChange(type: string): void {
    this.selectedTransactionType = type;
    this.currentPage = 0;
    this.loadTransactions();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTransactions();
  }

  getTransactionIcon(type: string): string {
    switch(type) {
      case 'SALE': return 'fa-arrow-down';
      case 'REFUND': 
      case 'PLATFORM_FEE': return 'fa-arrow-up';
      case 'PAYOUT': return 'fa-university';
      default: return 'fa-exchange-alt';
    }
  }

  getTransactionClass(type: string): string {
    switch(type) {
      case 'SALE': return 'credit';
      case 'REFUND':
      case 'PLATFORM_FEE': return 'debit';
      default: return 'pending';
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'COMPLETED': return 'status-completed';
      case 'PENDING': return 'status-pending';
      case 'FAILED': 
      case 'REVERSED': return 'status-failed';
      default: return '';
    }
  }

  requestPayout(): void {
    if (!this.earningsOverview || this.earningsOverview.availableBalance <= 0) {
      this.snackBar.open('No balance available for payout', 'Close', { duration: 3000 });
      return;
    }

    const request: PayoutRequest = {
      vendorId: this.vendorId,
      amount: this.earningsOverview.availableBalance,
      paymentMethod: 'BANK_TRANSFER',
      remarks: 'Manual payout request'
    };

    this.earningsService.requestPayout(this.vendorId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payout) => {
          this.snackBar.open(`Payout of ${this.earningsService.formatCurrency(payout.amount)} requested successfully!`, 'Close', { duration: 3000 });
          this.loadEarningsData(); // Refresh data
        },
        error: (error) => {
          console.error('Error requesting payout:', error);
          this.snackBar.open('Failed to request payout. Please try again.', 'Close', { duration: 3000 });
        }
      });
  }

  downloadStatement(): void {
    this.earningsService.exportTransactions(this.vendorId, 'csv')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `earnings-statement-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.snackBar.open('Statement downloaded!', 'Close', { duration: 2000 });
        },
        error: (error) => {
          console.error('Error downloading statement:', error);
          this.snackBar.open('Failed to download statement.', 'Close', { duration: 3000 });
        }
      });
  }

  updateBankDetails(): void {
    this.snackBar.open('Bank details update feature coming soon!', 'Close', { duration: 3000 });
  }
}
