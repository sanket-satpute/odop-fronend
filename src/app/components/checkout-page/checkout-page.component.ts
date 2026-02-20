import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartServiceService } from 'src/app/project/services/cart-service.service';
import { OrderService } from 'src/app/project/services/order.service';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { PaymentService, PaymentRequest, PaymentVerification } from 'src/app/project/services/payment.service';
import { CouponService, ApplyCouponRequest, CouponValidationResponse } from 'src/app/project/services/coupon.service';
import { ProductServiceService } from 'src/app/project/services/product-service.service';
import { Cart } from 'src/app/project/models/cart';
import { Product } from 'src/app/project/models/product';
import { Order } from 'src/app/project/models/order';
import { LoadingService } from 'src/app/project/services/loading.service';
import { EmailService, OrderConfirmationRequest, PaymentSuccessRequest, OrderItem } from 'src/app/project/services/email.service';

interface CartItem {
  cart: Cart;
  productName: string;
  productPrice: number;
  productImage: string;
  quantity: number;
  vendorName: string;
  productId?: string;
  vendorId?: string;
}

// Checkout mode: cart = from shopping cart, buyNow = direct product purchase
type CheckoutMode = 'cart' | 'buyNow';

@Component({
  selector: 'app-checkout-page',
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.css']
})
export class CheckoutPageComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  
  // Checkout mode
  checkoutMode: CheckoutMode = 'cart';
  buyNowProductId: string | null = null;
  buyNowQuantity: number = 1;
  
  // Form groups
  shippingForm: FormGroup;
  paymentForm: FormGroup;
  
  // Cart data
  cartItems: CartItem[] = [];
  isLoadingCart = true;
  
  // Order summary
  subtotal = 0;
  shippingCost = 0;
  taxAmount = 0;
  discount = 0;
  totalAmount = 0;
  
  // Coupon
  couponCode = '';
  couponApplied = false;
  couponError = '';
  couponValidation: CouponValidationResponse | null = null;
  isValidatingCoupon = false;
  
  // Stepper
  currentStep = 0;
  steps = ['Shipping', 'Payment', 'Review'];
  
  // Payment methods
  paymentMethods = [
    { value: 'razorpay', label: 'Pay Online (Card/UPI/Netbanking)', icon: 'credit_card' },
    { value: 'cod', label: 'Cash on Delivery', icon: 'local_shipping' }
  ];
  
  // Processing state
  isProcessing = false;
  paymentStatus = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cartService: CartServiceService,
    private orderService: OrderService,
    private userState: UserStateService,
    private loadingService: LoadingService,
    private paymentService: PaymentService,
    private couponService: CouponService,
    private emailService: EmailService,
    private productService: ProductServiceService
  ) {
    this.shippingForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pinCode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      country: ['India', Validators.required],
      saveAddress: [false]
    });
    
    this.paymentForm = this.fb.group({
      paymentMethod: ['razorpay', Validators.required],
      savePayment: [false]
    });
  }

  ngOnInit(): void {
    this.checkAuthentication();
    this.prefillUserData();
    
    // Check for buyNow query parameters
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['buyNow']) {
        this.checkoutMode = 'buyNow';
        this.buyNowProductId = params['buyNow'];
        this.buyNowQuantity = parseInt(params['qty'], 10) || 1;
        this.loadBuyNowProduct();
      } else {
        this.checkoutMode = 'cart';
        this.loadCartItems();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAuthentication(): void {
    if (!this.userState.customer) {
      this.snackBar.open('Please login to proceed with checkout', 'Login', {
        duration: 3000
      }).onAction().subscribe(() => {
        this.router.navigate(['/login']);
      });
      this.router.navigate(['/']);
    }
  }

  private prefillUserData(): void {
    const customer = this.userState.customer;
    if (customer) {
      this.shippingForm.patchValue({
        fullName: customer.fullName || '',
        email: customer.emailAddress || '',
        phone: customer.contactNumber || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pinCode: customer.pinCode || ''
      });
    }
  }

  private loadCartItems(): void {
    const customerId = this.userState.customer?.customerId;
    if (!customerId) {
      this.isLoadingCart = false;
      return;
    }

    this.cartService.getCartByIdCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (carts: Cart[]) => {
          this.cartItems = carts.map(cart => this.mapCartToCheckoutItem(cart));
          this.calculateTotals();

          const missingProductIds = this.cartItems
            .filter(item =>
              !!item.productId &&
              (item.productPrice <= 0 || item.productName === '' || item.vendorName === '')
            )
            .map(item => item.productId as string);

          if (missingProductIds.length === 0) {
            this.isLoadingCart = false;
            return;
          }

          this.productService.getProductsByIds(Array.from(new Set(missingProductIds)))
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (products: Product[]) => {
                const byId = new Map(products.map(product => [product.productId, product]));

                this.cartItems = this.cartItems.map(item => {
                  const product = item.productId ? byId.get(item.productId) : undefined;
                  if (!product) {
                    return item;
                  }

                  const productData: any = product;
                  const vendorInfo = productData.vendorId;
                  const vendorName = productData.vendorName || (typeof vendorInfo === 'object' ? vendorInfo?.shopName : '');
                  const vendorIdValue = typeof vendorInfo === 'object' ? vendorInfo?.vendorId : vendorInfo;

                  return {
                    ...item,
                    productName: productData.productName || item.productName,
                    productPrice: productData.price ?? item.productPrice,
                    productImage: productData.productImageURL || item.productImage,
                    vendorName: vendorName || item.vendorName,
                    vendorId: vendorIdValue || item.vendorId
                  };
                });

                this.calculateTotals();
                this.isLoadingCart = false;
              },
              error: () => {
                this.isLoadingCart = false;
              }
            });
        },
        error: () => {
          this.snackBar.open('Failed to load cart items', 'Close', { duration: 3000 });
          this.isLoadingCart = false;
        }
      });
  }

  private mapCartToCheckoutItem(cart: Cart): CartItem {
    const product = this.extractProductFromCart(cart);
    const vendorInfo = product?.vendorId as any;
    const vendorName = product?.vendorName || (typeof vendorInfo === 'object' ? vendorInfo?.shopName : '');
    const vendorIdValue = typeof vendorInfo === 'object' ? vendorInfo?.vendorId : vendorInfo;
    const productId = this.extractProductId(cart);

    return {
      cart,
      productName: product?.productName || product?.name || '',
      productPrice: product?.price ?? product?.productPrice ?? 0,
      productImage: product?.productImageURL || product?.productImage || '',
      quantity: cart.quantity || 1,
      vendorName: vendorName || '',
      productId: productId || undefined,
      vendorId: vendorIdValue || cart.vendorId
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

  private loadBuyNowProduct(): void {
    if (!this.buyNowProductId) {
      this.isLoadingCart = false;
      return;
    }

    this.isLoadingCart = true;
    this.productService.getProductById(this.buyNowProductId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product: Product) => {
          // vendorId can be string or populated vendor object from API
          const vendorInfo = product?.vendorId as any;
          const vendorName = typeof vendorInfo === 'object' ? vendorInfo?.shopName : undefined;
          const vendorIdValue = typeof vendorInfo === 'object' ? vendorInfo?.vendorId : vendorInfo;
          
          // Create a cart-like item for the buyNow product
          const buyNowItem: CartItem = {
            cart: {
              cartId: 'buyNow-temp',
              productId: product as any,
              customerId: this.userState.customer?.customerId || '',
              vendorId: vendorIdValue,
              quantity: this.buyNowQuantity
            } as Cart,
            productName: product?.productName || 'Product',
            productPrice: product?.price || 0,
            productImage: product?.productImageURL || '',
            quantity: this.buyNowQuantity,
            vendorName: vendorName || 'Vendor',
            productId: product?.productId,
            vendorId: vendorIdValue
          };
          
          this.cartItems = [buyNowItem];
          this.calculateTotals();
          this.isLoadingCart = false;
        },
        error: () => {
          this.snackBar.open('Failed to load product details', 'Close', { duration: 3000 });
          this.isLoadingCart = false;
          this.router.navigate(['/products']);
        }
      });
  }

  private calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => 
      sum + (item.productPrice * item.quantity), 0);
    
    // Shipping: Free for orders above ₹500, else ₹50
    this.shippingCost = this.subtotal >= 500 ? 0 : 50;
    
    // Tax: 18% GST
    this.taxAmount = Math.round(this.subtotal * 0.18);
    
    // Calculate total
    this.totalAmount = this.subtotal + this.shippingCost + this.taxAmount - this.discount;
  }

  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      this.couponError = 'Please enter a coupon code';
      return;
    }

    this.isValidatingCoupon = true;
    this.couponError = '';

    const request: ApplyCouponRequest = {
      couponCode: this.couponCode.trim().toUpperCase(),
      customerId: this.userState.customer?.customerId || '',
      orderAmount: this.subtotal,
      productIds: this.cartItems.map(item => {
        const product = typeof item.cart.productId === 'object' ? item.cart.productId : null;
        return product?.productId || '';
      }).filter(id => id !== '')
    };

    this.couponService.validateCoupon(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isValidatingCoupon = false;
          if (response.valid) {
            this.couponValidation = response;
            this.discount = response.discountAmount || 0;
            this.couponApplied = true;
            this.couponError = '';
            this.calculateTotals();
            this.snackBar.open(`Coupon applied! You saved ₹${this.discount}`, 'Close', { duration: 3000 });
          } else {
            this.couponError = response.message || 'Invalid coupon code';
            this.couponApplied = false;
            this.couponValidation = null;
          }
        },
        error: (error) => {
          this.isValidatingCoupon = false;
          this.couponError = error.error?.message || 'Failed to validate coupon. Please try again.';
          this.couponApplied = false;
          this.couponValidation = null;
        }
      });
  }

  removeCoupon(): void {
    this.couponCode = '';
    this.discount = 0;
    this.couponApplied = false;
    this.couponValidation = null;
    this.couponError = '';
    this.calculateTotals();
  }

  nextStep(): void {
    if (this.currentStep === 0 && !this.shippingForm.valid) {
      this.markFormTouched(this.shippingForm);
      this.snackBar.open('Please fill in all shipping details', 'Close', { duration: 3000 });
      return;
    }
    
    if (this.currentStep === 1 && !this.validatePayment()) {
      this.snackBar.open('Please complete payment details', 'Close', { duration: 3000 });
      return;
    }
    
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    // Only allow going to completed steps or current step
    if (step <= this.currentStep) {
      this.currentStep = step;
    }
  }

  private validatePayment(): boolean {
    const method = this.paymentForm.get('paymentMethod')?.value;
    // Both razorpay and COD don't need extra validation at this step
    // Razorpay will open its own modal for payment details
    return method === 'razorpay' || method === 'cod';
  }

  private markFormTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
    });
  }

  confirmOrder(): void {
    if (!this.shippingForm.valid) {
      this.snackBar.open('Please complete shipping information', 'Close', { duration: 3000 });
      this.currentStep = 0;
      return;
    }

    if (!this.validatePayment()) {
      this.snackBar.open('Please select a payment method', 'Close', { duration: 3000 });
      this.currentStep = 1;
      return;
    }

    const paymentMethod = this.paymentForm.get('paymentMethod')?.value;

    if (paymentMethod === 'razorpay') {
      this.initiateRazorpayPayment();
    } else {
      // Cash on Delivery - direct order creation
      this.createOrderAfterPayment();
    }
  }

  private initiateRazorpayPayment(): void {
    this.isProcessing = true;
    this.loadingService.startLoading('Initializing payment...');
    this.paymentStatus = 'Initializing payment gateway...';

    const paymentRequest: PaymentRequest = {
      amount: this.totalAmount,
      currency: 'INR',
      orderId: '', // Will be filled by backend
      customerId: this.userState.customer?.customerId || '',
      customerEmail: this.shippingForm.get('email')?.value || this.userState.customer?.emailAddress || '',
      customerPhone: this.shippingForm.get('phone')?.value || this.userState.customer?.contactNumber?.toString() || '',
      customerName: this.shippingForm.get('fullName')?.value || this.userState.customer?.fullName || '',
      description: `ODOP Order - ${this.cartItems.length} item(s)`
    };

    this.paymentService.createPaymentOrder(paymentRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orderResponse: any) => {
          this.loadingService.stopLoading();
          this.paymentStatus = 'Opening payment window...';
          this.openRazorpayCheckout(orderResponse);
        },
        error: (error: any) => {
          this.isProcessing = false;
          this.loadingService.stopLoading();
          this.paymentStatus = '';
          this.snackBar.open(error.error?.message || 'Failed to initialize payment. Please try again.', 'Close', { duration: 5000 });
        }
      });
  }

  private openRazorpayCheckout(orderData: any): void {
    const options = {
      key: orderData.razorpayKeyId, // Razorpay Key ID from backend
      amount: orderData.amount, // Amount in paise
      currency: orderData.currency || 'INR',
      name: 'ODOP - One District One Product',
      description: `Order for ${this.cartItems.length} item(s)`,
      order_id: orderData.razorpayOrderId,
      prefill: {
        name: this.shippingForm.get('fullName')?.value || this.userState.customer?.fullName,
        email: this.shippingForm.get('email')?.value || this.userState.customer?.emailAddress,
        contact: this.shippingForm.get('phone')?.value || this.userState.customer?.contactNumber
      },
      theme: {
        color: '#3f51b5'
      },
      handler: (response: any) => {
        this.handlePaymentSuccess(response, orderData);
      },
      modal: {
        ondismiss: () => {
          this.isProcessing = false;
          this.paymentStatus = '';
          this.snackBar.open('Payment cancelled', 'Close', { duration: 3000 });
        }
      }
    };

    // Access Razorpay from window object
    const razorpay = new (window as any).Razorpay(options);
    razorpay.on('payment.failed', (response: any) => {
      this.handlePaymentFailure(response);
    });
    razorpay.open();
  }

  private handlePaymentSuccess(response: any, orderData: any): void {
    this.paymentStatus = 'Verifying payment...';
    this.loadingService.startLoading('Verifying payment...');

    const verification: PaymentVerification = {
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature
    };

    this.paymentService.verifyPayment(verification)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (verifyResponse) => {
          if (verifyResponse.status === 'SUCCESS') {
            this.paymentStatus = 'Payment verified! Creating order...';
            this.createOrderAfterPayment(response.razorpay_payment_id);
          } else {
            this.handlePaymentFailure({ error: { description: 'Payment verification failed' } });
          }
        },
        error: (error) => {
          this.handlePaymentFailure({ error: { description: error.error?.message || 'Payment verification failed' } });
        }
      });
  }

  private handlePaymentFailure(response: any): void {
    this.isProcessing = false;
    this.loadingService.stopLoading();
    this.paymentStatus = '';
    const errorMessage = response.error?.description || 'Payment failed. Please try again.';
    this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
  }

  private createOrderAfterPayment(paymentId?: string): void {
    this.isProcessing = true;
    this.loadingService.startLoading('Creating your order...');

    const shippingData = this.shippingForm.value;
    const fullAddress = `${shippingData.address}, ${shippingData.city}, ${shippingData.state} - ${shippingData.pinCode}, ${shippingData.country}`;
    const paymentMethod = this.paymentForm.get('paymentMethod')?.value;

    const order: Order = {
      customerId: this.userState.customer?.customerId,
      orderStatus: paymentMethod === 'razorpay' ? 'Confirmed' : 'Pending',
      paymentStatus: paymentMethod === 'razorpay' ? 'Paid' : 'Pending',
      totalAmount: this.subtotal,
      finalAmount: this.totalAmount,
      deliveryCharges: this.shippingCost,
      shippingAddress: fullAddress,
      paymentMethod: paymentMethod,
      paymentTransactionId: paymentId,
      discountAmount: this.discount,
      orderItems: this.cartItems.map(item => {
        const product = typeof item.cart.productId === 'object' ? item.cart.productId : null;
        return {
          productId: product?.productId || item.productId || (typeof item.cart.productId === 'string' ? item.cart.productId : undefined),
          productName: item.productName,
          productImageURL: item.productImage,
          quantity: item.quantity,
          unitPrice: item.productPrice,
          discount: 0,
          totalPrice: item.productPrice * item.quantity
        };
      })
    };

    this.orderService.createOrder(order)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdOrder) => {
          this.isProcessing = false;
          this.loadingService.stopLoading();
          this.paymentStatus = '';

          // Send order confirmation email
          this.sendOrderConfirmationEmail(createdOrder, paymentId);

          // Clear cart after successful order
          this.clearCart();

          // Navigate to confirmation page
          this.router.navigate(['/confirm_order', createdOrder.orderId], {
            state: { order: createdOrder }
          });
        },
        error: (error) => {
          this.isProcessing = false;
          this.loadingService.stopLoading();
          this.paymentStatus = '';
          this.snackBar.open(error.message || 'Failed to place order. Please try again.', 'Close', { 
            duration: 5000 
          });
        }
      });
  }

  private clearCart(): void {
    // Skip clearing cart if this is a buyNow order (no actual cart items)
    if (this.checkoutMode === 'buyNow') {
      return;
    }
    
    // Track how many items need to be deleted
    const itemsToDelete = this.cartItems.filter(item => item.cart.cartId);
    let deletedCount = 0;
    
    // Delete all cart items from backend
    itemsToDelete.forEach(item => {
      if (item.cart.cartId) {
        this.cartService.deleteCartById(item.cart.cartId).subscribe({
          next: () => {
            deletedCount++;
            // After all items are deleted, update the user state
            if (deletedCount === itemsToDelete.length) {
              // Clear cart in user state to sync frontend with backend
              this.userState.broadcastCartUpdate([]);
            }
          },
          error: (err) => {
            console.error('Failed to delete cart item:', err);
            deletedCount++;
            // Still update state even if some deletions fail
            if (deletedCount === itemsToDelete.length) {
              this.userState.broadcastCartUpdate([]);
            }
          }
        });
      }
    });
    
    // If no items to delete, still clear the state
    if (itemsToDelete.length === 0) {
      this.userState.broadcastCartUpdate([]);
    }
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'This field is required';
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email';
    }
    if (field?.hasError('minlength')) {
      return `Minimum ${field.errors?.['minlength'].requiredLength} characters required`;
    }
    if (field?.hasError('pattern')) {
      if (fieldName === 'phone') return 'Please enter a valid 10-digit phone number';
      if (fieldName === 'pinCode') return 'Please enter a valid 6-digit PIN code';
    }
    
    return '';
  }

  getPaymentMethodIcon(method: string): string {
    const paymentMethod = this.paymentMethods.find(pm => pm.value === method);
    return paymentMethod?.icon || 'payment';
  }

  // ============== EMAIL METHODS ==============

  private sendOrderConfirmationEmail(order: any, paymentId?: string): void {
    const shippingData = this.shippingForm.value;
    const paymentMethod = this.paymentForm.get('paymentMethod')?.value;
    
    // Build order items for email
    const emailOrderItems: OrderItem[] = this.cartItems.map(item => ({
      name: item.productName,
      quantity: item.quantity,
      price: item.productPrice,
      image: item.productImage
    }));

    const orderConfirmation: OrderConfirmationRequest = {
      email: shippingData.email || this.userState.customer?.emailAddress || '',
      customerName: shippingData.fullName || this.userState.customer?.fullName || 'Customer',
      orderId: order.orderId || '',
      orderDate: new Date().toISOString(),
      items: emailOrderItems,
      subtotal: this.subtotal,
      shipping: this.shippingCost,
      tax: this.taxAmount,
      discount: this.discount,
      total: this.totalAmount,
      shippingAddress: `${shippingData.address}, ${shippingData.city}, ${shippingData.state} - ${shippingData.pinCode}`,
      paymentMethod: paymentMethod === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'
    };

    // Send order confirmation email asynchronously
    this.emailService.sendOrderConfirmationAsync(orderConfirmation)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => console.log('Order confirmation email sent'),
        error: (err) => console.error('Failed to send order confirmation email', err)
      });

    // If payment was made online, also send payment success email
    if (paymentId && paymentMethod === 'razorpay') {
      this.sendPaymentSuccessEmail(order.orderId, paymentId);
    }
  }

  private sendPaymentSuccessEmail(orderId: string, paymentId: string): void {
    const shippingData = this.shippingForm.value;

    const paymentSuccess: PaymentSuccessRequest = {
      email: shippingData.email || this.userState.customer?.emailAddress || '',
      customerName: shippingData.fullName || this.userState.customer?.fullName || 'Customer',
      orderId: orderId,
      transactionId: paymentId,
      amount: this.totalAmount,
      paymentMethod: 'Razorpay (Online)',
      paymentDate: new Date().toISOString()
    };

    this.emailService.sendPaymentSuccessEmailAsync(paymentSuccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => console.log('Payment success email sent'),
        error: (err) => console.error('Failed to send payment success email', err)
      });
  }

  goBackToCart(): void {
    this.router.navigate(['/shopping_cart']);
  }
}


