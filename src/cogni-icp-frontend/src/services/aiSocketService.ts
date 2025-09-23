import { io, Socket } from 'socket.io-client';
import { authService } from './authService';

// Constants
const CONNECTION_TIMEOUT = 5000; // 5 seconds timeout for connection attempts
const RECONNECT_DELAY = 2000; // 2 seconds
const MAX_RECONNECT_ATTEMPTS = 3;

// Types
export interface TutorMessageChunk {
  id?: string;  // Optional ID for the message chunk
  content: string;
  isComplete?: boolean;
}

export interface ProgressUpdate {
  session_id: string;
  user_id: number;
  progress: {
    id: number;
    user_id: number;
    session_id: number;
    course_id: number;
    current_module_id: number | null;
    progress_percentage: number;
    last_activity: string;
  };
}

export type TutorStatus = 'idle' | 'thinking' | 'responding' | 'error';

interface AISocketEvents {
  message: (data: any) => void;
  error: (error: any) => void;
  connect: () => void;
  disconnect: () => void;
}

class AISocketService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private messageListeners = new Map<string, (chunk: TutorMessageChunk) => void>();
  private statusListeners: ((status: TutorStatus) => void)[] = [];
  private progressListeners: ((progress: ProgressUpdate) => void)[] = [];
  private userMessageListeners: ((message: any) => void)[] = [];
  private currentStatus: TutorStatus = 'idle';
  private connectionPromise: Promise<boolean> | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: ((message: TutorMessageChunk) => void)[] = [];
  private errorHandlers: ((error: any) => void)[] = [];
  private isConnected = false;
  private maxReconnectAttempts: number = 3;
  private reconnectDelay: number = 1000;
  private errorListeners = new Set<(error: Error) => void>();
  private progressUpdateListeners = new Set<(update: ProgressUpdate) => void>();
  private tutorAudioReadyListeners = new Set<(data: { message_id: string; audio_url: string }) => void>();

  constructor() {
    // Initialize any necessary setup
  }

  private getAuthToken(): string | null {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('AISocketService: No authentication token available');
        return null;
      }
      return token;
    } catch (error) {
      console.error('AISocketService: Error getting auth token:', error);
      return null;
    }
  }

  public checkAuthentication(): { isAuthenticated: boolean; errorMessage?: string } {
    const token = this.getAuthToken();
    if (!token) {
      return { isAuthenticated: false, errorMessage: 'No authentication token found' };
    }

    try {
      // Basic token validation
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return { isAuthenticated: false, errorMessage: 'Invalid token format' };
      }

      // Check if token is expired
      const payload = JSON.parse(atob(tokenParts[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      if (Date.now() >= expirationTime) {
        return { isAuthenticated: false, errorMessage: 'Token has expired' };
      }

      return { isAuthenticated: true };
    } catch (error) {
      console.error('Error validating token:', error);
      return { isAuthenticated: false, errorMessage: 'Error validating token' };
    }
  }

  public onProgressUpdate(callback: (progress: ProgressUpdate) => void): void {
    this.progressListeners.push(callback);
  }

  public offProgressUpdate(callback: (progress: ProgressUpdate) => void): void {
    this.progressListeners = this.progressListeners.filter(cb => cb !== callback);
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('progress_update', (data: ProgressUpdate) => {
      this.progressListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in progress update handler:', error);
        }
      });
    });

    // ... existing socket listeners ...
  }

  public async connect(sessionId: string): Promise<boolean> {
    if (this.connectionPromise) {
      console.log('AISocketService: Returning existing connection promise');
      return this.connectionPromise;
    }

    if (this.socket?.connected) {
      console.log('AISocketService: Already connected');
      return true;
    }

    const authCheck = this.checkAuthentication();
    if (!authCheck.isAuthenticated) {
      console.error('AISocketService: Authentication failed:', authCheck.errorMessage);
      this.disconnect();
      return false;
    }

    if (this.isConnecting) {
      console.log('AISocketService: Connection attempt already in progress');
      return false;
    }

    // Clean up any existing socket
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }

    this.isConnecting = true;
    this.sessionId = sessionId;
      
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Get the API URL from environment variables or use a default
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Connect to the WebSocket server with improved Socket.IO configuration
      const socket = io(`${apiUrl}/tutor`, {
        auth: { token },
        transports: ['polling', 'websocket'], // Prefer polling first to avoid ws interrupt during page load
        reconnection: true,
        reconnectionAttempts: 5, // Increased from 3
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 30000, // Increased timeout
        autoConnect: false,
        forceNew: true, // Force new connection
        path: '/socket.io'
      });

      this.socket = socket;
      this.setupSocketListeners();

      this.connectionPromise = new Promise((resolve) => {
        // Handle successful connection
        socket.on('connect', () => {
          console.log('AISocketService: Connected successfully to Socket.IO server');
          this.isConnecting = false;
          this.isConnected = true;
          this.currentStatus = 'idle';
          this.reconnectAttempts = 0;
          
          // Join the session room using the /tutor namespace
          socket.emit('join', { sessionId }, (response: any) => {
            if (response?.error) {
              console.error('AISocketService: Failed to join session:', response.error);
              this.handleError(new Error(response.error));
              resolve(false);
            } else {
              console.log('AISocketService: Joined session successfully');
              resolve(true);
            }
          });
        });

        // Handle connection error
        socket.on('connect_error', (error: any) => {
          console.error('AISocketService: Connection error:', error);
          this.handleError(error);
          this.handleConnectionFailure();
          resolve(false);
        });

        // Handle reconnection attempts
        socket.on('reconnect_attempt', (attemptNumber: number) => {
          console.log(`AISocketService: Reconnection attempt ${attemptNumber}`);
          this.reconnectAttempts = attemptNumber;
        });

        // Handle reconnection failure
        socket.on('reconnect_failed', () => {
          console.error('AISocketService: Failed to reconnect after all attempts');
          this.handleError(new Error('Failed to reconnect'));
        });

        // Handle successful reconnection
        socket.on('reconnect', (attemptNumber: number) => {
          console.log(`AISocketService: Reconnected after ${attemptNumber} attempts`);
          this.reconnectAttempts = 0;
          this.isConnected = true;
          if (this.sessionId) {
            socket.emit('join', { sessionId: this.sessionId });
          }
        });

        // Handle messages from the tutor
        socket.on('tutor_message_chunk', (chunk: TutorMessageChunk) => {
          this.handleMessage(chunk);
        });

        socket.on('tutor_message_complete', () => {
          this.handleMessage({ content: '', isComplete: true });
        });

        // Handle user messages for cross-device synchronization
        socket.on('user_message', (userMsg: any) => {
          this.userMessageListeners.forEach(listener => listener(userMsg));
        });

        socket.on('tutor_audio_ready', (data: { message_id: string; audio_url: string }) => {
          this.tutorAudioReadyListeners.forEach(listener => listener(data));
        });

        // Handle disconnection
        socket.on('disconnect', (reason: string) => {
          console.log('AISocketService: Disconnected, reason:', reason);
          this.isConnected = false;
          this.currentStatus = 'error';
          this.notifyStatusChange('error');
          
          // Only attempt to reconnect if it's not a client-initiated disconnect
          if (reason !== 'io client disconnect') {
            console.log('AISocketService: Attempting to reconnect after disconnect');
            setTimeout(() => {
              if (this.sessionId && !this.socket?.connected) {
                this.connect(this.sessionId);
              }
            }, 2000);
          }
        });

        // Start the connection
        socket.connect();
      });

      const result = await this.connectionPromise;
      this.connectionPromise = null;
      return result;
    } catch (error) {
      console.error('AISocketService: Connection error:', error);
      this.handleError(error);
      this.handleConnectionFailure();
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  private handleConnectionFailure(): void {
    this.isConnecting = false;
    this.currentStatus = 'error';
    this.notifyStatusChange('error');

    if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
      console.log(`AISocketService: Attempting reconnection (${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`);

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      this.reconnectTimeout = setTimeout(() => {
        if (this.sessionId) {
          this.connect(this.sessionId);
        }
      }, delay);
    } else {
      console.log('AISocketService: Max reconnection attempts reached');
      this.disconnect();
    }
  }

  public disconnect(): void {
    console.log('AISocketService: Disconnecting...');
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Clear any pending connection promise
    this.connectionPromise = null;
    
    // Reset state before disconnecting socket
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.currentStatus = 'idle';
    this.isConnected = false;
    this.sessionId = null;
    
    // Clean up socket
    if (this.socket) {
      // Remove all listeners before disconnecting
      this.socket.removeAllListeners();
      
      // Only disconnect if still connected
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      
      // Force close the socket
      this.socket.close();
      this.socket = null;
    }
    
    console.log('AISocketService: Disconnected successfully');
  }

  public sendMessage(content: string, timestamp?: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('message', { content, timestamp });
    } else {
      console.warn('AISocketService: Cannot send message - not connected');
    }
  }

  public sendVoiceMessage(transcript: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('voice_message', { transcript });
    } else {
      console.warn('AISocketService: Cannot send voice message - not connected');
    }
  }

  public addMessageListener(sessionId: string, listener: (chunk: TutorMessageChunk) => void): void {
    this.messageListeners.set(sessionId, listener);
  }

  public removeMessageListener(sessionId: string, listener: (chunk: TutorMessageChunk) => void): void {
    this.messageListeners.delete(sessionId);
  }

  public onTutorStatusChange(listener: (status: TutorStatus) => void): void {
    this.statusListeners.push(listener);
  }

  public offTutorStatusChange(listener: (status: TutorStatus) => void): void {
    this.statusListeners = this.statusListeners.filter(l => l !== listener);
  }

  private notifyStatusChange(status: TutorStatus): void {
    this.statusListeners.forEach(listener => listener(status));
  }

  public getCurrentStatus(): TutorStatus {
    return this.currentStatus;
  }

  private handleError(error: any): void {
    this.errorHandlers.forEach(handler => handler(error));
  }

  private handleMessage(message: any): void {
    const messageChunk: TutorMessageChunk = {
      id: message.id,
      content: message.content,
      isComplete: message.isComplete
    };
    this.messageHandlers.forEach(handler => handler(messageChunk));
  }

  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  public onMessage(handler: (message: TutorMessageChunk) => void): void {
    this.messageHandlers.push(handler);
  }

  public offMessage(handler: (message: TutorMessageChunk) => void): void {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  public onUserMessage(handler: (message: any) => void): void {
    this.userMessageListeners.push(handler);
  }

  public offUserMessage(handler: (message: any) => void): void {
    this.userMessageListeners = this.userMessageListeners.filter(h => h !== handler);
  }

  public onError(handler: (error: any) => void): void {
    this.errorHandlers.push(handler);
  }

  public offError(handler: (error: any) => void): void {
    this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
  }

  public onTutorAudioReady(listener: (data: { message_id: string; audio_url: string }) => void): void {
    this.tutorAudioReadyListeners.add(listener);
  }

  public offTutorAudioReady(listener: (data: { message_id: string; audio_url: string }) => void): void {
    this.tutorAudioReadyListeners.delete(listener);
  }
}

// Create a single instance of the service
const aiSocketService = new AISocketService();
export { aiSocketService }; 
