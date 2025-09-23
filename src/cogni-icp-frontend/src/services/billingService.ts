import api from '../utils/apiClient';

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
  amount_kobo?: number;
  subscription?: UserSubscription;
}

class BillingService {
  /**
   * Get all available subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await api.get('/api/billing/plans');
    return response.data.plans;
  }

  /**
   * Get current user's subscription
   */
  async getSubscription(): Promise<UserSubscription | null> {
    const response = await api.get('/api/billing/subscription');
    return response.data.subscription;
  }

  /**
   * Get detailed subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const response = await api.get('/api/billing/status');
    return response.data;
  }

  /**
   * Subscribe to a plan
   */
  async subscribe(planId: number, callbackUrl?: string): Promise<SubscribeResponse> {
    const response = await api.post('/api/billing/subscribe', {
      plan_id: planId,
      callback_url: callbackUrl || `${window.location.origin}/billing/callback`
    });
    return response.data;
  }

  /**
   * Upgrade/change subscription plan
   */
  async upgradeSubscription(planId: number, callbackUrl?: string): Promise<SubscribeResponse> {
    const response = await api.post('/api/billing/upgrade', {
      plan_id: planId,
      callback_url: callbackUrl || `${window.location.origin}/billing/callback`
    });
    return response.data;
  }

  /**
   * Verify payment after successful transaction
   */
  async verifyPayment(reference: string): Promise<{ success: boolean; subscription?: UserSubscription; message?: string }> {
    const response = await api.post('/api/billing/verify-payment', {
      reference
    });
    return response.data;
  }

  /**
   * Cancel current subscription
   */
  async cancelSubscription(): Promise<{ success: boolean; message?: string }> {
    const response = await api.post('/api/billing/cancel');
    return response.data;
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
    const response = await api.get('/api/billing/transactions', {
      params: { page, per_page: perPage }
    });
    return response.data;
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
        custom_tutors: false,
        team_management: false,
        api_access: false,
        unlimited_storage: false
      };
      return freeLimits[feature] ?? false;
    }

    const limits = subscription.plan.limits;
    const value = limits[feature];
    
    // For boolean features, return the boolean value
    if (typeof value === 'boolean') {
      return value;
    }
    
    // For numeric features, return true if limit is greater than 0
    if (typeof value === 'number') {
      return value > 0;
    }
    
    // Default to false for unknown features
    return false;
  }

  /**
   * Get usage limit for a feature
   */
  getFeatureLimit(feature: string, subscription: UserSubscription | null): number | boolean {
    if (!subscription || !subscription.is_active) {
      // Free tier limits
      const freeLimits = {
        tutors: 3,
        study_groups: 2,
        sessions_per_month: 3,
        storage_gb: 1,
        analytics: false,
        priority_support: false,
        custom_tutors: false,
        team_management: false,
        api_access: false,
        unlimited_storage: false
      };
      return freeLimits[feature as keyof typeof freeLimits] ?? 0;
    }

    const limits = subscription.plan.limits;
    return limits[feature] ?? 0;
  }

  /**
   * Check if user can perform an action based on limits
   */
  canPerformAction(action: string, currentUsage: number, subscription: UserSubscription | null): boolean {
    const limit = this.getFeatureLimit(action, subscription);

    if (typeof limit === 'boolean') {
      return limit;
    }

    // For numeric limits, check if current usage is below limit
    // -1 means unlimited
    const numericLimit = limit as number;
    if (numericLimit === -1) {
      return true; // Unlimited
    }

    return currentUsage < numericLimit;
  }

  /**
   * Format price for display
   */
  formatPrice(priceKobo: number): string {
    return `₦${(priceKobo / 100).toLocaleString()}`;
  }

  /**
   * Get plan by ID
   */
  async getPlan(planId: number): Promise<SubscriptionPlan | null> {
    const plans = await this.getPlans();
    return plans.find(plan => plan.id === planId) || null;
  }

  /**
   * Get plan recommendation based on usage
   */
  getRecommendedPlan(plans: SubscriptionPlan[], usage: any): SubscriptionPlan | null {
    // Simple recommendation logic
    if (usage.tutors_used > 3 || usage.sessions_this_month > 10) {
      return plans.find(plan => plan.name === 'Pro') || null;
    }
    
    return plans.find(plan => plan.name === 'Free') || null;
  }

  /**
   * Get Paystack configuration
   */
  async getPaystackConfig(): Promise<{ public_key: string; currency: string }> {
    const response = await api.get('/api/billing/paystack-config');
    return response.data;
  }

  /**
   * Initialize Paystack payment (client-side)
   */
  async initializePaystackPayment(config: {
    email: string;
    amount: number;
    ref: string;
    access_code?: string;
    onSuccess: (response: any) => void;
    onCancel: () => void;
  }): Promise<void> {
    try {
      // Get Paystack configuration
      const paystackConfig = await this.getPaystackConfig();
      
      // Load Paystack Inline JS if not already loaded
      if (!window.PaystackPop) {
        await this.loadPaystackScript();
      }
      
      // Validate required parameters
      if (!paystackConfig.public_key) {
        throw new Error('Paystack public key is not configured');
      }
      if (!config.email) {
        throw new Error('Email is required for payment');
      }
      // Amount validation only required for client-side initialization (no access_code)
      if (!config.access_code && (!config.amount || config.amount <= 0)) {
        throw new Error('Valid amount is required for payment');
      }

      // Debug: Log the configuration being sent to Paystack
      const paystackSetupConfig: any = {
        key: paystackConfig.public_key,
        email: config.email,
        ref: config.ref
      };
      
      // Always include amount and currency
      paystackSetupConfig.amount = config.amount;
      paystackSetupConfig.currency = 'NGN';
      
      // Add access_code if provided (server-initialized transaction)
      if (config.access_code) {
        paystackSetupConfig.access_code = config.access_code;
      }
      
      console.log('Paystack setup config:', paystackSetupConfig);
      
      // Validate the reference format (should be unique)
      if (!config.ref || config.ref.length < 10) {
        throw new Error('Invalid payment reference - must be at least 10 characters');
      }

      // Initialize Paystack payment; reject on immediate failure to allow fallback
      await new Promise<void>((resolve, reject) => {
        const openedAt = Date.now();
        let succeeded = false;
        const handler = window.PaystackPop.setup({
          ...paystackSetupConfig,
          callback: function(response: any) {
            console.log('Paystack payment successful:', response);
            try {
              if (config.onSuccess) {
                config.onSuccess(response);
              }
            } finally {
              succeeded = true;
              resolve();
            }
          },
          onClose: function() {
            console.log('Paystack inline closed');
            try {
              if (config.onCancel) {
                config.onCancel();
              }
            } finally {
              const elapsedMs = Date.now() - openedAt;
              // If it closes almost immediately without success, treat as inline failure
              if (!succeeded && elapsedMs < 3000) {
                reject(new Error('INLINE_FAILED'));
              } else {
                resolve();
              }
            }
          }
        });
        
        handler.openIframe();
      });
    } catch (error) {
      console.error('Error initializing Paystack payment:', error);
      throw error;
    }
  }

  /**
   * Load Paystack Inline JS script
   */
  private loadPaystackScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('paystack-script')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'paystack-script';
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Paystack script'));
      document.head.appendChild(script);
    });
  }
}

export default new BillingService(); 