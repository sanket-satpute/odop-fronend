import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  ChatService, 
  ChatRoom, 
  ChatMessage as ServiceChatMessage,
  CreateChatRoomRequest,
  SendMessageRequest 
} from '../../services/chat.service';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
  isTyping?: boolean;
}

interface QuickReply {
  text: string;
  action: string;
  icon?: string;
}

@Component({
  selector: 'app-live-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './live-chat-widget.component.html',
  styleUrls: ['./live-chat-widget.component.css']
})
export class LiveChatWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  private destroy$ = new Subject<void>();
  
  // UI State
  isOpen: boolean = false;
  isMinimized: boolean = false;
  isConnected: boolean = false;
  isConnecting: boolean = false;
  activeView: 'welcome' | 'rooms' | 'chat' = 'welcome';
  
  // Chat Data
  newMessage: string = '';
  messages: ChatMessage[] = [];
  rooms: ChatRoom[] = [];
  activeRoom: ChatRoom | null = null;
  isAgentTyping: boolean = false;
  unreadCount: number = 0;
  agentName: string = 'Support Agent';
  agentAvatar: string = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100';
  
  quickReplies: QuickReply[] = [
    { text: 'Track my order', action: 'track_order', icon: '📦' },
    { text: 'Return/Refund', action: 'return_refund', icon: '🔄' },
    { text: 'Product inquiry', action: 'product_inquiry', icon: '🛍️' },
    { text: 'About artisans', action: 'artisan_info', icon: '🎨' },
    { text: 'Talk to human', action: 'human_agent', icon: '👤' }
  ];

  // Automated responses for demo/fallback
  autoResponses: { [key: string]: string } = {
    'track_order': 'To track your order, please provide your order ID (format: ORD-XXXX-XXX) or the email used during checkout.',
    'return_refund': 'I can help with returns and refunds. Our policy allows returns within 15 days of delivery. Would you like to initiate a return or check status?',
    'product_inquiry': 'I\'d be happy to help with product information! Please share the product name or link you are interested in.',
    'artisan_info': 'ODOP (One District One Product) connects you directly with authentic Indian artisans. Each product tells a unique story of traditional craftsmanship.',
    'human_agent': 'Connecting you with a live agent. Please wait a moment... Our average wait time is under 2 minutes.',
    'default': 'Thank you for your message. Let me help you with that.'
  };

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Subscribe to chat service observables
    this.subscribeToChat();
    // Add initial greeting
    this.addSystemMessage('Welcome to ODOP Support! How can we assist you today?');
  }

  private subscribeToChat(): void {
    this.chatService.connected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isConnected = connected;
        this.isConnecting = false;
      });

    this.chatService.rooms$
      .pipe(takeUntil(this.destroy$))
      .subscribe(rooms => this.rooms = rooms);

    this.chatService.activeRoom$
      .pipe(takeUntil(this.destroy$))
      .subscribe(room => this.activeRoom = room);

    this.chatService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.unreadCount = count);

    // Subscribe to chat open/close events from service
    this.chatService.chatOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOpen => {
        if (isOpen && !this.isOpen) {
          this.isOpen = true;
          this.isMinimized = false;
          this.unreadCount = 0;
          if (!this.isConnected && !this.isConnecting) {
            this.connectToChat();
          }
          setTimeout(() => this.scrollToBottom(), 100);
        } else if (!isOpen && this.isOpen) {
          this.isOpen = false;
        }
      });

    this.chatService.newMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: ServiceChatMessage) => {
        // Convert service message to local format
        const localMessage: ChatMessage = {
          id: message.id,
          text: message.content,
          sender: message.senderType === 'CUSTOMER' ? 'user' : 'agent',
          timestamp: new Date(message.timestamp)
        };
        this.messages.push(localMessage);
        
        if (!this.isOpen) {
          this.unreadCount++;
          this.playNotificationSound();
        }
        this.scrollToBottom();
      });
  }

  private playNotificationSound(): void {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    this.isMinimized = false;
    if (this.isOpen) {
      this.unreadCount = 0;
      // Connect to chat service if not connected
      if (!this.isConnected && !this.isConnecting) {
        this.connectToChat();
      }
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  private connectToChat(): void {
    this.isConnecting = true;
    const token = localStorage.getItem('auth_token');
    this.chatService.connect(token || undefined);
  }

  // View Navigation
  goToRooms(): void {
    this.activeView = 'rooms';
    this.loadRooms();
  }

  goToChat(room: ChatRoom): void {
    this.activeRoom = room;
    this.activeView = 'chat';
    this.loadMessagesFromRoom(room.id);
  }

  goBack(): void {
    if (this.activeView === 'chat') {
      this.activeView = this.rooms.length > 0 ? 'rooms' : 'welcome';
      this.activeRoom = null;
    } else if (this.activeView === 'rooms') {
      this.activeView = 'welcome';
    }
  }

  loadRooms(): void {
    this.chatService.getChatRooms().subscribe({
      next: (response: any) => {
        this.rooms = response.rooms || [];
      }
    });
  }

  loadMessagesFromRoom(roomId: string): void {
    this.chatService.getRecentMessages(roomId).subscribe({
      next: (response: any) => {
        this.messages = (response.messages || []).map((msg: ServiceChatMessage) => ({
          id: msg.id,
          text: msg.content,
          sender: msg.senderType === 'CUSTOMER' ? 'user' : 'agent',
          timestamp: new Date(msg.timestamp)
        }));
        this.scrollToBottom();
      }
    });
  }

  startNewConversation(topic: string, title: string): void {
    const request: CreateChatRoomRequest = {
      roomType: 'SUPPORT',
      title: title,
      tags: [topic],
      priority: 1
    };

    this.chatService.createChatRoom(request).subscribe({
      next: (response: any) => {
        if (response.chatRoom) {
          this.goToChat(response.chatRoom);
        }
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
      this.closeChat();
    }
  }

  minimizeChat(): void {
    this.isMinimized = true;
  }

  closeChat(): void {
    this.isOpen = false;
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const messageText = this.newMessage.trim();
    
    // If connected to service and have active room, send via service
    if (this.isConnected && this.activeRoom) {
      // sendMessage is void, so no subscription needed
      this.chatService.sendMessage(this.activeRoom.id, messageText, 'TEXT');
      this.newMessage = '';
      this.scrollToBottom();
    } else {
      // Fallback to local simulation
      const message: ChatMessage = {
        id: this.generateId(),
        text: messageText,
        sender: 'user',
        timestamp: new Date()
      };

      this.messages.push(message);
      this.newMessage = '';
      this.scrollToBottom();

      // Simulate agent response
      this.simulateAgentResponse(messageText);
    }
  }

  handleQuickReply(reply: QuickReply): void {
    const message: ChatMessage = {
      id: this.generateId(),
      text: reply.text,
      sender: 'user',
      timestamp: new Date()
    };

    this.messages.push(message);
    this.scrollToBottom();

    // Get automated response
    const response = this.autoResponses[reply.action] || this.autoResponses['default'];
    this.simulateAgentResponse(reply.text, response);
  }

  private simulateAgentResponse(userMessage: string, customResponse?: string): void {
    // Show typing indicator
    this.isAgentTyping = true;

    // Simulate typing delay
    setTimeout(() => {
      this.isAgentTyping = false;
      
      const response = customResponse || this.getAutoResponse(userMessage);
      
      const agentMessage: ChatMessage = {
        id: this.generateId(),
        text: response,
        sender: 'agent',
        timestamp: new Date()
      };

      this.messages.push(agentMessage);
      
      if (!this.isOpen) {
        this.unreadCount++;
      }
      
      this.scrollToBottom();
    }, 1500);
  }

  private getAutoResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('order') && lowerMessage.includes('track')) {
      return this.autoResponses['track_order'];
    } else if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
      return this.autoResponses['return_refund'];
    } else if (lowerMessage.includes('product')) {
      return this.autoResponses['product_inquiry'];
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! Welcome to ODOP Support. How can I help you today?';
    } else if (lowerMessage.includes('thank')) {
      return 'You are welcome! Is there anything else I can help you with?';
    }
    
    return this.autoResponses['default'];
  }

  private addSystemMessage(text: string): void {
    const message: ChatMessage = {
      id: this.generateId(),
      text: text,
      sender: 'system',
      timestamp: new Date()
    };
    this.messages.push(message);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
