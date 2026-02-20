import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrderService } from 'src/app/project/services/order.service';
import { Order as BackendOrder } from 'src/app/project/models/order';
import { CustomerServiceService } from 'src/app/project/services/customer-service.service';
import { VendorServiceService } from 'src/app/project/services/vendor-service.service';
import { CustomerDto } from 'src/app/project/models/customer';
import { VendorDto } from 'src/app/project/models/vendor';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface OrderStat {
  type: string;
  label: string;
  count: number;
  icon: string;
  change: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  logo: string;
}

export interface Order {
  id: string;
  customer: Customer;
  vendor: Vendor;
  amount: number;
  status: 'pending' | 'dispatched' | 'delivered' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'failed';
  placedOn: Date;
  products: any[];
}


@Component({
  selector: 'app-admin-dashboard-orders',
  templateUrl: './admin-dashboard-orders.component.html',
  styleUrls: ['./admin-dashboard-orders.component.css']
})
export class AdminDashboardOrdersComponent implements OnInit, OnDestroy {
  Math = Math;
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedOrders: string[] = [];
  selectedOrder: Order | null = null;
  showOrderDetails = false;
  currentPage = 1;
  pageSize = 10;
  totalOrders = 0;
  totalPages = 0;
  searchTerm = '';
  selectedStatus = '';
  selectedVendor = '';
  startDate = '';
  endDate = '';
  sortBy = 'newest';
  orderStats: OrderStat[] = [];
  vendors: Vendor[] = [];
  allSelected = false;
  isLoading = false;
  error: string | null = null;

  private customerCache: { [id: string]: CustomerDto } = {};
  private vendorCache: { [id: string]: VendorDto } = {};
  private autoRefreshInterval: any;

  constructor(
    private orderService: OrderService,
    private customerService: CustomerServiceService,
    private vendorService: VendorServiceService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.fetchOrders();
    this.autoRefreshInterval = setInterval(() => this.fetchOrders(), 60000);
  }

  ngOnDestroy(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }

  fetchOrders(): void {
    this.isLoading = true;
    this.selectedOrders = [];
    this.allSelected = false;
    this.error = null;
    this.orderService.getAllOrders().subscribe({
      next: (orders: BackendOrder[]) => {
        const mappedOrders = orders.map(o => this.mapBackendOrderToUI(o));
        this.orders = mappedOrders;
        this.filteredOrders = [...this.orders];
        this.totalOrders = this.orders.length;
        this.totalPages = Math.ceil(this.totalOrders / this.pageSize);
        this.isLoading = false;
        this.applyFilters();
        this.extractVendors();
        this.calculateOrderStats();
        // Fetch customer and vendor info for all orders (cache for performance)
        mappedOrders.forEach(order => {
          if (order.customer.id && !this.customerCache[order.customer.id]) {
            this.customerService.getCustomerById(order.customer.id).subscribe({
              next: (customer) => {
                this.customerCache[order.customer.id] = customer;
                order.customer.name = customer.fullName || '';
                order.customer.email = customer.emailAddress || '';
                order.customer.phone = customer.contactNumber ? customer.contactNumber.toString() : '';
                order.customer.avatar = customer.profilePicturePath || '';
              }
            });
          } else if (order.customer.id && this.customerCache[order.customer.id]) {
            const customer = this.customerCache[order.customer.id];
            order.customer.name = customer.fullName || '';
            order.customer.email = customer.emailAddress || '';
            order.customer.phone = customer.contactNumber ? customer.contactNumber.toString() : '';
            order.customer.avatar = customer.profilePicturePath || '';
          }
          if (order.vendor.id && !this.vendorCache[order.vendor.id]) {
            this.vendorService.getVendorById(order.vendor.id).subscribe({
              next: (vendor) => {
                this.vendorCache[order.vendor.id] = vendor;
                order.vendor.name = vendor.businessName || vendor.fullName || '';
                order.vendor.email = vendor.emailAddress || '';
                order.vendor.phone = vendor.contactNumber ? vendor.contactNumber.toString() : '';
                order.vendor.logo = vendor.profilePictureUrl || '';
              }
            });
          } else if (order.vendor.id && this.vendorCache[order.vendor.id]) {
            const vendor = this.vendorCache[order.vendor.id];
            order.vendor.name = vendor.businessName || vendor.fullName || '';
            order.vendor.email = vendor.emailAddress || '';
            order.vendor.phone = vendor.contactNumber ? vendor.contactNumber.toString() : '';
            order.vendor.logo = vendor.profilePictureUrl || '';
          }
        });
      },
      error: (err) => {
        this.error = err.message || 'Failed to load orders.';
        this.isLoading = false;
        this.orderStats = [];
      }
    });
  }

