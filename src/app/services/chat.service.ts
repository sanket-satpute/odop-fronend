import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, timer } from 'rxjs';
import { takeUntil, tap, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Client, IFrame, IMessage, StompSubscription } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

// ==================== INTERFACES ====================

export interface ChatRoom {
  id: string;
  roomType: string;
  title: string;
  description: string;
  status: string;
  orderId?: string;
  productId?: string;
  vendorId?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  messageCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
  priority: number;
  tags: string[];
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
  role: string;
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderType: string;
  content: string;
  messageType: string;
  status: string;
  timestamp: string;
  readAt?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

export interface ChatEvent {
  eventType: string;
  chatRoomId: string;
  senderId: string;
  payload: any;
  timestamp: string;
}

export interface CreateChatRoomRequest {
  roomType: string;
  title?: string;
  orderId?: string;
  productId?: string;
  vendorId?: string;
  initialMessage?: string;
  tags?: string[];
  priority?: number;
}

export interface SendMessageRequest {
  chatRoomId: string;
  content: string;
  messageType?: string;
  attachments?: Attachment[];
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {

  private apiUrl = `${environment.apiUrl}/odop/chat`;
  private wsUrl = `${environment.apiUrl}/ws/chat`;
  
  // WebSocket client
  private stompClient: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  
  // State management
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private roomsSubject = new BehaviorSubject<ChatRoom[]>([]);
  private activeRoomSubject = new BehaviorSubject<ChatRoom | null>(null);
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private typingUsersSubject = new BehaviorSubject<Map<string, string>>(new Map());
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private chatOpenSubject = new BehaviorSubject<boolean>(false);
  
  // Event emitters
  private newMessageSubject = new Subject<ChatMessage>();
  private chatEventSubject = new Subject<ChatEvent>();
  
  // Cleanup
  private destroy$ = new Subject<void>();
  
  // Public observables
  connected$ = this.connectedSubject.asObservable();
  rooms$ = this.roomsSubject.asObservable();
  activeRoom$ = this.activeRoomSubject.asObservable();
  messages$ = this.messagesSubject.asObservable();
  typingUsers$ = this.typingUsersSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();
  newMessage$ = this.newMessageSubject.asObservable();
  chatEvents$ = this.chatEventSubject.asObservable();
  chatOpen$ = this.chatOpenSubject.asObservable();

  constructor(private http: HttpClient) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  // ==================== CHAT VISIBILITY CONTROL ====================

  /**
   * Open the chat widget
   */
  openChat(): void {
    this.chatOpenSubject.next(true);
  }

  /**
   * Close the chat widget
   */
  closeChat(): void {
    this.chatOpenSubject.next(false);
  }

  /**
   * Toggle the chat widget open/closed
   */
  toggleChat(): void {
    this.chatOpenSubject.next(!this.chatOpenSubject.value);
  }

  /**
   * Check if chat is open
   */
  get isChatOpen(): boolean {
    return this.chatOpenSubject.value;
  }

  // ==================== WEBSOCKET CONNECTION ====================

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): void {
    if (this.stompClient?.connected) {
      return;
    }

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: (str: string) => console.log('STOMP: ' + str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      console.log('Chat WebSocket connected');
      this.connectedSubject.next(true);
      this.subscribeToUserQueue();
    };

    this.stompClient.onDisconnect = () => {
      console.log('Chat WebSocket disconnected');
      this.connectedSubject.next(false);
    };

    this.stompClient.onStompError = (frame: IFrame) => {
      console.error('STOMP error', frame);
    };

    this.stompClient.activate();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
    
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    
    this.connectedSubject.next(false);
  }

  /**
   * Subscribe to user's personal queue
   */
  private subscribeToUserQueue(): void {
    if (!this.stompClient?.connected) return;
    
    const sub = this.stompClient.subscribe('/user/queue/joined', (message: IMessage) => {
      const room = JSON.parse(message.body);
      this.activeRoomSubject.next(room);
    });
    
    this.subscriptions.set('user-queue', sub);
  }

