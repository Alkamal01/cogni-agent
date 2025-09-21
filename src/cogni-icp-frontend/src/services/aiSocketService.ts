import { io, Socket } from 'socket.io-client';

export interface TutorMessageChunk {
  id?: string;
  content: string;
  isComplete?: boolean;
}

export type TutorStatus = 'idle' | 'thinking' | 'responding' | 'error';

function readCookie(name: string): string | null {
  try {
    const nameEQ = name + '=';
    const ca = (typeof document !== 'undefined' ? document.cookie.split(';') : []);
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
  } catch {}
  return null;
}

function getAuthToken(): string | null {
  try {
    const ls = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const ck = readCookie('token') || readCookie('auth_token') || readCookie('access_token');
    return ls || ck || null;
  } catch {
    return null;
  }
}

class AISocketService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private messageHandlers: ((chunk: TutorMessageChunk) => void)[] = [];
  private statusHandlers: ((status: TutorStatus) => void)[] = [];
  private errorHandlers: ((error: any) => void)[] = [];
  private isConnected = false;

  public async connect(sessionId: string): Promise<boolean> {
    try {
      if (this.socket?.connected) return true;
      const token = getAuthToken();
      if (!token) return false;
      const baseUrl = (import.meta as any).env?.VITE_PY_BACKEND_URL || '';
      if (!baseUrl) return false;

      // Clean
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.close();
        this.socket = null;
      }

      this.sessionId = sessionId;
      const socket = io(`${baseUrl}/tutor`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 30000,
        autoConnect: false,
        forceNew: true,
        path: '/socket.io',
      });

      this.socket = socket;

      socket.on('connect', () => {
        this.isConnected = true;
        this.notifyStatus('idle');
        socket.emit('join', { sessionId });
      });
      socket.on('connect_error', (err: any) => {
        this.isConnected = false;
        this.notifyStatus('error');
        this.errorHandlers.forEach(h => h(err));
      });
      socket.on('disconnect', () => {
        this.isConnected = false;
        this.notifyStatus('error');
      });
      socket.on('tutor_message_chunk', (chunk: TutorMessageChunk) => {
        this.notifyStatus('responding');
        this.messageHandlers.forEach(h => h(chunk));
      });
      socket.on('tutor_message_complete', () => {
        this.notifyStatus('idle');
        this.messageHandlers.forEach(h => h({ content: '', isComplete: true }));
      });

      socket.connect();
      return true;
    } catch (e) {
      this.isConnected = false;
      this.errorHandlers.forEach(h => h(e));
      return false;
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      if (this.socket.connected) this.socket.disconnect();
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.sessionId = null;
  }

  public sendMessage(content: string): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('message', { content });
  }

  public onMessage(handler: (chunk: TutorMessageChunk) => void): void {
    this.messageHandlers.push(handler);
  }
  public offMessage(handler: (chunk: TutorMessageChunk) => void): void {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  public onStatus(handler: (status: TutorStatus) => void): void {
    this.statusHandlers.push(handler);
  }
  public offStatus(handler: (status: TutorStatus) => void): void {
    this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
  }

  public onError(handler: (error: any) => void): void {
    this.errorHandlers.push(handler);
  }
  public offError(handler: (error: any) => void): void {
    this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
  }

  private notifyStatus(status: TutorStatus): void {
    this.statusHandlers.forEach(h => h(status));
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }
}

const aiSocketService = new AISocketService();
export default aiSocketService;


