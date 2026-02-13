import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserStateService } from '../../project/services/user-state.service';
import { CustomerServiceService } from '../../project/services/customer-service.service';
import { VendorServiceService } from '../../project/services/vendor-service.service';
import { Router } from '@angular/router';

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface LinkedAccount {
  provider: string;
  icon: string;
  connected: boolean;
  email?: string;
  connectedDate?: Date;
}

interface SecurityLog {
  action: string;
  device: string;
  location: string;
  date: Date;
  ip: string;
}

@Component({
  selector: 'app-account-settings-page-component',
  templateUrl: './account-settings-page-component.component.html',
  styleUrls: ['./account-settings-page-component.component.css']
})
export class AccountSettingsPageComponentComponent implements OnInit {
  activeTab: string = 'profile';
  isLoading: boolean = false;
  isSaving: boolean = false;

  // Forms
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  addressForm!: FormGroup;

  // User data
  userType: 'customer' | 'vendor' | 'admin' = 'customer';
  profileImageUrl: string = '';
  isUploadingImage: boolean = false;

  // Tabs configuration
  tabs = [
    { id: 'profile', label: 'Profile', icon: 'fa-user' },
    { id: 'security', label: 'Security', icon: 'fa-shield-alt' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
    { id: 'addresses', label: 'Addresses', icon: 'fa-map-marker-alt' },
    { id: 'linked-accounts', label: 'Linked Accounts', icon: 'fa-link' },
    { id: 'privacy', label: 'Privacy', icon: 'fa-lock' },
    { id: 'danger-zone', label: 'Danger Zone', icon: 'fa-exclamation-triangle' }
  ];

  // Notification settings
  notificationSettings: NotificationSetting[] = [
    {
      key: 'orders',
      label: 'Order Updates',
      description: 'Get notified about order status changes, shipping updates, and delivery confirmations',
      email: true,
      push: true,
      sms: false
    },
    {
      key: 'promotions',
      label: 'Promotions & Offers',
      description: 'Receive special offers, discounts, and promotional announcements',
      email: true,
      push: false,
      sms: false
    },
    {
      key: 'wishlist',
      label: 'Wishlist Alerts',
      description: 'Get notified when items in your wishlist go on sale or are back in stock',
      email: true,
      push: true,
      sms: false
    },
    {
      key: 'reviews',
      label: 'Review Reminders',
      description: 'Reminders to review products you have purchased',
      email: true,
      push: false,
      sms: false
    },
    {
      key: 'newsletter',
      label: 'Newsletter',
      description: 'Weekly digest of new products, artisan stories, and ODOP updates',
      email: true,
      push: false,
      sms: false
    },
    {
      key: 'security',
      label: 'Security Alerts',
      description: 'Important security notifications about your account',
      email: true,
      push: true,
      sms: true
    }
  ];

  // Linked accounts
  linkedAccounts: LinkedAccount[] = [
    { provider: 'Google', icon: 'fa-google', connected: false },
    { provider: 'Facebook', icon: 'fa-facebook-f', connected: false },
    { provider: 'Apple', icon: 'fa-apple', connected: false }
  ];

  // Security settings
  twoFactorEnabled: boolean = false;
  showTwoFactorSetup: boolean = false;
  twoFactorMethod: string = 'authenticator';

  // Security logs
  securityLogs: SecurityLog[] = [
    { action: 'Login', device: 'Chrome on Windows', location: 'Mumbai, India', date: new Date(), ip: '192.168.1.xxx' },
    { action: 'Password Changed', device: 'Chrome on Windows', location: 'Mumbai, India', date: new Date(Date.now() - 86400000), ip: '192.168.1.xxx' },
    { action: 'Login', device: 'Mobile App on Android', location: 'Pune, India', date: new Date(Date.now() - 172800000), ip: '192.168.2.xxx' }
  ];

  // Saved addresses
  savedAddresses: any[] = [];
  isAddingAddress: boolean = false;
  editingAddressId: string | null = null;

  // Privacy settings
  privacySettings = {
    profileVisibility: 'public',
    showPurchaseHistory: false,
    showWishlist: false,
    allowDataAnalytics: true,
    personalizedAds: true
  };

  // States for address dropdown
  states: string[] = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    public userState: UserStateService,
    private customerService: CustomerServiceService,
    private vendorService: VendorServiceService,
    private router: Router
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadSavedAddresses();
  }