  /**
   * Subscribe to a chat room
   */
  subscribeToRoom(roomId: string): void {
    if (!this.stompClient?.connected) return;
    
    // Unsubscribe from previous room
    const existingSub = this.subscriptions.get(`room-${roomId}`);
    if (existingSub) {
      existingSub.unsubscribe();
    }
    
    const sub = this.stompClient.subscribe(`/topic/chat/${roomId}`, (message: IMessage) => {
      const event: ChatEvent = JSON.parse(message.body);
      this.handleChatEvent(event);
    });
    
    this.subscriptions.set(`room-${roomId}`, sub);
    
    // Notify server we joined
    this.stompClient.publish({
      destination: '/app/chat.join',
      body: JSON.stringify({ roomId })
    });
  }

  /**
   * Unsubscribe from a chat room
   */
  unsubscribeFromRoom(roomId: string): void {
    const sub = this.subscriptions.get(`room-${roomId}`);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(`room-${roomId}`);
    }
    
    // Notify server we left
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/chat.leave',
        body: JSON.stringify({ roomId })
      });
    }
  }

  /**
   * Handle incoming chat events
   */
  private handleChatEvent(event: ChatEvent): void {
    this.chatEventSubject.next(event);
    
    switch (event.eventType) {
      case 'NEW_MESSAGE':
        const message = event.payload as ChatMessage;
        this.addMessage(message);
        this.newMessageSubject.next(message);
        break;
        
      case 'TYPING':
        this.updateTypingStatus(event.payload);
        break;
        
      case 'MESSAGES_READ':
        this.updateMessageStatus(event.payload.messageIds, 'READ');
        break;
        
      case 'ROOM_STATUS_CHANGED':
        this.updateRoomStatus(event.chatRoomId, event.payload.status);
        break;
    }
  }

  // ==================== CHAT ROOM OPERATIONS ====================

  /**
   * Create a new chat room
   */
  createChatRoom(request: CreateChatRoomRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rooms`, request).pipe(
      tap(response => {
        if (response.success && response.room) {
          this.addRoom(response.room);
          this.activeRoomSubject.next(response.room);
          this.subscribeToRoom(response.room.id);
        }
      })
    );
  }

  /**
   * Get chat room by ID
   */
  getChatRoom(roomId: string): Observable<ChatRoom> {
    return this.http.get<ChatRoom>(`${this.apiUrl}/rooms/${roomId}`);
  }

  /**
   * Get user's chat rooms
   */
  getChatRooms(page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/rooms`, { params }).pipe(
      tap(response => {
        if (response.success) {
          this.roomsSubject.next(response.rooms);
          this.calculateUnreadCount(response.rooms);
        }
      })
    );
  }

  /**
   * Get active chats
   */
  getActiveChats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rooms/active`).pipe(
      tap(response => {
        if (response.success) {
          this.roomsSubject.next(response.rooms);
        }
      })
    );
  }

  /**
   * Open a chat room
   */
  openRoom(room: ChatRoom): void {
    this.activeRoomSubject.next(room);
    this.messagesSubject.next([]);
    this.subscribeToRoom(room.id);
    this.loadMessages(room.id);
    this.markAsRead(room.id);
  }

  /**
   * Close active chat room
   */
  closeRoom(): void {
    const room = this.activeRoomSubject.value;
    if (room) {
      this.unsubscribeFromRoom(room.id);
    }
    this.activeRoomSubject.next(null);
    this.messagesSubject.next([]);
  }

  // ==================== MESSAGE OPERATIONS ====================

  /**
   * Send a message via REST (fallback)
   */
  sendMessageRest(roomId: string, content: string, messageType: string = 'TEXT'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rooms/${roomId}/messages`, {
      chatRoomId: roomId,
      content,
      messageType
    });
  }

  /**
   * Send a message via WebSocket
   */
  sendMessage(roomId: string, content: string, messageType: string = 'TEXT'): void {
    if (!this.stompClient?.connected) {
      // Fallback to REST
      this.sendMessageRest(roomId, content, messageType).subscribe({
        error: (err) => console.error('Failed to send message via REST:', err)
      });
      return;
    }

    this.stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        chatRoomId: roomId,
        content,
        messageType
      })
    });
  }

  /**
   * Load messages for a room
   */
  loadMessages(roomId: string, page: number = 0, size: number = 50): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/rooms/${roomId}/messages`, { params }).pipe(
      tap(response => {
        if (response.success) {
          if (page === 0) {
            this.messagesSubject.next(response.messages);
          } else {
            const currentMessages = this.messagesSubject.value;
            this.messagesSubject.next([...response.messages, ...currentMessages]);
          }
        }
      })
    );
  }

  /**
   * Get recent messages
   */
  getRecentMessages(roomId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rooms/${roomId}/messages/recent`);
  }

  /**
   * Mark messages as read
   */
  markAsRead(roomId: string): void {
    // Via WebSocket
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/chat.read',
        body: JSON.stringify({ roomId })
      });
    }
    
    // Also via REST to ensure it's processed
    this.http.post<any>(`${this.apiUrl}/rooms/${roomId}/read`, {}).subscribe({
      error: (err) => console.error('Failed to mark messages as read:', err)
    });
  }

  /**
   * Search messages
   */
  searchMessages(roomId: string, query: string): Observable<any> {
    const params = new HttpParams().set('q', query);
    return this.http.get<any>(`${this.apiUrl}/rooms/${roomId}/search`, { params });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(roomId: string, isTyping: boolean): void {
    if (!this.stompClient?.connected) return;
    
    this.stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ roomId, isTyping })
    });
  }

  // ==================== SUPPORT QUICK ACTIONS ====================

  /**
   * Start customer support chat
   */
  startSupportChat(initialMessage?: string): Observable<any> {
    return this.createChatRoom({
      roomType: 'CUSTOMER_SUPPORT',
      initialMessage
    });
  }

  /**
   * Start order inquiry chat
   */
  startOrderInquiry(orderId: string, orderInfo: string, message?: string): Observable<any> {
    return this.createChatRoom({
      roomType: 'ORDER_INQUIRY',
      orderId,
      title: orderInfo,
      initialMessage: message
    });
  }

  /**
   * Start product inquiry (chat with vendor)
   */
  startProductInquiry(productId: string, vendorId: string, message?: string): Observable<any> {
    return this.createChatRoom({
      roomType: 'PRODUCT_INQUIRY',
      productId,
      vendorId,
      initialMessage: message
    });
  }

  // ==================== SUPPORT AGENT OPERATIONS ====================

  /**
   * Get waiting tickets (for support agents)
   */
  getWaitingTickets(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/support/waiting`);
  }

  /**
   * Get agent's tickets
   */
  getMyTickets(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/support/my-tickets`);
  }

  /**
   * Assign ticket to self
   */
  assignToSelf(roomId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/support/assign`, { chatRoomId: roomId });
  }

  /**
   * Close ticket
   */
  closeTicket(roomId: string, resolution: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/support/close`, { 
      chatRoomId: roomId, 
      resolution 
    });
  }

  /**
   * Get chat statistics
   */
  getChatStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/support/stats`);
  }

  // ==================== STATE HELPERS ====================

  private addRoom(room: ChatRoom): void {
    const rooms = this.roomsSubject.value;
    const index = rooms.findIndex(r => r.id === room.id);
    if (index >= 0) {
      rooms[index] = room;
    } else {
      rooms.unshift(room);
    }
    this.roomsSubject.next([...rooms]);
  }

  private addMessage(message: ChatMessage): void {
    const messages = this.messagesSubject.value;
    const exists = messages.some(m => m.id === message.id);
    if (!exists) {
      this.messagesSubject.next([...messages, message]);
    }
  }

  private updateTypingStatus(payload: any): void {
    const typingUsers = this.typingUsersSubject.value;
    if (payload.isTyping) {
      typingUsers.set(payload.userId, payload.userName);
    } else {
      typingUsers.delete(payload.userId);
    }
    this.typingUsersSubject.next(new Map(typingUsers));
  }

  private updateMessageStatus(messageIds: string[], status: string): void {
    const messages = this.messagesSubject.value;
    messages.forEach(m => {
      if (messageIds.includes(m.id)) {
        m.status = status;
      }
    });
    this.messagesSubject.next([...messages]);
  }

  private updateRoomStatus(roomId: string, status: string): void {
    const rooms = this.roomsSubject.value;
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      room.status = status;
      this.roomsSubject.next([...rooms]);
    }
    
    const activeRoom = this.activeRoomSubject.value;
    if (activeRoom?.id === roomId) {
      this.activeRoomSubject.next({ ...activeRoom, status });
    }
  }

  private calculateUnreadCount(rooms: ChatRoom[]): void {
    const total = rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
    this.unreadCountSubject.next(total);
  }

  // ==================== UTILITIES ====================

  /**
   * Format timestamp
   */
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString();
  }

  /**
   * Get sender initials
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Health check
   */
  healthCheck(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/health`);
  }
}
