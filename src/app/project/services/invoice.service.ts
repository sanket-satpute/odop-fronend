import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { environment } from '../../../environments/environment';

// Backend Invoice Response Interface
export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerId: string;
  vendorId: string;
  vendorName: string;
  vendorGstin: string;
  vendorAddress: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  billingAddress: string;
  items: BackendInvoiceItem[];
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  shippingCost: number;
  discount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  invoiceStatus: string;
  invoiceDate: Date;
  dueDate: Date;
  paidDate?: Date;
  notes?: string;
  termsAndConditions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackendInvoiceItem {
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalPrice: number;
}

// Client-side Invoice Item Interface (for jsPDF)
export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderDate: Date;
  invoiceDate: Date;
  
  // Customer Info
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Shipping Address
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  
  // Billing Address
  billingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  
  // Vendor Info
  vendorName: string;
  vendorGSTIN?: string;
  
  // Items
  items: InvoiceItem[];
  
  // Totals
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  
  // Payment Info
  paymentMethod: string;
  paymentStatus: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/invoice`;

  constructor(private http: HttpClient) { }

  // ============================================
  // BACKEND API METHODS (Server-side PDF)
  // ============================================

  /**
   * Generate invoice from an order (creates invoice record in DB)
   */
  generateInvoiceFromOrder(orderId: string): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(
      `${this.apiUrl}/generate/${orderId}`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Download invoice PDF from backend (server-generated PDF)
   */
  downloadInvoicePdf(orderId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${orderId}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    }).pipe(
      map((response: Blob) => {
        // Create download link
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${orderId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get invoice by order ID
   */
  getInvoiceByOrderId(orderId: string): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(
      `${this.apiUrl}/order/${orderId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get invoice by invoice ID
   */
  getInvoiceById(invoiceId: string): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(
      `${this.apiUrl}/${invoiceId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get all invoices for a customer
   */
  getCustomerInvoices(customerId: string): Observable<InvoiceResponse[]> {
    return this.http.get<InvoiceResponse[]>(
      `${this.apiUrl}/customer/${customerId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get all invoices for a vendor
   */
  getVendorInvoices(vendorId: string): Observable<InvoiceResponse[]> {
    return this.http.get<InvoiceResponse[]>(
      `${this.apiUrl}/vendor/${vendorId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Send invoice via email
   */
  sendInvoiceByEmail(invoiceId: string, email: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/send/${invoiceId}`,
      { email },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Helper method for auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Error handler
  private handleError(error: any): Observable<never> {
    console.error('Invoice Service Error:', error);
    let errorMessage = 'An error occurred while processing your request.';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 404) {
      errorMessage = 'Invoice not found.';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please login again.';
    }
    return throwError(() => new Error(errorMessage));
  }

  // ============================================
  // CLIENT-SIDE PDF GENERATION (jsPDF - Fallback)
  // ============================================

  generateInvoicePDF(invoice: InvoiceData): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Colors
    const primaryColor = [255, 165, 0]; // Orange
    const darkColor = [45, 55, 72];
    const grayColor = [107, 114, 128];
    
    // Header with logo area
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ODOP', 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('One District One Product', 15, 28);
    doc.text('Empowering Local Artisans', 15, 34);
    
    // Invoice Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', pageWidth - 15, 20, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice #: ' + invoice.invoiceNumber, pageWidth - 15, 28, { align: 'right' });
    doc.text('Date: ' + this.formatDate(invoice.invoiceDate), pageWidth - 15, 34, { align: 'right' });
    
    // Reset text color
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    
    // Order Info Bar
    doc.setFillColor(248, 249, 250);
    doc.rect(0, 45, pageWidth, 15, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Order Date: ' + this.formatDate(invoice.orderDate), 15, 54);
    doc.text('Payment Method: ' + invoice.paymentMethod, 80, 54);
    doc.text('Payment Status: ' + invoice.paymentStatus, 145, 54);
    
    // Customer & Shipping Info Section
    let yPos = 70;
    
    // Bill To
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', 15, yPos);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    yPos += 7;
    doc.text(invoice.customerName, 15, yPos);
    yPos += 5;
    doc.text(invoice.billingAddress.street, 15, yPos);
    yPos += 5;
    doc.text(invoice.billingAddress.city + ', ' + invoice.billingAddress.state + ' - ' + invoice.billingAddress.pincode, 15, yPos);
    yPos += 5;
    doc.text('Phone: ' + invoice.customerPhone, 15, yPos);
    yPos += 5;
    doc.text('Email: ' + invoice.customerEmail, 15, yPos);
    
    // Ship To
    yPos = 70;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SHIP TO', 110, yPos);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    yPos += 7;
    doc.text(invoice.customerName, 110, yPos);
    yPos += 5;
    doc.text(invoice.shippingAddress.street, 110, yPos);
    yPos += 5;
    doc.text(invoice.shippingAddress.city + ', ' + invoice.shippingAddress.state + ' - ' + invoice.shippingAddress.pincode, 110, yPos);
    
    // Vendor Info
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('SOLD BY', 110, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.vendorName, 110, yPos);
    if (invoice.vendorGSTIN) {
      yPos += 5;
      doc.text('GSTIN: ' + invoice.vendorGSTIN, 110, yPos);
    }
    
    // Items Table
    yPos = 120;
    
    const tableData = invoice.items.map(item => [
      item.name,
      item.quantity.toString(),
      this.formatCurrency(item.price),
      this.formatCurrency(item.total)
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Qty', 'Unit Price', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [255, 165, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: {
        fontSize: 9,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 85 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: 15, right: 15 }
    });
    
    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
    
    // Totals Section
    let totalY = finalY + 15;
    const rightX = pageWidth - 15;
    const labelX = rightX - 60;
    
    // Subtotal
    doc.setFontSize(9);
    doc.text('Subtotal:', labelX, totalY);
    doc.text(this.formatCurrency(invoice.subtotal), rightX, totalY, { align: 'right' });
    
    // Discount
    if (invoice.discount > 0) {
      totalY += 7;
      doc.setTextColor(46, 125, 50);
      doc.text('Discount:', labelX, totalY);
      doc.text('-' + this.formatCurrency(invoice.discount), rightX, totalY, { align: 'right' });
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    }
    
    // Shipping
    totalY += 7;
    doc.text('Shipping:', labelX, totalY);
    doc.text(invoice.shippingCost === 0 ? 'FREE' : this.formatCurrency(invoice.shippingCost), rightX, totalY, { align: 'right' });
    
    // Tax
    totalY += 7;
    doc.text('GST (18%):', labelX, totalY);
    doc.text(this.formatCurrency(invoice.tax), rightX, totalY, { align: 'right' });
    
    // Total Line
    totalY += 5;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(labelX - 10, totalY, rightX, totalY);
    
    // Grand Total
    totalY += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', labelX, totalY);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(this.formatCurrency(invoice.total), rightX, totalY, { align: 'right' });
    
    // Footer
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const footerY = 270;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
    
    doc.text('Thank you for shopping with ODOP!', pageWidth / 2, footerY, { align: 'center' });
    doc.text('For any queries, please contact support@odop.in | www.odop.in', pageWidth / 2, footerY + 5, { align: 'center' });
    doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, footerY + 10, { align: 'center' });
    
    // Save PDF
    doc.save('ODOP_Invoice_' + invoice.invoiceNumber + '.pdf');
  }
  
  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  // Generate sample invoice for testing
  generateSampleInvoice(): InvoiceData {
    return {
      invoiceNumber: 'ODOP-2024-001234',
      orderDate: new Date('2024-01-10'),
      invoiceDate: new Date(),
      customerName: 'Rajesh Kumar',
      customerEmail: 'rajesh.kumar@email.com',
      customerPhone: '+91 98765 43210',
      shippingAddress: {
        street: '123, MG Road, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034'
      },
      billingAddress: {
        street: '123, MG Road, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034'
      },
      vendorName: 'Handloom Heritage',
      vendorGSTIN: '29AABCU9603R1ZM',
      items: [
        { name: 'Banarasi Silk Saree - Royal Blue', quantity: 1, price: 5499, total: 5499 },
        { name: 'Pashmina Shawl - Beige', quantity: 2, price: 2999, total: 5998 },
        { name: 'Brass Handicraft Lamp', quantity: 1, price: 1299, total: 1299 }
      ],
      subtotal: 12796,
      discount: 500,
      shippingCost: 0,
      tax: 2213,
      total: 14509,
      paymentMethod: 'Credit Card',
      paymentStatus: 'Paid'
    };
  }

  /**
   * Convert backend invoice response to client-side InvoiceData format
   * Useful for generating PDF locally with backend data
   */
  convertToInvoiceData(backendInvoice: InvoiceResponse): InvoiceData {
    // Parse addresses (backend stores as string)
    const parseAddress = (addressStr: string): { street: string; city: string; state: string; pincode: string } => {
      const parts = addressStr.split(',').map(s => s.trim());
      return {
        street: parts[0] || '',
        city: parts[1] || '',
        state: parts[2] || '',
        pincode: parts[3] || ''
      };
    };

    return {
      invoiceNumber: backendInvoice.invoiceNumber,
      orderDate: new Date(backendInvoice.createdAt),
      invoiceDate: new Date(backendInvoice.invoiceDate),
      customerName: backendInvoice.customerName,
      customerEmail: backendInvoice.customerEmail,
      customerPhone: backendInvoice.customerPhone,
      shippingAddress: parseAddress(backendInvoice.shippingAddress),
      billingAddress: parseAddress(backendInvoice.billingAddress),
      vendorName: backendInvoice.vendorName,
      vendorGSTIN: backendInvoice.vendorGstin,
      items: backendInvoice.items.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.totalPrice
      })),
      subtotal: backendInvoice.subtotal,
      discount: backendInvoice.discount,
      shippingCost: backendInvoice.shippingCost,
      tax: backendInvoice.totalTaxAmount,
      total: backendInvoice.totalAmount,
      paymentMethod: backendInvoice.paymentMethod,
      paymentStatus: backendInvoice.paymentStatus
    };
  }

  /**
   * Fetch invoice from backend and generate PDF locally (hybrid approach)
   */
  fetchAndGeneratePdf(orderId: string): void {
    this.getInvoiceByOrderId(orderId).subscribe({
      next: (backendInvoice) => {
        const invoiceData = this.convertToInvoiceData(backendInvoice);
        this.generateInvoicePDF(invoiceData);
      },
      error: (err) => {
        console.error('Failed to fetch invoice:', err);
      }
    });
  }
}
