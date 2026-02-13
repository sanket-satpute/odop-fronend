import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { GlobalVariable } from '../global/global';

// Razorpay Window Declaration
declare var Razorpay: any;

export interface PaymentRequest {
  amount: number;
  currency?: string;
  orderId?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description?: string;
}

export interface PaymentResponse {
  paymentId: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
  status: string;
  orderId?: string;
  customerId: string;
  createdAt: string;
}

export interface PaymentVerification {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface Payment {
  paymentId: string;
  orderId: string;
  customerId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private readonly baseUrl = GlobalVariable.BASE_API_URL + 'payment';
  
  private paymentStatusSubject = new BehaviorSubject<string>('idle');
  public paymentStatus$ = this.paymentStatusSubject.asObservable();

  constructor(private http: HttpClient) { }

  // ============== CREATE ORDER ==============

  /**
   * Create a Razorpay order for payment
   * This is the first step before opening Razorpay checkout
   */
  createPaymentOrder(request: PaymentRequest): Observable<PaymentResponse> {
    this.paymentStatusSubject.next('creating');
    return this.http.post<PaymentResponse>(`${this.baseUrl}/create-order`, request).pipe(
      tap(() => this.paymentStatusSubject.next('created')),
      catchError(error => {
        this.paymentStatusSubject.next('error');
        throw error;
      })
    );
  }

  // ============== OPEN RAZORPAY CHECKOUT ==============

  /**
   * Open Razorpay checkout popup
   * Call this after createPaymentOrder succeeds
   */
  openRazorpayCheckout(paymentResponse: PaymentResponse, onSuccess: (response: any) => void, onError?: (error: any) => void): void {
    this.paymentStatusSubject.next('checkout');
    
    const options = {
      key: paymentResponse.razorpayKeyId,
      amount: paymentResponse.amount * 100, // Razorpay expects amount in paise
      currency: paymentResponse.currency || 'INR',
      name: 'ODOP Marketplace',
      description: 'Purchase from ODOP',
      order_id: paymentResponse.razorpayOrderId,
      prefill: {
        name: '',
        email: '',
        contact: ''
      },
      theme: {
        color: '#4CAF50'
      },
      handler: (response: any) => {
        this.paymentStatusSubject.next('verifying');
        onSuccess(response);
      },
      modal: {
        ondismiss: () => {
          this.paymentStatusSubject.next('cancelled');
          if (onError) {
            onError({ reason: 'Payment cancelled by user' });
          }
        }
      }
    };

    try {
      const razorpay = new Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        this.paymentStatusSubject.next('failed');
        if (onError) {
          onError(response.error);
        }
      });
      razorpay.open();
    } catch (error) {
      this.paymentStatusSubject.next('error');
      if (onError) {
        onError(error);
      }
    }
  }

  // ============== VERIFY PAYMENT ==============

  /**
   * Verify payment after Razorpay checkout completes
   * This confirms the payment on backend
   */
  verifyPayment(verification: PaymentVerification): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/verify`, verification).pipe(
      tap(payment => {
        if (payment.status === 'SUCCESS') {
          this.paymentStatusSubject.next('success');
        } else {
          this.paymentStatusSubject.next('failed');
        }
      }),
      catchError(error => {
        this.paymentStatusSubject.next('error');
        throw error;
      })
    );
  }

  // ============== GET PAYMENT STATUS ==============

  /**
   * Get payment by ID
   */
  getPaymentById(paymentId: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/status/${paymentId}`);
  }

  /**
   * Get payment by Razorpay Order ID
   */
  getPaymentByRazorpayOrderId(razorpayOrderId: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/by-razorpay-order/${razorpayOrderId}`);
  }

  /**
   * Get payment by Order ID
   */
  getPaymentByOrderId(orderId: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/by-order/${orderId}`);
  }

  // ============== GET PAYMENTS LIST ==============

  /**
   * Get all payments for a customer
   */
  getPaymentsByCustomerId(customerId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/customer/${customerId}`);
  }

  /**
   * Get all payments for a vendor
   */
  getPaymentsByVendorId(vendorId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/vendor/${vendorId}`);
  }

  // ============== REFUND ==============

  /**
   * Request a refund for a payment
   */
  requestRefund(refundRequest: RefundRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/refund`, refundRequest);
  }

  // ============== RECORD FAILED PAYMENT ==============

  /**
   * Record a failed payment attempt
   */
  recordFailedPayment(razorpayOrderId: string, errorCode: string, errorDescription: string): Observable<Payment> {
    const payload = { razorpayOrderId, errorCode, errorDescription };
    return this.http.post<Payment>(`${this.baseUrl}/failed`, payload);
  }

  // ============== HEALTH CHECK ==============

  /**
   * Check if payment service is healthy
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // ============== HELPER: COMPLETE PAYMENT FLOW ==============

  /**
   * Complete payment flow: Create order -> Open checkout -> Verify
   * This is a convenience method that handles the entire flow
   */
  processPayment(request: PaymentRequest): Promise<Payment> {
    return new Promise((resolve, reject) => {
      this.createPaymentOrder(request).subscribe({
        next: (paymentResponse) => {
          this.openRazorpayCheckout(
            paymentResponse,
            (razorpayResponse) => {
              const verification: PaymentVerification = {
                razorpayOrderId: razorpayResponse.razorpay_order_id,
                razorpayPaymentId: razorpayResponse.razorpay_payment_id,
                razorpaySignature: razorpayResponse.razorpay_signature
              };
              
              this.verifyPayment(verification).subscribe({
                next: (payment) => resolve(payment),
                error: (error) => reject(error)
              });
            },
            (error) => reject(error)
          );
        },
        error: (error) => reject(error)
      });
    });
  }

  // ============== RESET STATUS ==============

  resetStatus(): void {
    this.paymentStatusSubject.next('idle');
  }
}
