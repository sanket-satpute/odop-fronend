import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, finalize, catchError, retry, tap } from 'rxjs/operators';
import { VendorServiceService } from '../../project/services/vendor-service.service';
import { ProductServiceService } from '../../project/services/product-service.service';
import { CartServiceService } from '../../project/services/cart-service.service';
import { WishlistService } from '../../project/services/wishlist.service';
import { UserStateService } from '../../project/services/user-state.service';
import { ReviewService, Review, VendorRating } from '../../project/services/review.service';
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

  // Shop reviews (mock data - in production from API)
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
        retry(2), // Retry twice on failure
        catchError(error => {
          console.error('Error loading vendor:', error);
          // Return mock data as fallback
          return of(this.getMockVendor(vendorId));
        })
      )
      .subscribe({
        next: (vendor) => {
          if (vendor && vendor.vendorId) {
            this.vendor = vendor;
          } else {
            // Use mock data if vendor data is incomplete
            this.vendor = this.getMockVendor(vendorId);
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
          this.vendor = this.getMockVendor(vendorId);
          this.isLoading = false;
          this.initializeGallery();
          this.generateTrustMetrics();
          this.loadVendorProducts(vendorId);
          this.loadVendorReviews(vendorId);
          this.loadRelatedVendors();
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
          // Generate mock reviews if none from API
          this.generateMockReviews();
        }
        this.reviewsLoading = false;
        this.generateTrustMetrics(); // Update trust metrics with review data
      },
      error: () => {
        this.generateMockReviews();
        this.reviewsLoading = false;
      }
    });
  }

  // Map API Review to local ShopReview format
  private mapApiReviewToShopReview(review: Review): ShopReview {
    return {
      id: review.reviewId,
      customerName: review.customerName || 'Anonymous',
      customerImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(review.customerName || 'A')}&background=random`,
      rating: review.rating,
      comment: review.comment,
      date: new Date(review.createdAt),
      helpful: review.helpfulCount || 0,
      verified: review.isVerifiedPurchase
    };
  }

  getMockVendor(vendorId: string): VendorDto {
    return {
      vendorId: vendorId,
      fullName: 'Ramesh Kumar Sharma',
      email: 'ramesh.crafts@example.com',
      phone: '+91 98765 43210',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      shoppeeName: 'Sharma Handicrafts & Traditional Arts',
      shopDescription: 'Welcome to Sharma Handicrafts, where tradition meets artistry. For over three generations, our family has been preserving the rich heritage of Indian handicrafts. Each piece we create tells a story of dedication, skill, and cultural pride. We specialize in traditional Rajasthani textiles, hand-painted pottery, and intricate wood carvings that capture the essence of our vibrant culture. Our workshop is a place where ancient techniques are kept alive, passed down from master craftsmen who learned from their fathers and grandfathers before them.',
      shopImages: [
        'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800',
        'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
        'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800'
      ],
      shopLatitude: 26.9124,
      shopLongitude: 75.7873,
      shopAddress: '45, Craft Bazaar, Near City Palace',
      locationState: 'Rajasthan',
      locationDistrict: 'Jaipur',
      pincode: '302001',
      businessStartDate: new Date('2008-03-15'),
      isVerified: true,
      giTagCertified: true,
      deliveryOptions: ['Standard Shipping', 'Express Delivery', 'Local Pickup'],
      returnPolicy: '7-day easy returns on all products. Items must be in original condition with tags intact.',
      qualityPolicy: 'Every product is handcrafted with care and undergoes strict quality checks before shipping.',
      // Contact Information
      contactNumber: '+91 98765 43210',
      emailAddress: 'ramesh.crafts@example.com',
      whatsappNumber: '+919876543210',
      websiteUrl: 'https://sharmahandicrafts.example.com',
      // Shop Visit Details
      isPhysicalVisitAllowed: true,
      shopTimings: '10:00 AM - 7:00 PM',
      shopClosedDays: 'Sunday',
      // Specializations
      specializations: ['Blue Pottery', 'Block Printing', 'Wood Carving', 'Traditional Textiles', 'Lacquer Work'],
    } as unknown as VendorDto;
  }

  getMockProducts(): Product[] {
    return [
      {
        productId: 'mock-1',
        productName: 'Hand-Painted Blue Pottery Vase',
        description: 'Exquisite hand-painted blue pottery vase featuring traditional Jaipur floral motifs',
        price: 2499,
        discountedPrice: 1999,
        images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400'],
        subCategory: 'Pottery',
        craftType: 'Blue Pottery',
        origin: 'Jaipur, Rajasthan',
        isGITagged: true,
        rating: 4.8,
        totalReviews: 124,
        totalSold: 89,
        stockQuantity: 15,
        vendorId: this.vendor?.vendorId
      },
      {
        productId: 'mock-2',
        productName: 'Rajasthani Block Print Bedsheet Set',
        description: 'Premium cotton bedsheet with traditional block print patterns, includes 2 pillow covers',
        price: 3999,
        discountedPrice: 3199,
        images: ['https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=400'],
        subCategory: 'Textiles',
        craftType: 'Block Print',
        origin: 'Sanganer, Rajasthan',
        isGITagged: true,
        rating: 4.9,
        totalReviews: 256,
        totalSold: 312,
        stockQuantity: 25,
        vendorId: this.vendor?.vendorId
      },
      {
        productId: 'mock-3',
        productName: 'Handcrafted Wooden Elephant Figurine',
        description: 'Intricately carved wooden elephant with brass inlay work',
        price: 1899,
        images: ['https://images.unsplash.com/photo-1602507364286-98c4c82fc66d?w=400'],
        subCategory: 'Woodwork',
        craftType: 'Wood Carving',
        origin: 'Jodhpur, Rajasthan',
        isGITagged: false,
        rating: 4.7,
        totalReviews: 89,
        totalSold: 156,
        stockQuantity: 20,
        vendorId: this.vendor?.vendorId
      },
      {
        productId: 'mock-4',
        productName: 'Traditional Bandhani Silk Dupatta',
        description: 'Vibrant bandhani tie-dye silk dupatta in stunning crimson and gold',
        price: 4599,
        discountedPrice: 3899,
        images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400'],
        subCategory: 'Textiles',
        craftType: 'Bandhani',
        origin: 'Jodhpur, Rajasthan',
        isGITagged: true,
        rating: 4.9,
        totalReviews: 178,
        totalSold: 234,
        stockQuantity: 12,
        vendorId: this.vendor?.vendorId
      },
      {
        productId: 'mock-5',
        productName: 'Brass Diya Set (Pack of 5)',
        description: 'Traditional brass oil lamps with intricate engravings, perfect for festivals',
        price: 1299,
        images: ['https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=400'],
        subCategory: 'Metalwork',
        craftType: 'Brass Work',
        origin: 'Jaipur, Rajasthan',
        isGITagged: false,
        rating: 4.6,
        totalReviews: 67,
        totalSold: 445,
        stockQuantity: 50,
        vendorId: this.vendor?.vendorId
      },
      {
        productId: 'mock-6',
        productName: 'Miniature Painting - Royal Procession',
        description: 'Authentic Rajasthani miniature painting on silk depicting a royal Mughal procession',
        price: 8999,
        discountedPrice: 7499,
        images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400'],
        subCategory: 'Art',
        craftType: 'Miniature Painting',
        origin: 'Udaipur, Rajasthan',
        isGITagged: true,
        rating: 5.0,
        totalReviews: 45,
        totalSold: 28,
        stockQuantity: 5,
        vendorId: this.vendor?.vendorId
      },
      {
        productId: 'mock-7',
        productName: 'Lac Bangle Set - Bridal Collection',
        description: 'Set of 12 handcrafted lac bangles with stone and mirror work',
        price: 1599,
        images: ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400'],
        subCategory: 'Jewelry',
        craftType: 'Lac Work',
        origin: 'Jaipur, Rajasthan',
        isGITagged: false,
        rating: 4.8,
        totalReviews: 234,
        totalSold: 567,
        stockQuantity: 30,
        vendorId: this.vendor?.vendorId
      },
      {
        productId: 'mock-8',
        productName: 'Jaipuri Razai (Cotton Quilt)',
        description: 'Premium handmade cotton quilt with traditional Sanganeri print',
        price: 5499,
        discountedPrice: 4499,
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400'],
        subCategory: 'Textiles',
        craftType: 'Hand Quilting',
        origin: 'Sanganer, Rajasthan',
        isGITagged: true,
        rating: 4.9,
        totalReviews: 312,
        totalSold: 198,
        stockQuantity: 18,
        vendorId: this.vendor?.vendorId
      }
    ] as unknown as Product[];
  }

  getMockRelatedVendors(): VendorDto[] {
    return [
      {
        vendorId: 'related-1',
        fullName: 'Priya Devi',
        shoppeeName: 'Devi Traditional Textiles',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        locationDistrict: 'Jodhpur',
        locationState: 'Rajasthan',
        isVerified: true,
        shopImages: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400']
      },
      {
        vendorId: 'related-2',
        fullName: 'Mohan Lal Kumhar',
        shoppeeName: 'Blue Pottery House',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
        locationDistrict: 'Jaipur',
        locationState: 'Rajasthan',
        isVerified: true,
        giTagCertified: true,
        shopImages: ['https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=400']
      },
      {
        vendorId: 'related-3',
        fullName: 'Sunita Meena',
        shoppeeName: 'Meena Craft Studio',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
        locationDistrict: 'Udaipur',
        locationState: 'Rajasthan',
        isVerified: true,
        shopImages: ['https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400']
      },
      {
        vendorId: 'related-4',
        fullName: 'Arjun Singh',
        shoppeeName: 'Royal Rajasthan Handicrafts',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
        locationDistrict: 'Bikaner',
        locationState: 'Rajasthan',
        isVerified: false,
        shopImages: ['https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400']
      }
    ] as unknown as VendorDto[];
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
          if (products && products.length > 0) {
            this.products = products;
          } else {
            // Use mock products if none returned
            this.products = this.getMockProducts();
          }
          this.filteredProducts = [...this.products];
          this.extractCategories();
          this.calculatePagination();
          this.productsLoading = false;
          this.generateTrustMetrics(); // Update product count in trust metrics
        },
        error: () => {
          this.products = this.getMockProducts();
          this.filteredProducts = [...this.products];
          this.extractCategories();
          this.calculatePagination();
          this.productsLoading = false;
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
            }
            // If no related vendors found, use mock data
            if (this.relatedVendors.length === 0) {
              this.relatedVendors = this.getMockRelatedVendors();
            }
            this.relatedVendorsLoading = false;
          },
          error: () => {
            this.relatedVendors = this.getMockRelatedVendors();
            this.relatedVendorsLoading = false;
          }
        });
    } else {
      // Use mock related vendors if no state
      this.relatedVendors = this.getMockRelatedVendors();
      this.relatedVendorsLoading = false;
    }
  }

  initializeGallery(): void {
    this.galleryImages = [];
    
    // Add shop images
    if (this.vendor?.shopImages && this.vendor.shopImages.length > 0) {
      this.galleryImages.push(...this.vendor.shopImages);
    }
    
    // Add demo images if none available
    if (this.galleryImages.length === 0) {
      this.galleryImages = [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1555529771-7888783a18d3?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=600&fit=crop'
      ];
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

  generateMockReviews(): void {
    // Generate realistic mock reviews - in production these come from API
    const reviewers = [
      { name: 'Priya Sharma', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face' },
      { name: 'Rahul Verma', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
      { name: 'Anita Patel', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face' },
      { name: 'Vikram Singh', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face' },
      { name: 'Meera Reddy', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face' }
    ];

    const comments = [
      'Excellent quality products and very responsive seller. Highly recommend!',
      'Authentic handicrafts with great attention to detail. Loved the packaging too.',
      'Fast delivery and product was exactly as described. Will buy again!',
      'The artisan craftsmanship is outstanding. Supporting local talent feels great.',
      'Great communication throughout. The seller helped me choose the perfect gift.'
    ];

    this.shopReviews = reviewers.map((reviewer, index) => ({
      id: `review-${index}`,
      customerName: reviewer.name,
      customerImage: reviewer.image,
      rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
      comment: comments[index],
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      verified: Math.random() > 0.3,
      helpful: Math.floor(Math.random() * 50)
    }));

    this.totalShopReviews = this.shopReviews.length;
    this.calculateRatingDistribution();
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
        result.sort((a, b) => {
          const dateA = new Date(a.popularityScore || 0).getTime();
          const dateB = new Date(b.popularityScore || 0).getTime();
          return dateB - dateA;
        });
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
          this.router.navigate(['/cart']);
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
