import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Customer } from '../../project/models/customer';
import { Admin } from '../../project/models/admin';
import { Vendor } from '../../project/models/vendor';
import { Router, NavigationEnd } from '@angular/router';
import { Product } from '../../project/models/product';
import { MatDialog } from '@angular/material/dialog';
import { RegisterDialogComponent } from '../dialogs/register-dialog/register-dialog.component';
import { LoginDialogComponent } from '../dialogs/login-dialog/login-dialog.component';
import { CustUpdateProfileDialComponent } from '../dialogs/customer-dialogs/cust-update-profile-dial/cust-update-profile-dial.component';
import { CustomerServiceService } from '../../project/services/customer-service.service';
import { UserStateService } from '../../project/services/user-state.service';
import { VendorServiceService } from '../../project/services/vendor-service.service';
import { AdminServiceService } from '../../project/services/admin-service.service';
import { SearchService, AutocompleteResult } from '../../project/services/search.service';
import { WishlistDialogComponent } from '../dialogs/wishlist-dialog/wishlist-dialog.component';
import { CartDialogComponent } from '../dialogs/cart-dialog/cart-dialog.component';
import { VendorUpdateProfileDialogComponent } from '../dialogs/vendor-update-profile-dialog/vendor-update-profile-dialog.component';
import { AdminUpdateProfileDialogComponent } from '../dialogs/admin-update-profile-dialog/admin-update-profile-dialog.component';
import { LocationService, LocationInfo } from '../../services/location.service';

import { DomSanitizer } from '@angular/platform-browser';

