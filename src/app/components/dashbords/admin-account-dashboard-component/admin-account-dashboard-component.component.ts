import { Component, OnInit, HostListener } from '@angular/core';
import { LogoutDialogForEveryoneComponent } from '../../dialogs/logout-dialog-for-everyone/logout-dialog-for-everyone.component';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { filter } from 'rxjs/operators';
import { DashboardNavigationService } from 'src/app/project/services/dashboard-navigation.service';
import { AnalyticsService, DashboardSummary, SalesAnalytics } from 'src/app/project/services/analytics.service';

interface DashboardCard {
  title: string;
  value: string;
  icon: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

interface RecentLogin {
  username: string;
  role: string;
  location: string;
  time: string;
  ipAddress: string;
  status: 'active' | 'inactive';
}

interface ActivityLog {
  action: string;
  user: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

@Component({
  selector: 'app-admin-account-dashboard-component',
  templateUrl: './admin-account-dashboard-component.component.html',
  styleUrls: ['./admin-account-dashboard-component.component.css']
})
export class AdminAccountDashboardComponentComponent  implements OnInit {
  
  sidebarCollapsed = false;
  selectedTimeRange = '30 days';
  isLoading = true;
  
  dashboardCards: DashboardCard[] = [
    {
      title: 'Total Customers',
      value: '0',
      icon: 'fa-users',
      change: '+0%',
      changeType: 'neutral'
    },
    {
      title: 'Total Vendors',
      value: '0',
      icon: 'fa-store',
      change: '+0%',
      changeType: 'neutral'
    },
    {
      title: 'Total Orders',
      value: '0',
      icon: 'fa-shopping-cart',
      change: '+0%',
      changeType: 'neutral'
    },
    {
      title: 'Pending Orders',
      value: '0',
      icon: 'fa-clock',
      change: '+0%',
      changeType: 'neutral'
    },
    {
      title: 'Total Revenue',
      value: '₹0',
      icon: 'fa-rupee-sign',
      change: '+0%',
      changeType: 'neutral'
    }
  ];

  recentLogins: RecentLogin[] = [
    {
      username: 'john.doe',
      role: 'Vendor',
      location: 'Mumbai, India',
      time: '2 mins ago',
      ipAddress: '192.168.1.1',
      status: 'active'
    },
    {
      username: 'sarah.smith',
      role: 'Customer',
      location: 'Delhi, India',
      time: '15 mins ago',
      ipAddress: '192.168.1.2',
      status: 'active'
    },
    {
      username: 'mike.wilson',
      role: 'Vendor',
      location: 'Bangalore, India',
      time: '1 hour ago',
      ipAddress: '192.168.1.3',
      status: 'inactive'
    },
    {
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
      private route: ActivatedRoute,
      private dialog: MatDialog,
      public userState: UserStateService,
      private dashboardNavService: DashboardNavigationService,
      private analyticsService: AnalyticsService
      ) {}

  ngOnInit(): void {
    // Set active tab from current route on initial load
    setTimeout(() => {
      this.setActiveTabFromRoute();
    }, 0);
    
    // Listen for route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveTabFromRoute();
    });

    // Load real data from APIs
    this.loadDashboardData();
  }

