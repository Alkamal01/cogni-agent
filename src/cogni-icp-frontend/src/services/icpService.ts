/**
 * ICP (Internet Computer Protocol) Service
 * Handles principal linking and on-chain achievement queries
 */

import apiClient from './apiService';

export interface ICPPrincipal {
  principal: string | null;
}

export interface OnChainAchievement {
  id: number;
  user_principal: string;
  achievement_type: string;
  achievement_id: string;
  metadata_hash: string;
  issued_at: number;
  badge_code?: string;
}

export interface OnChainTaskCompletion {
  id: number;
  user_principal: string;
  task_id: string;
  proof_hash: string;
  completed_at: number;
  completion_count: number;
}

export interface CanisterStatus {
  success: boolean;
  configured: boolean;
  canister_id?: string;
  network?: string;
  error?: string;
}

class ICPService {
  private baseUrl = '/api/icp';

  /**
   * Link the current user to an Internet Identity principal
   */
  async linkPrincipal(principal: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/link-principal`, {
        principal
      });
      return response.data;
    } catch (error: any) {
      console.error('Error linking principal:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to link principal'
      };
    }
  }

  /**
   * Get the current user's linked Internet Identity principal
   */
  async getPrincipal(): Promise<ICPPrincipal> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/principal`);
      return {
        principal: response.data.principal
      };
    } catch (error: any) {
      console.error('Error getting principal:', error);
      return { principal: null };
    }
  }

  /**
   * Unlink the current user's Internet Identity principal
   */
  async unlinkPrincipal(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/principal`);
      return response.data;
    } catch (error: any) {
      console.error('Error unlinking principal:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to unlink principal'
      };
    }
  }

  /**
   * Get the current user's achievements from the on-chain canister
   */
  async getOnChainAchievements(): Promise<OnChainAchievement[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/achievements`);
      return response.data.achievements || [];
    } catch (error: any) {
      console.error('Error getting on-chain achievements:', error);
      return [];
    }
  }

  /**
   * Get the current user's task completions from the on-chain canister
   */
  async getOnChainTaskCompletions(): Promise<OnChainTaskCompletion[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/task-completions`);
      return response.data.completions || [];
    } catch (error: any) {
      console.error('Error getting on-chain task completions:', error);
      return [];
    }
  }

  /**
   * Get the status of the ICP canister connection
   */
  async getCanisterStatus(): Promise<CanisterStatus> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/canister/status`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting canister status:', error);
      return {
        success: false,
        configured: false,
        error: error.response?.data?.error || 'Failed to get canister status'
      };
    }
  }

  /**
   * Get achievements with both off-chain and on-chain data
   */
  async getAchievementsWithOnChain(): Promise<{
    achievements: any[];
    onchain_attestations: OnChainAchievement[];
    total_count: number;
    total_points: number;
  }> {
    try {
      const response = await apiClient.get('/api/achievements/achievements-with-onchain');
      return response.data;
    } catch (error: any) {
      console.error('Error getting achievements with on-chain data:', error);
      return {
        achievements: [],
        onchain_attestations: [],
        total_count: 0,
        total_points: 0
      };
    }
  }

  /**
   * Create a test achievement (for development/testing)
   */
  async createTestAchievement(achievementData?: {
    title?: string;
    description?: string;
    type?: string;
    points?: number;
  }): Promise<{ success: boolean; achievement?: any; message?: string; error?: string }> {
    try {
      const response = await apiClient.post('/api/achievements/test-achievement', achievementData || {});
      return response.data;
    } catch (error: any) {
      console.error('Error creating test achievement:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create test achievement'
      };
    }
  }
}

export const icpService = new ICPService();
export default icpService;