import { ViewportScroller } from '@angular/common';
import { LogoutDialogForEveryoneComponent } from '../dialogs/logout-dialog-for-everyone/logout-dialog-for-everyone.component';
import { ChangePasswordForEveryoneComponent } from '../dialogs/change-password-for-everyone/change-password-for-everyone.component';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-main-starter',
  templateUrl: './main-starter.component.html',
  styleUrls: ['./main-starter.component.css']
})
export class MainStarterComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private searchInputSubject = new Subject<string>();

  activeTab: string = 'home'; // default

  currentUser = 3;

  cartItems: number = 0;
  wishlistItems: number = 0;

  GLOBAL_SEARCH: string = '';
  isSearching: boolean = false;
  progressValue: number = 0;
  private progressInterval: any;

  // Mobile menu properties
  isMobileMenuOpen: boolean = false;
  isMobile: boolean = false;

  // Autocomplete properties
  autocompleteSuggestions: AutocompleteResult[] = [];
  showAutocomplete: boolean = false;
  isLoadingAutocomplete: boolean = false;
  selectedSuggestionIndex: number = -1;

  GLOBAL_CUSTOMER?: Customer | null;
  GLOBAL_ADMIN?: Admin | null;
  GLOBAL_VENDOR?: Vendor | null;
  GLOBAL_PRODUCT?: Product | null;

  title = 'odop-project';

  product_name = 'all'
  name: string[] = []

  // Profile image loading states
  isLoadingImage = false;
  isLoadingVendorImage = false;
  isLoadingAdminImage = false;

  // Profile image URLs
  customerProfileImageUrl: any = null;
  vendorProfileImageUrl: any = null;
  adminProfileImageUrl: any = null;

  // Location properties
  currentLocation: LocationInfo | null = null;
  isLocationLoading: boolean = false;
  showLocationDropdown: boolean = false;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private customerService: CustomerServiceService,
    private vendorService: VendorServiceService,
    private adminService: AdminServiceService,
    public userState: UserStateService,
    private sanitizer: DomSanitizer,
    private viewportScroller: ViewportScroller,
    private searchService: SearchService,
    private locationService: LocationService
  ) { }

  ngOnInit(): void {
    // Check initial screen size
    this.checkScreenSize();

    // Set initial active tab based on current URL on page load/refresh
    this.setActiveTabFromUrl(this.router.url);

    // Handle fragment scrolling on page refresh
    this.handleFragmentScrollOnLoad();

    // Setup autocomplete subscription
    this.setupAutocomplete();

    // Subscribe to location changes
    this.locationService.location$.pipe(takeUntil(this.destroy$)).subscribe(location => {
      this.currentLocation = location;
      this.isLocationLoading = location.isLoading;
    });

    // Subscribe to route changes
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.setActiveTabFromUrl(event.urlAfterRedirects || event.url);
        // Close mobile menu on navigation
        this.closeMobileMenu();
      }
    });

    window.addEventListener('scroll', this.onScroll.bind(this));

    this.userState.loadUserFromStorage(); // Load user state from local storage

    // Initially hide all blocks and show auth buttons
    this.toggleUserType('guest');

    // Subscribe to changes in customer, vendor, admin with proper cleanup
    this.userState.customer$.pipe(takeUntil(this.destroy$)).subscribe(customer => {
      if (customer) {
        this.toggleUserType('customer');
        // Only load image if not already loaded (prevents redundant API calls)
        if (!this.customerProfileImageUrl) {
          this.loadCustomerImage();
        }
      }
    });

    this.userState.vendor$.pipe(takeUntil(this.destroy$)).subscribe(vendor => {
      if (vendor) {
        this.toggleUserType('vendor');
        // Only load image if not already loaded
        if (!this.vendorProfileImageUrl) {
          this.loadVendorImage();
        }
      }
    });

    this.userState.admin$.pipe(takeUntil(this.destroy$)).subscribe(admin => {
      if (admin) {
        this.toggleUserType('admin');
        // Only load image if not already loaded
        if (!this.adminProfileImageUrl) {
          this.loadAdminImage();
        }
      }
    });

    // ✅ Subscribe to cart count for real-time navbar updates
    this.userState.cartCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.cartItems = count;
    });

    // ✅ Subscribe to wishlist count for real-time navbar updates
    this.userState.wishlistCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.wishlistItems = count;
    });
  }

  // Mobile Menu Methods
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isMobileMenuOpen = false;
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Prevent body scroll when menu is open
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  // Location Methods
  toggleLocationDropdown(): void {
    this.showLocationDropdown = !this.showLocationDropdown;
  }

  closeLocationDropdown(): void {
    this.showLocationDropdown = false;
  }

  refreshLocation(): void {
    this.locationService.requestLocation();
    this.showLocationDropdown = false;
  }

  getLocationDisplayName(): string {
    if (this.isLocationLoading) {
      return 'Detecting...';
    }
    if (this.currentLocation?.district) {
      return this.currentLocation.district;
    }
    if (this.currentLocation?.city) {
      return this.currentLocation.city;
    }
    if (this.currentLocation?.error) {
      return 'Enable Location';
    }
    return 'Set Location';
  }

  hasValidLocation(): boolean {
    return !!(this.currentLocation?.district || this.currentLocation?.city);
  }

  onScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (this.router.url.startsWith('/home') && scrollTop < 100) {
      if (!['about', 'impact', 'contact'].includes(this.activeTab)) {
        this.activeTab = 'home';
      }
    }
  }

  /**
   * Sets the active tab based on the current URL
   * Handles page refresh and navigation
   */
  setActiveTabFromUrl(url: string): void {
    // Remove query params for cleaner matching
    const baseUrl = url.split('?')[0];

    // Check for fragment (e.g., /#about or /#impact)
    const fragment = url.includes('#') ? url.split('#')[1] : null;

    if (baseUrl.startsWith('/product_detail')) {
      this.activeTab = 'products';
    } else if (baseUrl.startsWith('/products')) {
      this.activeTab = 'products';
    } else if (baseUrl.startsWith('/contact_us')) {
      this.activeTab = 'contact';
    } else if (baseUrl === '/' || baseUrl === '') {
      // Check if there's a fragment for about/impact sections
      if (fragment === 'about') {
        this.activeTab = 'about';
      } else if (fragment === 'impact') {
        this.activeTab = 'impact';
      } else {
        this.activeTab = 'home';
      }
    } else if (baseUrl.startsWith('/home')) {
      this.activeTab = 'home';
    } else if (
      baseUrl.startsWith('/customer-dashboard') ||
      baseUrl.startsWith('/vendor-dashboard') ||
      baseUrl.startsWith('/admin-dashboard') ||
      baseUrl.startsWith('/checkout') ||
      baseUrl.startsWith('/shopping-cart') ||
      baseUrl.startsWith('/order-confirmation') ||
      baseUrl.startsWith('/support')
    ) {
      // For dashboard and other pages, don't highlight any nav tab
      this.activeTab = '';
    }
    // For any other routes, keep the current activeTab unchanged
  }

  /**
   * Handles scrolling to a fragment on initial page load/refresh
   */
  handleFragmentScrollOnLoad(): void {
    const url = this.router.url;
    if (url.includes('#')) {
      const fragment = url.split('#')[1];
      if (fragment) {
        // Wait for the view to render before scrolling
        setTimeout(() => {
          const el = document.getElementById(fragment);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
          }
        }, 300);
      }
    }
  }


  loadCustomerImage() {
    const customer = this.userState?.customer;

    if (customer && customer.profilePicturePath) {
      const url: string = customer.profilePicturePath;
      const fileId = this.extractDriveFileId(url);

      if (fileId) {
        this.isLoadingImage = true;

        this.customerService.getCustomerProfilePicture(fileId).subscribe(
          (blob) => {
            const objectURL = URL.createObjectURL(blob);
            this.customerProfileImageUrl = this.sanitizer.bypassSecurityTrustUrl(objectURL);
            this.isLoadingImage = false;
          },
          (error) => {
            console.error('Error fetching customer profile image:', error);
            this.isLoadingImage = false;
          }
        );
      }
    }
  }

  loadVendorImage() {
    const vendor = this.userState?.vendor;

    if (vendor && vendor.profilePictureUrl) {
      const url: string = vendor.profilePictureUrl;
      const fileId = this.extractDriveFileId(url);

      if (fileId) {
        this.isLoadingVendorImage = true;

        // Use same endpoint pattern for vendor profile picture
        this.customerService.getCustomerProfilePicture(fileId).subscribe(
          (blob) => {
            const objectURL = URL.createObjectURL(blob);
            this.vendorProfileImageUrl = this.sanitizer.bypassSecurityTrustUrl(objectURL);
            this.isLoadingVendorImage = false;
          },
          (error) => {
            console.error('Error fetching vendor profile image:', error);
            this.isLoadingVendorImage = false;
          }
        );
      } else {
        // If it's a direct URL (not Google Drive), use it directly
        this.vendorProfileImageUrl = url;
      }
    }
  }

  loadAdminImage() {
    const admin = this.userState?.admin;

    if (admin && admin.profilePicturePath) {
      const url: string = admin.profilePicturePath;
      const fileId = this.extractDriveFileId(url);

      if (fileId) {
        this.isLoadingAdminImage = true;

        // Use same endpoint pattern for admin profile picture
        this.customerService.getCustomerProfilePicture(fileId).subscribe(
          (blob) => {
            const objectURL = URL.createObjectURL(blob);
            this.adminProfileImageUrl = this.sanitizer.bypassSecurityTrustUrl(objectURL);
            this.isLoadingAdminImage = false;
          },
          (error) => {
            console.error('Error fetching admin profile image:', error);
            this.isLoadingAdminImage = false;
          }
        );
      } else {
        // If it's a direct URL (not Google Drive), use it directly
        this.adminProfileImageUrl = url;
      }
    }
  }

  extractDriveFileId(url: string): string | null {
    const match = url.match(/id=([^&]+)/);
    return match ? match[1] : null;
  }

  // UI Part
  openRegisterDialog(): void {
    this.closeMobileMenu();
    const dialogRef = this.dialog.open(RegisterDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      disableClose: true
    });
  }

  openLoginDialog(): void {
    this.closeMobileMenu();
    this.dialog.open(LoginDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true
    });
  }

  openChangePasswordDialog(): void {
    this.closeMobileMenu();
    this.dialog.open(ChangePasswordForEveryoneComponent, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        role: this.userState.customer ? 'customer' : this.userState.vendor ? 'vendor' : 'admin',
        username: this.userState.admin?.fullName || this.userState.customer?.fullName || this.userState.vendor?.shopkeeperName
      }
    });
  }

  openLogoutDialog() {
    this.closeMobileMenu();
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
        this.toggleUserType('guest'); // Reset UI to guest state
      }
    });
  }

  openUpdateProfileCustomerDialog(): void {
    this.closeMobileMenu();
    this.dialog.open(CustUpdateProfileDialComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'update-profile-dialog'
    });
  }

  openUpdateProfileVendorDialog(): void {
    this.closeMobileMenu();
    this.dialog.open(VendorUpdateProfileDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'update-profile-dialog'
    });
  }

  openUpdateProfileAdminDialog(): void {
    this.closeMobileMenu();
    this.dialog.open(AdminUpdateProfileDialogComponent, {
      width: '550px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'update-profile-dialog'
    });
  }

  openWishlistDialog(event: Event): void {
    event.preventDefault();
    if (this.isVendorOnlySession()) {
      this.router.navigate(['/vendor-dashboard']);
      return;
    }

    this.closeMobileMenu();
    this.dialog.open(WishlistDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'wishlist-dialog-container',
      data: {
        customerId: this.userState.customer?.customerId
      }
    });
  }

  openCartDialog(event: Event): void {
    event.preventDefault();
    if (this.isVendorOnlySession()) {
      this.router.navigate(['/vendor-dashboard']);
      return;
    }

    this.closeMobileMenu();
    this.dialog.open(CartDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'cart-dialog-container',
      data: {
        customerId: this.userState.customer?.customerId
      }
    });
  }

  /**
   * Returns first name and last name
   * "John Michael Smith" -> "John Smith"
   * "John Smith" -> "John Smith"
   * "John" -> "John"
   */
  getDisplayName(fullName: string | undefined | null): string {
    if (!fullName || typeof fullName !== 'string') {
      return '';
    }
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length <= 2) {
      return nameParts.join(' ');
    }
    // Return first name + last name
    return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
  }

  searchThing() {
    if (!this.GLOBAL_SEARCH.trim()) {
      alert("Search input cannot be empty");
      return;
    }
    this.closeMobileMenu();
    this.startSearchAnimation();

    // Short animation delay, then navigate
    setTimeout(() => {
      if (this.isVendorOnlySession()) {
        this.router.navigate(['/vendor-dashboard/vendor-products'], {
          queryParams: { search: this.GLOBAL_SEARCH.trim() }
        });
      } else {
        this.router.navigate(['/products'], {
          queryParams: { search: this.GLOBAL_SEARCH.trim() }
        });
      }
      this.completeSearchAnimation();
    }, 500);
  }

  private startSearchAnimation() {
    this.isSearching = true;
    this.progressValue = 0;

    this.progressInterval = setInterval(() => {
      this.progressValue += Math.random() * 15 + 5;
      if (this.progressValue > 100) {
        this.progressValue = 100;
        clearInterval(this.progressInterval);
      }
    }, 100);
  }

  private completeSearchAnimation() {
    this.isSearching = false;
    this.progressValue = 0;
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  // ============== AUTOCOMPLETE METHODS ==============

  private setupAutocomplete(): void {
    this.searchInputSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      if (query && query.length >= 2) {
        this.fetchAutocompleteSuggestions(query);
      } else {
        this.autocompleteSuggestions = [];
        this.showAutocomplete = false;
      }
    });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.GLOBAL_SEARCH = input.value;
    this.searchInputSubject.next(input.value);
  }

  private fetchAutocompleteSuggestions(query: string): void {
    this.isLoadingAutocomplete = true;

    this.searchService.getAutocomplete(query, 8)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Convert AutocompleteResponse to AutocompleteResult[]
          const results: AutocompleteResult[] = [];

          // Add text suggestions
          if (response.suggestions) {
            response.suggestions.forEach(s => {
              results.push({ type: 'category', text: s.text, metadata: { matchCount: s.matchCount } });
            });
          }

          // Add product suggestions
          if (response.products) {
            response.products.forEach(p => {
              results.push({ type: 'product', text: p.productName, id: p.productId, metadata: p });
            });
          }

          // Add vendor suggestions
          if (response.vendors) {
            response.vendors.forEach(v => {
              results.push({ type: 'vendor', text: v.shoppeeName, id: v.vendorId, metadata: v });
            });
          }

          this.autocompleteSuggestions = results;
          this.showAutocomplete = results.length > 0;
          this.isLoadingAutocomplete = false;
          this.selectedSuggestionIndex = -1;
        },
        error: () => {
          this.autocompleteSuggestions = [];
          this.showAutocomplete = false;
          this.isLoadingAutocomplete = false;
        }
      });
  }

  selectSuggestion(suggestion: AutocompleteResult): void {
    this.GLOBAL_SEARCH = suggestion.text;
    this.showAutocomplete = false;
    this.autocompleteSuggestions = [];
    this.closeMobileMenu();

    if (this.isVendorOnlySession()) {
      this.router.navigate(['/vendor-dashboard/vendor-products'], {
        queryParams: { search: suggestion.text }
      });
      return;
    }

    // Navigate based on suggestion type
    if (suggestion.type === 'product' && suggestion.id) {
      this.router.navigate(['/product_detail', suggestion.id]);
    } else if (suggestion.type === 'vendor' && suggestion.id) {
      this.router.navigate(['/vendor', suggestion.id]);
    } else if (suggestion.type === 'category') {
      this.router.navigate(['/products'], { queryParams: { category: suggestion.text } });
    } else {
      this.searchThing();
    }
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (!this.showAutocomplete || this.autocompleteSuggestions.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.min(
          this.selectedSuggestionIndex + 1,
          this.autocompleteSuggestions.length - 1
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
        break;
      case 'Enter':
        if (this.selectedSuggestionIndex >= 0) {
          event.preventDefault();
          this.selectSuggestion(this.autocompleteSuggestions[this.selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        this.showAutocomplete = false;
        this.selectedSuggestionIndex = -1;
        break;
    }
  }

  onSearchFocus(): void {
    if (this.autocompleteSuggestions.length > 0) {
      this.showAutocomplete = true;
    }
  }

  onSearchBlur(): void {
    // Delay hiding to allow click on suggestion
    setTimeout(() => {
      this.showAutocomplete = false;
    }, 200);
  }

  getSuggestionIcon(type: string): string {
    switch (type) {
      case 'product': return 'fa-box';
      case 'category': return 'fa-folder';
      case 'vendor': return 'fa-store';
      case 'location': return 'fa-map-marker-alt';
      default: return 'fa-search';
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll.bind(this));
    this.destroy$.next();
    this.destroy$.complete();
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    // Ensure body scroll is restored
    document.body.style.overflow = '';
  }

  // User type visibility - managed via component properties for Angular binding
  currentUserType: 'customer' | 'vendor' | 'admin' | 'guest' = 'guest';

  // Toggle user type - now using Angular-friendly approach
  toggleUserType(type: string) {
    if (type === 'customer' || this.userState.customer) {
      this.currentUserType = 'customer';
      this.loadCustomerImage();
    } else if (type === 'vendor' || this.userState.vendor) {
      this.currentUserType = 'vendor';
    } else if (type === 'admin' || this.userState.admin) {
      this.currentUserType = 'admin';
    } else {
      this.currentUserType = 'guest';
    }
  }

  // Helper methods for template binding
  isCustomerLoggedIn(): boolean {
    return this.currentUserType === 'customer' || !!this.userState.customer;
  }

  isVendorLoggedIn(): boolean {
    return this.currentUserType === 'vendor' || !!this.userState.vendor;
  }

  isAdminLoggedIn(): boolean {
    return this.currentUserType === 'admin' || !!this.userState.admin;
  }

  isGuest(): boolean {
    return this.currentUserType === 'guest' && !this.userState.customer && !this.userState.vendor && !this.userState.admin;
  }

  isVendorOnlySession(): boolean {
    return !!this.userState.vendor && !this.userState.customer && !this.userState.admin;
  }

  navigateAndScroll(fragment: string) {
    this.closeMobileMenu();
    this.tabChanged();
    this.router.navigate(['/'], { fragment }).then(() => {
      setTimeout(() => {
        const el = document.getElementById(fragment);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        }
        this.activeTab = fragment;
      }, 100);
    });
  }

  tabChanged() {
    if (this.GLOBAL_SEARCH.trim() != '') {
      this.GLOBAL_SEARCH = ''; // Clear search input after initiating search
      this.isSearching = false; // Reset search state
      this.progressValue = 0; // Reset progress bar
    }
  }


  // Backend Part
  // customer login
  loginCustomer(email: string, password: string) {
    this.customerService.loginCustomer(email, password)
      .subscribe((response: any) => {
        if (response && response.user) {
          this.userState.customer = response.user;
          localStorage.setItem("jwt", response.jwt);
        }
      });
  }

  // vendor login
  loginVendor(email: string, password: string, registry: string) {
    this.vendorService.loginVendor(email, password)
      .subscribe((response: any) => {
        if (response && response.user) {
          this.userState.vendor = response.user;
          localStorage.setItem("jwt", response.jwt);
        }
      });
  }

  // admin login
  loginAdmin(email: string, password: string) {
    this.adminService.loginAdmin(email, password)
      .subscribe((response: any) => {
        if (response && response.user) {
          this.userState.admin = response.user;
          localStorage.setItem("jwt", response.jwt);
        }
      });
  }

}

