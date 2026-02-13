import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ChatService, ChatRoom, ChatMessage as APIChatMessage } from '../../../services/chat.service';
import { UserStateService } from '../../../project/services/user-state.service';

interface Conversation {
  id: string;
  customerName: string;
  customerAvatar: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isOnline: boolean;
  type: 'inquiry' | 'order' | 'support';
  orderRef?: string;
  roomId: string;
}

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  status: 'sent' | 'delivered' | 'read';
}

interface QuickReply {
  id: number;
  label: string;
  message: string;
}

@Component({
  selector: 'app-vendor-dashboard-messages',
  templateUrl: './vendor-dashboard-messages.component.html',
  styleUrls: ['./vendor-dashboard-messages.component.css']
})
export class VendorDashboardMessagesComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private vendorId: string = '';

  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  newMessage: string = '';

  // Loading and error states
  isLoading: boolean = false;
  messagesLoading: boolean = false;
  loadError: string | null = null;

  quickReplies: QuickReply[] = [
    { id: 1, label: 'Thank You', message: 'Thank you for your message! We appreciate your interest in our products.' },
    { id: 2, label: 'Shipping Info', message: 'Your order will be shipped within 2-3 business days. You will receive a tracking number via email.' },
    { id: 3, label: 'Available', message: 'Yes, this product is currently available. Would you like to place an order?' },
    { id: 4, label: 'Bulk Order', message: 'We offer special discounts on bulk orders. Please share the quantity you need for a custom quote.' },
    { id: 5, label: 'Custom Request', message: 'We can accommodate custom requests. Please share your specific requirements.' }
  ];

  searchQuery: string = '';
  activeFilter: string = 'all';

  // Stats - calculated from API data
  totalMessages: number = 0;
  unreadMessages: number = 0;
  avgResponseTime: string = 'N/A';
  satisfactionRate: number = 0;

  constructor(
    private chatService: ChatService,
    private userStateService: UserStateService
  ) { }

  ngOnInit(): void {
    // Get vendor ID from user state
    const currentVendor = this.userStateService.vendor;
    if (currentVendor?.vendorId) {
      this.vendorId = currentVendor.vendorId;
    } else {
      const storedVendor = localStorage.getItem('vendor');
      if (storedVendor) {
        try {
          const vendor = JSON.parse(storedVendor);
          this.vendorId = vendor.vendorId || '';
        } catch (e) {
          this.vendorId = '';
        }
      }
    }

    this.loadConversations();
    
    // Subscribe to new messages
    this.chatService.newMessage$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(message => {
      if (this.selectedConversation?.roomId === message.chatRoomId) {
        this.messages.push(this.mapAPIMessage(message));
      }
      // Update conversation list
      this.updateConversationLastMessage(message);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatService.closeRoom();
  }

  loadConversations(): void {
    this.isLoading = true;
    this.loadError = null;

    this.chatService.getChatRooms(0, 50).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        if (response.success && response.rooms) {
          this.conversations = this.mapRoomsToConversations(response.rooms);
          this.calculateStats();
          
          // Select first conversation by default
          if (this.conversations.length > 0) {
            this.selectConversation(this.conversations[0]);
          }
        }
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.loadError = error.error?.message || 'Failed to load messages. Please try again.';
      }
    });
  }

  private mapRoomsToConversations(rooms: ChatRoom[]): Conversation[] {
    return rooms.map(room => {
      // Find the other participant (customer)
      const customerParticipant = room.participants?.find(p => p.role !== 'VENDOR') || room.participants?.[0];
      
      return {
        id: room.id,
        roomId: room.id,
        customerName: customerParticipant?.name || room.title || 'Unknown',
        customerAvatar: this.getInitials(customerParticipant?.name || room.title || 'U'),
        lastMessage: room.lastMessagePreview || 'No messages yet',
        timestamp: new Date(room.lastMessageAt || room.createdAt),
        unreadCount: room.unreadCount || 0,
        isOnline: customerParticipant?.isOnline || false,
        type: this.mapRoomType(room.roomType),
        orderRef: room.orderId ? `#${room.orderId}` : undefined
      };
    });
  }

  private mapRoomType(roomType: string): 'inquiry' | 'order' | 'support' {
    switch (roomType) {
      case 'PRODUCT_INQUIRY': return 'inquiry';
      case 'ORDER_INQUIRY': return 'order';
      case 'CUSTOMER_SUPPORT': return 'support';
      default: return 'inquiry';
    }
  }

  private getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  private calculateStats(): void {
    this.totalMessages = this.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0) + this.conversations.length * 5; // estimate
    this.unreadMessages = this.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    this.avgResponseTime = '15 min'; // Would need API endpoint for this
    this.satisfactionRate = 96; // Would need API endpoint for this
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    this.loadMessages(conversation.roomId);
    // Mark as read
    conversation.unreadCount = 0;
    this.chatService.markAsRead(conversation.roomId);
  }

  loadMessages(roomId: string): void {
    this.messagesLoading = true;
    
    this.chatService.loadMessages(roomId, 0, 50).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.messagesLoading = false)
    ).subscribe({
      next: (response) => {
        if (response.success && response.messages) {
          this.messages = response.messages.map((m: APIChatMessage) => this.mapAPIMessage(m));
        }
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });
  }

  private mapAPIMessage(apiMessage: APIChatMessage): Message {
    const isOwn = apiMessage.senderType === 'VENDOR' || apiMessage.senderId === this.vendorId;
    return {
      id: apiMessage.id,
      content: apiMessage.content,
      timestamp: new Date(apiMessage.timestamp),
      isOwn,
      status: this.mapMessageStatus(apiMessage.status)
    };
  }

  private mapMessageStatus(status: string): 'sent' | 'delivered' | 'read' {
    switch (status?.toUpperCase()) {
      case 'READ': return 'read';
      case 'DELIVERED': return 'delivered';
      default: return 'sent';
    }
  }

  private updateConversationLastMessage(message: APIChatMessage): void {
    const conversation = this.conversations.find(c => c.roomId === message.chatRoomId);
    if (conversation) {
      conversation.lastMessage = message.content;
      conversation.timestamp = new Date(message.timestamp);
      if (this.selectedConversation?.roomId !== message.chatRoomId) {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
      }
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation) return;
    
    const roomId = this.selectedConversation.roomId;
    const content = this.newMessage;
    
    // Optimistically add message to UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: content,
      timestamp: new Date(),
      isOwn: true,
      status: 'sent'
    };
    
    this.messages.push(optimisticMessage);
    this.newMessage = '';
    
    // Send via service (uses WebSocket if connected, REST as fallback)
    this.chatService.sendMessage(roomId, content);
  }

  useQuickReply(reply: QuickReply): void {
    this.newMessage = reply.message;
  }

  filterConversations(filter: string): void {
    this.activeFilter = filter;
  }

  get filteredConversations(): Conversation[] {
    let result = this.conversations;
    
    if (this.searchQuery) {
      result = result.filter(c => 
        c.customerName.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    
    if (this.activeFilter !== 'all') {
      result = result.filter(c => c.type === this.activeFilter);
    }
    
    return result;
  }

  refreshData(): void {
    this.loadConversations();
  }

  getTimeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getTypeIcon(type: string): string {
    switch(type) {
      case 'inquiry': return 'fa-question-circle';
      case 'order': return 'fa-shopping-bag';
      case 'support': return 'fa-headset';
      default: return 'fa-envelope';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'sent': return 'fa-check';
      case 'delivered': return 'fa-check-double';
      case 'read': return 'fa-check-double';
      default: return 'fa-check';
    }
  }
}
