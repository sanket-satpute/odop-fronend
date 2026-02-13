import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FestivalService, FestivalCollectionResponse } from '../../../services/festival.service';
import { Subscription, interval } from 'rxjs';
import { CartServiceService } from '../../../project/services/cart-service.service';
import { WishlistService } from '../../../project/services/wishlist.service';
import { UserStateService } from '../../../project/services/user-state.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Cart } from '../../../project/models/cart';

interface Festival {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  bannerUrl: string;
  thumbnailUrl: string;
  festivalType: string;
  colorScheme: string;
  startDate: Date;
  endDate: Date;
  maxDiscount: number;
  totalProducts: number;
  totalVendors: number;
  significance: string;
  traditions: string[];
  regions: string[];
  giftGuide: GiftCategory[];
  featuredProducts: any[];
  featuredVendors: any[];
  categories: FestivalCategory[];
}

interface GiftCategory {
  name: string;
  icon: string;
  description: string;
  products: any[];
}

interface FestivalCategory {
  id: number;
  name: string;
  icon: string;
  productCount: number;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-festival-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatSnackBarModule],
  templateUrl: './festival-detail.component.html',
  styleUrls: ['./festival-detail.component.css']
})
export class FestivalDetailComponent implements OnInit, OnDestroy {
  festival: Festival | null = null;
  isLoading = true;
  error: string | null = null;
  
  countdown: CountdownTime = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  isLive = false;
  
  activeTab: 'products' | 'gift-guide' | 'vendors' | 'about' = 'products';
  selectedCategory: number | null = null;
  
  // Products view
  viewMode: 'grid' | 'list' = 'grid';
  sortBy = 'relevance';
  priceRange = { min: 0, max: 50000 };
  selectedPriceRange: number[] = [0, 50000];
  showFilters = false;
  
  // Products
  products: any[] = [];
  filteredProducts: any[] = [];
  productsLoading = false;
  
  // Gift guide
  activeGiftCategory: number = 0;
  
  // Related festivals
  relatedFestivals: Festival[] = [];
  
  // Loading states for cart/wishlist
  cartLoading: Set<string> = new Set();
  wishlistLoading: Set<string> = new Set();
  wishlistItems: Set<string> = new Set();
  
