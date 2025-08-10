import canisterService from './canisterService';

export interface ConnectionRequest {
  id: string;
  sender: {
    id: string;
    public_id: string;
    name: string;
    username: string;
    avatar?: string;
    bio?: string;
  };
  receiver?: {
    id: string;
    public_id: string;
    name: string;
    username: string;
    avatar?: string;
    bio?: string;
  };
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
  responded_at?: string;
}

export interface Connection {
  id: string;
  user: {
    id: string;
    public_id: string;
    name: string;
    username: string;
    avatar?: string;
    bio?: string;
    status?: 'online' | 'offline' | 'away';
    lastActive?: string;
  };
  connectedSince?: string;
  created_at?: string;
  compatibilityScore?: number;
}

export interface ConnectionStatus {
  status: 'none' | 'connected' | 'request_sent' | 'request_received' | 'self';
  request_id?: string;
}

export interface SuggestedConnection {
  id: string;
  public_id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  compatibilityScore: number;
  skills: string[];
}

class ConnectionService {
  private connectionRequests: {
    received: ConnectionRequest[];
    sent: ConnectionRequest[];
  } | null = null;
  
  /**
   * Get all connection requests (received and sent)
   */
  async getConnectionRequests(): Promise<{
    received: ConnectionRequest[];
    sent: ConnectionRequest[];
  }> {
    try {
      // For now, return mock data
      return {
        received: [],
        sent: []
      };
    } catch (error) {
      console.error('Error fetching connection requests:', error);
      throw error;
    }
  }

  /**
   * Send a connection request to another user
   */
  async sendConnectionRequest(receiverPublicId: string, message?: string): Promise<ConnectionRequest> {
    try {
      // For now, return mock data
      return {
        id: 'mock-request-id',
        sender: {
          id: 'mock-sender-id',
          public_id: 'mock-sender-public-id',
          name: 'Mock Sender',
          username: 'mocksender'
        },
        message: message || '',
        status: 'pending',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error sending connection request:', error);
      throw error;
    }
  }

  /**
   * Accept a connection request
   */
  async acceptConnectionRequest(requestId: string): Promise<ConnectionRequest> {
    try {
      // For now, return mock data
      return {
        id: requestId,
        sender: {
          id: 'mock-sender-id',
          public_id: 'mock-sender-public-id',
          name: 'Mock Sender',
          username: 'mocksender'
        },
        message: 'Mock message',
        status: 'accepted',
        timestamp: new Date().toISOString(),
        responded_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error accepting connection request:', error);
      throw error;
    }
  }

  /**
   * Decline a connection request
   */
  async declineConnectionRequest(requestId: string): Promise<ConnectionRequest> {
    try {
      // For now, return mock data
      return {
        id: requestId,
        sender: {
          id: 'mock-sender-id',
          public_id: 'mock-sender-public-id',
          name: 'Mock Sender',
          username: 'mocksender'
        },
        message: 'Mock message',
        status: 'declined',
        timestamp: new Date().toISOString(),
        responded_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error declining connection request:', error);
      throw error;
    }
  }

  /**
   * Cancel a sent connection request
   */
  async cancelConnectionRequest(requestId: string): Promise<void> {
    try {
      // For now, just log the action
      console.log('Cancelling connection request:', requestId);
    } catch (error) {
      console.error('Error cancelling connection request:', error);
      throw error;
    }
  }

  /**
   * Get all connections
   */
  async getConnections(): Promise<Connection[]> {
    try {
      // For now, return mock data
      return [];
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw error;
    }
  }

  /**
   * Remove a connection
   */
  async removeConnection(connectionId: string): Promise<void> {
    try {
      // For now, just log the action
      console.log('Removing connection:', connectionId);
    } catch (error) {
      console.error('Error removing connection:', error);
      throw error;
    }
  }

  /**
   * Get connection status with another user
   */
  async getConnectionStatus(userPublicId: string): Promise<ConnectionStatus> {
    try {
      // For now, return mock data
      return {
        status: 'none'
      };
    } catch (error) {
      console.error('Error fetching connection status:', error);
      throw error;
    }
  }

  /**
   * Get suggested connections
   */
  async getSuggestedConnections(): Promise<SuggestedConnection[]> {
    try {
      // For now, return mock data
      return [];
    } catch (error) {
      console.error('Error fetching suggested connections:', error);
      throw error;
    }
  }

  /**
   * Discover learners
   */
  async discoverLearners(params: {
    search?: string;
    skills?: string[];
    experienceLevel?: string;
    studyPreference?: string;
    limit?: number;
  } = {}): Promise<{
    learners: any[];
    recommendations: any[];
    totalCount: number;
  }> {
    try {
      // For now, return mock data
      return {
        learners: [],
        recommendations: [],
        totalCount: 0
      };
    } catch (error) {
      console.error('Error discovering learners:', error);
      throw error;
    }
  }

  /**
   * Format connection request
   */
  formatConnectionRequest(request: ConnectionRequest): ConnectionRequest {
    return {
      ...request,
      timestamp: this.formatTimestamp(request.timestamp)
    };
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Calculate compatibility score
   */
  calculateCompatibilityScore(user1Skills: string[], user2Skills: string[]): number {
    if (user1Skills.length === 0 || user2Skills.length === 0) {
      return 0;
    }

    const commonSkills = user1Skills.filter(skill => user2Skills.includes(skill));
    const totalSkills = new Set([...user1Skills, ...user2Skills]).size;
    
    return Math.round((commonSkills.length / totalSkills) * 100);
  }

  /**
   * Check if users are connected
   */
  async areUsersConnected(userPublicId: string): Promise<boolean> {
    try {
      // For now, return mock data
      return false;
    } catch (error) {
      console.error('Error checking connection status:', error);
      return false;
    }
  }

  /**
   * Get pending request count
   */
  async getPendingRequestCount(): Promise<number> {
    try {
      // For now, return mock data
      return 0;
    } catch (error) {
      console.error('Error fetching pending request count:', error);
      return 0;
    }
  }

  /**
   * Get current connection requests
   */
  getCurrentConnectionRequests() {
    return this.connectionRequests;
  }
}

export default new ConnectionService(); 