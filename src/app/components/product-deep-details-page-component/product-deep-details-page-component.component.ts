import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ProductListingPageComponentComponent } from '../product-listing-page-component/product-listing-page-component.component';
import { Product } from 'src/app/project/models/product';
import { AppComponent } from 'src/app/app.component';
import { Cart } from 'src/app/project/models/cart';
import { Router, ActivatedRoute } from '@angular/router';
import { CartServiceService } from 'src/app/project/services/cart-service.service';
import { ProductServiceService } from 'src/app/project/services/product-service.service';
import { ReviewService, Review, CreateReviewRequest, ProductRating } from 'src/app/project/services/review.service';
import { WishlistService } from 'src/app/project/services/wishlist.service';
import { RecentlyViewedService } from 'src/app/project/services/recently-viewed.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserStateService } from 'src/app/project/services/user-state.service';

@Component({
  selector: 'app-product-deep-details-page-component',
  templateUrl: './product-deep-details-page-component.component.html',
  styleUrls: ['./product-deep-details-page-component.component.css']
})
export class ProductDeepDetailsPageComponentComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('mainImage', { static: false }) mainImage!: ElementRef<HTMLImageElement>;
  @ViewChild('imageGallery', { static: false }) imageGallery!: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();

  // Component properties
  quantity: number = 1;
  isDescriptionExpanded: boolean = false;
  cartCount: number = 3;
  product?: Product | null = new Product();
  cart: Cart = new Cart();
  productId: string | null = null;

  // Loading states
  isLoadingProduct = true;
  isLoadingReviews = true;
  isSubmittingReview = false;
  productLoadError = '';

  // Reviews data from API
  reviews: Review[] = [];
  productRating: ProductRating | null = null;
  
  // Review form
  newReviewRating = 0;
  newReviewTitle = '';
  newReviewComment = '';
  showReviewForm = false;
  
  // Wishlist
  isInWishlist = false;
  isWishlistLoading = false;

  // Cart status
  isInCart = false;

  // Related products
  relatedProducts: Product[] = [];
  isLoadingRelated = false;

  // Recently Viewed Products
  recentlyViewed: Product[] = [];

  // Active tab
  activeTab: 'description' | 'specifications' | 'shipping' = 'description';

  // Image lightbox
  isLightboxOpen = false;
  currentImageIndex = 0;
  productImages: string[] = [];

  // Share modal
  showShareModal = false;

  // Touch gesture properties
  private touchStartX: number = 0;
  private touchEndX: number = 0;
  private observer!: IntersectionObserver;

  constructor(
    private ap: AppComponent,
    private router: Router,
    private route: ActivatedRoute,
    private cart_service: CartServiceService,
    private productService: ProductServiceService,
    private reviewService: ReviewService,
    private wishlistService: WishlistService,
    private recentlyViewedService: RecentlyViewedService,
    private userStateService: UserStateService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Get product ID from route
    this.route.paramMap.subscribe(params => {
      this.productId = params.get('id');
      this.loadProductDetails();
    });
    
    this.initializeIntersectionObserver();
  }

  ngAfterViewInit(): void {
    this.initializeAnimations();
    this.setupTouchGestures();
    this.addScrollParallax();
    this.animateRatingBars();
    this.setupProductCardHovers();
  }

  // Load product details based on ID
  loadProductDetails(): void {
    if (!this.productId) {
      this.productLoadError = 'Product ID not found';
      this.isLoadingProduct = false;
      return;
    }

    this.isLoadingProduct = true;
    this.productLoadError = '';

    this.productService.getProductById(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productData) => {
          this.product = productData;
          // Track this product as recently viewed
          if (this.product) {
            this.recentlyViewedService.addProduct(this.product);
          }
          this.isLoadingProduct = false;
          
          // Initialize product images
          this.initProductImages();
          
          // Load reviews and ratings after product loads
          this.loadReviews();
          this.loadProductRating();
          this.checkWishlistStatus();
          this.checkCartStatus();
          this.loadRelatedProducts();
          this.loadRecentlyViewed();
        },
        error: (error) => {
          console.error('Error loading product:', error);
          this.productLoadError = 'Failed to load product details. Please try again.';
          this.isLoadingProduct = false;
        }
      });
  }

  // Load reviews for the product
  loadReviews(): void {
    if (!this.productId) return;

    this.isLoadingReviews = true;
    this.reviewService.getProductReviews(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reviews) => {
          this.reviews = reviews;
          this.isLoadingReviews = false;
        },
        error: (error) => {
          console.error('Error loading reviews:', error);
          this.isLoadingReviews = false;
        }
      });
  }

  // Load product rating statistics
  loadProductRating(): void {
    if (!this.productId) return;

    this.reviewService.getProductRating(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rating) => {
          this.productRating = rating;
        },
        error: (error) => {
          console.error('Error loading rating:', error);
        }
      });
  }

  // Load related products by category
  loadRelatedProducts(): void {
    if (!this.product?.categoryId) return;

    this.isLoadingRelated = true;
    this.productService.getProductByCategoryId(this.product.categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          // Filter out current product and take max 4
          this.relatedProducts = products
            .filter(p => p.productId !== this.productId)
            .slice(0, 4);
          this.isLoadingRelated = false;
        },
        error: (error) => {
          console.error('Error loading related products:', error);
          this.isLoadingRelated = false;
        }
      });
  }

  // Load recently viewed products
  loadRecentlyViewed(): void {
    this.recentlyViewed = this.recentlyViewedService.getRecentlyViewed()
      .filter((p: Product) => p.productId !== this.productId)
      .slice(0, 4);
  }

  // Initialize product images array
  initProductImages(): void {
    this.productImages = [];
    this.currentImageIndex = 0; // Reset to first image
    
    // Add main product image
    if (this.product?.productImageURL) {
      this.productImages.push(this.product.productImageURL);
    }
    
    // Add demo gallery images for better UX demonstration
    // In production, these would come from the product API
    if (this.productImages.length < 4) {
      const demoImages = [
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=600&fit=crop'
      ];
      
      // Only add demo images if we have at least one real image
      if (this.productImages.length > 0) {
        const neededImages = 4 - this.productImages.length;
        this.productImages.push(...demoImages.slice(0, neededImages));
      } else {
        // No product image, use all demo images
        this.productImages = demoImages;
      }
    }
  }

  // Get the currently selected image for main display
  getSelectedImage(): string {
    if (this.productImages.length > 0 && this.currentImageIndex < this.productImages.length) {
      return this.productImages[this.currentImageIndex];
    }
    return this.getProductImage();
  }

  // Image lightbox methods
  openLightbox(index: number = 0): void {
    this.currentImageIndex = index;
    this.isLightboxOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.isLightboxOpen = false;
    document.body.style.overflow = '';
  }

  nextImage(): void {
    if (this.productImages.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.productImages.length;
    }
  }

  prevImage(): void {
    if (this.productImages.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.productImages.length) % this.productImages.length;
    }
  }

  setCurrentImage(index: number): void {
    this.currentImageIndex = index;
  }

  getCurrentUrl(): string {
    return window.location.href;
  }

  // Tab switching
  setActiveTab(tab: 'description' | 'specifications' | 'shipping'): void {
    this.activeTab = tab;
  }

  // Share methods
  openShareModal(): void {
    this.showShareModal = true;
  }

  closeShareModal(): void {
    this.showShareModal = false;
  }

  shareOnFacebook(): void {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }

  shareOnTwitter(): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this amazing ${this.product?.productName} from ODOP!`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  }

  shareOnWhatsApp(): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this: ${this.product?.productName}`);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
      this.closeShareModal();
    });
  }

  // Navigate to related product
  viewProduct(productId: string | undefined): void {
    if (productId) {
      this.router.navigate(['/product_detail', productId]);
    }
  }

  // Get stars array for display
  getStarsArray(rating: number): string[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return [
      ...Array(fullStars).fill('full'),
      ...(hasHalfStar ? ['half'] : []),
      ...Array(emptyStars).fill('empty')
    ];
  }

  // Format review date
  formatReviewDate(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Get materials as array
  getMaterialsArray(): string[] {
    const materials = this.product?.materialsUsed || '';
    return materials.split(',').map(m => m.trim()).filter(m => m);
  }

  // Get tags as array
  getTagsArray(): string[] {
    return this.product?.tags || [];
  }

  // Check if product has discount
  hasDiscount(): boolean {
    return (this.product?.discount || 0) > 0;
  }

  // Check if product is in wishlist
  checkWishlistStatus(): void {
    if (!this.productId) return;
    if (!this.userStateService.isLoggedIn() || this.userStateService.getUserType() !== 'customer') return;

    this.wishlistService.checkInWishlist(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isInWishlist = response.inWishlist;
        },
        error: () => {
          this.isInWishlist = false;
        }
      });
  }

  // Check if product is in cart
  checkCartStatus(): void {
    if (!this.productId) return;
    if (!this.userStateService.isLoggedIn() || this.userStateService.getUserType() !== 'customer') return;

    const customer = this.userStateService.customer;
    if (customer?.cartProductIds) {
      this.isInCart = customer.cartProductIds.includes(this.productId);
    } else {
      this.isInCart = false;
    }
  }

  // Submit a new review
  submitReview(): void {
    if (!this.userStateService.isLoggedIn() || this.userStateService.getUserType() !== 'customer') {
      this.snackBar.open('Please login as a customer to submit a review', 'Close', { duration: 3000 });
      return;
    }

    if (this.newReviewRating === 0) {
      this.snackBar.open('Please select a rating', 'Close', { duration: 3000 });
      return;
    }

    if (!this.newReviewComment.trim()) {
      this.snackBar.open('Please enter a review comment', 'Close', { duration: 3000 });
      return;
    }

    this.isSubmittingReview = true;
    const customer = this.userStateService.getCurrentUser() as any;

    const reviewRequest: CreateReviewRequest = {
      productId: this.productId || '',
      customerId: customer?.customerId || '',
      customerName: customer?.fullName || 'Anonymous',
      vendorId: this.product?.vendorId || '',
      rating: this.newReviewRating,
      title: this.newReviewTitle || undefined,
      comment: this.newReviewComment
    };

    this.reviewService.createReview(reviewRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (review) => {
          this.snackBar.open('Thank you for your review! It is now visible to everyone.', 'Close', { duration: 3000 });
          this.resetReviewForm();
          this.isSubmittingReview = false;
          // Reload reviews to show the new one (if auto-approved)
          this.loadReviews();
          this.loadProductRating();
        },
        error: (error) => {
          console.error('Error submitting review:', error);
          this.snackBar.open(error.error?.message || 'Failed to submit review. Please try again.', 'Close', { duration: 3000 });
          this.isSubmittingReview = false;
        }
      });
  }

  // Reset review form
  resetReviewForm(): void {
    this.newReviewRating = 0;
    this.newReviewTitle = '';
    this.newReviewComment = '';
    this.showReviewForm = false;
  }

  // Set rating from star click
  setReviewRating(rating: number): void {
    this.newReviewRating = rating;
  }

  // Mark review as helpful
  markReviewHelpful(reviewId: string): void {
    this.reviewService.markAsHelpful(reviewId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedReview) => {
          const index = this.reviews.findIndex(r => r.reviewId === reviewId);
          if (index !== -1) {
            this.reviews[index] = updatedReview;
          }
          this.snackBar.open('Thanks for your feedback!', 'Close', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Could not mark as helpful', 'Close', { duration: 2000 });
        }
      });
  }

  // Get rating distribution percentage for progress bars
  getRatingPercentage(stars: number): number {
    if (!this.productRating?.ratingDistribution || this.productRating.reviewCount === 0) {
      return 0;
    }
    const count = this.productRating.ratingDistribution[stars] || 0;
    return (count / this.productRating.reviewCount) * 100;
  }

  // Get rating distribution count
  getRatingCount(stars: number): number {
    if (!this.productRating?.ratingDistribution) {
      return 0;
    }
    return this.productRating.ratingDistribution[stars] || 0;
  }

  // Get product information (using actual product data from API)
  getProductName(): string {
    return this.product?.productName || 'Product Name';
  }

  getProductPrice(): number {
    return this.product?.price || 0;
  }

  getProductDescription(): string {
    return this.product?.productDescription || 'No description available';
  }

  getProductRating(): number {
    return this.productRating?.averageRating || this.product?.rating || 0;
  }

  getProductReviewCount(): number {
    return this.productRating?.reviewCount || this.reviews.length || 0;
  }

  getProductDiscount(): number {
    return this.product?.discount || 0;
  }

  getOriginalPrice(): number {
    if (this.product?.discount && this.product.discount > 0) {
      return Math.round((this.product.price || 0) / (1 - this.product.discount / 100));
    }
    return this.product?.price || 0;
  }

  getVendorName(): string {
    return this.product?.madeBy || 'N/A';
  }

  getDistrict(): string {
    const district = this.product?.originDistrict || '';
    const state = this.product?.originState || '';
    if (district && state) {
      return `${district}, ${state}`;
    }
    return district || state || 'N/A';
  }

  isInStock(): boolean {
    return (this.product?.productQuantity || 0) > 0;
  }

  getProductFeatures(): string[] {
    // Parse features from specification if available
    if (this.product?.specification) {
      return this.product.specification.split(',').map(s => s.trim()).filter(s => s);
    }
    return [];
  }

  getCustomerReviews(): Review[] {
    return this.reviews;
  }

  // Get GI Tag info
  isGiTagged(): boolean {
    return this.product?.giTagCertified || false;
  }

  getGiTagNumber(): string {
    return this.product?.giTagNumber || '';
  }

  // Get product category
  getProductCategory(): string {
    return this.product?.subCategory || this.product?.categoryId || 'N/A';
  }

  // Get craft type
  getCraftType(): string {
    return this.product?.craftType || 'N/A';
  }

  // Get origin story
  getOriginStory(): string {
    return this.product?.originStory || '';
  }

  // Get materials used
  getMaterialsUsed(): string {
    return this.product?.materialsUsed || '';
  }

  // Image gallery functionality
  changeImage(event: Event): void {
    const thumbnail = event.target as HTMLImageElement;
    const mainImage = this.mainImage?.nativeElement;
    const thumbnails = document.querySelectorAll('.thumbnail') as NodeListOf<HTMLElement>;
    
    if (!mainImage || !thumbnail) return;

    // Remove active class from all thumbnails
    thumbnails.forEach((thumb: HTMLElement) => thumb.classList.remove('active'));
    
    // Add active class to clicked thumbnail
    thumbnail.classList.add('active');
    
    // Change main image with smooth transition
    mainImage.style.opacity = '0.7';
    setTimeout(() => {
      mainImage.src = thumbnail.src.replace('w=80&h=80', 'w=600&h=500');
      mainImage.style.opacity = '1';
    }, 200);
  }

  // Quantity controls
  increaseQuantity(): void {
    const quantityInput = document.getElementById('quantity') as HTMLInputElement;
    if (this.quantity < 10) {
      this.quantity++;
      if (quantityInput) {
        quantityInput.value = this.quantity.toString();
      }
      this.animateQuantityChange();
    }
  }

  decreaseQuantity(): void {
    const quantityInput = document.getElementById('quantity') as HTMLInputElement;
    if (this.quantity > 1) {
      this.quantity--;
      if (quantityInput) {
        quantityInput.value = this.quantity.toString();
      }
      this.animateQuantityChange();
    }
  }

  private animateQuantityChange(): void {
    const quantityInput = document.getElementById('quantity') as HTMLInputElement;
    if (quantityInput) {
      quantityInput.style.transform = 'scale(1.1)';
      setTimeout(() => {
        quantityInput.style.transform = 'scale(1)';
      }, 150);
    }
  }

  // Description toggle
  toggleDescription(): void {
    const fullDescription = document.getElementById('fullDescription') as HTMLElement;
    const showMoreBtn = document.querySelector('.show-more-btn') as HTMLElement;
    
    if (!fullDescription || !showMoreBtn) return;

    if (!this.isDescriptionExpanded) {
      fullDescription.style.display = 'block';
      fullDescription.style.animation = 'fadeIn 0.5s ease-out';
      showMoreBtn.textContent = 'Show Less';
      this.isDescriptionExpanded = true;
    } else {
      fullDescription.style.display = 'none';
      showMoreBtn.textContent = 'Show More';
      this.isDescriptionExpanded = false;
    }
  }

  // Enhanced add to cart functionality
  addToCartEnhanced(): void {
    if (!this.product?.productId) return;
    
    // Check if user is logged in
    if (!this.userStateService.customer) {
      const snackRef = this.snackBar.open('Please login to add items to cart', 'Login', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      snackRef.onAction().subscribe(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    const btn = document.querySelector('.btn-add-cart') as HTMLButtonElement;
    if (!btn) return;

    const originalText = btn.textContent || '';
    const originalBackground = btn.style.background;
    
    // Disable button and show loading
    btn.disabled = true;
    btn.style.transform = 'scale(0.95)';
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    btn.style.background = 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)';
    
    // Create cart item
    const cartItem: Cart = {
      productId: this.product.productId,
      vendorId: this.product.vendorId,
      customerId: this.userStateService.customer.customerId,
      quantity: this.quantity
    };

    // Call backend API
    this.cart_service.registerCart(cartItem).subscribe({
      next: (response) => {
        btn.innerHTML = '<i class="fas fa-check"></i> Added to Cart';
        btn.style.transform = 'scale(1)';
        btn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
        
        // Mark product as in cart
        this.isInCart = true;
        
        // Update cart count via user state - append to existing cart
        const currentCartItems = this.userStateService.customer?.cartProductIds || [];
        if (!currentCartItems.includes(this.product!.productId!)) {
          this.userStateService.broadcastCartUpdate([...currentCartItems, this.product!.productId!]);
        }
        this.cartCount++;
        
        // Animate floating cart
        const floatingCart = document.querySelector('.floating-cart') as HTMLElement;
        if (floatingCart) {
          floatingCart.style.animation = 'none';
          floatingCart.offsetHeight;
          floatingCart.style.animation = 'pulse 0.6s ease-out';
        }
        
        // Show success snackbar with View Cart action
        const snackRef = this.snackBar.open('Item added to cart!', 'View Cart', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snackbar-success']
        });
        
        snackRef.onAction().subscribe(() => {
          this.router.navigate(['/cart']);
        });
        
        // Keep button in "Added" state - no reset needed since isInCart handles the UI
        btn.disabled = false;
      },
      error: (error) => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-times"></i> Failed';
        btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        this.snackBar.open(error.error?.message || 'Failed to add to cart', 'Retry', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snackbar-error']
        });
        
        setTimeout(() => {
          btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
          btn.style.background = originalBackground || 'linear-gradient(135deg, #FF7F50 0%, #FF6347 100%)';
        }, 2000);
      }
    });
  }

  // Original add to cart method - delegates to enhanced version
  addToCart(prod: Product | null | undefined): void {
    if (!prod) return;
    this.addToCartEnhanced();
  }
  
  // Buy Now - Navigate directly to checkout without adding to cart
  buyNow(): void {
    if (!this.product?.productId) return;
    
    // Check if user is logged in
    if (!this.userStateService.customer) {
      const snackRef = this.snackBar.open('Please login to proceed with purchase', 'Login', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['info-snackbar']
      });
      snackRef.onAction().subscribe(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    // Navigate directly to checkout with buyNow product ID and quantity
    this.router.navigate(['/checkout'], { 
      queryParams: { 
        buyNow: this.product.productId,
        qty: this.quantity
      }
    });
  }

  // Wishlist toggle - Connected to WishlistService
  toggleWishlist(event: Event): void {
    const btn = event.target as HTMLButtonElement;
    if (!btn || !this.productId) return;

    if (!this.userStateService.isLoggedIn() || this.userStateService.getUserType() !== 'customer') {
      this.snackBar.open('Please login as a customer to add to wishlist', 'Close', { duration: 3000 });
      return;
    }

    this.isWishlistLoading = true;

    if (!this.isInWishlist) {
      // Add to wishlist
      this.wishlistService.addToWishlist(this.productId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isInWishlist = true;
            this.isWishlistLoading = false;
            btn.textContent = '♥';
            btn.style.color = '#FF6B6B';
            btn.style.borderColor = '#FF6B6B';
            btn.style.background = '#fff5f5';
            this.createFloatingHeart(btn);
            this.snackBar.open('Added to wishlist!', 'Close', { duration: 2000 });
          },
          error: (error) => {
            this.isWishlistLoading = false;
            this.snackBar.open(error.error?.message || 'Failed to add to wishlist', 'Close', { duration: 3000 });
          }
        });
    } else {
      // Remove from wishlist
      this.wishlistService.removeFromWishlist(this.productId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isInWishlist = false;
            this.isWishlistLoading = false;
            btn.textContent = '♡';
            btn.style.color = '#666';
            btn.style.borderColor = '#e1e1e1';
            btn.style.background = 'white';
            this.snackBar.open('Removed from wishlist', 'Close', { duration: 2000 });
          },
          error: (error) => {
            this.isWishlistLoading = false;
            this.snackBar.open(error.error?.message || 'Failed to remove from wishlist', 'Close', { duration: 3000 });
          }
        });
    }
  }

  private createFloatingHeart(button: HTMLButtonElement): void {
    const heart = document.createElement('div');
    heart.textContent = '♥';
    heart.style.cssText = `
      position: absolute;
      color: #FF6B6B;
      font-size: 1.5rem;
      pointer-events: none;
      animation: floatHeart 2s ease-out forwards;
      z-index: 1000;
    `;
    
    const rect = button.getBoundingClientRect();
    heart.style.left = rect.left + rect.width / 2 + 'px';
    heart.style.top = rect.top + 'px';
    
    document.body.appendChild(heart);
    
    setTimeout(() => {
      if (document.body.contains(heart)) {
        document.body.removeChild(heart);
      }
    }, 2000);
  }

  // View cart
  viewCart(): void {
    this.router.navigate(['/cart']);
  }

  // Scroll to top
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Get image with fallback (your existing method)
  getImage(url: string | undefined | null): string {
    if (url === null) {
      return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=80&h=80&fit=crop';
    }
    if (url != null) {
      return url;
    } else {
      return 'https://www.freshone.com.pk/content/images/thumbs/default-image_550.png';
    }
  }

  // Alternative method if your Product model has different property name
  getProductImage(): string {
    // Replace 'imageUrl' with the actual property name from your Product model
    // Common alternatives: image, productImage, picture, photo, etc.
    const imageUrl = this.product?.productImageURL;
    return this.getImage(imageUrl);
  }

  // Initialize intersection observer for animations
  private initializeIntersectionObserver(): void {
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    this.observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);
  }

  // Initialize animations
  private initializeAnimations(): void {
    // Set initial state for animation elements
    const animatedElements = document.querySelectorAll('.fade-in') as NodeListOf<HTMLElement>;
    animatedElements.forEach((el: HTMLElement, index: number) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      el.style.transitionDelay = `${index * 0.1}s`;
      this.observer.observe(el);
    });

    // Add CSS keyframes for animations
    this.addAnimationStyles();
  }

  // Add CSS styles for animations
  private addAnimationStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      
      @keyframes floatHeart {
        0% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translateY(-50px) scale(1.5);
          opacity: 0;
        }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .quantity-input {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .btn-primary {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
    `;
    document.head.appendChild(style);
  }

  // Animate rating bars
  private animateRatingBars(): void {
    setTimeout(() => {
      const ratingBars = document.querySelectorAll('.bar-fill') as NodeListOf<HTMLElement>;
      ratingBars.forEach((bar: HTMLElement) => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
          bar.style.width = width;
        }, 500);
      });
    }, 1500);
  }

  // Setup product card hover effects
  private setupProductCardHovers(): void {
    const productCards = document.querySelectorAll('.product-card') as NodeListOf<HTMLElement>;
    productCards.forEach((card: HTMLElement) => {
      card.addEventListener('mouseenter', function(this: HTMLElement) {
        this.style.transform = 'translateY(-8px) scale(1.02)';
      });
      
      card.addEventListener('mouseleave', function(this: HTMLElement) {
        this.style.transform = 'translateY(0) scale(1)';
      });
    });
  }

  // Add parallax effect to main image
  private addScrollParallax(): void {
    const mainImage = document.querySelector('.main-image') as HTMLElement;
    if (mainImage) {
      window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        mainImage.style.transform = `translateY(${rate}px)`;
      });
    }
  }

  // Setup touch gestures for mobile
  private setupTouchGestures(): void {
    const imageGallery = this.imageGallery?.nativeElement;
    if (imageGallery) {
      imageGallery.addEventListener('touchstart', (e: TouchEvent) => {
        this.touchStartX = e.changedTouches[0].screenX;
      });

      imageGallery.addEventListener('touchend', (e: TouchEvent) => {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
      });
    }
  }

  private handleSwipe(): void {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
      const thumbnails = document.querySelectorAll('.thumbnail') as NodeListOf<HTMLImageElement>;
      const activeThumbnail = document.querySelector('.thumbnail.active') as HTMLImageElement;
      const currentIndex = Array.from(thumbnails).indexOf(activeThumbnail);
      
      if (diff > 0 && currentIndex < thumbnails.length - 1) {
        // Swipe left - next image
        const nextThumbnail = thumbnails[currentIndex + 1];
        const event = new Event('click');
        Object.defineProperty(event, 'target', { value: nextThumbnail });
        this.changeImage(event);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe right - previous image
        const prevThumbnail = thumbnails[currentIndex - 1];
        const event = new Event('click');
        Object.defineProperty(event, 'target', { value: prevThumbnail });
        this.changeImage(event);
      }
    }
  }

  // Cleanup method
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