  mapBackendOrderToUI(order: BackendOrder): Order {
    const normalizedStatus = this.normalizeOrderStatus(order.orderStatus);
    return {
      id: order.orderId || '',
      customer: {
        id: order.customerId || '',
        name: '',
        email: '',
        phone: '',
        avatar: ''
      },
      vendor: {
        id: order.vendorId || '',
        name: '',
        email: '',
        phone: '',
        logo: ''
      },
      amount: order.finalAmount || order.totalAmount || 0,
      status: normalizedStatus,
      paymentStatus: this.normalizePaymentStatus(order.paymentStatus, order.paymentMethod),
      placedOn: order.orderDateTime ? new Date(order.orderDateTime) : new Date(),
      products: order.orderItems || order.productList || []
    };
  }

  private normalizeOrderStatus(status?: string): Order['status'] {
    const value = (status || '').toLowerCase();
    if (value === 'delivered') return 'delivered';
    if (value === 'cancelled' || value === 'canceled' || value === 'returned') return 'cancelled';
    if (value === 'shipped' || value === 'out_for_delivery' || value === 'out for delivery' || value === 'dispatched') return 'dispatched';
    return 'pending';
  }

  private normalizePaymentStatus(paymentStatus?: string, paymentMethod?: string): Order['paymentStatus'] {
    const status = (paymentStatus || '').toLowerCase();
    if (status.includes('paid') || status.includes('success')) return 'paid';
    if (status.includes('fail') || status.includes('refund')) return 'failed';
    if ((paymentMethod || '').toLowerCase() === 'cod') return 'pending';
    return status ? 'pending' : 'pending';
  }

  private calculateOrderStats(): void {
    const total = this.orders.length;
    const pending = this.orders.filter(o => o.status === 'pending').length;
    const dispatched = this.orders.filter(o => o.status === 'dispatched').length;
    const delivered = this.orders.filter(o => o.status === 'delivered').length;
    const cancelled = this.orders.filter(o => o.status === 'cancelled').length;

    this.orderStats = [
      { type: 'total', label: 'Total Orders', count: total, icon: 'fas fa-shopping-cart', change: 0 },
      { type: 'pending', label: 'Pending Orders', count: pending, icon: 'fas fa-clock', change: 0 },
      { type: 'dispatched', label: 'Dispatched', count: dispatched, icon: 'fas fa-shipping-fast', change: 0 },
      { type: 'delivered', label: 'Delivered', count: delivered, icon: 'fas fa-check-circle', change: 0 },
      { type: 'cancelled', label: 'Cancelled', count: cancelled, icon: 'fas fa-times-circle', change: 0 }
    ];
  }

  extractVendors(): void {
    const vendorMap: { [id: string]: Vendor } = {};
    this.orders.forEach(order => {
      if (order.vendor && order.vendor.id && !vendorMap[order.vendor.id]) {
        vendorMap[order.vendor.id] = order.vendor;
      }
    });
    this.vendors = Object.values(vendorMap);
  }

  refreshOrders(): void {
    this.fetchOrders();
    this.selectedOrders = [];
    this.allSelected = false;
  }

  // Search and Filter Methods
  onSearch(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.orders];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(term) ||
        order.customer.name.toLowerCase().includes(term) ||
        order.vendor.name.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    // Vendor filter
    if (this.selectedVendor) {
      filtered = filtered.filter(order => order.vendor.id === this.selectedVendor);
    }

