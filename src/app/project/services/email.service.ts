import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalVariable } from '../global/global';

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface WelcomeEmailRequest {
  email: string;
  name: string;
  userType?: 'customer' | 'vendor';
}

export interface OrderConfirmationRequest {
  email: string;
  customerName: string;
  orderId: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress: string;
  paymentMethod: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface PaymentSuccessRequest {
  email: string;
  customerName: string;
  orderId: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private readonly baseUrl = GlobalVariable.BASE_API_URL + 'email';

  constructor(private http: HttpClient) { }

  // ============== GENERAL EMAIL ==============

  /**
   * Send a general email
   */
  sendEmail(request: SendEmailRequest): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.baseUrl}/send`, request);
  }

  // ============== WELCOME EMAILS ==============

  /**
   * Send welcome email (sync)
   */
  sendWelcomeEmail(request: WelcomeEmailRequest): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.baseUrl}/welcome`, request);
  }

  /**
   * Send welcome email (async - faster response)
   */
  sendWelcomeEmailAsync(request: WelcomeEmailRequest): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.baseUrl}/welcome/async`, request);
  }

  // ============== ORDER EMAILS ==============

  /**
   * Send order confirmation email (sync)
   */
  sendOrderConfirmation(request: OrderConfirmationRequest): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.baseUrl}/order-confirmation`, request);
  }

  /**
   * Send order confirmation email (async - faster response)
   */
  sendOrderConfirmationAsync(request: OrderConfirmationRequest): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.baseUrl}/order-confirmation/async`, request);
  }

  // ============== PAYMENT EMAILS ==============

  /**
   * Send payment success email (sync)
   */
  sendPaymentSuccessEmail(request: PaymentSuccessRequest): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.baseUrl}/payment-success`, request);
  }

  /**
   * Send payment success email (async - faster response)
   */
  sendPaymentSuccessEmailAsync(request: PaymentSuccessRequest): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.baseUrl}/payment-success/async`, request);
  }

  // ============== TEST EMAILS ==============

  /**
   * Send test email
   */
  sendTestEmail(email: string): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.baseUrl}/test`, { email });
  }

  /**
   * Test order confirmation email template
   */
  testOrderConfirmationEmail(email: string): Observable<EmailResponse> {
    return this.http.get<EmailResponse>(`${this.baseUrl}/test/order-confirmation?email=${encodeURIComponent(email)}`);
  }

  /**
   * Test welcome email template
   */
  testWelcomeEmail(email: string, name: string): Observable<EmailResponse> {
    return this.http.get<EmailResponse>(`${this.baseUrl}/test/welcome?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);
  }

  // ============== HEALTH CHECK ==============

  /**
   * Check if email service is healthy
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }
}
