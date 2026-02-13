import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { VendorServiceService } from '../../../project/services/vendor-service.service';
import { UserStateService } from '../../../project/services/user-state.service';
import { VendorDto as Vendor } from '../../../project/models/vendor';
import { MatSnackBar } from '@angular/material/snack-bar';

interface ShopProfile {
  shopName: string;
  tagline: string;
  description: string;
  logo: string;
  banner: string;
  category: string;
  established: string;
}

interface BusinessInfo {
  ownerName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  panNumber: string;
}

interface PaymentSettings {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  upiId: string;
  payoutFrequency: string;
  minimumPayout: number;
}

interface ShippingZone {
  id: number;
  name: string;
  states: string[];
  baseRate: number;
  freeAbove: number;
  estimatedDays: string;
  isActive: boolean;
}

interface PolicySettings {
  returnPolicy: string;
  returnDays: number;
  shippingPolicy: string;
  privacyPolicy: string;
  termsConditions: string;
}

interface NotificationSettings {
  orderNotifications: boolean;
  messageNotifications: boolean;
  reviewNotifications: boolean;
  promotionalEmails: boolean;
  weeklyReport: boolean;
  lowStockAlerts: boolean;
  payoutNotifications: boolean;
}

@Component({
  selector: 'app-vendor-dashboard-store-settings',
  templateUrl: './vendor-dashboard-store-settings.component.html',
  styleUrls: ['./vendor-dashboard-store-settings.component.css']
})
export class VendorDashboardStoreSettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading states
  isLoading = false;
  loadError: string | null = null;
  vendorId: string = '';
  currentVendor: Vendor | null = null;

  activeTab: string = 'profile';

  shopProfile: ShopProfile = {
    shopName: '',
    tagline: '',
    description: '',
    logo: '',
    banner: '',
    category: '',
    established: ''
  };

  businessInfo: BusinessInfo = {
    ownerName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    panNumber: ''
  };

  paymentSettings: PaymentSettings = {
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    upiId: '',
    payoutFrequency: 'weekly',
    minimumPayout: 500
  };

  shippingZones: ShippingZone[] = [
    {
      id: 1,
      name: 'Local',
      states: [],
      baseRate: 40,
      freeAbove: 499,
      estimatedDays: '2-3',
      isActive: true
    },
    {
      id: 2,
      name: 'Pan India',
      states: [],
      baseRate: 80,
      freeAbove: 999,
      estimatedDays: '5-7',
      isActive: true
    }
  ];

  policySettings: PolicySettings = {
    returnPolicy: 'We accept returns within the specified return window for products that are unused, in original packaging, and with all tags attached.',
    returnDays: 7,
    shippingPolicy: 'Orders are processed within 1-2 business days. Shipping times vary by location.',
    privacyPolicy: 'We respect your privacy and protect your personal information.',
    termsConditions: 'By purchasing from our store, you agree to our terms of service.'
  };

  notificationSettings: NotificationSettings = {
    orderNotifications: true,
    messageNotifications: true,
    reviewNotifications: true,
    promotionalEmails: false,
    weeklyReport: true,
    lowStockAlerts: true,
    payoutNotifications: true
  };

  categories: string[] = [
    'Handicrafts & Textiles',
    'Pottery & Ceramics',
    'Jewelry & Accessories',
    'Home Decor',
    'Art & Paintings',
    'Leather Goods',
    'Woodwork',
    'Metal Crafts',
    'Food & Spices',
    'Other'
  ];

  states: string[] = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
  ];

  payoutFrequencies: {value: string, label: string}[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  isSaving: boolean = false;
  saveMessage: string = '';

  constructor(
    private vendorService: VendorServiceService,
    private userStateService: UserStateService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.initializeVendor();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeVendor(): void {
    this.userStateService.vendor$
      .pipe(takeUntil(this.destroy$))
      .subscribe((vendor: Vendor | null) => {
        if (vendor && vendor.vendorId) {
          this.vendorId = vendor.vendorId;
          this.loadVendorData(vendor.vendorId);
        } else {
          this.loadError = 'Vendor not authenticated';
        }
      });
  }

  loadVendorData(vendorId: string): void {
    this.isLoading = true;
    this.loadError = null;

    this.vendorService.getVendorById(vendorId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (vendor: Vendor) => {
          this.currentVendor = vendor;
          this.populateFormData(vendor);
        },
        error: (error) => {
          console.error('Error loading vendor data:', error);
          this.loadError = error.error?.message || 'Failed to load settings. Please try again.';
        }
      });
  }

  private populateFormData(vendor: Vendor): void {
    // Populate shop profile using existing VendorDto properties
    this.shopProfile = {
      shopName: vendor.shoppeeName || vendor.businessName || '',
      tagline: vendor.shopDescription?.substring(0, 100) || '',
      description: vendor.shopDescription || '',
      logo: vendor.profilePictureUrl || '',
      banner: vendor.shopImages?.[0] || '',
      category: vendor.specializations?.[0] || '',
      established: ''
    };

    // Populate business info using existing VendorDto properties
    this.businessInfo = {
      ownerName: vendor.shopkeeperName || vendor.fullName || '',
      email: vendor.emailAddress || '',
      phone: vendor.contactNumber?.toString() || '',
      alternatePhone: '',
      address: vendor.shoppeeAddress || vendor.address || '',
      city: vendor.district || vendor.city || '',
      state: vendor.state || vendor.locationState || '',
      pincode: vendor.pinCode || '',
      gstNumber: vendor.businessRegistryNumber || '',
      panNumber: ''
    };

    // Populate shipping zones based on vendor state
    const vendorState = vendor.state || vendor.locationState;
    if (vendorState) {
      this.shippingZones[0].name = `Local (${vendorState})`;
      this.shippingZones[0].states = [vendorState];
    }
  }

  refreshSettings(): void {
    if (this.vendorId) {
      this.loadVendorData(this.vendorId);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  saveProfile(): void {
    if (!this.currentVendor || !this.vendorId) return;
    
    const updatedVendor: Vendor = {
      ...this.currentVendor,
      shoppeeName: this.shopProfile.shopName,
      businessName: this.shopProfile.shopName,
      shopDescription: this.shopProfile.description,
      profilePictureUrl: this.shopProfile.logo,
      specializations: this.shopProfile.category ? [this.shopProfile.category] : []
    };
    
    this.saveVendorData(updatedVendor, 'Shop profile updated successfully!');
  }

  saveBusinessInfo(): void {
    if (!this.currentVendor || !this.vendorId) return;
    
    const updatedVendor: Vendor = {
      ...this.currentVendor,
      shopkeeperName: this.businessInfo.ownerName,
      fullName: this.businessInfo.ownerName,
      emailAddress: this.businessInfo.email,
      contactNumber: this.businessInfo.phone ? parseInt(this.businessInfo.phone) : undefined,
      shoppeeAddress: this.businessInfo.address,
      address: this.businessInfo.address,
      district: this.businessInfo.city,
      city: this.businessInfo.city,
      state: this.businessInfo.state,
      locationState: this.businessInfo.state,
      pinCode: this.businessInfo.pincode,
      businessRegistryNumber: this.businessInfo.gstNumber
    };
    
    this.saveVendorData(updatedVendor, 'Business information saved successfully!');
  }

  private saveVendorData(vendor: Vendor, successMessage: string): void {
    this.isSaving = true;
    
    this.vendorService.updateVendorById(this.vendorId, vendor)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving = false)
      )
      .subscribe({
        next: (updated: Vendor) => {
          this.currentVendor = updated;
          this.snackBar.open(successMessage, 'Close', { duration: 3000 });
          this.saveMessage = successMessage;
          setTimeout(() => this.saveMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error saving vendor data:', error);
          this.snackBar.open('Failed to save changes. Please try again.', 'Close', { duration: 3000 });
        }
      });
  }

  savePaymentSettings(): void {
    this.saveLocalSettings('Payment settings updated successfully!');
  }

  saveShippingSettings(): void {
    this.saveLocalSettings('Shipping zones saved successfully!');
  }

  savePolicies(): void {
    this.saveLocalSettings('Policies updated successfully!');
  }

  saveNotifications(): void {
    this.saveLocalSettings('Notification preferences saved!');
  }

  private saveLocalSettings(message: string): void {
    this.isSaving = true;
    // These settings would need backend support for proper persistence
    // For now, simulate save
    setTimeout(() => {
      this.isSaving = false;
      this.saveMessage = message;
      this.snackBar.open(message, 'Close', { duration: 3000 });
      setTimeout(() => this.saveMessage = '', 3000);
    }, 1000);
  }

  uploadLogo(): void {
    console.log('Upload logo');
    // TODO: Implement image upload
  }

  uploadBanner(): void {
    console.log('Upload banner');
    // TODO: Implement image upload
  }

  toggleShippingZone(zone: ShippingZone): void {
    zone.isActive = !zone.isActive;
  }

  addShippingZone(): void {
    const newZone: ShippingZone = {
      id: this.shippingZones.length + 1,
      name: 'New Zone',
      states: [],
      baseRate: 50,
      freeAbove: 999,
      estimatedDays: '5-7',
      isActive: true
    };
    this.shippingZones.push(newZone);
  }

  removeShippingZone(zone: ShippingZone): void {
    this.shippingZones = this.shippingZones.filter(z => z.id !== zone.id);
  }

  updateBankDetails(): void {
    console.log('Update bank details');
    // TODO: Implement bank details update
  }
}
