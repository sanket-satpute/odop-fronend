import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { GlobalVariable } from '../global/global';
import { Order } from '../models/order';

export interface OrderFilter {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  vendorId?: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly baseUrl = GlobalVariable.BASE_API_URL + 'order';
  
  // Observable for real-time order updates
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  constructor(private http: HttpClient) { }

  // ============== CREATE ==============

  /**
   * Create a new order
   */
  createOrder(order: Order): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/create`, order).pipe(
      tap(newOrder => {
        const currentOrders = this.ordersSubject.value;
        this.ordersSubject.next([newOrder, ...currentOrders]);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create order from cart items
   */
  createOrderFromCart(customerId: string, shippingAddress: string, paymentMethod: string, couponCode?: string): Observable<Order> {
    const payload = {
      customerId,
      shippingAddress,
      paymentMethod,
      couponCode
    };
    return this.http.post<Order>(`${this.baseUrl}/create-from-cart`, payload).pipe(
      catchError(this.handleError)
    );
  }

  // ============== READ ==============

  /**
   * Get all orders
   */
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/get_all`).pipe(
      tap(orders => this.ordersSubject.next(orders)),
      catchError(this.handleError)
    );
  }

  /**
   * Get order by ID
   */
  getOrderById(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/get/${orderId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get orders by customer ID
   */
  getOrdersByCustomerId(customerId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/customer/${customerId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get orders by vendor ID
   */
  getOrdersByVendorId(vendorId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/vendor/${vendorId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get orders by status
   */
  getOrdersByStatus(status: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/status/${status}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get filtered orders with pagination
   */
  getFilteredOrders(filter: OrderFilter, page: number = 0, pageSize: number = 10): Observable<PaginatedOrders> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', pageSize.toString());

    if (filter.status) params = params.set('status', filter.status);
    if (filter.customerId) params = params.set('customerId', filter.customerId);
    if (filter.vendorId) params = params.set('vendorId', filter.vendorId);
    if (filter.startDate) params = params.set('startDate', filter.startDate.toISOString());
    if (filter.endDate) params = params.set('endDate', filter.endDate.toISOString());

    return this.http.get<PaginatedOrders>(`${this.baseUrl}/filter`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get recent orders (last N orders)
   */
  getRecentOrders(count: number = 5, customerId?: string): Observable<Order[]> {
    let params = new HttpParams().set('count', count.toString());
    if (customerId) params = params.set('customerId', customerId);

    return this.http.get<Order[]>(`${this.baseUrl}/recent`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // ============== UPDATE ==============

  /**
   * Update order status
   */
  updateOrderStatus(orderId: string, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/status/${orderId}`, { status }).pipe(
      tap(updatedOrder => {
        const currentOrders = this.ordersSubject.value;
        const index = currentOrders.findIndex(o => o.orderId === orderId);
        if (index !== -1) {
          currentOrders[index] = updatedOrder;
          this.ordersSubject.next([...currentOrders]);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update shipping address
   */
  updateShippingAddress(orderId: string, shippingAddress: string): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/shipping/${orderId}`, { shippingAddress }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Apply coupon to order
   */
  applyCoupon(orderId: string, couponCode: string): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/apply-coupon/${orderId}`, { couponCode }).pipe(
      catchError(this.handleError)
    );
  }

  // ============== DELETE ==============

  /**
   * Cancel order
   */
  cancelOrder(orderId: string, reason?: string): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/cancel/${orderId}`, { reason }).pipe(
      tap(() => {
        const currentOrders = this.ordersSubject.value;
        const index = currentOrders.findIndex(o => o.orderId === orderId);
        if (index !== -1) {
          currentOrders[index].orderStatus = 'Cancelled';
          this.ordersSubject.next([...currentOrders]);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete order (admin only)
   */
  deleteOrder(orderId: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/delete/${orderId}`).pipe(
      tap(() => {
        const currentOrders = this.ordersSubject.value.filter(o => o.orderId !== orderId);
        this.ordersSubject.next(currentOrders);
      }),
      catchError(this.handleError)
    );
  }

  // ============== STATISTICS ==============

  /**
   * Get order statistics
   */
  getOrderStats(vendorId?: string, customerId?: string): Observable<OrderStats> {
    let params = new HttpParams();
    if (vendorId) params = params.set('vendorId', vendorId);
    if (customerId) params = params.set('customerId', customerId);

    return this.http.get<OrderStats>(`${this.baseUrl}/stats`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get monthly order summary
   */
  getMonthlySummary(year: number, vendorId?: string): Observable<any> {
    let params = new HttpParams().set('year', year.toString());
    if (vendorId) params = params.set('vendorId', vendorId);

    return this.http.get(`${this.baseUrl}/monthly-summary`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // ============== ORDER TRACKING ==============

  /**
   * Track order by order ID
   */
  trackOrder(orderId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/track/${orderId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get order history/timeline
   */
  getOrderTimeline(orderId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/timeline/${orderId}`).pipe(
      catchError(this.handleError)
    );
  }

  // ============== HELPERS ==============

  /**
   * Get status display text
   */
  getStatusDisplayText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'returned': 'Returned',
      'refunded': 'Refunded'
    };
    return statusMap[status.toLowerCase()] || status;
  }

  /**
   * Get status color class
   */
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'pending': 'warn',
      'confirmed': 'primary',
      'processing': 'primary',
      'shipped': 'accent',
      'out_for_delivery': 'accent',
      'delivered': 'success',
      'cancelled': 'error',
      'returned': 'error',
      'refunded': 'error'
    };
    return colorMap[status.toLowerCase()] || 'primary';
  }

  /**
   * Check if order can be cancelled
   */
  canCancelOrder(order: Order): boolean {
    const nonCancellableStatuses = ['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'];
    return !nonCancellableStatuses.includes(order.orderStatus?.toLowerCase() || '');
  }

  /**
   * Calculate estimated delivery date
   */
  getEstimatedDelivery(orderDate: Date, daysToAdd: number = 5): Date {
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
    return deliveryDate;
  }

  // ============== ERROR HANDLING ==============

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred while processing your request.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.status) {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid order data. Please check your information.';
          break;
        case 401:
          errorMessage = 'Please login to continue.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Order not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || errorMessage;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Refresh orders list
   */
  refreshOrders(): void {
    this.getAllOrders().subscribe({
      error: (err) => console.error('Failed to refresh orders:', err)
    });
  }
}