  initForms(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      dateOfBirth: [''],
      gender: [''],
      bio: ['', [Validators.maxLength(500)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.addressForm = this.fb.group({
      label: ['Home', [Validators.required]],
      fullName: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      isDefault: [false]
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    }
    return null;
  }

  loadUserData(): void {
    this.isLoading = true;
    
    if (this.userState.customer) {
      this.userType = 'customer';
      const customer = this.userState.customer;
      this.profileForm.patchValue({
        fullName: customer.fullName || '',
        email: customer.emailAddress || '',
        phone: customer.contactNumber?.toString() || '',
        dateOfBirth: customer.dateOfBirth || '',
        gender: customer.gender || ''
      });
      this.profileImageUrl = customer.profilePicturePath || '';
    } else if (this.userState.vendor) {
      this.userType = 'vendor';
      const vendor = this.userState.vendor;
      this.profileForm.patchValue({
        fullName: vendor.fullName || '',
        email: vendor.emailAddress || '',
        phone: vendor.contactNumber?.toString() || ''
      });
      this.profileImageUrl = vendor.profilePictureUrl || '';
    }
    
    this.isLoading = false;
  }

  loadSavedAddresses(): void {
    // Customer has single address field, parse it or show as primary address
    if (this.userState.customer?.address) {
      this.savedAddresses = [{
        id: '1',
        type: 'primary',
        fullName: this.userState.customer.fullName || '',
        phone: this.userState.customer.contactNumber?.toString() || '',
        addressLine1: this.userState.customer.address || '',
        addressLine2: '',
        city: this.userState.customer.city || '',
        state: this.userState.customer.state || '',
        pinCode: this.userState.customer.pinCode || '',
        isDefault: true
      }];
    }
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  // Profile methods
  onProfileImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        this.showSnackbar('Image size should be less than 5MB', 'error');
        return;
      }

      this.isUploadingImage = true;
      
      // Simulate upload - replace with actual service call
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profileImageUrl = e.target?.result as string;
        this.isUploadingImage = false;
        this.showSnackbar('Profile image updated', 'success');
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isSaving = true;
    const formData = this.profileForm.value;
    
    // Map form data to CustomerDto format
    const profileData: any = {
      fullName: formData.fullName,
      emailAddress: formData.email,
      contactNumber: formData.phone ? parseInt(formData.phone, 10) : undefined,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender
    };

    if (this.userType === 'customer' && this.userState.customer?.customerId) {
      this.customerService.updateCustomerById(this.userState.customer.customerId, profileData).subscribe({
        next: (response: any) => {
          // Update local state with merged data
          const updatedCustomer = { ...this.userState.customer!, ...profileData };
          localStorage.setItem('loggedInUser', JSON.stringify(updatedCustomer));
          this.showSnackbar('Profile updated successfully', 'success');
          this.isSaving = false;
        },
        error: (error: any) => {
          this.showSnackbar('Failed to update profile', 'error');
          this.isSaving = false;
        }
      });
    } else {
      // Simulate save for demo
      setTimeout(() => {
        this.showSnackbar('Profile updated successfully', 'success');
        this.isSaving = false;
      }, 1000);
    }
  }

  // Password methods
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.isSaving = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    // Simulate password change - backend API for password change not available
    // In production, this would call a proper password change endpoint
    if (this.userType === 'customer' && this.userState.customer?.customerId) {
      // Simulating API call for demo
      setTimeout(() => {
        this.showSnackbar('Password changed successfully', 'success');
        this.passwordForm.reset();
        this.isSaving = false;
      }, 1000);
    } else {
      setTimeout(() => {
        this.showSnackbar('Password changed successfully', 'success');
        this.passwordForm.reset();
        this.isSaving = false;
      }, 1000);
    }
  }

  // Two-factor authentication
  toggleTwoFactor(): void {
    if (this.twoFactorEnabled) {
      // Disable 2FA
      this.twoFactorEnabled = false;
      this.showSnackbar('Two-factor authentication disabled', 'success');
    } else {
      // Show setup dialog
      this.showTwoFactorSetup = true;
    }
  }

  setupTwoFactor(): void {
    this.twoFactorEnabled = true;
    this.showTwoFactorSetup = false;
    this.showSnackbar('Two-factor authentication enabled', 'success');
  }

  cancelTwoFactorSetup(): void {
    this.showTwoFactorSetup = false;
  }

  // Notification methods
  toggleNotification(setting: NotificationSetting, channel: 'email' | 'push' | 'sms'): void {
    setting[channel] = !setting[channel];
    this.saveNotificationSettings();
  }

  saveNotificationSettings(): void {
    // Save to backend
    this.showSnackbar('Notification preferences saved', 'success');
  }

  // Address methods
  startAddAddress(): void {
    this.isAddingAddress = true;
    this.editingAddressId = null;
    this.addressForm.reset({ label: 'Home', isDefault: false });
  }

  editAddress(address: any): void {
    this.isAddingAddress = true;
    this.editingAddressId = address.id;
    this.addressForm.patchValue(address);
  }

  cancelAddressForm(): void {
    this.isAddingAddress = false;
    this.editingAddressId = null;
    this.addressForm.reset();
  }

  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.markFormGroupTouched(this.addressForm);
      return;
    }

