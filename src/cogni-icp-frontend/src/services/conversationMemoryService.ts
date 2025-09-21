// Conversation Memory Service
// Handles conversation context, learning progress, and adaptive learning

export interface ConversationContext {
  sessionId: string;
  tutorId: string;
  messages: ConversationMessage[];
  learningProgress: LearningProgress;
  currentTopic: string | null;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  userPreferences: UserPreferences;
  lastUpdated: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'tutor';
  content: string;
  timestamp: string;
  topic?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  comprehensionScore?: number;
  learningObjectives?: string[];
}

export interface LearningProgress {
  topicsCovered: string[];
  masteryLevel: Record<string, number>; // topic -> mastery score (0-1)
  learningObjectives: string[];
  completedObjectives: string[];
  strengths: string[];
  areasForImprovement: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';
  pace: 'slow' | 'moderate' | 'fast';
}

export interface UserPreferences {
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  learningGoals: string[];
  interests: string[];
  communicationStyle: 'formal' | 'casual' | 'friendly';
  responseLength: 'brief' | 'detailed' | 'comprehensive';
}

class ConversationMemoryService {
  private dbName = 'CogniEdufyMemory';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDB();
  }

  // Initialize IndexedDB
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const conversationsStore = db.createObjectStore('conversations', { keyPath: 'sessionId' });
          conversationsStore.createIndex('tutorId', 'tutorId', { unique: false });
          conversationsStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // Create learning progress store
        if (!db.objectStoreNames.contains('learningProgress')) {
          const progressStore = db.createObjectStore('learningProgress', { keyPath: 'userId' });
          progressStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }
      };
    });
  }

  // Get conversation context for a session
  async getConversationContext(sessionId: string): Promise<ConversationContext | null> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readonly');
      const store = transaction.objectStore('conversations');
      const request = store.get(sessionId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Save conversation context
  async saveConversationContext(context: ConversationContext): Promise<void> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readwrite');
      const store = transaction.objectStore('conversations');
      const request = store.put(context);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Add message to conversation
  async addMessage(
    sessionId: string,
    tutorId: string,
    role: 'user' | 'tutor',
    content: string,
    topic?: string,
    difficulty?: 'beginner' | 'intermediate' | 'advanced',
    comprehensionScore?: number
  ): Promise<void> {
    const context = await this.getConversationContext(sessionId) || this.createNewContext(sessionId, tutorId);
    
    const message: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date().toISOString(),
      topic,
      difficulty,
      comprehensionScore,
    };

    context.messages.push(message);
    context.lastUpdated = new Date().toISOString();

    // Update learning progress based on message
    await this.updateLearningProgress(context, message);

    await this.saveConversationContext(context);
  }

  // Create new conversation context
  private createNewContext(sessionId: string, tutorId: string): ConversationContext {
    return {
      sessionId,
      tutorId,
      messages: [],
      learningProgress: {
        topicsCovered: [],
        masteryLevel: {},
        learningObjectives: [],
        completedObjectives: [],
        strengths: [],
        areasForImprovement: [],
        learningStyle: 'mixed',
        pace: 'moderate',
      },
      currentTopic: null,
      difficultyLevel: 'beginner',
      userPreferences: {
        preferredDifficulty: 'beginner',
        learningGoals: [],
        interests: [],
        communicationStyle: 'friendly',
        responseLength: 'detailed',
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  // Update learning progress based on conversation
  private async updateLearningProgress(context: ConversationContext, message: ConversationMessage): Promise<void> {
    const { learningProgress } = context;

    // Track topics
    if (message.topic && !learningProgress.topicsCovered.includes(message.topic)) {
      learningProgress.topicsCovered.push(message.topic);
    }

    // Update mastery level based on comprehension score
    if (message.comprehensionScore && message.topic) {
      const currentMastery = learningProgress.masteryLevel[message.topic] || 0;
      const newMastery = Math.min(1, currentMastery + (message.comprehensionScore / 100) * 0.1);
      learningProgress.masteryLevel[message.topic] = newMastery;
    }

    // Analyze learning style based on message patterns
    this.analyzeLearningStyle(context);

    // Update difficulty level based on performance
    this.updateDifficultyLevel(context);

    // Identify strengths and areas for improvement
    this.analyzeStrengthsAndWeaknesses(context);
  }

  // Analyze learning style from conversation patterns
  private analyzeLearningStyle(context: ConversationContext): void {
    const messages = context.messages;
    const recentMessages = messages.slice(-10); // Last 10 messages

    let visualCount = 0;
    let auditoryCount = 0;
    let kinestheticCount = 0;
    let readingCount = 0;

    recentMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      
      // Visual indicators
      if (content.includes('see') || content.includes('look') || content.includes('visual') || 
          content.includes('diagram') || content.includes('chart') || content.includes('image')) {
        visualCount++;
      }
      
      // Auditory indicators
      if (content.includes('hear') || content.includes('listen') || content.includes('sound') || 
          content.includes('audio') || content.includes('speak') || content.includes('voice')) {
        auditoryCount++;
      }
      
      // Kinesthetic indicators
      if (content.includes('do') || content.includes('practice') || content.includes('hands-on') || 
          content.includes('try') || content.includes('build') || content.includes('create')) {
        kinestheticCount++;
      }
      
      // Reading indicators
      if (content.includes('read') || content.includes('text') || content.includes('book') || 
          content.includes('article') || content.includes('document') || content.includes('study')) {
        readingCount++;
      }
    });

    const maxCount = Math.max(visualCount, auditoryCount, kinestheticCount, readingCount);
    
    if (maxCount === visualCount) context.learningProgress.learningStyle = 'visual';
    else if (maxCount === auditoryCount) context.learningProgress.learningStyle = 'auditory';
    else if (maxCount === kinestheticCount) context.learningProgress.learningStyle = 'kinesthetic';
    else if (maxCount === readingCount) context.learningProgress.learningStyle = 'reading';
    else context.learningProgress.learningStyle = 'mixed';
  }

  // Update difficulty level based on performance
  private updateDifficultyLevel(context: ConversationContext): void {
    const recentMessages = context.messages.slice(-5);
    const tutorMessages = recentMessages.filter(msg => msg.role === 'tutor');
    
    if (tutorMessages.length === 0) return;

    // Check if user is asking for more complex topics
    const userMessages = recentMessages.filter(msg => msg.role === 'user');
    const complexRequests = userMessages.filter(msg => 
      msg.content.toLowerCase().includes('advanced') || 
      msg.content.toLowerCase().includes('complex') || 
      msg.content.toLowerCase().includes('difficult') ||
      msg.content.toLowerCase().includes('challenge')
    ).length;

    // Check comprehension scores
    const comprehensionScores = tutorMessages
      .map(msg => msg.comprehensionScore)
      .filter(score => score !== undefined) as number[];

    const avgComprehension = comprehensionScores.length > 0 
      ? comprehensionScores.reduce((a, b) => a + b, 0) / comprehensionScores.length 
      : 0;

    // Adjust difficulty
    if (avgComprehension > 80 && complexRequests > 0) {
      context.difficultyLevel = 'advanced';
    } else if (avgComprehension > 60 || context.difficultyLevel === 'beginner') {
      context.difficultyLevel = 'intermediate';
    } else if (avgComprehension < 40) {
      context.difficultyLevel = 'beginner';
    }
  }

  // Analyze strengths and areas for improvement
  private analyzeStrengthsAndWeaknesses(context: ConversationContext): void {
    const topics = Object.keys(context.learningProgress.masteryLevel);
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    topics.forEach(topic => {
      const mastery = context.learningProgress.masteryLevel[topic];
      if (mastery > 0.7) {
        strengths.push(topic);
      } else if (mastery < 0.3) {
        weaknesses.push(topic);
      }
    });

    context.learningProgress.strengths = strengths;
    context.learningProgress.areasForImprovement = weaknesses;
  }

  // Get conversation summary for AI context
  getConversationSummary(context: ConversationContext): string {
    const { messages, learningProgress, currentTopic, difficultyLevel } = context;
    
    let summary = `Conversation Context:\n`;
    summary += `- Current Topic: ${currentTopic || 'General discussion'}\n`;
    summary += `- Difficulty Level: ${difficultyLevel}\n`;
    summary += `- Learning Style: ${learningProgress.learningStyle}\n`;
    summary += `- Topics Covered: ${learningProgress.topicsCovered.join(', ')}\n`;
    
    if (learningProgress.strengths.length > 0) {
      summary += `- Student Strengths: ${learningProgress.strengths.join(', ')}\n`;
    }
    
    if (learningProgress.areasForImprovement.length > 0) {
      summary += `- Areas for Improvement: ${learningProgress.areasForImprovement.join(', ')}\n`;
    }

    // Add recent conversation context (last 3 messages)
    const recentMessages = messages.slice(-3);
    if (recentMessages.length > 0) {
      summary += `\nRecent Conversation:\n`;
      recentMessages.forEach(msg => {
        summary += `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}\n`;
      });
    }

    return summary;
  }

  // Get personalized learning suggestions
  getLearningSuggestions(context: ConversationContext): string[] {
    const { learningProgress, difficultyLevel } = context;
    const suggestions: string[] = [];

    // Suggest based on areas for improvement
    learningProgress.areasForImprovement.forEach(area => {
      suggestions.push(`Focus on ${area} - practice with ${difficultyLevel} level exercises`);
    });

    // Suggest based on learning style
    switch (learningProgress.learningStyle) {
      case 'visual':
        suggestions.push('Try using diagrams, charts, or visual aids to understand concepts better');
        break;
      case 'auditory':
        suggestions.push('Consider discussing concepts out loud or using audio explanations');
        break;
      case 'kinesthetic':
        suggestions.push('Try hands-on activities or practical exercises');
        break;
      case 'reading':
        suggestions.push('Read additional materials or documentation on the topic');
        break;
    }

    // Suggest based on pace
    if (learningProgress.pace === 'slow') {
      suggestions.push('Take your time with each concept - there\'s no rush');
    } else if (learningProgress.pace === 'fast') {
      suggestions.push('You\'re learning quickly! Consider exploring advanced topics');
    }

    return suggestions;
  }

  // Clear conversation memory for a session
  async clearConversationMemory(sessionId: string): Promise<void> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readwrite');
      const store = transaction.objectStore('conversations');
      const request = store.delete(sessionId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get all conversations for a tutor
  async getTutorConversations(tutorId: string): Promise<ConversationContext[]> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readonly');
      const store = transaction.objectStore('conversations');
      const index = store.index('tutorId');
      const request = index.getAll(tutorId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const conversationMemoryService = new ConversationMemoryService();
export default conversationMemoryService;

