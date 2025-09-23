import api from '../utils/apiClient';

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
      const response = await api.get('/api/users/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data as fallback
      return {
        studyHours: 24.5,
        activeGroups: 5,
        completedTopics: 12,
        achievements: 8,
        weeklyChange: {
          studyHours: '+12%',
          activeGroups: '+2',
          completedTopics: '+3',
          achievements: '+1'
        }
      };
    }
  },

  // Get recent user activities
  getRecentActivities: async (limit: number = 5): Promise<Activity[]> => {
    try {
      const response = await api.get(`/api/users/dashboard/activities?limit=${limit}`);
      return response.data.activities;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Return mock data as fallback (limited to requested amount)
      const mockData: Activity[] = [
        {
          id: "1",
          type: 'session',
          title: 'Completed Advanced Calculus session with Dr. Sarah Chen',
          date: '2 hours ago',
          description: 'Learned about quantum mechanics fundamentals'
        },
        {
          id: "2",
          type: 'achievement',
          title: 'Earned "Quick Learner" badge in Physics',
          date: '4 hours ago',
          description: 'Completed 5 topics in quantum physics'
        },
        {
          id: "3",
          type: 'group',
          title: 'Joined "AI Ethics Discussion" study group',
          date: '1 day ago',
          description: 'Group focused on calculus and linear algebra'
        }
      ];
      return mockData.slice(0, limit);
    }
  },

  // Clear user activities
  clearActivities: async (): Promise<void> => {
    try {
      await api.delete('/api/users/dashboard/activities');
    } catch (error) {
      console.error('Error clearing activities:', error);
      throw error;
    }
  },

  // Get all learning metrics for a user
  getUserLearningMetrics: async () => {
    try {
      const response = await api.get('/api/learning/metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching learning metrics:', error);
      throw error;
    }
  },
  
  // Get user achievements
  getUserAchievements: async () => {
    try {
      const response = await api.get('/api/achievements');
      return response.data.achievements;
    } catch (error) {
      console.error('Error fetching achievements:', error);
      throw error;
    }
  },
};

export default dashboardService; 