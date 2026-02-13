import { Component, OnInit, OnDestroy, HostListener, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { ProductServiceService } from '../../../project/services/product-service.service';
import { UserStateService } from '../../../project/services/user-state.service';
import { CartServiceService } from '../../../project/services/cart-service.service';
import { Cart } from '../../../project/models/cart';
import { WishlistService } from '../../../project/services/wishlist.service';

export interface CartItem {
  id: string;
  cartId?: string;
  name: string;
  vendor: string;
  vendorId?: string;
  image: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  quantity: number;
  inStock: boolean;
  category: string;
}

@Component({
  selector: 'app-cart-dialog',
  templateUrl: './cart-dialog.component.html',
  styleUrls: ['./cart-dialog.component.css'],
  animations: [
    trigger('dialogAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'translateY(10px)' }))
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
          style({ opacity: 0, transform: 'translateY(15px)' }),
          stagger(40, [
            animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms 100ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class CartDialogComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  backendCarts: Cart[] = [];
  wishlistProductIds = new Set<string>();
  isLoading: boolean = false;
  isRemoving: { [key: string]: boolean } = {};
  destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<CartDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private router: Router,
    private productService: ProductServiceService,
    private userState: UserStateService,
    private cartService: CartServiceService,
    private wishlistService: WishlistService
  ) {
    this.cartItems = [];
  }

  ngOnInit(): void {
    this.loadWishlistState();
    this.loadCartItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadWishlistState(): void {
    this.wishlistService.loadWishlist()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const ids = response.items.map(item => item.productId).filter(id => !!id);
          this.wishlistProductIds = new Set(ids);

          if (this.userState.customer) {
            this.userState.broadcastWishlistUpdate(Array.from(this.wishlistProductIds));
          }
        },
        error: () => {
          this.wishlistProductIds = new Set(this.userState.customer?.wishlistProductIds || []);
        }
      });
  }

  @HostListener('keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeDialog();
    }
  }

  private loadCartItems(): void {
    this.isLoading = true;
    const customerId = this.userState.customer?.customerId;

    if (!customerId) {
      this.cartItems = [];
      this.isLoading = false;
      return;
    }

    // Load cart from backend using CartServiceService
    this.cartService.getCartByIdCustomer(customerId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (carts: Cart[]) => {
          this.backendCarts = carts;
          if (carts.length === 0) {
            this.cartItems = [];
            return;
          }

          // Map backend cart data to CartItem interface
          this.cartItems = carts.map(cart => this.mapCartToCartItem(cart)).filter(item => item !== null) as CartItem[];

          // If cart items have product IDs, fetch full product details
          const productIds = carts.map(c => (typeof c.productId === 'string' ? c.productId : (c.productId as any)?.productId)).filter(id => id);
          if (productIds.length > 0) {
            this.enrichCartWithProductDetails(productIds);
          }
        },
        error: (error) => {
          console.error('Error loading cart from backend:', error);
          this.cartItems = [];
          this.showToast('Failed to load cart', 'error');
        }
      });
  }

  private mapCartToCartItem(cart: Cart): CartItem | null {
    const productId = (typeof cart.productId === 'string' ? cart.productId : (cart.productId as any)?.productId);
    if (!productId) return null;

    return {
      id: productId,
      cartId: cart.cartId,
      name: 'Loading...',
      vendor: 'Loading...',
      vendorId: cart.vendorId,
      image: 'assets/images/product-placeholder.svg',
      price: 0,
      originalPrice: 0,
      discountPercent: 0,
      quantity: cart.quantity || 1,
      inStock: true,
      category: 'General'
    };
  }

  private enrichCartWithProductDetails(productIds: string[]): void {
    this.productService.getProductsByIds(productIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products: any[]) => {
          this.cartItems = this.cartItems.map(item => {
            const product = products.find(p => (p.productId || p.id) === item.id);
            if (product) {
              return {
                ...item,
                name: product.productName || product.name || 'Unknown Product',
                vendor: product.vendorName || product.vendor || 'Unknown Vendor',
                image: product.productImage || product.image || item.image,
                price: product.price || 0,
                originalPrice: product.originalPrice || product.price || 0,
                discountPercent: product.discountPercent || 0,
                inStock: product.stockQuantity > 0 || product.inStock !== false,
                category: product.category || 'General'
              };
            }
            return item;
          });
        },
        error: (error) => {
          console.error('Error enriching cart with product details:', error);
        }
      });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  updateQuantity(item: CartItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) {
      this.removeItem(item);
      return;
    }
    
    item.quantity = newQuantity;

    // Update backend cart if cartId exists
    if (item.cartId) {
      const cart = this.backendCarts.find(c => c.cartId === item.cartId);
      if (cart) {
        cart.quantity = newQuantity;
        this.cartService.registerCart(cart)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => this.showToast('Quantity updated', 'success'),
            error: () => this.showToast('Failed to update quantity', 'error')
          });
      }
    } else {
      this.showToast('Quantity updated', 'success');
    }
  }

  removeItem(item: CartItem): void {
    if (!confirm('Remove this item from cart?')) return;

    if (item.cartId) {
      this.isRemoving[item.id] = true;
      this.cartService.deleteCartById(item.cartId)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isRemoving[item.id] = false)
        )
        .subscribe({
          next: (success) => {
            if (success) {
              this.cartItems = this.cartItems.filter(i => i.id !== item.id);
              this.backendCarts = this.backendCarts.filter(c => c.cartId !== item.cartId);
              
              // Update user state cart count
              const remainingProductIds = this.cartItems.map(i => i.id).filter(id => id);
              this.userState.broadcastCartUpdate(remainingProductIds);
              
              this.showToast('Item removed from cart', 'info');
            }
          },
          error: (error) => {
            console.error('Error removing cart item:', error);
            this.showToast('Failed to remove item', 'error');
          }
        });
    } else {
      this.cartItems = this.cartItems.filter(i => i.id !== item.id);
      this.showToast('Item removed from cart', 'info');
    }
  }

  moveToWishlist(item: CartItem): void {
    const productId = item.id;
    if (!productId) {
      return;
    }

    if (this.isInWishlist(productId)) {
      this.wishlistService.removeFromWishlist(productId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (!response.success) {
              this.showToast(response.message || 'Failed to remove from wishlist', 'error');
              return;
            }

            this.wishlistProductIds.delete(productId);
            this.userState.broadcastWishlistUpdate(Array.from(this.wishlistProductIds));
            this.showToast('Removed from wishlist', 'info');
          },
          error: () => this.showToast('Failed to remove from wishlist', 'error')
        });
      return;
    }

    this.wishlistService.addToWishlist(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.showToast(response.message || 'Failed to add to wishlist', 'error');
            return;
          }

          this.wishlistProductIds.add(productId);
          this.userState.broadcastWishlistUpdate(Array.from(this.wishlistProductIds));
          this.showToast('Added to wishlist', 'success');
        },
        error: () => this.showToast('Failed to add to wishlist', 'error')
      });
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistProductIds.has(productId);
  }

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      this.showToast('Your cart is empty', 'warning');
      return;
    }
    this.closeDialog();
    this.router.navigate(['/checkout']);
  }

  continueShopping(): void {
    this.closeDialog();
    this.router.navigate(['/products']);
  }

  private showToast(message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`${type}-snackbar`]
    });
  }

  get totalItems(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get totalSavings(): number {
    return this.cartItems.reduce((sum, item) =>
      sum + ((item.originalPrice - item.price) * item.quantity), 0);
  }

  trackByItemId(index: number, item: CartItem): string {
    return item.id;
  }
}

