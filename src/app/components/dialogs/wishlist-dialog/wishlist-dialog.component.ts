import { Component, OnInit, OnDestroy, HostListener, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { UserStateService } from '../../../project/services/user-state.service';
import { WishlistService, WishlistItemDto } from '../../../project/services/wishlist.service';
import { CartServiceService } from '../../../project/services/cart-service.service';

export interface WishlistItem {
  id: string;
  name: string;
  vendor: string;
  vendorId?: string;
  image: string;
  currentPrice: number;
  originalPrice: number;
  discountPercent: number;
  inStock: boolean;
  dateAdded: Date;
  category: string;
}

@Component({
  selector: 'app-wishlist-dialog',
  templateUrl: './wishlist-dialog.component.html',
  styleUrls: ['./wishlist-dialog.component.css'],
  animations: [
    trigger('dialogAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'scale(0.98)' }))
      ])
    ]),
    trigger('overlayAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0 }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(30, [
            animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class WishlistDialogComponent implements OnInit, OnDestroy {
  wishlistItems: WishlistItem[] = [];
  filteredItems: WishlistItem[] = [];
  searchQuery: string = '';
  selectedFilter: string = 'all';
  isLoading: boolean = false;
  destroy$ = new Subject<void>();
  private cartProductIds = new Set<string>();

  constructor(
    public dialogRef: MatDialogRef<WishlistDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private router: Router,
    private userState: UserStateService,
    private wishlistService: WishlistService,
    private cartService: CartServiceService
  ) {
    // Initialize with empty arrays - will be loaded from service
    this.wishlistItems = [];
    this.filteredItems = [];
  }

  ngOnInit(): void {
    this.loadCartState();

    // Load wishlist items from service
    this.loadWishlistItems();
    
    // Add entrance animation delay - reduced for faster UI
    setTimeout(() => {
      const dialog = document.querySelector('.wishlist-dialog');
      if (dialog) {
        dialog.classList.add('loaded');
      }
    }, 50);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Keyboard event handling
  @HostListener('keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeDialog();
    } else if (event.key === 'Enter') {
      const target = event.target as HTMLElement;
      if (target && target.classList.contains('search-input')) {
        this.filterItems();
      }
    }
  }

  // Data loading - fetch real wishlist data from backend
  private loadWishlistItems(): void {
    this.isLoading = true;
    
    // Use WishlistService to load items from backend (uses JWT for auth)
    this.wishlistService.loadWishlist()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.wishlistItems = response.items.map(item => this.mapWishlistItemDto(item));
          this.filteredItems = [...this.wishlistItems];
        },
        error: (error) => {
          console.error('Error loading wishlist:', error);
          this.wishlistItems = [];
          this.filteredItems = [];
          this.showToast('Failed to load wishlist', 'error');
        }
      });
  }

  // Map backend DTO to local interface
  private mapWishlistItemDto(item: WishlistItemDto): WishlistItem {
    const effectivePrice = item.discountedPrice ?? item.productPrice ?? item.price ?? 0;
    const basePrice = item.productPrice ?? item.price ?? effectivePrice;

    return {
      id: item.productId,
      name: item.productName || 'Unknown Product',
      vendor: item.vendorName || 'Unknown Vendor',
      vendorId: item.vendorId,
      image: item.productImageURL || item.productImage || 'assets/images/product-placeholder.svg',
      currentPrice: effectivePrice,
      originalPrice: basePrice,
      discountPercent: basePrice > effectivePrice ? Math.round(((basePrice - effectivePrice) / basePrice) * 100) : 0,
      inStock: item.inStock !== false,
      dateAdded: item.addedAt ? new Date(item.addedAt) : new Date(),
      category: item.category || 'General'
    };
  }

  private loadCartState(): void {
    const customerId = this.userState.customer?.customerId;
    if (!customerId) {
      this.cartProductIds.clear();
      return;
    }

    this.cartService.getCartByIdCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cartItems) => {
          const ids = (cartItems || [])
            .map(item => {
              if (typeof item.productId === 'string') {
                return item.productId;
              }
              return item.productId?.productId;
            })
            .filter((id): id is string => !!id);

          this.cartProductIds = new Set(ids);

          if (this.userState.customer) {
            this.userState.broadcastCartUpdate(Array.from(this.cartProductIds));
          }
        },
        error: () => {
          this.cartProductIds = new Set(this.userState.customer?.cartProductIds || []);
        }
      });
  }

  // Filtering and search
  filterItems(): void {
    let filtered = [...this.wishlistItems];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.vendor.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    // Apply dropdown filter
    switch (this.selectedFilter) {
      case 'in-stock':
        filtered = filtered.filter(item => item.inStock);
        break;
      case 'discounted':
        filtered = filtered.filter(item => item.discountPercent > 0);
        break;
      case 'recent':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(item => item.dateAdded >= thirtyDaysAgo);
        break;
      case 'all':
      default:
        // No additional filtering needed
        break;
    }

    this.filteredItems = filtered;
  }

  // TrackBy function for ngFor performance
  trackByItemId(index: number, item: WishlistItem): string {
    return item.id;
  }

  // Dialog actions
  closeDialog(): void {
    this.dialogRef.close();
  }

  startShopping(): void {
    // Navigate to products page
    this.closeDialog();
    this.router.navigate(['/products']);
  }

  continueShopping(): void {
    this.closeDialog();
    this.router.navigate(['/products']);
  }

  // Item actions
  moveToCart(item: WishlistItem): void {
    if (!item.inStock) {
      this.showToast('This item is currently out of stock', 'warning');
      return;
    }

    if (this.isInCart(item.id)) {
      this.showToast('Already added to cart', 'info');
      return;
    }

    const customerId = this.userState.customer?.customerId;
    if (!customerId) {
      this.showToast('Please login to add items to cart', 'warning');
      return;
    }

    const cartItem = {
      productId: item.id,
      customerId,
      vendorId: item.vendorId,
      quantity: 1,
      approval: false
    };
    
    this.cartService.registerCart(cartItem)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cartProductIds.add(item.id);

          if (this.userState.customer) {
            const existing = this.userState.customer.cartProductIds || [];
            if (!existing.includes(item.id)) {
              this.userState.broadcastCartUpdate([...existing, item.id]);
            }
          }

          this.showToast(`${item.name} added to cart!`, 'success');
        },
        error: () => {
          this.showToast('Failed to add item to cart', 'error');
        }
      });
  }

  removeItem(itemId: string): void {
    // Show confirmation dialog first
    if (confirm('Are you sure you want to remove this item from your wishlist?')) {
      // Add remove animation
      const itemElement = document.querySelector(`[data-item-id="${itemId}"]`) as HTMLElement;
      if (itemElement) {
        itemElement.style.animation = 'slideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      }
      
      // Call WishlistService to remove from backend
      this.wishlistService.removeFromWishlist(itemId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              setTimeout(() => {
                // Remove from local arrays after animation
                this.wishlistItems = this.wishlistItems.filter(item => item.id !== itemId);
                this.filteredItems = this.filteredItems.filter(item => item.id !== itemId);

                if (this.userState.customer) {
                  const current = this.userState.customer.wishlistProductIds || [];
                  this.userState.broadcastWishlistUpdate(current.filter(id => id !== itemId));
                }

                this.showToast('Item removed from wishlist', 'info');
              }, itemElement ? 300 : 0);
            } else {
              this.showToast(response.message || 'Failed to remove item', 'error');
            }
          },
          error: (error) => {
            console.error('Error removing from wishlist:', error);
            this.showToast('Failed to remove item from wishlist', 'error');
            // Reset animation if failed
            if (itemElement) {
              itemElement.style.animation = '';
            }
          }
        });
    }
  }

  viewDetails(item: WishlistItem): void {
    // Navigate to product details page
    this.closeDialog();
    this.router.navigate(['/product_detail', item.id]);
  }

  // Utility methods
  private showToast(message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info'): void {
    const config = {
      duration: 3000,
      horizontalPosition: 'end' as const,
      verticalPosition: 'top' as const,
      panelClass: [`${type}-snackbar`]
    };
    
    this.snackBar.open(message, 'Close', config);
  }

  // Getter methods for template
  get hasItems(): boolean {
    return this.wishlistItems.length > 0;
  }

  get hasFilteredItems(): boolean {
    return this.filteredItems.length > 0;
  }

  get totalItems(): number {
    return this.wishlistItems.length;
  }

  get inStockCount(): number {
    return this.wishlistItems.filter(item => item.inStock).length;
  }

  get discountedCount(): number {
    return this.wishlistItems.filter(item => item.discountPercent > 0).length;
  }

  isInCart(productId: string): boolean {
    return this.cartProductIds.has(productId);
  }

  // Animation and interaction helpers
  onItemHover(event: MouseEvent, entering: boolean): void {
    const item = event.currentTarget as HTMLElement;
    if (entering) {
      item.style.transform = 'translateY(-4px)';
    } else {
      item.style.transform = 'translateY(0)';
    }
  }

  onButtonClick(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    
    // Add click animation
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = '';
    }, 150);
  }

  // Performance optimization
  shouldShowLoadMore(): boolean {
    // Logic to determine if "Load More" should be shown
    return this.filteredItems.length >= 20 && this.filteredItems.length < this.wishlistItems.length;
  }

  loadMoreItems(): void {
    // Logic to load more items if pagination is implemented
  }
}
