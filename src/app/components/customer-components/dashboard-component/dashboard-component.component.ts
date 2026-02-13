import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { LogoutDialogForEveryoneComponent } from '../../dialogs/logout-dialog-for-everyone/logout-dialog-for-everyone.component';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { RegisterDialogComponent } from '../../dialogs/register-dialog/register-dialog.component';
import { Location } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { DashboardNavigationService } from 'src/app/project/services/dashboard-navigation.service';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: string;
  color: string;
  read: boolean;
}

interface NavigationItem {
  key: string;
  label: string;
  icon: string;
  route?: string;
  routerLink?: string;
}

interface RecentOrder {
  id: string;
  itemName: string;
  image: string;
  quantity: number;
  amount: number;
  status: string;
  statusText: string;
  date: string;
  progress: number;
}



@Component({
  selector: 'app-dashboard-component',
  templateUrl: './dashboard-component.component.html',
  styleUrls: ['./dashboard-component.component.css'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px) scale(0.95)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        )
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 0, transform: 'translateY(-20px) scale(0.95)' })
        )
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
    ])
  ]
})
export class DashboardComponentComponent implements OnInit, OnDestroy {
  
  // it's own
  showNotifications: boolean = false;
  // Sidebar state
  sidebarCollapsed = false;
  activeTab = 'profile';

  // Navigation history for back button handling
  private navigationHistory: string[] = [];
  private routerSubscription?: Subscription;
  private maxHistoryLength = 20;

  // Add this property to fix the error
  notifications: AppNotification[] = [
    {
      id: '1',
      title: 'Order Shipped',
      message: 'Your order #12345 has been shipped.',
      time: '2024-06-04T10:00:00Z',
      icon: 'fas fa-shipping-fast',
      color: '#3B82F6',
      read: false
    },
    {
      id: '2',
      title: 'Payment Received',
      message: 'We have received your payment for order #12345.',
      time: '2024-06-03T15:30:00Z',
      icon: 'fas fa-rupee-sign',
      color: '#10B981',
      read: false
    }
    // Add more notifications as needed
  ];

  // Navigation items
  navigationItems: NavigationItem[] = [
    {
      key: 'profile',
      label: 'My Profile',
      icon: 'fas fa-user',
      route: '/profile',
      routerLink: 'cust-profile'
    },
    {
      key: 'orders',
      label: 'My Orders',
      icon: 'fas fa-box',
      route: '/orders',
      routerLink: 'cust-orders'
    },
    {
      key: 'addresses',
      label: 'My Addresses',
      icon: 'fas fa-map-marker-alt',
      route: '/addresses',
      routerLink: 'cust-addresses'
    },
    {
      key: 'support',
      label: 'Support',
      icon: 'fas fa-headset',
      route: '/support',
      routerLink: 'cust-support'
    },
    {
      key: 'wallet',
      label: 'Wallet & Rewards',
      icon: 'fas fa-wallet',
      route: '/wallet',
      routerLink: 'cust-wallet'
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: 'fas fa-bell',
      route: '/notifications',
      routerLink: 'cust-notifications'
    }
  ];
    
  bottomNavigationItems: NavigationItem[] = [
    {
      key: 'settings',
      label: 'Settings',
      icon: 'fas fa-cog',
      route: '/settings',
      routerLink: 'cust-settings'
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: 'fas fa-sign-out-alt'
    }
  ];
  
  

  



 

  constructor(
      private router: Router,
      private dialog: MatDialog,
      public userState: UserStateService,
      private location: Location,
      private activatedRoute: ActivatedRoute,
      private dashboardNavService: DashboardNavigationService
      ) {}

