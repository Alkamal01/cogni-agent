import { useAuth } from '../contexts/AuthContext';

/**
 * Canister Service for making backend requests through the Rust canister
 */
export const canisterService = {
  /**
   * Get dashboard stats
   */
  getDashboardStats: async () => {
    // For now, return mock data since these methods aren't implemented in the backend yet
    return {
      totalStudyHours: 0,
      completedTasks: 0,
      activeGroups: 0,
      achievements: 0,
      weeklyProgress: 0,
      monthlyProgress: 0
    };
  },

  /**
   * Get recent activities
   */
  getRecentActivities: async () => {
    // For now, return mock data
    return [];
  },

  /**
   * Get all tutors
   */
  getAllTutors: async (backendActor?: any) => {
    try {
      if (!backendActor) {
        // For now, return mock data if no backend actor is provided
        return [];
      }

      const tutors = await backendActor.get_tutors();
      console.log('Raw tutors from backend:', tutors);
      
      // Convert BigInt values in the response
      const convertBigIntToString = (value: any): any => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        if (Array.isArray(value)) {
          return value.map(convertBigIntToString);
        }
        if (typeof value === 'object' && value !== null) {
          const converted: any = {};
          for (const [key, val] of Object.entries(value)) {
            converted[key] = convertBigIntToString(val);
          }
          return converted;
        }
        return value;
      };
      
      const convertedTutors = tutors.map((tutor: any) => convertBigIntToString(tutor));
      console.log('Converted tutors:', convertedTutors);
      return convertedTutors;
    } catch (error) {
      console.error('Error fetching tutors:', error);
      return [];
    }
  },

  /**
   * Get tutor by public ID
   */
  getTutor: async (publicId: string, backendActor?: any) => {
    try {
      if (!backendActor) {
        throw new Error('Backend actor is not available');
      }

      const tutorResult = await backendActor.get_tutor_by_public_id(publicId);
      console.log('Raw tutor from backend:', tutorResult);
      
      // Handle Option<Tutor> - it returns [] for None or [tutor] for Some(tutor)
      if (!tutorResult || !Array.isArray(tutorResult) || tutorResult.length === 0) {
        throw new Error('Tutor not found');
      }
      
      const tutor = tutorResult[0]; // Extract the tutor from the array
      console.log('Extracted tutor:', tutor);
      
      // Convert BigInt values in the response
      const convertBigIntToString = (value: any): any => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        if (Array.isArray(value)) {
          return value.map(convertBigIntToString);
        }
        if (typeof value === 'object' && value !== null) {
          const converted: any = {};
          for (const [key, val] of Object.entries(value)) {
            converted[key] = convertBigIntToString(val);
          }
          return converted;
        }
        return value;
      };
      
      const convertedTutor = convertBigIntToString(tutor);
      console.log('Converted tutor:', convertedTutor);
      return convertedTutor;
    } catch (error) {
      console.error('Error fetching tutor:', error);
      throw error;
    }
  },

  /**
   * Create tutor
   */
  createTutor: async (data: {
    name: string;
    description: string;
    teachingStyle: string;
    personality: string;
    expertise: string[];
    knowledgeBase: string[];
    voiceId?: string;
    voiceSettings?: any;
    avatarUrl?: string;
  }, backendActor?: any) => {
    try {
      if (!backendActor) {
        // For now, return mock data if no backend actor is provided
        return {
          id: 1,
          public_id: 'mock-tutor-id',
          name: data.name,
          description: data.description,
          teaching_style: data.teachingStyle,
          personality: data.personality,
          expertise: data.expertise,
          knowledge_base: data.knowledgeBase,
          avatar_url: data.avatarUrl,
          is_pinned: false,
          voice_id: data.voiceId,
          voice_settings: data.voiceSettings || {},
          created_at: Date.now(),
          updated_at: Date.now()
        };
      }

      console.log('Data received for tutor creation:', data);
      
      // Handle missing optional fields - the form doesn't collect voice_id, voice_settings, or avatarUrl
      const voiceId = data.voiceId || (data as any).voice_id;
      const voiceSettings = data.voiceSettings || (data as any).voice_settings;
      const avatarUrl = data.avatarUrl || (data as any).imageUrl;
      
      console.log('voiceId:', voiceId);
      console.log('voiceSettings:', voiceSettings);
      console.log('avatarUrl:', avatarUrl);
      
      // Convert any BigInt values to strings in arrays
      const convertBigIntToString = (value: any): any => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        if (Array.isArray(value)) {
          return value.map(convertBigIntToString);
        }
        if (typeof value === 'object' && value !== null) {
          const converted: any = {};
          for (const [key, val] of Object.entries(value)) {
            converted[key] = convertBigIntToString(val);
          }
          return converted;
        }
        return value;
      };
      
      const expertise = convertBigIntToString(data.expertise);
      const knowledgeBase = convertBigIntToString(data.knowledgeBase);
      
      console.log('Converted expertise:', expertise);
      console.log('Converted knowledgeBase:', knowledgeBase);
      console.log('Backend actor:', backendActor);
      console.log('Backend actor type:', typeof backendActor);
      console.log('Backend actor has create_tutor:', backendActor && typeof backendActor.create_tutor === 'function');
      
      if (!backendActor) {
        throw new Error('Backend actor is not available');
      }
      
      if (typeof backendActor.create_tutor !== 'function') {
        throw new Error('Backend actor does not have create_tutor method');
      }
      
      // Test if we can call a simple backend method first
      try {
        console.log('Testing backend connection with get_self...');
        const selfResult = await backendActor.get_self();
        console.log('get_self result:', selfResult);
      } catch (testError) {
        console.error('Backend connection test failed:', testError);
        throw new Error(`Backend connection failed: ${testError}`);
      }
      
      console.log('About to call create_tutor with parameters:');
      console.log('- name:', data.name);
      console.log('- description:', data.description);
      console.log('- teachingStyle:', data.teachingStyle);
      console.log('- personality:', data.personality);
      console.log('- expertise:', expertise);
      console.log('- knowledgeBase:', knowledgeBase && knowledgeBase.length > 0 ? [knowledgeBase] : []);
      console.log('- voiceId:', voiceId ? [voiceId] : []);
      console.log('- voiceSettings:', voiceSettings && Object.keys(voiceSettings).length > 0 ? [Object.entries(voiceSettings)] : []);
      console.log('- avatarUrl:', avatarUrl ? [avatarUrl] : []);
      
      const result = await backendActor.create_tutor(
        data.name,
        data.description,
        data.teachingStyle,
        data.personality,
        expertise,
        knowledgeBase && knowledgeBase.length > 0 ? [knowledgeBase] : [],
        voiceId ? [voiceId] : [],
        voiceSettings && Object.keys(voiceSettings).length > 0 ? [Object.entries(voiceSettings)] : [],
        avatarUrl ? [avatarUrl] : []
      );

      console.log('Raw result from backend:', result);

      if ('Ok' in result) {
        // Convert BigInt values in the response
        const convertedResult = convertBigIntToString(result.Ok);
        console.log('Converted result:', convertedResult);
        return convertedResult;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Error creating tutor:', error);
      throw error;
    }
  },

  /**
   * Get subscription data
   */
  getSubscription: async () => {
    // For now, return mock data
    return {
      plan: 'free',
      status: 'active',
      nextBilling: null,
      features: []
    };
  },

  /**
   * Get user profile
   */
  getUserProfile: async () => {
    // This will be handled by the AuthContext
    return null;
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (data: any) => {
    // For now, return success
    return { success: true };
  },

  /**
   * Get study groups
   */
  getStudyGroups: async () => {
    // For now, return mock data
    return [];
  },

  /**
   * Create study group
   */
  createStudyGroup: async (data: any) => {
    // For now, return success
    return { success: true, id: 'mock-group-id' };
  },

  /**
   * Get learning paths
   */
  getLearningPaths: async () => {
    // For now, return mock data
    return [];
  },

  /**
   * Get achievements
   */
  getAchievements: async () => {
    // For now, return mock data
    return [];
  },

  /**
   * Get billing data
   */
  getBillingData: async () => {
    // For now, return mock data
    return {
      invoices: [],
      paymentMethods: [],
      subscription: {
        plan: 'free',
        status: 'active'
      }
    };
  }
};

export default canisterService; 