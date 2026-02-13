import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ReturnService, ReturnRequest, ReturnPolicy as ServiceReturnPolicy, CreateReturnRequest } from '../../services/return.service';
import { OrderService } from '../../project/services/order.service';
import { UserStateService } from '../../project/services/user-state.service';
import { Order } from '../../project/models/order';
import { MatSnackBar } from '@angular/material/snack-bar';

interface ReturnItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  orderDate: Date;
  returnDate?: Date;
  status: 'eligible' | 'processing' | 'approved' | 'rejected' | 'completed' | 'refunded';
  reason?: string;
  refundAmount?: number;
  vendorName: string;
  vendorId: string;
}

interface ReturnPolicyDisplay {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-order-returns-page',
  templateUrl: './order-returns-page.component.html',
  styleUrls: ['./order-returns-page.component.css']
})
export class OrderReturnsPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  activeTab: 'eligible' | 'history' = 'eligible';
  selectedItems: string[] = [];
  returnReason: string = '';
  additionalComments: string = '';
  showReturnForm: boolean = false;
  currentReturnItem: ReturnItem | null = null;
  
  // Loading states
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  
  // Data from API
  eligibleItems: ReturnItem[] = [];
  returnHistory: ReturnItem[] = [];
  customerId: string = '';

  returnReasons: string[] = [
    'Product damaged during delivery',
    'Wrong product received',
    'Product does not match description',
    'Size/Fit issue',
    'Color mismatch from images',
    'Quality not as expected',
    'Changed my mind',
    'Other'
  ];

  policies: ReturnPolicyDisplay[] = [
    {
      title: '15-Day Return Window',
      description: 'Return most items within 15 days of delivery for a full refund',
      icon: 'fa-calendar-check'
    },
    {
      title: 'Free Return Shipping',
      description: 'We cover the cost of return shipping for defective items',
      icon: 'fa-truck'
    },
    {
      title: 'Easy Refunds',
      description: 'Refunds processed within 5-7 business days to original payment method',
      icon: 'fa-money-bill-wave'
    },
    {
      title: 'Exchange Option',
      description: 'Exchange for a different size or color at no extra cost',
      icon: 'fa-exchange-alt'
    }
  ];

  constructor(
    private router: Router,
    private returnService: ReturnService,
    private orderService: OrderService,
    private userStateService: UserStateService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserAndData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserAndData(): void {
    const user = this.userStateService.getCurrentUser();
    // Type check: CustomerDto has customerId, VendorDto has vendorId
    if (user && 'customerId' in user && user.customerId) {
      this.customerId = user.customerId;
      this.loadData();
    } else {
      // Try to get customer ID from local storage or redirect to login
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        this.customerId = parsed.customerId || parsed.id;
        this.loadData();
      } else {
        this.isLoading = false;
        this.errorMessage = 'Please log in to view your returns';
      }
    }
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Load both eligible orders and return history in parallel
    forkJoin({
      orders: this.orderService.getOrdersByCustomerId(this.customerId),
      returns: this.returnService.getMyReturns()
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ orders, returns }) => {
        // Process eligible items from delivered orders
        this.processEligibleItems(orders);
        
        // Process return history
        this.processReturnHistory(returns?.returns || []);
      },
      error: (error) => {
        console.error('Error loading return data:', error);
        this.loadFallbackData();
      }
    });
  }

  private processEligibleItems(orders: Order[]): void {
    const returnWindowDays = 15;
    const now = new Date();

    this.eligibleItems = [];

    orders.forEach(order => {
      // Only process delivered orders
      if (order.orderStatus === 'Delivered' || order.orderStatus === 'DELIVERED') {
        const deliveryDate = new Date(order.orderDateTime || '');
        const daysSinceDelivery = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));

        // Check if within return window
        if (daysSinceDelivery <= returnWindowDays) {
          // Process items from productList (Order has productList: ProdOrder[])
          if (order.productList && order.productList.length > 0) {
            order.productList.forEach(item => {
              this.eligibleItems.push({
                id: `${order.orderId}-${item.productId}`,
                orderId: order.orderId || '',
                productId: item.productId || '',
                productName: item.productName || 'Product',
                productImage: 'assets/images/product-placeholder.jpg',
                quantity: item.quantity || 1,
                price: item.totalAmount || item.pricePerUnit || 0,
                orderDate: deliveryDate,
                status: 'eligible',
                vendorName: 'Local Artisan',
                vendorId: item.vendorId || order.vendorId || ''
              });
            });
          }
        }
      }
    });
  }

  private processReturnHistory(returns: ReturnRequest[]): void {
    this.returnHistory = returns.map(ret => ({
      id: ret.id,
      orderId: ret.orderId,
      productId: ret.productId,
      productName: ret.productName,
      productImage: ret.productImage,
      quantity: ret.quantity,
      price: ret.itemPrice,
      orderDate: new Date(ret.createdAt),
      returnDate: ret.resolvedAt ? new Date(ret.resolvedAt) : undefined,
      status: this.mapReturnStatus(ret.status),
      reason: ret.reason,
      refundAmount: ret.refundDetails?.refundAmount || ret.returnAmount,
      vendorName: ret.vendorName,
      vendorId: ret.vendorId
    }));
  }

  private mapReturnStatus(status: string): 'eligible' | 'processing' | 'approved' | 'rejected' | 'completed' | 'refunded' {
    const statusMap: { [key: string]: any } = {
      'PENDING': 'processing',
      'PROCESSING': 'processing',
      'APPROVED': 'approved',
      'REJECTED': 'rejected',
      'COMPLETED': 'completed',
      'REFUNDED': 'refunded',
      'CANCELLED': 'rejected'
    };
    return statusMap[status.toUpperCase()] || 'processing';
  }

  private loadFallbackData(): void {
    // Fallback demo data
    this.eligibleItems = [
      {
        id: '1',
        orderId: 'ORD-2024-001',
        productId: 'prod-1',
        productName: 'Banarasi Silk Saree - Royal Blue',
        productImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200',
        quantity: 1,
        price: 8500,
        orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'eligible',
        vendorName: 'Silk Emporium',
        vendorId: 'v1'
      },
      {
        id: '2',
        orderId: 'ORD-2024-002',
        productId: 'prod-2',
        productName: 'Brass Dhokra Art Figurine',
        productImage: 'https://images.unsplash.com/photo-1578301978018-3e5e62ef34d1?w=200',
        quantity: 2,
        price: 1500,
        orderDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        status: 'eligible',
        vendorName: 'Tribal Treasures',
        vendorId: 'v2'
      }
    ];

    this.returnHistory = [
      {
        id: '4',
        orderId: 'ORD-2023-098',
        productId: 'prod-4',
        productName: 'Pashmina Shawl',
        productImage: 'https://images.unsplash.com/photo-1601244005535-a48d21d951ac?w=200',
        quantity: 1,
        price: 12000,
        orderDate: new Date('2023-12-20'),
        returnDate: new Date('2023-12-28'),
        status: 'refunded',
        reason: 'Color mismatch',
        refundAmount: 12000,
        vendorName: 'Kashmir Crafts',
        vendorId: 'v4'
      }
    ];
  }

  setActiveTab(tab: 'eligible' | 'history'): void {
    this.activeTab = tab;
  }

  toggleItemSelection(itemId: string): void {
    const index = this.selectedItems.indexOf(itemId);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(itemId);
    }
  }

  isSelected(itemId: string): boolean {
    return this.selectedItems.includes(itemId);
  }

  openReturnForm(item: ReturnItem): void {
    this.currentReturnItem = item;
    this.showReturnForm = true;
    this.returnReason = '';
    this.additionalComments = '';
  }

  closeReturnForm(): void {
    this.showReturnForm = false;
    this.currentReturnItem = null;
    this.returnReason = '';
    this.additionalComments = '';
  }

  submitReturn(): void {
    if (!this.currentReturnItem || !this.returnReason) return;

    this.isSubmitting = true;

    const returnRequest: CreateReturnRequest = {
      orderId: this.currentReturnItem.orderId,
      orderItemId: this.currentReturnItem.id,
      productId: this.currentReturnItem.productId,
      returnType: 'REFUND',
      reason: this.returnReason,
      reasonDetails: this.additionalComments,
      quantity: this.currentReturnItem.quantity
    };

    this.returnService.createReturn(returnRequest).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Return request submitted successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });

          // Move item to history
          const returnedItem: ReturnItem = {
            ...this.currentReturnItem!,
            status: 'processing',
            returnDate: new Date(),
            reason: this.returnReason
          };

          this.returnHistory.unshift(returnedItem);
          this.eligibleItems = this.eligibleItems.filter(i => i.id !== this.currentReturnItem?.id);

          this.closeReturnForm();
          this.activeTab = 'history';
        } else {
          this.snackBar.open(response.message || 'Failed to submit return request', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Error submitting return:', error);
        this.snackBar.open('Failed to submit return request. Please try again.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        
        // For demo, still move the item
        const returnedItem: ReturnItem = {
          ...this.currentReturnItem!,
          status: 'processing',
          returnDate: new Date(),
          reason: this.returnReason
        };

        this.returnHistory.unshift(returnedItem);
        this.eligibleItems = this.eligibleItems.filter(i => i.id !== this.currentReturnItem?.id);

        this.closeReturnForm();
        this.activeTab = 'history';
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'eligible': 'status-eligible',
      'processing': 'status-processing',
      'approved': 'status-approved',
      'rejected': 'status-rejected',
      'completed': 'status-completed',
      'refunded': 'status-refunded'
    };
    return classes[status] || '';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'eligible': 'Eligible for Return',
      'processing': 'Processing',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'completed': 'Completed',
      'refunded': 'Refunded'
    };
    return texts[status] || status;
  }

  getDaysRemaining(orderDate: Date): number {
    const returnWindow = 15;
    const daysSinceOrder = Math.floor((new Date().getTime() - new Date(orderDate).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, returnWindow - daysSinceOrder);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  navigateToOrder(orderId: string): void {
    this.router.navigate(['/track-order', orderId]);
  }

  navigateToSupport(): void {
    this.router.navigate(['/support']);
  }

  retryLoad(): void {
    this.loadData();
  }
}
