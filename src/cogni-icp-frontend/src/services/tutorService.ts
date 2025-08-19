import canisterService from './canisterService';
import { TutorFormData } from '../components/tutors/TutorFormModal';

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
      const result = await canisterService.getTutor(tutorId, backendActor);
      
      // Convert the result to match the Tutor interface
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
      if (!backendActor) {
        throw new Error('Backend actor is not available');
      }

      // Call the backend to get real session data
      const result = await backendActor.get_chat_session(sessionId);
      
      if ('Err' in result) {
        throw new Error(result.Err);
      }

      const sessionData = result.Ok;
      
      // Generate modules for this session
      let moduleTitles: string[] = [];
      try {
        moduleTitles = await tutorService.generateModules(sessionData.id, backendActor);
      } catch (moduleError) {
        console.error('Failed to generate AI modules, using fallback:', moduleError);
        // Use fallback modules if AI generation fails
        moduleTitles = [
          'Introduction to the Topic',
          'Core Concepts',
          'Practice Exercises',
          'Advanced Applications',
          'Review and Assessment'
        ];
      }
      
      // Create modules array with proper structure
      const modules = moduleTitles.map((title, index) => ({
        id: index + 1,
        title: title,
        description: `Module ${index + 1}: ${title}`,
        content: `This module covers ${title.toLowerCase()}`,
        duration: '30-45 minutes',
        order: index + 1,
        is_completed: false
      }));
      
      // Convert the session data to match the expected format
      return {
        session: {
          public_id: sessionData.id,
          user_id: sessionData.user_id.toString(),
          tutor_id: sessionData.tutor_id,
          topic: sessionData.topic,
          status: sessionData.status,
          created_at: new Date(Number(sessionData.created_at) / 1000000).toISOString(),
          updated_at: new Date(Number(sessionData.updated_at) / 1000000).toISOString()
        },
        course: {
          id: 1,
          name: `${sessionData.topic} Course`,
          description: `Personalized AI tutoring session on ${sessionData.topic}`,
          modules: modules
        },
        modules: modules,
        progress: {
          id: 1,
          user_id: sessionData.user_id.toString(),
          session_id: sessionData.id,
          course_id: 1,
          current_module_id: 1, // Start with first module
          progress_percentage: 0, // Start at 0%
          last_activity: new Date().toISOString()
        },
        messages: []
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

  getAllSessions: async (): Promise<any[]> => {
    return [];
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

  getSuggestedTopics: async (tutorId: string, backendActor?: any): Promise<TopicSuggestion[]> => {
    try {
      if (!backendActor) {
        throw new Error('Backend actor is not available');
      }

      // Fetch tutor data to get expertise and personality
      const tutor = await canisterService.getTutor(tutorId, backendActor);
      console.log('Fetched tutor for AI topic suggestions:', tutor);

      // Call the backend to get AI-generated topic suggestions
      const suggestions = await backendActor.get_ai_topic_suggestions(tutorId);
      console.log('AI topic suggestions from backend:', suggestions);

      if ('Err' in suggestions) {
        throw new Error(suggestions.Err);
      }

      // Convert the suggestions to match the TopicSuggestion interface
      return suggestions.Ok.map((suggestion: any) => ({
        topic: suggestion.topic,
        description: suggestion.description,
        difficulty: suggestion.difficulty,
        expertise_area: suggestion.expertise_area
      }));
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

      // Call the backend to validate the topic
      const validation = await backendActor.validate_topic(tutorId, topic);
      console.log('Topic validation from backend:', validation);

      if ('Err' in validation) {
        throw new Error(validation.Err);
      }

      // Convert the validation to match the TopicValidation interface
      return {
        is_relevant: validation.Ok.is_relevant,
        confidence: validation.Ok.confidence,
        reasoning: validation.Ok.reasoning,
        suggested_alternatives: validation.Ok.suggested_alternatives
      };
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
      if (!backendActor) {
        throw new Error('Backend actor is not available');
      }

      // Call the backend to create a real session
      const result = await backendActor.create_chat_session(tutorId, topic);
      
      if ('Err' in result) {
        throw new Error(result.Err);
      }

      const sessionId = result.Ok;
      
      // Return the session data
      return {
        public_id: sessionId,
        user_id: 'current-user', // This will be set by the backend
        tutor_id: tutorId,
        topic: topic,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    console.log('Deleting session:', sessionId);
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
  }
};

export default tutorService; 