import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { UserStateService } from './user-state.service';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'wallet' | 'security' | 'review' | 'system';
  category: string;
  timestamp: Date;
  read: boolean;
  actionText?: string;
  actionLink?: string;
  icon?: string;
  color?: string;
  metadata?: { [key: string]: any };
}

// API response interface (matches backend CustomerNotification)
interface ApiNotification {
  id: string;
  customerId: string;
  title: string;
  message: string;
  type: string;
  category: string;
  read: boolean;
  deleted: boolean;
  actionText?: string;
  actionLink?: string;
  icon?: string;
  color?: string;
  orderId?: string;
  productId?: string;
  ticketId?: string;
  metadata?: { [key: string]: any };
  priority: number;
  expiresAt?: string;
  createdAt: string;
  readAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  
  private baseUrl = 'http://localhost:50982/odop/customer';
  private useApi = true; // Toggle to use API vs local data

  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private userStateService: UserStateService
  ) {
    // Initialize notifications when service is created
    this.initializeNotifications();
  }

  /**
   * Initialize notifications based on customer data
   */
  private initializeNotifications(): void {
    const customer = this.userStateService.customer;
    if (customer?.customerId) {
      this.loadNotificationsFromStorage(customer.customerId);
    }
  }

  /**
   * Load notifications from localStorage (fallback)
   */
  private loadNotificationsFromStorage(customerId: string): void {
    const storageKey = `notifications_${customerId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.notificationsSubject.next(notifications);
      } catch {
        this.notificationsSubject.next([]);
      }
    }
  }

  /**
   * Save notifications to localStorage (backup)
   */
  private saveNotificationsToStorage(): void {
    const customer = this.userStateService.customer;
    if (customer?.customerId) {
      const storageKey = `notifications_${customer.customerId}`;
      localStorage.setItem(storageKey, JSON.stringify(this.notificationsSubject.value));
    }
  }

  /**
   * Map API notification to App notification
   */
  private mapApiToApp(apiNotification: ApiNotification): AppNotification {
    return {
      id: apiNotification.id,
      title: apiNotification.title,
      message: apiNotification.message,
      type: apiNotification.type as AppNotification['type'],
      category: apiNotification.category,
      timestamp: new Date(apiNotification.createdAt),
      read: apiNotification.read,
      actionText: apiNotification.actionText,
      actionLink: apiNotification.actionLink,
      icon: apiNotification.icon,
      color: apiNotification.color,
      metadata: {
        ...apiNotification.metadata,
        orderId: apiNotification.orderId,
        productId: apiNotification.productId,
        ticketId: apiNotification.ticketId
      }
    };
  }

  /**
   * Get all notifications
   */
  getNotifications(): Observable<AppNotification[]> {
    return this.notifications$;
  }

  /**
   * Load/refresh notifications from backend
   */
  fetchNotifications(): Observable<AppNotification[]> {
    this.isLoadingSubject.next(true);
    const customer = this.userStateService.customer;
    
    if (!customer?.customerId) {
      this.isLoadingSubject.next(false);
      return of([]);
    }

    if (this.useApi) {
      return this.http.get<ApiNotification[]>(`${this.baseUrl}/${customer.customerId}/notifications`).pipe(
        map(apiNotifications => apiNotifications.map(n => this.mapApiToApp(n))),
        tap(notifications => {
          this.notificationsSubject.next(notifications);
          this.saveNotificationsToStorage();
          this.isLoadingSubject.next(false);
        }),
        catchError(error => {
          console.warn('API failed, falling back to generated notifications:', error);
          return this.fetchNotificationsFallback(customer);
        })
      );
    } else {
      return this.fetchNotificationsFallback(customer);
    }
  }

  /**
   * Fallback: Generate notifications locally
   */
  private fetchNotificationsFallback(customer: any): Observable<AppNotification[]> {
    return of(this.generateDynamicNotifications(customer)).pipe(
      delay(600),
      tap(notifications => {
        this.notificationsSubject.next(notifications);
        this.saveNotificationsToStorage();
        this.isLoadingSubject.next(false);
      })
    );
  }

  /**
   * Get unread count from API
   */
  fetchUnreadCount(): Observable<number> {
    const customer = this.userStateService.customer;
    if (!customer?.customerId) {
      return of(0);
    }

    return this.http.get<{ count: number }>(`${this.baseUrl}/${customer.customerId}/notifications/unread/count`).pipe(
      map(response => response.count),
      catchError(() => this.notifications$.pipe(
        map(notifications => notifications.filter(n => !n.read).length)
      ))
    );
  }

  /**
   * Mark a single notification as read (API + local)
   */
  markAsRead(notificationId: string): void {
    const customer = this.userStateService.customer;
    const notifications = this.notificationsSubject.value;
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification && !notification.read) {
      // Update locally first
      notification.read = true;
      this.notificationsSubject.next([...notifications]);
      this.saveNotificationsToStorage();

      // Update via API
      if (this.useApi && customer?.customerId) {
        this.http.patch(`${this.baseUrl}/${customer.customerId}/notifications/${notificationId}/read`, {})
          .subscribe({
            error: (err) => console.warn('Failed to sync read status to API:', err)
          });
      }
    }
  }

  /**
   * Mark all notifications as read (API + local)
   */
  markAllAsRead(): number {
    const customer = this.userStateService.customer;
    const notifications = this.notificationsSubject.value;
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
      notifications.forEach(n => n.read = true);
      this.notificationsSubject.next([...notifications]);
      this.saveNotificationsToStorage();

      // Update via API
      if (this.useApi && customer?.customerId) {
        this.http.patch(`${this.baseUrl}/${customer.customerId}/notifications/read-all`, {})
          .subscribe({
            error: (err) => console.warn('Failed to sync mark-all-read to API:', err)
          });
      }
    }
    
    return unreadCount;
  }

  /**
   * Delete a notification (API + local)
   */
  deleteNotification(notificationId: string): AppNotification | null {
    const customer = this.userStateService.customer;
    const notifications = this.notificationsSubject.value;
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index > -1) {
      const deleted = notifications.splice(index, 1)[0];
      this.notificationsSubject.next([...notifications]);
      this.saveNotificationsToStorage();

      // Delete via API
      if (this.useApi && customer?.customerId) {
        this.http.delete(`${this.baseUrl}/${customer.customerId}/notifications/${notificationId}`)
          .subscribe({
            error: (err) => console.warn('Failed to sync deletion to API:', err)
          });
      }

      return deleted;
    }
    
    return null;
  }

  /**
   * Restore a deleted notification
   */
  restoreNotification(notification: AppNotification): void {
    const customer = this.userStateService.customer;
    const notifications = this.notificationsSubject.value;
    notifications.push(notification);
    notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    this.notificationsSubject.next([...notifications]);
    this.saveNotificationsToStorage();

    // Restore via API
    if (this.useApi && customer?.customerId) {
      this.http.post(`${this.baseUrl}/${customer.customerId}/notifications/${notification.id}/restore`, {})
        .subscribe({
          error: (err) => console.warn('Failed to sync restore to API:', err)
        });
    }
  }

  /**
   * Generate notifications dynamically based on customer data
   */
  private generateDynamicNotifications(customer: any): AppNotification[] {
    const notifications: AppNotification[] = [];
    const now = new Date();
    
    // Only generate notifications if there's a logged-in customer
    if (!customer?.customerId) {
      return [];
    }

    // 1. ORDER NOTIFICATIONS - Based on actual orders
    if (customer.orders && customer.orders.length > 0) {
      customer.orders.slice(0, 3).forEach((order: any, index: number) => {
        const orderDate = order.orderDate ? new Date(order.orderDate) : new Date(now.getTime() - index * 24 * 60 * 60 * 1000);
        const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Recent order - shipping update
        if (daysSinceOrder <= 7 && order.status !== 'Delivered') {
          notifications.push({
            id: `order-${order.orderId || index}-update`,
            title: `Order #${order.orderId || `ORD${1000 + index}`} Update`,
            message: this.getOrderStatusMessage(order.status, order.orderId),
            type: 'order',
            category: 'Orders',
            timestamp: new Date(now.getTime() - (index * 4 + 2) * 60 * 60 * 1000),
            read: index > 0,
            actionText: 'Track Order',
            actionLink: '/customer-dashboard/cust-orders',
            metadata: { orderId: order.orderId }
          });
        }
        
        // Delivered order - ask for review
        if (order.status === 'Delivered' && daysSinceOrder <= 14) {
          notifications.push({
            id: `review-${order.orderId || index}`,
            title: 'Rate your recent purchase',
            message: `How was your experience with order #${order.orderId || `ORD${1000 + index}`}? Your feedback helps artisans improve.`,
            type: 'review',
            category: 'Reviews',
            timestamp: new Date(now.getTime() - (index * 24 + 12) * 60 * 60 * 1000),
            read: false,
            actionText: 'Write Review',
            actionLink: '/customer-dashboard/cust-orders',
            metadata: { orderId: order.orderId }
          });
        }
      });
    }

    // 2. WALLET NOTIFICATIONS - Based on wallet balance and transactions
    if (customer.walletBalance && customer.walletBalance > 0) {
      notifications.push({
        id: 'wallet-balance-reminder',
        title: 'Wallet Balance Available',
        message: `You have ₹${customer.walletBalance.toLocaleString('en-IN')} in your wallet. Use it for faster checkout!`,
        type: 'wallet',
        category: 'Wallet',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        read: true,
        actionText: 'View Wallet',
        actionLink: '/customer-dashboard/cust-wallet'
      });
    }

    // Recent wallet transactions
    if (customer.walletTransactions && customer.walletTransactions.length > 0) {
      const recentTx = customer.walletTransactions[0];
      const txDate = new Date(recentTx.date);
      const hoursSinceTx = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60));
      
      if (hoursSinceTx <= 48) {
        notifications.push({
          id: `wallet-tx-${recentTx.transactionId}`,
          title: recentTx.type === 'credit' ? 'Money Added to Wallet' : 'Wallet Payment',
          message: `₹${recentTx.amount.toLocaleString('en-IN')} ${recentTx.type === 'credit' ? 'added to' : 'debited from'} your wallet. ${recentTx.description}`,
          type: 'wallet',
          category: 'Wallet',
          timestamp: txDate,
          read: hoursSinceTx > 24,
          actionText: 'View Details',
          actionLink: '/customer-dashboard/cust-wallet',
          metadata: { transactionId: recentTx.transactionId }
        });
      }
    }

    // 3. REWARD CREDITS NOTIFICATION
    if (customer.rewardCredits && customer.rewardCredits > 0) {
      notifications.push({
        id: 'reward-credits-available',
        title: '🎉 Reward Credits Available!',
        message: `You have ₹${customer.rewardCredits.toLocaleString('en-IN')} reward credits. Use them on your next order!`,
        type: 'wallet',
        category: 'Rewards',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        read: false,
        actionText: 'Redeem Now',
        actionLink: '/customer-dashboard/cust-wallet'
      });
    }

    // 4. WISHLIST NOTIFICATIONS - Items in wishlist
    if (customer.wishlistProductIds && customer.wishlistProductIds.length > 0) {
      notifications.push({
        id: 'wishlist-reminder',
        title: 'Items in Your Wishlist',
        message: `You have ${customer.wishlistProductIds.length} item(s) in your wishlist. Some might be selling fast!`,
        type: 'promotion',
        category: 'Wishlist',
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        read: true,
        actionText: 'View Wishlist',
        actionLink: '/products'
      });
    }

    // 5. CART REMINDER
    if (customer.cartProductIds && customer.cartProductIds.length > 0) {
      notifications.push({
        id: 'cart-reminder',
        title: 'Items in Your Cart',
        message: `Don't forget! You have ${customer.cartProductIds.length} item(s) waiting in your cart. Complete your purchase!`,
        type: 'promotion',
        category: 'Cart',
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        read: false,
        actionText: 'View Cart',
        actionLink: '/shopping_cart'
      });
    }

    // 6. PROFILE COMPLETION NOTIFICATION
    const profileComplete = this.checkProfileCompletion(customer);
    if (profileComplete < 100) {
      notifications.push({
        id: 'profile-incomplete',
        title: 'Complete Your Profile',
        message: `Your profile is ${profileComplete}% complete. Add missing details to unlock personalized recommendations!`,
        type: 'system',
        category: 'Account',
        timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        read: profileComplete > 70,
        actionText: 'Update Profile',
        actionLink: '/customer-dashboard/cust-profile'
      });
    }

    // 7. MEMBERSHIP TIER NOTIFICATION
    if (customer.membershipTier && customer.membershipTier !== 'bronze') {
      notifications.push({
        id: 'membership-tier',
        title: `${customer.membershipTier.charAt(0).toUpperCase() + customer.membershipTier.slice(1)} Member Benefits`,
        message: `As a ${customer.membershipTier} member, enjoy exclusive discounts and early access to sales!`,
        type: 'promotion',
        category: 'Membership',
        timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        read: true,
        actionText: 'View Benefits',
        actionLink: '/customer-dashboard/cust-wallet'
      });
    }

    // 8. LAST LOGIN SECURITY NOTIFICATION
    if (customer.lastLogin) {
      const lastLoginDate = new Date(customer.lastLogin);
      const daysSinceLastLogin = Math.floor((now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastLogin > 7) {
        notifications.push({
          id: 'welcome-back',
          title: 'Welcome Back!',
          message: `It's been ${daysSinceLastLogin} days since your last visit. Check out what's new!`,
          type: 'system',
          category: 'Account',
          timestamp: now,
          read: false,
          actionText: 'Explore',
          actionLink: '/products'
        });
      }
    }

    // Sort by timestamp (newest first)
    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get order status message based on status
   */
  private getOrderStatusMessage(status: string, orderId: string): string {
    const messages: { [key: string]: string } = {
      'Pending': `Your order #${orderId} is pending confirmation. We'll update you soon.`,
      'Processing': `Great news! Your order #${orderId} is being prepared by the artisan.`,
      'Shipped': `Your order #${orderId} is on its way! Track it for real-time updates.`,
      'Out for Delivery': `Your order #${orderId} is out for delivery. It will arrive today!`,
      'Delivered': `Your order #${orderId} has been delivered. Enjoy your purchase!`,
      'Cancelled': `Your order #${orderId} has been cancelled. Refund will be processed within 5-7 days.`
    };
    return messages[status] || `Your order #${orderId} status has been updated.`;
  }

  /**
   * Check profile completion percentage
   */
  private checkProfileCompletion(customer: any): number {
    if (!customer) return 0;
    
    const fields = [
      'fullName', 'emailAddress', 'contactNumber', 'address', 
      'city', 'state', 'pinCode', 'dateOfBirth', 'gender', 'profilePicturePath'
    ];
    
    const completedFields = fields.filter(field => 
      customer[field] && customer[field].toString().trim() !== ''
    ).length;
    
    return Math.round((completedFields / fields.length) * 100);
  }

  /**
   * Delete a notification (local only - fallback)
   */
  deleteNotificationLocal(notificationId: string): AppNotification | null {
    const notifications = this.notificationsSubject.value;
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index > -1) {
      const deleted = notifications.splice(index, 1)[0];
      this.notificationsSubject.next([...notifications]);
      this.saveNotificationsToStorage();
      return deleted;
    }
    
    return null;
  }

  /**
   * Add a new notification (API + local)
   */
  addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): void {
    const customer = this.userStateService.customer;
    const newNotification: AppNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };
    
    const notifications = [newNotification, ...this.notificationsSubject.value];
    this.notificationsSubject.next(notifications);
    this.saveNotificationsToStorage();

    // Create via API
    if (this.useApi && customer?.customerId) {
      const apiPayload = {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        actionText: notification.actionText,
        actionLink: notification.actionLink,
        icon: notification.icon,
        color: notification.color
      };
      this.http.post(`${this.baseUrl}/${customer.customerId}/notifications`, apiPayload)
        .subscribe({
          next: (response: any) => {
            // Update local ID with API ID
            const idx = notifications.findIndex(n => n.id === newNotification.id);
            if (idx > -1 && response.id) {
              notifications[idx].id = response.id;
              this.notificationsSubject.next([...notifications]);
              this.saveNotificationsToStorage();
            }
          },
          error: (err) => console.warn('Failed to sync new notification to API:', err)
        });
    }
  }

  /**
   * Clear all notifications (API + local)
   */
  clearAllNotifications(): void {
    const customer = this.userStateService.customer;
    this.notificationsSubject.next([]);
    this.saveNotificationsToStorage();

    // Delete all via API
    if (this.useApi && customer?.customerId) {
      this.http.delete(`${this.baseUrl}/${customer.customerId}/notifications/all`)
        .subscribe({
          error: (err) => console.warn('Failed to sync clear-all to API:', err)
        });
    }
  }

  /**
   * Get notification statistics from API
   */
  getNotificationStats(): Observable<{ total: number; unread: number; highPriority: number }> {
    const customer = this.userStateService.customer;
    if (!customer?.customerId) {
      return of({ total: 0, unread: 0, highPriority: 0 });
    }

    return this.http.get<{ total: number; unread: number; highPriority: number }>(
      `${this.baseUrl}/${customer.customerId}/notifications/stats`
    ).pipe(
      catchError(() => {
        const notifications = this.notificationsSubject.value;
        return of({
          total: notifications.length,
          unread: notifications.filter(n => !n.read).length,
          highPriority: 0
        });
      })
    );
  }

  /**
   * Get notifications by type from API
   */
  getNotificationsByType(type: string): Observable<AppNotification[]> {
    const customer = this.userStateService.customer;
    if (!customer?.customerId) {
      return of([]);
    }

    return this.http.get<ApiNotification[]>(
      `${this.baseUrl}/${customer.customerId}/notifications/type/${type}`
    ).pipe(
      map(apiNotifications => apiNotifications.map(n => this.mapApiToApp(n))),
      catchError(() => {
        return of(this.notificationsSubject.value.filter(n => n.type === type));
      })
    );
  }
}
