import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SupportTicketService, SupportTicket, TicketMessage, TicketStats } from 'src/app/project/services/support-ticket.service';
import { UserStateService } from 'src/app/project/services/user-state.service';
import { ChatService } from 'src/app/services/chat.service';

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-customer-support',
  templateUrl: './customer-support.component.html',
  styleUrls: ['./customer-support.component.css']
})
export class CustomerSupportComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // View state
  currentView: 'landing' | 'tickets' | 'newTicket' | 'ticketDetail' = 'landing';
  
  // Loading states
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  loadError: string = '';

  // Tickets data
  tickets: SupportTicket[] = [];
  selectedTicket: SupportTicket | null = null;
  ticketStats: TicketStats | null = null;
  statusFilter: string = '';

  // New ticket form
  newTicketForm = {
    subject: '',
    description: '',
    category: 'other' as 'order' | 'product' | 'payment' | 'delivery' | 'refund' | 'account' | 'other',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    orderId: ''
  };

  // New message
  newMessage: string = '';

  // Categories
  categories: { value: 'order' | 'product' | 'payment' | 'delivery' | 'refund' | 'account' | 'other'; label: string; icon: string }[] = [];

  // FAQ section
  showQuickFAQ: boolean = true;
  hasActiveTicket: boolean = false;
  activeTicketId: string = '';
  
  // Quick FAQ data
  quickFAQs: FAQ[] = [
    {
      question: 'How do I track my order?',
      answer: 'You can track your order by going to "My Orders" section in your dashboard. Click on any order to see detailed tracking information including current status and expected delivery date.',
      isOpen: false
    },
    {
      question: 'How can I request a refund?',
      answer: 'To request a refund, go to "My Orders", select the order, and click "Request Refund". Fill in the reason and submit. Our team will review and process eligible refunds within 5-7 business days.',
      isOpen: false
    },
    {
      question: 'How do I change my delivery address?',
      answer: 'You can update your delivery address in the "Addresses" section of your dashboard. For orders already placed, contact support before the item is shipped to request an address change.',
      isOpen: false
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept all major credit/debit cards, UPI, net banking, and wallet payments. Cash on Delivery (COD) is available for orders up to ₹10,000 in select locations.',
      isOpen: false
    },
    {
      question: 'How do I contact the seller directly?',
      answer: 'You can contact the seller through the product page or order details. Look for the "Contact Seller" button. For disputes, we recommend raising a support ticket for official resolution.',
      isOpen: false
    }
  ];

  constructor(
    private supportTicketService: SupportTicketService,
    private userStateService: UserStateService,
    private snackBar: MatSnackBar,
    private chatService: ChatService,
    private router: Router
  ) {
    this.categories = this.supportTicketService.getCategories();
  }

  ngOnInit(): void {
    this.loadTicketStats();
    this.checkActiveTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Navigation methods
  goToView(view: 'landing' | 'tickets' | 'newTicket' | 'ticketDetail'): void {
    this.currentView = view;
    if (view === 'tickets') {
      this.loadTickets();
    }
  }

  goBack(): void {
    if (this.currentView === 'ticketDetail') {
      this.selectedTicket = null;
      this.currentView = 'tickets';
    } else if (this.currentView === 'newTicket' || this.currentView === 'tickets') {
      this.currentView = 'landing';
    }
  }

  // Ticket loading methods
  loadTickets(): void {
    this.isLoading = true;
    this.loadError = '';
    
    this.supportTicketService.getTickets(this.statusFilter || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tickets) => {
          this.tickets = tickets;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading tickets:', error);
          this.loadError = 'Failed to load tickets. Please try again.';
          this.isLoading = false;
          this.snackBar.open('Failed to load tickets', 'Retry', { duration: 4000 })
            .onAction().subscribe(() => this.loadTickets());
        }
      });
  }

  loadTicketStats(): void {
    this.supportTicketService.getTicketStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.ticketStats = stats;
          this.hasActiveTicket = stats.open > 0 || stats.inProgress > 0;
        },
        error: (error) => {
          console.error('Error loading ticket stats:', error);
        }
      });
  }

  filterByStatus(status: string): void {
    this.statusFilter = status;
    this.loadTickets();
  }

  // View ticket details
  viewTicketDetails(ticket: SupportTicket): void {
    this.selectedTicket = ticket;
    this.currentView = 'ticketDetail';
    
    // Mark messages as read
    if (ticket.ticketId) {
      this.supportTicketService.markMessagesAsRead(ticket.ticketId)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
  }

  // Create new ticket
  submitTicket(): void {
    if (!this.validateTicketForm()) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;

    const ticketData: Partial<SupportTicket> = {
      subject: this.newTicketForm.subject,
      description: this.newTicketForm.description,
      category: this.newTicketForm.category,
      priority: this.newTicketForm.priority,
      orderId: this.newTicketForm.orderId || undefined
    };

    this.supportTicketService.createTicket(ticketData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ticket) => {
          this.isSubmitting = false;
          this.snackBar.open('Ticket created successfully!', 'Close', { duration: 3000 });
          this.resetTicketForm();
          this.loadTicketStats();
          this.selectedTicket = ticket;
          this.currentView = 'ticketDetail';
        },
        error: (error) => {
          console.error('Error creating ticket:', error);
          this.isSubmitting = false;
          this.snackBar.open('Failed to create ticket. Please try again.', 'Close', { duration: 3000 });
        }
      });
  }

  validateTicketForm(): boolean {
    return !!(
      this.newTicketForm.subject.trim() &&
      this.newTicketForm.description.trim() &&
      this.newTicketForm.category
    );
  }

  resetTicketForm(): void {
    this.newTicketForm = {
      subject: '',
      description: '',
      category: 'other',
      priority: 'medium',
      orderId: ''
    };
  }

  // Add message to ticket
  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedTicket?.ticketId) return;

    const customer = this.userStateService.customer;
    const senderName = customer?.fullName || 'Customer';

    this.supportTicketService.addMessage(this.selectedTicket.ticketId, this.newMessage, senderName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedTicket) => {
          this.selectedTicket = updatedTicket;
          this.newMessage = '';
          this.snackBar.open('Message sent', 'Close', { duration: 2000 });
        },
        error: (error) => {
          console.error('Error sending message:', error);
          this.snackBar.open('Failed to send message', 'Close', { duration: 3000 });
        }
      });
  }

  // Close ticket
  closeTicket(): void {
    if (!this.selectedTicket?.ticketId) return;

    if (confirm('Are you sure you want to close this ticket?')) {
      this.supportTicketService.closeTicket(this.selectedTicket.ticketId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedTicket) => {
            this.selectedTicket = updatedTicket;
            this.loadTicketStats();
            this.snackBar.open('Ticket closed', 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error closing ticket:', error);
            this.snackBar.open('Failed to close ticket', 'Close', { duration: 3000 });
          }
        });
    }
  }

  // Helper methods
  getStatusInfo(status: string) {
    return this.supportTicketService.getStatusInfo(status);
  }

  getPriorityInfo(priority: string) {
    return this.supportTicketService.getPriorityInfo(priority);
  }

  getCategoryIcon(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.icon : 'fa-question-circle';
  }

  getCategoryLabel(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Landing page methods
  onCardClick(cardType: string): void {
    switch (cardType) {
      case 'faq':
        this.showQuickFAQ = !this.showQuickFAQ;
        break;
      case 'ticket':
        this.goToView('newTicket');
        break;
      case 'chat':
        this.openLiveChat();
        break;
      case 'mytickets':
        this.goToView('tickets');
        break;
      default:
        console.warn('Unknown card type:', cardType);
    }
  }

  openLiveChat(): void {
    this.chatService.openChat();
  }

  toggleFAQ(index: number): void {
    if (index >= 0 && index < this.quickFAQs.length) {
      this.quickFAQs.forEach((faq, i) => {
        if (i !== index) {
          faq.isOpen = false;
        }
      });
      this.quickFAQs[index].isOpen = !this.quickFAQs[index].isOpen;
    }
  }

  viewAllFAQs(): void {
    this.router.navigate(['/faq']).catch((error) => {
      console.error('Failed to navigate to FAQ page:', error);
      this.snackBar.open('Unable to open FAQ page right now. Please try again.', 'Close', { duration: 3000 });
    });
  }

  viewTicketStatus(): void {
    this.goToView('tickets');
  }

  private checkActiveTickets(): void {
    // This is now handled by loadTicketStats
  }

  // Support availability
  isSupportAvailable(): boolean {
    return true; // 24/7 support
  }

  getEstimatedResponseTime(): string {
    return 'Within 2 hours';
  }
}
