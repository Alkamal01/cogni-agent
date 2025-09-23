import api from '../utils/apiClient';
import { TutorFormData } from '../components/tutors/TutorFormModal';
import { aiSocketService } from '../services/aiSocketService';

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

export interface ComprehensionAnalysis {
  comprehension_score: number;
  difficulty_adjustment: 'simplify' | 'maintain' | 'deepen';
  timestamp: string;
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

// Cache for tutors
let tutorsCache: {
  data: Tutor[] | null;
  timestamp: number;
  expiryTime: number;
} = {
  data: null,
  timestamp: 0,
  expiryTime: 5 * 60 * 1000 // 5 minutes cache
};

// API Functions
const tutorService = {
  // Tutor Management
  getAllTutors: async (): Promise<Tutor[]> => {
    // Check if we have a valid cache
    const now = Date.now();
    if (tutorsCache.data && (now - tutorsCache.timestamp < tutorsCache.expiryTime)) {
      return tutorsCache.data;
    }
    
    try {
      const response = await api.get('/api/tutors');
      const tutors = response.data.tutors || [];
      
      // Update cache
      tutorsCache = {
        data: tutors,
        timestamp: now,
        expiryTime: 5 * 60 * 1000
      };
      
      return tutors;
    } catch (error: any) {
      console.error('Error fetching tutors:', error);
      
      // If we have cached data, return it even if expired
      if (tutorsCache.data) {
        return tutorsCache.data;
      }
      
      // Otherwise, throw the error
      throw error;
    }
  },

  getTutor: async (tutorId: string): Promise<Tutor> => {
    const response = await api.get(`/api/tutors/${tutorId}`);
    if (!response.data.tutor && response.data.id) {
      return response.data; // Direct response is the tutor object
    }
    return response.data.tutor;
  },

  getTutorKnowledgeBase: async (tutorId: string): Promise<{
    knowledge_base: any;
    files: Array<{
      id: number;
      public_id: string;
      file_name: string;
      file_size: number;
      file_type: string;
      chunks_processed: number;
      processing_time: number;
      status: string;
      created_at: string;
    }>;
  }> => {
    console.log('Calling getTutorKnowledgeBase for tutorId:', tutorId);
    const response = await api.get(`/api/tutors/${tutorId}/knowledge-base`);
    console.log('getTutorKnowledgeBase response:', response.data);
    return response.data;
  },

  deleteTutorKnowledgeBaseFile: async (tutorId: string, fileId: string): Promise<void> => {
    await api.delete(`/api/tutors/${tutorId}/knowledge-base/files/${fileId}`);
  },

  createTutor: async (tutorData: TutorFormData): Promise<Tutor> => {
    const formData = new FormData();
    
    formData.append('name', tutorData.name);
    formData.append('description', tutorData.description);
    formData.append('teachingStyle', tutorData.teachingStyle);
    formData.append('personality', tutorData.personality);
    
    const expertise = Array.isArray(tutorData.expertise) ? tutorData.expertise : [];
    const knowledgeBase = Array.isArray(tutorData.knowledgeBase) ? tutorData.knowledgeBase : [];
    
    formData.append('expertise', JSON.stringify(expertise));
    
    // Handle knowledge base - separate text and files
    const textKnowledge = knowledgeBase.filter(item => typeof item === 'string' && item.trim() !== '');
    const fileKnowledge = knowledgeBase.filter(item => item instanceof File);
    
    if (textKnowledge.length > 0) {
      formData.append('knowledgeBase', JSON.stringify(textKnowledge));
    }
    
    // Add knowledge base files
    fileKnowledge.forEach((file, index) => {
      if (file instanceof File) {
        formData.append('knowledge_base_files', file);
      }
    });
    
    // Add voice settings if provided
    if (tutorData.voice_id) {
      formData.append('voice_id', tutorData.voice_id);
    }
    
    if (tutorData.voice_settings) {
      formData.append('voice_settings', JSON.stringify(tutorData.voice_settings));
    }
    
    if (tutorData.imageFile) {
      formData.append('avatar', tutorData.imageFile);
    }
    
    try {
      // Always use multipart/form-data when there are files or image
      const hasFiles = tutorData.imageFile || fileKnowledge.length > 0;
      const response = hasFiles ?
        await api.post('/api/tutors/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }) :
        await api.post('/api/tutors/', {
          name: tutorData.name,
          description: tutorData.description,
          teachingStyle: tutorData.teachingStyle,
          personality: tutorData.personality,
          expertise,
          knowledgeBase: textKnowledge,
          voice_id: tutorData.voice_id,
          voice_settings: tutorData.voice_settings
        });
      
      return response.data.tutor;
    } catch (error: any) {
      throw error;
    }
  },

  updateTutor: async (tutorId: string, tutorData: FormData): Promise<Tutor> => {
    const response = await api.put(`/api/tutors/${tutorId}`, tutorData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.tutor;
  },

  deleteTutor: async (tutorId: string): Promise<void> => {
    await api.delete(`/api/tutors/${tutorId}`);
  },

  // Session Management
  createSession: async (tutorId: string, sessionData: { topic: string }): Promise<any> => {
    const response = await api.post(`/api/tutors/${tutorId}/sessions`, sessionData);
    return response.data;
  },

  getSession: async (sessionId: string): Promise<any> => {
    console.log('Getting session data for:', sessionId);
    try {
      const response = await api.get(`/api/tutors/sessions/${sessionId}`);
      console.log('Session data received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  },

  getAllSessions: async (): Promise<Array<{
    session: TutorSession,
    tutor: Tutor,
    course: TutorCourse,
    progress: LearningProgress,
    last_message: TutorMessage
  }>> => {
    const response = await api.get('/api/tutors/sessions');
    return response.data.sessions;
  },

  getTutorSessions: async (tutorId: string): Promise<Array<{
    session: TutorSession,
    tutor: Tutor,
    course: TutorCourse,
    progress: LearningProgress,
    last_message: TutorMessage
  }>> => {
    const response = await api.get(`/api/tutors/${tutorId}/sessions`);
    return response.data.sessions;
  },

  sendMessage: async (sessionId: string, message: string): Promise<TutorMessage> => {
    // Use HTTP by default
    const response = await api.post(`/api/tutors/sessions/${sessionId}/message`, {
      message: message
    });
    return response.data.user_message;
  },

  // Get tutor's response to a message
  getTutorResponse: async (sessionId: string, messageId: string): Promise<TutorMessage> => {
    const response = await api.get(`/api/tutors/sessions/${sessionId}/messages/${messageId}/response`);
    return response.data.tutor_message;
  },

  // Check message status
  checkMessageStatus: async (sessionId: string, messageId: string): Promise<{
    status: 'pending' | 'complete' | 'error';
    message?: TutorMessage;
  }> => {
    const response = await api.get(`/api/tutors/sessions/${sessionId}/messages/${messageId}/status`);
    return response.data;
  },

  // Poll for tutor response
  pollForResponse: async (sessionId: string, messageId: string, maxAttempts: number = 30): Promise<TutorMessage> => {
    let attempts = 0;
    while (attempts < maxAttempts) {
      const status = await tutorService.checkMessageStatus(sessionId, messageId);
      if (status.status === 'complete' && status.message) {
        return status.message;
      } else if (status.status === 'error') {
        throw new Error('Failed to get tutor response');
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
      attempts++;
    }
    throw new Error('Timeout waiting for tutor response');
  },

  completeModule: async (sessionId: string, moduleId: number): Promise<{ success: boolean; message: string; progress?: LearningProgress }> => {
    const response = await api.post(`/api/tutors/sessions/${sessionId}/modules/${moduleId}/complete`);
    return response.data;
  },

  completeSession: async (sessionId: string): Promise<any> => {
    const response = await api.post(`/api/tutors/sessions/${sessionId}/complete`);
    return response.data;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/api/tutors/sessions/${sessionId}`);
  },

  checkTutorHealth: async (): Promise<{ success: boolean, message: string, api_response?: string }> => {
    try {
      const response = await api.get('/api/tutors/health/groq');
      return response.data;
    } catch (error: any) {
      console.error('Error checking tutor health:', error);
      if (error.response?.data) {
        return error.response.data;
      }
      return { 
        success: false, 
        message: error.message || 'Failed to check tutor health'
      };
    }
  },

  // Rating methods
  getTutorRatings: async (tutorId: string): Promise<any> => {
    const response = await api.get(`/api/tutors/${tutorId}/ratings`);
    return response.data;
  },

  rateTutor: async (tutorId: string, rating: number, comment: string): Promise<any> => {
    const response = await api.post(`/api/tutors/${tutorId}/rate`, { rating, comment });
    return response.data;
  },

  deleteRating: async (tutorId: string, ratingId: number): Promise<any> => {
    const response = await api.delete(`/api/tutors/${tutorId}/ratings/${ratingId}`);
    return response.data;
  },

  togglePin: async (tutorId: string): Promise<Tutor> => {
    const response = await api.post(`/api/tutors/${tutorId}/toggle-pin`);
    return response.data.tutor;
  },

  // Get topic suggestions based on tutor expertise
  getSuggestedTopics: async (tutorId: string): Promise<TopicSuggestion[]> => {
    const response = await api.get(`/api/tutors/${tutorId}/suggest-topics`);
    if (response.data.success && Array.isArray(response.data.suggestions)) {
      return response.data.suggestions;
    }
    return [];
  },

  // Validate if a topic is relevant to tutor expertise
  validateTopic: async (tutorId: string, topic: string): Promise<TopicValidation> => {
    const response = await api.post(`/api/tutors/${tutorId}/validate-topic`, { topic });
    return response.data;
  },

  startSession: async (tutorId: string, topic: string): Promise<TutorSession> => {
    const response = await api.post<{ session: TutorSession }>(`/api/tutors/${tutorId}/sessions`, { topic });
    return response.data.session;
  },

  // Knowledge Base Management
  getTutorKnowledgeBaseFiles: async (tutorId: string): Promise<any[]> => {
    const response = await api.get(`/api/tutors/${tutorId}/knowledge-base`);
    return response.data.files || [];
  },

  uploadKnowledgeBaseFiles: async (tutorId: string, files: File[]): Promise<any> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const response = await api.post(`/api/tutors/${tutorId}/knowledge-base/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  searchKnowledgeBase: async (tutorId: string, query: string, topK: number = 5): Promise<any> => {
    const response = await api.post(`/api/tutors/${tutorId}/knowledge-base/search`, {
      query,
      top_k: topK
    });
    return response.data;
  },

  deleteKnowledgeBase: async (tutorId: string): Promise<any> => {
    const response = await api.delete(`/api/tutors/${tutorId}/knowledge-base`);
    return response.data;
  },

  deleteKnowledgeBaseFile: async (tutorId: string, fileId: string): Promise<any> => {
    const response = await api.delete(`/api/tutors/${tutorId}/knowledge-base/files/${fileId}`);
    return response.data;
  },
};

export default tutorService; 