import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrderService } from 'src/app/project/services/order.service';
import { CustomerServiceService } from 'src/app/project/services/customer-service.service';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { CustomerDto } from 'src/app/project/models/customer';
import { Order as BackendOrder } from 'src/app/project/models/order';

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
export class VendorDashboardOrdersComponent  implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Component state
  orders: Order[] = [];
  filteredOrders: Order[] = [];
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

  private customerCache: { [id: string]: CustomerDto } = {};

  constructor(
    private orderService: OrderService,
    private customerService: CustomerServiceService,
    private userState: UserStateService
  ) {}

  private autoRefreshInterval: any;

  ngOnInit(): void {
    this.fetchOrders();
    this.setupSearchDebounce();
    // Auto-refresh every 60 seconds
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
    // Setup debounced search
    const searchSubject = new Subject<string>();
    searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((query) => {
        this.performSearch(query);
      });
  }

  fetchOrders(): void {
    this.isLoading = true;
    this.error = null;
    const vendor = this.userState.vendor;
    if (!vendor || !vendor.vendorId) {
      this.isLoading = false;
      this.error = 'Vendor not logged in.';
      return;
    }
    this.orderService.getOrdersByVendorId(vendor.vendorId).subscribe({
      next: (orders: BackendOrder[]) => {
        // Map backend orders to UI model and fetch customer info
        const mappedOrders: Order[] = orders.map(o => this.mapBackendOrderToUI(o));
        this.orders = mappedOrders;
        this.filteredOrders = [...this.orders];
        this.updateStats();
        this.updatePagination();
        // Fetch customer info for all orders (cache for performance)
        const customerIds = Array.from(new Set(mappedOrders.map(o => o.customer.id).filter((id): id is string => !!id)));
        const missingIds = customerIds.filter(id => !this.customerCache[id]);
        if (missingIds.length > 0) {
          forkJoin(
            missingIds.map(id =>
              this.customerService.getCustomerById(id).pipe(
                takeUntil(this.destroy$),
                // fallback to empty object if error
                catchError(() => of({ customerId: id } as CustomerDto))
              )
            )
          ).subscribe(customers => {
            customers.forEach((customer, idx) => {
              this.customerCache[missingIds[idx]] = customer;
            });
            this.applyCustomerInfo();
          });
        } else {
          this.applyCustomerInfo();
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load orders.';
        this.isLoading = false;
      }
    });
  }

  private applyCustomerInfo(): void {
    this.orders.forEach(order => {
      if (!order.customer.id) return;
      const customer = this.customerCache[order.customer.id];
      if (customer) {
        order.customer.name = customer.fullName || '';
        order.customer.email = customer.emailAddress || '';
        order.customer.phone = customer.contactNumber ? customer.contactNumber.toString() : '';
        order.customer.address = customer.address || '';
        order.customer.avatar = customer.profilePicturePath || '';
      }
    });
  }

  private mapBackendOrderToUI(order: BackendOrder): Order {
    return {
      id: order.orderId || '',
      customer: {
        name: '',
        email: '',
        phone: '',
        address: '',
        avatar: '',
        // id for lookup
        ...(order.customerId ? { id: order.customerId } : {})
      } as any,
      items: (order.productList || []).map((prod: any) => ({
        id: prod.productId || '',
        name: prod.productName || '',
        price: prod.price || 0,
        quantity: prod.quantity || 1,
        image: prod.productImage || ''
      })),
      itemsCount: (order.productList || []).length,
      total: order.totalAmount || 0,
      status: (order.orderStatus as any) || 'pending',
      createdAt: order.orderDateTime ? new Date(order.orderDateTime) : new Date(),
      timeline: {
        placed: true,
        accepted: ['processing', 'shipped', 'delivered'].includes((order.orderStatus || '').toLowerCase()),
        shipped: ['shipped', 'delivered'].includes((order.orderStatus || '').toLowerCase()),
        delivered: (order.orderStatus || '').toLowerCase() === 'delivered'
      },
      notes: ''
    };
  }

  private generateMockOrders(): Order[] {
    const mockOrders: Order[] = [];
    const customers = [
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@email.com',
        phone: '+91 98765 43210',
        address: '123 MG Road, Pune, Maharashtra 411001',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@email.com',
        phone: '+91 98765 43211',
        address: '456 FC Road, Pune, Maharashtra 411004',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
      },
      {
        name: 'Amit Kumar',
        email: 'amit.kumar@email.com',
        phone: '+91 98765 43212',
        address: '789 Koregaon Park, Pune, Maharashtra 411001',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
      },
      {
        name: 'Sneha Desai',
        email: 'sneha.desai@email.com',
        phone: '+91 98765 43213',
        address: '321 Baner Road, Pune, Maharashtra 411045',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
      },
      {
        name: 'Vikram Singh',
        email: 'vikram.singh@email.com',
        phone: '+91 98765 43214',
        address: '654 Wakad, Pune, Maharashtra 411057',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
      }
    ];

    const items = [
      {
        name: 'Wireless Headphones',
        price: 2499,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop'
      },
      {
        name: 'Smartphone Case',
        price: 799,
        image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=100&h=100&fit=crop'
      },
      {
        name: 'Bluetooth Speaker',
        price: 3999,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=100&h=100&fit=crop'
      },
      {
        name: 'Laptop Stand',
        price: 1299,
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&h=100&fit=crop'
      },
      {
        name: 'USB Cable',
        price: 299,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop'
      }
    ];

    const statuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    for (let i = 1; i <= 50; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const orderItems: OrderItem[] = [];
      const itemCount = Math.floor(Math.random() * 4) + 1;

      for (let j = 0; j < itemCount; j++) {
        const item = items[Math.floor(Math.random() * items.length)];
        orderItems.push({
          id: `item-${i}-${j}`,
          name: item.name,
          price: item.price,
          quantity: Math.floor(Math.random() * 3) + 1,
          image: item.image
        });
      }

      const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const createdAt = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));

      const timeline: OrderTimeline = {
        placed: true,
        accepted: status !== 'pending',
        shipped: status === 'shipped' || status === 'delivered',
        delivered: status === 'delivered'
      };

      mockOrders.push({
        id: `ORD${String(i).padStart(4, '0')}`,
        customer,
        items: orderItems,
        itemsCount: itemCount,
        total,
        status,
        createdAt,
        timeline,
        notes: ''
      });
    }

    return mockOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private updateStats(): void {
    this.totalOrders = this.orders.length;
    this.pendingOrders = this.orders.filter(order => order.status === 'pending').length;
    this.deliveredOrders = this.orders.filter(order => order.status === 'delivered').length;
    this.cancelledOrders = this.orders.filter(order => order.status === 'cancelled').length;
  }

  private updatePagination(): void {
    this.totalItems = this.filteredOrders.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredOrders = this.filteredOrders.slice(startIndex, endIndex);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.performSearch(this.searchQuery);
  }

  private performSearch(query: string): void {
    let filtered = [...this.orders];

    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm) ||
        order.customer.name.toLowerCase().includes(searchTerm) ||
        order.customer.email.toLowerCase().includes(searchTerm)
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    if (this.selectedDateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (this.selectedDateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(order => order.createdAt >= startDate);
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
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  markAsShipped(orderId: string, event: Event): void {
    event.stopPropagation();
    this.isLoading = true;
    this.orderService.updateOrderStatus(orderId, 'shipped').subscribe({
      next: () => {
        this.fetchOrders();
      },
      error: (err) => {
        this.error = err.message || 'Failed to update order status.';
        this.isLoading = false;
      }
    });
  }

  cancelOrder(orderId: string, event: Event): void {
    event.stopPropagation();
    this.isLoading = true;
    this.orderService.updateOrderStatus(orderId, 'cancelled').subscribe({
      next: () => {
        this.fetchOrders();
      },
      error: (err) => {
        this.error = err.message || 'Failed to cancel order.';
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
    const rows = this.orders.map(order => [
      order.id,
      order.customer.name,
      order.customer.email,
      order.itemsCount.toString(),
      order.total.toString(),
      order.status,
      order.createdAt.toISOString().split('T')[0]
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }

  // Pagination methods
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
    let end = Math.min(this.totalPages, start + maxPagesToShow - 1);
    
    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Utility methods for template
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getStatusColor(status: Order['status']): string {
    const colors = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      shipped: '#06b6d4',
      delivered: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  }

  getStatusIcon(status: Order['status']): string {
    const icons = {
      pending: 'fas fa-clock',
      processing: 'fas fa-cog',
      shipped: 'fas fa-truck',
      delivered: 'fas fa-check-circle',
      cancelled: 'fas fa-times-circle'
    };
    return icons[status] || 'fas fa-question-circle';
  }

  // Animation trigger methods
  onOrderRowClick(orderId: string): void {
    this.toggleOrderDetails(orderId);
  }

  onStatCardClick(statType: string): void {
    this.selectedStat = statType;
    
    // Filter orders based on selected stat
    switch (statType) {
      case 'pending':
        this.selectedStatus = 'pending';
        break;
      case 'delivered':
        this.selectedStatus = 'delivered';
        break;
      case 'cancelled':
        this.selectedStatus = 'cancelled';
        break;
      default:
        this.selectedStatus = '';
    }
    
    this.performSearch(this.searchQuery);
  }

  // Loading state methods
  async refreshOrders(): Promise<void> {
    this.fetchOrders();
  }

  // Keyboard navigation
  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        if (this.currentPage > 1) {
          this.previousPage();
        }
        break;
      case 'ArrowRight':
        if (this.currentPage < this.totalPages) {
          this.nextPage();
        }
        break;
      case 'Escape':
        this.expandedOrderId = null;
        break;
    }
  }
}