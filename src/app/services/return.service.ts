import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

// ==================== INTERFACES ====================

export interface ReturnRequest {
  id: string;
  returnId: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  variantInfo?: string;
  customerId: string;
  customerName: string;
  vendorId: string;
  vendorName: string;
  returnType: string;
  reason: string;
  reasonDetails: string;
  quantity: number;
  itemPrice: number;
  returnAmount: number;
  images: string[];
  status: string;
  statusHistory: StatusHistory[];
  pickupDetails?: PickupDetails;
  refundDetails?: RefundDetails;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface StatusHistory {
  status: string;
  comment: string;
  updatedBy: string;
  timestamp: string;
}

export interface PickupDetails {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  contactPhone: string;
  scheduledDate?: string;
  pickupAgentName?: string;
  pickupAgentPhone?: string;
  trackingId?: string;
}

export interface RefundDetails {
  refundId: string;
  refundMethod: string;
  refundStatus: string;
  refundAmount: number;
  deductions: number;
  deductionReason?: string;
  transactionId?: string;
  initiatedAt?: string;
  completedAt?: string;
}

export interface CreateReturnRequest {
  orderId: string;
  orderItemId: string;
  productId: string;
  variantId?: string;
  returnType: string;
  reason: string;
  reasonDetails?: string;
  quantity: number;
  images?: string[];
  pickupAddress?: PickupAddress;
  preferredRefundMethod?: string;
}

export interface PickupAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  contactPhone: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
}

export interface ReturnSummary {
  totalReturns: number;
  pendingReturns: number;
  approvedReturns: number;
  completedReturns: number;
  rejectedReturns: number;
  totalRefundAmount: number;
  pendingRefundAmount: number;
}

export interface ReturnPolicy {
  returnWindowDays: number;
  eligibleReasons: string[];
  nonReturnableCategories: string[];
  refundProcessingTime: string;
  pickupInfo: string;
  requiredDocuments: string[];
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class ReturnService {

  private apiUrl = `${environment.apiUrl}/odop/returns`;
  
  // State management
  private returnsSubject = new BehaviorSubject<ReturnRequest[]>([]);
  private activeReturnSubject = new BehaviorSubject<ReturnRequest | null>(null);
  private summarySubject = new BehaviorSubject<ReturnSummary | null>(null);
  private policySubject = new BehaviorSubject<ReturnPolicy | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  // Public observables
  returns$ = this.returnsSubject.asObservable();
  activeReturn$ = this.activeReturnSubject.asObservable();
  summary$ = this.summarySubject.asObservable();
  policy$ = this.policySubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadReturnPolicy();
  }

  // ==================== CUSTOMER OPERATIONS ====================

