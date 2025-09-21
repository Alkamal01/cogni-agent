import { CourseOutline, TopicValidation, TopicSuggestion } from './tutorService';
import { groqService } from './groqService';

export interface CourseGenerationRequest {
  tutorId: string;
  topic: string;
  userPreferences?: {
    learningStyle?: string;
    difficultyLevel?: string;
    estimatedDuration?: string;
  };
}

export interface CourseGenerationResult {
  outline: CourseOutline;
  validation: TopicValidation;
  suggestions?: TopicSuggestion[];
  isGenerated: boolean;
  error?: string;
}

export interface CourseModuleProgress {
  moduleId: number;
  title: string;
  isCompleted: boolean;
  progressPercentage: number;
  timeSpent: number;
  lastAccessed?: string;
}

class CourseGenerationService {
  private courseCache = new Map<string, { data: CourseOutline; timestamp: number }>();
  private validationCache = new Map<string, { data: TopicValidation; timestamp: number }>();
  private CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  /**
   * Generate a complete course with validation and suggestions
   */
  async generateCourse(
    request: CourseGenerationRequest, 
    backendActor?: any
  ): Promise<CourseGenerationResult> {
    try {
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }

      const { tutorId, topic, userPreferences } = request;

      // Step 1: Validate the topic
      const validation = await this.validateTopic(tutorId, topic, backendActor);
      
      if (!validation.is_relevant) {
        return {
          outline: this.createEmptyOutline(topic),
          validation,
          isGenerated: false,
          error: `Topic "${topic}" is not relevant to this tutor's expertise. ${validation.reasoning}`
        };
      }

      // Step 2: Generate course outline
      const outline = await this.generateCourseOutline(tutorId, topic, backendActor);

      // Step 3: Get topic suggestions for related topics
      const suggestions = await this.getTopicSuggestions(tutorId, backendActor);

      return {
        outline,
        validation,
        suggestions,
        isGenerated: true
      };
    } catch (error) {
      console.error('Error generating course:', error);
      return {
        outline: this.createEmptyOutline(request.topic),
        validation: {
          is_relevant: false,
          confidence: 0,
          reasoning: 'Error occurred during course generation',
          suggested_alternatives: []
        },
        isGenerated: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate a topic for a specific tutor
   */
  async validateTopic(
    tutorId: string, 
    topic: string, 
    backendActor?: any
  ): Promise<TopicValidation> {
    try {
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }

      // Check cache first
      const cacheKey = `${tutorId}-${topic}`;
      const cached = this.validationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      // Get tutor data to extract expertise using public_id
      const tutorResult = await backendActor.get_tutor_by_public_id(tutorId);
      if (!tutorResult) {
        throw new Error(`Tutor not found: ${tutorId}`);
      }
      const tutor = tutorResult;

      // Use frontend Groq service
      const validation = await groqService.validateTopic(topic, tutor.expertise || []);
      
      // Cache the result
      this.validationCache.set(cacheKey, { data: validation, timestamp: Date.now() });
      
      return validation;
    } catch (error) {
      console.error('Error validating topic:', error);
      throw error;
    }
  }

  /**
   * Generate course outline for a topic
   */
  async generateCourseOutline(
    tutorId: string, 
    topic: string, 
    backendActor?: any
  ): Promise<CourseOutline> {
    try {
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }

      // Check cache first
      const cacheKey = `${tutorId}-${topic}`;
      const cached = this.courseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      // Get tutor data to extract expertise and teaching style
      const tutorResult = await backendActor.get_tutor_by_public_id(tutorId);
      if (!tutorResult) {
        throw new Error(`Tutor not found: ${tutorId}`);
      }
      const tutor = tutorResult;

      // Use frontend Groq service
      const outline = await groqService.generateCourseOutline(
        topic, 
        tutor.expertise || [], 
        tutor.teaching_style || 'casual'
      );
      
      // Cache the result
      this.courseCache.set(cacheKey, { data: outline, timestamp: Date.now() });
      
      return outline;
    } catch (error) {
      console.error('Error generating course outline:', error);
      throw error;
    }
  }

