import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { LogoutDialogForEveryoneComponent } from '../../dialogs/logout-dialog-for-everyone/logout-dialog-for-everyone.component';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { CustomerServiceService } from 'src/app/project/services/customer-service.service';
import { VendorServiceService } from 'src/app/project/services/vendor-service.service';
import { AnalyticsService, DashboardSummary, SalesAnalytics } from 'src/app/project/services/analytics.service';
import { OrderService } from 'src/app/project/services/order.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { forkJoin as rxjsForkJoin, Subject } from 'rxjs';    
import { forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Vendor } from 'src/app/project/models/vendor';
import { Customer } from 'src/app/project/models/customer';
import { MatSnackBar } from '@angular/material/snack-bar';

interface DashboardCard {
  title: string;
  value: string;
  icon: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

interface RecentLogin {
  userId: string;
  username: string;
  role: string;
  location: string;
  time: string;
  ipAddress: string;
  status: 'active' | 'inactive' | 'verified' | "banned" | undefined;
  lastLogin?: Date | undefined;
}

interface ActivityLog {
  action: string;
  user: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

@Component({
  selector: 'app-admin-dashboard-dashboard',
  templateUrl: './admin-dashboard-dashboard.component.html',
  styleUrls: ['./admin-dashboard-dashboard.component.css']
})
export class AdminDashboardDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  // Loading states
  isLoading = true;
  
  // Analytics data
  dashboardSummary: DashboardSummary | null = null;
  salesAnalytics: SalesAnalytics | null = null;
  
  sidebarCollapsed = false;
  selectedTimeRange = '30 days';
  
  dashboardCards: DashboardCard[] = [
    {
      title: 'Total Customers',
      value: '0',
      icon: 'fa-users',
      change: '+0%',
      changeType: 'positive'
    },
    {
      title: 'Total Vendors',
      value: '0',
      icon: 'fa-store',
      change: '+0%',
      changeType: 'positive'
    },
    {
      title: 'Total Orders',
      value: '0',
      icon: 'fa-shopping-cart',
      change: '+0%',
      changeType: 'positive'
    },
    {
      title: 'Pending Orders',
      value: '0',
      icon: 'fa-clock',
      change: '0%',
      changeType: 'neutral'
    },
    {
      title: 'Monthly Revenue',
      value: '₹0',
      icon: 'fa-rupee-sign',
      change: '+0%',
      changeType: 'positive'
    }
  ];

  recentLogins: RecentLogin[] = [
    {
      userId: '1',
      username: 'john.doe',
      role: 'Vendor',
      location: 'Mumbai, India',
      time: '2 mins ago',
      ipAddress: '192.168.1.1',
      status: 'active'
    },
    {
      userId: '2',
      username: 'sarah.smith',
      role: 'Customer',
      location: 'Delhi, India',
      time: '15 mins ago',
      ipAddress: '192.168.1.2',
      status: 'active'
    },
    {
      userId: '3',
      username: 'mike.wilson',
      role: 'Vendor',
      location: 'Bangalore, India',
      time: '1 hour ago',
      ipAddress: '192.168.1.3',
      status: 'inactive'
    },
    {
      userId: '4',
      username: 'alice.brown',
      role: 'Customer',
      location: 'Chennai, India',
      time: '2 hours ago',
      ipAddress: '192.168.1.4',
      status: 'active'
    }
  ];

  activityLogs: ActivityLog[] = [
    {
      action: 'User "vendor123" updated product catalog',
      user: 'System',
      timestamp: '10:30 AM',
      type: 'info'
    },
    {
      action: 'New customer registration completed',
      user: 'Auto-Process',
      timestamp: '10:15 AM',
      type: 'success'
    },
    {
      action: 'Payment gateway timeout detected',
      user: 'System Monitor',
      timestamp: '09:45 AM',
      type: 'warning'
    },
    {
      action: 'Database backup completed successfully',
      user: 'Scheduler',
      timestamp: '09:00 AM',
      type: 'success'
    }
  ];

  chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Sales',
      data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
      borderColor: '#FFA500',
      backgroundColor: 'rgba(255, 165, 0, 0.1)',
      tension: 0.4
    }]
  };

  navigationItems = [
    { icon: 'fa-home', label: 'Dashboard', active: true , routerLink: '/admin-dashboard'},
    { icon: 'fa-users', label: 'User Management', active: false , routerLink: 'admin-users'},
    { icon: 'fa-box-open', label: 'Products', active: false , routerLink: 'admin-products'},
    { icon: 'fa-shopping-cart', label: 'Orders', active: false , routerLink: 'admin-orders'},
    { icon: 'fa-star', label: 'Feedback & Reviews', active: false , routerLink: 'admin-feedback'},
    { icon: 'fa-chart-line', label: 'Analytics', active: false , routerLink: 'admin-analytics'},
    { icon: 'fa-edit', label: 'CMS', active: false , routerLink: 'admin-cms'},
    { icon: 'fa-cog', label: 'Settings', active: false , routerLink: 'admin-settings'}
  ];

  constructor(
      private router: Router,
      private dialog: MatDialog,
      public userState: UserStateService,
      private customerService: CustomerServiceService,
      private vendorService: VendorServiceService,
      private analyticsService: AnalyticsService,
      private orderService: OrderService,
      private snackBar: MatSnackBar
      ) {}

