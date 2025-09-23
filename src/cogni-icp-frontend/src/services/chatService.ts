import { io, Socket } from 'socket.io-client';
import { authService } from './authService';
import api from '../utils/apiClient';
import Cookies from 'js-cookie';

// Types
export interface Message {
  id: number;
  group_id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  attachments?: any[];
}

export interface ChatEvent {
  type: string;
  payload: any;
}

type ChatEventListener = (event: ChatEvent) => void;

class ChatService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private listeners: ChatEventListener[] = [];
  private activeGroupId: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private MAX_RECONNECT_ATTEMPTS = 5;
  private RECONNECT_DELAY = 3000; // 3 seconds

  // Connect to WebSocket server
  async connect(): Promise<boolean> {
    // Don't reconnect if already connected
    if (this.connected && this.socket) {
      return true;
    }

    try {
      // Get auth token from cookies (same as apiClient)
      const token = Cookies.get('token');
      if (!token) {
        console.error('Cannot connect to chat: No authentication token');
        return false;
      }

      // Create socket connection with token
      this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        query: { token },
        transports: ['polling', 'websocket'], // Prefer polling first to avoid ws interrupt during page load
        reconnection: false, // We'll handle reconnection ourselves
        path: '/socket.io',
        withCredentials: true
      });

      // Setup event handlers
      this.setupEventHandlers();

      return new Promise((resolve) => {
        if (!this.socket) {
          resolve(false);
          return;
        }

        // Handle successful connection
        this.socket.on('connect', () => {
          console.log('Connected to chat service');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.notifyListeners({ type: 'connected', payload: {} });
          resolve(true);
        });

        // Handle connection error
        this.socket.on('connect_error', (error) => {
          console.error('Chat connection error:', error);
          this.cleanup();
          resolve(false);
          this.scheduleReconnect();
        });
      });
    } catch (error) {
      console.error('Error connecting to chat:', error);
      this.cleanup();
      this.scheduleReconnect();
      return false;
    }
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    this.leaveGroup();
    this.cleanup();
    this.notifyListeners({ type: 'disconnected', payload: {} });
  }

  // Clean up socket resources
  private cleanup(): void {
    if (this.socket) {
      this.socket.off();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.activeGroupId = null;
  }

  // Schedule a reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}`);
      
      this.reconnectTimer = setTimeout(async () => {
        console.log(`Attempting to reconnect to chat (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
        const success = await this.connect();
        
        if (success && this.activeGroupId) {
          // Rejoin the active group if connection was successful
          this.joinGroup(this.activeGroupId);
        }
      }, this.RECONNECT_DELAY);
    } else {
      console.error('Maximum reconnection attempts reached');
      this.notifyListeners({ 
        type: 'error', 
        payload: { message: 'Unable to connect to chat service after multiple attempts' } 
      });
      // Instead of using toast directly, emit an error event that components can handle
      this.notifyListeners({
        type: 'toast',
        payload: {
          type: 'error',
          message: 'Unable to connect to chat service. Please refresh the page to try again.'
        }
      });
    }
  }

  // Setup WebSocket event handlers
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Handle disconnect
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from chat service:', reason);
      this.connected = false;
      this.notifyListeners({ type: 'disconnected', payload: { reason } });
      this.scheduleReconnect();
    });

    // Handle errors
    this.socket.on('error', (error) => {
      console.error('Chat error:', error);
      this.notifyListeners({ type: 'error', payload: error });
    });

    // Handle new messages
    this.socket.on('new_message', (message) => {
      this.notifyListeners({ type: 'new_message', payload: message });
    });

    // Handle user joined
    this.socket.on('user_joined', (data) => {
      this.notifyListeners({ type: 'user_joined', payload: data });
    });

    // Handle user left
    this.socket.on('user_left', (data) => {
      this.notifyListeners({ type: 'user_left', payload: data });
    });

    // Handle typing started
    this.socket.on('typing_started', (data) => {
      this.notifyListeners({ type: 'typing_started', payload: data });
    });

    // Handle typing stopped
    this.socket.on('typing_stopped', (data) => {
      this.notifyListeners({ type: 'typing_stopped', payload: data });
    });

    // Handle joined confirmation
    this.socket.on('joined', (data) => {
      this.notifyListeners({ type: 'joined', payload: data });
    });

    // Handle left confirmation
    this.socket.on('left', (data) => {
      this.notifyListeners({ type: 'left', payload: data });
    });
  }

  // Join a group chat
  joinGroup(groupId: string): void {
    // If already in this group, don't join again
    if (this.activeGroupId === groupId) {
      console.log(`Already joined group chat: ${groupId}`);
      return;
    }
    
    if (!this.socket || !this.connected) {
      console.error('Cannot join group: Not connected to chat service');
      this.connect().then((success) => {
        if (success) {
          this.doJoinGroup(groupId);
        }
      });
      return;
    }

    this.doJoinGroup(groupId);
  }

  // Actually perform the join operation
  private doJoinGroup(groupId: string): void {
    if (!this.socket) return;
    
    // Leave current group if any
    if (this.activeGroupId && this.activeGroupId !== groupId) {
      this.leaveGroup();
    }

    // Join new group
    this.socket.emit('join', { group_id: groupId });
    this.activeGroupId = groupId;
    console.log(`Joined group chat: ${groupId}`);
  }

  // Leave current group chat
  leaveGroup(): void {
    if (!this.socket || !this.connected || !this.activeGroupId) {
      return;
    }

    this.socket.emit('leave', { group_id: this.activeGroupId });
    console.log(`Left group chat: ${this.activeGroupId}`);
    this.activeGroupId = null;
  }

  // Send a message to the active group
  sendMessage(content: string, attachments?: any[]): void {
    if (!this.socket || !this.connected || !this.activeGroupId) {
      console.error('Cannot send message: Not in a group chat');
      return;
    }
    
    this.socket.emit('send_message', {
      group_id: this.activeGroupId,
      content,
      attachments
    });
  }
  
  // Notify that user started typing
  sendTypingStarted(): void {
    if (this.socket && this.connected && this.activeGroupId) {
      this.socket.emit('typing_start', { group_id: this.activeGroupId });
    }
  }

  // Notify that user stopped typing
  sendTypingStopped(): void {
    if (this.socket && this.connected && this.activeGroupId) {
      this.socket.emit('typing_stop', { group_id: this.activeGroupId });
    }
  }

  // Add event listener
  addEventListener(listener: ChatEventListener): void {
    this.listeners.push(listener);
  }

  // Remove event listener
  removeEventListener(listener: ChatEventListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Notify all listeners of an event
  private notifyListeners(event: ChatEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in chat event listener:', error);
      }
    });
  }

  // Get historical messages for a group
  async getMessages(groupPublicId: string, page: number = 1, limit: number = 20): Promise<Message[]> {
    try {
      const response = await api.get(`/api/study-groups/${groupPublicId}/messages`, {
        params: { page, limit }
      });
      return response.data.messages || [];
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
  }
}

// Export as singleton
export const chatService = new ChatService(); 