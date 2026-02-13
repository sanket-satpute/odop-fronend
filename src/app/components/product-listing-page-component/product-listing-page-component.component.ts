import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppComponent } from 'src/app/app.component';
import { Cart } from 'src/app/project/models/cart';
import { Product } from 'src/app/project/models/product';
import { ProductCategory } from 'src/app/project/models/product-category';
import { CartServiceService } from 'src/app/project/services/cart-service.service';
import { CategoryServiceService } from 'src/app/project/services/category-service.service';
import { ProductServiceService } from 'src/app/project/services/product-service.service';
import { WishlistService } from 'src/app/project/services/wishlist.service';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { CompareService } from 'src/app/project/services/compare.service';
import { QuickViewDialogComponent } from '../dialogs/quick-view-dialog/quick-view-dialog.component';
import { LoginDialogComponent } from '../dialogs/login-dialog/login-dialog.component';

@Component({
  selector: 'app-product-listing-page-component',
  templateUrl: './product-listing-page-component.component.html',
  styleUrls: ['./product-listing-page-component.component.css']
})
export class ProductListingPageComponentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  filterDistrict: string = '';
  filterState: string = '';
  products: Product[] | undefined;
  category: ProductCategory[] | undefined;
  nav_product: Product | null = new Product();
  searchResultText: string = '';
  cart: Cart = new Cart();
  
  // New properties for premium UI
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: string = 'popularity';
  selectedCategory: string = 'all';
  isGiFilterActive: boolean = false;
  totalProducts: number = 0;
  
  // Loading states
  isLoading: boolean = false;
  wishlistLoading: Set<string> = new Set();
  cartLoading: Set<string> = new Set();
  addedToCart: Set<string> = new Set();

  constructor(
    private ap: AppComponent,
    private prod_service: ProductServiceService,
    private cat_service: CategoryServiceService,
    private router: Router,
    private cart_service: CartServiceService,
    private wishlistService: WishlistService,
    private userState: UserStateService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private compareService: CompareService
  ) { }

  ngOnInit(): void {
    this.cat_service.getAllCategory().subscribe({
      next: (response) => {
        this.category = response;
      },
      error: (error) => {
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
        console.error('Error loading categories:', error);
      }
    });
    // Load all products on init
    this.showAllCategory(1);
    
    // Load wishlist for current user
    if (this.userState.customer) {
      this.wishlistService.loadWishlist().pipe(takeUntil(this.destroy$)).subscribe();
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Sort products based on selected criteria
  sortProducts(): void {
    if (!this.products) return;
    
    switch (this.sortBy) {
      case 'price-low':
        this.products.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        this.products.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        this.products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        // Assuming newer products have higher IDs or there's a date field
        this.products.reverse();
        break;
      default:
        // popularity - keep original order or sort by totalSold if available
        this.products.sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
    }
  }

  // Get category icon based on category name
  getCategoryIcon(categoryName: string | undefined): string {
    const icons: { [key: string]: string } = {
      'Textiles': 'fas fa-tshirt',
      'Handicrafts': 'fas fa-hands',
      'Pottery': 'fas fa-mortar-pestle',
      'Jewelry': 'fas fa-gem',
      'Food': 'fas fa-utensils',
      'Spices': 'fas fa-pepper-hot',
      'Art': 'fas fa-palette',
      'Furniture': 'fas fa-couch',
      'Leather': 'fas fa-briefcase',
      'Metal': 'fas fa-tools'
    };
    return icons[categoryName || ''] || 'fas fa-box';
  }

  // Add to wishlist
  addToWishlist(prod: Product): void {
    // Check if user is logged in
    if (!this.userState.customer) {
      this.snackBar.open('Please login to add items to wishlist', 'Login', { 
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }).onAction().subscribe(() => {
        this.router.navigate(['/login']);
      });
      return;
    }
    
    const productId = prod.productId;
    if (!productId) return;
    
    // Set loading state for this product
    this.wishlistLoading.add(productId);
    
    // Check if already in wishlist
    if (this.wishlistService.isInWishlist(productId)) {
      // Remove from wishlist
      this.wishlistService.removeFromWishlist(productId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.wishlistLoading.delete(productId);
          this.snackBar.open('Removed from wishlist', 'Close', { duration: 2000 });
        },
        error: (error) => {
          this.wishlistLoading.delete(productId);
          this.snackBar.open('Failed to update wishlist', 'Close', { duration: 3000 });
          console.error('Wishlist error:', error);
        }
      });
    } else {
      // Add to wishlist
      this.wishlistService.addToWishlist(productId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.wishlistLoading.delete(productId);
          this.snackBar.open('Added to wishlist!', 'View', { 
            duration: 3000 
          }).onAction().subscribe(() => {
            this.router.navigate(['/wishlist']);
          });
        },
        error: (error) => {
          this.wishlistLoading.delete(productId);
          this.snackBar.open('Failed to add to wishlist', 'Close', { duration: 3000 });
          console.error('Wishlist error:', error);
        }
      });
    }
  }
  
  // Check if product is in wishlist
  isInWishlist(productId: string | undefined): boolean {
    if (!productId) return false;
    return this.wishlistService.isInWishlist(productId);
  }
  
  // Check if wishlist action is loading for a product
  isWishlistLoading(productId: string | undefined): boolean {
    if (!productId) return false;
    return this.wishlistLoading.has(productId);
  }

  // Quick view modal
  quickView(prod: Product): void {
    const dialogRef = this.dialog.open(QuickViewDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'quick-view-dialog',
      data: { product: prod }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'view-details') {
        this.router.navigate(['/product_detail', prod.productId]);
      } else if (result === 'add-to-cart') {
        this.addToCart(prod);
      }
    });
  }

  filterByLocation(): void {
    if (!this.filterDistrict || !this.filterState) {
      alert('Please enter both district and state.');
      return;
    }
    this.prod_service.getProductsByLocation(this.filterDistrict, this.filterState).subscribe(
      (response: Product[]) => {
        this.products = response;
        this.searchResultText = `${this.filterDistrict}, ${this.filterState}`;
        (this.products || []).forEach(prod => {
          this.loadImage(prod.productId!);
        });
      },
      (error: any) => {
        alert(error);
      }
    );
  }

  filterByState(): void {
    if (!this.filterState) {
      alert('Please enter a state.');
      return;
    }
    this.prod_service.getProductsByState(this.filterState).subscribe(
      (response: Product[]) => {
        this.products = response;
        this.searchResultText = `${this.filterState}`;
        (this.products || []).forEach(prod => {
          this.loadImage(prod.productId!);
        });
      },
      (error: any) => {
        alert(error);
      }
    );
  }

  filterGiTagged(): void {
    this.isGiFilterActive = !this.isGiFilterActive;
    
    if (!this.isGiFilterActive) {
      // If toggled off, show all products
      this.showAllCategory(1);
      return;
    }
    
    // If location filters are set, filter GI-tagged by location; else, show all GI-tagged
    if (this.filterDistrict && this.filterState) {
      this.prod_service.getGiTaggedProductsByLocation(this.filterDistrict, this.filterState).subscribe(
        (response: Product[]) => {
          this.products = response;
          this.searchResultText = `GI Certified in ${this.filterDistrict}, ${this.filterState}`;
          (this.products || []).forEach(prod => {
            this.loadImage(prod.productId!);
          });
        },
        (error: any) => {
          alert(error);
        }
      );
    } else if (this.filterState) {
      this.prod_service.getGiTaggedProductsByState(this.filterState).subscribe(
        (response: Product[]) => {
          this.products = response;
          this.searchResultText = `GI Certified in ${this.filterState}`;
          (this.products || []).forEach(prod => {
            this.loadImage(prod.productId!);
          });
        },
        (error: any) => {
          alert(error);
        }
      );
    } else {
      this.prod_service.getGiTaggedProducts().subscribe(
        (response: Product[]) => {
          this.products = response;
          this.searchResultText = 'GI Certified Products';
          (this.products || []).forEach(prod => {
            this.loadImage(prod.productId!);
          });
        },
        (error: any) => {
          alert(error);
        }
      );
    }
  }

  showCategory(cat: ProductCategory): void {
    this.searchResultText = cat.categoryName || '';
    this.selectedCategory = cat.categoryName || '';
    this.isGiFilterActive = false;
    this.prod_service.getProductByCategoryId(cat.prodCategoryID).subscribe(
      (response: Product[]) => {
        this.products = response;
        (this.products || []).forEach(prod => {
          this.loadImage(prod.productId!);
        });
      },
      (error: any) => {
        alert(error);
      }
    );
  }

  showAllCategory(n: number): void {
    this.selectedCategory = 'all';
    this.isGiFilterActive = false;
    if (n === 0) {
      this.searchResultText = "All";
    }
    this.prod_service.getAllProducts().subscribe(
      (response: Product[]) => {
        this.products = response;
        this.totalProducts = response.length;
        (this.products || []).forEach(prod => {
          this.loadImage(prod.productId!);
        });
      },
      (error: any) => {
        alert(error);
      }
    );
  }

  loadImage(productId: string) {
    this.prod_service.getImage(productId).subscribe(blob => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const product = this.products?.find(p => p.productId === productId);
        if (product) {
          product.productImageURL = reader.result as string;
        }
      };
      reader.readAsDataURL(blob);
    });
  }

  navigateToProduct(prod: Product) {
    if (prod.productId) {
      this.router.navigate(['product_detail', prod.productId]);
    }
  }

  // Add to cart with proper backend integration and animations
  addToCart(prod: Product | null | undefined): void {
    if (!prod?.productId) return;
    
    const productId = prod.productId;
    
    // Check if user is logged in as customer
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
      vendorId: prod.vendorId,
      customerId: this.userState.customer.customerId,
      quantity: 1,
      approval: false
    };
    
    // Call backend service
    this.cart_service.registerCart(cartItem)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.cartLoading.delete(productId);
          this.addedToCart.add(productId);
          
          // Update cart count in user state
          const currentCartItems = this.userState.customer?.cartProductIds || [];
          if (!currentCartItems.includes(productId)) {
            this.userState.broadcastCartUpdate([...currentCartItems, productId]);
          }
          
          // Show success snackbar
          const snackRef = this.snackBar.open('Added to cart!', 'View Cart', { 
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          });
          
          snackRef.onAction().subscribe(() => {
            this.router.navigate(['/cart']);
          });
          
          // Reset "added" state after animation
          setTimeout(() => {
            this.addedToCart.delete(productId);
          }, 2000);
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

  // Check if product is being added to cart
  isCartLoading(productId: string | undefined): boolean {
    return productId ? this.cartLoading.has(productId) : false;
  }

  // Check if product was just added to cart
  isAddedToCart(productId: string | undefined): boolean {
    return productId ? this.addedToCart.has(productId) : false;
  }

  // Check if product is already in cart
  isInCart(productId: string | undefined): boolean {
    if (!productId || !this.userState.customer) return false;
    return this.userState.customer.cartProductIds?.includes(productId) || false;
  }

  // Add to compare
  addToCompare(prod: Product): void {
    if (!prod.productId) return;
    
    if (this.compareService.isInCompare(prod.productId)) {
      this.compareService.removeFromCompare(prod.productId);
      this.snackBar.open('Removed from compare', 'Close', { duration: 2000 });
    } else {
      const added = this.compareService.addToCompare(prod);
      if (added) {
        const snackRef = this.snackBar.open('Added to compare!', 'Compare Now', { 
          duration: 3000 
        });
        snackRef.onAction().subscribe(() => {
          this.router.navigate(['/compare']);
        });
      } else {
        this.snackBar.open('Compare list is full (max 4 products)', 'Close', { duration: 3000 });
      }
    }
  }

  // Check if product is in compare
  isInCompare(productId: string | undefined): boolean {
    return productId ? this.compareService.isInCompare(productId) : false;
  }

  // Share product
  shareProduct(prod: Product, event: Event): void {
    event.stopPropagation();
    
    const productUrl = `${window.location.origin}/product_detail/${prod.productId}`;
    const shareText = `Check out ${prod.productName} on ODOP India!`;
    
    if (navigator.share) {
      navigator.share({
        title: prod.productName,
        text: shareText,
        url: productUrl
      }).catch(() => {
        this.copyToClipboard(productUrl);
      });
    } else {
      this.copyToClipboard(productUrl);
    }
  }

  private copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
    });
  }
}