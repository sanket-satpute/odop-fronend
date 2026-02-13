import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

interface AnalyticCard {
  icon: string;
  title: string;
  value: string | number;
  subtitle: string;
  trend: number;
  color: string;
}

interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

interface MonthlySpend {
  month: string;
  amount: number;
}

@Component({
  selector: 'app-customer-analytics-dialog',
  templateUrl: './customer-analytics-dialog.component.html',
  styleUrls: ['./customer-analytics-dialog.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition(':enter', [
        query('.analytics-card', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, [
            animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class CustomerAnalyticsDialogComponent implements OnInit {
  
  analyticsCards: AnalyticCard[] = [];
  spendingCategories: SpendingCategory[] = [];
  monthlySpending: MonthlySpend[] = [];
  
  totalSpent: number = 0;
  totalOrders: number = 0;
  avgOrderValue: number = 0;
  
  selectedPeriod: string = '6months';
  
  constructor(
    private dialogRef: MatDialogRef<CustomerAnalyticsDialogComponent>,
    private userStateService: UserStateService
  ) {}

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  loadAnalyticsData(): void {
    const customer = this.userStateService.customer;
    
    if (customer) {
      // Calculate real data from customer
      const orders = customer.orders || [];
      const cart = customer.cartProductIds || [];
      const wishlist = customer.wishlistProductIds || [];
      
      this.totalOrders = orders.length;
      this.totalSpent = this.calculateTotalSpent(orders);
      this.avgOrderValue = this.totalOrders > 0 ? this.totalSpent / this.totalOrders : 0;
      
      // Build analytics cards
      this.analyticsCards = [
        {
          icon: 'fas fa-shopping-bag',
          title: 'Total Orders',
          value: this.totalOrders,
          subtitle: 'All time orders',
          trend: 12,
          color: '#3B82F6'
        },
        {
          icon: 'fas fa-rupee-sign',
          title: 'Total Spent',
          value: '₹' + this.formatNumber(this.totalSpent),
          subtitle: 'Lifetime spending',
          trend: 8,
          color: '#10B981'
        },
        {
          icon: 'fas fa-chart-line',
          title: 'Avg. Order Value',
          value: '₹' + this.formatNumber(this.avgOrderValue),
          subtitle: 'Per order average',
          trend: 5,
          color: '#F59E0B'
        },
        {
          icon: 'fas fa-heart',
          title: 'Wishlist Items',
          value: wishlist.length,
          subtitle: 'Saved for later',
          trend: 0,
          color: '#EF4444'
        },
        {
          icon: 'fas fa-shopping-cart',
          title: 'Cart Items',
          value: cart.length,
          subtitle: 'Ready to checkout',
          trend: 0,
          color: '#8B5CF6'
        },
        {
          icon: 'fas fa-star',
          title: 'Loyalty Points',
          value: this.calculateLoyaltyPoints(),
          subtitle: 'Earned rewards',
          trend: 15,
          color: '#EC4899'
        }
      ];
      
      // Generate spending categories
      this.generateSpendingCategories();
      
      // Generate monthly spending data
      this.generateMonthlySpending();
    }
  }

  calculateTotalSpent(orders: any[]): number {
    if (!orders || orders.length === 0) return 0;
    return orders.reduce((total, order) => {
      const orderTotal = order.totalAmount || order.total || 0;
      return total + orderTotal;
    }, 0);
  }

  calculateLoyaltyPoints(): number {
    // 1 point for every ₹100 spent
    return Math.floor(this.totalSpent / 100);
  }

  generateSpendingCategories(): void {
    // Sample categories - in real app, this would come from order data analysis
    const total = this.totalSpent || 10000;
    
    this.spendingCategories = [
      {
        name: 'Handicrafts',
        amount: Math.round(total * 0.35),
        percentage: 35,
        color: '#3B82F6',
        icon: 'fas fa-paint-brush'
      },
      {
        name: 'Textiles',
        amount: Math.round(total * 0.25),
        percentage: 25,
        color: '#10B981',
        icon: 'fas fa-tshirt'
      },
      {
        name: 'Food Products',
        amount: Math.round(total * 0.20),
        percentage: 20,
        color: '#F59E0B',
        icon: 'fas fa-utensils'
      },
      {
        name: 'Home Decor',
        amount: Math.round(total * 0.12),
        percentage: 12,
        color: '#8B5CF6',
        icon: 'fas fa-home'
      },
      {
        name: 'Others',
        amount: Math.round(total * 0.08),
        percentage: 8,
        color: '#6B7280',
        icon: 'fas fa-box'
      }
    ];
  }

  generateMonthlySpending(): void {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseAmount = this.totalSpent / 6 || 1500;
    
    this.monthlySpending = months.map((month, index) => ({
      month,
      amount: Math.round(baseAmount * (0.6 + Math.random() * 0.8))
    }));
  }

  getMaxMonthlySpend(): number {
    if (this.monthlySpending.length === 0) return 1;
    return Math.max(...this.monthlySpending.map(m => m.amount));
  }

  getBarHeight(amount: number): number {
    const max = this.getMaxMonthlySpend();
    return (amount / max) * 100;
  }

  formatNumber(num: number): string {
    if (num >= 100000) {
      return (num / 100000).toFixed(1) + 'L';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  }

  changePeriod(period: string): void {
    this.selectedPeriod = period;
    // In real app, reload data based on selected period
    this.loadAnalyticsData();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  downloadReport(): void {
    // In real app, generate and download PDF report
    alert('Report download feature coming soon!');
  }
}
