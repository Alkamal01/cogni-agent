import { LearningProgress, LearningMetrics, ModuleCompletion, ComprehensionAnalysis } from './tutorService';

export interface LearningDashboard {
  progress: LearningProgress;
  metrics: LearningMetrics[];
  completions: ModuleCompletion[];
  averageComprehension: number;
  totalTimeSpent: number;
  messagesSent: number;
  difficultyTrend: 'simplify' | 'maintain' | 'deepen';
}

export interface ProgressInsights {
  strengths: string[];
  areasForImprovement: string[];
  recommendedActions: string[];
  learningVelocity: number;
  engagementLevel: 'low' | 'medium' | 'high';
}

class LearningAnalyticsService {
  private progressCache = new Map<string, { data: LearningProgress; timestamp: number }>();
  private metricsCache = new Map<string, { data: LearningMetrics[]; timestamp: number }>();
  private CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  /**
   * Get comprehensive learning dashboard data
   */
  async getLearningDashboard(sessionId: string, backendActor?: any): Promise<LearningDashboard> {
    try {
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }

      // Fetch all data in parallel
      const [progress, metrics, completions] = await Promise.all([
        this.getLearningProgress(sessionId, backendActor),
        this.getLearningMetrics(sessionId, backendActor),
        this.getModuleCompletions(sessionId, backendActor)
      ]);

      // Calculate insights
      const averageComprehension = this.calculateAverageComprehension(metrics);
      const totalTimeSpent = this.calculateTotalTimeSpent(metrics);
      const messagesSent = this.calculateTotalMessages(metrics);
      const difficultyTrend = this.analyzeDifficultyTrend(metrics);

      return {
        progress,
        metrics,
        completions,
        averageComprehension,
        totalTimeSpent,
        messagesSent,
        difficultyTrend
      };
    } catch (error) {
      console.error('Error getting learning dashboard:', error);
      throw error;
    }
  }

  /**
   * Get learning progress for a session
   */
  async getLearningProgress(sessionId: string, backendActor?: any): Promise<LearningProgress> {
    try {
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }

      // Check cache first
      const cached = this.progressCache.get(sessionId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      const progress = await backendActor.get_learning_progress(sessionId);
      
      // Cache the result
      this.progressCache.set(sessionId, { data: progress, timestamp: Date.now() });
      
      return progress;
    } catch (error) {
      console.error('Error getting learning progress:', error);
      throw error;
    }
  }

  /**
   * Get learning metrics for a session
   */
  async getLearningMetrics(sessionId: string, backendActor?: any): Promise<LearningMetrics[]> {
    try {
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }

      // Check cache first
      const cached = this.metricsCache.get(sessionId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      const metrics = await backendActor.get_learning_metrics(sessionId);
      
      // Cache the result
      this.metricsCache.set(sessionId, { data: metrics, timestamp: Date.now() });
      
      return metrics;
    } catch (error) {
      console.error('Error getting learning metrics:', error);
      throw error;
    }
  }

  /**
   * Get module completions for a session
   */
  async getModuleCompletions(sessionId: string, backendActor?: any): Promise<ModuleCompletion[]> {
    try {
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }

      const completions = await backendActor.get_module_completions(sessionId);
      return completions;
    } catch (error) {
      console.error('Error getting module completions:', error);
      throw error;
    }
  }

  /**
   * Complete a learning module
   */
  async completeModule(moduleId: number, backendActor?: any): Promise<string> {
    try {
      if (!backendActor) {
        throw new Error('Backend actor not available');
      }

      const result = await backendActor.complete_module(moduleId);
      
      // Clear cache to force refresh
      this.progressCache.clear();
      this.metricsCache.clear();
      
      return result;
    } catch (error) {
      console.error('Error completing module:', error);
      throw error;
    }
  }

  /**
   * Generate learning insights and recommendations
   */
  generateInsights(dashboard: LearningDashboard): ProgressInsights {
    const { progress, metrics, completions } = dashboard;
    
    // Analyze comprehension scores
    const comprehensionScores = metrics.flatMap(m => Object.values(m.comprehension_scores));
    const averageComprehension = comprehensionScores.reduce((sum, score) => sum + score, 0) / comprehensionScores.length;
    
    // Analyze difficulty adjustments
    const difficultyAdjustments = metrics.flatMap(m => Object.values(m.difficulty_adjustments));
    const simplifyCount = difficultyAdjustments.filter(d => d === 'simplify').length;
    const deepenCount = difficultyAdjustments.filter(d => d === 'deepen').length;
    
    // Calculate learning velocity (modules completed per hour)
    const completedModules = completions.filter(c => c.completed).length;
    const totalTimeHours = dashboard.totalTimeSpent / 60;
    const learningVelocity = totalTimeHours > 0 ? completedModules / totalTimeHours : 0;
    
    // Determine engagement level
    const messagesPerHour = totalTimeHours > 0 ? dashboard.messagesSent / totalTimeHours : 0;
    const engagementLevel = messagesPerHour > 10 ? 'high' : messagesPerHour > 5 ? 'medium' : 'low';
    
    // Generate insights
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const recommendedActions: string[] = [];
    
    if (averageComprehension > 0.7) {
      strengths.push('Strong comprehension of the material');
    } else if (averageComprehension < 0.5) {
      areasForImprovement.push('Comprehension could be improved');
      recommendedActions.push('Consider asking for more explanations or examples');
    }
    
    if (simplifyCount > deepenCount) {
      areasForImprovement.push('Material may be too challenging');
      recommendedActions.push('Request simpler explanations or additional practice');
    } else if (deepenCount > simplifyCount) {
      strengths.push('Ready for more advanced material');
      recommendedActions.push('Ask for more challenging topics or deeper exploration');
    }
    
    if (engagementLevel === 'low') {
      areasForImprovement.push('Low engagement with the material');
      recommendedActions.push('Try asking more questions or requesting interactive examples');
    } else if (engagementLevel === 'high') {
      strengths.push('High engagement and active participation');
    }
    
    if (learningVelocity < 0.5) {
      recommendedActions.push('Consider breaking down topics into smaller, more manageable chunks');
    }
    
    return {
      strengths,
      areasForImprovement,
      recommendedActions,
      learningVelocity,
      engagementLevel
    };
  }

  /**
   * Calculate average comprehension score
   */
  private calculateAverageComprehension(metrics: LearningMetrics[]): number {
    const allScores = metrics.flatMap(m => Object.values(m.comprehension_scores));
    if (allScores.length === 0) return 0;
    return allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
  }

  /**
   * Calculate total time spent learning
   */
  private calculateTotalTimeSpent(metrics: LearningMetrics[]): number {
    return metrics.reduce((total, metric) => total + metric.time_spent_minutes, 0);
  }

  /**
   * Calculate total messages sent
   */
  private calculateTotalMessages(metrics: LearningMetrics[]): number {
    return metrics.reduce((total, metric) => total + metric.messages_sent, 0);
  }

  /**
   * Analyze difficulty trend
   */
  private analyzeDifficultyTrend(metrics: LearningMetrics[]): 'simplify' | 'maintain' | 'deepen' {
    const allAdjustments = metrics.flatMap(m => Object.values(m.difficulty_adjustments));
    const simplifyCount = allAdjustments.filter(a => a === 'simplify').length;
    const deepenCount = allAdjustments.filter(a => a === 'deepen').length;
    
    if (simplifyCount > deepenCount) return 'simplify';
    if (deepenCount > simplifyCount) return 'deepen';
    return 'maintain';
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.progressCache.clear();
    this.metricsCache.clear();
  }
}

export const learningAnalyticsService = new LearningAnalyticsService();
export default learningAnalyticsService;
