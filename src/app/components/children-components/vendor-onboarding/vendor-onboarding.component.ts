import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { ProductServiceService } from 'src/app/project/services/product-service.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  current: boolean;
  action: string;
  route?: string;
  checkField?: string;
}

@Component({
  selector: 'app-vendor-onboarding',
  templateUrl: './vendor-onboarding.component.html',
  styleUrls: ['./vendor-onboarding.component.css']
  ,
  standalone: true,
  imports: [CommonModule]
})
export class VendorOnboardingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Output() onboardingComplete = new EventEmitter<boolean>();
  @Output() dismissed = new EventEmitter<void>();

  steps: OnboardingStep[] = [];
  completedCount = 0;
  totalSteps = 5;
  completionPercentage = 0;
  isNewVendor = false;
  vendorStatus = 'pending';
  showOnboarding = true;
  isLoading = true;

  constructor(
    private router: Router,
    public userState: UserStateService,
    private productService: ProductServiceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.showOnboarding = localStorage.getItem('vendor_onboarding_dismissed') !== 'true';
    this.initializeSteps();
    if (this.showOnboarding) {
      this.checkVendorProgress();
    } else {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSteps(): void {
    this.steps = [
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Add your shop name, description, profile picture, and contact details',
        icon: 'fa-user-circle',
        completed: false,
        current: true,
        action: 'Complete Profile',
        route: 'vendor-store-settings'
      },
      {
        id: 'verification',
        title: 'Upload Verification Documents',
        description: 'Submit PAN, Aadhaar, business license, and GSTIN for verification',
        icon: 'fa-id-card',
        completed: false,
        current: false,
        action: 'Upload Documents',
        route: 'vendor-verification'
      },
      {
        id: 'product',
        title: 'Add Your First Product',
        description: 'List at least one product with images, pricing, and description',
        icon: 'fa-box-open',
        completed: false,
        current: false,
        action: 'Add Product',
        route: 'add-new-product'
      },
      {
        id: 'shipping',
        title: 'Set Up Shipping & Payment',
        description: 'Configure delivery areas, shipping charges, and payment preferences',
        icon: 'fa-truck',
        completed: false,
        current: false,
        action: 'Configure',
        route: 'vendor-store-settings'
      },
      {
        id: 'go_live',
        title: 'Go Live!',
        description: 'Await admin verification and start receiving orders',
        icon: 'fa-rocket',
        completed: false,
        current: false,
        action: 'Check Status',
        route: 'vendor-verification'
      }
    ];
  }

  private checkVendorProgress(): void {
    this.isLoading = true;
    const vendor = this.userState.vendor;

    if (!vendor) {
      this.isLoading = false;
      return;
    }
    const vendorId = vendor.vendorId;
    if (!vendorId) {
      this.isLoading = false;
      return;
    }
    const vendorAny = vendor as any;

    this.vendorStatus = vendor.status || 'pending';

    // Step 1: Profile completeness
    const hasProfile = !!(
      vendor.shoppeeName &&
      vendor.shopkeeperName &&
      vendor.contactNumber &&
      vendor.shoppeeAddress &&
      vendor.locationState
    );
    this.steps[0].completed = hasProfile;

    // Step 2: Verification documents
    const hasVerification = !!(
      vendor.businessRegistryNumber ||
      vendorAny.businessLicenseNumber ||
      vendorAny.taxIdentificationNumber ||
      vendorAny.kycDocumentsUploaded
    );
    this.steps[1].completed = hasVerification;

    // Step 3: Has products - check via API
    this.productService.getProductByVendorId(vendorId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (products: any) => {
        const productCount = Array.isArray(products) ? products.length : 0;
        this.steps[2].completed = productCount > 0;

        // Step 4: Shipping & Payment setup
        const hasShipping = !!(
          vendor.deliveryAvailable !== undefined &&
          (vendor.deliveryOptions?.length || 0) > 0
        );
        this.steps[3].completed = hasShipping;

        // Step 5: Go Live - verified by admin
        this.steps[4].completed = vendor.status === 'verified' || (vendor as any).isVerified === true;

        this.updateProgress();
        this.isLoading = false;
      },
      error: () => {
        this.steps[2].completed = (vendorAny.productCount || 0) > 0;
        this.steps[3].completed = false;
        this.steps[4].completed = vendor.status === 'verified';
        this.updateProgress();
        this.isLoading = false;
      }
    });
  }

  private updateProgress(): void {
    this.completedCount = this.steps.filter(s => s.completed).length;
    this.completionPercentage = Math.round((this.completedCount / this.totalSteps) * 100);
    this.isNewVendor = this.completedCount < 3;

    // Set current step to first incomplete step
    let currentSet = false;
    this.steps.forEach(step => {
      step.current = false;
      if (!step.completed && !currentSet) {
        step.current = true;
        currentSet = true;
      }
    });

    if (this.completionPercentage === 100) {
      this.onboardingComplete.emit(true);
    }
  }

  goToStep(step: OnboardingStep): void {
    if (step.route) {
      this.router.navigate(['/vendor-dashboard', step.route]);
    }
  }

  dismissOnboarding(): void {
    this.showOnboarding = false;
    this.dismissed.emit();
    localStorage.setItem('vendor_onboarding_dismissed', 'true');
  }

  getStatusLabel(): string {
    switch (this.vendorStatus) {
      case 'verified': return 'Verified';
      case 'rejected': return 'Action Required';
      case 'pending': return 'Pending Verification';
      default: return 'Getting Started';
    }
  }

  getStatusIcon(): string {
    switch (this.vendorStatus) {
      case 'verified': return 'fa-check-circle';
      case 'rejected': return 'fa-exclamation-triangle';
      case 'pending': return 'fa-clock';
      default: return 'fa-info-circle';
    }
  }

  getStatusClass(): string {
    switch (this.vendorStatus) {
      case 'verified': return 'status-verified';
      case 'rejected': return 'status-rejected';
      case 'pending': return 'status-pending';
      default: return 'status-default';
    }
  }
}