private chart: Chart | undefined;

  // Chart data from API
  private revenueChartLabels: string[] = [];
  private revenueChartData: number[] = [];

  ngOnInit(): void {
    // Initialize component
    Chart.register(...registerables);
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;

    forkJoin({
      summary: this.analyticsService.getDashboardSummary({ period: 'month' }),
      sales: this.analyticsService.getSalesAnalytics({ period: 'month' })
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ summary, sales }) => {
        this.dashboardSummary = summary;
        this.salesAnalytics = sales;
        
        // Update dashboard cards with real data
        this.updateDashboardCards(summary);
        
        // Prepare chart data
        this.prepareChartData(sales);
        
        // Load recent logins
        this.getRecentLogins();
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.showError('Failed to load dashboard data');
        // Fallback to old method
        this.getTotalCount();
        this.getRecentLogins();
      }
    });
  }

  private updateDashboardCards(summary: DashboardSummary): void {
    this.dashboardCards = [
      {
        title: 'Total Customers',
        value: this.formatNumber(summary.totalCustomers),
        icon: 'fa-users',
        change: '+12.5%',
        changeType: 'positive'
      },
      {
        title: 'Total Vendors',
        value: this.formatNumber(summary.totalVendors),
        icon: 'fa-store',
        change: '+8.2%',
        changeType: 'positive'
      },
      {
        title: 'Total Orders',
        value: this.formatNumber(summary.totalOrders),
        icon: 'fa-shopping-cart',
        change: '+15.3%',
        changeType: 'positive'
      },
      {
        title: 'Pending Orders',
        value: this.formatNumber(summary.pendingOrders),
        icon: 'fa-clock',
        change: summary.pendingOrders > 0 ? 'Needs attention' : 'All clear',
        changeType: summary.pendingOrders > 10 ? 'negative' : 'neutral'
      },
      {
        title: 'Total Revenue',
        value: this.formatCurrency(summary.totalRevenue),
        icon: 'fa-rupee-sign',
        change: '+23.8%',
        changeType: 'positive'
      }
    ];
  }

  private prepareChartData(sales: SalesAnalytics): void {
    if (sales.revenueByMonth && sales.revenueByMonth.length > 0) {
      this.revenueChartLabels = sales.revenueByMonth.map(d => d.period || d.label || '');
      this.revenueChartData = sales.revenueByMonth.map(d => d.value);
    } else {
      // Fallback data
      this.revenueChartLabels = ['January', 'February', 'March', 'April', 'May', 'June'];
      this.revenueChartData = [1200, 1900, 3000, 2500, 3200, 4000];
    }
  }

  private formatNumber(value: number): string {
    if (value >= 100000) {
      return (value / 100000).toFixed(1) + 'L';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toLocaleString('en-IN');
  }

  private formatCurrency(value: number): string {
    if (value >= 10000000) {
      return '₹' + (value / 10000000).toFixed(1) + 'Cr';
    } else if (value >= 100000) {
      return '₹' + (value / 100000).toFixed(1) + 'L';
    } else if (value >= 1000) {
      return '₹' + (value / 1000).toFixed(1) + 'K';
    }
    return '₹' + value.toLocaleString('en-IN');
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
    // Render chart after data is loaded
    setTimeout(() => {
      this.renderChart();
    }, 500);
  }

  renderChart(): void {
    const ctx = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Use API data or fallback
    const labels = this.revenueChartLabels.length > 0 ? this.revenueChartLabels : ['January', 'February', 'March', 'April', 'May', 'June'];
    const data = this.revenueChartData.length > 0 ? this.revenueChartData : [1200, 1900, 3000, 2500, 3200, 4000];
    if (!ctx) return;

    // Custom gradient for the chart
    const gradient = ctx.getContext('2d')?.createLinearGradient(0, 0, 0, 320);
    if (gradient) {
      gradient.addColorStop(0, 'rgba(255, 165, 0, 0.25)');
      gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.08)');
      gradient.addColorStop(1, 'rgba(255, 165, 0, 0.02)');
    }

    // Line gradient
    const lineGradient = ctx.getContext('2d')?.createLinearGradient(0, 0, 0, 320);
    if (lineGradient) {
      lineGradient.addColorStop(0, '#ffa500');
      lineGradient.addColorStop(1, '#ff8c00');
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Monthly Revenue',
            data: data,
            borderColor: lineGradient || '#ffa500',
            backgroundColor: gradient || 'rgba(255, 165, 0, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#ffa500',
            pointBorderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: '#ffa500',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 3,
            borderCapStyle: 'round',
            borderJoinStyle: 'round'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        elements: {
          point: {
            hoverBackgroundColor: '#ffa500'
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 165, 0, 0.3)',
            borderWidth: 1,
            cornerRadius: 12,
            displayColors: false,
            padding: 16,
            titleFont: {
              family: 'Inter',
              size: 14,
              // weight: '600'
            },
            bodyFont: {
              family: 'Inter',
              size: 13,
              // weight: '500'
            },
            callbacks: {
              title: (context) => {
                return context[0].label;
              },
              label: (context) => {
                return `Revenue: $${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            },
            border: {
              display: false
            },
            ticks: {
              color: '#9ca3af',
              font: {
                family: 'Inter',
                size: 12,
                // weight: '500'
              },
              padding: 16,
              maxRotation: 0
            }
          },
          y: {
            display: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.08)',
              // drawBorder: false,
              lineWidth: 1
            },
            border: {
              display: false
            },
            ticks: {
              color: '#9ca3af',
              font: {
                family: 'Inter',
                size: 12,
                // weight: '500'
              },
              padding: 16,
              callback: function(value) {
                return '$' + (value as number).toLocaleString();
              }
            }
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        },
        hover: {
          // animationDuration: 200
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  // Method to handle period selection
  onPeriodChange(period: string): void {
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.period-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    const clickedBtn = document.querySelector(`[data-period="${period}"]`);
    if (clickedBtn) {
      clickedBtn.classList.add('active');
    }

    // Update chart data based on period
    if (this.chart) {
      let newData: number[] = [];
      let newLabels: string[] = [];

      switch (period) {
        case '6M':
          newData = [1200, 1900, 3000, 2500, 3200, 4000];
          newLabels = ['January', 'February', 'March', 'April', 'May', 'June'];
          break;
        case '1Y':
          newData = [1200, 1900, 3000, 2500, 3200, 4000, 3800, 4200, 3900, 4500, 4800, 5200];
          newLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          break;
        case 'All':
          newData = [800, 1200, 1900, 3000, 2500, 3200, 4000, 3800, 4200, 3900, 4500, 4800, 5200, 5800, 6200];
          newLabels = ['Q1 2022', 'Q2 2022', 'Q3 2022', 'Q4 2022', 'Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025', 'Q2 2025', 'Q3 2025'];
          break;
      }

      this.chart.data.datasets[0].data = newData;
      this.chart.data.labels = newLabels;
      this.chart.update('active');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  selectNavItem(index: number): void {
    this.navigationItems.forEach((item, i) => {
      item.active = i === index;
    });
  }

  changeTimeRange(range: string): void {
    this.selectedTimeRange = range;
    // Implement chart data update logic here
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'status-active' : 'status-inactive';
  }

  getActivityTypeClass(type: string): string {
    return `activity-${type}`;
  }

  getChangeClass(changeType: string): string {
    return `change-${changeType}`;
  }

  logout(): void {
    // Clear user session
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userPreferences');
    }
    this.openLogoutDialog();
    // Redirect to login page
  }


  // logout for everyone
  openLogoutDialog() {
    const dialogRef = this.dialog.open(LogoutDialogForEveryoneComponent, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        role: this.userState.customer ? 'customer' : this.userState.vendor ? 'vendor' : 'admin',
        username: this.userState.admin?.fullName || this.userState.customer?.fullName || this.userState.vendor?.shopkeeperName,
        userAvatar: 'path/to/avatar.jpg'
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        // Handle logout
        this.router.navigate(['']);
        this.userState.logoutAll(); // Clear all user states
        this.router.navigateByUrl('/');
      }
    });
  }





  
    // get numbers for all cards
    getTotalCount(): number {
      // get count for customers from dynamic
      this.customerService.getAllCustomersCount().subscribe(count => {
        this.dashboardCards[0].value = count.toString();
      });
      // get count for vendors from dynamic
      this.vendorService.getAllVendorsCount().subscribe(count => {
        this.dashboardCards[1].value = count.toString();
      });
      // get count for orders from dynamic
      this.dashboardCards[2].value = '456';
      // get count for complaints from dynamic
      this.dashboardCards[3].value = '789';
      // get count for revenue from dynamic
      this.dashboardCards[4].value = '456';
      return 100; // Example static value
    }

    // Recent Logins data
    getRecentLogins() {
      forkJoin({
        vendors: this.vendorService.getAllVendors(),
        customers: this.customerService.getAllCustomers()
      }).subscribe((result: { vendors: Vendor[]; customers: Customer[] }) => {
        const { vendors, customers } = result;
        const now = new Date();

        const vendorLogins = vendors.map(vendor => ({
          userId: vendor.vendorId || vendor.vendorId || '', // Ensure userId is present
          username: vendor.shopkeeperName || vendor.emailAddress || '',
          role: 'Vendor',
          location: `${vendor.locationDistrict}, ${vendor.locationState}`,
          time: this.getTimeAgo(vendor.lastLogin, now),
          ipAddress: '192.168.1.X', // Placeholder
          status: (vendor.status === 'verified' ? 'active' : 'inactive') as 'active' | 'inactive' | 'verified' | 'banned' | undefined,
          lastLogin: vendor.lastLogin
        }));

        const customerLogins = customers.map(customer => ({
          userId: customer.customerId || customer.customerId || '', // Ensure userId is present
          username: customer.fullName || customer.emailAddress || '',
          role: 'Customer',
          location: `${customer.billingAddress}`,
          time: this.getTimeAgo(customer.lastLogin, now),
          ipAddress: '192.168.1.Y', // Placeholder
          status: (customer.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive' | 'verified' | 'banned' | undefined,
          lastLogin: customer.lastLogin
        }));

        const combinedLogins = [...vendorLogins, ...customerLogins].sort(
          (a, b) => {
            const dateA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
            const dateB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
            return dateB - dateA;
          }
        );

        this.recentLogins = combinedLogins.map(({ lastLogin, ...rest }) => ({
          ...rest
        }));
        this.filterLogins(); 
      });
    }


    getTimeAgo(date: Date | undefined, now: Date | undefined): string {
      if (!date || !now) return 'unknown';
      const diff = (now.getTime() - new Date(date).getTime()) / 1000; // in seconds
      if (diff < 60) return `${Math.floor(diff)} secs ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
      return `${Math.floor(diff / 86400)} days ago`;
    }

    searchTerm: string = '';
    filteredLogins: typeof this.recentLogins = this.recentLogins;
    filterLogins() {
      const term = this.searchTerm.toLowerCase().trim();

      if (!term) {
        this.filteredLogins = this.recentLogins;
        return;
      }
      // Filter logins based on search term
      if (!this.recentLogins || this.recentLogins.length === 0) {
        this.filteredLogins = [];
        return;
      }
      this.filteredLogins = this.recentLogins.filter(login =>
        login.username.toLowerCase().includes(term) ||
        login.role.toLowerCase().includes(term) ||
        login.location.toLowerCase().includes(term) ||
        login.status?.toLowerCase().includes(term)
      );
    }
}
