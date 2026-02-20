import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { DashboardComponentComponent } from 'src/app/components/customer-components/dashboard-component/dashboard-component.component';
import { CustUpdateProfileDialComponent } from 'src/app/components/dialogs/customer-dialogs/cust-update-profile-dial/cust-update-profile-dial.component';
import { WishlistDialogComponent } from 'src/app/components/dialogs/wishlist-dialog/wishlist-dialog.component';
import { CartDialogComponent } from 'src/app/components/dialogs/cart-dialog/cart-dialog.component';
import { UpdateCustomerProfileDialogComponent } from 'src/app/components/dialogs/update-customer-profile-dialog/update-customer-profile-dialog.component';
import { PremiumMembershipDialogComponent } from 'src/app/components/dialogs/premium-membership-dialog/premium-membership-dialog.component';
import { CustomerAnalyticsDialogComponent } from 'src/app/components/dialogs/customer-analytics-dialog/customer-analytics-dialog.component';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { WishlistService } from 'src/app/project/services/wishlist.service';
import { OrderService } from 'src/app/project/services/order.service';
import { CartServiceService } from 'src/app/project/services/cart-service.service';

interface DashboardStat {
  icon: string;
  value: string;
  label: string;
  color: string;
  trend: number;
  progress?: number;
}

interface WishlistItem {
  id: string;
  name: string;
  image: string;
  price: number;
  vendorId?: string;
  originalPrice?: number;
  discount?: number;
}

interface Activity {
  title: string;
  description: string;
  time: string;
  color: string;
  meta?: string;
  isLast?: boolean;
}

interface Insight {
  title: string;
  description: string;
  icon: string;
  color: string;
  action: string;
  actionText: string;
}

