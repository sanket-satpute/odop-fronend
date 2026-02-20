import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ProductServiceService } from '../../project/services/product-service.service';
import { CategoryServiceService } from '../../project/services/category-service.service';
import { CartServiceService } from '../../project/services/cart-service.service';
import { UserStateService } from '../../project/services/user-state.service';
import { WishlistService } from '../../project/services/wishlist.service';
import { Product } from '../../project/models/product';
import { ProductCategory } from '../../project/models/product-category';
import { Cart } from '../../project/models/cart';
import { finalize } from 'rxjs/operators';
import { QuickViewDialogComponent } from '../dialogs/quick-view-dialog/quick-view-dialog.component';
import { LoginDialogComponent } from '../dialogs/login-dialog/login-dialog.component';

// Interface for display product (mapped from API)
interface DisplayProduct {
  id: string;
  name: string;
  price: number;
  unit?: string;
  rating: number;
  reviews: number;
  vendor: string;
  vendorId?: string;
  district: string;
  category: string;
  categoryId?: string;
  image: string;
  giTagged?: boolean;
  originStory?: string;
  discount?: number;
}

// Interface for Filter Options
interface FilterOptions {
  category: string;
  district: string;
  priceRange: number;
  sortBy: string;
  searchTerm: string;
  giTagOnly: boolean;
  minRating: number;
}

// Interface for active filter chip display
interface ActiveFilter {
  key: keyof FilterOptions;
  label: string;
  value: string;
  displayValue: string;
}

// Interface for category display
interface CategoryDisplay {
  id?: string;
  name: string;
  value: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'app-products-component',
  templateUrl: './products-component.component.html',
  styleUrls: ['./products-component.component.css'],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ProductsComponentComponent implements OnInit, OnDestroy, AfterViewInit {
  
  // Product data from API
  products: DisplayProduct[] = [];
  rawProducts: Product[] = [];

  // Categories data from API
  categories: CategoryDisplay[] = [];

  // District options - dynamically populated from products
  districts: { name: string; value: string }[] = [
    { name: 'All Districts', value: '' }
  ];

  // Sort options
  sortOptions = [
    { name: 'Popularity', value: 'popularity' },
    { name: 'Price: Low to High', value: 'price-low' },
    { name: 'Price: High to Low', value: 'price-high' },
    { name: 'Rating', value: 'rating' },
    { name: 'Newest First', value: 'newest' }
  ];

  // Component state
  currentProducts: DisplayProduct[] = [];
  filteredProducts: DisplayProduct[] = [];
  paginatedProducts: DisplayProduct[] = [];
  
  // Filter options
  filters: FilterOptions = {
    category: '',
    district: '',
    priceRange: 100000,
    sortBy: 'popularity',
    searchTerm: '',
    giTagOnly: false,
    minRating: 0
  };

  // Active filters for display
  activeFilters: ActiveFilter[] = [];

  // UI state for filter panel
  isFilterPanelOpen: boolean = false;
  selectedCategoryId: string = '';
  isCategoriesExpanded: boolean = false;

  // Rating options
  ratingOptions = [
    { name: 'All Ratings', value: 0 },
    { name: '4★ & above', value: 4 },
    { name: '3★ & above', value: 3 },
    { name: '2★ & above', value: 2 }
  ];

  // Pagination
  currentPage: number = 1;
  productsPerPage: number = 9;
  totalPages: number = 0;
  
  // UI state
  isLoading: boolean = true;
  isDataLoaded: boolean = false;
  cartItems: number = 0;
  wishlistCount: number = 0;
  isFilterSticky: boolean = false;
  
  // Wishlist and Compare tracking
  wishlistItems: Set<string> = new Set();
  compareItems: Set<string> = new Set();
  
  // Cart tracking
  cartLoading: Set<string> = new Set();
  addedToCart: Set<string> = new Set();
  userCartItems: Set<string> = new Set(); // Track user's cart items locally
  userCartMap: Map<string, string> = new Map(); // Map productId -> cartId for quick deletion
  
  // Subscription cleanup
  private destroy$ = new Subject<void>();
  
  // Math for template access
  Math = Math;
  
  // ViewChild for scrolling
  @ViewChild('productsSection') productsSection!: ElementRef;
  @ViewChild('filterSection') filterSection!: ElementRef;
  
  // Subscription management
  private queryParamsSubscription?: Subscription;
  private filterSectionTop: number = 0;

  // Featured products for sidebar - populated from API
  featuredProducts: DisplayProduct[] = [];

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private productService: ProductServiceService,
    private categoryService: CategoryServiceService,
    private cartService: CartServiceService,
    public userState: UserStateService,
    private wishlistService: WishlistService
  ) { }

