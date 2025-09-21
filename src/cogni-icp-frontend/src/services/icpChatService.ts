import { useAuth } from '../contexts/AuthContext';
import { groqService } from './groqService';
import ragService from './ragService';
import aiSocketService from './aiSocketService';
import conversationMemoryService from './conversationMemoryService';

// Types
export interface TutorMessageChunk {
  id?: string;
  content: string;
  isComplete?: boolean;
  timestamp: string;
  sender: 'user' | 'tutor';
  comprehensionAnalysis?: {
    comprehension_score: number;
    difficulty_adjustment: string;
    timestamp: string;
  };
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
      this.sessionId = sessionId;
      // Try Python websocket first
      const ok = await aiSocketService.connect(sessionId);
      if (ok) {
        this.isConnected = true;
        this.currentStatus = 'idle';
        this.messageCount = 0;
        await this.loadExistingMessages();
        // No polling needed when socket is active
        return true;
      }

      // Fallback to local mode
      this.isConnected = true;
      this.currentStatus = 'idle';
      this.messageCount = 0;
      await this.loadExistingMessages();
      this.startPolling();
      return true;
    } catch (error) {
      console.error('ICPChatService: Connection failed:', error);
      this.currentStatus = 'error';
      return false;
    }
  }

  private async loadExistingMessages(): Promise<void> {
    if (!this.sessionId) return;

    try {
      const messages = JSON.parse(localStorage.getItem(`chat_messages_${this.sessionId}`) || '[]');
      this.messageCount = messages.length;
      
      // Don't emit existing messages during initial load
      // They should be loaded by the frontend component directly
      console.log('ICPChatService: Loaded', messages.length, 'existing messages from localStorage');
    } catch (error) {
      console.error('ICPChatService: Error loading existing messages:', error);
    }
  }

  public getMessages(sessionId: string): ChatMessage[] {
    try {
      const messages = JSON.parse(localStorage.getItem(`chat_messages_${sessionId}`) || '[]');
      return messages.sort((a: ChatMessage, b: ChatMessage) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Mark a module as complete
  public markModuleComplete(sessionId: string, moduleId: number): void {
    try {
      const courseOutline = JSON.parse(localStorage.getItem(`course_outline_${sessionId}`) || '{}');
      if (courseOutline && courseOutline.modules) {
        const module = courseOutline.modules.find((m: any) => m.id === moduleId);
        if (module) {
          module.status = 'completed';
          
          // Mark next module as in_progress
          const nextModule = courseOutline.modules.find((m: any) => m.id === moduleId + 1);
          if (nextModule) {
            nextModule.status = 'in_progress';
          }
          
          localStorage.setItem(`course_outline_${sessionId}`, JSON.stringify(courseOutline));
          console.log(`Module ${moduleId} marked as complete, next module set to in_progress`);
        }
      }
    } catch (error) {
      console.error('Error marking module as complete:', error);
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
      if (!this.sessionId) {
        console.error('ICPChatService: Session not available');
        return false;
      }

      this.currentStatus = 'thinking';
      this.notifyStatusListeners();

      // Add user message to UI first
      const userChunk: TutorMessageChunk = {
        content: content,
        isComplete: true,
        timestamp: new Date().toISOString(),
        sender: 'user'
      };
      this.notifyMessageListeners(userChunk);

      // Store user message in localStorage
      this.storeMessage({
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session_id: this.sessionId,
        sender: 'user',
        content: content,
        timestamp: new Date().toISOString()
      });

      // Get session data from localStorage
      const sessions = JSON.parse(localStorage.getItem('tutor_sessions') || '[]');
      const session = sessions.find((s: any) => s.public_id === this.sessionId);
      
      if (!session) {
        throw new Error(`Session not found: ${this.sessionId}`);
      }

      // Add message to conversation memory
      await conversationMemoryService.addMessage(
        this.sessionId,
        session.tutor_id,
        'user',
        content
      );

      // Get tutor data from localStorage or use default
      const tutors = JSON.parse(localStorage.getItem('tutors') || '[]');
      const tutor = tutors.find((t: any) => t.public_id === session.tutor_id) || {
        expertise: ['general knowledge'],
        teaching_style: 'casual',
        personality: 'helpful'
      };

      this.currentStatus = 'responding';
      this.notifyStatusListeners();

      // Get conversation memory context
      const conversationContext = await conversationMemoryService.getConversationContext(this.sessionId);
      const conversationSummary = conversationContext 
        ? conversationMemoryService.getConversationSummary(conversationContext)
        : '';

      // Get RAG context from knowledge base
      let ragContext = '';
      try {
        const ragResult = await ragService.searchChunks(session.tutor_id, content, 3);
        ragContext = ragResult.context;
        console.log('RAG context retrieved:', ragContext);
      } catch (error) {
        console.log('No RAG context available or error:', error);
        // Continue without RAG context
      }

      // Get course modules context
      let courseContext = '';
      try {
        const courseOutline = JSON.parse(localStorage.getItem(`course_outline_${this.sessionId}`) || '{}');
        if (courseOutline && courseOutline.modules) {
          const currentModule = courseOutline.modules.find((m: any) => m.status === 'in_progress') || courseOutline.modules[0];
          if (currentModule) {
            courseContext = `Current Course Module: ${currentModule.title}\nDescription: ${currentModule.description}\nContent: ${currentModule.content}`;
            console.log('Course context retrieved:', courseContext);
            
            // Update module status to in_progress if it's the first module
            if (currentModule.status === 'pending') {
              currentModule.status = 'in_progress';
              localStorage.setItem(`course_outline_${this.sessionId}`, JSON.stringify(courseOutline));
              console.log('Updated module status to in_progress:', currentModule.title);
            }
          }
        }
      } catch (error) {
        console.log('No course context available or error:', error);
        // Continue without course context
      }

      // Combine all context (currently not sent over socket, reserved for future prompts)
      const fullContext = [conversationSummary, ragContext, courseContext].filter(Boolean).join('\n\n');

      // If websocket connected, forward user message to Python; otherwise use local fallback
      if (aiSocketService.isSocketConnected()) {
        aiSocketService.sendMessage(content);
      } else {
        const response = await groqService.generateTutorResponse(
          content,
          tutor.expertise || ['general knowledge'],
          tutor.teaching_style || 'casual',
          tutor.personality || 'helpful',
          fullContext
        );

        // Add tutor response to UI & storage
        this.notifyMessageListeners({
          content: response,
          isComplete: true,
          timestamp: new Date().toISOString(),
          sender: 'tutor'
        });
        this.storeMessage({
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          session_id: this.sessionId,
          sender: 'tutor',
          content: response,
          timestamp: new Date().toISOString()
        });
        await conversationMemoryService.addMessage(
          this.sessionId,
          session.tutor_id,
          'tutor',
          response,
          conversationContext?.currentTopic || undefined,
          conversationContext?.difficultyLevel
        );
      }
      
      this.currentStatus = 'idle';
      this.notifyStatusListeners();
      
      return true;
    } catch (error) {
      console.error('ICPChatService: Error sending message:', error);
      this.currentStatus = 'error';
      this.notifyStatusListeners();
      return false;
    }
  }

  private storeMessage(message: ChatMessage): void {
    try {
      const messages = JSON.parse(localStorage.getItem(`chat_messages_${this.sessionId}`) || '[]');
      messages.push(message);
      localStorage.setItem(`chat_messages_${this.sessionId}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Error storing message:', error);
    }
  }

  private async pollForResponse(): Promise<void> {
    if (!this.sessionId) return;

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