interface User {
  name: string;
  email: string;
  phone: string;
  location: string;
  photoUrl?: string;
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

interface QuickLink {
  key: string;
  title: string;
  icon: string;
  color: string;
  count?: number;
}

interface QuickAction {
  key: string;
  title: string;
  description: string;
  icon: string;
}



@Component({
  selector: 'app-customer-profile',
  templateUrl: './customer-profile.component.html',
  styleUrls: ['./customer-profile.component.css'],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(15px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideInLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class CustomerProfileComponent implements OnInit, OnDestroy {
  
  private refreshInterval: any;
  private ordersCache: any[] = [];

    
    // Math reference for template
    Math = Math;
    
    
  
    // User data - populated from userState
    get user(): User {
      const customer = this.userState.customer;
      if (customer) {
        return {
          name: customer.fullName || 'Guest User',
          email: customer.emailAddress || 'No email',
          phone: customer.contactNumber ? `+91 ${customer.contactNumber}` : 'No phone',
          location: customer.city && customer.state ? `${customer.city}, ${customer.state}` : 'Location not set',
          photoUrl: customer.profilePicturePath || ''
        };
      }
      return {
        name: 'Guest User',
        email: 'Not logged in',
        phone: '',
        location: ''
      };
    }
    
    
    
    // Quick actions
    quickActions: QuickAction[] = [
      {
        key: 'update-profile',
        title: 'Update Profile',
        description: 'Keep your information current',
        icon: 'fas fa-user-edit'
      },
      {
        key: 'new-application',
        title: 'New Application',
        description: 'Start a new service request',
        icon: 'fas fa-plus-circle'
      },
      {
        key: 'track-order',
        title: 'Track Order',
        description: 'Monitor your order status',
        icon: 'fas fa-truck'
      },
      {
        key: 'support-ticket',
        title: 'Support Ticket',
        description: 'Get help when you need it',
        icon: 'fas fa-life-ring'
      },
      {
        key: 'payment-history',
        title: 'Payment History',
        description: 'View your transaction records',
        icon: 'fas fa-credit-card'
      },
      {
        key: 'download-docs',
        title: 'Download Documents',
        description: 'Access your official documents',
        icon: 'fas fa-download'
      }
    ];
  
    
  discount?: number;
  
  
  
  // Recent activities - dynamically generated from user actions
  recentActivities: Activity[] = [];
  
  
  // Recent orders - loaded from userState.customer.orders
  recentOrders: Array<{
    id: string;
    status: string;
    statusText: string;
    image: string;
    itemName: string;
    quantity: number;
    amount: number;
    date: string;
    progress: number;
  }> = [];
  
  // Add this property to your component class
  quickLinks = [
    {
      key: 'orders',
      title: 'My Orders',
      icon: 'fas fa-box',
      color: '#007bff',
      count: 0,
      routerLink: 'cust-orders'
    },
    {
      key: 'wishlist',
      title: 'Wishlist',
      icon: 'fas fa-heart',
      color: '#e83e8c',
      count: 0,
    },
    {
      key: 'support',
      title: 'Support',
      icon: 'fas fa-headset',
      color: '#28a745',
      routerLink: '/support'
    }
  ];

  // Dashboard statistics - computed from real data
  get dashboardStats(): DashboardStat[] {
    const orders = this.ordersCache;
    const activeOrders = orders.filter(o => {
      const status = (o.orderStatus || o.status || '').toLowerCase();
      return status !== 'delivered' && status !== 'cancelled';
    }).length;
    const completedOrders = orders.filter(o => (o.orderStatus || o.status || '').toLowerCase() === 'delivered').length;
    const wishlistCount = this.wishlistItems.length;
    const cartCount = this.userState.customer?.cartProductIds?.length || 0;
    
    return [
      {
        label: 'Active Orders',
        value: activeOrders.toString(),
        icon: 'fas fa-shopping-cart',
        color: '#3B82F6',
        trend: 0
      },
      {
        label: 'Completed Orders',
        value: completedOrders.toString(),
        icon: 'fas fa-check-circle',
        color: '#10B981',
        trend: 0
      },
      {
        label: 'Wishlist Items',
        value: wishlistCount.toString(),
        icon: 'fas fa-heart',
        color: '#F59E0B',
        trend: 0
      },
      {
        label: 'Cart Items',
        value: cartCount.toString(),
        icon: 'fas fa-shopping-basket',
        color: '#8B5CF6',
        trend: 0
      }
    ];
  }

  get membershipTierLabel(): string {
    const tier = this.userState.customer?.membershipTier;
    if (!tier) {
      return 'Standard Tier';
    }
    return `${tier.charAt(0).toUpperCase()}${tier.slice(1)} Tier`;
  }

  get userRoleLabel(): string {
    return this.userState.customer?.membershipTier ? 'Member' : 'Customer';
  }

  insights = [
    {
      icon: 'fas fa-lightbulb',
      color: '#FFD700',
      title: 'Upgrade to Premium',
      description: 'Get access to exclusive features and priority support.',
      action: 'upgrade',
      actionText: 'Upgrade Now'
    },
    {
      icon: 'fas fa-chart-pie',
      color: '#4CAF50',
      title: 'View Analytics',
      description: 'Check your latest usage analytics and trends.',
      action: 'analytics',
      actionText: 'View Analytics'
    },
    {
      icon: 'fas fa-user-shield',
      color: '#2196F3',
      title: 'Enhance Security',
      description: 'Enable two-factor authentication for better security.',
      action: 'security',
      actionText: 'Enable 2FA'
    }
  ];

  constructor(
    public userState: UserStateService, 
    private router: Router, 
    private dialog: MatDialog, 
    private dashboardComp: DashboardComponentComponent,
    private snackBar: MatSnackBar,
    private wishlistService: WishlistService,
    private orderService: OrderService,
    private cartService: CartServiceService
  ) { }

  ngOnInit(): void {
    // Initialize dashboard data
    this.loadDashboardData();
    
    // Refresh stats periodically (every 30 seconds)
    this.refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, 30000);
  }

  ngOnDestroy(): void {
    // Clean up interval when component is destroyed
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Load all dashboard data from user state
   */
  private loadDashboardData(): void {
    this.displayActiveOrders();
    this.loadWishlistItems();
    this.loadRecentOrders();
    this.updateQuickLinksCounts();
    this.loadRecentActivities();
  }

  /**
   * Load wishlist items from user state
   */
  private loadWishlistItems(): void {
    this.wishlistService.loadWishlist().subscribe({
      next: (response) => {
        this.wishlistItems = response.items.map(item => ({
          id: item.productId,
          name: item.productName || 'Product',
          image: item.productImageURL || item.productImage || 'assets/images/product-placeholder.svg',
          price: item.discountedPrice ?? item.productPrice ?? item.price ?? 0,
          vendorId: item.vendorId,
          originalPrice: item.productPrice ?? item.price ?? item.discountedPrice ?? 0,
          discount: (item.productPrice ?? item.price ?? 0) > (item.discountedPrice ?? item.productPrice ?? item.price ?? 0)
            ? Math.round((((item.productPrice ?? item.price ?? 0) - (item.discountedPrice ?? item.productPrice ?? item.price ?? 0)) / (item.productPrice ?? item.price ?? 1)) * 100)
            : 0
        }));

        if (this.userState.customer) {
          this.userState.customer.wishlistProductIds = response.items.map(item => item.productId);
          this.userState.saveUserToStorage(this.userState.customer);
        }

        this.updateQuickLinksCounts();
      },
      error: () => {
        this.wishlistItems = [];
        this.updateQuickLinksCounts();
      }
    });
  }

  /**
   * Load recent orders from user state
   */
  private loadRecentOrders(): void {
    const customerId = this.userState.customer?.customerId;
    if (!customerId) {
      this.ordersCache = [];
      this.recentOrders = [];
      return;
    }

    this.orderService.getOrdersByCustomerId(customerId).subscribe({
      next: (orders) => {
        this.ordersCache = orders || [];

        if (this.userState.customer) {
          this.userState.customer.orders = this.ordersCache;
          this.userState.saveUserToStorage(this.userState.customer);
        }

        this.recentOrders = this.ordersCache
          .slice(0, 5)
          .map(order => this.mapOrderToRecent(order));

        this.displayActiveOrders();
        this.updateQuickLinksCounts();
        this.loadRecentActivities();
      },
      error: () => {
        this.ordersCache = this.userState.customer?.orders || [];
        this.recentOrders = this.ordersCache.slice(0, 5).map(order => this.mapOrderToRecent(order));
      }
    });
  }

  private mapOrderToRecent(order: any): RecentOrder {
    const status = (order.orderStatus || order.status || 'pending').toLowerCase();
    const orderItems = order.orderItems || order.productList || [];
    const firstItem = orderItems.length > 0 ? orderItems[0] : null;

    return {
      id: order.orderId || order.id || 'N/A',
      status,
      statusText: this.getStatusText(status),
      image: firstItem?.productImageURL || firstItem?.productImage || order.productImage || 'assets/images/product-placeholder.svg',
      itemName: firstItem?.productName || order.productName || 'Product',
      quantity: firstItem?.quantity || order.quantity || 1,
      amount: order.finalAmount || order.totalAmount || order.totalPrice || firstItem?.totalPrice || 0,
      date: order.orderDateTime || order.orderDate ? new Date(order.orderDateTime || order.orderDate).toLocaleDateString() : 'N/A',
      progress: this.getOrderProgress(status)
    };
  }

  /**
   * Update quick links counts
   */
  private updateQuickLinksCounts(): void {
    const orders = this.ordersCache;
    const wishlistCount = this.wishlistItems.length;
    
    this.quickLinks = this.quickLinks.map(link => {
      if (link.key === 'orders') {
        return { ...link, count: orders.length };
      } else if (link.key === 'wishlist') {
        return { ...link, count: wishlistCount };
      }
      return link;
    });
  }

  /**
   * Get status text from status code
   */
  private getStatusText(status: string | undefined): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusMap[status || 'pending'] || 'Pending';
  }

  /**
   * Get order progress percentage based on status
   */
  private getOrderProgress(status: string | undefined): number {
    const progressMap: { [key: string]: number } = {
      'pending': 20,
      'confirmed': 40,
      'processing': 60,
      'shipped': 80,
      'delivered': 100,
      'cancelled': 0
    };
    return progressMap[status || 'pending'] || 20;
  }

  /**
   * Navigate to different sections
   */
  select(key: string): void {
    switch (key) {
      case 'orders':
        this.router.navigate(['/customer-dashboard/cust-orders']);
        this.dashboardComp.setActiveTab('orders');
        break;
      case 'wishlist':
        this.openWishlistDialog();
        break;
      case 'support':
        this.router.navigate(['/customer-dashboard/cust-support']);
        this.dashboardComp.setActiveTab('support');
        break;
      case 'profile':
        // Already on profile
        break;
      default:
        console.log('Selected:', key);
    }
  }
  
  /**
   * Navigate to checkout with product
   */
  buyNow(itemId: number): void {
    // Navigate to product detail or checkout
    this.router.navigate(['/product_detail', itemId]);
  }
  
  /**
   * Add item to cart
   */
  addToCart(itemId: number): void {
    const customerId = this.userState.customer?.customerId;
    if (!customerId) {
      this.snackBar.open('Please login to add items to cart', 'Close', {
        duration: 2500,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }

    const productId = itemId.toString();
    const item = this.wishlistItems.find(wishlistItem => wishlistItem.id === productId);

    this.cartService.registerCart({
      productId,
      customerId,
      vendorId: item?.vendorId,
      quantity: 1,
      approval: false
    }).subscribe({
      next: () => {
        const cartIds = this.userState.customer?.cartProductIds || [];
        if (!cartIds.includes(productId)) {
          this.userState.broadcastCartUpdate([...cartIds, productId]);
        }

        this.snackBar.open('Added to cart', 'Close', {
          duration: 2000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });

        this.dialog.open(CartDialogComponent, {
          width: '500px',
          maxWidth: '95vw',
          data: { customerId }
        });
      },
      error: () => {
        this.snackBar.open('Failed to add item to cart', 'Close', {
          duration: 2500,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  /**
   * Open wishlist dialog
   */
  openWishlistDialog(): void {
    this.dialog.open(WishlistDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: { customerId: this.userState.customer?.customerId }
    });
  }

  private refreshStats(): void {
    // Update stats with real data
    this.loadDashboardData();
  }
  
  // Wishlist items property (will be loaded from userState)
  wishlistItems: WishlistItem[] = [];
  
  /**
   * Remove item from wishlist
   */
  removeFromWishlist(itemId: number): void {
    const productId = itemId.toString();

    this.wishlistService.removeFromWishlist(productId).subscribe({
      next: (response) => {
        if (!response.success) {
          return;
        }

        this.wishlistItems = this.wishlistItems.filter(item => item.id !== productId);

        const wishlistIds = this.userState.customer?.wishlistProductIds || [];
        this.userState.broadcastWishlistUpdate(wishlistIds.filter(id => id !== productId));

        this.updateQuickLinksCounts();
        this.snackBar.open('Removed from wishlist', 'Close', {
          duration: 2000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      },
      error: () => {
        this.snackBar.open('Failed to remove from wishlist', 'Close', {
          duration: 2500,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }
  
  /**
   * Quick view product - navigate to product detail
   */
  quickView(itemId: number): void {
    this.router.navigate(['/product_detail', itemId]);
  }

  /**
   * Handle insight card actions
   */
  handleInsight(action: string): void {
    switch (action) {
      case 'upgrade':
        // Open premium membership dialog
        this.dialog.open(PremiumMembershipDialogComponent, {
          width: '100vw',
          maxWidth: '1150px',
          panelClass: 'premium-membership-dialog-panel',
          disableClose: false,
          autoFocus: false
        });
        break;
      case 'analytics':
        // Open customer analytics dialog
        this.dialog.open(CustomerAnalyticsDialogComponent, {
          width: '100vw',
          maxWidth: '950px',
          panelClass: 'customer-analytics-dialog-panel',
          disableClose: false,
          autoFocus: false
        });
        break;
      case 'security':
        // Navigate to security settings
        this.router.navigate(['/customer-dashboard/cust-settings']);
        this.dashboardComp.setActiveTab('settings');
        break;
      default:
        console.log('Insight action:', action);
    }
  }
    
  
    /**
     * Utility methods for template
     */
  
    formatNumber(num: number): string {
      return new Intl.NumberFormat('en-IN').format(num);
    }
  
    getRelativeTime(timestamp: string): string {
      const now = new Date();
      const time = new Date(timestamp);
      const diffInMs = now.getTime() - time.getTime();
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);
  
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      } else {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      }
    }
  
    trackOrder(orderId: string | number): void {
      // Navigate to orders page with the specific order selected
      this.router.navigate(['/customer-dashboard/cust-orders'], {
        queryParams: { orderId: orderId }
      });
      this.dashboardComp.setActiveTab('orders');
    }

    refreshActivity(): void {
      // Refresh activity data
      this.loadRecentActivities();
      this.snackBar.open('Activity feed refreshed', 'Close', {
        duration: 2000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
    
    private loadRecentActivities(): void {
      // Load real activity data from customer state
      const activities: Activity[] = [];
      const orders = this.ordersCache;
      
      if (this.userState.customer) {
        // Add recent orders as activities
        if (orders.length > 0) {
          const recentOrders = orders.slice(0, 3);
          recentOrders.forEach((order, index) => {
            const statusColors: { [key: string]: string } = {
              'pending': '#F59E0B',
              'confirmed': '#3B82F6',
              'processing': '#8B5CF6',
              'shipped': '#06B6D4',
              'delivered': '#10B981',
              'cancelled': '#EF4444'
            };
            
            const status = (order.orderStatus || order.status || 'pending').toLowerCase();
            const items = order.orderItems || order.productList || [];
            const firstItem = items.length > 0 ? items[0] : null;

            activities.push({
              title: `Order ${status === 'delivered' ? 'Delivered' : status === 'shipped' ? 'Shipped' : 'Placed'}`,
              description: `Order #${order.orderId || order.id || 'N/A'} - ${firstItem?.productName || order.productName || 'Product'}`,
              time: order.orderDateTime || order.orderDate ? this.getRelativeTime(order.orderDateTime || order.orderDate) : 'Recently',
              color: statusColors[status] || '#3B82F6',
              isLast: index === recentOrders.length - 1 && !this.userState.customer?.lastLogin
            });
          });
        }
        
        // Add login activity if available
        if (this.userState.customer.lastLogin) {
          activities.push({
            title: 'Account Login',
            description: 'You logged into your account',
            time: this.getRelativeTime(this.userState.customer.lastLogin.toString()),
            color: '#10B981',
            isLast: true
          });
        }
      }
      
      // Mark last item
      if (activities.length > 0) {
        activities[activities.length - 1].isLast = true;
      }
      
      this.recentActivities = activities;
    }




    // methods for renderring
    // 1. overview - frequently changed in brackground
    overviewPallet() {
      // Display active orders
      this.displayActiveOrders();

      // rewards points
      // completed applications
    }

    // 2. your wishlist
    yourWishlist() {
      // Logic to display user's wishlist
      console.log('Displaying user wishlist...');
    }

    // 3. recent activities
    // recentActivities() {
    //   // Logic to display recent activities
    //   console.log('Displaying recent activities...');
    // }

    // // 3. recent orders
    // recentOrders() {
    //   // Logic to display recent orders
    //   console.log('Displaying recent orders...');
    // }

    previousUnconfirmedOrderCount: number = 0;
    currentUnconfirmedOrderCount: number = 0;
    trend: 'up' | 'down' | 'same' = 'same';

    displayActiveOrders() {
      const unconfirmedOrders = this.ordersCache.filter(order => {
        const status = (order.orderStatus || order.status || '').toLowerCase();
        return status === 'pending';
      });

      // Store current count
      this.currentUnconfirmedOrderCount = unconfirmedOrders.length;

      // Compare with previous count to set trend
      if (this.currentUnconfirmedOrderCount > this.previousUnconfirmedOrderCount) {
        this.trend = 'up';
      } else if (this.currentUnconfirmedOrderCount < this.previousUnconfirmedOrderCount) {
        this.trend = 'down';
      } else {
        this.trend = 'same';
      }

      // Log the value and trend
      console.log('Unconfirmed Order Count:', this.currentUnconfirmedOrderCount);
      console.log('Trend:', this.trend);

      // Save this count for the next comparison
      this.previousUnconfirmedOrderCount = this.currentUnconfirmedOrderCount;
    }


    // utility methods for template
    quickActionsSelected(key: string): void {
      // Navigate based on quick action selection
      if(key === 'support') {
        this.router.navigate(['/support']);
        return;
      } else if(key === 'wishlist') {
        // show a dialog for wishlist items
        this.dialog.open(WishlistDialogComponent, {
          data: this.wishlistItems || [],
          width: '500px',
        });
        return;
      } else if(key === 'orders') {
        // Navigate to orders tab
        this.router.navigate(['/customer-dashboard/cust-orders']);
        this.dashboardComp.setActiveTab('orders');
        return;
      } else if(key === 'profile') {
        this.editProfileClicked();
        return;
      } else if(key === 'cart') {
        this.router.navigate(['/shopping_cart']);
        return;
      } else {
        // Default: navigate to orders
        this.router.navigate(['/customer-dashboard/cust-orders']);
        this.dashboardComp.setActiveTab('orders');
        return;
      }
    }


    editProfileClicked() {
      // Open profile edit dialog with customer data
      this.dialog.open(UpdateCustomerProfileDialogComponent, {
          data: this.userState.customer || {},
          width: '900px',
        });
    }
}

