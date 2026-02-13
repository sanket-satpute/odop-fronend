import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AnalyticsService, VendorAnalytics, ProductPerformance, TimeSeriesData } from '../../../project/services/analytics.service';
import { OrderService } from '../../../project/services/order.service';
import { UserStateService } from '../../../project/services/user-state.service';
import { VendorDto as Vendor } from '../../../project/models/vendor';
import { MatSnackBar } from '@angular/material/snack-bar';

Chart.register(...registerables);

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  prefix?: string;
  suffix?: string;
}

interface TopProduct {
  id: string;
  name: string;
  category: string;
  image: string;
  unitsSold: number;
  revenue: number;
  trend: number;
  rating: number;
  stock: number;
  views: number;
}

interface Activity {
  id: string;
  type: 'order' | 'delivery' | 'alert' | 'review' | 'return';
  message: string;
  timestamp: Date;
  amount?: number;
  customer?: string;
}

interface InsightCard {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  description: string;
  action?: string;
  actionLabel?: string;
}

interface TimeRange {
  id: string;
  label: string;
  days: number;
}

interface RegionalData {
  region: string;
  revenue: number;
  orders: number;
  percentage: number;
  growth: number;
}

interface ChannelData {
  channel: string;
  revenue: number;
  orders: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-vendor-dashboard-analytics',
  templateUrl: './vendor-dashboard-analytics.component.html',
  styleUrls: ['./vendor-dashboard-analytics.component.css']
})
export class VendorDashboardAnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueChart', { static: false }) revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ordersChart', { static: false }) ordersChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('channelChart', { static: false }) channelChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trafficChart', { static: false }) trafficChartRef!: ElementRef<HTMLCanvasElement>;
  
  private revenueChart: Chart | null = null;
  private ordersChart: Chart | null = null;
  private channelChart: Chart | null = null;
  private trafficChart: Chart | null = null;
  private destroy$ = new Subject<void>();

  // Loading states
  isLoading = true;
  isExporting = false;
  vendorId: string = '';

  // Time ranges
  timeRanges: TimeRange[] = [
    { id: 'today', label: 'Today', days: 1 },
    { id: 'week', label: 'This Week', days: 7 },
    { id: 'month', label: 'This Month', days: 30 },
    { id: 'quarter', label: 'This Quarter', days: 90 },
    { id: 'year', label: 'This Year', days: 365 },
    { id: 'custom', label: 'Custom Range', days: 0 }
  ];
  selectedTimeRange: string = 'month';
  showDatePicker = false;
  customStartDate: string = '';
  customEndDate: string = '';

  // Comparison toggle
  showComparison = true;
  comparisonPeriod: 'previous' | 'lastYear' = 'previous';

  // Metric cards
  metricCards: MetricCard[] = [];

  // Chart view modes
  revenueChartView: 'area' | 'bar' | 'line' = 'area';
  ordersChartView: 'bar' | 'line' = 'bar';

  // Tab management
  activeSection: 'overview' | 'products' | 'customers' | 'traffic' = 'overview';

  // Top products
  topProducts: TopProduct[] = [];
  productSortBy: 'revenue' | 'units' | 'rating' | 'views' = 'revenue';
  productSortOrder: 'asc' | 'desc' = 'desc';

  // Recent activities
  recentActivities: Activity[] = [];
  activityFilter: 'all' | 'orders' | 'deliveries' | 'alerts' = 'all';

  // Insights
  insights: InsightCard[] = [];

  // Regional data
  regionalData: RegionalData[] = [];

  // Channel data
  channelData: ChannelData[] = [];

  // Customer metrics
  customerMetrics = {
    totalCustomers: 2456,
    newCustomers: 389,
    returningCustomers: 1567,
    averageOrderValue: 2456,
    customerLifetimeValue: 12500,
    repeatPurchaseRate: 68,
    cartAbandonmentRate: 23,
    averageRating: 4.8
  };

  // Traffic metrics
  trafficMetrics = {
    totalVisits: 45678,
    uniqueVisitors: 32456,
    pageViews: 125000,
    bounceRate: 35.5,
    avgSessionDuration: '3m 45s',
    conversionRate: 3.2
  };

  // Chart data
  revenueData: number[] = [];
  revenueLabels: string[] = [];
  ordersData: number[] = [];
  ordersLabels: string[] = [];
  trafficData: number[] = [];
  trafficLabels: string[] = [];

  // Vendor analytics
  vendorAnalytics: VendorAnalytics | null = null;

  constructor(
    private analyticsService: AnalyticsService,
    private orderService: OrderService,
    private userStateService: UserStateService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.initializeVendor();
    this.initializeMockData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  private initializeVendor(): void {
    this.userStateService.vendor$
      .pipe(takeUntil(this.destroy$))
      .subscribe((vendor: Vendor | null) => {
        if (vendor && vendor.vendorId) {
          this.vendorId = vendor.vendorId;
          this.loadAnalyticsData();
        } else {
          this.isLoading = false;
        }
      });
  }

  private loadAnalyticsData(): void {
    this.isLoading = true;

    forkJoin({
      analytics: this.analyticsService.getVendorSummary(this.vendorId),
      recentOrders: this.orderService.getOrdersByVendorId(this.vendorId)
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ analytics, recentOrders }) => {
        this.vendorAnalytics = analytics;
        this.topProducts = this.mapProductPerformance(analytics.productPerformance || []);
        this.recentActivities = this.mapOrdersToActivities(recentOrders || []);
        this.updateChartData(analytics);
        this.updateMetricCards(analytics);
        this.generateInsights(analytics);
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.showNotification('Using demo data for preview', 'info');
      }
    });
  }

  private initializeMockData(): void {
    // Initialize metric cards
    this.metricCards = [
      {
        id: 'revenue',
        title: 'Total Revenue',
        value: 4523000,
        change: 18.5,
        changeLabel: 'vs last period',
        icon: 'revenue',
        color: 'success',
        prefix: '₹'
      },
      {
        id: 'orders',
        title: 'Total Orders',
        value: 1247,
        change: 12.3,
        changeLabel: 'vs last period',
        icon: 'orders',
        color: 'primary'
      },
      {
        id: 'conversion',
        title: 'Conversion Rate',
        value: 3.2,
        change: 8.7,
        changeLabel: 'vs last period',
        icon: 'conversion',
        color: 'info',
        suffix: '%'
      },
      {
        id: 'aov',
        title: 'Avg Order Value',
        value: 3628,
        change: 5.2,
        changeLabel: 'vs last period',
        icon: 'aov',
        color: 'purple',
        prefix: '₹'
      },
      {
        id: 'customers',
        title: 'New Customers',
        value: 389,
        change: 24.5,
        changeLabel: 'vs last period',
        icon: 'customers',
        color: 'warning'
      },
      {
        id: 'rating',
        title: 'Avg Rating',
        value: 4.8,
        change: 2.1,
        changeLabel: 'vs last period',
        icon: 'rating',
        color: 'success',
        suffix: '/5'
      }
    ];

    // Initialize chart data
    this.revenueLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.revenueData = [320000, 380000, 420000, 390000, 450000, 520000, 480000, 560000, 620000, 580000, 640000, 720000];
    
    this.ordersLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    this.ordersData = [145, 178, 165, 189, 234, 287, 256];

    this.trafficLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
    this.trafficData = [120, 85, 340, 520, 680, 450];

    // Initialize top products
    this.topProducts = [
      { id: '1', name: 'Handwoven Banarasi Silk Saree', category: 'Textiles', image: '', unitsSold: 456, revenue: 1824000, trend: 23, rating: 4.9, stock: 45, views: 8900 },
      { id: '2', name: 'Brass Diya Set (12 pieces)', category: 'Home Decor', image: '', unitsSold: 892, revenue: 356800, trend: 18, rating: 4.7, stock: 120, views: 6700 },
      { id: '3', name: 'Madhubani Painting - Large', category: 'Art', image: '', unitsSold: 234, revenue: 468000, trend: 15, rating: 4.8, stock: 28, views: 5400 },
      { id: '4', name: 'Pashmina Shawl - Pure Wool', category: 'Textiles', image: '', unitsSold: 178, revenue: 534000, trend: -5, rating: 4.9, stock: 15, views: 4200 },
      { id: '5', name: 'Blue Pottery Vase Set', category: 'Pottery', image: '', unitsSold: 567, revenue: 283500, trend: 12, rating: 4.6, stock: 89, views: 3800 },
      { id: '6', name: 'Kanjeevaram Silk Dupatta', category: 'Textiles', image: '', unitsSold: 345, revenue: 517500, trend: 8, rating: 4.8, stock: 56, views: 3200 }
    ];

    // Initialize recent activities
    this.recentActivities = [
      { id: '1', type: 'order', message: 'New order #ORD-7845 received from Priya Sharma', timestamp: new Date(Date.now() - 300000), amount: 4500, customer: 'Priya Sharma' },
      { id: '2', type: 'delivery', message: 'Order #ORD-7832 delivered successfully', timestamp: new Date(Date.now() - 900000), amount: 8900, customer: 'Rahul Gupta' },
      { id: '3', type: 'review', message: 'New 5-star review for Banarasi Silk Saree', timestamp: new Date(Date.now() - 1800000) },
      { id: '4', type: 'alert', message: 'Low stock alert: Pashmina Shawl (15 units left)', timestamp: new Date(Date.now() - 3600000) },
      { id: '5', type: 'order', message: 'New order #ORD-7844 received from Ankit Jain', timestamp: new Date(Date.now() - 5400000), amount: 12500, customer: 'Ankit Jain' },
      { id: '6', type: 'return', message: 'Return request initiated for Order #ORD-7801', timestamp: new Date(Date.now() - 7200000) }
    ];

    // Initialize insights
    this.insights = [
      { id: '1', type: 'success', title: 'Sales Surge Detected', description: 'Your Banarasi Silk Saree sales have increased by 45% this week. Consider restocking soon!', action: 'restockProduct', actionLabel: 'Restock Now' },
      { id: '2', type: 'tip', title: 'Optimize Product Images', description: 'Products with high-quality images get 3x more views. Update images for Blue Pottery Vase.', action: 'editProduct', actionLabel: 'Edit Product' },
      { id: '3', type: 'warning', title: 'Low Stock Alert', description: '3 products are running low on stock. Restock to avoid losing sales.', action: 'viewInventory', actionLabel: 'View Inventory' },
      { id: '4', type: 'info', title: 'Weekend Traffic Peak', description: 'Your store sees 40% more traffic on weekends. Schedule promotions accordingly.', action: 'createPromotion', actionLabel: 'Create Promotion' }
    ];

    // Initialize regional data
    this.regionalData = [
      { region: 'Maharashtra', revenue: 1250000, orders: 342, percentage: 28, growth: 15 },
      { region: 'Delhi NCR', revenue: 980000, orders: 268, percentage: 22, growth: 12 },
      { region: 'Karnataka', revenue: 650000, orders: 178, percentage: 14, growth: 8 },
      { region: 'Gujarat', revenue: 520000, orders: 145, percentage: 12, growth: 18 },
      { region: 'Tamil Nadu', revenue: 480000, orders: 132, percentage: 11, growth: 5 },
      { region: 'Others', revenue: 643000, orders: 182, percentage: 13, growth: 10 }
    ];

    // Initialize channel data
    this.channelData = [
      { channel: 'Direct', revenue: 1800000, orders: 480, percentage: 40, color: '#f59e0b' },
      { channel: 'Organic Search', revenue: 1125000, orders: 310, percentage: 25, color: '#10b981' },
      { channel: 'Social Media', revenue: 900000, orders: 248, percentage: 20, color: '#3b82f6' },
      { channel: 'Referral', revenue: 450000, orders: 125, percentage: 10, color: '#8b5cf6' },
      { channel: 'Paid Ads', revenue: 248000, orders: 84, percentage: 5, color: '#ef4444' }
    ];
  }

  private mapProductPerformance(performance: ProductPerformance[]): TopProduct[] {
    return performance.slice(0, 10).map((p, index) => ({
      id: p.productId,
      name: p.productName,
      category: 'Product',
      image: '',
      unitsSold: p.totalQuantity,
      revenue: p.totalRevenue,
      trend: this.calculateTrend(index),
      rating: 4.5 + Math.random() * 0.5,
      stock: Math.floor(Math.random() * 100) + 10,
      views: Math.floor(Math.random() * 5000) + 1000
    }));
  }

  private mapOrdersToActivities(orders: any[]): Activity[] {
    return orders.slice(0, 10).map(order => ({
      id: order._id || order.id,
      type: this.getActivityType(order.orderStatus),
      message: this.getActivityMessage(order),
      timestamp: new Date(order.orderDate || order.createdAt),
      amount: order.totalAmount,
      customer: order.customerName
    }));
  }

  private getActivityType(status: string): 'order' | 'delivery' | 'alert' | 'review' | 'return' {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'delivery';
      case 'cancelled': 
      case 'returned': return 'return';
      default: return 'order';
    }
  }

  private getActivityMessage(order: any): string {
    const status = order.orderStatus?.toLowerCase();
    const orderId = order._id?.slice(-6) || order.id?.slice(-6) || 'N/A';
    
    switch (status) {
      case 'delivered': return `Order #${orderId} delivered successfully`;
      case 'shipped': return `Order #${orderId} has been shipped`;
      case 'cancelled': return `Order #${orderId} was cancelled`;
      case 'returned': return `Return request for Order #${orderId}`;
      default: return `New order #${orderId} received`;
    }
  }

  private calculateTrend(index: number): number {
    const trends = [23, 18, 15, -5, 12, 8, 3, -2, 7, 1];
    return trends[index] || 0;
  }

  private updateChartData(analytics: VendorAnalytics): void {
    if (analytics.salesByMonth && analytics.salesByMonth.length > 0) {
      this.revenueLabels = analytics.salesByMonth.map(d => d.period || d.label || '');
      this.revenueData = analytics.salesByMonth.map(d => d.value);
    }
    this.refreshCharts();
  }

  private updateMetricCards(analytics: VendorAnalytics): void {
    if (analytics) {
      const revenueCard = this.metricCards.find(c => c.id === 'revenue');
      if (revenueCard && analytics.totalRevenue) {
        revenueCard.value = analytics.totalRevenue;
      }
      const ordersCard = this.metricCards.find(c => c.id === 'orders');
      if (ordersCard && analytics.totalOrders) {
        ordersCard.value = analytics.totalOrders;
      }
    }
  }

  private generateInsights(analytics: VendorAnalytics): void {
    // Generate dynamic insights based on analytics data
  }

  private initializeCharts(): void {
    this.initRevenueChart();
    this.initOrdersChart();
    this.initChannelChart();
    this.initTrafficChart();
  }

  private initRevenueChart(): void {
    if (!this.revenueChartRef?.nativeElement) return;

    const ctx = this.revenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
    gradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

    this.revenueChart = new Chart(ctx, {
      type: this.revenueChartView === 'bar' ? 'bar' : 'line',
      data: {
        labels: this.revenueLabels,
        datasets: [{
          label: 'Revenue',
          data: this.revenueData,
          borderColor: '#f59e0b',
          backgroundColor: this.revenueChartView === 'bar' ? 'rgba(245, 158, 11, 0.8)' : gradient,
          borderWidth: 3,
          fill: this.revenueChartView === 'area',
          tension: 0.4,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 16,
            cornerRadius: 12,
            displayColors: false,
            callbacks: {
              label: (context) => `₹${context.parsed.y.toLocaleString('en-IN')}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { weight: 500 } }
          },
          y: {
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: {
              color: '#64748b',
              callback: (value) => `₹${(Number(value) / 1000).toFixed(0)}K`
            }
          }
        }
      }
    });
  }

  private initOrdersChart(): void {
    if (!this.ordersChartRef?.nativeElement) return;

    const ctx = this.ordersChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.ordersChart = new Chart(ctx, {
      type: this.ordersChartView,
      data: {
        labels: this.ordersLabels,
        datasets: [{
          label: 'Orders',
          data: this.ordersData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderWidth: 2,
          borderRadius: 8,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748b' } },
          y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#64748b' } }
        }
      }
    });
  }

  private initChannelChart(): void {
    if (!this.channelChartRef?.nativeElement) return;

    const ctx = this.channelChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.channelChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.channelData.map(c => c.channel),
        datasets: [{
          data: this.channelData.map(c => c.percentage),
          backgroundColor: this.channelData.map(c => c.color),
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed}%`
            }
          }
        }
      }
    });
  }

  private initTrafficChart(): void {
    if (!this.trafficChartRef?.nativeElement) return;

    const ctx = this.trafficChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

    this.trafficChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.trafficLabels,
        datasets: [{
          label: 'Visitors',
          data: this.trafficData,
          borderColor: '#8b5cf6',
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748b' } },
          y: { display: false }
        }
      }
    });
  }

  private destroyCharts(): void {
    this.revenueChart?.destroy();
    this.ordersChart?.destroy();
    this.channelChart?.destroy();
    this.trafficChart?.destroy();
  }

  private refreshCharts(): void {
    this.destroyCharts();
    setTimeout(() => this.initializeCharts(), 50);
  }

  // Public methods
  onTimeRangeChange(rangeId: string): void {
    this.selectedTimeRange = rangeId;
    if (rangeId === 'custom') {
      this.showDatePicker = true;
    } else {
      this.showDatePicker = false;
      this.loadAnalyticsData();
    }
  }

  applyCustomDateRange(): void {
    if (this.customStartDate && this.customEndDate) {
      this.showDatePicker = false;
      this.loadAnalyticsData();
    }
  }

  toggleComparison(): void {
    this.showComparison = !this.showComparison;
  }

  setRevenueChartView(view: 'area' | 'bar' | 'line'): void {
    this.revenueChartView = view;
    this.revenueChart?.destroy();
    this.initRevenueChart();
  }

  setOrdersChartView(view: 'bar' | 'line'): void {
    this.ordersChartView = view;
    this.ordersChart?.destroy();
    this.initOrdersChart();
  }

  setActiveSection(section: 'overview' | 'products' | 'customers' | 'traffic'): void {
    this.activeSection = section;
    if (section === 'overview' || section === 'traffic') {
      setTimeout(() => this.refreshCharts(), 100);
    }
  }

  sortProducts(sortBy: 'revenue' | 'units' | 'rating' | 'views'): void {
    if (this.productSortBy === sortBy) {
      this.productSortOrder = this.productSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.productSortBy = sortBy;
      this.productSortOrder = 'desc';
    }
    
    this.topProducts.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case 'revenue': aVal = a.revenue; bVal = b.revenue; break;
        case 'units': aVal = a.unitsSold; bVal = b.unitsSold; break;
        case 'rating': aVal = a.rating; bVal = b.rating; break;
        case 'views': aVal = a.views; bVal = b.views; break;
        default: aVal = a.revenue; bVal = b.revenue;
      }
      return this.productSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  filterActivities(filter: 'all' | 'orders' | 'deliveries' | 'alerts'): void {
    this.activityFilter = filter;
  }

  get filteredActivities(): Activity[] {
    if (this.activityFilter === 'all') return this.recentActivities;
    
    const typeMap: Record<string, string[]> = {
      'orders': ['order'],
      'deliveries': ['delivery'],
      'alerts': ['alert', 'return']
    };
    
    return this.recentActivities.filter(a => typeMap[this.activityFilter]?.includes(a.type));
  }

  handleInsightAction(insight: InsightCard): void {
    this.showNotification(`Action: ${insight.actionLabel}`, 'info');
  }

  async exportData(format: 'pdf' | 'excel' | 'csv'): Promise<void> {
    this.isExporting = true;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.showNotification(`Analytics report exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      this.showNotification('Failed to export data', 'error');
    } finally {
      this.isExporting = false;
    }
  }

  refreshData(): void {
    this.loadAnalyticsData();
  }

  // Utility methods
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN').format(value);
  }

  formatCompactNumber(value: number): string {
    if (value >= 10000000) return (value / 10000000).toFixed(1) + 'Cr';
    if (value >= 100000) return (value / 100000).toFixed(1) + 'L';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'order': 'shopping-cart',
      'delivery': 'truck',
      'review': 'star',
      'alert': 'alert-triangle',
      'return': 'rotate-ccw'
    };
    return icons[type] || 'info';
  }

  getActivityColor(type: string): string {
    const colors: Record<string, string> = {
      'order': 'success',
      'delivery': 'info',
      'review': 'warning',
      'alert': 'danger',
      'return': 'purple'
    };
    return colors[type] || 'primary';
  }

  getInsightIcon(type: string): string {
    const icons: Record<string, string> = {
      'success': 'trending-up',
      'warning': 'alert-triangle',
      'info': 'info',
      'tip': 'lightbulb'
    };
    return icons[type] || 'info';
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: [`snackbar-${type}`]
    });
  }

  // Computed properties for template (Angular templates don't support arrow functions)
  get totalRevenue(): number {
    return this.revenueData.reduce((sum, val) => sum + val, 0);
  }

  get totalChannelRevenue(): number {
    return this.channelData.reduce((sum, channel) => sum + channel.revenue, 0);
  }

  // Helper method for template - check if value is a number
  isNumber(value: any): boolean {
    return typeof value === 'number';
  }

  // Format metric value for display
  formatMetricValue(metric: MetricCard): string {
    const prefix = metric.prefix || '';
    const suffix = metric.suffix || '';
    const value = typeof metric.value === 'number' ? this.formatCompactNumber(metric.value) : metric.value;
    return `${prefix}${value}${suffix}`;
  }
}
