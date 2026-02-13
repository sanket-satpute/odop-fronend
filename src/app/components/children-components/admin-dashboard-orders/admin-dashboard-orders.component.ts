import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrderService } from 'src/app/project/services/order.service';
import { Order as BackendOrder } from 'src/app/project/models/order';
import { CustomerServiceService } from 'src/app/project/services/customer-service.service';
import { VendorServiceService } from 'src/app/project/services/vendor-service.service';
import { CustomerDto } from 'src/app/project/models/customer';
import { VendorDto } from 'src/app/project/models/vendor';

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
    private vendorService: VendorServiceService
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
      }
    });
  }

  mapBackendOrderToUI(order: BackendOrder): Order {
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
      amount: order.totalAmount || 0,
      status: (order.orderStatus as any) || 'pending',
      paymentStatus: (order.paymentMethod as any) || 'paid',
      placedOn: order.orderDateTime ? new Date(order.orderDateTime) : new Date(),
      products: order.productList || []
    };
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

  loadInitialData(): void {
    this.isLoading = true;
    
    // Simulate API call with mock data
    setTimeout(() => {
      this.orders = this.generateMockOrders();
      this.filteredOrders = [...this.orders];
      this.totalOrders = this.orders.length;
      this.totalPages = Math.ceil(this.totalOrders / this.pageSize);
      this.isLoading = false;
    }, 1000);
  }

  loadOrderStats(): void {
    // Mock stats data
    this.orderStats = [
      {
        type: 'total',
        label: 'Total Orders',
        count: 1247,
        icon: 'fas fa-shopping-cart',
        change: 12.5
      },
      {
        type: 'pending',
        label: 'Pending Orders',
        count: 89,
        icon: 'fas fa-clock',
        change: -3.2
      },
      {
        type: 'dispatched',
        label: 'Dispatched',
        count: 156,
        icon: 'fas fa-shipping-fast',
        change: 8.1
      },
      {
        type: 'delivered',
        label: 'Delivered',
        count: 987,
        icon: 'fas fa-check-circle',
        change: 15.3
      },
      {
        type: 'cancelled',
        label: 'Cancelled',
        count: 15,
        icon: 'fas fa-times-circle',
        change: -5.7
      }
    ];
  }

  loadVendors(): void {
    // Mock vendors data
    this.vendors = [
      { id: '1', name: 'TechStore Pro', email: 'contact@techstore.com', phone: '+91 98765 43210', logo: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=TS' },
      { id: '2', name: 'Fashion Hub', email: 'info@fashionhub.com', phone: '+91 87654 32109', logo: 'https://via.placeholder.com/40x40/EC4899/FFFFFF?text=FH' },
      { id: '3', name: 'Home Essentials', email: 'support@homeessentials.com', phone: '+91 76543 21098', logo: 'https://via.placeholder.com/40x40/10B981/FFFFFF?text=HE' },
      { id: '4', name: 'Sports World', email: 'orders@sportsworld.com', phone: '+91 65432 10987', logo: 'https://via.placeholder.com/40x40/F59E0B/FFFFFF?text=SW' },
      { id: '5', name: 'Book Palace', email: 'hello@bookpalace.com', phone: '+91 54321 09876', logo: 'https://via.placeholder.com/40x40/8B5CF6/FFFFFF?text=BP' }
    ];
  }

  generateMockOrders(): Order[] {
    const mockOrders: Order[] = [];
    const statuses: ('pending' | 'dispatched' | 'delivered' | 'cancelled')[] = ['pending', 'dispatched', 'delivered', 'cancelled'];
    const paymentStatuses: ('paid' | 'pending' | 'failed')[] = ['paid', 'pending', 'failed'];
    
    const customers: Customer[] = [
      { id: '1', name: 'Rajesh Kumar', email: 'rajesh.kumar@email.com', phone: '+91 98765 43210', avatar: 'https://via.placeholder.com/40x40/3B82F6/FFFFFF?text=RK' },
      { id: '2', name: 'Priya Sharma', email: 'priya.sharma@email.com', phone: '+91 87654 32109', avatar: 'https://via.placeholder.com/40x40/EC4899/FFFFFF?text=PS' },
      { id: '3', name: 'Amit Patel', email: 'amit.patel@email.com', phone: '+91 76543 21098', avatar: 'https://via.placeholder.com/40x40/10B981/FFFFFF?text=AP' },
      { id: '4', name: 'Sneha Gupta', email: 'sneha.gupta@email.com', phone: '+91 65432 10987', avatar: 'https://via.placeholder.com/40x40/F59E0B/FFFFFF?text=SG' },
      { id: '5', name: 'Vikram Singh', email: 'vikram.singh@email.com', phone: '+91 54321 09876', avatar: 'https://via.placeholder.com/40x40/8B5CF6/FFFFFF?text=VS' }
    ];

    for (let i = 1; i <= 50; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const vendor = this.vendors[Math.floor(Math.random() * this.vendors.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      
      mockOrders.push({
        id: `ORD${String(i).padStart(6, '0')}`,
        customer: customer,
        vendor: vendor,
        amount: Math.floor(Math.random() * 50000) + 500,
        status: status,
        paymentStatus: paymentStatus,
        placedOn: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        products: []
      });
    }

    return mockOrders.sort((a, b) => b.placedOn.getTime() - a.placedOn.getTime());
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
    console.log('Edit order:', order);
    // Implement edit functionality
  }

  cancelOrder(order: Order): void {
    if (confirm(`Are you sure you want to cancel order ${order.id}?`)) {
      const index = this.orders.findIndex(o => o.id === order.id);
      if (index > -1) {
        this.orders[index].status = 'cancelled';
        this.applyFilters();
      }
    }
  }

  updateOrderStatus(newStatus: 'pending' | 'dispatched' | 'delivered' | 'cancelled'): void {
    if (this.selectedOrder) {
      const index = this.orders.findIndex(o => o.id === this.selectedOrder!.id);
      if (index > -1) {
        this.orders[index].status = newStatus;
        this.selectedOrder.status = newStatus;
        this.applyFilters();
      }
    }
  }

  processRefund(): void {
    if (this.selectedOrder) {
      console.log('Processing refund for order:', this.selectedOrder.id);
      // Implement refund functionality
    }
  }

  // Bulk Actions
  bulkDispatch(): void {
    if (confirm(`Mark ${this.selectedOrders.length} orders as dispatched?`)) {
      this.selectedOrders.forEach(orderId => {
        const index = this.orders.findIndex(o => o.id === orderId);
        if (index > -1 && this.orders[index].status === 'pending') {
          this.orders[index].status = 'dispatched';
        }
      });
      this.applyFilters();
      this.selectedOrders = [];
      this.allSelected = false;
    }
  }

  bulkDeliver(): void {
    if (confirm(`Mark ${this.selectedOrders.length} orders as delivered?`)) {
      this.selectedOrders.forEach(orderId => {
        const index = this.orders.findIndex(o => o.id === orderId);
        if (index > -1 && this.orders[index].status === 'dispatched') {
          this.orders[index].status = 'delivered';
        }
      });
      this.applyFilters();
      this.selectedOrders = [];
      this.allSelected = false;
    }
  }

  bulkCancel(): void {
    if (confirm(`Cancel ${this.selectedOrders.length} orders?`)) {
      this.selectedOrders.forEach(orderId => {
        const index = this.orders.findIndex(o => o.id === orderId);
        if (index > -1 && this.orders[index].status !== 'delivered') {
          this.orders[index].status = 'cancelled';
        }
      });
      this.applyFilters();
      this.selectedOrders = [];
      this.allSelected = false;
    }
  }

  exportToExcel(): void {
    console.log('Exporting orders to Excel...');
    // Implement Excel export functionality
    const selectedOrdersData = this.orders.filter(order => 
      this.selectedOrders.includes(order.id)
    );
    
    // Create CSV content
    const csvContent = this.convertToCSV(selectedOrdersData);
    this.downloadCSV(csvContent, 'orders-export.csv');
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