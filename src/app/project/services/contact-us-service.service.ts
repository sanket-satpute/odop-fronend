import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalVariable } from '../global/global';

export interface ContactMessage {
  contactId?: string;
  fullName?: string;
  emailAddress?: string;
  subject?: string;
  message?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  reply?: string;
  repliedBy?: string;
  repliedAt?: string;
  adminNotes?: string;
}

export interface StatusUpdateRequest {
  status: string;
  adminNotes?: string;
}

export interface ReplyRequest {
  reply: string;
  repliedBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactUsServiceService {

  private readonly baseUrl = GlobalVariable.BASE_API_URL + 'contact';

  constructor(private http: HttpClient) {}

  // ============== CREATE ==============

  /**
   * Send a contact message
   */
  sendMessage(message: ContactMessage): Observable<ContactMessage> {
    return this.http.post<ContactMessage>(this.baseUrl, message);
  }

  // ============== READ ==============

  /**
   * Get all contact messages (Admin)
   */
  getAllMessages(): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>(this.baseUrl);
  }

  /**
   * Get message by ID
   */
  getMessageById(id: string): Observable<ContactMessage> {
    return this.http.get<ContactMessage>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get messages by status (Admin)
   */
  getMessagesByStatus(status: string): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>(`${this.baseUrl}/status/${status}`);
  }

  // ============== UPDATE ==============

  /**
   * Update message status (Admin)
   */
  updateStatus(id: string, request: StatusUpdateRequest): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${this.baseUrl}/${id}/status`, request);
  }

  /**
   * Reply to a message (Admin)
   */
  replyToMessage(id: string, request: ReplyRequest): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${this.baseUrl}/${id}/reply`, request);
  }

  // ============== DELETE ==============

  /**
   * Delete a message (Admin - soft delete)
   */
  deleteMessage(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/${id}`);
  }

  // ============== HELPERS ==============

  /**
   * Get status display text
   */
  getStatusDisplayText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'NEW': 'New',
      'IN_PROGRESS': 'In Progress',
      'REPLIED': 'Replied',
      'RESOLVED': 'Resolved',
      'DELETED': 'Deleted'
    };
    return statusMap[status] || status;
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'NEW': 'warn',
      'IN_PROGRESS': 'primary',
      'REPLIED': 'accent',
      'RESOLVED': 'success',
      'DELETED': 'error'
    };
    return colorMap[status] || 'primary';
  }
}


