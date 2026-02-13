import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces
export interface Notification {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  iconUrl?: string;
  type: NotificationType;
  category: string;
  actionUrl?: string;
  actionType?: string;
  actionData?: { [key: string]: string };
  read: boolean;
  readAt?: string;
  createdAt: string;
  referenceId?: string;
  referenceType?: string;
  priority: NotificationPriority;
}

export enum NotificationType {
  // Order related
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_RETURNED = 'ORDER_RETURNED',
  
  // Payment related
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_INITIATED = 'REFUND_INITIATED',
  REFUND_COMPLETED = 'REFUND_COMPLETED',
  
  // Shipment related
  SHIPMENT_DISPATCHED = 'SHIPMENT_DISPATCHED',
  SHIPMENT_IN_TRANSIT = 'SHIPMENT_IN_TRANSIT',
  SHIPMENT_OUT_FOR_DELIVERY = 'SHIPMENT_OUT_FOR_DELIVERY',
  SHIPMENT_DELIVERED = 'SHIPMENT_DELIVERED',
  SHIPMENT_DELAYED = 'SHIPMENT_DELAYED',
  
  // Promotion related
  PROMOTION = 'PROMOTION',
  FLASH_SALE = 'FLASH_SALE',
  PRICE_DROP = 'PRICE_DROP',
  BACK_IN_STOCK = 'BACK_IN_STOCK',
  
  // Vendor related
  NEW_ORDER = 'NEW_ORDER',
  LOW_STOCK_ALERT = 'LOW_STOCK_ALERT',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  VERIFICATION_UPDATE = 'VERIFICATION_UPDATE',
  
  // System related
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  ACCOUNT_UPDATE = 'ACCOUNT_UPDATE',
  SECURITY_ALERT = 'SECURITY_ALERT',
  REMINDER = 'REMINDER',
  
