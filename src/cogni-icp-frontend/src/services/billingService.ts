import canisterService from './canisterService';

export interface SubscriptionPlan {
  id: number;
  name: string;
  price_naira: number;
  price_formatted: string;
  billing_cycle: string;
  features: string[];
  limits: {
    tutors: number;
    study_groups: number;
    sessions_per_month: number;
    storage_gb: number;
    analytics: boolean;
    priority_support: boolean;
    custom_tutors: boolean;
    [key: string]: any;
  };
  paystack_plan_code: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  plan: SubscriptionPlan;
  status: string;
  start_date: string | null;
  end_date: string | null;
  next_payment_date: string | null;
  amount_naira: number;
  currency: string;
  auto_renew: boolean;
  is_active: boolean;
  days_remaining: number | null;
  created_at: string | null;
  updated_at: string | null;
  cancelled_at: string | null;
}

export interface PaymentTransaction {
  id: number;
  user_id: number;
  subscription_id: number | null;
  paystack_reference: string;
  amount_naira: number;
  amount_formatted: string;
  currency: string;
  status: string;
  payment_method: string;
  description: string;
  created_at: string | null;
  paid_at: string | null;
}

export interface SubscriptionStatus {
  subscription: UserSubscription | null;
  usage: {
    tutors_used: number;
    sessions_this_month: number;
    storage_used_gb: number;
  };
  limits: {
    tutors: number;
    sessions_per_month: number;
    storage_gb: number;
    analytics: boolean;
    priority_support: boolean;
    [key: string]: any;
  };
  can_upgrade: boolean;
}

export interface SubscribeResponse {
  success: boolean;
  message?: string;
  payment_url?: string;
  access_code?: string;
  reference?: string;
  subscription?: UserSubscription;
}

class BillingService {
  /**
   * Get all available subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      // For now, return mock data
      return [];
    } catch (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
  }

  /**
   * Get current user's subscription
   */
  async getSubscription(): Promise<UserSubscription | null> {
    try {
      // For now, return mock data
      return null;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  /**
   * Get detailed subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      // For now, return mock data
      return {
        subscription: null,
        usage: {
          tutors_used: 0,
          sessions_this_month: 0,
          storage_used_gb: 0
        },
        limits: {
          tutors: 1,
          sessions_per_month: 5,
          storage_gb: 1,
          analytics: false,
          priority_support: false
        },
        can_upgrade: true
      };
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      throw error;
    }
  }

  /**
   * Subscribe to a plan
   */
  async subscribe(planId: number, callbackUrl?: string): Promise<SubscribeResponse> {
    try {
      // For now, return mock data
      return {
        success: true,
        message: 'Subscription successful',
        reference: 'mock-reference'
      };
    } catch (error) {
      console.error('Error subscribing:', error);
      throw error;
    }
  }

  /**
   * Upgrade/change subscription plan
   */
  async upgradeSubscription(planId: number, callbackUrl?: string): Promise<SubscribeResponse> {
    try {
      // For now, return mock data
      return {
        success: true,
        message: 'Subscription upgraded successfully',
        reference: 'mock-reference'
      };
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  }

  /**
   * Verify payment after successful transaction
   */
  async verifyPayment(reference: string): Promise<{ success: boolean; subscription?: UserSubscription; message?: string }> {
    try {
      // For now, return mock data
      return {
        success: true,
        message: 'Payment verified successfully'
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Cancel current subscription
   */
  async cancelSubscription(): Promise<{ success: boolean; message?: string }> {
    try {
      // For now, return mock data
      return {
        success: true,
        message: 'Subscription cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Get user's payment transactions
   */
  async getTransactions(page: number = 1, perPage: number = 10): Promise<{
    transactions: PaymentTransaction[];
    pagination: {
      page: number;
      pages: number;
      per_page: number;
      total: number;
    };
  }> {
    try {
      // For now, return mock data
      return {
        transactions: [],
        pagination: {
          page,
          pages: 0,
          per_page: perPage,
          total: 0
        }
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Check if user has feature access based on subscription
   */
  hasFeatureAccess(feature: string, subscription: UserSubscription | null): boolean {
    if (!subscription || !subscription.is_active) {
      // Free tier access
      const freeLimits: Record<string, boolean> = {
        analytics: false,
        priority_support: false,
        custom_tutors: false
      };
      return freeLimits[feature] ?? false;
    }

    const limits = subscription.plan.limits;
    const value = limits[feature];
    
    // For boolean features, return the boolean value
    if (typeof value === 'boolean') {
      return value;
    }
    
    // For numeric features, check if user has access (any positive number means access)
    if (typeof value === 'number') {
      return value > 0;
    }
    
    return false;
  }

  /**
   * Get feature limit for current subscription
   */
  getFeatureLimit(feature: string, subscription: UserSubscription | null): number | boolean {
    if (!subscription || !subscription.is_active) {
      // Free tier limits
      const freeLimits: Record<string, number | boolean> = {
        tutors: 1,
        study_groups: 1,
        sessions_per_month: 5,
        storage_gb: 1,
        analytics: false,
        priority_support: false,
        custom_tutors: false
      };
      return freeLimits[feature] ?? 0;
    }

    const limits = subscription.plan.limits;
    return limits[feature] ?? 0;
  }

  /**
   * Check if user can perform an action based on current usage and subscription
   */
  canPerformAction(action: string, currentUsage: number, subscription: UserSubscription | null): boolean {
    const limit = this.getFeatureLimit(action, subscription);
    
    if (typeof limit === 'boolean') {
      return limit;
    }
    
    if (typeof limit === 'number') {
      return currentUsage < limit;
    }
    
    return false;
  }

  /**
   * Format price from kobo to naira
   */
  formatPrice(priceKobo: number): string {
    const naira = priceKobo / 100;
    return `₦${naira.toLocaleString()}`;
  }

  /**
   * Get a specific plan by ID
   */
  async getPlan(planId: number): Promise<SubscriptionPlan | null> {
    try {
      // For now, return mock data
      return null;
    } catch (error) {
      console.error('Error fetching plan:', error);
      return null;
    }
  }

  /**
   * Get recommended plan based on usage
   */
  getRecommendedPlan(plans: SubscriptionPlan[], usage: any): SubscriptionPlan | null {
    // For now, return the first plan
    return plans.length > 0 ? plans[0] : null;
  }

  /**
   * Initialize Paystack payment
   */
  initializePaystackPayment(config: {
    key: string;
    email: string;
    amount: number;
    ref: string;
    onSuccess: (response: any) => void;
    onCancel: () => void;
  }): void {
    // For now, just log the action
    console.log('Initializing Paystack payment:', config);
  }
}

export default new BillingService(); 