import canisterService from './canisterService';
import { TutorFormData } from '../components/tutors/TutorFormModal';
import { groqService } from './groqService';
import { pythonBackend } from './pythonBackendService';

// Interfaces
export interface Tutor {
  id: number;
  public_id: string;
  name: string;
  description: string;
  teaching_style: string;
  personality: string;
  expertise: string[];
  knowledge_base: string[];
  avatar_url?: string;
  is_pinned?: boolean;
  voice_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
  };
  rating?: number;
  rating_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TutorSession {
  public_id: string;
  user_id: string;
  tutor_id: string;
  topic: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface TutorMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'tutor';
  content: string;
  timestamp: string;
  has_audio?: boolean;
}

export interface TutorCourse {
  id: number;
  tutor_id: number;
  session_id: number;
  topic: string;
  outline: any;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: string;
  created_at: string;
}

export interface CourseModule {
  id: number;
  course_id: number;
  title: string;
  description: string;
  order: number;
  content: any;
  status: 'pending' | 'completed';
}

export interface LearningProgress {
  id: number;
  user_id: number;
  session_id: number;
  course_id: number;
  current_module_id: number | null;
  progress_percentage: number;
  last_activity: string;
}

export interface TutorRating {
  id: number;
  user_id: number;
  tutor_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface TopicSuggestion {
  topic: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  expertise_area: string;
}

export interface TopicValidation {
  is_relevant: boolean;
  confidence: number;
  reasoning?: string;
  suggested_alternatives?: string[];
}

export interface CourseOutline {
  title: string;
  description: string;
  learning_objectives: string[];
  estimated_duration: string;
  difficulty_level: string;
  modules: CourseModule[];
}

export interface ComprehensionAnalysis {
  comprehension_score: number;
  difficulty_adjustment: string;
  timestamp: string;
}

export interface LearningMetrics {
  id: number;
  user_id: string;
  session_id: number;
  date: string;
  time_spent_minutes: number;
  messages_sent: number;
  comprehension_scores: Record<string, number>;
  difficulty_adjustments: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface ModuleCompletion {
  id: number;
  user_id: string;
  module_id: number;
  completed: boolean;
  completion_date?: string;
  created_at: string;
  updated_at: string;
}

// Simple cache for tutor data to prevent redundant API calls
const tutorCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const tutorService = {
  // Tutor Management
  getAllTutors: async (backendActor?: any): Promise<Tutor[]> => {
    try {
      const tutors = await canisterService.getAllTutors(backendActor);
      
      // Convert the tutors to match the Tutor interface
      const convertNanosecondsToDate = (nanoseconds: string | number): string => {
        const nanos = typeof nanoseconds === 'string' ? parseInt(nanoseconds) : nanoseconds;
        const millis = Math.floor(nanos / 1000000); // Convert nanoseconds to milliseconds
        return new Date(millis).toISOString();
      };
      
      return tutors.map((tutor: any) => ({
        id: tutor.id,
        public_id: tutor.public_id,
        name: tutor.name,
        description: tutor.description,
        teaching_style: tutor.teaching_style,
        personality: tutor.personality,
        expertise: tutor.expertise,
        knowledge_base: tutor.knowledge_base,
        avatar_url: tutor.avatar_url,
        is_pinned: tutor.is_pinned,
        voice_id: tutor.voice_id,
        voice_settings: tutor.voice_settings,
        created_at: convertNanosecondsToDate(tutor.created_at),
        updated_at: convertNanosecondsToDate(tutor.updated_at)
      }));
    } catch (error: any) {
      console.error('Error fetching tutors:', error);
      // Return empty array as fallback
      return [];
    }
  },

  getTutor: async (tutorId: string, backendActor?: any): Promise<Tutor> => {
    try {
      // Check cache first
      const cached = tutorCache.get(tutorId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Using cached tutor data for:', tutorId);
        return cached.data;
      }

      const result = await canisterService.getTutor(tutorId, backendActor);
      
      // Convert the result to match the Tutor interface
      const convertNanosecondsToDate = (nanoseconds: string | number): string => {
        const nanos = typeof nanoseconds === 'string' ? parseInt(nanoseconds) : nanoseconds;
        const millis = Math.floor(nanos / 1000000); // Convert nanoseconds to milliseconds
        return new Date(millis).toISOString();
      };
      
      const tutorData = {
        id: result.id,
        public_id: result.public_id,
        name: result.name,
        description: result.description,
        teaching_style: result.teaching_style,
        personality: result.personality,
        expertise: result.expertise,
        knowledge_base: result.knowledge_base,
        avatar_url: result.avatar_url,
        is_pinned: result.is_pinned,
        voice_id: result.voice_id,
        voice_settings: result.voice_settings,
        created_at: convertNanosecondsToDate(result.created_at),
        updated_at: convertNanosecondsToDate(result.updated_at)
      };

      // Cache the tutor data
      tutorCache.set(tutorId, { data: tutorData, timestamp: Date.now() });
      
      return tutorData;
    } catch (error) {
      console.error('Error fetching tutor:', error);
      throw error;
    }
  },

  createTutor: async (tutorData: TutorFormData, backendActor?: any): Promise<Tutor> => {
    try {
      const result = await canisterService.createTutor({
        name: tutorData.name,
        description: tutorData.description,
        teachingStyle: tutorData.teachingStyle,
        personality: tutorData.personality,
        expertise: Array.isArray(tutorData.expertise) ? tutorData.expertise : [],
        knowledgeBase: Array.isArray(tutorData.knowledgeBase) ? tutorData.knowledgeBase.filter(item => typeof item === 'string') as string[] : [],
        voiceId: tutorData.voice_id,
        voiceSettings: tutorData.voice_settings,
        avatarUrl: tutorData.imageUrl
      }, backendActor);
      
      // Convert the result to match the Tutor interface
      // Convert nanoseconds to milliseconds for Date constructor
      const convertNanosecondsToDate = (nanoseconds: string | number): string => {
        const nanos = typeof nanoseconds === 'string' ? parseInt(nanoseconds) : nanoseconds;
        const millis = Math.floor(nanos / 1000000); // Convert nanoseconds to milliseconds
        return new Date(millis).toISOString();
      };
      
      return {
        id: result.id,
        public_id: result.public_id,
        name: result.name,
        description: result.description,
        teaching_style: result.teaching_style,
        personality: result.personality,
        expertise: result.expertise,
        knowledge_base: result.knowledge_base,
        avatar_url: result.avatar_url,
        is_pinned: result.is_pinned,
        voice_id: result.voice_id,
        voice_settings: result.voice_settings,
        created_at: convertNanosecondsToDate(result.created_at),
        updated_at: convertNanosecondsToDate(result.updated_at)
      };
    } catch (error) {
      console.error('Error creating tutor:', error);
      throw error;
    }
  },

  // Session Management
  createSession: async (tutorId: string, sessionData: { topic: string }): Promise<any> => {
    // For now, return mock session data
    return {
      session: {
        public_id: 'mock-session-id',
        user_id: 'mock-user-id',
        tutor_id: tutorId,
        topic: sessionData.topic,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  },

  getSession: async (sessionId: string, backendActor?: any): Promise<any> => {
    try {
      // Get session from localStorage (frontend-only approach)
      const sessions = JSON.parse(localStorage.getItem('tutor_sessions') || '[]');
      const sessionData = sessions.find((s: any) => s.public_id === sessionId);
      
      if (!sessionData) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Get AI-generated course outline from localStorage
      const courseOutline = JSON.parse(localStorage.getItem(`course_outline_${sessionId}`) || 'null');
      
      let modules: CourseModule[] = [];
      
      if (courseOutline && courseOutline.modules) {
        // Use AI-generated modules
        modules = courseOutline.modules.map((module: any, index: number) => ({
          id: module.id || index + 1,
          course_id: module.course_id || 1,
          title: module.title,
          description: module.description,
          order: module.order || index + 1,
          content: module.content || '',
          status: module.status || 'pending'
        }));
        console.log('Using AI-generated modules:', modules);
      } else {
        // Fallback to basic modules if no AI outline exists
        const fallbackModules = [
          'Introduction to the Topic',
          'Core Concepts', 
          'Practice Exercises',
          'Advanced Applications',
          'Review and Assessment'
        ];
        
        modules = fallbackModules.map((title, index) => ({
          id: index + 1,
          course_id: 1,
          title: title,
          description: `Module ${index + 1}: ${title}`,
          order: index + 1,
          content: `This module covers ${title.toLowerCase()}`,
          status: 'pending'
        }));
        console.log('Using fallback modules:', modules);
      }
      
      // Get messages from localStorage
      const messages = JSON.parse(localStorage.getItem(`chat_messages_${sessionId}`) || '[]');

      // Convert the session data to match the expected format
      return {
        session: {
          public_id: sessionData.public_id,
          user_id: sessionData.user_id,
          tutor_id: sessionData.tutor_id,
          topic: sessionData.topic,
          status: sessionData.status,
          created_at: sessionData.created_at,
          updated_at: sessionData.updated_at
        },
        course: {
          id: 1,
          name: `${sessionData.topic} Course`,
          description: courseOutline?.description || `Personalized AI tutoring session on ${sessionData.topic}`,
          topic: sessionData.topic,
          difficulty_level: courseOutline?.difficulty_level || 'intermediate',
          estimated_duration: courseOutline?.estimated_duration || '4 weeks',
          learning_objectives: courseOutline?.learning_objectives || [],
          modules: modules
        },
        modules: modules,
        progress: {
          id: 1,
          user_id: sessionData.user_id,
          session_id: sessionData.public_id,
          course_id: 1,
          current_module_id: 1, // Start with first module
          progress_percentage: 0, // Start at 0%
          last_activity: new Date().toISOString()
        },
        messages: messages
      };
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  },

  generateModules: async (sessionId: string, backendActor?: any): Promise<string[]> => {
    try {
      if (!backendActor) {
        throw new Error('Backend actor is not available');
      }

      console.log('Generating modules for session:', sessionId);
      const result = await backendActor.generate_course_modules(sessionId);
      
      if ('Err' in result) {
        console.error('AI module generation failed:', result.Err);
        throw new Error(`AI module generation failed: ${result.Err}`);
      }

      console.log('Successfully generated modules:', result.Ok);
      return result.Ok;
    } catch (error) {
      console.error('Error generating modules:', error);
      throw error; // Re-throw the error instead of falling back to defaults
    }
  },

  sendMessage: async (sessionId: string, message: string): Promise<TutorMessage> => {
    // For now, return mock message data
    return {
      id: 'mock-message-id',
      session_id: sessionId,
      sender: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
  },

  // Mock methods for other functionality
  updateTutor: async (tutorId: string, tutorData: any): Promise<Tutor> => {
    return {
      id: 1,
      public_id: tutorId,
      name: 'Updated Tutor',
      description: 'Updated description',
      teaching_style: 'interactive',
      personality: 'friendly',
      expertise: ['math'],
      knowledge_base: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  deleteTutor: async (tutorId: string, backendActor?: any): Promise<void> => {
    try {
      if (!backendActor) {
        throw new Error('Backend actor is not available');
      }
      
      console.log('Deleting tutor with ID:', tutorId);
      const result = await backendActor.delete_tutor(tutorId);
      console.log('Delete result:', result);
      
      if ('Err' in result) {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Error deleting tutor:', error);
      throw error;
    }
  },

  getAllSessions: async (backendActor?: any): Promise<TutorSession[]> => {
    try {
      // Use frontend-only session management
      const sessions = await tutorService.getSessions();
      console.log('Retrieved all sessions from localStorage:', sessions);
      return sessions;
    } catch (error) {
      console.error('Error in getAllSessions:', error);
      return [];
    }
  },

  getTutorSessions: async (tutorId: string): Promise<any[]> => {
    return [];
  },

  getTutorResponse: async (sessionId: string, messageId: string): Promise<TutorMessage> => {
    return {
      id: 'mock-response-id',
      session_id: sessionId,
      sender: 'tutor',
      content: 'This is a mock response from the tutor.',
      timestamp: new Date().toISOString()
    };
  },

  // Mock methods for missing functionality
  getTutorKnowledgeBaseFiles: async (tutorId: string): Promise<any[]> => {
    return [];
  },

  deleteTutorKnowledgeBaseFile: async (tutorId: string, fileId: string): Promise<void> => {
    console.log('Deleting knowledge base file:', fileId);
  },

  // Clear all cached topics (for testing/debugging)
  clearAllCachedTopics: () => {
    console.log('🧹 Clearing all cached topics...');
    const keys = Object.keys(localStorage);
    const topicKeys = keys.filter(key => key.startsWith('topics_'));
    topicKeys.forEach(key => {
      console.log('🗑️ Removing cached topics:', key);
      localStorage.removeItem(key);
    });
    console.log('✅ Cleared', topicKeys.length, 'cached topic entries');
  },

  // Clear topics for a specific tutor
  clearTutorTopics: (tutorId: string) => {
    const cacheKey = `topics_${tutorId}`;
    localStorage.removeItem(cacheKey);
    console.log('🗑️ Cleared cached topics for tutor:', tutorId);
  },

  // Debug function to show all cached topics
  debugCachedTopics: () => {
    console.log('🔍 All cached topics:');
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('topics_')) {
        const topics = localStorage.getItem(key);
        console.log(`  ${key}:`, topics);
      }
    });
  },

  // Sync tutors between backend and localStorage
  syncTutorsWithLocalStorage: async (backendActor: any): Promise<void> => {
    try {
      console.log('🔄 Syncing tutors between backend and localStorage...');
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }
      const backendTutors = await tutorService.getAllTutors(backendActor!);
      localStorage.setItem('tutors', JSON.stringify(backendTutors));
      console.log('✅ Tutors synced to localStorage:', backendTutors.length, 'tutors');
    } catch (error) {
      console.error('❌ Failed to sync tutors:', error);
    }
  },

  getSuggestedTopics: async (tutorId: string, backendActor?: any, forceRegenerate: boolean = false): Promise<TopicSuggestion[]> => {
    try {
      console.log('🔍 getSuggestedTopics called with tutorId:', tutorId, 'forceRegenerate:', forceRegenerate);
      
      // Check if we have cached topics for this tutor (unless forcing regeneration)
      const cacheKey = `topics_${tutorId}`;
      console.log('🔍 Looking for cached topics with key:', cacheKey);
      
      if (!forceRegenerate) {
        const cachedTopics = localStorage.getItem(cacheKey);
        if (cachedTopics) {
          const parsed = JSON.parse(cachedTopics);
          console.log('✅ Using cached topics for tutor:', tutorId, parsed);
          return parsed;
        }
      } else {
        console.log('🔄 Force regeneration requested, clearing cache for:', tutorId);
        localStorage.removeItem(cacheKey);
      }
      
      console.log('❌ No cached topics found for tutor:', tutorId);

      // Get tutor data from localStorage instead of backend
      const tutors = JSON.parse(localStorage.getItem('tutors') || '[]');
      const tutor = tutors.find((t: any) => t.public_id === tutorId);
      
      if (!tutor) {
        throw new Error(`Tutor not found in localStorage: ${tutorId}`);
      }
      
      console.log('Fetched tutor for AI topic suggestions:', tutor);

      // Use frontend Groq service for topic suggestions (now passes tutor public_id to hit Python route)
      const suggestions = await groqService.generateTopicSuggestions(
        tutor.expertise || [],
        tutor.teaching_style || 'casual',
        tutor.personality || 'helpful',
        tutor.public_id
      );
      console.log('AI topic suggestions from frontend Groq:', suggestions);

      // Cache the topics for this tutor
      if (suggestions && suggestions.length > 0) {
        const cacheKey = `topics_${tutorId}`;
        console.log('💾 Caching topics for tutor:', tutorId, 'with key:', cacheKey);
        console.log('💾 Topics to cache:', suggestions);
        localStorage.setItem(cacheKey, JSON.stringify(suggestions));
        console.log('✅ Topics cached successfully');
        
        // Verify the cache was set correctly
        const verifyCache = localStorage.getItem(cacheKey);
        console.log('🔍 Verification - cached topics for', tutorId, ':', verifyCache);
      }

      return suggestions;
    } catch (error) {
      console.error('Error getting AI suggested topics:', error);
      return [];
    }
  },

  validateTopic: async (tutorId: string, topic: string, backendActor?: any): Promise<TopicValidation> => {
    try {
      if (!backendActor) {
        throw new Error('Backend actor is not available');
      }

      // Fetch tutor data to get expertise
      const tutor = await canisterService.getTutor(tutorId, backendActor);

      // Use frontend Groq service for topic validation
      const validation = await groqService.validateTopic(topic, tutor.expertise || []);
      console.log('Topic validation from frontend Groq:', validation);

      return validation;
    } catch (error) {
      console.error('Error validating topic:', error);
      return {
        is_relevant: false,
        confidence: 0.0,
        reasoning: 'Error validating topic',
        suggested_alternatives: []
      };
    }
  },

  startSession: async (tutorId: string, topic: string, backendActor?: any): Promise<TutorSession> => {
    try {
      // Create session via Python backend (generates course outline)
      const py = await pythonBackend.createTutorSession(tutorId, topic);
      const sessionFromPy = py?.session;
      const courseFromPy = py?.course;

      // Map to our local session shape and persist minimal metadata for continuity
      const sessionId = sessionFromPy?.public_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session: TutorSession = {
        public_id: sessionId,
        user_id: sessionFromPy?.user_id || 'current-user',
        tutor_id: tutorId,
        topic: topic,
        status: sessionFromPy?.status || 'active',
        created_at: sessionFromPy?.created_at || new Date().toISOString(),
        updated_at: sessionFromPy?.updated_at || new Date().toISOString()
      };

      const existingSessions = JSON.parse(localStorage.getItem('tutor_sessions') || '[]');
      existingSessions.push(session);
      localStorage.setItem('tutor_sessions', JSON.stringify(existingSessions));

      if (courseFromPy) {
        localStorage.setItem(`course_outline_${sessionId}`, JSON.stringify(courseFromPy.outline || courseFromPy));
      }

      console.log('Created session via Python and persisted locally:', session);
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  deleteSession: async (sessionId: string, backendActor?: any): Promise<void> => {
    try {
      // Delete session from localStorage
      const existingSessions = JSON.parse(localStorage.getItem('tutor_sessions') || '[]');
      const updatedSessions = existingSessions.filter((session: TutorSession) => session.public_id !== sessionId);
      localStorage.setItem('tutor_sessions', JSON.stringify(updatedSessions));
      
      // Also delete associated course outline and messages
      localStorage.removeItem(`course_outline_${sessionId}`);
      localStorage.removeItem(`chat_messages_${sessionId}`);
      
      console.log('Session and associated data deleted from frontend:', sessionId);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  },

  getSessions: async (): Promise<TutorSession[]> => {
    try {
      // Get sessions from localStorage
      const sessions = JSON.parse(localStorage.getItem('tutor_sessions') || '[]');
      console.log('Retrieved frontend sessions:', sessions);
      return sessions;
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  },

  togglePin: async (tutorId: string): Promise<Tutor> => {
    return {
      id: 1,
      public_id: tutorId,
      name: 'Mock Tutor',
      description: 'A mock tutor for testing',
      teaching_style: 'interactive',
      personality: 'friendly',
      expertise: ['math', 'science'],
      knowledge_base: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  // Enhanced AI Functions
  validateAiTopic: async (tutorId: string, topic: string, backendActor?: any): Promise<TopicValidation> => {
    try {
      // Get tutor data to extract expertise
      const tutor = await tutorService.getTutor(tutorId, backendActor);
      if (!tutor) {
        throw new Error('Tutor not found');
      }

      console.log('Validating AI topic with frontend Groq:', { tutorId, topic });
      const validation = await groqService.validateTopic(topic, tutor.expertise);
      console.log('AI topic validation result:', validation);
      return validation;
    } catch (error) {
      console.error('Error validating AI topic:', error);
      throw error;
    }
  },

  generateAiCourseOutline: async (tutorId: string, topic: string, backendActor?: any): Promise<CourseOutline> => {
    try {
      // Get tutor data to extract expertise and teaching style
      const tutor = await tutorService.getTutor(tutorId, backendActor);
      if (!tutor) {
        throw new Error('Tutor not found');
      }

      console.log('Generating AI course outline with frontend Groq:', { tutorId, topic });
      const outline = await groqService.generateCourseOutline(topic, tutor.expertise, tutor.teaching_style);
      console.log('AI course outline result:', outline);
      return outline;
    } catch (error) {
      console.error('Error generating AI course outline:', error);
      throw error;
    }
  },

  sendAiTutorMessage: async (sessionId: string, message: string, backendActor?: any): Promise<{ response: string; analysis: ComprehensionAnalysis }> => {
    try {
      // Get session data to extract tutor information
      const session = await tutorService.getSession(sessionId, backendActor);
      if (!session) {
        throw new Error('Session not found');
      }

      // Get tutor data
      const tutor = await tutorService.getTutor(session.tutor_id, backendActor);
      if (!tutor) {
        throw new Error('Tutor not found');
      }

      console.log('Sending AI tutor message with frontend Groq:', { sessionId, message });
      const response = await groqService.generateTutorResponse(
        message, 
        tutor.expertise, 
        tutor.teaching_style, 
        tutor.personality
      );
      
      // Create a simple analysis (since we don't have complex analysis from Groq)
      const analysis: ComprehensionAnalysis = {
        comprehension_score: 0.8, // Default score
        difficulty_adjustment: "intermediate",
        timestamp: new Date().toISOString()
      };

      console.log('AI tutor message result:', { response, analysis });
      return { response, analysis };
    } catch (error) {
      console.error('Error sending AI tutor message:', error);
      throw error;
    }
  },

  createAiLearningSession: async (tutorId: string, topic: string, backendActor?: any): Promise<{ sessionId: string; welcomeMessage: string }> => {
    try {
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }

      console.log('Creating AI learning session:', { tutorId, topic });
      const result = await backendActor.create_ai_learning_session(tutorId, topic);
      console.log('AI learning session result:', result);
      return result;
    } catch (error) {
      console.error('Error creating AI learning session:', error);
      throw error;
    }
  },

  // Learning Analytics Functions
  getLearningProgress: async (sessionId: string, backendActor?: any): Promise<LearningProgress> => {
    try {
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }

      console.log('Getting learning progress:', sessionId);
      const progress = await backendActor.get_learning_progress(sessionId);
      console.log('Learning progress result:', progress);
      return progress;
    } catch (error) {
      console.error('Error getting learning progress:', error);
      throw error;
    }
  },

  getLearningMetrics: async (sessionId: string, backendActor?: any): Promise<LearningMetrics[]> => {
    try {
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }

      console.log('Getting learning metrics:', sessionId);
      const metrics = await backendActor.get_learning_metrics(sessionId);
      console.log('Learning metrics result:', metrics);
      return metrics;
    } catch (error) {
      console.error('Error getting learning metrics:', error);
      throw error;
    }
  },

  completeModule: async (moduleId: number, backendActor?: any): Promise<string> => {
    try {
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }

      console.log('Completing module:', moduleId);
      const result = await backendActor.complete_module(moduleId);
      console.log('Module completion result:', result);
      return result;
    } catch (error) {
      console.error('Error completing module:', error);
      throw error;
    }
  },

  getModuleCompletions: async (sessionId: string, backendActor?: any): Promise<ModuleCompletion[]> => {
    try {
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }

      console.log('Getting module completions:', sessionId);
      const completions = await backendActor.get_module_completions(sessionId);
      console.log('Module completions result:', completions);
      return completions;
    } catch (error) {
      console.error('Error getting module completions:', error);
      throw error;
    }
  }
};

export default tutorService;