  // Social
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  VENDOR_UPDATE = 'VENDOR_UPDATE'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationChannel {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  IN_APP = 'IN_APP'
}

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface NotificationPreferences {
  userId: string;
  userType: string;
  push: ChannelPreferences;
  email: ChannelPreferences;
  sms: ChannelPreferences;
  whatsapp: ChannelPreferences;
  globalEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
  preferredLanguage: string;
  maxDailyNotifications: number;
  maxWeeklyPromotions: number;
  phoneNumber?: string;
  emailAddress?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  devices?: DeviceInfo[];
}

export interface ChannelPreferences {
  enabled: boolean;
  orderUpdates: boolean;
  paymentUpdates: boolean;
  shipmentUpdates: boolean;
  promotions: boolean;
  priceDropAlerts: boolean;
  backInStockAlerts: boolean;
  securityAlerts: boolean;
  accountUpdates: boolean;
  reviewResponses: boolean;
  newOrders: boolean;
  lowStockAlerts: boolean;
  reviewNotifications: boolean;
  verificationUpdates: boolean;
  promotionFrequency: 'INSTANT' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: 'WEB' | 'ANDROID' | 'IOS';
  active: boolean;
}

export interface RegisterDeviceRequest {
  token: string;
  platform: 'WEB' | 'ANDROID' | 'IOS';
  deviceId?: string;
  deviceName?: string;
}

export interface SendNotificationRequest {
  title: string;
  body: string;
  imageUrl?: string;
  iconUrl?: string;
  type: NotificationType;
  category?: string;
  userId?: string;
  userIds?: string[];
  userType?: string;
  sendToAll?: boolean;
  channels?: NotificationChannel[];
  actionUrl?: string;
  actionType?: string;
  actionData?: { [key: string]: string };
  referenceId?: string;
  referenceType?: string;
  priority?: NotificationPriority;
  templateId?: string;
  templateData?: { [key: string]: string };
  scheduledTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/odop/notifications`;
  
  // State
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private pollingSubscription: any;
  private pushPermission: NotificationPermission = 'default';

  constructor(private http: HttpClient) {
    this.checkPushPermission();
  }

  // ==================== NOTIFICATIONS ====================

  /**
   * Get notifications for a user with pagination
   */
  getNotifications(userId: string, page: number = 0, size: number = 20): Observable<NotificationPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<NotificationPage>(`${this.apiUrl}/user/${userId}`, { params });
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(userId: string): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/user/${userId}/unread-count`).pipe(
      tap(response => this.unreadCountSubject.next(response.count))
    );
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}/unread`).pipe(
      tap(notifications => this.notificationsSubject.next(notifications))
    );
  }

  /**
   * Get notifications by type
   */
  getNotificationsByType(userId: string, type: NotificationType): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}/type/${type}`);
  }

  // ==================== READ STATUS ====================

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Update local state
        const current = this.notificationsSubject.value;
        const updated = current.map(n => 
          n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
        );
        this.notificationsSubject.next(updated);
        this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1));
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/user/${userId}/read-all`, {}).pipe(
      tap(() => {
        const current = this.notificationsSubject.value;
        const updated = current.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }));
        this.notificationsSubject.next(updated);
        this.unreadCountSubject.next(0);
      })
    );
  }

  // ==================== DELETE ====================

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}/user/${userId}`).pipe(
      tap(() => {
        const current = this.notificationsSubject.value;
        const notification = current.find(n => n.id === notificationId);
        const updated = current.filter(n => n.id !== notificationId);
        this.notificationsSubject.next(updated);
        if (notification && !notification.read) {
          this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1));
        }
      })
    );
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/user/${userId}/clear-all`).pipe(
      tap(() => {
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
      })
    );
  }

  // ==================== PREFERENCES ====================

  /**
   * Get notification preferences
   */
  getPreferences(userId: string): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.apiUrl}/preferences/${userId}`);
  }

  /**
   * Update notification preferences
   */
  updatePreferences(userId: string, preferences: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(`${this.apiUrl}/preferences/${userId}`, preferences);
  }

  // ==================== DEVICE REGISTRATION ====================

  /**
   * Register device for push notifications
   */
  registerDevice(userId: string, request: RegisterDeviceRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/devices/${userId}`, request);
  }

  /**
   * Unregister device
   */
  unregisterDevice(userId: string, deviceToken: string): Observable<void> {
    const params = new HttpParams().set('deviceToken', deviceToken);
    return this.http.delete<void>(`${this.apiUrl}/devices/${userId}`, { params });
  }

  // ==================== ADMIN (if authorized) ====================

  /**
   * Send notification (Admin only)
   */
  sendNotification(request: SendNotificationRequest): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/admin/send`, request);
  }

  /**
   * Send bulk notification (Admin only)
   */
  sendBulkNotification(request: SendNotificationRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/admin/send-bulk`, request);
  }

  /**
   * Test push notification
   */
  testPushNotification(userId: string): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/test/push/${userId}`, {});
  }

  // ==================== PUSH NOTIFICATIONS (Browser) ====================

  /**
   * Check if push notifications are supported
   */
  isPushSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Check current push permission
   */
  checkPushPermission(): void {
    if (this.isPushSupported()) {
      this.pushPermission = Notification.permission;
    }
  }

  /**
   * Get push permission status
   */
  getPushPermission(): NotificationPermission {
    return this.pushPermission;
  }

  /**
   * Request push notification permission
   */
  async requestPushPermission(): Promise<NotificationPermission> {
    if (!this.isPushSupported()) {
      console.warn('Push notifications not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.pushPermission = permission;
      return permission;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return 'denied';
    }
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(title: string, options?: NotificationOptions): void {
    if (this.pushPermission === 'granted') {
      const notification = new Notification(title, {
        icon: '/assets/icons/notification-icon.png',
        badge: '/assets/icons/badge-icon.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        // Navigate to action URL if provided
        if (options?.data?.actionUrl) {
          window.location.href = options.data.actionUrl;
        }
      };
    }
  }

  /**
   * Subscribe to push notifications via service worker
   */
  async subscribeToPush(userId: string): Promise<boolean> {
    if (!this.isPushSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get existing subscription or create new one
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        // Note: You'll need to add your VAPID public key here
        const vapidPublicKey = environment.vapidPublicKey || '';
        
        if (!vapidPublicKey) {
          console.warn('VAPID public key not configured');
          return false;
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer
        });
      }

      // Register device token with backend
      const deviceRequest: RegisterDeviceRequest = {
        token: JSON.stringify(subscription),
        platform: 'WEB',
        deviceId: this.generateDeviceId(),
        deviceName: this.getDeviceName()
      };

      await this.registerDevice(userId, deviceRequest).toPromise();
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(userId: string): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await this.unregisterDevice(userId, JSON.stringify(subscription)).toPromise();
      }
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      return false;
    }
  }

  // ==================== POLLING ====================

  /**
   * Start polling for new notifications
   */
  startPolling(userId: string, intervalMs: number = 30000): void {
    this.stopPolling();
    
    this.pollingSubscription = interval(intervalMs).pipe(
      switchMap(() => this.getUnreadCount(userId))
    ).subscribe({
      error: (err) => console.error('Notification polling error:', err)
    });
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  // ==================== HELPERS ====================

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: NotificationType): string {
    const iconMap: { [key: string]: string } = {
      ORDER_PLACED: 'shopping_cart',
      ORDER_CONFIRMED: 'check_circle',
      ORDER_SHIPPED: 'local_shipping',
      ORDER_DELIVERED: 'inventory_2',
      ORDER_CANCELLED: 'cancel',
      ORDER_RETURNED: 'assignment_return',
      PAYMENT_SUCCESS: 'payments',
      PAYMENT_FAILED: 'payment_error',
      REFUND_INITIATED: 'currency_exchange',
      REFUND_COMPLETED: 'account_balance_wallet',
      SHIPMENT_DISPATCHED: 'flight_takeoff',
      SHIPMENT_IN_TRANSIT: 'local_shipping',
      SHIPMENT_OUT_FOR_DELIVERY: 'delivery_dining',
      SHIPMENT_DELIVERED: 'where_to_vote',
      SHIPMENT_DELAYED: 'schedule',
      PROMOTION: 'local_offer',
      FLASH_SALE: 'flash_on',
      PRICE_DROP: 'trending_down',
      BACK_IN_STOCK: 'inventory',
      NEW_ORDER: 'add_shopping_cart',
      LOW_STOCK_ALERT: 'warning',
      REVIEW_RECEIVED: 'rate_review',
      VERIFICATION_UPDATE: 'verified_user',
      SYSTEM_UPDATE: 'system_update',
      ACCOUNT_UPDATE: 'manage_accounts',
      SECURITY_ALERT: 'security',
      REMINDER: 'alarm',
      NEW_FOLLOWER: 'person_add',
      VENDOR_UPDATE: 'store'
    };
    
    return iconMap[type] || 'notifications';
  }

  /**
   * Get notification color based on priority
   */
  getNotificationColor(priority: NotificationPriority): string {
    const colorMap: { [key: string]: string } = {
      LOW: '#9e9e9e',
      NORMAL: '#2196f3',
      HIGH: '#ff9800',
      URGENT: '#f44336'
    };
    
    return colorMap[priority] || '#2196f3';
  }

  /**
   * Format notification time
   */
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: diffDays > 365 ? 'numeric' : undefined
    });
  }

  /**
   * Group notifications by date
   */
  groupNotificationsByDate(notifications: Notification[]): Map<string, Notification[]> {
    const groups = new Map<string, Notification[]>();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.createdAt).toDateString();
      let key: string;

      if (notificationDate === today) {
        key = 'Today';
      } else if (notificationDate === yesterday) {
        key = 'Yesterday';
      } else {
        key = new Date(notification.createdAt).toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    });

    return groups;
  }

  /**
   * Create default channel preferences
   */
  createDefaultChannelPreferences(): ChannelPreferences {
    return {
      enabled: true,
      orderUpdates: true,
      paymentUpdates: true,
      shipmentUpdates: true,
      promotions: true,
      priceDropAlerts: true,
      backInStockAlerts: true,
      securityAlerts: true,
      accountUpdates: true,
      reviewResponses: true,
      newOrders: true,
      lowStockAlerts: true,
      reviewNotifications: true,
      verificationUpdates: true,
      promotionFrequency: 'DAILY_DIGEST'
    };
  }

  // ==================== PRIVATE HELPERS ====================

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('odop_device_id');
    if (!deviceId) {
      deviceId = 'web_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('odop_device_id', deviceId);
    }
    return deviceId;
  }

  private getDeviceName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome Browser';
    if (ua.includes('Firefox')) return 'Firefox Browser';
    if (ua.includes('Safari')) return 'Safari Browser';
    if (ua.includes('Edge')) return 'Edge Browser';
    return 'Web Browser';
  }
}
