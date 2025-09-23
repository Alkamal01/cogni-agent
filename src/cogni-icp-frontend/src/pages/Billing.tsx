import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Sparkles, 
  User, 
  Check, 
  CreditCard, 
  X
} from 'lucide-react';
import { Button, Card, Loading } from '../components/shared';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import billingService, { SubscriptionPlan, UserSubscription } from '../services/billingService';

// Using interfaces from billingService

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

interface PlanCardProps {
  name: string;
  icon: React.ElementType;
  price: number;
  description: string;
  features: string[];
  isCurrentPlan: boolean;
  onSubscribe: () => void;
  color: string;
  popular?: boolean;
  delay?: number;
  buttonText?: string;
}

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  icon: Icon,
  price,
  description,
  features,
  isCurrentPlan,
  onSubscribe,
  color,
  popular = false,
  delay = 0,
  buttonText
}) => (
  <motion.div
    initial={{ y: 30, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`relative flex flex-col rounded-2xl ${
      popular 
        ? 'border-primary-500 shadow-lg shadow-primary-100 dark:shadow-primary-900/20' 
        : 'border border-gray-200 dark:border-gray-700'
    } bg-white dark:bg-gray-800 p-8 h-full`}
  >
    {popular && (
      <div className="absolute -top-5 left-0 right-0 flex justify-center">
        <span className="inline-block px-4 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium">
          Most Popular
        </span>
      </div>
    )}
    
    {isCurrentPlan && (
      <div className="absolute top-4 right-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Current Plan
        </span>
      </div>
    )}
    
    <div className="flex items-center mb-6">
      <Icon className={`h-8 w-8 text-${color}-500 dark:text-${color}-400 mr-3`} />
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h3>
    </div>
    
    <p className="text-gray-600 dark:text-gray-300 mb-6">{description}</p>
    
    <div className="mb-8">
      <span className="text-4xl font-bold text-gray-900 dark:text-white">
        {name === 'Enterprise' ? 'Contact Us' : price === 0 ? 'Free' : `₦${price.toLocaleString()}`}
      </span>
      {price !== 0 && name !== 'Enterprise' && <span className="text-gray-500 dark:text-gray-400">/month</span>}
    </div>
    
    <div className="space-y-4 mb-8 flex-grow">
      {features.map((feature, index) => (
        <div key={index} className="flex items-start">
          <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
          <span className="text-gray-600 dark:text-gray-300">
            {typeof feature === 'string' ? feature : JSON.stringify(feature)}
          </span>
        </div>
      ))}
    </div>
    
    <Button
      variant={popular ? "primary" : "outline"}
      className="w-full"
      disabled={isCurrentPlan}
      onClick={onSubscribe}
      animated={true}
    >
      {buttonText || (isCurrentPlan ? 'Current Plan' : `Choose ${name}`)}
    </Button>
  </motion.div>
);

const Billing: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const { user, refreshUserData } = useAuth();
  const { showToast } = useToast();
  const { theme } = useTheme();

  const fetchData = async () => {
    try {
      const [plansData, subscriptionData] = await Promise.all([
        billingService.getPlans(),
        billingService.getSubscription()
      ]);
      setPlans(plansData);
      setSubscription(subscriptionData);
    } catch (error) {
      showToast('error', 'Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [showToast]);

  const handleRefreshSubscription = async () => {
    try {
      setLoading(true);
      // Refresh both user data and subscription data
      await Promise.all([
        refreshUserData(),
        fetchData()
      ]);
      showToast('success', 'Subscription data refreshed');
    } catch (error) {
      showToast('error', 'Failed to refresh subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    if (plan.price_naira === 0) {
      // Free plan - subscribe directly
      handleSubscribe(plan);
    } else {
      setShowPaymentModal(true);
    }
  };
  
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
  };
  
  const handleSubscribe = async (plan?: SubscriptionPlan) => {
    const planToSubscribe = plan || selectedPlan;
    if (!planToSubscribe) return;
    
    setProcessingPayment(true);
    
    try {
      let response;
      
      // Check if user has existing subscription
      if (subscription && subscription.status === 'active') {
        // Use upgrade endpoint if user already has subscription
        response = await billingService.upgradeSubscription(planToSubscribe.id);
      } else {
        // Use subscribe endpoint for new users
        response = await billingService.subscribe(planToSubscribe.id);
      }
      
      if (response.payment_url) {
        // Try Paystack Inline; fallback to redirect on failure
        try {
          await billingService.initializePaystackPayment({
          email: user?.email || '',
          amount: response.amount_kobo || planToSubscribe.price_naira * 100, // Use backend amount or convert naira to kobo
          ref: response.reference || `cogniedufy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          access_code: response.access_code,
          onSuccess: async (paystackResponse) => {
            try {
              // Verify payment on backend
              const verifyResponse = await billingService.verifyPayment(paystackResponse.reference);
              if (verifyResponse.success) {
                setSubscription(verifyResponse.subscription || null);
                showToast('success', `Successfully subscribed to ${planToSubscribe.name} plan!`);
                handleClosePaymentModal();
                refreshUserData();
                handleRefreshSubscription();
              } else {
                showToast('error', 'Payment verification failed');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              showToast('error', 'Payment verification failed');
            } finally {
              setProcessingPayment(false);
            }
          },
          onCancel: () => {
            showToast('info', 'Payment cancelled');
            setProcessingPayment(false);
          }
          });
        } catch (e) {
          console.error('Inline Paystack failed, falling back to redirect:', e);
          window.location.href = response.payment_url;
          return;
        }
      } else if (response.subscription) {
        // Free plan or successful upgrade - update subscription
        setSubscription(response.subscription);
        const action = subscription ? 'changed to' : 'subscribed to';
        showToast('success', `Successfully ${action} ${planToSubscribe.name} plan!`);
        handleClosePaymentModal();
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      
      // Handle specific error messages
      if (error.response?.data?.message) {
        showToast('error', error.response.data.message);
      } else {
        showToast('error', 'Failed to process subscription');
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;
    
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      try {
        const response = await billingService.cancelSubscription();
        if (response.success) {
          showToast('success', 'Your subscription has been canceled');
          setSubscription(prev => prev ? {...prev, status: 'cancelled'} : null);
        } else {
          showToast('error', response.message || 'Failed to cancel subscription');
        }
      } catch (error) {
        showToast('error', 'Failed to cancel subscription');
      }
    }
  };

  if (loading) {
    return <Loading />;
  }



  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
        <button
          onClick={handleRefreshSubscription}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
              {/* Current subscription summary */}
      {subscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Current Subscription</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <CreditCard className="h-6 w-6 text-gray-600 dark:text-gray-400 mt-0.5 mr-4" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
                <p className="font-medium text-gray-900 dark:text-white">{subscription.plan?.name || 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="h-6 w-6 text-gray-600 dark:text-gray-400 mt-0.5 mr-4" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{subscription.status}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Users className="h-6 w-6 text-gray-600 dark:text-gray-400 mt-0.5 mr-4" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Renewal Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {subscription.end_date 
                    ? new Date(subscription.end_date).toLocaleDateString() 
                    : 'Auto-renews monthly'}
                  </p>
              </div>
            </div>
          </div>
          
          {subscription.status === 'active' && (
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={handleCancel}
              >
                Cancel Subscription
              </Button>
            </div>
          )}
          </motion.div>
      )}

      {/* Subscription plans */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const isCurrentPlan = subscription?.plan?.name === plan.name;
            const icon = plan.name === 'Free' ? Users : plan.name === 'Pro' ? Sparkles : User;
            const color = plan.name === 'Free' ? 'blue' : plan.name === 'Pro' ? 'purple' : 'indigo';
            const popular = plan.name === 'Pro';
            
            // Determine button text based on current subscription
            let buttonText = plan.name === 'Enterprise' ? 'Contact Sales' : `Choose ${plan.name}`;
            if (isCurrentPlan) {
              buttonText = 'Current Plan';
            } else if (subscription && subscription.status === 'active') {
              // User has active subscription to different plan
              const currentPlanPrice = subscription.plan.price_naira;
              const newPlanPrice = plan.price_naira;
              if (plan.name === 'Enterprise') {
                buttonText = 'Contact Sales';
              } else if (newPlanPrice > currentPlanPrice) {
                buttonText = `Upgrade to ${plan.name}`;
              } else if (newPlanPrice < currentPlanPrice) {
                buttonText = `Downgrade to ${plan.name}`;
              } else {
                buttonText = `Switch to ${plan.name}`;
              }
            }
            
            return (
              <PlanCard
                key={plan.id}
                name={plan.name}
                icon={icon}
                price={plan.price_naira} // Price already in naira
                description={
                  plan.name === 'Free' 
                    ? "Perfect for trying out the platform's features"
                    : plan.name === 'Pro'
                    ? "For professionals who need more features and capabilities"
                    : "For organizations needing custom solutions and support"
                }
                features={Array.isArray(plan.features) ? plan.features : []}
                isCurrentPlan={isCurrentPlan}
                onSubscribe={() => handleSelectPlan(plan)}
                color={color}
                popular={popular}
                delay={0.1 + index * 0.1}
                buttonText={buttonText}
              />
            );
          })}
        </div>
        </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Complete Your Subscription</h2>
              <button 
                onClick={handleClosePaymentModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4">
                              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-lg text-gray-900 dark:text-white mb-2">Order Summary</h3>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-300">{selectedPlan.name} Plan (monthly)</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedPlan.price_naira === 0 ? 'Free' : `₦${selectedPlan.price_naira.toLocaleString()}`}
                    {selectedPlan.price_naira > 0 && <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>}
                  </span>
                </div>
                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between font-bold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-gray-900 dark:text-white">
                    {selectedPlan.price_naira === 0 ? 'Free' : `₦${selectedPlan.price_naira.toLocaleString()}`}
                    {selectedPlan.price_naira > 0 && <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span>}
                  </span>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300">
                  You will be redirected to Paystack to securely complete your payment.
                </p>
              </div>
              
              <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
                  onClick={handleClosePaymentModal}
            >
                  Cancel
            </Button>
                <Button
              variant="primary"
                  onClick={() => handleSubscribe()}
                  disabled={processingPayment}
                >
                  {processingPayment ? 'Processing...' : 'Subscribe'}
                </Button>
              </div>
            </div>
          </div>
      </div>
      )}
    </div>
  );
};

export default Billing; 