import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import billingService, { UserSubscription, SubscriptionStatus } from '../services/billingService';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  hasFeatureAccess: (feature: string) => boolean;
  getFeatureLimit: (feature: string) => number | boolean;
  canPerformAction: (action: string, currentUsage: number) => boolean;
  checkUsageLimit: (feature: string, currentUsage: number) => { canPerform: boolean; message?: string };
  refreshSubscription: () => Promise<void>;
  showUpgradePrompt: (feature: string) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Cache and debouncing refs
  const lastFetchedUserId = useRef<number | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  // Fetch subscription data with proper caching and debouncing
  const fetchSubscriptionData = useCallback(async (forceRefresh = false) => {
    // Skip if no user or already fetching (unless forced)
    if (!user || (isFetchingRef.current && !forceRefresh)) {
      if (!user) {
        setSubscription(null);
        setSubscriptionStatus(null);
        setLoading(false);
        lastFetchedUserId.current = null;
      }
      return;
    }

    // Skip if we already have data for this user (unless forced)
    if (!forceRefresh && lastFetchedUserId.current === user.id && subscription) {
      setLoading(false);
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);

    try {
      console.log('Fetching subscription data for user:', user.id);
      
      // Fetch subscription data first, then status if needed
      const subscriptionData = await billingService.getSubscription().catch(err => {
        console.error('Error fetching subscription:', err);
        return null;
      });
      
      console.log('Subscription data:', subscriptionData);
      
      // If no subscription exists, create a default free subscription object
      if (!subscriptionData) {
        const defaultFreeSubscription: UserSubscription = {
          id: 0,
          user_id: user.id,
          plan: {
            id: 1,
            name: 'Free',
            price_naira: 0,
            price_formatted: '₦0',
            billing_cycle: 'monthly',
            features: [
              '3 AI tutor sessions per month',
              'Basic personalized learning paths',
              'Join up to 2 study groups',
              'Basic learning analytics',
              '1GB storage',
              'Community support'
            ],
            limits: {
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
            },
            paystack_plan_code: null,
            is_active: true,
            created_at: null
          },
          status: 'active',
          start_date: null,
          end_date: null,
          next_payment_date: null,
          amount_naira: 0,
          currency: 'NGN',
          auto_renew: false,
          is_active: true,
          days_remaining: null,
          created_at: null,
          updated_at: null,
          cancelled_at: null
        };
        setSubscription(defaultFreeSubscription);
      } else {
        setSubscription(subscriptionData);
      }
      
      // Skip status for now to avoid hanging
      setSubscriptionStatus(null);
      
      // Update cache
      lastFetchedUserId.current = user.id;
    } catch (error) {
      console.error('Error in fetchSubscriptionData:', error);
      // Set default free tier access
      setSubscription(null);
      setSubscriptionStatus(null);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user]);

  // Debounced effect to fetch subscription data
  useEffect(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Set a new timeout to debounce the API call
    fetchTimeoutRef.current = setTimeout(() => {
      fetchSubscriptionData();
    }, 100); // 100ms debounce

    // Cleanup
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchSubscriptionData]);

  // Add periodic refresh to check for admin subscription changes
  useEffect(() => {
    if (!user) return;

    // Set up interval to refresh subscription data every 2 minutes
    const refreshInterval = setInterval(() => {
      console.log('Periodic subscription refresh...');
      fetchSubscriptionData(true); // Force refresh
    }, 120000); // 2 minutes

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
    };
  }, [user, fetchSubscriptionData]);

  // Refresh subscription data
  const refreshSubscription = async () => {
    await fetchSubscriptionData(true);
  };

  // Check if user has access to a specific feature
  const hasFeatureAccess = useCallback((feature: string): boolean => {
    return billingService.hasFeatureAccess(feature, subscription);
  }, [subscription]);

  // Get the limit for a specific feature
  const getFeatureLimit = useCallback((feature: string): number | boolean => {
    return billingService.getFeatureLimit(feature, subscription);
  }, [subscription]);

  // Check if user can perform an action based on current usage
  const canPerformAction = useCallback((action: string, currentUsage: number): boolean => {
    return billingService.canPerformAction(action, currentUsage, subscription);
  }, [subscription]);

  // Check usage limit with detailed response
  const checkUsageLimit = useCallback((feature: string, currentUsage: number): { canPerform: boolean; message?: string } => {
    const limit = getFeatureLimit(feature);
    const planName = subscription?.plan?.name || 'Free';
    
    if (typeof limit === 'boolean') {
      if (!limit) {
        return {
          canPerform: false,
          message: `This feature requires a ${subscription ? 'higher tier' : 'Pro'} subscription. Current plan: ${planName}`
        };
      }
      return { canPerform: true };
    }
    
    const numericLimit = limit as number;

    // Handle unlimited limits (-1)
    if (numericLimit === -1) {
      return { canPerform: true };
    }

    if (currentUsage >= numericLimit) {
      const featureDisplayName = feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      return {
        canPerform: false,
        message: `You've reached your ${featureDisplayName} limit (${numericLimit}). Upgrade to access more.`
      };
    }
    
    return { canPerform: true };
  }, [getFeatureLimit, subscription]);

  // Show upgrade prompt
  const showUpgradePrompt = useCallback((feature: string) => {
    const featureDisplayName = feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const planName = subscription?.plan?.name || 'Free';
    
    showToast(
      'warning', 
      `${featureDisplayName} requires a higher subscription plan. Current plan: ${planName}. Click here to upgrade.`
    );
    
    // Optionally navigate to billing page after a short delay
    setTimeout(() => {
      if (window.confirm('Would you like to upgrade your subscription now?')) {
        window.location.href = '/billing';
      }
    }, 2000);
  }, [subscription, showToast]);

  const value: SubscriptionContextType = {
    subscription,
    subscriptionStatus,
    loading,
    hasFeatureAccess,
    getFeatureLimit,
    canPerformAction,
    checkUsageLimit,
    refreshSubscription,
    showUpgradePrompt
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Hook to use subscription context
export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Higher-order component for feature gating
export const withFeatureAccess = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredFeature: string,
  fallbackComponent?: React.ComponentType<any>
) => {
  return (props: P) => {
    const { hasFeatureAccess, showUpgradePrompt } = useSubscription();
    
    if (!hasFeatureAccess(requiredFeature)) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent onUpgrade={() => showUpgradePrompt(requiredFeature)} />;
      }
      
      return (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Premium Feature
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            This feature requires a higher subscription plan.
          </p>
          <button
            onClick={() => showUpgradePrompt(requiredFeature)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Upgrade Now
          </button>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

export default SubscriptionContext; 