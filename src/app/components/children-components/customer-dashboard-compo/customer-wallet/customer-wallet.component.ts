import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { WalletService, Wallet, WalletTransaction as APIWalletTransaction } from 'src/app/project/services/wallet.service';
import { AddMoneyDialogComponent, AddMoneyDialogResult } from '../../../dialogs/add-money-dialog/add-money-dialog.component';
import { WithdrawFundsDialogComponent, WithdrawFundsDialogResult } from '../../../dialogs/withdraw-funds-dialog/withdraw-funds-dialog.component';
import { ApplyVoucherDialogComponent, ApplyVoucherDialogResult } from '../../../dialogs/apply-voucher-dialog/apply-voucher-dialog.component';
import { ViewOffersDialogComponent } from '../../../dialogs/view-offers-dialog/view-offers-dialog.component';

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: string;
  rawAmount: number;
  type: 'wallet' | 'reward' | 'refund' | 'referral' | 'voucher' | 'cashback';
  typeLabel: string;
  amountClass: 'credit' | 'debit';
  icon: string;
  status: 'completed' | 'pending' | 'failed';
}

interface MilestoneTier {
  name: string;
  minSpend: number;
  maxSpend: number;
  reward: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-customer-wallet',
  templateUrl: './customer-wallet.component.html',
  styleUrls: ['./customer-wallet.component.css']
})
export class CustomerWalletComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Wallet Data
  wallet: Wallet | null = null;
  walletBalance: number = 0;
  rewardCredits: number = 0;
  referralCode: string = '';
  totalSpending: number = 0;
  membershipTier: string = 'bronze';
  
  // Progress tracking
  progressPercentage: number = 0;
  currentSpending: number = 0;
  targetSpending: number = 5000;
  nextReward: number = 200;
  
  // Transactions
  recentTransactions: Transaction[] = [];
  allTransactions: Transaction[] = [];
  
  // State
  isLoading: boolean = true;
  loadError: string = '';
  isProcessing: boolean = false;
  isWalletEmpty: boolean = false;
  showAllTransactions: boolean = false;

  // Milestone tiers
  milestoneTiers: MilestoneTier[] = [
    { name: 'Bronze', minSpend: 0, maxSpend: 5000, reward: 200, icon: 'fas fa-medal', color: '#CD7F32' },
    { name: 'Silver', minSpend: 5000, maxSpend: 15000, reward: 500, icon: 'fas fa-award', color: '#C0C0C0' },
    { name: 'Gold', minSpend: 15000, maxSpend: 35000, reward: 1000, icon: 'fas fa-crown', color: '#FFD700' },
    { name: 'Platinum', minSpend: 35000, maxSpend: 100000, reward: 2500, icon: 'fas fa-gem', color: '#E5E4E2' }
  ];

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private userStateService: UserStateService,
    private walletService: WalletService
  ) {}

  ngOnInit(): void {
    this.loadWalletData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load wallet data from API
   */
  loadWalletData(): void {
    this.isLoading = true;
    this.loadError = '';

    const customer = this.userStateService.customer;
    if (!customer?.customerId) {
      this.wallet = null;
      this.walletBalance = 0;
      this.rewardCredits = 0;
      this.totalSpending = 0;
      this.recentTransactions = [];
      this.allTransactions = [];
      this.isWalletEmpty = true;
      this.isLoading = false;
      this.loadError = 'Customer account not found. Please sign in again.';
      return;
    }
    
    // Load from API
    this.walletService.getWallet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (wallet) => {
          this.wallet = wallet;
          this.walletBalance = wallet.balance;
          
          // Map API transactions to display format
          if (wallet.transactions && wallet.transactions.length > 0) {
            this.loadTransactionsFromAPI(wallet.transactions);
          } else {
            this.allTransactions = [];
            this.recentTransactions = [];
          }
          
          // Load additional data from UserStateService
          if (customer) {
            this.rewardCredits = customer.rewardCredits || 0;
            this.totalSpending = customer.totalSpending || 0;
            this.referralCode = customer.referralCode || this.generateReferralCode(customer.customerId || '');
            this.membershipTier = customer.membershipTier || 'bronze';
          }
          
          // Calculate progress
          this.calculateProgress();
          
          // Check wallet status
          this.isWalletEmpty = this.walletBalance <= 0 && this.rewardCredits <= 0;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading wallet:', error);
          this.loadError = 'Failed to load wallet. Please try again.';
          this.wallet = null;
          this.walletBalance = 0;
          this.rewardCredits = 0;
          this.totalSpending = 0;
          this.recentTransactions = [];
          this.allTransactions = [];
          this.isWalletEmpty = true;
          this.isLoading = false;

          this.snackBar.open('Failed to load wallet data', 'Retry', { duration: 4000 })
            .onAction().subscribe(() => this.loadWalletData());
        }
      });
  }

  /**
   * Load transactions from API response
   */
  loadTransactionsFromAPI(apiTransactions: APIWalletTransaction[]): void {
    this.allTransactions = apiTransactions.map(tx => this.mapAPITransaction(tx));
    this.allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.recentTransactions = this.allTransactions.slice(0, 5);
  }

  /**
   * Map API transaction to display format
   */
  mapAPITransaction(tx: APIWalletTransaction): Transaction {
    const iconMap: { [key: string]: string } = {
      'credit': 'fas fa-plus-circle',
      'debit': 'fas fa-minus-circle',
      'refund': 'fas fa-undo',
      'cashback': 'fas fa-coins',
      'bonus': 'fas fa-gift',
      'topup': 'fas fa-wallet'
    };

    const labelMap: { [key: string]: string } = {
      'credit': 'Credit',
      'debit': 'Payment',
      'refund': 'Refund',
      'cashback': 'Cashback',
      'bonus': 'Bonus',
      'topup': 'Top-up'
    };

    const typeMap: { [key: string]: Transaction['type'] } = {
      'credit': 'wallet',
      'debit': 'wallet',
      'refund': 'refund',
      'cashback': 'cashback',
      'bonus': 'reward',
      'topup': 'wallet'
    };

    const isCredit = ['credit', 'refund', 'cashback', 'bonus', 'topup'].includes(tx.type);

    return {
      id: tx.transactionId,
      date: new Date(tx.timestamp),
      description: tx.description,
      amount: isCredit ? `+₹${tx.amount.toLocaleString('en-IN')}` : `-₹${tx.amount.toLocaleString('en-IN')}`,
      rawAmount: tx.amount,
      type: typeMap[tx.type] || 'wallet',
      typeLabel: labelMap[tx.type] || tx.type,
      amountClass: isCredit ? 'credit' : 'debit',
      icon: iconMap[tx.type] || 'fas fa-wallet',
      status: tx.status as 'completed' | 'pending' | 'failed'
    };
  }

  /**
   * Generate referral code from customer ID
   */
  generateReferralCode(customerId: string): string {
    const prefix = 'ODOP';
    const suffix = customerId.substring(0, 6).toUpperCase() || 'NEW100';
    return `${prefix}${suffix}`;
  }

  /**
   * Calculate spending progress towards next milestone
   */
  calculateProgress(): void {
    const currentTier = this.milestoneTiers.find(tier => 
      this.totalSpending >= tier.minSpend && this.totalSpending < tier.maxSpend
    ) || this.milestoneTiers[0];
    
    const nextTier = this.milestoneTiers.find(tier => tier.minSpend > this.totalSpending);
    
    if (nextTier) {
      this.targetSpending = nextTier.minSpend;
      this.nextReward = nextTier.reward;
      this.currentSpending = this.totalSpending;
      
      const tierRange = nextTier.minSpend - currentTier.minSpend;
      const progressInTier = this.totalSpending - currentTier.minSpend;
      this.progressPercentage = Math.min(100, Math.round((progressInTier / tierRange) * 100));
    } else {
      this.progressPercentage = 100;
      this.currentSpending = this.totalSpending;
      this.targetSpending = this.totalSpending;
      this.nextReward = 0;
    }
  }

  // Format methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(amount: number): string {
    return amount.toLocaleString('en-IN');
  }

  // Action methods
  addMoney(): void {
    const dialogRef = this.dialog.open(AddMoneyDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'add-money-dialog-panel',
      disableClose: false,
      data: {
        currentBalance: this.walletBalance
      }
    });

    dialogRef.afterClosed().subscribe((result: AddMoneyDialogResult) => {
      if (result && result.amount) {
        this.processAddMoney(result.amount);
      }
    });
  }

  processAddMoney(amount: number): void {
    this.isProcessing = true;
    
    this.walletService.addMoney(amount, 'Wallet Top-up')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (wallet) => {
          this.wallet = wallet;
          this.walletBalance = wallet.balance;
          
          // Update transactions
          if (wallet.transactions) {
            this.loadTransactionsFromAPI(wallet.transactions);
          }
          
          this.isWalletEmpty = false;
          this.isProcessing = false;

          this.snackBar.open(`₹${amount.toLocaleString('en-IN')} added to your wallet!`, 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Error adding money:', error);
          this.isProcessing = false;

          this.snackBar.open('Unable to add money right now. Please try again.', 'Close', {
            duration: 3500,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  withdrawFunds(): void {
    if (this.walletBalance <= 0) {
      this.snackBar.open('Insufficient wallet balance for withdrawal', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    const dialogRef = this.dialog.open(WithdrawFundsDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'withdraw-funds-dialog-panel',
      disableClose: false,
      data: {
        currentBalance: this.walletBalance
      }
    });

    dialogRef.afterClosed().subscribe((result: WithdrawFundsDialogResult) => {
      if (result && result.amount) {
        this.processWithdraw(result.amount, result.withdrawMethod);
      }
    });
  }

  processWithdraw(amount: number, method?: string): void {
    this.isProcessing = true;

    this.walletService.withdrawFunds(amount, method)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (wallet) => {
          this.wallet = wallet;
          this.walletBalance = wallet.balance;
          if (wallet.transactions) {
            this.loadTransactionsFromAPI(wallet.transactions);
          }
          this.isWalletEmpty = this.walletBalance <= 0 && this.rewardCredits <= 0;
          this.isProcessing = false;

          this.snackBar.open(`Withdrawal of ₹${amount.toLocaleString('en-IN')} initiated.`, 'Close', {
            duration: 3500,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Error withdrawing funds:', error);
          this.isProcessing = false;
          const message = error?.error?.error || 'Unable to process withdrawal right now.';
          this.snackBar.open(message, 'Close', {
            duration: 3500,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  applyVoucher(): void {
    const customer = this.userStateService.customer;
    const appliedVouchers = customer?.appliedVouchers || [];

    const dialogRef = this.dialog.open(ApplyVoucherDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'apply-voucher-dialog-panel',
      disableClose: false,
      data: {
        currentBalance: this.rewardCredits,
        appliedVouchers: appliedVouchers
      }
    });

    dialogRef.afterClosed().subscribe((result: ApplyVoucherDialogResult) => {
      if (result && result.voucherCode) {
        this.processVoucherFromDialog(result.voucherCode, result.discountAmount);
      }
    });
  }

  processVoucherFromDialog(code: string, rewardAmount: number): void {
    this.isProcessing = true;

    this.walletService.applyVoucherBonus(code, rewardAmount)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (wallet) => {
          this.wallet = wallet;
          this.walletBalance = wallet.balance;
          if (wallet.transactions) {
            this.loadTransactionsFromAPI(wallet.transactions);
          }
          this.isWalletEmpty = this.walletBalance <= 0 && this.rewardCredits <= 0;
          this.isProcessing = false;

          this.snackBar.open(`Voucher applied! ₹${rewardAmount} added to wallet`, 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Error applying voucher:', error);
          this.isProcessing = false;
          const message = error?.error?.error || 'Unable to apply voucher right now.';
          this.snackBar.open(message, 'Close', {
            duration: 3500,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  useRewards(): void {
    if (this.rewardCredits <= 0) {
      this.snackBar.open('No reward credits available', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    // Navigate to products or checkout
    this.snackBar.open(`You have ₹${this.formatNumber(this.rewardCredits)} rewards. Use them at checkout!`, 'View Products', {
      duration: 4000,
      panelClass: ['info-snackbar']
    }).onAction().subscribe(() => {
      this.router.navigate(['/products']);
    });
  }

  viewOffers(): void {
    this.dialog.open(ViewOffersDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      panelClass: 'view-offers-dialog-panel',
      disableClose: false
    });
  }

  copyReferralCode(): void {
    if (navigator.clipboard && this.referralCode) {
      navigator.clipboard.writeText(this.referralCode).then(() => {
        this.snackBar.open('Referral code copied to clipboard!', 'Close', {
          duration: 2000,
          panelClass: ['success-snackbar']
        });
      }).catch(() => {
        this.fallbackCopyCode();
      });
    } else {
      this.fallbackCopyCode();
    }
  }

  fallbackCopyCode(): void {
    const textArea = document.createElement('textarea');
    textArea.value = this.referralCode;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    this.snackBar.open('Referral code copied!', 'Close', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  viewAllTransactions(): void {
    this.showAllTransactions = !this.showAllTransactions;
    if (this.showAllTransactions) {
      this.recentTransactions = this.allTransactions;
    } else {
      this.recentTransactions = this.allTransactions.slice(0, 5);
    }
  }

  addFundsNow(): void {
    this.addMoney();
  }

  shareReferralCode(): void {
    const shareText = `Join ODOP and get ₹100 off your first order! Use my referral code: ${this.referralCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'ODOP Referral',
        text: shareText,
        url: window.location.origin
      }).catch(() => {
        this.copyReferralCode();
      });
    } else {
      this.copyReferralCode();
    }
  }

  // Get current tier info
  getCurrentTier(): MilestoneTier {
    return this.milestoneTiers.find(tier => 
      this.totalSpending >= tier.minSpend && this.totalSpending < tier.maxSpend
    ) || this.milestoneTiers[0];
  }

  getNextTier(): MilestoneTier | null {
    return this.milestoneTiers.find(tier => tier.minSpend > this.totalSpending) || null;
  }
}