  private routeSub!: Subscription;
  private countdownSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private festivalService: FestivalService,
    private cartService: CartServiceService,
    private wishlistService: WishlistService,
    private userState: UserStateService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.loadFestival(slug);
      }
    });
    
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.countdownSub) this.countdownSub.unsubscribe();
  }

  loadFestival(slug: string): void {
    this.isLoading = true;
    this.error = null;
    
    this.festivalService.getFestivalBySlug(slug).subscribe({
      next: (response: FestivalCollectionResponse) => {
        // Map response to local Festival interface
        this.festival = this.mapToFestival(response);
        this.checkIfLive();
        this.loadProducts();
        this.loadRelatedFestivals();
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error('Error loading festival:', err);
        this.error = 'Failed to load festival details';
        this.isLoading = false;
      }
    });
  }

  private mapToFestival(response: FestivalCollectionResponse): Festival {
    return {
      id: parseInt(response.id) || 0,
      name: response.name,
      slug: response.slug,
      tagline: response.tagline || '',
      description: response.description || '',
      bannerUrl: response.bannerImageUrl || '',
      thumbnailUrl: response.thumbnailUrl || '',
      festivalType: response.type || '',
      colorScheme: response.themeColor || '#D84315',
      startDate: response.startDate ? new Date(response.startDate) : new Date(),
      endDate: response.endDate ? new Date(response.endDate) : new Date(),
      maxDiscount: response.discountInfo?.percentage || 0,
      totalProducts: response.productCount || 0,
      totalVendors: 0,
      significance: response.description || '',
      traditions: [],
      regions: response.primaryStates || [],
      giftGuide: (response.giftGuide || []).map(g => ({
        name: g.title,
        icon: 'gift',
        description: g.description || '',
        products: []
      })),
      featuredProducts: [],
      featuredVendors: [],
      categories: (response.sections || []).map((s, i) => ({
        id: i,
        name: s.title,
        icon: 'category',
        productCount: s.productIds?.length || 0
      }))
    };
  }

  startCountdown(): void {
    this.countdownSub = interval(1000).subscribe(() => {
      if (this.festival) {
        this.updateCountdown();
      }
    });
  }

  updateCountdown(): void {
    if (!this.festival) return;
    
    const now = new Date().getTime();
    const endTime = new Date(this.festival.endDate).getTime();
    const startTime = new Date(this.festival.startDate).getTime();
    
    if (now < startTime) {
      // Festival hasn't started
      const diff = startTime - now;
      this.countdown = this.calculateTime(diff);
      this.isLive = false;
    } else if (now >= startTime && now <= endTime) {
      // Festival is live
      const diff = endTime - now;
      this.countdown = this.calculateTime(diff);
      this.isLive = true;
    } else {
      // Festival ended
      this.countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      this.isLive = false;
    }
  }

  calculateTime(diff: number): CountdownTime {
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
  }

  checkIfLive(): void {
    if (!this.festival) return;
    const now = new Date();
    const start = new Date(this.festival.startDate);
    const end = new Date(this.festival.endDate);
    this.isLive = now >= start && now <= end;
  }

  loadProducts(): void {
    if (!this.festival) return;
    
    this.productsLoading = true;
    // Products would come from festival sections
    this.festivalService.getFestivalSections(this.festival.id.toString()).subscribe({
      next: (sections: any[]) => {
        // Map sections to products for display
        this.products = [];
        this.filteredProducts = [];
        this.productsLoading = false;
      },
      error: (err: Error) => {
        console.error('Error loading products:', err);
        this.productsLoading = false;
      }
    });
  }

  loadRelatedFestivals(): void {
    if (!this.festival) return;
    
    // Get upcoming festivals as related
    this.festivalService.getUpcomingFestivals().subscribe({
      next: (festivals: FestivalCollectionResponse[]) => {
        this.relatedFestivals = festivals
          .filter(f => f.slug !== this.festival?.slug)
          .slice(0, 4)
          .map(f => this.mapToFestival(f));
      },
      error: (err: Error) => {
        console.error('Error loading related festivals:', err);
      }
    });
  }

  // Tab navigation
  switchTab(tab: 'products' | 'gift-guide' | 'vendors' | 'about'): void {
    this.activeTab = tab;
  }

  // Category filter
  filterByCategory(categoryId: number | null): void {
    this.selectedCategory = categoryId;
    
    if (categoryId === null) {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p => p.categoryId === categoryId);
    }
  }

  // View mode
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  // Sorting
  sortProducts(): void {
    switch (this.sortBy) {
      case 'price-low':
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'discount':
        this.filteredProducts.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      case 'newest':
        this.filteredProducts.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'popular':
        this.filteredProducts.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        break;
      default:
        // relevance - keep original order
        break;
    }
  }

  // Price filter
  applyPriceFilter(): void {
    this.filteredProducts = this.products.filter(p => 
      p.price >= this.selectedPriceRange[0] && p.price <= this.selectedPriceRange[1]
    );
    
    if (this.selectedCategory) {
      this.filteredProducts = this.filteredProducts.filter(p => p.categoryId === this.selectedCategory);
    }
  }

  // Gift guide
  selectGiftCategory(index: number): void {
    this.activeGiftCategory = index;
  }

  // Navigation
  viewProduct(product: any): void {
    this.router.navigate(['/product', product.slug]);
  }

  viewVendor(vendor: any): void {
    this.router.navigate(['/vendor', vendor.slug]);
  }

  viewRelatedFestival(festival: Festival): void {
    this.router.navigate(['/festivals', festival.slug]);
  }

  // Cart actions
  addToCart(product: any): void {
    // Check if user is logged in
    if (!this.userState.customer) {
      this.snackBar.open('Please login to add items to cart', 'Login', { 
        duration: 5000 
      }).onAction().subscribe(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    const productId = product.id || product.productId;
    if (!productId) return;

    this.cartLoading.add(productId);

    const cart = new Cart();
    cart.productId = productId;
    cart.vendorId = product.vendorId;
    cart.customerId = this.userState.customer.customerId;

    this.cartService.registerCart(cart).subscribe({
      next: () => {
        this.cartLoading.delete(productId);
        this.snackBar.open('Added to cart!', 'View Cart', { 
          duration: 3000 
        }).onAction().subscribe(() => {
          this.router.navigate(['/shopping_cart']);
        });
      },
      error: (error) => {
        this.cartLoading.delete(productId);
        this.snackBar.open('Failed to add to cart', 'Close', { duration: 3000 });
        console.error('Cart error:', error);
      }
    });
  }

  addToWishlist(product: any): void {
    // Check if user is logged in
    if (!this.userState.customer) {
      this.snackBar.open('Please login to add to wishlist', 'Login', { 
        duration: 5000 
      }).onAction().subscribe(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    const productId = product.id || product.productId;
    if (!productId) return;

    this.wishlistLoading.add(productId);

    if (this.wishlistItems.has(productId)) {
      // Remove from wishlist
      this.wishlistService.removeFromWishlist(productId).subscribe({
        next: () => {
          this.wishlistLoading.delete(productId);
          this.wishlistItems.delete(productId);
          this.snackBar.open('Removed from wishlist', 'Close', { duration: 2000 });
        },
        error: () => {
          this.wishlistLoading.delete(productId);
          this.snackBar.open('Failed to update wishlist', 'Close', { duration: 3000 });
        }
      });
    } else {
      // Add to wishlist
      this.wishlistService.addToWishlist(productId).subscribe({
        next: () => {
          this.wishlistLoading.delete(productId);
          this.wishlistItems.add(productId);
          this.snackBar.open('Added to wishlist!', 'View', { 
            duration: 3000 
          }).onAction().subscribe(() => {
            this.router.navigate(['/wishlist']);
          });
        },
        error: () => {
          this.wishlistLoading.delete(productId);
          this.snackBar.open('Failed to add to wishlist', 'Close', { duration: 3000 });
        }
      });
    }
  }

  // Helper methods for template
  isInWishlist(productId: string): boolean {
    return this.wishlistItems.has(productId);
  }

  isCartLoading(productId: string): boolean {
    return this.cartLoading.has(productId);
  }

  isWishlistLoading(productId: string): boolean {
    return this.wishlistLoading.has(productId);
  }

  // Share
  shareFestival(): void {
    if (navigator.share) {
      navigator.share({
        title: this.festival?.name,
        text: this.festival?.tagline,
        url: window.location.href
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  }

  // Notification
  notifyMe(): void {
    if (!this.festival) return;
    
    // For now, just show alert - actual subscription would need backend
    alert('You will be notified when this festival goes live!');
  }

  // Helper
  getDiscountedPrice(price: number, discount: number): number {
    return price - (price * discount / 100);
  }

  trackByProduct(index: number, product: any): number {
    return product.id;
  }

  trackByVendor(index: number, vendor: any): number {
    return vendor.id;
  }

  trackByCategory(index: number, category: FestivalCategory): number {
    return category.id;
  }

  goBack(): void {
    this.router.navigate(['/festivals']);
  }
}
