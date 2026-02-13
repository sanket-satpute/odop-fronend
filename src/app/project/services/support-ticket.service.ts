import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { UserStateService } from './user-state.service';

export interface TicketMessage {
  messageId?: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'support' | 'admin';
  message: string;
  attachments?: string[];
  timestamp?: Date;
  isRead?: boolean;
}

export interface SupportTicket {
  ticketId?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  subject: string;
  description: string;
  category: 'order' | 'product' | 'payment' | 'delivery' | 'refund' | 'account' | 'other';
  status?: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  orderId?: string;
  messages?: TicketMessage[];
  attachments?: string[];
  assignedTo?: string;
  resolution?: string;
  createdAt?: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

@Injectable({
  providedIn: 'root'
})
export class SupportTicketService {
  private readonly apiUrl = environment.apiUrl;
  
  private ticketsSubject = new BehaviorSubject<SupportTicket[]>([]);
  public tickets$ = this.ticketsSubject.asObservable();
  
  private statsSubject = new BehaviorSubject<TicketStats | null>(null);
  public stats$ = this.statsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private userStateService: UserStateService
  ) {}

  private getCustomerId(): string {
    return this.userStateService.customer?.customerId || '';
  }

  private getBaseUrl(): string {
    const customerId = this.getCustomerId();
    return `${this.apiUrl}/odop/customer/${customerId}/support`;
  }

  /**
   * Get all tickets for the current customer
   */
  getTickets(status?: string): Observable<SupportTicket[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    
    return this.http.get<SupportTicket[]>(`${this.getBaseUrl()}/tickets`, { params })
      .pipe(
        tap(tickets => this.ticketsSubject.next(tickets))
      );
  }

  /**
   * Get paginated tickets
   */
  getTicketsPaginated(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.getBaseUrl()}/tickets/page`, { params });
  }

  /**
   * Get open tickets only
   */
  getOpenTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${this.getBaseUrl()}/tickets/open`);
  }

  /**
   * Get a specific ticket by ID
   */
  getTicketById(ticketId: string): Observable<SupportTicket> {
    return this.http.get<SupportTicket>(`${this.getBaseUrl()}/tickets/${ticketId}`);
  }

  /**
   * Create a new support ticket
   */
  createTicket(ticket: Partial<SupportTicket>): Observable<SupportTicket> {
    const customer = this.userStateService.customer;
    const ticketData: Partial<SupportTicket> = {
      ...ticket,
      customerName: customer?.fullName || '',
      customerEmail: customer?.emailAddress || ''
    };
    
    return this.http.post<SupportTicket>(`${this.getBaseUrl()}/tickets`, ticketData)
      .pipe(
        tap(newTicket => {
          const currentTickets = this.ticketsSubject.value;
          this.ticketsSubject.next([newTicket, ...currentTickets]);
        })
      );
  }

  /**
   * Add a message to a ticket
   */
  addMessage(ticketId: string, message: string, senderName: string): Observable<SupportTicket> {
    const messageData: Partial<TicketMessage> = {
      senderId: this.getCustomerId(),
      senderName: senderName,
      senderRole: 'customer',
      message: message
    };
    
    return this.http.post<SupportTicket>(`${this.getBaseUrl()}/tickets/${ticketId}/messages`, messageData)
      .pipe(
        tap(updatedTicket => {
          const currentTickets = this.ticketsSubject.value;
          const index = currentTickets.findIndex(t => t.ticketId === ticketId);
          if (index !== -1) {
            currentTickets[index] = updatedTicket;
            this.ticketsSubject.next([...currentTickets]);
          }
        })
      );
  }

  /**
   * Close a ticket
   */
  closeTicket(ticketId: string): Observable<SupportTicket> {
    return this.http.patch<SupportTicket>(`${this.getBaseUrl()}/tickets/${ticketId}/close`, {})
      .pipe(
        tap(updatedTicket => {
          const currentTickets = this.ticketsSubject.value;
          const index = currentTickets.findIndex(t => t.ticketId === ticketId);
          if (index !== -1) {
            currentTickets[index] = updatedTicket;
            this.ticketsSubject.next([...currentTickets]);
          }
        })
      );
  }

  /**
   * Mark messages as read
   */
  markMessagesAsRead(ticketId: string): Observable<SupportTicket> {
    return this.http.patch<SupportTicket>(`${this.getBaseUrl()}/tickets/${ticketId}/read`, {});
  }

  /**
   * Search tickets by keyword
   */
  searchTickets(keyword: string): Observable<SupportTicket[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<SupportTicket[]>(`${this.getBaseUrl()}/tickets/search`, { params });
  }

  /**
   * Get ticket statistics
   */
  getTicketStats(): Observable<TicketStats> {
    return this.http.get<TicketStats>(`${this.getBaseUrl()}/tickets/stats`)
      .pipe(
        tap(stats => this.statsSubject.next(stats))
      );
  }

  /**
   * Get ticket count
   */
  getTicketCount(): Observable<number> {
    return this.http.get<{count: number}>(`${this.getBaseUrl()}/tickets/count`)
      .pipe(
        map(response => response.count)
      );
  }

  /**
   * Helper method to get ticket categories
   */
  getCategories(): { value: 'order' | 'product' | 'payment' | 'delivery' | 'refund' | 'account' | 'other'; label: string; icon: string }[] {
    return [
      { value: 'order', label: 'Order Issues', icon: 'fa-shopping-cart' },
      { value: 'product', label: 'Product Inquiry', icon: 'fa-box' },
      { value: 'payment', label: 'Payment Issues', icon: 'fa-credit-card' },
      { value: 'delivery', label: 'Delivery Issues', icon: 'fa-truck' },
      { value: 'refund', label: 'Refund Request', icon: 'fa-undo' },
      { value: 'account', label: 'Account Issues', icon: 'fa-user-circle' },
      { value: 'other', label: 'Other', icon: 'fa-question-circle' }
    ];
  }

  /**
   * Helper method to get status labels and colors
   */
  getStatusInfo(status: string): { label: string; color: string; icon: string } {
    const statusMap: { [key: string]: { label: string; color: string; icon: string } } = {
      'open': { label: 'Open', color: '#2196F3', icon: 'fa-envelope-open' },
      'in-progress': { label: 'In Progress', color: '#FF9800', icon: 'fa-spinner' },
      'resolved': { label: 'Resolved', color: '#4CAF50', icon: 'fa-check-circle' },
      'closed': { label: 'Closed', color: '#9E9E9E', icon: 'fa-times-circle' }
    };
    return statusMap[status] || { label: status, color: '#9E9E9E', icon: 'fa-circle' };
  }

  /**
   * Helper method to get priority labels and colors
   */
  getPriorityInfo(priority: string): { label: string; color: string } {
    const priorityMap: { [key: string]: { label: string; color: string } } = {
      'low': { label: 'Low', color: '#4CAF50' },
      'medium': { label: 'Medium', color: '#FF9800' },
      'high': { label: 'High', color: '#f44336' },
      'urgent': { label: 'Urgent', color: '#9C27B0' }
    };
    return priorityMap[priority] || { label: priority, color: '#9E9E9E' };
  }
}
