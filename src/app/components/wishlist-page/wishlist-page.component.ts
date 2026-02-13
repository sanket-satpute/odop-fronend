import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WishlistService, WishlistItemDto } from '../../project/services/wishlist.service';
import { DataHandlerService } from '../../project/services/data-handler.service';

export interface WishlistItem {
  id: string;
  name: string;
  vendor: string;
  vendorId?: string;
  image: string;
  price: number;
  inStock: boolean;
  dateAdded: Date;
  category: string;
}

@Component({
  selector: 'app-wishlist-page',
  templateUrl: './wishlist-page.component.html',
  styleUrls: ['./wishlist-page.component.css']
})
export class WishlistPageComponent implements OnInit, OnDestroy {
  wishlistItems: WishlistItem[] = [];
  filteredItems: WishlistItem[] = [];
  searchQuery: string = '';
  selectedFilter: string = 'all';
  sortBy: string = 'date-desc';
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private wishlistService: WishlistService,
    private dataHandler: DataHandlerService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWishlist(): void {
    this.isLoading = true;
    this.wishlistService.loadWishlist()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.wishlistItems = response.items.map(item => this.mapItem(item));
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error loading wishlist:', error);
          this.showSnackbar('Failed to load wishlist. Please try again.', 'error');
        }
      });
  }

  private mapItem(item: WishlistItemDto): WishlistItem {
    const effectivePrice = item.discountedPrice ?? item.productPrice ?? item.price ?? 0;

    return {
      id: item.productId,
      name: item.productName || 'Unknown Product',
      vendor: item.vendorName || 'Unknown Vendor',
      vendorId: item.vendorId,
      image: item.productImageURL || item.productImage || 'assets/images/placeholder-product.jpg',
      price: effectivePrice,
      inStock: item.inStock !== false,
      dateAdded: item.addedAt ? new Date(item.addedAt) : new Date(),
      category: item.category || 'General'
    };
  }

  applyFilters(): void {
    let filtered = [...this.wishlistItems];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.vendor.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    switch (this.selectedFilter) {
      case 'in-stock':
        filtered = filtered.filter(item => item.inStock);
        break;
      case 'out-of-stock':
        filtered = filtered.filter(item => !item.inStock);
        break;
    }

    // Sorting
    switch (this.sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
        break;
      case 'date-asc':
        filtered.sort((a, b) => a.dateAdded.getTime() - b.dateAdded.getTime());
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    this.filteredItems = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  viewProduct(productId: string): void {
    this.router.navigate(['/product_detail', productId]);
  }

  addToCart(item: WishlistItem, event: Event): void {
    event.stopPropagation();
    
    if (!item.inStock) {
      this.showSnackbar('This item is currently out of stock', 'warning');
      return;
    }

    const cartItem = {
      productId: item.id,
      productName: item.name,
      price: item.price,
      quantity: 1,
      image: item.image
    };

    this.dataHandler.addToCart(cartItem);
    this.showSnackbar(`${item.name} added to cart!`, 'success');
  }

  removeFromWishlist(item: WishlistItem, event: Event): void {
    event.stopPropagation();
    
    this.wishlistService.removeFromWishlist(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.wishlistItems = this.wishlistItems.filter(i => i.id !== item.id);
            this.applyFilters();
            this.showSnackbar('Item removed from wishlist', 'info');
          }
        },
        error: () => {
          this.showSnackbar('Failed to remove item', 'error');
        }
      });
  }

  clearWishlist(): void {
    if (confirm('Are you sure you want to clear your entire wishlist?')) {
      this.wishlistService.clearWishlist()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.wishlistItems = [];
              this.filteredItems = [];
              this.showSnackbar('Wishlist cleared', 'info');
            }
          },
          error: () => {
            this.showSnackbar('Failed to clear wishlist', 'error');
          }
        });
    }
  }

  addAllToCart(): void {
    const inStockItems = this.filteredItems.filter(item => item.inStock);
    
    if (inStockItems.length === 0) {
      this.showSnackbar('No items in stock to add to cart', 'warning');
      return;
    }

    inStockItems.forEach(item => {
      const cartItem = {
        productId: item.id,
        productName: item.name,
        price: item.price,
        quantity: 1,
        image: item.image
      };
      this.dataHandler.addToCart(cartItem);
    });

    this.showSnackbar(`${inStockItems.length} items added to cart!`, 'success');
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`${type}-snackbar`]
    });
  }

  get totalItems(): number {
    return this.wishlistItems.length;
  }

  get inStockCount(): number {
    return this.wishlistItems.filter(item => item.inStock).length;
  }

  trackByItemId(index: number, item: WishlistItem): string {
    return item.id;
  }
}
