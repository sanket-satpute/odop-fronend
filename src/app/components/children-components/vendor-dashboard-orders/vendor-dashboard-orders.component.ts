import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CustomerDto } from 'src/app/project/models/customer';
import { Order as BackendOrder } from 'src/app/project/models/order';
import { CustomerServiceService } from 'src/app/project/services/customer-service.service';
import { OrderService } from 'src/app/project/services/order.service';
import { UserStateService } from 'src/app/project/services/user-state.service';

export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderTimeline {
  placed: boolean;
  accepted: boolean;
  shipped: boolean;
  delivered: boolean;
}

export interface Order {
  id: string;
  customer: Customer;
  items: OrderItem[];
  itemsCount: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  timeline: OrderTimeline;
  notes: string;
}

@Component({
  selector: 'app-vendor-dashboard-orders',
  templateUrl: './vendor-dashboard-orders.component.html',
  styleUrls: ['./vendor-dashboard-orders.component.css']
})
export class VendorDashboardOrdersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private customerCache: { [id: string]: CustomerDto } = {};
  private autoRefreshInterval: any;
  private readonly fallbackAvatar = 'assets/images/user-avatar.svg';

  // Component state
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  pagedOrders: Order[] = [];
  isLoading = false;
  error: string | null = null;

  // Filter states
  searchQuery = '';
  selectedStatus = '';
  selectedDateRange = 'all';
  selectedStat = 'total';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  // UI states
  expandedOrderId: string | null = null;

  // Stats
  totalOrders = 0;
  pendingOrders = 0;
  deliveredOrders = 0;
  cancelledOrders = 0;

  // Math reference for template
  Math = Math;

  constructor(
    private orderService: OrderService,
    private customerService: CustomerServiceService,
    private userState: UserStateService
  ) {}

  ngOnInit(): void {
    this.fetchOrders();
    this.setupSearchDebounce();
    this.autoRefreshInterval = setInterval(() => this.fetchOrders(), 60000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        this.performSearch(query);
      });
  }

  fetchOrders(): void {
    this.isLoading = true;
    this.error = null;
    const vendor = this.userState.vendor;

    if (!vendor?.vendorId) {
      this.isLoading = false;
      this.error = 'Vendor not logged in.';
      return;
    }

    this.orderService.getOrdersByVendorId(vendor.vendorId).subscribe({
      next: (backendOrders: BackendOrder[]) => {
        this.orders = backendOrders
          .map((order) => this.mapBackendOrderToUI(order))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        this.updateStats();
        this.performSearch(this.searchQuery);

        const customerIds = Array.from(
          new Set(this.orders.map((order) => order.customer.id).filter((id): id is string => !!id))
        );
        const missingIds = customerIds.filter((id) => !this.customerCache[id]);

        if (missingIds.length > 0) {
          forkJoin(
            missingIds.map((id) =>
              this.customerService.getCustomerById(id).pipe(
                takeUntil(this.destroy$),
                catchError(() => of({ customerId: id } as CustomerDto))
              )
            )
          ).subscribe((customers) => {
            customers.forEach((customer, index) => {
              this.customerCache[missingIds[index]] = customer;
            });
            this.applyCustomerInfo();
          });
        } else {
          this.applyCustomerInfo();
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load orders.';
        this.isLoading = false;
      }
    });
  }

  private applyCustomerInfo(): void {
    this.orders.forEach((order) => {
      if (!order.customer.id) {
        return;
      }
      const customer = this.customerCache[order.customer.id];
      if (!customer) {
        return;
      }

      order.customer.name = customer.fullName || order.customer.name;
      order.customer.email = customer.emailAddress || order.customer.email;
      order.customer.phone = customer.contactNumber ? customer.contactNumber.toString() : order.customer.phone;
      order.customer.address = customer.address || order.customer.address;
      order.customer.avatar = customer.profilePicturePath || order.customer.avatar || this.fallbackAvatar;
    });
  }

  private normalizeOrderStatus(status?: string): Order['status'] {
    const normalized = (status || '').trim().toLowerCase();
    if (normalized === 'pending') {
      return 'pending';
    }
    if (normalized === 'processing' || normalized === 'confirmed') {
      return 'processing';
    }
    if (normalized === 'shipped' || normalized === 'out_for_delivery') {
      return 'shipped';
    }
    if (normalized === 'delivered') {
      return 'delivered';
    }
    if (normalized === 'cancelled' || normalized === 'canceled' || normalized === 'returned' || normalized === 'refunded') {
      return 'cancelled';
    }
    return 'pending';
  }

  private mapBackendOrderToUI(order: BackendOrder): Order {
    const status = this.normalizeOrderStatus(order.orderStatus);
    const sourceItems: any[] = (order.orderItems as any[]) || (order.productList as any[]) || [];
    const items = sourceItems.map((item: any, index: number) => ({
      id: item.productId || `item-${index}`,
      name: item.productName || 'Product',
      price: Number(item.unitPrice ?? item.price ?? item.totalPrice ?? 0),
      quantity: Number(item.quantity ?? 1),
      image: item.productImageURL || item.productImage || ''
    }));
    const computedTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      id: order.orderId || '',
      customer: {
        id: order.customerId,
        name: '',
        email: '',
        phone: '',
        address: order.shippingAddress || '',
        avatar: this.fallbackAvatar
      },
      items,
      itemsCount: items.length,
      total: Number(order.finalAmount ?? order.totalAmount ?? computedTotal),
      status,
      createdAt: order.orderDateTime ? new Date(order.orderDateTime) : new Date(),
      timeline: {
        placed: true,
        accepted: ['processing', 'shipped', 'delivered'].includes(status),
        shipped: ['shipped', 'delivered'].includes(status),
        delivered: status === 'delivered'
      },
      notes: order.customerNotes || ''
    };
  }

  private updateStats(): void {
    this.totalOrders = this.orders.length;
    this.pendingOrders = this.orders.filter((order) => order.status === 'pending').length;
    this.deliveredOrders = this.orders.filter((order) => order.status === 'delivered').length;
    this.cancelledOrders = this.orders.filter((order) => order.status === 'cancelled').length;
  }

  private updatePagination(): void {
    this.totalItems = this.filteredOrders.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));

    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedOrders = this.filteredOrders.slice(startIndex, endIndex);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.searchSubject.next(this.searchQuery);
  }

  private performSearch(query: string): void {
    let filtered = [...this.orders];

    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm) ||
          order.customer.name.toLowerCase().includes(searchTerm) ||
          order.customer.email.toLowerCase().includes(searchTerm)
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter((order) => order.status === this.selectedStatus);
    }

    if (this.selectedDateRange !== 'all' && this.selectedDateRange !== 'custom') {
      const now = new Date();
      let startDate = new Date(0);

      if (this.selectedDateRange === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (this.selectedDateRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (this.selectedDateRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      filtered = filtered.filter((order) => order.createdAt >= startDate);
    }

    this.filteredOrders = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  onStatusChange(): void {
    this.performSearch(this.searchQuery);
  }

  onDateRangeChange(): void {
    this.performSearch(this.searchQuery);
  }

  toggleOrderDetails(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  viewOrderDetails(orderId: string, event: Event): void {
    event.stopPropagation();
    this.toggleOrderDetails(orderId);
  }

  markAsShipped(orderId: string, event: Event): void {
    event.stopPropagation();
    this.isLoading = true;
    this.orderService.updateOrderStatus(orderId, 'Shipped').subscribe({
      next: () => this.fetchOrders(),
      error: (err) => {
        this.error = err?.message || 'Failed to update order status.';
        this.isLoading = false;
      }
    });
  }

  cancelOrder(orderId: string, event: Event): void {
    event.stopPropagation();
    this.isLoading = true;
    this.orderService.cancelOrder(orderId).subscribe({
      next: () => this.fetchOrders(),
      error: (err) => {
        this.error = err?.message || 'Failed to cancel order.';
        this.isLoading = false;
      }
    });
  }

  exportOrders(): void {
    const csvContent = this.generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private generateCSVContent(): string {
    const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Items', 'Total', 'Status', 'Date'];
    const rows = this.filteredOrders.map((order) => [
      order.id,
      order.customer.name,
      order.customer.email,
      order.itemsCount.toString(),
      order.total.toFixed(2),
      order.status,
      order.createdAt.toISOString().split('T')[0]
    ]);

    return [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);

    let start = Math.max(1, this.currentPage - half);
    const maxEnd = Math.max(1, this.totalPages);
    let end = Math.min(maxEnd, start + maxPagesToShow - 1);

    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  onOrderRowClick(orderId: string): void {
    this.toggleOrderDetails(orderId);
  }

  onStatCardClick(statType: string): void {
    this.selectedStat = statType;

    if (statType === 'pending') {
      this.selectedStatus = 'pending';
    } else if (statType === 'delivered') {
      this.selectedStatus = 'delivered';
    } else if (statType === 'cancelled') {
      this.selectedStatus = 'cancelled';
    } else {
      this.selectedStatus = '';
    }

    this.performSearch(this.searchQuery);
  }

  async refreshOrders(): Promise<void> {
    this.fetchOrders();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft' && this.currentPage > 1) {
      this.previousPage();
    } else if (event.key === 'ArrowRight' && this.currentPage < this.totalPages) {
      this.nextPage();
    } else if (event.key === 'Escape') {
      this.expandedOrderId = null;
    }
  }
}
