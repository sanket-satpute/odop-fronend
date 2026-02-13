import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  settings: NotificationSetting[];
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  type: 'email' | 'sms' | 'push' | 'all';
}

@Component({
  selector: 'app-email-preferences',
  templateUrl: './email-preferences.component.html',
  styleUrls: ['./email-preferences.component.css']
})
export class EmailPreferencesComponent implements OnInit {
  
  isSaving = false;
  hasChanges = false;
  
  // Master toggle
  masterEmailEnabled = true;
  masterSmsEnabled = false;
  masterPushEnabled = true;
  
  // Notification categories
  categories: NotificationCategory[] = [
    {
      id: 'orders',
      title: 'Order Updates',
      description: 'Get notified about your order status',
      icon: 'fas fa-box',
      settings: [
        { id: 'order_confirmation', label: 'Order Confirmation', description: 'When your order is placed', enabled: true, type: 'all' },
        { id: 'order_shipped', label: 'Shipping Updates', description: 'When your order ships and tracking info', enabled: true, type: 'all' },
        { id: 'order_delivered', label: 'Delivery Confirmation', description: 'When your order is delivered', enabled: true, type: 'email' },
        { id: 'order_cancelled', label: 'Cancellation & Refunds', description: 'Updates on cancellations and refund status', enabled: true, type: 'email' }
      ]
    },
    {
      id: 'promotions',
      title: 'Promotions & Offers',
      description: 'Deals, discounts, and special offers',
      icon: 'fas fa-tag',
      settings: [
        { id: 'flash_sales', label: 'Flash Sales', description: 'Limited-time deals and flash sales', enabled: true, type: 'all' },
        { id: 'personalized_offers', label: 'Personalized Offers', description: 'Deals based on your interests', enabled: true, type: 'email' },
        { id: 'festival_sales', label: 'Festival & Seasonal Sales', description: 'Special occasion offers', enabled: true, type: 'email' },
        { id: 'coupon_alerts', label: 'Coupon Alerts', description: 'New coupons and promo codes', enabled: false, type: 'email' }
      ]
    },
    {
      id: 'products',
      title: 'Product Updates',
      description: 'Updates about products you care about',
      icon: 'fas fa-heart',
      settings: [
        { id: 'wishlist_price_drop', label: 'Wishlist Price Drop', description: 'When items in your wishlist go on sale', enabled: true, type: 'all' },
        { id: 'back_in_stock', label: 'Back in Stock', description: 'When out-of-stock items return', enabled: true, type: 'email' },
        { id: 'new_arrivals', label: 'New Arrivals', description: 'New products in categories you follow', enabled: false, type: 'email' },
        { id: 'product_reviews', label: 'Product Review Requests', description: 'Reminders to review purchased products', enabled: true, type: 'email' }
      ]
    },
    {
      id: 'account',
      title: 'Account & Security',
      description: 'Important account notifications',
      icon: 'fas fa-shield-alt',
      settings: [
        { id: 'login_alerts', label: 'Login Alerts', description: 'When your account is accessed from new device', enabled: true, type: 'all' },
        { id: 'password_changes', label: 'Password Changes', description: 'When your password is changed', enabled: true, type: 'email' },
        { id: 'account_updates', label: 'Account Updates', description: 'Profile and settings changes', enabled: true, type: 'email' },
        { id: 'payment_methods', label: 'Payment Method Updates', description: 'Changes to saved payment methods', enabled: true, type: 'email' }
      ]
    },
    {
      id: 'community',
      title: 'Community & ODOP News',
      description: 'Updates from ODOP community',
      icon: 'fas fa-users',
      settings: [
        { id: 'newsletter', label: 'Weekly Newsletter', description: 'Curated content and stories', enabled: false, type: 'email' },
        { id: 'artisan_stories', label: 'Artisan Stories', description: 'Stories about craftspeople behind products', enabled: false, type: 'email' },
        { id: 'new_vendors', label: 'New Vendor Announcements', description: 'When new artisans join ODOP', enabled: false, type: 'email' },
        { id: 'surveys', label: 'Surveys & Feedback', description: 'Help us improve with your feedback', enabled: false, type: 'email' }
      ]
    }
  ];

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    // Load from localStorage or API
    const saved = localStorage.getItem('notification_preferences');
    if (saved) {
      const preferences = JSON.parse(saved);
      this.masterEmailEnabled = preferences.masterEmail ?? true;
      this.masterSmsEnabled = preferences.masterSms ?? false;
      this.masterPushEnabled = preferences.masterPush ?? true;
      
      // Apply saved settings to categories
      if (preferences.settings) {
        this.categories.forEach(category => {
          category.settings.forEach(setting => {
            if (preferences.settings[setting.id] !== undefined) {
              setting.enabled = preferences.settings[setting.id];
            }
          });
        });
      }
    }
  }

  savePreferences(): void {
    this.isSaving = true;
    
    // Collect all settings
    const settings: { [key: string]: boolean } = {};
    this.categories.forEach(category => {
      category.settings.forEach(setting => {
        settings[setting.id] = setting.enabled;
      });
    });
    
    const preferences = {
      masterEmail: this.masterEmailEnabled,
      masterSms: this.masterSmsEnabled,
      masterPush: this.masterPushEnabled,
      settings
    };
    
    // Save to localStorage
    localStorage.setItem('notification_preferences', JSON.stringify(preferences));
    
    // Simulate API call
    setTimeout(() => {
      this.isSaving = false;
      this.hasChanges = false;
      this.snackBar.open('Preferences saved successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }, 1000);
  }

  onSettingChange(): void {
    this.hasChanges = true;
  }

  toggleMasterEmail(): void {
    this.masterEmailEnabled = !this.masterEmailEnabled;
    this.hasChanges = true;
  }

  toggleMasterSms(): void {
    this.masterSmsEnabled = !this.masterSmsEnabled;
    this.hasChanges = true;
  }

  toggleMasterPush(): void {
    this.masterPushEnabled = !this.masterPushEnabled;
    this.hasChanges = true;
  }

  toggleCategoryAll(category: NotificationCategory, enable: boolean): void {
    category.settings.forEach(setting => {
      setting.enabled = enable;
    });
    this.hasChanges = true;
  }

  getCategoryEnabledCount(category: NotificationCategory): number {
    return category.settings.filter(s => s.enabled).length;
  }

  unsubscribeAll(): void {
    if (confirm('Are you sure you want to unsubscribe from all notifications? You will still receive essential account and security emails.')) {
      this.categories.forEach(category => {
        if (category.id !== 'account') {
          category.settings.forEach(setting => {
            setting.enabled = false;
          });
        }
      });
      this.hasChanges = true;
      this.snackBar.open('Unsubscribed from promotional notifications. Account notifications remain active.', 'Close', {
        duration: 4000,
        panelClass: ['info-snackbar']
      });
    }
  }

  resetToDefault(): void {
    if (confirm('Reset all notification preferences to default settings?')) {
      localStorage.removeItem('notification_preferences');
      this.ngOnInit();
      this.hasChanges = false;
      this.snackBar.open('Preferences reset to default', 'Close', {
        duration: 3000,
        panelClass: ['info-snackbar']
      });
    }
  }
}
