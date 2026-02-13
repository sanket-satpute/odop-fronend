import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { 
  ReturnService, 
  ReturnRequest, 
  CreateReturnRequest, 
  ReturnSummary,
  ReturnPolicy,
  PickupAddress 
} from '../../../services/return.service';
import { OrderService } from '../../../project/services/order.service';
import { Order } from '../../../project/models/order';
import { ProdOrder } from '../../../project/models/prod-order';

type ReturnStep = 'select-order' | 'select-items' | 'reason' | 'pickup' | 'review' | 'confirmation';
type TabType = 'create' | 'track' | 'policy';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  variantInfo?: string;
  quantity: number;
  price: number;
  isReturnable: boolean;
  returnableQuantity: number;
  returnDeadline?: string;
}

@Component({
  selector: 'app-returns-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './returns-page.component.html',
  styleUrls: ['./returns-page.component.css']
})
export class ReturnsPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // UI State
  activeTab: TabType = 'create';
  currentStep: ReturnStep = 'select-order';
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  // Data
  myReturns: ReturnRequest[] = [];
  activeReturn: ReturnRequest | null = null;
  summary: ReturnSummary | null = null;
  policy: ReturnPolicy | null = null;

  // Create Return Flow
  orderId = '';
  selectedOrder: any = null;
  orderItems: OrderItem[] = [];
  selectedItems: Map<string, number> = new Map();
  
  // Forms
  returnReasonForm: FormGroup;
  pickupForm: FormGroup;

  // Reason Options
  returnReasons = [
    { value: 'DAMAGED', label: 'Product damaged during delivery', icon: '📦' },
    { value: 'DEFECTIVE', label: 'Product is defective/not working', icon: '⚠️' },
    { value: 'WRONG_ITEM', label: 'Received wrong item', icon: '🔄' },
    { value: 'NOT_AS_DESCRIBED', label: 'Product not as described', icon: '❌' },
    { value: 'SIZE_FIT', label: 'Size/fit issues', icon: '📏' },
    { value: 'QUALITY', label: 'Quality not satisfactory', icon: '👎' },
    { value: 'CHANGED_MIND', label: 'Changed my mind', icon: '💭' },
    { value: 'OTHER', label: 'Other reason', icon: '📝' }
  ];

  returnTypes = [
    { value: 'REFUND', label: 'Refund to original payment method', icon: '💰' },
    { value: 'EXCHANGE', label: 'Exchange for another item', icon: '🔄' },
    { value: 'STORE_CREDIT', label: 'Store credit (faster processing)', icon: '🎁' }
  ];

  timeSlots = [
    '9:00 AM - 12:00 PM',
    '12:00 PM - 3:00 PM',
    '3:00 PM - 6:00 PM',
    '6:00 PM - 9:00 PM'
  ];

  constructor(
    private returnService: ReturnService,
    private orderService: OrderService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.returnReasonForm = this.fb.group({
      returnType: ['REFUND', Validators.required],
      reason: ['', Validators.required],
      reasonDetails: [''],
      images: [[]]
    });

    this.pickupForm = this.fb.group({
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      landmark: [''],
      contactPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      preferredDate: [''],
      preferredTimeSlot: ['']
    });
  }

  ngOnInit(): void {
    this.subscribeToService();
    this.loadMyReturns();
    this.loadPolicy();
    this.checkRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToService(): void {
    this.returnService.returns$
      .pipe(takeUntil(this.destroy$))
      .subscribe(returns => this.myReturns = returns);

    this.returnService.summary$
      .pipe(takeUntil(this.destroy$))
      .subscribe(summary => this.summary = summary);

    this.returnService.policy$
      .pipe(takeUntil(this.destroy$))
      .subscribe(policy => this.policy = policy);

    this.returnService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.isLoading = loading);

    this.returnService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.errorMessage = error || '');
  }

  private checkRouteParams(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['orderId']) {
        this.orderId = params['orderId'];
        this.lookupOrder();
      }
      if (params['tab']) {
        this.activeTab = params['tab'] as TabType;
      }
    });
  }

  private loadMyReturns(): void {
    this.returnService.getMyReturns().subscribe({
      error: (err) => console.error('Failed to load returns:', err)
    });
  }

  private loadPolicy(): void {
    this.returnService.getReturnPolicy().subscribe({
      error: (err) => console.error('Failed to load return policy:', err)
    });
  }

  // ==================== Tab Navigation ====================

  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
    if (tab === 'track') {
      this.loadMyReturns();
    }
  }

  // ==================== Create Return Flow ====================

  lookupOrder(): void {
    if (!this.orderId.trim()) {
      this.errorMessage = 'Please enter an order ID';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Call the OrderService to get real order data
    this.orderService.getOrderById(this.orderId.trim())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (order: Order) => {
          this.selectedOrder = order;
          this.orderItems = this.mapOrderItemsToReturnableItems(order);
          
          if (this.orderItems.length === 0) {
            this.errorMessage = 'No returnable items found in this order';
          } else {
            this.currentStep = 'select-items';
          }
        },
        error: (error) => {
          console.error('Error fetching order:', error);
          this.errorMessage = 'Order not found. Please check the order ID and try again.';
        }
      });
  }

  /**
   * Map order products to returnable items
   */
  private mapOrderItemsToReturnableItems(order: Order): OrderItem[] {
    if (!order.productList || order.productList.length === 0) {
      return [];
    }

    const now = new Date();
    const returnWindowDays = this.policy?.returnWindowDays || 15;

    return order.productList.map((product: ProdOrder, index: number) => {
      const orderDate = order.orderDateTime ? new Date(order.orderDateTime) : new Date();
      const returnDeadline = new Date(orderDate);
      returnDeadline.setDate(returnDeadline.getDate() + returnWindowDays);
      
      const isWithinReturnWindow = now <= returnDeadline;
      const isDelivered = order.orderStatus?.toLowerCase() === 'delivered';
      const isReturnable = isWithinReturnWindow && isDelivered;

      return {
        id: product.productId || `item-${index}`,
        productId: product.productId || '',
        productName: product.productName || 'Unknown Product',
        productImage: 'assets/images/product-placeholder.svg',
        variantInfo: product.category ? `Category: ${product.category}` : undefined,
        quantity: product.quantity || 1,
        price: product.pricePerUnit || 0,
        isReturnable,
        returnableQuantity: isReturnable ? (product.quantity || 1) : 0,
        returnDeadline: returnDeadline.toISOString()
      };
    });
  }

  toggleItemSelection(item: OrderItem): void {
    if (this.selectedItems.has(item.id)) {
      this.selectedItems.delete(item.id);
    } else {
      this.selectedItems.set(item.id, 1);
    }
  }

  updateItemQuantity(item: OrderItem, qty: number): void {
    if (qty > 0 && qty <= item.returnableQuantity) {
      this.selectedItems.set(item.id, qty);
    }
  }

  isItemSelected(item: OrderItem): boolean {
    return this.selectedItems.has(item.id);
  }

  getSelectedItemQuantity(item: OrderItem): number {
    return this.selectedItems.get(item.id) || 1;
  }

  // ==================== Step Navigation ====================

  nextStep(): void {
    const steps: ReturnStep[] = ['select-order', 'select-items', 'reason', 'pickup', 'review', 'confirmation'];
    const currentIndex = steps.indexOf(this.currentStep);
    if (currentIndex < steps.length - 1) {
      this.currentStep = steps[currentIndex + 1];
    }
  }

  previousStep(): void {
    const steps: ReturnStep[] = ['select-order', 'select-items', 'reason', 'pickup', 'review', 'confirmation'];
    const currentIndex = steps.indexOf(this.currentStep);
    if (currentIndex > 0) {
      this.currentStep = steps[currentIndex - 1];
    }
  }

  canProceedToNext(): boolean {
    switch (this.currentStep) {
      case 'select-order':
        return !!this.orderId.trim();
      case 'select-items':
        return this.selectedItems.size > 0;
      case 'reason':
        return this.returnReasonForm.valid;
      case 'pickup':
        return this.pickupForm.valid;
      default:
        return true;
    }
  }

  getStepNumber(): number {
    const steps: ReturnStep[] = ['select-order', 'select-items', 'reason', 'pickup', 'review'];
    return steps.indexOf(this.currentStep) + 1;
  }

  // ==================== Submit Return ====================

  submitReturn(): void {
    if (!this.canProceedToNext()) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    const selectedItem = Array.from(this.selectedItems.entries())[0];
    const item = this.orderItems.find(i => i.id === selectedItem[0]);

    if (!item) {
      this.errorMessage = 'Please select an item to return';
      this.isSubmitting = false;
      return;
    }

    const request: CreateReturnRequest = {
      orderId: this.orderId,
      orderItemId: selectedItem[0],
      productId: item.productId,
      returnType: this.returnReasonForm.value.returnType,
      reason: this.returnReasonForm.value.reason,
      reasonDetails: this.returnReasonForm.value.reasonDetails,
      quantity: selectedItem[1],
      images: this.returnReasonForm.value.images,
      pickupAddress: this.pickupForm.value as PickupAddress,
      preferredRefundMethod: this.returnReasonForm.value.returnType
    };

    this.returnService.createReturn(request).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.activeReturn = response.returnRequest;
        this.currentStep = 'confirmation';
        this.successMessage = 'Return request submitted successfully!';
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to submit return request';
      }
    });
  }

  // ==================== Track Returns ====================

  viewReturnDetails(returnRequest: ReturnRequest): void {
    this.activeReturn = returnRequest;
  }

  closeReturnDetails(): void {
    this.activeReturn = null;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': '#ff9800',
      'APPROVED': '#4caf50',
      'PICKUP_SCHEDULED': '#2196f3',
      'PICKED_UP': '#9c27b0',
      'RECEIVED': '#00bcd4',
      'INSPECTING': '#ff5722',
      'REFUND_INITIATED': '#8bc34a',
      'COMPLETED': '#4caf50',
      'REJECTED': '#f44336',
      'CANCELLED': '#9e9e9e'
    };
    return colors[status] || '#666';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Pending Review',
      'APPROVED': 'Approved',
      'PICKUP_SCHEDULED': 'Pickup Scheduled',
      'PICKED_UP': 'Picked Up',
      'RECEIVED': 'Received at Warehouse',
      'INSPECTING': 'Under Inspection',
      'REFUND_INITIATED': 'Refund Initiated',
      'COMPLETED': 'Completed',
      'REJECTED': 'Rejected',
      'CANCELLED': 'Cancelled'
    };
    return labels[status] || status;
  }

  // ==================== Helpers ====================

  getTotalRefundAmount(): number {
    let total = 0;
    this.selectedItems.forEach((qty, itemId) => {
      const item = this.orderItems.find(i => i.id === itemId);
      if (item) {
        total += item.price * qty;
      }
    });
    return total;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  startNewReturn(): void {
    this.orderId = '';
    this.selectedOrder = null;
    this.orderItems = [];
    this.selectedItems.clear();
    this.returnReasonForm.reset({ returnType: 'REFUND' });
    this.pickupForm.reset();
    this.currentStep = 'select-order';
    this.activeReturn = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.activeTab = 'create';
  }

  trackByReturnId(index: number, returnRequest: ReturnRequest): string {
    return returnRequest.id;
  }

  trackByItemId(index: number, item: OrderItem): string {
    return item.id;
  }
}
