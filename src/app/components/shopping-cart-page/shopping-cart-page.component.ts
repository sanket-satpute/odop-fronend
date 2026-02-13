import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartServiceService } from 'src/app/project/services/cart-service.service';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { Cart } from 'src/app/project/models/cart';

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
    private userState: UserStateService
  ) {}

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
          this.cartItems = carts.map(cart => {
            const product: any = (cart as any).productId || {};
            return {
              cart,
              productName: product.productName || 'Product',
              productPrice: product.productPrice || 0,
              productImage: product.product_main_image || 'assets/images/product-placeholder.svg',
              quantity: (cart as any).quantity || 1,
              vendorName: product.vendorId?.shopName || 'Vendor',
              productId: product.productId || '',
              isUpdating: false
            };
          });
          this.isEmpty = this.cartItems.length === 0;
          this.calculateTotals();
          this.isLoading = false;
        },
        error: () => {
          this.snackBar.open('Failed to load cart items', 'Close', { duration: 3000 });
          this.isLoading = false;
          this.isEmpty = true;
        }
      });
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
    
    const deletePromises = this.cartItems
      .filter(item => item.cart.cartId)
      .map(item => this.cartService.deleteCartById(item.cart.cartId!).toPromise());
    
    Promise.all(deletePromises)
      .then(() => {
        this.cartItems = [];
        this.isEmpty = true;
        this.calculateTotals();
        
        // Update user state cart count
        this.userState.broadcastCartUpdate([]);
        
        this.snackBar.open('Cart cleared', 'Close', { duration: 2000 });
      })
      .catch(() => {
        this.snackBar.open('Failed to clear cart', 'Close', { duration: 2000 });
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