  /**
   * Create a return request
   */
  createReturn(request: CreateReturnRequest): Observable<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    return this.http.post<any>(`${this.apiUrl}`, request).pipe(
      tap({
        next: (response) => {
          this.loadingSubject.next(false);
          if (response.success && response.returnRequest) {
            this.activeReturnSubject.next(response.returnRequest);
            this.addToList(response.returnRequest);
          }
        },
        error: (err) => {
          this.loadingSubject.next(false);
          this.errorSubject.next(err.error?.message || 'Failed to create return request');
        }
      })
    );
  }

  /**
   * Get customer's returns
   */
  getMyReturns(page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/my-returns`, { params }).pipe(
      tap(response => {
        if (response.success) {
          this.returnsSubject.next(response.returns);
        }
      })
    );
  }

  /**
   * Get return by ID
   */
  getReturn(returnId: string): Observable<ReturnRequest> {
    return this.http.get<ReturnRequest>(`${this.apiUrl}/${returnId}`).pipe(
      tap(returnRequest => {
        this.activeReturnSubject.next(returnRequest);
      })
    );
  }

  /**
   * Cancel return request
   */
  cancelReturn(returnId: string, reason?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${returnId}/cancel`, { reason }).pipe(
      tap(response => {
        if (response.success) {
          this.updateInList(response.returnRequest);
        }
      })
    );
  }

  /**
   * Get return policy
   */
  getReturnPolicy(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/policy`).pipe(
      tap(response => {
        if (response.success) {
          this.policySubject.next(response.policy);
        }
      })
    );
  }

  private loadReturnPolicy(): void {
    this.getReturnPolicy().subscribe({
      error: (err) => console.error('Failed to load return policy:', err)
    });
  }

  // ==================== VENDOR OPERATIONS ====================

  /**
   * Get vendor's returns
   */
  getVendorReturns(page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/vendor`, { params }).pipe(
      tap(response => {
        if (response.success) {
          this.returnsSubject.next(response.returns);
        }
      })
    );
  }

  /**
   * Get vendor's pending returns
   */
  getVendorPendingReturns(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vendor/pending`);
  }

  /**
   * Approve return
   */
  approveReturn(returnId: string, comment?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${returnId}/approve`, { comment }).pipe(
      tap(response => {
        if (response.success) {
          this.updateInList(response.returnRequest);
        }
      })
    );
  }

  /**
   * Reject return
   */
  rejectReturn(returnId: string, reason: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${returnId}/reject`, { reason }).pipe(
      tap(response => {
        if (response.success) {
          this.updateInList(response.returnRequest);
        }
      })
    );
  }

  /**
   * Get vendor's return summary
   */
  getVendorSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vendor/summary`).pipe(
      tap(response => {
        if (response.success) {
          this.summarySubject.next(response.summary);
        }
      })
    );
  }

  // ==================== ADMIN OPERATIONS ====================

  /**
   * Get all returns (admin)
   */
  getAllReturns(status?: string, page: number = 0, size: number = 20): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (status) {
      params = params.set('status', status);
    }
    
    return this.http.get<any>(`${this.apiUrl}/admin/all`, { params }).pipe(
      tap(response => {
        if (response.success) {
          this.returnsSubject.next(response.returns);
        }
      })
    );
  }

  /**
   * Update return status
   */
  updateStatus(returnId: string, status: string, comment?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${returnId}/status`, { 
      status, 
      comment 
    }).pipe(
      tap(response => {
        if (response.success) {
          this.updateInList(response.returnRequest);
        }
      })
    );
  }

  /**
   * Schedule pickup
   */
  schedulePickup(returnId: string, scheduledDate: string, timeSlot: string, 
                 agentName?: string, agentPhone?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/schedule-pickup`, {
      returnId,
      scheduledDate,
      timeSlot,
      agentName,
      agentPhone
    }).pipe(
      tap(response => {
        if (response.success) {
          this.updateInList(response.returnRequest);
        }
      })
    );
  }

  /**
   * Record quality check
   */
  recordQualityCheck(returnId: string, passed: boolean, condition: string, 
                     notes?: string, eligibleForRestock?: boolean): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/quality-check`, {
      returnId,
      passed,
      condition,
      notes,
      eligibleForRestock
    }).pipe(
      tap(response => {
        if (response.success) {
          this.updateInList(response.returnRequest);
        }
      })
    );
  }

  /**
   * Initiate refund
   */
  initiateRefund(returnId: string, refundMethod: string, refundAmount: number, 
                 deductions?: number, deductionReason?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/initiate-refund`, {
      returnId,
      refundMethod,
      refundAmount,
      deductions,
      deductionReason
    }).pipe(
      tap(response => {
        if (response.success) {
          this.updateInList(response.returnRequest);
        }
      })
    );
  }

  /**
   * Complete refund
   */
  completeRefund(returnId: string, transactionId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${returnId}/complete-refund`, { 
      transactionId 
    }).pipe(
      tap(response => {
        if (response.success) {
          this.updateInList(response.returnRequest);
        }
      })
    );
  }

  /**
   * Get admin summary
   */
  getAdminSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/summary`).pipe(
      tap(response => {
        if (response.success) {
          this.summarySubject.next(response.summary);
        }
      })
    );
  }

  // ==================== ORDER RETURNS ====================

  /**
   * Get returns for an order
   */
  getOrderReturns(orderId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/order/${orderId}`);
  }

  // ==================== UTILITIES ====================

  /**
   * Get status display info
   */
  getStatusInfo(status: string): { label: string; color: string; icon: string } {
    const statusMap: { [key: string]: { label: string; color: string; icon: string } } = {
      'REQUESTED': { label: 'Requested', color: 'primary', icon: 'send' },
      'PENDING_APPROVAL': { label: 'Pending Approval', color: 'warning', icon: 'clock' },
      'APPROVED': { label: 'Approved', color: 'success', icon: 'check-circle' },
      'REJECTED': { label: 'Rejected', color: 'danger', icon: 'x-circle' },
      'PICKUP_SCHEDULED': { label: 'Pickup Scheduled', color: 'info', icon: 'truck' },
      'PICKUP_COMPLETED': { label: 'Picked Up', color: 'info', icon: 'package' },
      'IN_TRANSIT': { label: 'In Transit', color: 'info', icon: 'navigation' },
      'RECEIVED': { label: 'Received', color: 'info', icon: 'inbox' },
      'QUALITY_CHECK': { label: 'Quality Check', color: 'warning', icon: 'search' },
      'QC_PASSED': { label: 'QC Passed', color: 'success', icon: 'check' },
      'QC_FAILED': { label: 'QC Failed', color: 'danger', icon: 'alert-triangle' },
      'REFUND_INITIATED': { label: 'Refund Processing', color: 'info', icon: 'dollar-sign' },
      'REFUND_COMPLETED': { label: 'Refund Completed', color: 'success', icon: 'check-square' },
      'EXCHANGE_SHIPPED': { label: 'Exchange Shipped', color: 'success', icon: 'refresh-cw' },
      'COMPLETED': { label: 'Completed', color: 'success', icon: 'check-circle' },
      'CANCELLED': { label: 'Cancelled', color: 'secondary', icon: 'x' }
    };
    
    return statusMap[status] || { label: status, color: 'secondary', icon: 'circle' };
  }

  /**
   * Get reason display label
   */
  getReasonLabel(reason: string): string {
    const reasonMap: { [key: string]: string } = {
      'DEFECTIVE': 'Product Defective',
      'DAMAGED': 'Damaged in Transit',
      'WRONG_ITEM': 'Wrong Item Received',
      'NOT_AS_DESCRIBED': 'Not as Described',
      'SIZE_FIT': 'Size/Fit Issue',
      'QUALITY_ISSUE': 'Quality Issue',
      'CHANGED_MIND': 'Changed Mind',
      'BETTER_PRICE': 'Found Better Price',
      'LATE_DELIVERY': 'Late Delivery',
      'MISSING_PARTS': 'Missing Parts',
      'OTHER': 'Other'
    };
    
    return reasonMap[reason] || reason;
  }

  /**
   * Get return type label
   */
  getReturnTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'RETURN': 'Return for Refund',
      'EXCHANGE': 'Exchange',
      'REPLACEMENT': 'Replacement',
      'REPAIR': 'Repair Request'
    };
    
    return typeMap[type] || type;
  }

  /**
   * Check if return can be cancelled
   */
  canCancel(status: string): boolean {
    return ['REQUESTED', 'PENDING_APPROVAL', 'APPROVED'].includes(status);
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  /**
   * Health check
   */
  healthCheck(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/health`);
  }

  // ==================== STATE HELPERS ====================

  private addToList(returnRequest: ReturnRequest): void {
    const returns = this.returnsSubject.value;
    this.returnsSubject.next([returnRequest, ...returns]);
  }

  private updateInList(returnRequest: ReturnRequest): void {
    const returns = this.returnsSubject.value;
    const index = returns.findIndex(r => r.id === returnRequest.id || r.returnId === returnRequest.returnId);
    
    if (index >= 0) {
      returns[index] = returnRequest;
      this.returnsSubject.next([...returns]);
    }
    
    // Update active return if it's the same
    const active = this.activeReturnSubject.value;
    if (active && (active.id === returnRequest.id || active.returnId === returnRequest.returnId)) {
      this.activeReturnSubject.next(returnRequest);
    }
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  clearActiveReturn(): void {
    this.activeReturnSubject.next(null);
  }
}
