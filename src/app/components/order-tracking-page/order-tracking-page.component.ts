import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderService } from '../../project/services/order.service';
import { Order } from '../../project/models/order';

interface TrackingStep {
  status: string;
  title: string;
  description: string;
  date?: Date;
  completed: boolean;
  current: boolean;
  icon: string;
}

@Component({
  selector: 'app-order-tracking-page',
  templateUrl: './order-tracking-page.component.html',
  styleUrls: ['./order-tracking-page.component.css']
})
export class OrderTrackingPageComponent implements OnInit, OnDestroy {
  orderId: string = '';
  searchOrderId: string = '';
  order: Order | null = null;
  trackingSteps: TrackingStep[] = [];
  isLoading: boolean = false;
  error: string = '';
  private destroy$ = new Subject<void>();

  readonly statusSteps = [
    { status: 'placed', title: 'Order Placed', icon: 'fas fa-shopping-cart', description: 'Your order has been placed successfully' },
    { status: 'confirmed', title: 'Order Confirmed', icon: 'fas fa-check-circle', description: 'Seller has confirmed your order' },
    { status: 'processing', title: 'Processing', icon: 'fas fa-cog', description: 'Your order is being prepared' },
    { status: 'shipped', title: 'Shipped', icon: 'fas fa-truck', description: 'Your order is on the way' },
    { status: 'out_for_delivery', title: 'Out for Delivery', icon: 'fas fa-shipping-fast', description: 'Order is out for delivery' },
    { status: 'delivered', title: 'Delivered', icon: 'fas fa-box-open', description: 'Order has been delivered' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    // Check for orderId in route params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['orderId']) {
        this.orderId = params['orderId'];
        this.searchOrderId = this.orderId;
        this.trackOrder();
      }
    });

    // Also check query params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['orderId'] && !this.orderId) {
        this.orderId = params['orderId'];
        this.searchOrderId = this.orderId;
        this.trackOrder();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackOrder(): void {
    if (!this.searchOrderId.trim()) {
      this.error = 'Please enter an order ID';
      return;
    }

    this.orderId = this.searchOrderId.trim();
    this.isLoading = true;
    this.error = '';
    this.order = null;

    this.orderService.getOrderById(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          this.order = order;
          this.buildTrackingSteps();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching order:', err);
          this.error = 'Order not found. Please check your order ID and try again.';
          this.isLoading = false;
        }
      });
  }

  private buildTrackingSteps(): void {
    if (!this.order) return;

    const currentStatus = this.order.orderStatus?.toLowerCase() || 'placed';
    let reachedCurrent = false;

    // Handle cancelled/returned orders differently
    if (currentStatus === 'cancelled' || currentStatus === 'returned') {
      this.trackingSteps = this.statusSteps.map((step, index) => ({
        ...step,
        completed: index === 0,
        current: false,
        date: index === 0 ? new Date(this.order!.orderDateTime!) : undefined
      }));
      
      // Add cancelled/returned step
      this.trackingSteps.push({
        status: currentStatus,
        title: currentStatus === 'cancelled' ? 'Order Cancelled' : 'Order Returned',
        icon: 'fas fa-times-circle',
        description: currentStatus === 'cancelled' 
          ? 'Your order has been cancelled' 
          : 'Your order has been returned',
        completed: true,
        current: true,
        date: new Date()
      });
      return;
    }

    this.trackingSteps = this.statusSteps.map(step => {
      const isCompleted = this.isStepCompleted(step.status, currentStatus);
      const isCurrent = step.status === currentStatus;
      
      if (isCurrent) reachedCurrent = true;

      return {
        ...step,
        completed: isCompleted,
        current: isCurrent,
        date: isCompleted || isCurrent ? this.getStepDate(step.status) : undefined
      };
    });
  }

  private isStepCompleted(stepStatus: string, currentStatus: string): boolean {
    const order = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
    const stepIndex = order.indexOf(stepStatus);
    const currentIndex = order.indexOf(currentStatus);
    return stepIndex < currentIndex;
  }

  private getStepDate(status: string): Date {
    // In a real app, you'd get this from order timeline
    // For now, we'll estimate based on order date
    if (!this.order?.orderDateTime) return new Date();
    
    const orderDateTime = new Date(this.order.orderDateTime);
    const order = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
    const stepIndex = order.indexOf(status);
    
    const stepDate = new Date(orderDateTime);
    stepDate.setDate(stepDate.getDate() + stepIndex);
    return stepDate;
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      case 'returned': return 'status-returned';
      case 'shipped':
      case 'out_for_delivery': return 'status-shipping';
      default: return 'status-processing';
    }
  }

  getEstimatedDelivery(): Date {
    if (!this.order?.orderDateTime) return new Date();
    const date = new Date(this.order.orderDateTime);
    date.setDate(date.getDate() + 5); // Add 5 days
    return date;
  }

  goBack(): void {
    this.router.navigate(['/customer-dashboard/orders']);
  }

  contactSupport(): void {
    this.router.navigate(['/contact_us'], { 
      queryParams: { subject: 'Order Issue', orderId: this.orderId } 
    });
  }

  copyOrderId(): void {
    navigator.clipboard.writeText(this.orderId);
    // Could add a toast notification here
  }
}

