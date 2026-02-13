import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AnalyticsService, VendorAnalytics } from '../../../project/services/analytics.service';
import { OrderService } from '../../../project/services/order.service';
import { ProductServiceService } from '../../../project/services/product-service.service';
import { UserStateService } from '../../../project/services/user-state.service';
import { VendorDto as Vendor } from '../../../project/models/vendor';
import { MatSnackBar } from '@angular/material/snack-bar';

interface KpiItem {
  title: string;
  value: string;
  subValue?: string;
  icon: string;
  color: string;
  bgColor: string;
  trend: string;
  isPositive: boolean;
}

interface RecentOrderItem {
  id: string;
  customer: string;
  customerInitial: string;
  product: string;
  productImage?: string;
  status: string;
  amount: string;
  date: string;
  statusColor: string;
}

interface QuickAction {
  title: string;
  icon: string;
  route: string;
  color: string;
  description: string;
}

interface ActivityItem {
  icon: string;
  iconBg: string;
  title: string;
  description: string;
  time: string;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: string;
  trend: number;
  image?: string;
}

@Component({
  selector: 'app-vendor-dashboard-dashboard',
  templateUrl: './vendor-dashboard-dashboard.component.html',
  styleUrls: ['./vendor-dashboard-dashboard.component.css']
})
export class VendorDashboardDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading states
  isLoading = true;
  vendorId: string = '';
  vendorName: string = 'Vendor';
  currentTime: string = '';
  greeting: string = '';

  // Vendor analytics data
  vendorAnalytics: VendorAnalytics | null = null;

  // KPI data
  kpiData: KpiItem[] = [];

  // Recent orders
  recentOrders: RecentOrderItem[] = [];

  // Quick actions
  quickActions: QuickAction[] = [
    { title: 'Add Product', icon: 'fa-plus-circle', route: 'add-new-product', color: 'primary', description: 'List a new product' },
    { title: 'View Orders', icon: 'fa-shopping-bag', route: 'vendor-orders', color: 'success', description: 'Manage orders' },
    { title: 'Analytics', icon: 'fa-chart-line', route: 'vendor-analytics', color: 'info', description: 'View insights' },
    { title: 'Promotions', icon: 'fa-tags', route: 'vendor-promotions', color: 'warning', description: 'Create offers' },
    { title: 'Verification', icon: 'fa-id-card', route: 'vendor-verification', color: 'primary', description: 'Complete KYC process' },
    { title: 'My Shop', icon: 'fa-store', route: 'my-shop-preview', color: 'success', description: 'Preview your public shop' }
  ];

  // Recent activity
  recentActivity: ActivityItem[] = [
    { icon: 'fa-shopping-cart', iconBg: 'success', title: 'New Order Received', description: 'Order #ORD789 from Priya S.', time: '5 min ago' },
    { icon: 'fa-star', iconBg: 'warning', title: '5-Star Review', description: 'Handmade Pottery Set received 5 stars', time: '1 hour ago' },
    { icon: 'fa-box', iconBg: 'info', title: 'Product Approved', description: 'Brass Diya Set is now live', time: '3 hours ago' },
    { icon: 'fa-wallet', iconBg: 'primary', title: 'Payment Received', description: '₹12,500 credited to wallet', time: '5 hours ago' },
    { icon: 'fa-comment', iconBg: 'purple', title: 'New Message', description: 'Customer inquiry about delivery', time: '1 day ago' }
  ];

  // Top products
  topProducts: TopProduct[] = [
    { name: 'Handwoven Silk Saree', sales: 156, revenue: '₹4.68L', trend: 12 },
    { name: 'Brass Decorative Set', sales: 98, revenue: '₹1.47L', trend: 8 },
    { name: 'Terracotta Pottery', sales: 87, revenue: '₹52.2K', trend: -3 },
    { name: 'Wooden Handicrafts', sales: 72, revenue: '₹86.4K', trend: 15 }
  ];

  // Chart data
  selectedPeriod: string = '7D';
  salesChartData: number[] = [30, 50, 35, 70, 60, 80, 75];
  salesLabels: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Performance metrics
  performanceScore: number = 87;
  responseRate: number = 94;
  fulfillmentRate: number = 98;
  returnRate: number = 2.3;

  constructor(
    private router: Router,
    private analyticsService: AnalyticsService,
    private orderService: OrderService,
    private productService: ProductServiceService,
    private userStateService: UserStateService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.setGreeting();
    this.initializeVendor();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Good Morning';
    else if (hour < 17) this.greeting = 'Good Afternoon';
    else this.greeting = 'Good Evening';

    this.currentTime = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private initializeVendor(): void {
    this.userStateService.vendor$
      .pipe(takeUntil(this.destroy$))
      .subscribe((vendor: Vendor | null) => {
        if (vendor && vendor.vendorId) {
          this.vendorId = vendor.vendorId;
          this.vendorName = vendor.businessName || vendor.shoppeeName || 'Vendor';
          this.loadDashboardData();
        } else {
          this.showError('Vendor not authenticated');
          this.isLoading = false;
          this.setFallbackData();
        }
      });
  }

  private loadDashboardData(): void {
    this.isLoading = true;

    forkJoin({
      analytics: this.analyticsService.getVendorSummary(this.vendorId),
      orders: this.orderService.getOrdersByVendorId(this.vendorId),
      products: this.productService.getProductByVendorId(this.vendorId)
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ analytics, orders, products }) => {
        this.vendorAnalytics = analytics;
        const productCount = products?.length || 0;
        this.populateKpiData(analytics, productCount);
        this.populateRecentOrders(orders || []);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.showError('Failed to load dashboard data');
        this.setFallbackData();
      }
    });
  }

  private populateKpiData(analytics: VendorAnalytics, productCount: number): void {
    this.kpiData = [
      {
        title: 'Total Revenue',
        value: this.formatCurrency(analytics.totalRevenue),
        subValue: 'This month',
        icon: 'fa-wallet',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        trend: '+12.5%',
        isPositive: true
      },
      {
        title: 'Total Orders',
        value: analytics.totalOrders.toString(),
        subValue: 'All time',
        icon: 'fa-shopping-bag',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        trend: '+8.2%',
        isPositive: true
      },
      {
        title: 'Active Products',
        value: (analytics.totalProducts || productCount).toString(),
        subValue: 'In catalog',
        icon: 'fa-box-open',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        trend: '+3',
        isPositive: true
      },
      {
        title: 'Avg Rating',
        value: (analytics.averageRating || 4.5).toFixed(1),
        subValue: 'From reviews',
        icon: 'fa-star',
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.1)',
        trend: '+0.2',
        isPositive: true
      }
    ];
  }

  private populateRecentOrders(orders: any[]): void {
    this.recentOrders = orders.slice(0, 5).map(order => {
      const customerName = order.customerName || order.shippingAddress?.name || 'Customer';
      return {
        id: '#' + (order._id?.slice(-6) || order.orderId?.slice(-6) || 'N/A').toUpperCase(),
        customer: customerName,
        customerInitial: customerName.charAt(0).toUpperCase(),
        product: order.items?.[0]?.productName || 'Product',
        status: this.capitalizeFirst(order.orderStatus || 'Pending'),
        amount: this.formatCurrency(order.totalAmount || order.orderTotal || 0),
        date: this.formatDate(order.orderDate || order.createdAt),
        statusColor: this.getStatusColor(order.orderStatus)
      };
    });
  }

  private formatCurrency(value: number): string {
    if (value >= 10000000) {
      return '₹' + (value / 10000000).toFixed(2) + ' Cr';
    } else if (value >= 100000) {
      return '₹' + (value / 100000).toFixed(2) + ' L';
    } else if (value >= 1000) {
      return '₹' + (value / 1000).toFixed(1) + 'K';
    }
    return '₹' + value.toLocaleString('en-IN');
  }

  private formatDate(dateStr: string | Date): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  private getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'delivered';
      case 'shipped': return 'shipped';
      case 'cancelled': return 'cancelled';
      case 'processing': return 'processing';
      default: return 'pending';
    }
  }

  private setFallbackData(): void {
    this.kpiData = [
      { title: 'Total Revenue', value: '₹0', subValue: 'This month', icon: 'fa-wallet', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', trend: '0%', isPositive: true },
      { title: 'Total Orders', value: '0', subValue: 'All time', icon: 'fa-shopping-bag', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', trend: '0%', isPositive: true },
      { title: 'Active Products', value: '0', subValue: 'In catalog', icon: 'fa-box-open', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', trend: '0', isPositive: true },
      { title: 'Avg Rating', value: '0.0', subValue: 'From reviews', icon: 'fa-star', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)', trend: '0', isPositive: true }
    ];
    this.recentOrders = [];
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }

  selectPeriod(period: string): void {
    this.selectedPeriod = period;
  }

  viewOrder(orderId: string): void {
    console.log('View order:', orderId);
  }

  navigateTo(route: string): void {
    if (route === 'my-shop-preview') {
      if (this.vendorId) {
        window.open(`/shop/${this.vendorId}`, '_blank');
      }
      return;
    }
    this.router.navigate(['/vendor-dashboard', route]);
  }

  getMaxSalesValue(): number {
    return Math.max(...this.salesChartData);
  }

  getBarHeight(value: number): number {
    const max = this.getMaxSalesValue();
    return max > 0 ? (value / max) * 100 : 0;
  }
}
