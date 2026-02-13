import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { NotificationService, AppNotification } from 'src/app/project/services/notification.service';

@Component({
  selector: 'app-customer-notifications',
  templateUrl: './customer-notifications.component.html',
  styleUrls: ['./customer-notifications.component.css']
})
export class CustomerNotificationsComponent implements OnInit, OnDestroy {

    // Variables
    notifications: AppNotification[] = [];
    filteredNotifications: AppNotification[] = [];
    activeFilter: string = 'all';
    isLoading: boolean = true;
    
    private subscriptions: Subscription[] = [];

    constructor(
      private router: Router,
      private snackBar: MatSnackBar,
      private dialog: MatDialog,
      private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
      // Subscribe to notifications from service
      this.subscriptions.push(
        this.notificationService.notifications$.subscribe(notifications => {
          this.notifications = notifications;
          this.filterNotifications();
        })
      );

      // Subscribe to loading state
      this.subscriptions.push(
        this.notificationService.isLoading$.subscribe(isLoading => {
          this.isLoading = isLoading;
        })
      );

      // Initial load
      this.loadNotifications();
    }

    ngOnDestroy(): void {
      this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    // Get unread count
    get unreadCount(): number {
      return this.notifications.filter(n => !n.read).length;
    }

  loadNotifications(): void {
    this.isLoading = true;
    this.notificationService.fetchNotifications().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to load notifications', 'Retry', {
          duration: 4000
        }).onAction().subscribe(() => this.loadNotifications());
      }
    });
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.filterNotifications();
  }

  filterNotifications(): void {
    switch (this.activeFilter) {
      case 'unread':
        this.filteredNotifications = this.notifications.filter(n => !n.read);
        break;
      case 'promotions':
        this.filteredNotifications = this.notifications.filter(n => n.type === 'promotion');
        break;
      case 'updates':
        this.filteredNotifications = this.notifications.filter(n =>
          n.type === 'order' || n.type === 'wallet' || n.type === 'security' || n.type === 'system'
        );
        break;
      default:
        this.filteredNotifications = [...this.notifications];
    }
  }

  markAsRead(notification: AppNotification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  markAllAsRead(): void {
    const unreadCount = this.unreadCount;
    if (unreadCount === 0) {
      this.snackBar.open('All notifications are already read', 'Close', {
        duration: 2000
      });
      return;
    }

    const count = this.notificationService.markAllAsRead();
    this.filterNotifications();
    
    this.snackBar.open(`${count} notifications marked as read`, 'Close', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  handleAction(notification: AppNotification, event: Event): void {
    event.stopPropagation();
    
    // Mark as read when action is clicked
    this.markAsRead(notification);
    
    // Navigate to action link
    if (notification.actionLink) {
      this.router.navigate([notification.actionLink]);
    }
  }

  deleteNotification(notification: AppNotification, event: Event): void {
    event.stopPropagation();
    
    const deleted = this.notificationService.deleteNotification(notification.id);
    
    if (deleted) {
      this.filterNotifications();
      
      this.snackBar.open('Notification deleted', 'Undo', {
        duration: 3000
      }).onAction().subscribe(() => {
        // Undo delete - restore notification
        this.notificationService.restoreNotification(deleted);
        this.filterNotifications();
      });
    }
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
    
    if (minutes < 60) {
      return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
    } else if (hours < 24) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (days < 7) {
      return days === 1 ? '1 day ago' : `${days} days ago`;
    } else if (weeks < 4) {
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else {
      return timestamp.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: timestamp.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  getIconClass(type: string): string {
    const iconMap: { [key: string]: string } = {
      order: 'icon-order-icon',
      promotion: 'icon-promotion-icon',
      wallet: 'icon-wallet-icon',
      security: 'icon-security-icon',
      review: 'icon-review-icon',
      system: 'icon-system-icon'
    };
    return iconMap[type] || 'icon-order-icon';
  }

  getTypeIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      order: '📦',
      promotion: '🎁',
      wallet: '💰',
      security: '🔒',
      review: '⭐',
      system: '⚙️'
    };
    return iconMap[type] || '📌';
  }

  trackByNotification(index: number, notification: AppNotification): string {
    return notification.id;
  }

  refreshNotifications(): void {
    this.loadNotifications();
    this.snackBar.open('Notifications refreshed', 'Close', {
      duration: 1500
    });
  }
}
