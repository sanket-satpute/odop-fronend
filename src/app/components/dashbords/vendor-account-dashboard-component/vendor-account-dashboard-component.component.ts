import { Component, OnInit, HostListener } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { LogoutDialogForEveryoneComponent } from '../../dialogs/logout-dialog-for-everyone/logout-dialog-for-everyone.component';
import { MatDialog } from '@angular/material/dialog';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { filter } from 'rxjs/operators';
import { DashboardNavigationService } from 'src/app/project/services/dashboard-navigation.service';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  active: boolean;
  routerLink: string;
  badge?: string | number;
  badgeType?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

interface DashboardCard {
  title: string;
  value: string;
  icon: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  color: string;
}

interface Order {
  id: string;
  product: string;
  quantity: number;
  customer: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  amount: number;
  date: string;
}

interface Product {
  name: string;
  stock: number;
  sales: number;
  category: string;
}

@Component({
  selector: 'app-vendor-account-dashboard-component',
  templateUrl: './vendor-account-dashboard-component.component.html',
  styleUrls: ['./vendor-account-dashboard-component.component.css']
})
export class VendorAccountDashboardComponentComponent implements OnInit {
  
  isSidebarCollapsed = false;
  isSidebarOpen = false;  // For mobile sidebar toggle
  isNotificationOpen = false;
  isProfileOpen = false;
  
  // Mock data for dashboard
  vendorName = 'Rajesh Kumar';

  sidebarItems: SidebarItem[] = [
    { label: 'Dashboard', icon: 'fa-th-large', route: '/vendor/dashboard', active: true, routerLink: 'home' },
    { label: 'Manage Products', icon: 'fa-box-open', route: '/vendor/products', active: false, routerLink: 'vendor-products' },
    { label: 'Orders', icon: 'fa-shopping-bag', route: '/vendor/orders', active: false, routerLink: 'vendor-orders', badge: 8, badgeType: 'primary' },
    { label: 'Earnings', icon: 'fa-wallet', route: '/vendor/earnings', active: false, routerLink: 'vendor-earnings' },
    { label: 'Inventory', icon: 'fa-warehouse', route: '/vendor/inventory', active: false, routerLink: 'vendor-inventory', badge: 3, badgeType: 'warning' },
    { label: 'Messages', icon: 'fa-envelope', route: '/vendor/messages', active: false, routerLink: 'vendor-messages', badge: 5, badgeType: 'info' },
    { label: 'Promotions', icon: 'fa-tags', route: '/vendor/promotions', active: false, routerLink: 'vendor-promotions' },
    { label: 'Returns', icon: 'fa-undo-alt', route: '/vendor/returns', active: false, routerLink: 'vendor-returns', badge: 2, badgeType: 'danger' },
    { label: 'Reviews', icon: 'fa-star', route: '/vendor/reviews', active: false, routerLink: 'vendor-feedback-and-review' },
    { label: 'Certifications', icon: 'fa-certificate', route: '/vendor/certifications', active: false, routerLink: 'vendor-certifications' },
    { label: 'Verification / KYC', icon: 'fa-id-card', route: '/vendor/verification', active: false, routerLink: 'vendor-verification' },
    { label: 'Analytics', icon: 'fa-chart-bar', route: '/vendor/analytics', active: false, routerLink: 'vendor-analytics' }
  ];
  
  bottomSidebarItems: SidebarItem[] = [
    { label: 'My Shop Preview', icon: 'fa-external-link-alt', route: '/shop', active: false, routerLink: 'shop-preview' },
    { label: 'Store Settings', icon: 'fa-store', route: '/vendor/store-settings', active: false, routerLink: 'vendor-store-settings' },
    { label: 'Logout', icon: 'fa-sign-out-alt', route: '/logout', active: false, routerLink: 'logout' }
  ];
  
  notifications = [
    {
      icon: 'fa-shopping-cart',
      title: 'New Order Received',
      description: 'Order #ORD123 from Asha R.',
      time: '2 min ago',
      unread: true
    },
    {
      icon: 'fa-star',
      title: 'New Review',
      description: '5-star review on your product',
      time: '15 min ago',
      unread: true
    },
    {
      icon: 'fa-box',
      title: 'Stock Alert',
      description: 'T-Shirt running low on stock',
      time: '1 hour ago',
      unread: false
    }
  ];
  
  constructor(
      private router: Router,
      private route: ActivatedRoute,
      private dialog: MatDialog,
      public userState: UserStateService,
      private dashboardNavService: DashboardNavigationService
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
    
    // Find the matching sidebar item
    const foundItem = this.sidebarItems.find(item => item.routerLink === lastSegment);
    if (foundItem) {
      this.sidebarItems.forEach(menuItem => menuItem.active = false);
      this.bottomSidebarItems.forEach(menuItem => menuItem.active = false);
      foundItem.active = true;
    } else {
      // Default to first item (Dashboard) if no match
      this.sidebarItems.forEach(menuItem => menuItem.active = false);
      this.bottomSidebarItems.forEach(menuItem => menuItem.active = false);
      if (this.sidebarItems.length > 0) {
        this.sidebarItems[0].active = true;
      }
    }
  }
  
  /**
   * Update active tab when route changes
   */
  private updateActiveTabFromRoute(): void {
    this.setActiveTabFromRoute();
  }
  
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleMobileSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
  
  toggleNotifications(): void {
    this.isNotificationOpen = !this.isNotificationOpen;
    this.isProfileOpen = false;
  }
  
  toggleProfile(): void {
    this.isProfileOpen = !this.isProfileOpen;
    this.isNotificationOpen = false;
  }
  
  closeDropdowns(): void {
    this.isNotificationOpen = false;
    this.isProfileOpen = false;
  }
  
  setActiveMenuItem(item: any): void {
    if(item.label === 'Logout') {
      // Handle logout logic here
      this.openLogoutDialog();
    } else if (item.label === 'My Shop Preview') {
      this.openShopPreview();
    } else {
      // Update active state
      this.sidebarItems.forEach(menuItem => menuItem.active = false);
      this.bottomSidebarItems.forEach(menuItem => menuItem.active = false);
      item.active = true;
      
      // Navigate with replaceUrl to prevent history stacking
      this.router.navigate(['/vendor-dashboard', item.routerLink], { replaceUrl: true });
    }
  }

  openShopPreview(): void {
    const vendorId = this.userState.vendor?.vendorId;
    if (!vendorId) {
      return;
    }
    window.open(`/shop/${vendorId}`, '_blank');
  }

  // edited
  get unreadNotificationsCount(): number {
    return this.notifications?.filter(n => n.unread).length || 0;
  }


  // handle logout
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
