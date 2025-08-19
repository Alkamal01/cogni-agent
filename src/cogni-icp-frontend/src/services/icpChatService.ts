import { useAuth } from '../contexts/AuthContext';

// Types
export interface TutorMessageChunk {
  id?: string;
  content: string;
  isComplete?: boolean;
  timestamp: string;
  sender: 'user' | 'tutor';
}

export interface ProgressUpdate {
  session_id: string;
  user_id: string;
  progress: {
    id: number;
    user_id: string;
    session_id: string;
    course_id: number;
    current_module_id: number | null;
    progress_percentage: number;
    last_activity: string;
  };
}

export type TutorStatus = 'idle' | 'thinking' | 'responding' | 'error';

interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'tutor';
  content: string;
  timestamp: string;
  has_audio?: boolean;
}

class ICPChatService {
  private messageListeners: ((chunk: TutorMessageChunk) => void)[] = [];
  private statusListeners: ((status: TutorStatus) => void)[] = [];
  private progressListeners: ((progress: ProgressUpdate) => void)[] = [];
  private currentStatus: TutorStatus = 'idle';
  private sessionId: string | null = null;
  private backendActor: any = null;
  private isConnected = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastMessageId: string | null = null;
  private messageCount: number = 0;

  constructor() {
    // Initialize the service
  }

  public setBackendActor(actor: any): void {
    this.backendActor = actor;
    console.log('ICPChatService: Backend actor set');
  }

  public async connect(sessionId: string): Promise<boolean> {
    try {
      if (!this.backendActor) {
        console.error('ICPChatService: Backend actor not available');
        return false;
      }

      this.sessionId = sessionId;
      this.isConnected = true;
      this.currentStatus = 'idle';
      this.messageCount = 0;
      
      console.log('ICPChatService: Connected to ICP backend for session:', sessionId);
      
      // Load existing messages
      await this.loadExistingMessages();
      
      // Start polling for new messages
      this.startPolling();
      
      return true;
    } catch (error) {
      console.error('ICPChatService: Connection failed:', error);
      this.currentStatus = 'error';
      return false;
    }
  }

  private async loadExistingMessages(): Promise<void> {
    if (!this.backendActor || !this.sessionId) return;

    try {
      const result = await this.backendActor.get_session_messages(this.sessionId);
      if ('Ok' in result) {
        const messages = result.Ok;
        this.messageCount = messages.length;
        
        // Emit existing messages
        messages.forEach((msg: any) => {
          const chunk: TutorMessageChunk = {
            id: msg.id,
            content: msg.content,
            isComplete: true,
            timestamp: msg.timestamp,
            sender: msg.sender
          };
          this.notifyMessageListeners(chunk);
        });
      }
    } catch (error) {
      console.error('ICPChatService: Error loading existing messages:', error);
    }
  }

  public disconnect(): void {
    this.isConnected = false;
    this.sessionId = null;
    this.stopPolling();
    console.log('ICPChatService: Disconnected');
  }

  public async sendMessage(content: string): Promise<boolean> {
    try {
      if (!this.backendActor || !this.sessionId) {
        console.error('ICPChatService: Not connected or session not available');
        return false;
      }

      this.currentStatus = 'thinking';
      this.notifyStatusListeners();

      // Add user message immediately to UI
      const userChunk: TutorMessageChunk = {
        content: content,
        isComplete: true,
        timestamp: new Date().toISOString(),
        sender: 'user'
      };
      this.notifyMessageListeners(userChunk);

      // Send message to the backend
      const result = await this.backendActor.send_tutor_message(this.sessionId, content);
      
      if ('Ok' in result) {
        this.currentStatus = 'responding';
        this.notifyStatusListeners();
        
        // Start polling for the response
        this.pollForResponse();
        
        return true;
      } else {
        console.error('ICPChatService: Failed to send message:', result.Err);
        this.currentStatus = 'error';
        this.notifyStatusListeners();
        return false;
      }
    } catch (error) {
      console.error('ICPChatService: Error sending message:', error);
      this.currentStatus = 'error';
      this.notifyStatusListeners();
      return false;
    }
  }

