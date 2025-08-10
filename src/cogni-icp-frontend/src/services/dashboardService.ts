import canisterService from './canisterService';

export interface DashboardStats {
  studyHours: number;
  activeGroups: number;
  completedTopics: number;
  achievements: number;
  weeklyChange: {
    studyHours: string;
    activeGroups: string;
    completedTopics: string;
    achievements: string;
  };
}

export interface Activity {
  id: string;
  type: 'session' | 'achievement' | 'group';
  title: string;
  date: string;
  description: string;
}

const dashboardService = {
  // Get user dashboard statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const stats = await canisterService.getDashboardStats();
      return {
        studyHours: stats.totalStudyHours,
        activeGroups: stats.activeGroups,
        completedTopics: stats.completedTasks,
        achievements: stats.achievements,
        weeklyChange: {
          studyHours: '+0%',
          activeGroups: '+0',
          completedTopics: '+0',
          achievements: '+0'
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data as fallback
      return {
        studyHours: 0,
        activeGroups: 0,
        completedTopics: 0,
        achievements: 0,
        weeklyChange: {
          studyHours: '+0%',
          activeGroups: '+0',
          completedTopics: '+0',
          achievements: '+0'
        }
      };
    }
  },

  // Get recent user activities
  getRecentActivities: async (): Promise<Activity[]> => {
    try {
      const activities = await canisterService.getRecentActivities();
      return activities;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Return empty array as fallback
      return [];
    }
  },

  // Get all learning metrics for a user
  getUserLearningMetrics: async () => {
    try {
      // For now, return mock data
      return {
        totalStudyHours: 0,
        completedTopics: 0,
        averageScore: 0,
        weeklyProgress: 0
      };
    } catch (error) {
      console.error('Error fetching learning metrics:', error);
      throw error;
    }
  },
  
  // Get user achievements
  getUserAchievements: async () => {
    try {
      const achievements = await canisterService.getAchievements();
      return achievements;
    } catch (error) {
      console.error('Error fetching achievements:', error);
      throw error;
    }
  },
};

export default dashboardService; 