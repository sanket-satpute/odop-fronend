import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Shipment Status enum matching backend
 */
export enum ShipmentStatus {
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  PROCESSING = 'PROCESSING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT_TO_HUB = 'IN_TRANSIT_TO_HUB',
  REACHED_HUB = 'REACHED_HUB',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERY_ATTEMPTED = 'DELIVERY_ATTEMPTED',
  RESCHEDULED = 'RESCHEDULED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
  LOST = 'LOST',
  DAMAGED = 'DAMAGED'
}

/**
 * Interface for tracking address
 */
export interface TrackingAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

/**
 * Interface for tracking events
 */
export interface TrackingEvent {
  timestamp: Date;
  status: string;
  statusDisplayName: string;
  location: string;
  description: string;
  icon: string;
  isCompleted: boolean;
}

/**
 * Interface for shipment tracking response
 */
export interface ShipmentTracking {
  trackingNumber: string;
  orderId: string;
  currentStatus: ShipmentStatus;
  statusDisplayName: string;
  statusDescription: string;
  courierName?: string;
  courierTrackingId?: string;
  courierTrackingUrl?: string;
  shippingMode: string;
  paymentMode: string;
  pickupAddress: TrackingAddress;
  deliveryAddress: TrackingAddress;
  orderDate: Date;
  dispatchedAt?: Date;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  progressPercentage: number;
  nextExpectedStatus?: string;
  trackingHistory: TrackingEvent[];
  deliveredTo?: string;
  deliveryProofUrl?: string;
}

/**
 * Interface for vendor shipment stats
 */
export interface VendorShipmentStats {
  pending: number;
  inTransit: number;
  outForDelivery: number;
  delivered: number;
}

/**
 * Interface for create shipment request
 */
export interface CreateShipmentRequest {
  orderId: string;
  customerId: string;
  vendorId: string;
  pickupAddress: {
    name: string;
    phone: string;
    email?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    landmark?: string;
  };
  deliveryAddress: {
    name: string;
    phone: string;
    email?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    landmark?: string;
  };
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  numberOfItems?: number;
  packageType?: string;
  shippingMode?: string;
  paymentMode?: string;
  preferredCourier?: string;
  smsNotification?: boolean;
  emailNotification?: boolean;
  whatsappNotification?: boolean;
}

/**
 * Interface for status update request
 */