  private async pollForResponse(): Promise<void> {
    if (!this.sessionId || !this.backendActor) return;

    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.error('ICPChatService: Polling timeout - no response received');
        this.currentStatus = 'error';
        this.notifyStatusListeners();
        return;
      }

      try {
        const result = await this.backendActor.get_session_messages(this.sessionId);
        
        if ('Ok' in result) {
          const messages = result.Ok;
          
          // Check if we have new messages
          if (messages.length > this.messageCount) {
            const newMessages = messages.slice(this.messageCount);
            this.messageCount = messages.length;
            
            // Emit new messages
            newMessages.forEach((msg: any) => {
              const chunk: TutorMessageChunk = {
                id: msg.id,
                content: msg.content,
                isComplete: true,
                timestamp: msg.timestamp,
                sender: msg.sender
              };
              this.notifyMessageListeners(chunk);
            });
            
            this.currentStatus = 'idle';
            this.notifyStatusListeners();
            return;
          }
        } else {
          console.error('ICPChatService: Error getting messages:', result.Err);
          this.currentStatus = 'error';
          this.notifyStatusListeners();
          return;
        }
        
        attempts++;
        setTimeout(poll, 1000); // Poll every second
      } catch (error) {
        console.error('ICPChatService: Error polling for response:', error);
        this.currentStatus = 'error';
        this.notifyStatusListeners();
      }
    };
    
    poll();
  }

  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    // Poll for new messages every 3 seconds
    this.pollingInterval = setInterval(async () => {
      if (!this.isConnected || !this.sessionId || !this.backendActor) {
        return;
      }
      
      try {
        const result = await this.backendActor.get_session_messages(this.sessionId);
        if ('Ok' in result) {
          const messages = result.Ok;
          
          // Check if we have new messages
          if (messages.length > this.messageCount) {
            const newMessages = messages.slice(this.messageCount);
            this.messageCount = messages.length;
            
            // Emit new messages
            newMessages.forEach((msg: any) => {
              const chunk: TutorMessageChunk = {
                id: msg.id,
                content: msg.content,
                isComplete: true,
                timestamp: msg.timestamp,
                sender: msg.sender
              };
              this.notifyMessageListeners(chunk);
            });
          }
        }
      } catch (error) {
        // Ignore polling errors for background polling
        console.debug('ICPChatService: Background polling error (ignored):', error);
      }
    }, 3000); // Poll every 3 seconds
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  public onMessage(callback: (chunk: TutorMessageChunk) => void): void {
    this.messageListeners.push(callback);
  }

  public offMessage(callback: (chunk: TutorMessageChunk) => void): void {
    this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
  }

  public onStatus(callback: (status: TutorStatus) => void): void {
    this.statusListeners.push(callback);
  }

  public offStatus(callback: (status: TutorStatus) => void): void {
    this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
  }

  public onProgressUpdate(callback: (progress: ProgressUpdate) => void): void {
    this.progressListeners.push(callback);
  }

  public offProgressUpdate(callback: (progress: ProgressUpdate) => void): void {
    this.progressListeners = this.progressListeners.filter(cb => cb !== callback);
  }

  private notifyMessageListeners(chunk: TutorMessageChunk): void {
    this.messageListeners.forEach(callback => {
      try {
        callback(chunk);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  private notifyStatusListeners(): void {
    this.statusListeners.forEach(callback => {
      try {
        callback(this.currentStatus);
      } catch (error) {
        console.error('Error in status handler:', error);
      }
    });
  }

  private notifyProgressListeners(progress: ProgressUpdate): void {
    this.progressListeners.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in progress handler:', error);
      }
    });
  }

  public getStatus(): TutorStatus {
    return this.currentStatus;
  }

  public isConnectedToSession(): boolean {
    return this.isConnected && this.sessionId !== null;
  }
}

// Create a singleton instance
const icpChatService = new ICPChatService();

export default icpChatService; 