  /**
   * Get topic suggestions for a tutor
   */
  async getTopicSuggestions(tutorId: string, backendActor?: any): Promise<TopicSuggestion[]> {
    try {
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }

      // Get tutor data to extract expertise and teaching style
      const tutorResult = await backendActor.get_tutor_by_public_id(tutorId);
      if (!tutorResult) {
        throw new Error(`Tutor not found: ${tutorId}`);
      }
      const tutor = tutorResult;

      // Use frontend Groq service
      const suggestions = await groqService.generateTopicSuggestions(
        tutor.expertise || [],
        tutor.teaching_style || 'casual',
        tutor.personality || 'helpful'
      );
      return suggestions;
    } catch (error) {
      console.error('Error getting topic suggestions:', error);
      return [];
    }
  }

  /**
   * Create an empty course outline as fallback
   */
  private createEmptyOutline(topic: string): CourseOutline {
    return {
      title: `Course on ${topic}`,
      description: `A comprehensive course about ${topic}`,
      learning_objectives: [
        `Understand the basics of ${topic}`,
        `Apply ${topic} concepts in practical scenarios`,
        `Master advanced ${topic} techniques`
      ],
      estimated_duration: '4 weeks',
      difficulty_level: 'intermediate',
      modules: [
        {
          id: 1,
          course_id: 1,
          title: 'Introduction',
          description: `Introduction to ${topic}`,
          order: 1,
          content: `Learn the fundamentals of ${topic}`,
          status: 'pending'
        }
      ]
    };
  }

  /**
   * Calculate course progress
   */
  calculateCourseProgress(modules: CourseModuleProgress[]): {
    completedModules: number;
    totalModules: number;
    progressPercentage: number;
    estimatedTimeRemaining: number;
  } {
    const completedModules = modules.filter(m => m.isCompleted).length;
    const totalModules = modules.length;
    const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
    
    // Estimate remaining time based on average time per module
    const totalTimeSpent = modules.reduce((sum, m) => sum + m.timeSpent, 0);
    const averageTimePerModule = completedModules > 0 ? totalTimeSpent / completedModules : 30; // Default 30 minutes
    const remainingModules = totalModules - completedModules;
    const estimatedTimeRemaining = remainingModules * averageTimePerModule;

    return {
      completedModules,
      totalModules,
      progressPercentage,
      estimatedTimeRemaining
    };
  }

  /**
   * Get next recommended module
   */
  getNextModule(modules: CourseModuleProgress[]): CourseModuleProgress | null {
    return modules
      .filter(m => !m.isCompleted)
      .sort((a, b) => a.moduleId - b.moduleId)[0] || null;
  }

  /**
   * Get module recommendations based on progress
   */
  getModuleRecommendations(modules: CourseModuleProgress[]): {
    recommended: CourseModuleProgress[];
    review: CourseModuleProgress[];
    advanced: CourseModuleProgress[];
  } {
    const completed = modules.filter(m => m.isCompleted);
    const pending = modules.filter(m => !m.isCompleted);
    
    // Recommend next 2-3 modules
    const recommended = pending.slice(0, 3);
    
    // Suggest review of recently completed modules (if any)
    const review = completed
      .sort((a, b) => new Date(b.lastAccessed || '').getTime() - new Date(a.lastAccessed || '').getTime())
      .slice(0, 2);
    
    // Suggest advanced modules (last 2-3 modules)
    const advanced = pending.slice(-3);

    return {
      recommended,
      review,
      advanced
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.courseCache.clear();
    this.validationCache.clear();
  }

  /**
   * Clear cache for specific tutor
   */
  clearTutorCache(tutorId: string): void {
    for (const [key] of this.courseCache) {
      if (key.startsWith(tutorId)) {
        this.courseCache.delete(key);
      }
    }
    for (const [key] of this.validationCache) {
      if (key.startsWith(tutorId)) {
        this.validationCache.delete(key);
      }
    }
  }
}

export const courseGenerationService = new CourseGenerationService();
export default courseGenerationService;
