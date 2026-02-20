import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, finalize, catchError, retry, tap } from 'rxjs/operators';
import { VendorServiceService } from '../../project/services/vendor-service.service';
import { ProductServiceService } from '../../project/services/product-service.service';
import { CartServiceService } from '../../project/services/cart-service.service';
import { WishlistService } from '../../project/services/wishlist.service';
import { UserStateService } from '../../project/services/user-state.service';
import { ReviewService, Review } from '../../project/services/review.service';
import { VendorDto } from '../../project/models/vendor';
import { Product } from '../../project/models/product';
import { Cart } from '../../project/models/cart';
import { MatSnackBar } from '@angular/material/snack-bar';

// Shop review interface using API Review type
interface ShopReview {
  id: string;
  customerName: string;
  customerImage: string;
  rating: number;
  comment: string;
  date: Date;
  productPurchased?: string;
  helpful: number;
  verified: boolean;
}

// Trust metric interface
interface TrustMetric {
  icon: string;
  label: string;
  value: string;
  description: string;
}

// Follow data stored in localStorage
interface FollowedVendors {
  [vendorId: string]: {
    followedAt: string;
    shopName: string;
  };
}

@Component({
  selector: 'app-vendor-shop-page',
  templateUrl: './vendor-shop-page.component.html',
  styleUrls: ['./vendor-shop-page.component.css']
})
export class VendorShopPageComponent implements OnInit, OnDestroy {
  vendor: VendorDto | null = null;
  products: Product[] = [];
  filteredProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  relatedVendors: VendorDto[] = [];
  
  // Loading states
  isLoading = true;
  productsLoading = true;
  reviewsLoading = false;
  relatedVendorsLoading = false;
  vendorNotFound = false;
  
  // Error states
  vendorError: string | null = null;
  productsError: string | null = null;
  reviewsError: string | null = null;
  
  private destroy$ = new Subject<void>();
  private readonly FOLLOWED_VENDORS_KEY = 'odop_followed_vendors';

  // Filters
  searchTerm = '';
  selectedCategory = 'all';
  sortBy = 'featured';
  categories: string[] = [];

  // View state
  viewMode: 'grid' | 'list' = 'grid';
  currentImageIndex = 0;
  activeTab: 'products' | 'about' | 'reviews' | 'policies' = 'products';
  isFollowing = false;
  showShareMenu = false;
  isHeaderSticky = false;

  // Pagination
  currentPage = 1;
  productsPerPage = 12;
  totalPages = 1;

  // Gallery
  galleryImages: string[] = [];
  showGalleryModal = false;
  galleryModalIndex = 0;

  // Shop reviews
  shopReviews: ShopReview[] = [];
  averageShopRating = 4.5;
  totalShopReviews = 0;
  ratingDistribution: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  // Trust metrics
  trustMetrics: TrustMetric[] = [];

  // Math for template
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vendorService: VendorServiceService,
    private productService: ProductServiceService,
    private cartService: CartServiceService,
    private wishlistService: WishlistService,
    private userStateService: UserStateService,
    private reviewService: ReviewService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const vendorId = params['vendorId'];
      if (vendorId) {
        this.loadVendorDetails(vendorId);
        this.checkFollowStatus(vendorId);
      } else {
        this.vendorNotFound = true;
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isHeaderSticky = window.scrollY > 300;
  }

  // Check if user is following this vendor (stored in localStorage)
  checkFollowStatus(vendorId: string): void {
    try {
      const stored = localStorage.getItem(this.FOLLOWED_VENDORS_KEY);
      if (stored) {
        const followedVendors: FollowedVendors = JSON.parse(stored);
        this.isFollowing = !!followedVendors[vendorId];
      }
    } catch (e) {
      this.isFollowing = false;
    }
  }

  loadVendorDetails(vendorId: string): void {
    this.isLoading = true;
    this.vendorError = null;
    
    this.vendorService.getVendorById(vendorId)
      .pipe(
        takeUntil(this.destroy$),
        retry(2)
      )
      .subscribe({
        next: (vendor) => {
          if (vendor && vendor.vendorId) {
            this.vendor = vendor;
          } else {
            this.vendor = null;
            this.vendorNotFound = true;
            this.vendorError = 'Vendor not found';
            this.isLoading = false;
            return;
          }
          this.isLoading = false;
          this.initializeGallery();
          this.generateTrustMetrics();
          
          // Load related data in parallel
          this.loadVendorProducts(vendorId);
          this.loadVendorReviews(vendorId);
          this.loadRelatedVendors();
        },
        error: (error) => {
          console.error('Failed to load vendor after retries:', error);
          this.vendor = null;
          this.vendorNotFound = true;
          this.vendorError = 'Failed to load vendor details';
          this.isLoading = false;
        }
      });
  }

