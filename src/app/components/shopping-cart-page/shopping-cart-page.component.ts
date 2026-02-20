import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartServiceService } from 'src/app/project/services/cart-service.service';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { Cart } from 'src/app/project/models/cart';
import { ProductServiceService } from 'src/app/project/services/product-service.service';

interface CartItemDisplay {
  cart: Cart;
  productName: string;
  productPrice: number;
  productImage: string;
  quantity: number;
  vendorName: string;
  productId: string;
  isUpdating: boolean;
}

@Component({
  selector: 'app-shopping-cart-page',
  templateUrl: './shopping-cart-page.component.html',
  styleUrls: ['./shopping-cart-page.component.css']
})
export class ShoppingCartPageComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  cartItems: CartItemDisplay[] = [];
  isLoading = true;
  isEmpty = false;

  // Summary
  subtotal = 0;
  shippingCost = 0;
  taxAmount = 0;
  totalAmount = 0;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private cartService: CartServiceService,
    private userState: UserStateService,
    private productService: ProductServiceService
  ) { }

  ngOnInit(): void {
    this.loadCartItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCartItems(): void {
    const customerId = this.userState.customer?.customerId;

    if (!customerId) {
      this.isLoading = false;
      this.isEmpty = true;
      return;
    }

    this.cartService.getCartByIdCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (carts: Cart[]) => {
          this.cartItems = carts.map(cart => this.mapCartToDisplayItem(cart));
          this.isEmpty = this.cartItems.length === 0;
          this.calculateTotals();

          const missingProductIds = this.cartItems
            .filter(item =>
              item.productId &&
              (item.productPrice <= 0 || item.productName === '' || item.vendorName === '')
            )
            .map(item => item.productId);

          if (missingProductIds.length === 0) {
            this.isLoading = false;
            return;
          }

          this.productService.getProductsByIds(Array.from(new Set(missingProductIds)))
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (products: any[]) => {
                const byId = new Map(products.map(product => [product.productId || product.id, product]));

                this.cartItems = this.cartItems.map(item => {
                  const product = byId.get(item.productId);
                  if (!product) {
                    return item;
                  }

                  const vendorInfo = product.vendorId;
                  const vendorName = product.vendorName || (typeof vendorInfo === 'object' ? vendorInfo?.shopName : '');

                  return {
                    ...item,
                    productName: product.productName || product.name || item.productName,
                    productPrice: product.price ?? item.productPrice,
                    productImage: product.productImageURL || product.productImage || item.productImage,
                    vendorName: vendorName || item.vendorName
                  };
                });

                this.calculateTotals();
                this.isLoading = false;
              },
              error: () => {
                this.isLoading = false;
              }
            });
        },
        error: () => {
          this.snackBar.open('Failed to load cart items', 'Close', { duration: 3000 });
          this.isLoading = false;
          this.isEmpty = true;
        }
      });
  }

  private mapCartToDisplayItem(cart: Cart): CartItemDisplay {
    const product = this.extractProductFromCart(cart);
    const vendorInfo = product?.vendorId;
    const vendorName = product?.vendorName || (typeof vendorInfo === 'object' ? vendorInfo?.shopName : '');
    const productId = this.extractProductId(cart);

    return {
      cart,
      productName: product?.productName || product?.name || '',
      productPrice: product?.price ?? product?.productPrice ?? 0,
      productImage: product?.productImageURL || product?.productImage || 'assets/images/product-placeholder.svg',
      quantity: (cart as any).quantity || 1,
      vendorName: vendorName || '',
      productId,
      isUpdating: false
    };
  }

  private extractProductFromCart(cart: Cart): any {
    if ((cart as any).product) {
      return (cart as any).product;
    }
    if (cart.productId && typeof cart.productId === 'object') {
      return cart.productId;
    }
    return null;
  }

  private extractProductId(cart: Cart): string {
    if (typeof cart.productId === 'string') {
      return cart.productId;
    }
    if (cart.productId && typeof cart.productId === 'object') {
      return (cart.productId as any).productId || '';
    }
    return '';
  }

  private calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((sum, item) =>
      sum + (item.productPrice * item.quantity), 0);

    // Free shipping for orders above ₹500
    this.shippingCost = this.subtotal >= 500 ? 0 : 50;

    // 18% GST
    this.taxAmount = Math.round(this.subtotal * 0.18);

    this.totalAmount = this.subtotal + this.shippingCost + this.taxAmount;
  }

  updateQuantity(item: CartItemDisplay, change: number): void {
    const newQuantity = item.quantity + change;

    if (newQuantity < 1) {
      this.removeItem(item);
      return;
    }

    if (newQuantity > 10) {
      this.snackBar.open('Maximum quantity is 10', 'Close', { duration: 2000 });
      return;
    }

    item.isUpdating = true;
    item.quantity = newQuantity;

    // Update in backend
    const updatedCart: Cart = {
      ...item.cart,
      quantity: newQuantity
    };

    this.cartService.registerCart(updatedCart)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.calculateTotals();
          item.isUpdating = false;
        },
        error: () => {
          // Revert on error
          item.quantity = item.quantity - change;
          item.isUpdating = false;
          this.snackBar.open('Failed to update quantity', 'Close', { duration: 2000 });
        }
      });
  }

  removeItem(item: CartItemDisplay): void {
    if (!item.cart.cartId) return;

    item.isUpdating = true;

    this.cartService.deleteCartById(item.cart.cartId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cartItems = this.cartItems.filter(i => i !== item);
          this.isEmpty = this.cartItems.length === 0;
          this.calculateTotals();

          // Update user state cart count
          const remainingProductIds = this.cartItems.map(i => i.productId).filter(id => id);
          this.userState.broadcastCartUpdate(remainingProductIds);

          this.snackBar.open('Item removed from cart', 'Close', { duration: 2000 });
        },
        error: () => {
          item.isUpdating = false;
          this.snackBar.open('Failed to remove item', 'Close', { duration: 2000 });
        }
      });
  }

  clearCart(): void {
    if (this.cartItems.length === 0) return;

    const deleteObservables = this.cartItems
      .filter(item => item.cart.cartId)
      .map(item => this.cartService.deleteCartById(item.cart.cartId!));

    if (deleteObservables.length === 0) {
      this.cartItems = [];
      this.isEmpty = true;
      this.calculateTotals();
      this.userState.broadcastCartUpdate([]);
      this.snackBar.open('Cart cleared', 'Close', { duration: 2000 });
      return;
    }

    let completed = 0;
    let hasError = false;
    deleteObservables.forEach(obs => {
      obs.pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          completed++;
          if (completed === deleteObservables.length) {
            this.cartItems = [];
            this.isEmpty = true;
            this.calculateTotals();
            this.userState.broadcastCartUpdate([]);
            this.snackBar.open(hasError ? 'Cart cleared with some issues' : 'Cart cleared', 'Close', { duration: 2000 });
          }
        },
        error: () => {
          hasError = true;
          completed++;
          if (completed === deleteObservables.length) {
            this.cartItems = [];
            this.isEmpty = true;
            this.calculateTotals();
            this.userState.broadcastCartUpdate([]);
            this.snackBar.open('Cart cleared with some issues', 'Close', { duration: 2000 });
          }
        }
      });
    });
  }

  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice(): number {
    return this.totalAmount;
  }

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      this.snackBar.open('Your cart is empty', 'Close', { duration: 2000 });
      return;
    }

    if (!this.userState.customer) {
      this.snackBar.open('Please login to proceed', 'Login', { duration: 3000 })
        .onAction().subscribe(() => {
          // Open login dialog or navigate to login
        });
      return;
    }

    this.router.navigate(['/checkout']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  viewProduct(productId: string): void {
    this.router.navigate(['/product_detail', productId]);
  }
}