    const addressData = this.addressForm.value;
    
    if (this.editingAddressId) {
      // Update existing
      const index = this.savedAddresses.findIndex(a => a.id === this.editingAddressId);
      if (index >= 0) {
        this.savedAddresses[index] = { ...addressData, id: this.editingAddressId };
      }
      this.showSnackbar('Address updated', 'success');
    } else {
      // Add new
      const newAddress = { ...addressData, id: Date.now().toString() };
      if (newAddress.isDefault) {
        this.savedAddresses.forEach(a => a.isDefault = false);
      }
      this.savedAddresses.push(newAddress);
      this.showSnackbar('Address added', 'success');
    }

    this.cancelAddressForm();
  }

  deleteAddress(addressId: string): void {
    this.savedAddresses = this.savedAddresses.filter(a => a.id !== addressId);
    this.showSnackbar('Address deleted', 'success');
  }

  setDefaultAddress(addressId: string): void {
    this.savedAddresses.forEach(a => a.isDefault = a.id === addressId);
    this.showSnackbar('Default address updated', 'success');
  }

  // Linked accounts methods
  connectAccount(account: LinkedAccount): void {
    // Trigger OAuth flow
    this.showSnackbar(`Connecting to ${account.provider}...`, 'info');
    
    // Simulate connection
    setTimeout(() => {
      account.connected = true;
      account.email = 'user@example.com';
      account.connectedDate = new Date();
      this.showSnackbar(`${account.provider} account connected`, 'success');
    }, 1500);
  }

  disconnectAccount(account: LinkedAccount): void {
    account.connected = false;
    account.email = undefined;
    account.connectedDate = undefined;
    this.showSnackbar(`${account.provider} account disconnected`, 'success');
  }

  // Privacy methods
  savePrivacySettings(): void {
    this.showSnackbar('Privacy settings saved', 'success');
  }

  // Danger zone methods
  downloadData(): void {
    this.showSnackbar('Preparing your data download...', 'info');
    // Trigger data export
  }

  deactivateAccount(): void {
    if (confirm('Are you sure you want to deactivate your account? You can reactivate it by logging in again.')) {
      this.showSnackbar('Account deactivated', 'success');
      // Logout and redirect
    }
  }

  deleteAccount(): void {
    if (confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      if (confirm('This will delete all your data including orders, reviews, and saved items. Type "DELETE" to confirm.')) {
        this.showSnackbar('Account deletion initiated', 'success');
        // Process account deletion
      }
    }
  }

  // Utility methods
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  showSnackbar(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  getPasswordStrength(): { strength: string; class: string; percentage: number } {
    const password = this.passwordForm.get('newPassword')?.value || '';
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { strength: 'Weak', class: 'weak', percentage: 25 };
    if (score <= 4) return { strength: 'Medium', class: 'medium', percentage: 50 };
    if (score <= 5) return { strength: 'Strong', class: 'strong', percentage: 75 };
    return { strength: 'Very Strong', class: 'very-strong', percentage: 100 };
  }
}