  ngOnInit(): void {
    // Initialize component
    this.loadDashboardData();
    
    // Set up responsive behavior
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // Track navigation within dashboard for back button handling
    this.setupNavigationTracking();
    
    // Set initial active tab based on current route (must be last to override any defaults)
    // Use setTimeout to ensure router is fully initialized
    setTimeout(() => {
      this.setActiveTabFromRoute();
    }, 0);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', () => this.handleResize());
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  /**
   * Setup navigation tracking for back button support
   */
  private setupNavigationTracking(): void {
    // Track route changes within the dashboard
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        
        // Only track dashboard routes
        if (url.includes('customer-dashboard')) {
          // Extract the child route
          const childRoute = this.extractChildRoute(url);
          
          // Add to history if different from the last entry
          if (this.navigationHistory.length === 0 || 
              this.navigationHistory[this.navigationHistory.length - 1] !== childRoute) {
            this.navigationHistory.push(childRoute);
            
            // Limit history size
            if (this.navigationHistory.length > this.maxHistoryLength) {
              this.navigationHistory.shift();
            }
          }
          
          // Update active tab
          this.updateActiveTabFromRoute(childRoute);
        }
      });
  }

  /**
   * Extract child route from full URL
   */
  private extractChildRoute(url: string): string {
    const parts = url.split('/');
    const dashboardIndex = parts.findIndex(p => p === 'customer-dashboard');
    
    if (dashboardIndex !== -1 && parts.length > dashboardIndex + 1) {
      return parts[dashboardIndex + 1].split('?')[0]; // Remove query params
    }
    
    return 'cust-profile'; // Default route
  }

  /**
   * Update active tab based on route
   */
  private updateActiveTabFromRoute(childRoute: string): void {
    const routeToTab: { [key: string]: string } = {
      'cust-profile': 'profile',
      'cust-orders': 'orders',
      'cust-support': 'support',
      'cust-wallet': 'wallet',
      'cust-notifications': 'notifications',
      'cust-settings': 'settings',
      'cust-addresses': 'addresses',
      'cust-email-preferences': 'email-preferences'
    };
    
    this.activeTab = routeToTab[childRoute] || 'profile';
  }

  /**
   * Set active tab from current route on initialization
   */
  private setActiveTabFromRoute(): void {
    const currentUrl = this.router.url;
    const childRoute = this.extractChildRoute(currentUrl);
    this.updateActiveTabFromRoute(childRoute);
    
    // Initialize history with current route
    if (this.navigationHistory.length === 0) {
      this.navigationHistory.push(childRoute);
    }
  }

  /**
   * Handle browser back button - exit dashboard completely
   */
  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent): void {
    // Exit dashboard and go back to the page before entering dashboard
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
   * Check if can go back (always true - will exit dashboard)
   */
  canGoBack(): boolean {
    return true;
  }



toggleNotifications(): void {
  this.showNotifications = !this.showNotifications;
}

openUserMenu(): void {
  // Implement user menu logic here, or leave empty if not needed yet
}

dismissNotification(notificationId: number): void {
  // Remove the notification with the given id from the notifications array
  this.notifications = this.notifications.filter(n => n.id !== notificationId.toString());
}

markAllAsRead(): void {
  if (this.notifications && Array.isArray(this.notifications)) {
    this.notifications.forEach(notification => notification.read = true);
  }
}
  /**
   * Toggle sidebar collapsed state
   */
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    
    // Store preference in localStorage if needed
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed.toString());
    }
  }

  /**
   * Set active navigation tab
   */
  setActiveTab(tabKey: string): void {
    // Handle logout separately
    if (tabKey === 'logout') {
      this.handleLogout();
      return;
    }
    
    this.activeTab = tabKey;
    
    // Find the corresponding routerLink
    const navItem = [...this.navigationItems, ...this.bottomNavigationItems]
      .find(item => item.key === tabKey);
    
    if (navItem?.routerLink) {
      // Navigate with replaceUrl to prevent history stacking within dashboard
      this.router.navigate(['/customer-dashboard', navItem.routerLink], {
        replaceUrl: true
      });
    }
  }

  
  // it's own
  /**
     * Load dashboard data
     */
  private loadDashboardData(): void {
    // Simulate API calls to load dashboard data
    // In a real application, you would call your services here

    // load default user state
    if (!this.userState.customer && !this.userState.vendor && !this.userState.admin) {
      this.userState.loadUserFromStorage();
    }
    
    // Load user preferences
    this.loadUserPreferences();
  }

  /**
   * Load user preferences from storage
   */
  private loadUserPreferences(): void {
    if (typeof Storage !== 'undefined') {
      const savedSidebarState = localStorage.getItem('sidebarCollapsed');
      if (savedSidebarState) {
        this.sidebarCollapsed = savedSidebarState === 'true';
      }
      
      // Note: Don't load activeTab from localStorage - it should be determined by URL
      // This ensures the correct tab is shown when page is refreshed
    }
  }

  /**
   * Handle responsive behavior
   */
  private handleResize(): void {
    const width = window.innerWidth;
    
    // Auto-collapse sidebar on mobile
    if (width < 1024) {
      this.sidebarCollapsed = true;
    } else if (width > 1024) {
      // Restore user preference on desktop
      this.loadUserPreferences();
    }
  }

  private handleLogout(): void {
    // Clear user session
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userPreferences');
    }
    
    // Redirect to login page
    // Example: this.router.navigate(['/login']);
  }

  private navigateToRoute(route: string): void {
    // Implement your Angular Router navigation here
    // Example: this.router.navigate([`/${route}`]);
  }

  /**
     * Handle quick action clicks
     */
  handleQuickAction(actionKey: string): void {
    switch (actionKey) {
      case 'update-profile':
        this.navigateToProfile();
        break;
      case 'new-application':
        this.startNewApplication();
        break;
      case 'track-order':
        this.openOrderTracking();
        break;
      case 'support-ticket':
        this.createSupportTicket();
        break;
      case 'payment-history':
        this.showPaymentHistory();
        break;
      case 'download-docs':
        this.downloadDocuments();
        break;
      default:
        break;
    }
  }


  /**
   * Navigation methods
   */
  private navigateToProfile(): void {
    this.setActiveTab('profile');
  }
  
  private startNewApplication(): void {
    // Implement new application flow
  }

  private openOrderTracking(): void {
    // Implement order tracking
  }

  private createSupportTicket(): void {
    // Implement support ticket creation
  }

  private showPaymentHistory(): void {
    // Implement payment history view
  }

  private downloadDocuments(): void {
    // Implement document download
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

    // utility functions
    protected getStringUntilFirstSpace(inputString: string | undefined): string {
      if (!inputString) return 'Guest';

      const firstSpaceIndex = inputString.indexOf(' ');

      if (firstSpaceIndex === -1) {
        // If no space is found, return the entire string
        return inputString;
      } else {
        // Return the substring from the beginning up to the first space
        return inputString.substring(0, firstSpaceIndex);
      }
    }

}