    // Date range filter
    if (this.startDate) {
      const start = new Date(this.startDate);
      filtered = filtered.filter(order => order.placedOn >= start);
    }

    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => order.placedOn <= end);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return b.placedOn.getTime() - a.placedOn.getTime();
        case 'oldest':
          return a.placedOn.getTime() - b.placedOn.getTime();
        case 'amount-high':
          return b.amount - a.amount;
        case 'amount-low':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    this.filteredOrders = filtered;
    this.totalOrders = filtered.length;
    this.totalPages = Math.ceil(this.totalOrders / this.pageSize);
    this.currentPage = 1;
  }

  // Selection Methods
  toggleSelectAll(): void {
    this.allSelected = !this.allSelected;
    if (this.allSelected) {
      this.selectedOrders = this.getCurrentPageOrders().map(order => order.id);
    } else {
      this.selectedOrders = [];
    }
  }

  toggleOrderSelection(orderId: string): void {
    const index = this.selectedOrders.indexOf(orderId);
    if (index > -1) {
      this.selectedOrders.splice(index, 1);
    } else {
      this.selectedOrders.push(orderId);
    }
    this.updateAllSelectedState();
  }

  isOrderSelected(orderId: string): boolean {
    return this.selectedOrders.includes(orderId);
  }

  updateAllSelectedState(): void {
    const currentPageOrders = this.getCurrentPageOrders();
    this.allSelected = currentPageOrders.length > 0 && 
                      currentPageOrders.every(order => this.isOrderSelected(order.id));
  }

  // Pagination Methods
  getCurrentPageOrders(): Order[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredOrders.slice(startIndex, endIndex);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateAllSelectedState();
    }
  }

  // Action Methods
  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetails = true;
  }

  closeOrderDetails(): void {
    this.showOrderDetails = false;
    this.selectedOrder = null;
  }

  editOrder(order: Order): void {
    this.viewOrderDetails(order);
  }

  cancelOrder(order: Order): void {
    if (confirm(`Are you sure you want to cancel order ${order.id}?`)) {
      this.orderService.cancelOrder(order.id)
        .pipe(catchError(() => of(null)))
        .subscribe((updated: BackendOrder | null) => {
          if (!updated) {
            this.snackBar.open('Failed to cancel order', 'Close', { duration: 3000 });
            return;
          }
          this.applyStatusLocally(order.id, 'cancelled');
          this.snackBar.open('Order cancelled', 'Close', { duration: 2500 });
        });
    }
  }

  updateOrderStatus(newStatus: 'pending' | 'dispatched' | 'delivered' | 'cancelled'): void {
    if (this.selectedOrder) {
      const backendStatus = newStatus === 'dispatched' ? 'Shipped' :
                            newStatus === 'delivered' ? 'Delivered' :
                            newStatus === 'cancelled' ? 'Cancelled' : 'Pending';

      this.orderService.updateOrderStatus(this.selectedOrder.id, backendStatus)
        .pipe(catchError(() => of(null)))
        .subscribe((updated: BackendOrder | null) => {
          if (!updated) {
            this.snackBar.open('Failed to update order status', 'Close', { duration: 3000 });
            return;
          }
          this.applyStatusLocally(this.selectedOrder!.id, newStatus);
          this.snackBar.open(`Order marked as ${newStatus}`, 'Close', { duration: 2500 });
        });
    }
  }

  processRefund(): void {
    if (this.selectedOrder) {
      this.orderService.updateOrderStatus(this.selectedOrder.id, 'Refunded')
        .pipe(catchError(() => of(null)))
        .subscribe((updated: BackendOrder | null) => {
          if (!updated) {
            this.snackBar.open('Failed to process refund', 'Close', { duration: 3000 });
            return;
          }
          this.applyPaymentStatusLocally(this.selectedOrder!.id, 'failed');
          this.snackBar.open('Refund processed', 'Close', { duration: 2500 });
        });
    }
  }

  // Bulk Actions
  bulkDispatch(): void {
    if (this.selectedOrders.length === 0) return;
    if (confirm(`Mark ${this.selectedOrders.length} orders as dispatched?`)) {
      const calls = this.selectedOrders.map(orderId =>
        this.orderService.updateOrderStatus(orderId, 'Shipped').pipe(catchError(() => of(null)))
      );
      forkJoin(calls).subscribe(results => {
        const okIds = this.selectedOrders.filter((_, idx) => !!results[idx]);
        okIds.forEach(id => this.applyStatusLocally(id, 'dispatched', false));
        this.finishBulkAction(okIds.length, this.selectedOrders.length, 'dispatched');
      });
    }
  }

  bulkDeliver(): void {
    if (this.selectedOrders.length === 0) return;
    if (confirm(`Mark ${this.selectedOrders.length} orders as delivered?`)) {
      const calls = this.selectedOrders.map(orderId =>
        this.orderService.updateOrderStatus(orderId, 'Delivered').pipe(catchError(() => of(null)))
      );
      forkJoin(calls).subscribe(results => {
        const okIds = this.selectedOrders.filter((_, idx) => !!results[idx]);
        okIds.forEach(id => this.applyStatusLocally(id, 'delivered', false));
        this.finishBulkAction(okIds.length, this.selectedOrders.length, 'delivered');
      });
    }
  }

  bulkCancel(): void {
    if (this.selectedOrders.length === 0) return;
    if (confirm(`Cancel ${this.selectedOrders.length} orders?`)) {
      const calls = this.selectedOrders.map(orderId =>
        this.orderService.cancelOrder(orderId).pipe(catchError(() => of(null)))
      );
      forkJoin(calls).subscribe(results => {
        const okIds = this.selectedOrders.filter((_, idx) => !!results[idx]);
        okIds.forEach(id => this.applyStatusLocally(id, 'cancelled', false));
        this.finishBulkAction(okIds.length, this.selectedOrders.length, 'cancelled');
      });
    }
  }

  exportToExcel(): void {
    const selectedOrdersData = this.orders.filter(order => this.selectedOrders.includes(order.id));
    const source = selectedOrdersData.length > 0 ? selectedOrdersData : this.filteredOrders;
    
    // Create CSV content
    const csvContent = this.convertToCSV(source);
    this.downloadCSV(csvContent, 'orders-export.csv');
    this.snackBar.open(`Exported ${source.length} order(s)`, 'Close', { duration: 2500 });
  }

  private applyStatusLocally(orderId: string, status: Order['status'], recalc: boolean = true): void {
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      this.orders[index].status = status;
      if (this.selectedOrder?.id === orderId) {
        this.selectedOrder.status = status;
      }
    }
    if (recalc) {
      this.applyFilters();
      this.calculateOrderStats();
    }
  }

  private applyPaymentStatusLocally(orderId: string, paymentStatus: Order['paymentStatus']): void {
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      this.orders[index].paymentStatus = paymentStatus;
      if (this.selectedOrder?.id === orderId) {
        this.selectedOrder.paymentStatus = paymentStatus;
      }
    }
    this.applyFilters();
    this.calculateOrderStats();
  }

  private finishBulkAction(successCount: number, total: number, action: string): void {
    this.applyFilters();
    this.calculateOrderStats();
    this.selectedOrders = [];
    this.allSelected = false;

    if (successCount === total) {
      this.snackBar.open(`Marked ${successCount} order(s) as ${action}`, 'Close', { duration: 2500 });
    } else if (successCount > 0) {
      this.snackBar.open(`${successCount}/${total} order(s) updated`, 'Close', { duration: 3000 });
    } else {
      this.snackBar.open('No orders were updated', 'Close', { duration: 3000 });
    }
  }

  private convertToCSV(orders: Order[]): string {
    const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Vendor Name', 'Amount', 'Status', 'Payment Status', 'Placed On'];
    const rows = orders.map(order => [
      order.id,
      order.customer.name,
      order.customer.email,
      order.vendor.name,
      order.amount.toString(),
      order.status,
      order.paymentStatus,
      order.placedOn.toISOString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
