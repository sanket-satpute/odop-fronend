import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { InvoiceService, InvoiceData } from 'src/app/project/services/invoice.service';
import { OrderService } from 'src/app/project/services/order.service';
import { OrderDetailsDialogComponent } from 'src/app/components/dialogs/order-details-dialog/order-details-dialog.component';
import { CancelOrderDialogComponent, CancelOrderDialogData, CancelOrderResult } from 'src/app/components/dialogs/cancel-order-dialog/cancel-order-dialog.component';

// Interfaces
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

type OrderStatus = 'placed' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | '';
type SortOrder = 'latest' | 'oldest' | '';


@Component({
  selector: 'app-customer-orders',
  templateUrl: './customer-orders.component.html',
  styleUrls: ['./customer-orders.component.css']
})
export class CustomerOrdersComponent implements OnInit, OnDestroy {

  // Orders data
  orders: Order[] = [];
  filteredOrders: Order[] = [];

  // Filters
  searchQuery: string = '';
  selectedStatus: OrderStatus = '';
  selectedSort: SortOrder = 'latest';

  // Order Sections (like Flipkart/Amazon)
  activeSection: 'all' | 'delivered' | 'processing' | 'cancelled' = 'all';
  sectionCounts = {
    all: 0,
    delivered: 0,
    processing: 0,
    cancelled: 0
  };

  orderSections: { key: 'all' | 'delivered' | 'processing' | 'cancelled'; label: string; icon: string; color: string }[] = [
    { key: 'all', label: 'All Orders', icon: 'fas fa-list', color: '#FFA500' },
    { key: 'delivered', label: 'Delivered', icon: 'fas fa-check-circle', color: '#10b981' },
    { key: 'processing', label: 'Processing', icon: 'fas fa-clock', color: '#3b82f6' },
    { key: 'cancelled', label: 'Cancelled', icon: 'fas fa-times-circle', color: '#ef4444' }
  ];