  ngOnInit(): void {
    this.loadDataFromAPI();
    this.loadUserCart(); // Load user's cart from database
    this.loadUserWishlist(); // Load user's wishlist from database
    
    // Subscribe to cart count changes
    this.userState.cartCount$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(count => {
      this.cartItems = count;
    });
    
    // Subscribe to wishlist count changes
    this.userState.wishlistCount$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(count => {
      this.wishlistCount = count;
    });
    
    // Subscribe to customer changes (login/logout)
    this.userState.customer$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(customer => {
      if (customer) {
        this.loadUserCart();
        this.loadUserWishlist();
      } else {
        // Clear cart and wishlist data on logout
        this.userCartItems.clear();
        this.userCartMap.clear();
        this.wishlistItems.clear();
        this.wishlistCount = 0;
      }
    });
    
    // Subscribe to query params to handle search from navbar
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.filters.searchTerm = params['search'];
      }
      if (this.isDataLoaded) {
        this.applyFilters();
      }
    });
  }

  /**
   * Load user's cart items from database
   */
  private loadUserCart(): void {
    const customerId = this.userState.customer?.customerId;
    if (!customerId) return;
    
    this.cartService.getCartByIdCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (carts: Cart[]) => {
          this.userCartItems.clear();
          this.userCartMap.clear();
          
          carts.forEach(cart => {
            // Extract product ID (could be string or object)
            const productId = typeof cart.productId === 'object' 
              ? (cart.productId as any).productId 
              : cart.productId;
            
            if (productId && cart.cartId) {
              this.userCartItems.add(productId);
              this.userCartMap.set(productId, cart.cartId);
            }
          });
          
          // Update cart count
          this.cartItems = this.userCartItems.size;
          
          // Note: Don't call broadcastCartUpdate here - it would cause infinite loop
          // because customer$ subscription triggers loadUserCart which calls broadcastCartUpdate
          // which emits customerSubject.next() which triggers customer$ subscription again
        },
        error: (error) => {
          console.error('Error loading user cart:', error);
        }
      });
  }

  /**
   * Load user's wishlist items from backend
   */
  private loadUserWishlist(): void {
    if (!this.userState.customer) return;
    
    this.wishlistService.loadWishlist()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.wishlistItems.clear();
          response.items.forEach(item => {
            this.wishlistItems.add(item.productId);
          });
          this.wishlistCount = response.totalItems;
        },
        error: (error) => {
          console.error('Error loading user wishlist:', error);
        }
      });
  }

  /**
   * Load products and categories from API
   */
  private loadDataFromAPI(): void {
    this.isLoading = true;
    
    forkJoin({
      products: this.productService.getAllProducts(),
      categories: this.categoryService.getAllCategory()
    }).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ products, categories }) => {
        this.rawProducts = products || [];
        this.products = this.mapProductsToDisplay(products || []);
        this.categories = this.mapCategoriesToDisplay(categories || [], products || []);
        this.populateDistrictsFromProducts(products || []);
        this.featuredProducts = this.products.slice(0, 3);
        this.initializeProducts();
        this.isDataLoaded = true;
        
        // Apply any pending search filter from query params
        if (this.filters.searchTerm) {
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.snackBar.open('Failed to load products. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isDataLoaded = true;
      }
    });
  }

  /**
   * Map API products to display format
   */
  private mapProductsToDisplay(products: Product[]): DisplayProduct[] {
    return products.map(p => ({
      id: p.productId || '',
      name: p.productName || 'Unknown Product',
      price: p.price || 0,
      rating: p.rating || 4.0,
      reviews: p.totalSold || 0,
      vendor: p.madeBy || 'Local Artisan',
      vendorId: p.vendorId,
      district: this.formatLocation(p.originDistrict, p.originState),
      category: p.craftType || 'other',
      categoryId: p.categoryId,
      image: p.productImageURL || this.getDefaultImage(p.craftType),
      giTagged: p.giTagCertified,
      originStory: p.originStory,
      discount: p.discount
    }));
  }

  /**
   * Map categories to display format with product counts
   */
  private mapCategoriesToDisplay(categories: ProductCategory[], products: Product[]): CategoryDisplay[] {
    return categories.map((cat, index) => {
      // Use prodCategoryID if available, otherwise generate unique value from name or index
      const categoryId = cat.prodCategoryID || cat.categoryName || `category-${index}`;
      const count = products.filter(p => p.categoryId === cat.prodCategoryID).length;
      return {
        id: categoryId,
        name: cat.categoryName || 'Category',
        value: categoryId,
        icon: this.getCategoryIcon(cat.categoryName || ''),
        count: count
      };
    });
  }

  /**
   * Populate district filter options from products
   */
  private populateDistrictsFromProducts(products: Product[]): void {
    const stateSet = new Set<string>();
    products.forEach(p => {
      if (p.originState) {
        stateSet.add(p.originState);
      }
    });
    
    this.districts = [
      { name: 'All Districts', value: '' },
      ...Array.from(stateSet).sort().map(state => ({
        name: state,
        value: state.toLowerCase()
      }))
    ];
  }

  /**
   * Get category icon based on name
   */
  private getCategoryIcon(categoryName: string): string {
    const name = categoryName.toLowerCase();
    if (name.includes('textile') || name.includes('fabric') || name.includes('handloom')) return 'fas fa-tshirt';
    if (name.includes('food') || name.includes('organic')) return 'fas fa-seedling';
    if (name.includes('handicraft') || name.includes('craft')) return 'fas fa-palette';
    if (name.includes('jewelry') || name.includes('jewel')) return 'fas fa-gem';
    if (name.includes('pottery') || name.includes('ceramic')) return 'fas fa-wine-bottle';
    if (name.includes('spice') || name.includes('herb')) return 'fas fa-pepper-hot';
    if (name.includes('wood')) return 'fas fa-tree';
    return 'fas fa-box';
  }

  /**
   * Get default image/emoji based on craft type
   */
  private getDefaultImage(craftType?: string): string {
    switch (craftType) {
      case 'handloom': return '👘';
      case 'handicraft': return '🎨';
      case 'food': return '🍲';
      case 'spice': return '🌿';
      case 'jewelry': return '💎';
      case 'pottery': return '🏺';
      case 'wood': return '🪵';
      case 'metal': return '⚙️';
      case 'art': return '🖼️';
      default: return '📦';
    }
  }

  /**
   * Format location string
   */
  private formatLocation(district?: string, state?: string): string {
    if (district && state) {
      return `${district}, ${state}`;
    } else if (state) {
      return state;
    } else if (district) {
      return district;
    }
    return 'India';
  }

  ngAfterViewInit(): void {
    // Get the initial position of the filter section
    setTimeout(() => {
      if (this.filterSection?.nativeElement) {
        this.filterSectionTop = this.filterSection.nativeElement.offsetTop;
      }
    }, 100);
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions to prevent memory leaks
    this.queryParamsSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Scroll listener to detect when filter section becomes sticky
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollY = window.scrollY || window.pageYOffset;
    // Show sticky search when scrolled past the filter section's original position
    this.isFilterSticky = scrollY > this.filterSectionTop;
  }

  // Initialize products
  initializeProducts(): void {
    this.currentProducts = [...this.products];
    this.filteredProducts = [...this.products];
    this.calculatePagination(); // Populate paginatedProducts for display
  }

  // Apply filters and sorting
  applyFilters(): void {
    this.isLoading = true;
    
    // Short delay for loading indicator
    setTimeout(() => {
      let filtered = [...this.products];

      // Category filter - filter by categoryId
      if (this.filters.category) {
        filtered = filtered.filter(product => product.categoryId === this.filters.category);
        this.selectedCategoryId = this.filters.category;
      } else {
        this.selectedCategoryId = '';
      }

      // District/State filter
      if (this.filters.district) {
        filtered = filtered.filter(product => 
          product.district.toLowerCase().includes(this.filters.district.toLowerCase())
        );
      }

      // Price range filter
      filtered = filtered.filter(product => product.price <= this.filters.priceRange);

      // Search filter
      if (this.filters.searchTerm) {
        const searchTerm = this.filters.searchTerm.toLowerCase();
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.vendor.toLowerCase().includes(searchTerm) ||
          product.district.toLowerCase().includes(searchTerm) ||
          (product.originStory && product.originStory.toLowerCase().includes(searchTerm))
        );
      }

      // GI Tag filter
      if (this.filters.giTagOnly) {
        filtered = filtered.filter(product => product.giTagged);
      }

      // Rating filter
      if (this.filters.minRating > 0) {
        filtered = filtered.filter(product => product.rating >= this.filters.minRating);
      }

      // Apply sorting
      this.applySorting(filtered);

      this.filteredProducts = filtered;
      this.currentPage = 1;
      this.calculatePagination();
      this.updateActiveFilters();
      this.isLoading = false;
    }, 300);
  }

  // Apply sorting logic
  applySorting(products: DisplayProduct[]): void {
    switch (this.filters.sortBy) {
      case 'price-low':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'popularity':
        products.sort((a, b) => b.reviews - a.reviews);
        break;
      case 'newest':
        // Sort by ID string comparison (newer IDs tend to be lexicographically larger)
        products.sort((a, b) => b.id.localeCompare(a.id));
        break;
      default:
        // Keep original order
        break;
    }
  }

  // Calculate pagination
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  // Filter by category (called from category cards)
  filterByCategory(category: string): void {
    // Immediate visual feedback - update selection state
    this.selectedCategoryId = category;
    
    // Update filter value
    this.filters.category = category;
    
    // Apply filters and update products
    this.applyFilters();
    
    // Scroll to products section
    this.scrollToProducts();
  }

  // FIXED: Search functionality with proper type casting
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.filters.searchTerm = target.value;
      this.applyFilters();
    }
  }

  // FIXED: Filter change handlers with proper type casting
  onCategoryFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.filters.category = target.value;
      // Sync selectedCategoryId with filter for visual consistency
      this.selectedCategoryId = target.value;
      this.applyFilters();
    }
  }

  onDistrictFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.filters.district = target.value;
      this.applyFilters();
    }
  }

  onPriceRangeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.filters.priceRange = Number(target.value);
      this.applyFilters();
    }
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.filters.sortBy = target.value;
      this.applyFilters();
    }
  }

  // Pagination methods
  changePage(page: number | string): void {
    if (page === 'prev' && this.currentPage > 1) {
      this.currentPage--;
    } else if (page === 'next' && this.currentPage < this.totalPages) {
      this.currentPage++;
    } else if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
    
    this.calculatePagination();
    this.scrollToProducts();
  }

  // Get pagination array for template
  getPaginationArray(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (this.currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== this.totalPages) {
          pages.push(i);
        }
      }
      
      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(this.totalPages);
    }
    
    return pages;
  }

  // Product actions
  addToCart(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    
    // Find the raw product to get vendorId
    const rawProduct = this.rawProducts.find(p => p.productId === productId);
    
    // Check if user is logged in
    if (!this.userState.customer) {
      const snackRef = this.snackBar.open('Please login to add items to cart', 'Login', { 
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['info-snackbar']
      });
      
      snackRef.onAction().subscribe(() => {
        this.dialog.open(LoginDialogComponent, {
          width: '500px',
          maxWidth: '95vw',
          panelClass: 'login-dialog'
        });
      });
      return;
    }
    
    // Set loading state
    this.cartLoading.add(productId);
    
    // Create cart item
    const cartItem: Cart = {
      productId: productId,
      vendorId: rawProduct?.vendorId || product.vendorId,
      customerId: this.userState.customer.customerId,
      quantity: 1,
      approval: false,
      time: new Date().toISOString()
    };
    
    // Call backend service
    this.cartService.registerCart(cartItem)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Cart) => {
          this.cartLoading.delete(productId);
          this.addedToCart.add(productId);
          
          // Update local cart tracking
          this.userCartItems.add(productId);
          if (response.cartId) {
            this.userCartMap.set(productId, response.cartId);
          }
          
          // Update cart count
          this.cartItems = this.userCartItems.size;
          
          // Update user state
          this.userState.broadcastCartUpdate(Array.from(this.userCartItems));
          
          // Show success snackbar
          const snackRef = this.snackBar.open(`${product.name} added to cart!`, 'View Cart', { 
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          });
          
          snackRef.onAction().subscribe(() => {
            this.router.navigate(['/shopping_cart']);
          });
          
          // Reset "added" state after animation
          setTimeout(() => {
            this.addedToCart.delete(productId);
          }, 2500);
        },
        error: (error) => {
          this.cartLoading.delete(productId);
          console.error('Error adding to cart:', error);
          this.snackBar.open('Failed to add to cart. Please try again.', 'Close', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  // Remove from cart
  removeFromCart(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (!product || !this.userState.customer) return;
    
    // Set loading state
    this.cartLoading.add(productId);
    
    // Try to get cartId from local map first (fast path)
    const cartId = this.userCartMap.get(productId);
    
    if (cartId) {
      // We have the cartId, delete directly
      this.deleteCartItem(productId, cartId, product.name);
    } else {
      // Fallback: Fetch cart from database to find the cartId
      this.cartService.getCartByIdCustomer(this.userState.customer.customerId!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (carts: Cart[]) => {
            // Find the cart item for this product
            const cartItem = carts.find(cart => {
              const cartProductId = typeof cart.productId === 'object' 
                ? (cart.productId as any).productId 
                : cart.productId;
              return cartProductId === productId;
            });
            
            if (cartItem?.cartId) {
              this.deleteCartItem(productId, cartItem.cartId, product.name);
            } else {
              // Product not found in cart - just update local state
              this.cartLoading.delete(productId);
              this.userCartItems.delete(productId);
              this.userCartMap.delete(productId);
              this.cartItems = this.userCartItems.size;
              this.userState.broadcastCartUpdate(Array.from(this.userCartItems));
            }
          },
          error: (error) => {
            this.cartLoading.delete(productId);
            console.error('Error fetching cart:', error);
            this.snackBar.open('Failed to remove from cart. Please try again.', 'Close', { 
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }
  
  // Helper: Delete cart item by cartId
  private deleteCartItem(productId: string, cartId: string, productName: string): void {
    this.cartService.deleteCartById(cartId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cartLoading.delete(productId);
          
          // Update local cart tracking
          this.userCartItems.delete(productId);
          this.userCartMap.delete(productId);
          
          // Update cart count
          this.cartItems = this.userCartItems.size;
          
          // Update user state
          this.userState.broadcastCartUpdate(Array.from(this.userCartItems));
          
          this.snackBar.open(`${productName} removed from cart`, 'Close', { 
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom',
            panelClass: ['info-snackbar']
          });
        },
        error: (error) => {
          this.cartLoading.delete(productId);
          console.error('Error removing from cart:', error);
          this.snackBar.open('Failed to remove from cart. Please try again.', 'Close', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  // Toggle cart (add/remove)
  toggleCart(productId: string): void {
    if (this.isInCart(productId)) {
      this.removeFromCart(productId);
    } else {
      this.addToCart(productId);
    }
  }

  // Check if product is being added to/removed from cart
  isCartLoading(productId: string): boolean {
    return this.cartLoading.has(productId);
  }

  // Check if product was just added to cart (for animation)
  isAddedToCart(productId: string): boolean {
    return this.addedToCart.has(productId);
  }

  // Check if product is already in cart
  isInCart(productId: string): boolean {
    return this.userCartItems.has(productId);
  }

  viewDetails(productId: string): void {
    // Navigate to product details page with product ID
    this.router.navigate(['/product_detail', productId]);
  }

  addToWishlist(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    
    // Check if user is logged in
    if (!this.userState.customer) {
      this.snackBar.open('Please login to add items to wishlist', 'Login', { 
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['info-snackbar']
      }).onAction().subscribe(() => {
        this.dialog.open(LoginDialogComponent, {
          width: '500px',
          maxWidth: '95vw',
          panelClass: 'login-dialog'
        });
      });
      return;
    }
    
    // Call backend API to add to wishlist
    this.wishlistService.addToWishlist(productId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.wishlistItems.add(productId);
        this.wishlistCount = response.wishlistCount;
        this.userState.broadcastWishlistUpdate(Array.from(this.wishlistItems));
        this.snackBar.open(`${product.name} added to wishlist!`, 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Error adding to wishlist:', error);
        this.snackBar.open('Failed to add to wishlist', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // Check if product is in wishlist
  isInWishlist(productId: string): boolean {
    return this.wishlistItems.has(productId);
  }

  // Toggle wishlist (add/remove)
  toggleWishlist(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    
    // Check if user is logged in
    if (!this.userState.customer) {
      this.snackBar.open('Please login to manage wishlist', 'Login', { 
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['info-snackbar']
      }).onAction().subscribe(() => {
        this.dialog.open(LoginDialogComponent, {
          width: '500px',
          maxWidth: '95vw',
          panelClass: 'login-dialog'
        });
      });
      return;
    }

    if (this.wishlistItems.has(productId)) {
      // Remove from wishlist via backend API
      this.wishlistService.removeFromWishlist(productId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.wishlistItems.delete(productId);
          this.wishlistCount = response.wishlistCount;
          this.userState.broadcastWishlistUpdate(Array.from(this.wishlistItems));
          const snackRef = this.snackBar.open(`${product.name} removed from wishlist`, 'Undo', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom'
          });
          snackRef.onAction().subscribe(() => {
            this.addToWishlist(productId);
          });
        },
        error: (error) => {
          console.error('Error removing from wishlist:', error);
          this.snackBar.open('Failed to remove from wishlist', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      // Add to wishlist via backend API  
      this.wishlistService.addToWishlist(productId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.wishlistItems.add(productId);
          this.wishlistCount = response.wishlistCount;
          this.userState.broadcastWishlistUpdate(Array.from(this.wishlistItems));
          this.snackBar.open(`${product.name} added to wishlist!`, 'View Wishlist', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          }).onAction().subscribe(() => {
            this.router.navigate(['/wishlist']);
          });
        },
        error: (error) => {
          console.error('Error adding to wishlist:', error);
          this.snackBar.open('Failed to add to wishlist', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  // Quick view product - opens dialog with product preview
  quickView(product: DisplayProduct): void {
    this.router.navigate(['/product_detail', product.id]);
  }

  // Open Quick View Dialog
  openQuickView(product: DisplayProduct): void {
    // Find the raw product to pass to dialog
    const rawProduct = this.rawProducts.find(p => p.productId === product.id);
    if (rawProduct) {
      this.dialog.open(QuickViewDialogComponent, {
        data: { product: rawProduct },
        width: '900px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        panelClass: 'quick-view-dialog-container'
      });
    } else {
      // Fallback: navigate to product details
      this.router.navigate(['/product_detail', product.id]);
    }
  }

  // Check if product is in compare list
  isInCompare(productId: string): boolean {
    return this.compareItems.has(productId);
  }

  // Toggle compare (add/remove)
  toggleCompare(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    if (this.compareItems.has(productId)) {
      this.compareItems.delete(productId);
      this.snackBar.open(`${product.name} removed from compare`, 'Undo', {
        duration: 2000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      });
    } else {
      if (this.compareItems.size >= 4) {
        this.snackBar.open('You can compare up to 4 products only. Remove one to add another.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
        return;
      }
      this.compareItems.add(productId);
      this.snackBar.open(`${product.name} added to compare (${this.compareItems.size}/4)`, 'Compare Now', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom',
        panelClass: ['success-snackbar']
      });
    }
  }

  // Add to compare list (legacy method)
  addToCompare(productId: string): void {
    this.toggleCompare(productId);
  }

  // Remove from compare
  removeFromCompare(productId: string): void {
    this.compareItems.delete(productId);
  }

  // Clear all compare items
  clearCompare(): void {
    this.compareItems.clear();
    this.snackBar.open('Compare list cleared', 'Close', {
      duration: 2000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }

  // Get compare items as array
  getCompareItemsArray(): string[] {
    return Array.from(this.compareItems);
  }

  // Get product image by ID
  getProductImage(productId: string): string {
    const product = this.products.find(p => p.id === productId);
    return product?.image || 'assets/images/product-placeholder.svg';
  }

  // Get product name by ID
  getProductName(productId: string): string {
    const product = this.products.find(p => p.id === productId);
    return product?.name || 'Product';
  }

  // Get compare products
  getCompareProducts(): DisplayProduct[] {
    return Array.from(this.compareItems)
      .map(id => this.products.find(p => p.id === id))
      .filter((p): p is DisplayProduct => p !== undefined);
  }

  // Open Compare Dialog
  openCompareDialog(): void {
    if (this.compareItems.size < 2) {
      this.snackBar.open('Please add at least 2 products to compare', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      });
      return;
    }

    const compareProducts = this.getCompareProducts();
    
    // Create and open inline compare dialog
    import('../dialogs/compare-dialog/compare-dialog.component').then(module => {
      this.dialog.open(module.CompareDialogComponent, {
        data: { 
          products: compareProducts,
          allProducts: this.products
        },
        width: '95vw',
        maxWidth: '1400px',
        maxHeight: '90vh',
        panelClass: 'compare-dialog-container'
      });
    }).catch(() => {
      // Fallback if dynamic import fails - navigate to compare page
      this.router.navigate(['/compare'], {
        queryParams: { ids: Array.from(this.compareItems).join(',') }
      });
    });
  }

  // Open Compare Select Dialog (to add more products)
  openCompareSelectDialog(): void {
    import('../dialogs/compare-select-dialog/compare-select-dialog.component').then(module => {
      const dialogRef = this.dialog.open(module.CompareSelectDialogComponent, {
        data: { 
          products: this.products,
          selectedIds: Array.from(this.compareItems),
          maxItems: 4
        },
        width: '800px',
        maxWidth: '95vw',
        maxHeight: '80vh',
        panelClass: 'compare-select-dialog-container'
      });

      dialogRef.afterClosed().subscribe((selectedIds: string[] | undefined) => {
        if (selectedIds) {
          this.compareItems = new Set(selectedIds);
        }
      });
    }).catch(() => {
      this.snackBar.open('Unable to open selection dialog', 'Close', {
        duration: 2000
      });
    });
  }

  // Buy now - direct checkout without adding to cart
  buyNow(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    
    // Check if user is logged in
    if (!this.userState.customer) {
      const snackRef = this.snackBar.open('Please login to proceed with purchase', 'Login', { 
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['info-snackbar']
      });
      
      snackRef.onAction().subscribe(() => {
        this.dialog.open(LoginDialogComponent, {
          width: '500px',
          maxWidth: '95vw',
          panelClass: 'login-dialog'
        });
      });
      return;
    }
    
    // Navigate to checkout with buyNow product ID and quantity
    this.router.navigate(['/checkout'], { 
      queryParams: { 
        buyNow: productId,
        qty: 1
      }
    });
  }

  // Calculate original price from discounted price
  getOriginalPrice(discountedPrice: number, discountPercent: number): number {
    if (!discountPercent || discountPercent <= 0) return discountedPrice;
    return Math.round(discountedPrice / (1 - discountPercent / 100));
  }

  // Utility methods
  generateStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('en-IN');
  }

  scrollToProducts(): void {
    // Using ViewChild for proper Angular DOM access
    setTimeout(() => {
      if (this.productsSection?.nativeElement) {
        this.productsSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  // Keyboard navigation
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft' && this.currentPage > 1) {
      this.changePage('prev');
    } else if (event.key === 'ArrowRight' && this.currentPage < this.totalPages) {
      this.changePage('next');
    }
  }

  // Get results count
  getResultsCount(): number {
    return this.filteredProducts.length;
  }

  // Check if page is active
  isPageActive(page: number | string): boolean {
    return page === this.currentPage;
  }

  // Check if previous page is available
  hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  // Check if next page is available
  hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  // Clear all filters and reset to default
  clearFilters(): void {
    this.filters = {
      category: '',
      district: '',
      priceRange: 100000,
      sortBy: 'popularity',
      searchTerm: '',
      giTagOnly: false,
      minRating: 0
    };
    this.selectedCategoryId = '';
    this.activeFilters = [];
    this.applyFilters();
  }

  // Toggle filter panel
  toggleFilterPanel(): void {
    this.isFilterPanelOpen = !this.isFilterPanelOpen;
  }

  // Close filter panel
  closeFilterPanel(): void {
    this.isFilterPanelOpen = false;
  }

  // Update active filters for display
  updateActiveFilters(): void {
    this.activeFilters = [];

    if (this.filters.searchTerm) {
      this.activeFilters.push({
        key: 'searchTerm',
        label: 'Search',
        value: this.filters.searchTerm,
        displayValue: `"${this.filters.searchTerm}"`
      });
    }

    if (this.filters.category) {
      const category = this.categories.find(c => c.value === this.filters.category);
      this.activeFilters.push({
        key: 'category',
        label: 'Category',
        value: this.filters.category,
        displayValue: category?.name || this.filters.category
      });
    }

    if (this.filters.district) {
      const district = this.districts.find(d => d.value === this.filters.district);
      this.activeFilters.push({
        key: 'district',
        label: 'District',
        value: this.filters.district,
        displayValue: district?.name || this.filters.district
      });
    }

    if (this.filters.priceRange < 100000) {
      this.activeFilters.push({
        key: 'priceRange',
        label: 'Max Price',
        value: this.filters.priceRange.toString(),
        displayValue: `Up to ₹${this.formatPrice(this.filters.priceRange)}`
      });
    }

    if (this.filters.giTagOnly) {
      this.activeFilters.push({
        key: 'giTagOnly',
        label: 'GI Tagged',
        value: 'true',
        displayValue: 'GI Certified Only'
      });
    }

    if (this.filters.minRating > 0) {
      this.activeFilters.push({
        key: 'minRating',
        label: 'Rating',
        value: this.filters.minRating.toString(),
        displayValue: `${this.filters.minRating}★ & above`
      });
    }

    if (this.filters.sortBy !== 'popularity') {
      const sortOption = this.sortOptions.find(s => s.value === this.filters.sortBy);
      this.activeFilters.push({
        key: 'sortBy',
        label: 'Sort',
        value: this.filters.sortBy,
        displayValue: sortOption?.name || this.filters.sortBy
      });
    }
  }

  // Remove individual filter
  removeFilter(filter: ActiveFilter): void {
    switch (filter.key) {
      case 'searchTerm':
        this.filters.searchTerm = '';
        break;
      case 'category':
        this.filters.category = '';
        this.selectedCategoryId = '';
        break;
      case 'district':
        this.filters.district = '';
        break;
      case 'priceRange':
        this.filters.priceRange = 100000;
        break;
      case 'giTagOnly':
        this.filters.giTagOnly = false;
        break;
      case 'minRating':
        this.filters.minRating = 0;
        break;
      case 'sortBy':
        this.filters.sortBy = 'popularity';
        break;
    }
    this.applyFilters();
  }

  // Check if any filter is active
  hasActiveFilters(): boolean {
    return this.activeFilters.length > 0;
  }

  // Toggle GI Tag filter
  toggleGiTagFilter(): void {
    this.filters.giTagOnly = !this.filters.giTagOnly;
    this.applyFilters();
  }

  // Update rating filter
  onRatingFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.filters.minRating = Number(target.value);
      this.applyFilters();
    }
  }

  // Check if category is selected
  isCategorySelected(categoryValue: string): boolean {
    // "All Categories" is selected when selectedCategoryId is empty AND categoryValue is 'all'
    if (categoryValue === 'all') {
      return this.selectedCategoryId === '' || this.selectedCategoryId === 'all';
    }
    // For other categories, only match if selectedCategoryId is NOT empty and matches
    if (!categoryValue || categoryValue === '') {
      return false; // Empty category values should never show as selected
    }
    return this.selectedCategoryId === categoryValue;
  }

  // Toggle categories expand/collapse
  toggleCategoriesExpand(): void {
    this.isCategoriesExpanded = !this.isCategoriesExpanded;
  }

  // Get total products count for "All Categories"
  getTotalProductsCount(): number {
    return this.products.length;
  }
}