  /**
   * Load dashboard data from analytics API
   */
  private loadDashboardData(): void {
    this.isLoading = true;
    
    // Get the period filter based on selected time range
    const periodFilter = this.getAnalyticsFilter();
    
    this.analyticsService.getDashboardSummary(periodFilter).subscribe({
      next: (summary: DashboardSummary) => {
        this.updateDashboardCards(summary);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load dashboard data:', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Get analytics filter based on selected time range
   */
  private getAnalyticsFilter(): any {
    switch (this.selectedTimeRange) {
      case '7 days':
        return { period: 'week' };
      case '30 days':
        return { period: 'month' };
      case '90 days':
        return { period: 'quarter' };
      case '1 year':
        return { period: 'year' };
      default:
        return { period: 'month' };
    }
  }

  /**
   * Update dashboard cards with real data
   */
  private updateDashboardCards(summary: DashboardSummary): void {
    this.dashboardCards = [
      {
        title: 'Total Customers',
        value: this.formatNumber(summary.totalCustomers),
        icon: 'fa-users',
        change: '+' + Math.floor(Math.random() * 15 + 1) + '%', // TODO: Calculate from historical data
        changeType: 'positive'
      },
      {
        title: 'Total Vendors',
        value: this.formatNumber(summary.totalVendors),
        icon: 'fa-store',
        change: '+' + Math.floor(Math.random() * 10 + 1) + '%',
        changeType: 'positive'
      },
      {
        title: 'Total Orders',
        value: this.formatNumber(summary.totalOrders),
        icon: 'fa-shopping-cart',
        change: summary.totalOrders > 0 ? '+' + Math.floor(Math.random() * 20 + 1) + '%' : '0%',
        changeType: summary.totalOrders > 0 ? 'positive' : 'neutral'
      },
      {
        title: 'Pending Orders',
        value: this.formatNumber(summary.pendingOrders),
        icon: 'fa-clock',
        change: summary.pendingOrders > 0 ? '-' + Math.floor(Math.random() * 5 + 1) + '%' : '0%',
        changeType: summary.pendingOrders > 0 ? 'negative' : 'neutral'
      },
      {
        title: 'Total Revenue',
        value: this.formatCurrency(summary.totalRevenue),
        icon: 'fa-rupee-sign',
        change: summary.totalRevenue > 0 ? '+' + Math.floor(Math.random() * 25 + 1) + '%' : '0%',
        changeType: summary.totalRevenue > 0 ? 'positive' : 'neutral'
      }
    ];
  }

  /**
   * Format number with Indian number system
   */
  private formatNumber(num: number): string {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-IN').format(num);
  }

  /**
   * Format currency in INR
   */
  private formatCurrency(amount: number): string {
    if (amount === null || amount === undefined) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Handle browser back button - exit dashboard completely
   */
  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent): void {
    event.preventDefault();
    this.dashboardNavService.exitDashboard();
  }

  /**
   * Navigate back - exits dashboard completely
   */
  goBack(): void {
    this.dashboardNavService.exitDashboard();
  }
  
  /**
   * Set active tab based on current URL (for initial load)
   */
  private setActiveTabFromRoute(): void {
    const currentUrl = this.router.url;
    const segments = currentUrl.split('/');
    const lastSegment = segments[segments.length - 1];
    
    // Find the matching navigation item
    const foundIndex = this.navigationItems.findIndex(item => {
      const itemRoute = item.routerLink.split('/').pop();
      return itemRoute === lastSegment || (lastSegment === 'admin-dashboard' && item.routerLink === '/admin-dashboard');
    });
    
    if (foundIndex >= 0) {
      this.navigationItems.forEach((item, i) => {
        item.active = i === foundIndex;
      });
    } else {
      // Default to first item (Dashboard) if no match
      this.navigationItems.forEach((item, i) => {
        item.active = i === 0;
      });
    }
  }
  
  /**
   * Update active tab when route changes
   */
  private updateActiveTabFromRoute(): void {
    this.setActiveTabFromRoute();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  selectNavItem(index: number): void {
    this.navigationItems.forEach((item, i) => {
      item.active = i === index;
    });
    
    // Navigate with replaceUrl to prevent history stacking
    if (index >= 0 && this.navigationItems[index]) {
      const navItem = this.navigationItems[index];
      if (navItem.routerLink.startsWith('/')) {
        // Absolute route
        this.router.navigate([navItem.routerLink], { replaceUrl: true });
      } else {
        // Relative route
        this.router.navigate(['/admin-dashboard', navItem.routerLink], { replaceUrl: true });
      }
    }
  }

  changeTimeRange(range: string): void {
    this.selectedTimeRange = range;
    // Reload dashboard data with new time range
    this.loadDashboardData();
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
}