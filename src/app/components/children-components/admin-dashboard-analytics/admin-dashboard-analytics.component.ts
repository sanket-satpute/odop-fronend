import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AnalyticsService, DashboardSummary, SalesAnalytics, TopVendor, GeographicAnalytics } from '../../../project/services/analytics.service';
import { MatSnackBar } from '@angular/material/snack-bar';

Chart.register(...registerables);

interface KpiItem {
  icon: string;
  label: string;
  value: string;
  change: number;
}

interface RevenueItem {
  label: string;
  value: string;
  color: string;
}

interface TopVendorItem {
  name: string;
  sales: string;
  rating: number;
  orders: number;
  status: string;
}

interface TopProductItem {
  name: string;
  units: number;
  revenue: string;
  percentage: number;
}

interface SentimentItem {
  label: string;
  percentage: number;
  color: string;
}

interface TopRegionItem {
  name: string;
  value: string;
  growth: number;
  percentage: number;
}

@Component({
  selector: 'app-admin-dashboard-analytics',
  templateUrl: './admin-dashboard-analytics.component.html',
  styleUrls: ['./admin-dashboard-analytics.component.css']
})
export class AdminDashboardAnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('salesChart', { static: false }) salesChart!: ElementRef;
  @ViewChild('revenueChart', { static: false }) revenueChart!: ElementRef;
  @ViewChild('signupChart', { static: false }) signupChart!: ElementRef;
  @ViewChild('sentimentChart', { static: false }) sentimentChart!: ElementRef;

  private destroy$ = new Subject<void>();

  // Loading states
  isLoading = true;
  isLoadingCharts = false;

  // Component Properties
  selectedPeriod = '30';
  chartPeriod = 'daily';
  Math = Math;

  // Analytics data from API
  dashboardSummary: DashboardSummary | null = null;
  salesAnalytics: SalesAnalytics | null = null;
  geographicAnalytics: GeographicAnalytics | null = null;

  // KPI Data - now populated from API
  kpiData: KpiItem[] = [];

  // Revenue Breakdown Data - now populated from API
  revenueBreakdown: RevenueItem[] = [];

  // Top Vendors Data - now populated from API
  topVendors: TopVendorItem[] = [];

  // Top Products Data - now populated from API
  topProducts: TopProductItem[] = [];

  // Sentiment Data
  sentimentData: SentimentItem[] = [
    { label: 'Positive', percentage: 68, color: '#10B981' },
    { label: 'Neutral', percentage: 22, color: '#FFA500' },
    { label: 'Negative', percentage: 10, color: '#EF4444' }
  ];

  // Top Regions Data - now populated from API
  topRegions: TopRegionItem[] = [];

  // Chart instances
  private salesChartInstance: Chart | null = null;
  private revenueChartInstance: Chart | null = null;
  private signupChartInstance: Chart | null = null;
  private sentimentChartInstance: Chart | null = null;

  // Chart data from API
  private salesChartData: number[] = [];
  private salesChartLabels: string[] = [];

  constructor(
    private analyticsService: AnalyticsService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  private loadAnalyticsData(): void {
    this.isLoading = true;

    forkJoin({
      summary: this.analyticsService.getDashboardSummary({ period: this.getPeriodFilter() }),
      sales: this.analyticsService.getSalesAnalytics({ period: this.getPeriodFilter() }),
      geographic: this.analyticsService.getGeographicAnalytics(),
      topVendors: this.analyticsService.getVendorLeaderboard(5)
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ summary, sales, geographic, topVendors }) => {
        this.dashboardSummary = summary;
        this.salesAnalytics = sales;
        this.geographicAnalytics = geographic;

        // Populate KPI data
        this.populateKpiData(summary);

        // Populate revenue breakdown from sales by category
        this.populateRevenueBreakdown(sales);

        // Populate top vendors
        this.populateTopVendors(topVendors);

        // Populate top products
        this.populateTopProducts(sales);

        // Populate top regions
        this.populateTopRegions(geographic);

        // Prepare chart data
        this.prepareChartData(sales);
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.showError('Failed to load analytics data');
        // Set default/fallback data
        this.setFallbackData();
      }
    });
  }

  private getPeriodFilter(): 'week' | 'month' | 'quarter' | 'year' {
    switch (this.selectedPeriod) {
      case '7': return 'week';
      case '30': return 'month';
      case '90': return 'quarter';
      case '365': return 'year';
      default: return 'month';
    }
  }

  private populateKpiData(summary: DashboardSummary): void {
    this.kpiData = [
      {
        icon: 'fas fa-shopping-cart',
        label: 'Total Orders',
        value: this.formatNumberShort(summary.totalOrders),
        change: 12.5 // Would need historical data for real change
      },
      {
        icon: 'fas fa-wallet',
        label: 'Revenue',
        value: this.formatCurrency(summary.totalRevenue),
        change: 8.3
      },
      {
        icon: 'fas fa-users',
        label: 'Total Customers',
        value: this.formatNumberShort(summary.totalCustomers),
        change: 15.2
      },
      {
        icon: 'fas fa-store',
        label: 'Total Vendors',
        value: this.formatNumberShort(summary.totalVendors),
        change: 5.7
      },
      {
        icon: 'fas fa-box-open',
        label: 'Total Products',
        value: this.formatNumberShort(summary.totalProducts),
        change: 18.9
      },
      {
        icon: 'fas fa-check-circle',
        label: 'Completed Orders',
        value: this.formatNumberShort(summary.completedOrders),
        change: 2.1
      }
    ];
  }

  private populateRevenueBreakdown(sales: SalesAnalytics): void {
    const colors = ['#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#9B59B6', '#2ECC71'];
    const categories = Object.entries(sales.salesByCategory || {});
    
    this.revenueBreakdown = categories.slice(0, 4).map(([category, value], index) => ({
      label: category,
      value: this.formatCurrency(value as number),
      color: colors[index % colors.length]
    }));

    if (this.revenueBreakdown.length === 0) {
      this.revenueBreakdown = [
        { label: 'No Data', value: '₹0', color: '#E5E7EB' }
      ];
    }
  }

  private populateTopVendors(vendors: TopVendor[]): void {
    this.topVendors = vendors.map(v => ({
      name: v.shopName || v.vendorName,
      sales: this.formatCurrency(v.totalRevenue),
      rating: 4.5, // Would need review data
      orders: v.totalSales,
      status: 'Active'
    }));
  }

  private populateTopProducts(sales: SalesAnalytics): void {
    const maxRevenue = sales.topSellingProducts?.[0]?.totalRevenue || 1;
    
    this.topProducts = (sales.topSellingProducts || []).slice(0, 5).map(p => ({
      name: p.productName,
      units: p.totalQuantitySold,
      revenue: this.formatCurrency(p.totalRevenue),
      percentage: Math.round((p.totalRevenue / maxRevenue) * 100)
    }));
  }

  private populateTopRegions(geographic: GeographicAnalytics): void {
    const maxRevenue = geographic.topStates?.[0]?.totalRevenue || 1;
    
    this.topRegions = (geographic.topStates || []).slice(0, 5).map(s => ({
      name: s.state,
      value: this.formatCurrency(s.totalRevenue),
      growth: 10, // Would need historical data
      percentage: Math.round((s.totalRevenue / maxRevenue) * 100)
    }));
  }

  private prepareChartData(sales: SalesAnalytics): void {
    if (sales.revenueByMonth && sales.revenueByMonth.length > 0) {
      this.salesChartLabels = sales.revenueByMonth.map(d => d.period || d.label || '');
      this.salesChartData = sales.revenueByMonth.map(d => d.value);
    } else {
      // Fallback data
      this.salesChartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      this.salesChartData = [65000, 75000, 85000, 78000, 92000, 88000, 95000];
    }
  }

  private setFallbackData(): void {
    this.kpiData = [
      { icon: 'fas fa-shopping-cart', label: 'Total Orders', value: '0', change: 0 },
      { icon: 'fas fa-wallet', label: 'Revenue', value: '₹0', change: 0 },
      { icon: 'fas fa-users', label: 'Total Customers', value: '0', change: 0 },
      { icon: 'fas fa-store', label: 'Total Vendors', value: '0', change: 0 },
      { icon: 'fas fa-box-open', label: 'Total Products', value: '0', change: 0 },
      { icon: 'fas fa-check-circle', label: 'Completed Orders', value: '0', change: 0 }
    ];
    this.revenueBreakdown = [{ label: 'No Data', value: '₹0', color: '#E5E7EB' }];
    this.topVendors = [];
    this.topProducts = [];
    this.topRegions = [];
    this.salesChartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    this.salesChartData = [0, 0, 0, 0, 0, 0, 0];
  }

  private formatNumberShort(value: number): string {
    if (value >= 10000000) {
      return (value / 10000000).toFixed(1) + 'Cr';
    } else if (value >= 100000) {
      return (value / 100000).toFixed(1) + 'L';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toLocaleString('en-IN');
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }

  ngAfterViewInit(): void {
    // Initialize charts after view is ready
    setTimeout(() => {
      this.initializeSalesChart();
      this.initializeRevenueChart();
      this.initializeSignupChart();
      this.initializeSentimentChart();
    }, 100);
  }

  // Event Handlers
  onPeriodChange(): void {
    console.log('Period changed to:', this.selectedPeriod);
    // Reload analytics data with new period
    this.loadAnalyticsData();
  }

  setChartPeriod(period: string): void {
    this.chartPeriod = period;
    this.updateSalesChart();
  }

  // Chart Initialization Methods
  initializeSalesChart(): void {
    if (!this.salesChart?.nativeElement) return;

    const ctx = this.salesChart.nativeElement.getContext('2d');
    
    // Use API data or fallback
    const labels = this.salesChartLabels.length > 0 ? this.salesChartLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const data = this.salesChartData.length > 0 ? this.salesChartData : [65000, 75000, 85000, 78000, 92000, 88000, 95000];
    
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Sales (₹)',
          data: data,
          borderColor: '#FFA500',
          backgroundColor: 'rgba(255, 165, 0, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#FFA500',
          pointBorderColor: '#FFA500',
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#E5E7EB'
            },
            ticks: {
              color: '#6B7280',
              callback: function(value: any) {
                return '₹' + (value / 1000) + 'K';
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6B7280'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    this.salesChartInstance = new Chart(ctx, config);
  }

  initializeRevenueChart(): void {
    if (!this.revenueChart?.nativeElement) return;

    const ctx = this.revenueChart.nativeElement.getContext('2d');
    
    // Parse revenue values for chart (remove currency formatting)
    const revenueValues = this.revenueBreakdown.map(item => {
      const numStr = item.value.replace(/[₹,LKCr]/g, '');
      let value = parseFloat(numStr) || 0;
      if (item.value.includes('Cr')) value *= 100;
      else if (item.value.includes('L')) value *= 1;
      else if (item.value.includes('K')) value *= 0.01;
      return value;
    });

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: this.revenueBreakdown.map(item => item.label),
        datasets: [{
          data: revenueValues.length > 0 ? revenueValues : [1],
          backgroundColor: this.revenueBreakdown.map(item => item.color),
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    };

    this.revenueChartInstance = new Chart(ctx, config);
  }

  initializeSignupChart(): void {
    if (!this.signupChart?.nativeElement) return;

    const ctx = this.signupChart.nativeElement.getContext('2d');
    
    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'New Signups',
          data: [45, 52, 38, 67, 49, 83, 56],
          backgroundColor: '#FFA500',
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#E5E7EB'
            },
            ticks: {
              color: '#6B7280'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6B7280'
            }
          }
        }
      }
    };

    this.signupChartInstance = new Chart(ctx, config);
  }

  initializeSentimentChart(): void {
    if (!this.sentimentChart?.nativeElement) return;

    const ctx = this.sentimentChart.nativeElement.getContext('2d');
    
    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: this.sentimentData.map(item => item.label),
        datasets: [{
          data: this.sentimentData.map(item => item.percentage),
          backgroundColor: this.sentimentData.map(item => item.color),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    };

    this.sentimentChartInstance = new Chart(ctx, config);
  }

  // Update Methods
  updateCharts(): void {
    // Update all charts based on selected period
    this.updateSalesChart();
    this.updateRevenueChart();
    this.updateSignupChart();
    this.updateSentimentChart();
  }

  updateSalesChart(): void {
    if (!this.salesChartInstance) return;

    let newData: number[] = [];
    let newLabels: string[] = [];

    switch (this.chartPeriod) {
      case 'daily':
        newData = [65000, 75000, 85000, 78000, 92000, 88000, 95000];
        newLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        break;
      case 'weekly':
        newData = [450000, 520000, 480000, 630000, 590000, 680000];
        newLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
        break;
      case 'monthly':
        newData = [1800000, 2200000, 1950000, 2400000, 2100000, 2600000];
        newLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        break;
    }

    this.salesChartInstance.data.labels = newLabels;
    this.salesChartInstance.data.datasets[0].data = newData;
    this.salesChartInstance.update();
  }

  updateRevenueChart(): void {
    if (!this.revenueChartInstance) return;
    // Update revenue chart data based on selected period
    this.revenueChartInstance.update();
  }

  updateSignupChart(): void {
    if (!this.signupChartInstance) return;
    // Update signup chart data based on selected period
    this.signupChartInstance.update();
  }

  updateSentimentChart(): void {
    if (!this.sentimentChartInstance) return;
    // Update sentiment chart data based on selected period
    this.sentimentChartInstance.update();
  }

  // Utility Methods
  formatCurrency(value: number): string {
    if (value >= 10000000) { // 1 crore
      return '₹' + (value / 10000000).toFixed(1) + 'Cr';
    } else if (value >= 100000) { // 1 lakh
      return '₹' + (value / 100000).toFixed(1) + 'L';
    } else if (value >= 1000) { // 1 thousand
      return '₹' + (value / 1000).toFixed(1) + 'K';
    } else {
      return '₹' + value.toString();
    }
  }

  formatNumber(value: number): string {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  // Component Lifecycle
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clean up chart instances
    if (this.salesChartInstance) {
      this.salesChartInstance.destroy();
    }
    if (this.revenueChartInstance) {
      this.revenueChartInstance.destroy();
    }
    if (this.signupChartInstance) {
      this.signupChartInstance.destroy();
    }
    if (this.sentimentChartInstance) {
      this.sentimentChartInstance.destroy();
    }
  }
}