  // Load reviews from the API
  loadVendorReviews(vendorId: string): void {
    this.reviewsLoading = true;
    this.reviewsError = null;

    // Load both reviews and rating stats in parallel
    forkJoin({
      reviews: this.reviewService.getVendorReviews(vendorId).pipe(
        catchError(error => {
          console.error('Error loading reviews:', error);
          return of([]);
        })
      ),
      rating: this.reviewService.getVendorRating(vendorId).pipe(
        catchError(error => {
          console.error('Error loading rating:', error);
          return of(null);
        })
      )
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ reviews, rating }) => {
        if (reviews && reviews.length > 0) {
          // Map API reviews to ShopReview format
          this.shopReviews = reviews.map(r => this.mapApiReviewToShopReview(r));
          this.totalShopReviews = reviews.length;
          
          if (rating) {
            this.averageShopRating = rating.averageRating || 0;
            this.ratingDistribution = rating.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          } else {
            this.calculateRatingDistribution();
          }
        } else {
          this.shopReviews = [];
          this.totalShopReviews = 0;
          this.averageShopRating = 0;
          this.ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        }
        this.reviewsLoading = false;
        this.generateTrustMetrics(); // Update trust metrics with review data
      },
      error: () => {
        this.shopReviews = [];
        this.totalShopReviews = 0;
        this.averageShopRating = 0;
        this.ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        this.reviewsError = 'Failed to load reviews';
        this.reviewsLoading = false;
      }
    });
  }

  // Map API Review to local ShopReview format
  private mapApiReviewToShopReview(review: Review): ShopReview {
    return {
      id: review.reviewId,
      customerName: review.customerName || 'Anonymous',
      customerImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(review.customerName || 'A')}&background=0D8ABC&color=fff`,
      rating: Number(review.rating || 0),
      comment: review.comment,
      date: review.createdAt ? new Date(review.createdAt) : new Date(),
      helpful: review.helpfulCount || 0,
      verified: review.isVerifiedPurchase
    };
  }

  loadVendorProducts(vendorId: string): void {
    this.productsLoading = true;
    this.productsError = null;
    
    this.productService.getProductByVendorId(vendorId)
      .pipe(
        takeUntil(this.destroy$),
        retry(2),
        catchError(error => {
          console.error('Error loading products:', error);
          return of([]);
        })
      )
      .subscribe({
        next: (products) => {
          this.products = products || [];
          this.filteredProducts = [...this.products];
          this.extractCategories();
          this.calculatePagination();
          this.productsLoading = false;
          this.generateTrustMetrics(); // Update product count in trust metrics
        },
        error: () => {
          this.products = [];
          this.filteredProducts = [...this.products];
          this.extractCategories();
          this.calculatePagination();
          this.productsLoading = false;
          this.productsError = 'Failed to load products';
        }
      });
  }

  loadRelatedVendors(): void {
    this.relatedVendorsLoading = true;
    
    if (this.vendor?.locationState) {
      this.vendorService.getVendorsByState(this.vendor.locationState)
        .pipe(
          takeUntil(this.destroy$),
          retry(1),
          catchError(error => {
            console.error('Error loading related vendors:', error);
            return of([]);
          })
        )
        .subscribe({
          next: (vendors) => {
            if (vendors && vendors.length > 0) {
              this.relatedVendors = vendors
                .filter(v => v.vendorId !== this.vendor?.vendorId)
                .slice(0, 4);
            } else {
              this.relatedVendors = [];
            }
            this.relatedVendorsLoading = false;
          },
          error: () => {
            this.relatedVendors = [];
            this.relatedVendorsLoading = false;
          }
        });
    } else {
      this.relatedVendors = [];
      this.relatedVendorsLoading = false;
    }
  }

  initializeGallery(): void {
    this.galleryImages = [];
    
    // Add shop images
    if (this.vendor?.shopImages && this.vendor.shopImages.length > 0) {
      this.galleryImages.push(...this.vendor.shopImages);
    }

    // Use real vendor profile image as fallback, not mock gallery data
    if (this.galleryImages.length === 0 && this.vendor?.profilePictureUrl) {
      this.galleryImages = [this.vendor.profilePictureUrl];
    }
  }

  generateTrustMetrics(): void {
    const years = this.getYearsInBusiness();
    this.trustMetrics = [
      {
        icon: 'fas fa-shield-alt',
        label: 'Verified Seller',
        value: this.vendor?.isVerified ? 'Yes' : 'Pending',
        description: this.vendor?.isVerified ? 'Identity & business verified' : 'Verification in progress'
      },
      {
        icon: 'fas fa-calendar-alt',
        label: 'In Business',
        value: `${years}+ Years`,
        description: 'Established seller'
      },
      {
        icon: 'fas fa-truck',
        label: 'On-Time Delivery',
        value: '95%',
        description: 'Delivery commitment'
      },
      {
        icon: 'fas fa-reply',
        label: 'Response Time',
        value: '< 24 hrs',
        description: 'Quick replies'
      },
      {
        icon: 'fas fa-box-open',
        label: 'Products',
        value: `${this.products.length}+`,
        description: 'Active listings'
      },
      {
        icon: 'fas fa-star',
        label: 'Shop Rating',
        value: this.averageShopRating.toFixed(1),
        description: 'Customer satisfaction'
      }
    ];
  }

  calculateRatingDistribution(): void {
    this.ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    this.shopReviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        this.ratingDistribution[review.rating]++;
      }
    });
    
    const total = this.shopReviews.reduce((sum, r) => sum + r.rating, 0);
    this.averageShopRating = this.shopReviews.length > 0 ? total / this.shopReviews.length : 0;
  }

  extractCategories(): void {
    const categorySet = new Set<string>();
    this.products.forEach(p => {
      if (p.subCategory) categorySet.add(p.subCategory);
      if (p.craftType) categorySet.add(p.craftType);
    });
    this.categories = Array.from(categorySet);
  }

  applyFilters(): void {
    let result = [...this.products];

    // Search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.productName?.toLowerCase().includes(term) ||
        p.productDescription?.toLowerCase().includes(term) ||
        p.subCategory?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (this.selectedCategory !== 'all') {
      result = result.filter(p => 
        p.subCategory === this.selectedCategory || 
        p.craftType === this.selectedCategory
      );
    }

    // Sort
    switch (this.sortBy) {
      case 'price-low':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        result.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
        break;
      case 'bestselling':
        result.sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
        break;
    }

    this.filteredProducts = result;
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
    const start = (this.currentPage - 1) * this.productsPerPage;
    const end = start + this.productsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.calculatePagination();
      this.scrollToProducts();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  scrollToProducts(): void {
    const element = document.querySelector('.products-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  viewProduct(productId: string | undefined): void {
    if (productId) {
      this.router.navigate(['/product_detail', productId]);
    }
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    const user = this.userStateService.getCurrentUser();
    const customerId = (user && 'customerId' in user) ? user.customerId : localStorage.getItem('customerId');
    
    if (!customerId) {
      this.snackBar.open('Please log in to add items to cart', 'Login', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      }).onAction().subscribe(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    const cartItem: Cart = {
      customerId: customerId,
      vendorId: product.vendorId || this.vendor?.vendorId,
      productId: product.productId,
      quantity: 1,
      approval: false,
      time: new Date().toISOString()
    };

    this.cartService.registerCart(cartItem).subscribe({
      next: () => {
        this.snackBar.open('Added to cart!', 'View Cart', {
          duration: 3000,
          panelClass: ['success-snackbar']
        }).onAction().subscribe(() => {
          this.router.navigate(['/shopping_cart']);
        });
      },
      error: () => {
        this.snackBar.open('Failed to add to cart', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  addToWishlist(product: Product, event: Event): void {
    event.stopPropagation();
    this.wishlistService.addToWishlist(product.productId!).subscribe({
      next: () => {
        this.snackBar.open('Added to wishlist!', 'View', {
          duration: 3000,
          panelClass: ['success-snackbar']
        }).onAction().subscribe(() => {
          this.router.navigate(['/wishlist']);
        });
      },
      error: () => {
        this.snackBar.open('Failed to add to wishlist', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  toggleFollow(): void {
    if (!this.vendor?.vendorId) return;
    
    const vendorId = this.vendor.vendorId;
    
    try {
      const stored = localStorage.getItem(this.FOLLOWED_VENDORS_KEY);
      let followedVendors: FollowedVendors = stored ? JSON.parse(stored) : {};
      
      if (this.isFollowing) {
        // Unfollow
        delete followedVendors[vendorId];
        this.isFollowing = false;
        this.snackBar.open('Unfollowed shop', 'Close', { duration: 2000 });
      } else {
        // Follow
        followedVendors[vendorId] = {
          followedAt: new Date().toISOString(),
          shopName: this.vendor.shoppeeName || 'Unknown Shop'
        };
        this.isFollowing = true;
        this.snackBar.open('Now following this shop! You\'ll be notified of new products.', 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
      
      localStorage.setItem(this.FOLLOWED_VENDORS_KEY, JSON.stringify(followedVendors));
    } catch (e) {
      console.error('Error updating follow status:', e);
      this.snackBar.open('Failed to update follow status', 'Close', { duration: 2000 });
    }
  }

  // Mark review as helpful via API
  markReviewHelpful(reviewId: string): void {
    this.reviewService.markAsHelpful(reviewId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedReview) => {
          // Update local review
          const review = this.shopReviews.find(r => r.id === reviewId);
          if (review) {
            review.helpful = updatedReview.helpfulCount;
          }
          this.snackBar.open('Marked as helpful', 'Close', { duration: 2000 });
        },
        error: () => {
          // Optimistically update UI even if API fails
          const review = this.shopReviews.find(r => r.id === reviewId);
          if (review) {
            review.helpful++;
          }
          this.snackBar.open('Marked as helpful', 'Close', { duration: 2000 });
        }
      });
  }

  shareShop(platform?: string): void {
    const url = window.location.href;
    const text = `Check out ${this.vendor?.shoppeeName || 'this shop'} on ODOP!`;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
        });
        break;
    }
    this.showShareMenu = false;
  }

  // Gallery methods
  openGalleryModal(index: number): void {
    this.galleryModalIndex = index;
    this.showGalleryModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeGalleryModal(): void {
    this.showGalleryModal = false;
    document.body.style.overflow = 'auto';
  }

  nextGalleryImage(): void {
    this.galleryModalIndex = (this.galleryModalIndex + 1) % this.galleryImages.length;
  }

  prevGalleryImage(): void {
    this.galleryModalIndex = this.galleryModalIndex === 0 
      ? this.galleryImages.length - 1 
      : this.galleryModalIndex - 1;
  }

  nextImage(): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.galleryImages.length;
  }

  prevImage(): void {
    this.currentImageIndex = this.currentImageIndex === 0 
      ? this.galleryImages.length - 1 
      : this.currentImageIndex - 1;
  }

  setCurrentImage(index: number): void {
    this.currentImageIndex = index;
  }

  // Contact methods
  openMaps(): void {
    if (this.vendor?.googleMapsLink) {
      window.open(this.vendor.googleMapsLink, '_blank');
    } else if (this.vendor?.shopLatitude && this.vendor?.shopLongitude) {
      window.open(`https://maps.google.com/?q=${this.vendor.shopLatitude},${this.vendor.shopLongitude}`, '_blank');
    } else {
      const address = this.getFullAddress();
      if (address) {
        window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
      }
    }
  }

  contactVendor(): void {
    if (this.vendor?.contactNumber) {
      window.open(`tel:${this.vendor.contactNumber}`, '_self');
    }
  }

  emailVendor(): void {
    if (this.vendor?.emailAddress) {
      const subject = `Inquiry about ${this.vendor.shoppeeName || 'your shop'}`;
      window.open(`mailto:${this.vendor.emailAddress}?subject=${encodeURIComponent(subject)}`, '_self');
    }
  }

  whatsappVendor(): void {
    if (this.vendor?.contactNumber) {
      const message = `Hi! I found your shop "${this.vendor.shoppeeName}" on ODOP. I'd like to know more about your products.`;
      window.open(`https://wa.me/${this.vendor.contactNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }
  }

  // Helper methods
  getVendorTypeLabel(type: string | undefined): string {
    switch (type) {
      case 'small': return 'Artisan Vendor';
      case 'medium': return 'Local Shop';
      case 'large': return 'Verified Store';
      default: return 'ODOP Vendor';
    }
  }

  getVendorTypeIcon(type: string | undefined): string {
    switch (type) {
      case 'small': return 'fas fa-hands';
      case 'medium': return 'fas fa-store';
      case 'large': return 'fas fa-building';
      default: return 'fas fa-shop';
    }
  }

  getYearsInBusiness(): number {
    if (this.vendor?.createdAt) {
      const start = new Date(this.vendor.createdAt);
      const now = new Date();
      return Math.max(1, Math.floor((now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
    }
    return 1;
  }

  getBusinessSince(): string {
    if (this.vendor?.createdAt) {
      return new Date(this.vendor.createdAt).getFullYear().toString();
    }
    return '2020';
  }

  getFullAddress(): string {
    const parts = [
      this.vendor?.shoppeeAddress,
      this.vendor?.locationDistrict,
      this.vendor?.locationState,
      this.vendor?.pinCode
    ].filter(Boolean);
    return parts.join(', ');
  }

  getMapUrl(): string {
    if (this.vendor?.shopLatitude && this.vendor?.shopLongitude) {
      return `https://maps.google.com/maps?q=${this.vendor.shopLatitude},${this.vendor.shopLongitude}&z=15&output=embed`;
    }
    const address = this.getFullAddress();
    return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`;
  }

  getDeliveryBadgeClass(option: string): string {
    switch (option.toLowerCase()) {
      case 'post': return 'badge-post';
      case 'courier': return 'badge-courier';
      case 'local': return 'badge-local';
      case 'pickup_only': return 'badge-pickup';
      default: return '';
    }
  }

  getDeliveryIcon(option: string): string {
    switch (option.toLowerCase()) {
      case 'post': return 'fas fa-envelope';
      case 'courier': return 'fas fa-truck';
      case 'local': return 'fas fa-motorcycle';
      case 'pickup_only': return 'fas fa-store';
      default: return 'fas fa-box';
    }
  }

  calculateDiscountedPrice(product: Product): number {
    if (product.discount && product.price) {
      return Math.round(product.price * (1 - product.discount / 100));
    }
    return product.price || 0;
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }

  getRatingPercentage(stars: number): number {
    const count = this.ratingDistribution[stars] || 0;
    return this.totalShopReviews > 0 ? (count / this.totalShopReviews) * 100 : 0;
  }

  visitRelatedVendor(vendorId: string | undefined): void {
    if (vendorId) {
      this.router.navigate(['/shop', vendorId]);
    }
  }

  // Check if product is in wishlist
  isInWishlist(productId: string | undefined): boolean {
    if (!productId) return false;
    return this.wishlistService.isInWishlist(productId);
  }

  // Toggle wishlist - add or remove
  toggleWishlist(product: Product, event: Event): void {
    event.stopPropagation();
    
    if (!product.productId) return;
    
    const user = this.userStateService.getCurrentUser();
    const customerId = (user && 'customerId' in user) ? user.customerId : localStorage.getItem('customerId');
    
    if (!customerId) {
      this.snackBar.open('Please log in to manage your wishlist', 'Login', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      }).onAction().subscribe(() => {
        this.router.navigate(['/login']);
      });
      return;
    }
    
    if (this.isInWishlist(product.productId)) {
      // Remove from wishlist
      this.wishlistService.removeFromWishlist(product.productId).subscribe({
        next: () => {
          this.snackBar.open('Removed from wishlist', 'Close', {
            duration: 2000
          });
        },
        error: () => {
          this.snackBar.open('Failed to remove from wishlist', 'Close', {
            duration: 2000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      // Add to wishlist
      this.addToWishlist(product, event);
    }
  }

  // Quick add to cart with default quantity
  quickAddToCart(product: Product, event: Event): void {
    event.stopPropagation();
    this.addToCart(product, event);
  }

  // Get total items in current page
  getPageItemsRange(): string {
    const start = (this.currentPage - 1) * this.productsPerPage + 1;
    const end = Math.min(this.currentPage * this.productsPerPage, this.filteredProducts.length);
    return `${start}-${end} of ${this.filteredProducts.length}`;
  }

  // Refresh vendor data
  refreshVendorData(): void {
    if (this.vendor?.vendorId) {
      this.loadVendorDetails(this.vendor.vendorId);
    }
  }

  // Get followed vendors from localStorage
  getFollowedVendors(): FollowedVendors {
    try {
      const stored = localStorage.getItem(this.FOLLOWED_VENDORS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  // Track by function for ngFor performance
  trackByProductId(index: number, product: Product): string {
    return product.productId || index.toString();
  }

  trackByReviewId(index: number, review: ShopReview): string {
    return review.id || index.toString();
  }

  trackByVendorId(index: number, vendor: VendorDto): string {
    return vendor.vendorId || index.toString();
  }
}

