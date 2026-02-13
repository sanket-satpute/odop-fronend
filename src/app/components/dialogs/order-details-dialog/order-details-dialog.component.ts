import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

interface Product {
  productId: string;
  productName: string;
  category?: string;
  quantity: number;
  pricePerUnit: number;
  discountApplied?: boolean;
  discountAmount?: number;
  vendorId?: string;
  totalAmount?: number;
  returnEligibleUntil?: Date;
  image?: string;
  variant?: string;
}

interface Order {
  orderId: string;
  orderNumber?: string;
  orderDateTime: Date;
  orderStatus: 'placed' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  productList: Product[];
  totalAmount: number;
  couponApplied?: boolean;
  couponCode?: string;
  paymentMethod?: string;
  shippingAddress?: string;
  customerId?: string;
  vendorId?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

interface TrackingStep {
  status: string;
  label: string;
  description: string;
  date?: Date;
  completed: boolean;
  current: boolean;
}

@Component({
  selector: 'app-order-details-dialog',
  templateUrl: './order-details-dialog.component.html',
  styleUrls: ['./order-details-dialog.component.css']
})
export class OrderDetailsDialogComponent implements OnInit {

  order: Order;
  trackingSteps: TrackingStep[] = [];
  activeTab: 'details' | 'tracking' | 'invoice' = 'details';

  statusConfig: { [key: string]: { label: string; color: string; bgColor: string; icon: string } } = {
    placed: { label: 'Order Placed', color: '#856404', bgColor: '#fff3cd', icon: 'fas fa-clock' },
    confirmed: { label: 'Confirmed', color: '#0c5460', bgColor: '#d1ecf1', icon: 'fas fa-check-circle' },
    shipped: { label: 'Shipped', color: '#004085', bgColor: '#cce5ff', icon: 'fas fa-shipping-fast' },
    out_for_delivery: { label: 'Out for Delivery', color: '#856404', bgColor: '#fff3cd', icon: 'fas fa-truck' },
    delivered: { label: 'Delivered', color: '#155724', bgColor: '#d4edda', icon: 'fas fa-check-double' },
    cancelled: { label: 'Cancelled', color: '#721c24', bgColor: '#f8d7da', icon: 'fas fa-times-circle' },
    returned: { label: 'Returned', color: '#383d41', bgColor: '#e2e3e5', icon: 'fas fa-undo' }
  };

  constructor(
    public dialogRef: MatDialogRef<OrderDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { order: Order },
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.order = data.order;
  }

  ngOnInit(): void {
    this.generateTrackingSteps();
  }

  generateTrackingSteps(): void {
    const allSteps = [
      { status: 'placed', label: 'Order Placed', description: 'Your order has been placed successfully' },
      { status: 'confirmed', label: 'Order Confirmed', description: 'Seller has confirmed your order' },
      { status: 'shipped', label: 'Shipped', description: 'Your order has been shipped' },
      { status: 'out_for_delivery', label: 'Out for Delivery', description: 'Order is out for delivery' },
      { status: 'delivered', label: 'Delivered', description: 'Order has been delivered' }
    ];

    const statusOrder = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
    const currentStatusIndex = statusOrder.indexOf(this.order.orderStatus);

    if (this.order.orderStatus === 'cancelled') {
      this.trackingSteps = [
        { status: 'placed', label: 'Order Placed', description: 'Your order was placed', completed: true, current: false, date: this.order.orderDateTime },
        { status: 'cancelled', label: 'Cancelled', description: this.order.cancellationReason || 'Order was cancelled', completed: true, current: true, date: this.order.cancelledAt }
      ];
    } else if (this.order.orderStatus === 'returned') {
      this.trackingSteps = allSteps.map((step, index) => ({
        ...step,
        completed: true,
        current: false,
        date: this.order.orderDateTime
      }));
      this.trackingSteps.push({
        status: 'returned',
        label: 'Returned',
        description: 'Order has been returned',
        completed: true,
        current: true,
        date: new Date()
      });
    } else {
      this.trackingSteps = allSteps.map((step, index) => ({
        ...step,
        completed: index <= currentStatusIndex,
        current: index === currentStatusIndex,
        date: index <= currentStatusIndex ? this.getStepDate(index) : undefined
      }));
    }
  }

  getStepDate(stepIndex: number): Date {
    const baseDate = new Date(this.order.orderDateTime);
    baseDate.setDate(baseDate.getDate() + stepIndex);
    return baseDate;
  }

  getStatusConfig(status: string) {
    return this.statusConfig[status] || { label: status, color: '#6c757d', bgColor: '#f8f9fa', icon: 'fas fa-info-circle' };
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  formatDateShort(date: Date | string | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  getSubtotal(): number {
    return this.order.productList.reduce((sum, p) => sum + (p.pricePerUnit * p.quantity), 0);
  }

  getDiscount(): number {
    return this.order.productList.reduce((sum, p) => sum + (p.discountAmount || 0), 0);
  }

  setActiveTab(tab: 'details' | 'tracking' | 'invoice'): void {
    this.activeTab = tab;
  }

  viewProduct(product: Product): void {
    this.dialogRef.close();
    this.router.navigate(['/product_detail', product.productId]);
  }

  copyTrackingNumber(): void {
    if (this.order.trackingNumber) {
      navigator.clipboard.writeText(this.order.trackingNumber);
      this.snackBar.open('Tracking number copied!', 'Close', {
        duration: 2000,
        panelClass: ['success-snackbar']
      });
    }
  }

  downloadInvoice(): void {
    // Generate invoice PDF
    this.snackBar.open('Generating invoice...', '', { duration: 1500 });
    
    // Simulate download
    setTimeout(() => {
      const invoiceContent = this.generateInvoiceHTML();
      const blob = new Blob([invoiceContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${this.order.orderId}.html`;
      link.click();
      URL.revokeObjectURL(url);
      
      this.snackBar.open('Invoice downloaded!', 'Close', {
        duration: 2000,
        panelClass: ['success-snackbar']
      });
    }, 1000);
  }

  generateInvoiceHTML(): string {
    const products = this.order.productList.map(p => `
      <tr>
        <td>${p.productName}</td>
        <td>${p.quantity}</td>
        <td>${this.formatCurrency(p.pricePerUnit)}</td>
        <td>${this.formatCurrency(p.pricePerUnit * p.quantity)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${this.order.orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #FFA500; margin: 0; }
          .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background: #f8f9fa; }
          .total { text-align: right; font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ODOP</h1>
          <p>One District One Product</p>
          <h2>TAX INVOICE</h2>
        </div>
        <div class="info">
          <div>
            <strong>Order ID:</strong> ${this.order.orderId}<br>
            <strong>Date:</strong> ${this.formatDate(this.order.orderDateTime)}<br>
            <strong>Payment:</strong> ${this.order.paymentMethod || 'N/A'}
          </div>
          <div>
            <strong>Shipping Address:</strong><br>
            ${this.order.shippingAddress || 'N/A'}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${products}
          </tbody>
        </table>
        <div class="total">
          <p>Subtotal: ${this.formatCurrency(this.getSubtotal())}</p>
          <p>Discount: -${this.formatCurrency(this.getDiscount())}</p>
          <p>Shipping: FREE</p>
          <p style="font-size: 20px;">Grand Total: ${this.formatCurrency(this.order.totalAmount)}</p>
        </div>
      </body>
      </html>
    `;
  }

  requestReturn(): void {
    this.snackBar.open('Return request feature coming soon!', 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  contactSupport(): void {
    this.dialogRef.close();
    this.router.navigate(['/support/buyer']);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