  // State
  isLoading: boolean = true;
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Status configuration
  statusConfig: { [key: string]: { label: string; color: string; bgColor: string; icon: string } } = {
    placed: { label: 'Processing', color: '#856404', bgColor: '#fff3cd', icon: 'fas fa-clock' },
    confirmed: { label: 'Confirmed', color: '#0c5460', bgColor: '#d1ecf1', icon: 'fas fa-check-circle' },
    shipped: { label: 'Shipped', color: '#004085', bgColor: '#cce5ff', icon: 'fas fa-shipping-fast' },
    out_for_delivery: { label: 'Out for Delivery', color: '#856404', bgColor: '#fff3cd', icon: 'fas fa-truck' },
    delivered: { label: 'Delivered', color: '#155724', bgColor: '#d4edda', icon: 'fas fa-check-double' },
    cancelled: { label: 'Cancelled', color: '#721c24', bgColor: '#f8d7da', icon: 'fas fa-times-circle' },
    returned: { label: 'Returned', color: '#383d41', bgColor: '#e2e3e5', icon: 'fas fa-undo' }
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private userStateService: UserStateService,
    private invoiceService: InvoiceService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadOrders();

    // Check for query params to highlight specific order
    this.route.queryParams.subscribe(params => {
      if (params['orderId']) {
        this.searchQuery = params['orderId'];
        this.applyFilters();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Load orders from backend API
   */
  loadOrders(): void {
    this.isLoading = true;

    const customer = this.userStateService.customer;

    if (!customer || !customer.customerId) {
      this.orders = [];
      this.applyFilters();
      this.isLoading = false;
      return;
    }

    // Fetch orders from backend API
    this.orderService.getOrdersByCustomerId(customer.customerId).subscribe({
      next: (ordersFromApi: any[]) => {
        if (ordersFromApi && ordersFromApi.length > 0) {
          this.orders = ordersFromApi.map((order: any) => this.mapOrderData(order));
        } else {
          this.orders = [];
        }
        this.updateSectionCounts();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching orders:', error);
        // Fallback to customer.orders if API fails
        if (customer.orders && customer.orders.length > 0) {
          this.orders = customer.orders.map((order: any) => this.mapOrderData(order));
        } else {
          this.orders = [];
        }
        this.updateSectionCounts();
        this.applyFilters();
        this.isLoading = false;
      }
    });
  }

  /**
   * Map backend order data to frontend Order interface
   */
  mapOrderData(orderData: any): Order {
    // Backend uses orderItems, but we map to productList for frontend compatibility
    const items = orderData.orderItems || orderData.productList || orderData.products || [];
    
    return {
      orderId: orderData.orderId || orderData.id || `ORD-${Date.now()}`,
      orderNumber: orderData.orderNumber || orderData.orderId,
      orderDateTime: new Date(orderData.orderDateTime || orderData.createdAt || new Date()),
      orderStatus: this.normalizeStatus(orderData.orderStatus || orderData.status || 'placed'),
      productList: items.map((p: any) => ({
        productId: p.productId || p.id,
        productName: p.productName || p.name || 'Product',
        category: p.category,
        quantity: p.quantity || 1,
        pricePerUnit: p.unitPrice || p.pricePerUnit || p.price || 0,
        discountApplied: p.discount > 0,
        discountAmount: p.discount || p.discountAmount || 0,
        vendorId: p.vendorId,
        totalAmount: p.totalPrice || p.totalAmount || ((p.unitPrice || p.pricePerUnit || p.price || 0) * (p.quantity || 1)),
        image: p.productImageURL || p.image || p.imageUrl,
        variant: p.variant
      })),
      totalAmount: orderData.finalAmount || orderData.totalAmount || orderData.total || 0,
      couponApplied: orderData.discountAmount > 0 || orderData.couponApplied,
      couponCode: orderData.couponCode,
      paymentMethod: orderData.paymentMethod || 'COD',
      shippingAddress: orderData.shippingAddress,
      customerId: orderData.customerId,
      vendorId: orderData.vendorId,
      trackingNumber: orderData.trackingNumber,
      estimatedDelivery: orderData.estimatedDeliveryDate ? new Date(orderData.estimatedDeliveryDate) : undefined,
      deliveredAt: orderData.actualDeliveryDate ? new Date(orderData.actualDeliveryDate) : undefined,
      cancelledAt: orderData.cancelledAt ? new Date(orderData.cancelledAt) : undefined,
      cancellationReason: orderData.cancellationReason
    };
  }

  /**
   * Normalize status string to valid OrderStatus
   */
  normalizeStatus(status: string): Order['orderStatus'] {
    const statusMap: { [key: string]: Order['orderStatus'] } = {
      'processing': 'placed',
      'pending': 'placed',
      'placed': 'placed',
      'confirmed': 'confirmed',
      'shipped': 'shipped',
      'out_for_delivery': 'out_for_delivery',
      'outfordelivery': 'out_for_delivery',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'returned': 'returned'
    };
    return statusMap[status.toLowerCase()] || 'placed';
  }

  // Format methods
  formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  getStatusConfig(status: string) {
    return this.statusConfig[status] || {
      label: status,
      color: '#6c757d',
      bgColor: '#f8f9fa',
      icon: 'fas fa-info-circle'
    };
  }

  // Filter methods
  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSectionChange(section: 'all' | 'delivered' | 'processing' | 'cancelled'): void {
    this.activeSection = section;
    this.selectedStatus = ''; // Clear status filter when switching sections
    this.currentPage = 1;
    this.applyFilters();
  }

  updateSectionCounts(): void {
    this.sectionCounts = {
      all: this.orders.length,
      delivered: this.orders.filter(o => o.orderStatus === 'delivered').length,
      processing: this.orders.filter(o => ['placed', 'confirmed', 'shipped', 'out_for_delivery'].includes(o.orderStatus)).length,
      cancelled: this.orders.filter(o => o.orderStatus === 'cancelled').length
    };
  }

  applyFilters(): void {
    let filtered = [...this.orders];

    // Apply section filter first
    if (this.activeSection !== 'all') {
      switch (this.activeSection) {
        case 'delivered':
          filtered = filtered.filter(order => order.orderStatus === 'delivered');
          break;
        case 'processing':
          filtered = filtered.filter(order => 
            ['placed', 'confirmed', 'shipped', 'out_for_delivery'].includes(order.orderStatus)
          );
          break;
        case 'cancelled':
          filtered = filtered.filter(order => order.orderStatus === 'cancelled');
          break;
      }
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.orderId.toLowerCase().includes(query) ||
        (order.orderNumber && order.orderNumber.toLowerCase().includes(query)) ||
        order.productList.some(product =>
          product.productName.toLowerCase().includes(query) ||
          (product.category && product.category.toLowerCase().includes(query))
        )
      );
    }

    // Apply status filter (only if section is 'all')
    if (this.selectedStatus && this.activeSection === 'all') {
      filtered = filtered.filter(order => order.orderStatus === this.selectedStatus);
    }

    // Apply sorting
    if (this.selectedSort === 'latest') {
      filtered.sort((a, b) => new Date(b.orderDateTime).getTime() - new Date(a.orderDateTime).getTime());
    } else if (this.selectedSort === 'oldest') {
      filtered.sort((a, b) => new Date(a.orderDateTime).getTime() - new Date(b.orderDateTime).getTime());
    }

    this.filteredOrders = filtered;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedSort = 'latest';
    this.activeSection = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  // Computed properties
  get totalOrders(): number {
    return this.filteredOrders.length;
  }

  get hasOrders(): boolean {
    return this.orders.length > 0;
  }

  get hasFilteredOrders(): boolean {
    return this.filteredOrders.length > 0;
  }

  get displayedOrders(): Order[] {
    const endIndex = this.currentPage * this.itemsPerPage;
    return this.filteredOrders.slice(0, endIndex);
  }

  get canLoadMore(): boolean {
    return this.displayedOrders.length < this.filteredOrders.length;
  }

  // Action methods
  viewOrderDetails(order: Order): void {
    this.dialog.open(OrderDetailsDialogComponent, {
      width: '100vw',
      maxWidth: '750px',
      panelClass: 'order-details-dialog-panel',
      data: { order },
      autoFocus: false
    });
  }

  trackOrder(order: Order): void {
    this.dialog.open(OrderDetailsDialogComponent, {
      width: '100vw',
      maxWidth: '750px',
      panelClass: 'order-details-dialog-panel',
      data: { order },
      autoFocus: false
    }).afterOpened().subscribe(() => {
      // Switch to tracking tab - handled in dialog
    });
  }

  reorder(order: Order, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    // Add all products from this order to cart
    const customer = this.userStateService.customer;
    if (customer) {
      const productIds = order.productList.map(p => p.productId);
      const currentCart = customer.cartProductIds || [];
      const newCart = [...new Set([...currentCart, ...productIds])];

      // Update customer cart using the setter
      this.userStateService.customer = {
        ...customer,
        cartProductIds: newCart
      };

      this.snackBar.open(`${productIds.length} item(s) added to cart!`, 'View Cart', {
        duration: 3000,
        panelClass: ['success-snackbar']
      }).onAction().subscribe(() => {
        this.router.navigate(['/shopping_cart']);
      });
    }
  }

  cancelOrder(order: Order, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (order.orderStatus !== 'placed' && order.orderStatus !== 'confirmed') {
      this.snackBar.open('This order cannot be cancelled at this stage', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    // Prepare dialog data
    const dialogData: CancelOrderDialogData = {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,
      productCount: order.productList.length
    };

    // Open cancel order dialog
    const dialogRef = this.dialog.open(CancelOrderDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'cancel-order-dialog-container',
      data: dialogData
    });

    // Handle dialog result
    dialogRef.afterClosed().subscribe((result: CancelOrderResult) => {
      if (result && result.confirmed) {
        // Build the reason string
        const reasonText = result.reason === 'other' && result.customReason 
          ? result.customReason 
          : this.getCancellationReasonLabel(result.reason);

        // Call backend API to cancel order
        this.orderService.cancelOrder(order.orderId, reasonText).subscribe({
          next: () => {
            // Update order status locally
            const orderIndex = this.orders.findIndex(o => o.orderId === order.orderId);
            if (orderIndex !== -1) {
              this.orders[orderIndex].orderStatus = 'cancelled';
              this.orders[orderIndex].cancelledAt = new Date();
              this.orders[orderIndex].cancellationReason = reasonText;
              this.updateSectionCounts();
              this.applyFilters();
            }

            this.snackBar.open('Order cancelled successfully. Refund will be processed within 5-7 business days.', 'Close', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            console.error('Error cancelling order:', error);
            this.snackBar.open('Failed to cancel order. Please try again.', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  /**
   * Get human-readable label for cancellation reason
   */
  getCancellationReasonLabel(reasonCode: string): string {
    const reasonLabels: { [key: string]: string } = {
      'changed_mind': 'Changed my mind',
      'found_better_price': 'Found better price elsewhere',
      'ordered_by_mistake': 'Order placed by mistake',
      'delivery_too_slow': 'Delivery time too long',
      'wrong_item': 'Ordered wrong item/size/color',
      'no_longer_needed': 'Item no longer needed'
    };
    return reasonLabels[reasonCode] || reasonCode;
  }

  downloadInvoice(order: Order, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.snackBar.open('Generating invoice...', '', { duration: 1500 });

    // Get customer info
    const customer = this.userStateService.customer;
    
    // Convert order to invoice data
    const invoiceData: InvoiceData = {
      invoiceNumber: `ODOP-${order.orderId}`,
      orderDate: new Date(order.orderDateTime),
      invoiceDate: new Date(),
      customerName: customer?.fullName || 'Valued Customer',
      customerEmail: customer?.emailAddress || 'customer@email.com',
      customerPhone: customer?.contactNumber?.toString() || '+91 XXXXXXXXXX',
      shippingAddress: this.parseAddress(order.shippingAddress || customer?.address || ''),
      billingAddress: this.parseAddress(order.shippingAddress || customer?.address || ''),
      vendorName: 'ODOP Vendor',
      vendorGSTIN: '29AABCU9603R1ZM',
      items: order.productList.map(p => ({
        name: p.productName,
        quantity: p.quantity,
        price: p.pricePerUnit,
        total: p.quantity * p.pricePerUnit
      })),
      subtotal: order.productList.reduce((sum, p) => sum + (p.quantity * p.pricePerUnit), 0),
      discount: order.couponApplied ? (order.totalAmount * 0.1) : 0,
      shippingCost: 0,
      tax: Math.round(order.totalAmount * 0.18 / 1.18),
      total: order.totalAmount,
      paymentMethod: order.paymentMethod || 'Cash on Delivery',
      paymentStatus: order.orderStatus === 'delivered' ? 'Paid' : 'Pending'
    };

    // Generate and download PDF
    try {
      this.invoiceService.generateInvoicePDF(invoiceData);
      this.snackBar.open('Invoice downloaded successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      this.snackBar.open('Failed to generate invoice. Please try again.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private parseAddress(addressString: string): { street: string; city: string; state: string; pincode: string } {
    // Default address if parsing fails
    const defaultAddress = {
      street: 'Address Line 1',
      city: 'City',
      state: 'State',
      pincode: '000000'
    };

    if (!addressString || typeof addressString !== 'string') {
      return defaultAddress;
    }

    // Try to parse address from string
    const parts = addressString.split(',').map(p => p.trim());
    
    if (parts.length >= 4) {
      // Extract pincode from last part
      const lastPart = parts[parts.length - 1];
      const pincodeMatch = lastPart.match(/\d{6}/);
      const pincode = pincodeMatch ? pincodeMatch[0] : '000000';
      
      return {
        street: parts.slice(0, parts.length - 3).join(', ') || parts[0],
        city: parts[parts.length - 3] || 'City',
        state: parts[parts.length - 2] || 'State',
        pincode: pincode
      };
    } else if (parts.length >= 2) {
      return {
        street: parts[0],
        city: parts[1] || 'City',
        state: parts[2] || 'State',
        pincode: '000000'
      };
    }

    return defaultAddress;
  }

  checkRefundStatus(order: Order, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (order.orderStatus === 'cancelled') {
      this.snackBar.open('Refund is being processed. Expected within 5-7 business days.', 'Close', {
        duration: 4000,
        panelClass: ['info-snackbar']
      });
    } else {
      this.viewOrderDetails(order);
    }
  }

  viewProduct(productId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/product_detail', productId]);
  }

  exportOrders(): void {
    if (this.filteredOrders.length === 0) {
      this.snackBar.open('No orders to export', 'Close', {
        duration: 2000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    this.snackBar.open('Exporting orders...', '', { duration: 1500 });

    const csvData = this.filteredOrders.map(order => ({
      'Order ID': order.orderId,
      'Date': this.formatDate(order.orderDateTime),
      'Status': this.getStatusConfig(order.orderStatus).label,
      'Products': order.productList.map(p => `${p.productName} x${p.quantity}`).join('; '),
      'Total Amount': this.formatCurrency(order.totalAmount),
      'Payment Method': order.paymentMethod || 'N/A'
    }));

    const csv = this.convertToCSV(csvData);
    this.downloadCSV(csv, 'my-orders.csv');

    this.snackBar.open('Orders exported successfully!', 'Close', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  loadMoreOrders(): void {
    this.currentPage++;
  }

  // Utility methods
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  private downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  // Get action buttons based on order status
  getOrderActions(order: Order): { label: string; action: string; primary: boolean; icon: string }[] {
    const actions: { label: string; action: string; primary: boolean; icon: string }[] = [];

    switch (order.orderStatus) {
      case 'placed':
      case 'confirmed':
        actions.push({ label: 'Cancel Order', action: 'cancel', primary: false, icon: 'fas fa-times' });
        actions.push({ label: 'View Details', action: 'details', primary: true, icon: 'fas fa-eye' });
        break;
      case 'shipped':
      case 'out_for_delivery':
        actions.push({ label: 'Track Order', action: 'track', primary: false, icon: 'fas fa-truck' });
        actions.push({ label: 'View Details', action: 'details', primary: true, icon: 'fas fa-eye' });
        break;
      case 'delivered':
        actions.push({ label: 'Download Invoice', action: 'invoice', primary: false, icon: 'fas fa-download' });
        actions.push({ label: 'Reorder', action: 'reorder', primary: true, icon: 'fas fa-redo' });
        break;
      case 'cancelled':
        actions.push({ label: 'Refund Status', action: 'refund', primary: false, icon: 'fas fa-info-circle' });
        actions.push({ label: 'Reorder', action: 'reorder', primary: true, icon: 'fas fa-redo' });
        break;
      case 'returned':
        actions.push({ label: 'Refund Status', action: 'refund', primary: false, icon: 'fas fa-info-circle' });
        actions.push({ label: 'View Details', action: 'details', primary: true, icon: 'fas fa-eye' });
        break;
      default:
        actions.push({ label: 'View Details', action: 'details', primary: true, icon: 'fas fa-eye' });
    }

    return actions;
  }

  handleAction(action: string, order: Order, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    switch (action) {
      case 'details':
        this.viewOrderDetails(order);
        break;
      case 'track':
        this.trackOrder(order);
        break;
      case 'cancel':
        this.cancelOrder(order);
        break;
      case 'reorder':
        this.reorder(order);
        break;
      case 'invoice':
        this.downloadInvoice(order);
        break;
      case 'refund':
        this.checkRefundStatus(order);
        break;
    }
  }

  // Browse products
  browseProducts(): void {
    this.router.navigate(['/products']);
  }

  // TrackBy function for ngFor optimization
  trackByOrderId(index: number, order: Order): string {
    return order.orderId;
  }
}


