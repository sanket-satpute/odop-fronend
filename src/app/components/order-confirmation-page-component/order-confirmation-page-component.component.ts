import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderService } from 'src/app/project/services/order.service';
import { Order, OrderItem } from 'src/app/project/models/order';
import { UserStateService } from 'src/app/project/services/user-state.service';

@Component({
  selector: 'app-order-confirmation-page-component',
  templateUrl: './order-confirmation-page-component.component.html',
  styleUrls: ['./order-confirmation-page-component.component.css']
})
export class OrderConfirmationPageComponentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  order: Order | null = null;
  orderId: string = '';
  isLoading = true;
  loadError = '';
  showConfetti = true;
  
  // Timeline steps
  orderSteps = [
    { status: 'confirmed', label: 'Order Confirmed', icon: 'check_circle', completed: true },
    { status: 'processing', label: 'Processing', icon: 'inventory_2', completed: false },
    { status: 'shipped', label: 'Shipped', icon: 'local_shipping', completed: false },
    { status: 'delivered', label: 'Delivered', icon: 'home', completed: false }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    public userState: UserStateService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    
    // Try to get order from navigation state first
    const navState = history.state;
    if (navState?.order) {
      this.order = navState.order;
      this.isLoading = false;
      this.updateOrderSteps();
    } else if (this.orderId) {
      this.loadOrder();
    } else {
      this.loadError = 'Order ID not found';
      this.isLoading = false;
    }
    
    // Hide confetti after animation
    setTimeout(() => this.showConfetti = false, 5000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOrder(): void {
    this.orderService.getOrderById(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          this.order = order;
          this.isLoading = false;
          this.updateOrderSteps();
        },
        error: () => {
          this.loadError = 'Failed to load order details';
          this.isLoading = false;
        }
      });
  }

  private updateOrderSteps(): void {
    if (!this.order) return;
    
    const status = this.order.orderStatus?.toLowerCase() || 'confirmed';
    const statusOrder = ['confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);
    
    this.orderSteps.forEach((step, index) => {
      step.completed = index <= currentIndex;
    });
  }

  getOrderDate(): string {
    if (!this.order?.createdAt) return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return new Date(this.order.createdAt).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getEstimatedDelivery(): string {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    return deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }

  getPaymentMethodLabel(): string {
    const method = this.order?.paymentMethod?.toLowerCase();
    if (method === 'razorpay') return 'Razorpay (Online)';
    if (method === 'cod') return 'Cash on Delivery';
    if (method === 'upi') return 'UPI';
    return this.order?.paymentMethod || 'N/A';
  }

  getPaymentStatusClass(): string {
    const status = this.order?.paymentStatus?.toLowerCase();
    if (status === 'paid' || status === 'completed') return 'status-paid';
    if (status === 'pending') return 'status-pending';
    return 'status-pending';
  }

  getOrderStatusClass(): string {
    const status = this.order?.orderStatus?.toLowerCase();
    if (status === 'confirmed' || status === 'delivered') return 'status-success';
    if (status === 'cancelled') return 'status-cancelled';
    return 'status-processing';
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  viewOrders(): void {
    this.router.navigate(['/customer-dashboard/cust-orders']);
  }

  trackOrder(): void {
    this.router.navigate(['/track-order', this.orderId]);
  }

  printOrder(): void {
    this.generateOrderPDF();
  }

  private generateOrderPDF(): void {
    const orderDate = this.getOrderDate();
    const customerName = this.userState.customer?.fullName || 'Customer';
    const customerEmail = this.userState.customer?.emailAddress || '';
    const orderId = this.order?.orderId || this.orderId;
    const paymentMethod = this.getPaymentMethodLabel();
    const paymentStatus = this.order?.paymentStatus || 'Pending';
    const orderStatus = this.order?.orderStatus || 'Confirmed';
    const shippingAddress = this.order?.shippingAddress || 'N/A';
    const subtotal = this.order?.totalAmount || 0;
    const deliveryCharges = this.order?.deliveryCharges || 0;
    const discount = this.order?.discountAmount || 0;
    const total = this.order?.finalAmount || this.order?.totalAmount || 0;

    // Generate order items HTML
    let itemsHTML = '';
    if (this.order?.orderItems?.length) {
      this.order.orderItems.forEach((item, index) => {
        const itemTotal = (item.unitPrice || 0) * (item.quantity || 1);
        itemsHTML += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${index + 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.productName || 'Product'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.unitPrice || 0).toLocaleString('en-IN')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${itemTotal.toLocaleString('en-IN')}</td>
          </tr>
        `;
      });
    } else {
      itemsHTML = `
        <tr>
          <td colspan="5" style="padding: 20px; text-align: center; color: #666;">Order items details not available</td>
        </tr>
      `;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Order Invoice - ${orderId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; }
          .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #FF6B35; }
          .logo { font-size: 32px; font-weight: 700; color: #FF6B35; }
          .logo span { color: #333; }
          .invoice-title { text-align: right; }
          .invoice-title h1 { font-size: 28px; color: #333; margin-bottom: 5px; }
          .invoice-title p { color: #666; font-size: 14px; }
          .order-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-block { flex: 1; }
          .info-block h3 { font-size: 14px; text-transform: uppercase; color: #999; margin-bottom: 10px; letter-spacing: 1px; }
          .info-block p { font-size: 14px; margin-bottom: 4px; }
          .info-block .highlight { font-weight: 600; color: #333; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .status-confirmed { background: #d4edda; color: #155724; }
          .status-pending { background: #fff3cd; color: #856404; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th { background: #f8f9fa; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #dee2e6; }
          .items-table th:nth-child(3), .items-table th:nth-child(4), .items-table th:nth-child(5) { text-align: right; }
          .summary { margin-left: auto; width: 300px; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .summary-row.total { border-top: 2px solid #333; margin-top: 10px; padding-top: 15px; font-size: 18px; font-weight: 700; }
          .summary-row.total span:last-child { color: #FF6B35; }
          .summary-row.discount span:last-child { color: #28a745; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
          .footer p { margin-bottom: 5px; }
          .thank-you { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0; }
          .thank-you h2 { color: #28a745; margin-bottom: 5px; }
          .thank-you p { color: #666; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .invoice { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div class="logo">ODOP<span> Marketplace</span></div>
            <div class="invoice-title">
              <h1>ORDER INVOICE</h1>
              <p>Date: ${orderDate}</p>
            </div>
          </div>
          
          <div class="order-info">
            <div class="info-block">
              <h3>Order Details</h3>
              <p><span class="highlight">Order ID:</span> ${orderId}</p>
              <p><span class="highlight">Order Status:</span> <span class="status-badge status-confirmed">${orderStatus}</span></p>
              <p><span class="highlight">Payment:</span> ${paymentMethod}</p>
              <p><span class="highlight">Payment Status:</span> <span class="status-badge ${paymentStatus.toLowerCase() === 'paid' ? 'status-confirmed' : 'status-pending'}">${paymentStatus}</span></p>
            </div>
            <div class="info-block">
              <h3>Customer Details</h3>
              <p class="highlight">${customerName}</p>
              <p>${customerEmail}</p>
            </div>
            <div class="info-block">
              <h3>Shipping Address</h3>
              <p>${shippingAddress}</p>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>₹${subtotal.toLocaleString('en-IN')}</span>
            </div>
            ${deliveryCharges > 0 ? `
            <div class="summary-row">
              <span>Delivery Charges</span>
              <span>₹${deliveryCharges.toLocaleString('en-IN')}</span>
            </div>
            ` : ''}
            ${discount > 0 ? `
            <div class="summary-row discount">
              <span>Discount</span>
              <span>-₹${discount.toLocaleString('en-IN')}</span>
            </div>
            ` : ''}
            <div class="summary-row total">
              <span>Grand Total</span>
              <span>₹${total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          
          <div class="thank-you">
            <h2>Thank You for Your Order!</h2>
            <p>We appreciate your business. Your order will be delivered within 5-7 business days.</p>
          </div>
          
          <div class="footer">
            <p>ODOP - One District One Product Marketplace</p>
            <p>Supporting local artisans and craftsmen across India</p>
            <p>For support: support@odop.in | www.odop.in</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  }
}