export interface UpdateStatusRequest {
  status: ShipmentStatus;
  location?: string;
  description?: string;
  remarks?: string;
  deliveredTo?: string;
  deliveryProofUrl?: string;
  returnReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShippingService {
  private apiUrl = `${environment.apiUrl}/shipping`;

  constructor(private http: HttpClient) { }

  // ============================================
  // PUBLIC TRACKING (No Auth Required)
  // ============================================

  /**
   * Track shipment by tracking number (public)
   */
  trackByTrackingNumber(trackingNumber: string): Observable<ShipmentTracking> {
    return this.http.get<ShipmentTracking>(`${this.apiUrl}/track/${trackingNumber}`)
      .pipe(
        map(this.transformTracking),
        catchError(this.handleError)
      );
  }

  /**
   * Track shipment by order ID
   */
  trackByOrderId(orderId: string): Observable<ShipmentTracking> {
    return this.http.get<ShipmentTracking>(`${this.apiUrl}/track/order/${orderId}`)
      .pipe(
        map(this.transformTracking),
        catchError(this.handleError)
      );
  }

  // ============================================
  // CUSTOMER METHODS
  // ============================================

  /**
   * Get all shipments for current customer
   */
  getCustomerShipments(customerId: string): Observable<ShipmentTracking[]> {
    return this.http.get<ShipmentTracking[]>(
      `${this.apiUrl}/customer/${customerId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(shipments => shipments.map(this.transformTracking)),
      catchError(this.handleError)
    );
  }

  /**
   * Get active shipments (not delivered/cancelled)
   */
  getActiveShipments(customerId: string): Observable<ShipmentTracking[]> {
    return this.http.get<ShipmentTracking[]>(
      `${this.apiUrl}/customer/${customerId}/active`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(shipments => shipments.map(this.transformTracking)),
      catchError(this.handleError)
    );
  }

  // ============================================
  // VENDOR METHODS
  // ============================================

  /**
   * Get all shipments for vendor
   */
  getVendorShipments(vendorId: string): Observable<ShipmentTracking[]> {
    return this.http.get<ShipmentTracking[]>(
      `${this.apiUrl}/vendor/${vendorId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(shipments => shipments.map(this.transformTracking)),
      catchError(this.handleError)
    );
  }

  /**
   * Get vendor shipment statistics
   */
  getVendorStats(vendorId: string): Observable<VendorShipmentStats> {
    return this.http.get<VendorShipmentStats>(
      `${this.apiUrl}/vendor/${vendorId}/stats`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ============================================
  // ADMIN/INTERNAL METHODS
  // ============================================

  /**
   * Create a new shipment
   */
  createShipment(request: CreateShipmentRequest): Observable<ShipmentTracking> {
    return this.http.post<ShipmentTracking>(
      `${this.apiUrl}/create`,
      request,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(this.transformTracking),
      catchError(this.handleError)
    );
  }

  /**
   * Update shipment status
   */
  updateShipmentStatus(trackingNumber: string, request: UpdateStatusRequest): Observable<ShipmentTracking> {
    return this.http.put<ShipmentTracking>(
      `${this.apiUrl}/${trackingNumber}/status`,
      request,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(this.transformTracking),
      catchError(this.handleError)
    );
  }

  /**
   * Assign courier to shipment
   */
  assignCourier(trackingNumber: string, courierDetails: {
    courierName: string;
    courierCode: string;
    courierTrackingId: string;
  }): Observable<ShipmentTracking> {
    return this.http.post<ShipmentTracking>(
      `${this.apiUrl}/${trackingNumber}/assign-courier`,
      courierDetails,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(this.transformTracking),
      catchError(this.handleError)
    );
  }

  /**
   * Create return shipment
   */
  createReturnShipment(trackingNumber: string, reason: string): Observable<ShipmentTracking> {
    return this.http.post<ShipmentTracking>(
      `${this.apiUrl}/${trackingNumber}/return`,
      { reason },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(this.transformTracking),
      catchError(this.handleError)
    );
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get status display information
   */
  getStatusInfo(status: ShipmentStatus): { color: string; icon: string; text: string } {
    const statusMap: Record<ShipmentStatus, { color: string; icon: string; text: string }> = {
      [ShipmentStatus.ORDER_PLACED]: { color: 'blue', icon: 'shopping_cart', text: 'Order Placed' },
      [ShipmentStatus.ORDER_CONFIRMED]: { color: 'blue', icon: 'check_circle', text: 'Order Confirmed' },
      [ShipmentStatus.PROCESSING]: { color: 'orange', icon: 'inventory', text: 'Processing' },
      [ShipmentStatus.READY_FOR_PICKUP]: { color: 'orange', icon: 'local_shipping', text: 'Ready for Pickup' },
      [ShipmentStatus.PICKED_UP]: { color: 'orange', icon: 'local_shipping', text: 'Picked Up' },
      [ShipmentStatus.IN_TRANSIT_TO_HUB]: { color: 'purple', icon: 'warehouse', text: 'In Transit to Hub' },
      [ShipmentStatus.REACHED_HUB]: { color: 'purple', icon: 'warehouse', text: 'Reached Hub' },
      [ShipmentStatus.IN_TRANSIT]: { color: 'purple', icon: 'flight', text: 'In Transit' },
      [ShipmentStatus.OUT_FOR_DELIVERY]: { color: 'teal', icon: 'delivery_dining', text: 'Out for Delivery' },
      [ShipmentStatus.DELIVERY_ATTEMPTED]: { color: 'yellow', icon: 'error', text: 'Delivery Attempted' },
      [ShipmentStatus.RESCHEDULED]: { color: 'yellow', icon: 'schedule', text: 'Rescheduled' },
      [ShipmentStatus.DELIVERED]: { color: 'green', icon: 'check_circle', text: 'Delivered' },
      [ShipmentStatus.RETURNED]: { color: 'red', icon: 'undo', text: 'Returned' },
      [ShipmentStatus.CANCELLED]: { color: 'grey', icon: 'cancel', text: 'Cancelled' },
      [ShipmentStatus.LOST]: { color: 'red', icon: 'warning', text: 'Lost' },
      [ShipmentStatus.DAMAGED]: { color: 'red', icon: 'warning', text: 'Damaged' }
    };
    return statusMap[status] || { color: 'grey', icon: 'help', text: 'Unknown' };
  }

  /**
   * Check if shipment is in terminal state
   */
  isTerminalStatus(status: ShipmentStatus): boolean {
    return [
      ShipmentStatus.DELIVERED,
      ShipmentStatus.CANCELLED,
      ShipmentStatus.RETURNED,
      ShipmentStatus.LOST,
      ShipmentStatus.DAMAGED
    ].includes(status);
  }

  /**
   * Get tracking steps for progress display
   */
  getTrackingSteps(): { status: ShipmentStatus; label: string; icon: string }[] {
    return [
      { status: ShipmentStatus.ORDER_PLACED, label: 'Order Placed', icon: 'shopping_cart' },
      { status: ShipmentStatus.PROCESSING, label: 'Processing', icon: 'inventory' },
      { status: ShipmentStatus.PICKED_UP, label: 'Picked Up', icon: 'local_shipping' },
      { status: ShipmentStatus.IN_TRANSIT, label: 'In Transit', icon: 'flight' },
      { status: ShipmentStatus.OUT_FOR_DELIVERY, label: 'Out for Delivery', icon: 'delivery_dining' },
      { status: ShipmentStatus.DELIVERED, label: 'Delivered', icon: 'check_circle' }
    ];
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private transformTracking(tracking: ShipmentTracking): ShipmentTracking {
    return {
      ...tracking,
      orderDate: tracking.orderDate ? new Date(tracking.orderDate) : tracking.orderDate,
      dispatchedAt: tracking.dispatchedAt ? new Date(tracking.dispatchedAt) : undefined,
      estimatedDelivery: tracking.estimatedDelivery ? new Date(tracking.estimatedDelivery) : undefined,
      actualDelivery: tracking.actualDelivery ? new Date(tracking.actualDelivery) : undefined,
      trackingHistory: tracking.trackingHistory?.map(event => ({
        ...event,
        timestamp: new Date(event.timestamp)
      })) || []
    };
  }

  private handleError(error: any): Observable<never> {
    console.error('Shipping Service Error:', error);
    let errorMessage = 'An error occurred while processing your request.';
    
    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.status === 404) {
      errorMessage = 'Shipment not found. Please check the tracking number.';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please login again.';
    } else if (error.status === 400) {
      errorMessage = 'Invalid request. Please check your input.';
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
