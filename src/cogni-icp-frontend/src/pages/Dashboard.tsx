import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, Button } from '../components/shared';
import {
  BookOpen,
  Users,
  Clock,
  Award,
  TrendingUp,
  Plus,
  Sparkles,
  GraduationCap,
  Star,
  ArrowRight,
  Home,
  Trash
} from 'lucide-react';
import TutorFormModal, { TutorFormData } from '../components/tutors/TutorFormModal';
import tutorService, { Tutor } from '../services/tutorService';
import dashboardService, { DashboardStats, Activity } from '../services/dashboardService';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 10
    }
  }
};



const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isClearingActivities, setIsClearingActivities] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Cache and debouncing refs
  const hasFetchedData = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  // Optimized data fetching with caching
  const fetchAllData = useCallback(async (forceRefresh = false) => {
    // Skip if already fetched data and not forcing refresh
    if (hasFetchedData.current && !forceRefresh) {
      return;
    }

    // Skip if already fetching (unless forced)
    if (isFetchingRef.current && !forceRefresh) {
      return;
    }

    isFetchingRef.current = true;
    setIsDashboardLoading(true);
    setIsLoading(true);

    try {
      // Fetch all data in parallel
      const [stats, recentActivities, tutorsData] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getRecentActivities(5), // Limit to 5 activities for dashboard
        tutorService.getAllTutors()
      ]);

      setDashboardStats(stats);
      setActivities(recentActivities);
      setTutors(tutorsData);
      
      // Mark as fetched
      hasFetchedData.current = true;
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('error', 'Failed to load some data. Please refresh the page.');
    } finally {
      setIsDashboardLoading(false);
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [showToast]);

  const handleClearActivities = async () => {
    try {
      setIsClearingActivities(true);
      await dashboardService.clearActivities();
      setActivities([]);
      showToast('success', 'Activities cleared successfully');
    } catch (error) {
      console.error('Error clearing activities:', error);
      showToast('error', 'Failed to clear activities');
    } finally {
      setIsClearingActivities(false);
    }
  };

  // Debounced effect to fetch data
  useEffect(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Set a new timeout to debounce the API call
    fetchTimeoutRef.current = setTimeout(() => {
      fetchAllData();
    }, 100); // 100ms debounce

    // Cleanup
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchAllData]);

  // Navigate with debounce to prevent multiple rapid navigations
  const navigateToTutorSession = (tutorPublicId: string) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    navigate(`/tutors/${tutorPublicId}`);
    
    // Reset after navigation (or after a timeout in case navigation fails)
    setTimeout(() => {
      setIsNavigating(false);
    }, 1000);
  };

  // Enhanced modal open function
  const openTutorModal = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    console.log("Opening tutor creation modal from Dashboard");
    setIsModalOpen(true);
  }, []);

  const handleCreateTutor = async (data: TutorFormData) => {
    try {
      setIsLoading(true);
      const createdTutor = await tutorService.createTutor(data);
      setTutors(prev => [...prev, createdTutor]);
      setIsModalOpen(false);
      showToast('success', `Tutor "${createdTutor.name}" created successfully`);
      // Navigate to the tutor session page using the correct path
      navigateToTutorSession(createdTutor.public_id);
    } catch (error) {
      console.error('Error creating tutor:', error);
      showToast('error', 'Failed to create tutor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare stats for display based on real data or show loading state
  const statsData = dashboardStats ? [
    { 
      label: 'Study Hours', 
      value: dashboardStats.studyHours.toString(), 
      icon: Clock, 
      trend: dashboardStats.weeklyChange.studyHours, 
      color: 'text-blue-600', 
      bgGradient: 'from-blue-400 to-blue-600' 
    },
    { 
      label: 'Active Groups', 
      value: dashboardStats.activeGroups.toString(), 
      icon: Users, 
      trend: dashboardStats.weeklyChange.activeGroups, 
      color: 'text-purple-600', 
      bgGradient: 'from-purple-400 to-purple-600' 
    },
    { 
      label: 'Completed Topics', 
      value: dashboardStats.completedTopics.toString(), 
      icon: BookOpen, 
      trend: dashboardStats.weeklyChange.completedTopics, 
      color: 'text-primary-600', 
      bgGradient: 'from-primary-400 to-primary-600' 
    },
    { 
      label: 'Achievements', 
      value: dashboardStats.achievements.toString(), 
      icon: Award, 
      trend: dashboardStats.weeklyChange.achievements, 
      color: 'text-yellow-600', 
      bgGradient: 'from-yellow-400 to-yellow-600' 
    },
  ] : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <TutorFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateTutor} 
      />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's an overview of your learning journey.</p>
        </div>
        <div className="relative z-0">
          <Button
            variant="gradient" 
            onClick={openTutorModal}
            className="mt-4 md:mt-0 relative z-10"
          >
            <span className="flex items-center justify-center">
              <Plus className="w-4 h-4 mr-2" />
              Create New Tutor
            </span>
          </Button>
        </div>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Welcome Section with Gradient Background */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-900/30 dark:to-purple-900/30 p-8 rounded-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.first_name || 'Learner'}!
              </h1>
              <p className="text-gray-600 dark:text-blue-200 mt-2 text-lg">
                Here's what's happening with your learning journey
              </p>
            </div>
          </div>
        </motion.div>

      {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isDashboardLoading ? (
            // Loading skeletons for stats
            Array(4).fill(0).map((_, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
              >
                <motion.div 
                  className="p-6 dark:bg-blue-950 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="animate-pulse">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-full mb-3"></div>
                    <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="mt-4 h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                </motion.div>
              </motion.div>
            ))
          ) : (
            // Real stats
            statsData.map((stat, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <motion.div 
                  className="p-6 dark:bg-blue-950 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br from-white/5 to-white/10 -mt-10 -mr-10"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-blue-200">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full bg-gradient-to-br ${stat.bgGradient} text-white shadow-lg`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 dark:text-green-400 mr-1" />
                    <span className="text-green-500 dark:text-green-400 font-medium">{stat.trend}</span>
                    <span className="text-gray-600 dark:text-blue-200 ml-1">vs last week</span>
                  </div>
                </motion.div>
              </motion.div>
            ))
          )}
        </div>

      {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Your Tutors Section */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Home className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
                Your Custom Tutors
              </h2>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => navigate('/tutors')}
                  className="text-primary-600 dark:text-primary-400 text-sm font-medium flex items-center hover:underline"
                >
                  See All Tutors
                </button>
                
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading ? (
                <div className="col-span-2 py-16 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
                </div>
              ) : tutors.length === 0 ? (
                <div className="col-span-2 py-16 text-center">
                  <p className="text-gray-500 dark:text-gray-400">You haven't created any tutors yet. Click "Add New" to get started.</p>
                </div>
              ) : (
                // Sort tutors to show pinned ones first, then limit to 4
                tutors
                  .sort((a, b) => {
                    // Pinned tutors first
                    if (a.is_pinned && !b.is_pinned) return -1;
                    if (!a.is_pinned && b.is_pinned) return 1;
                    // Then by most recently updated
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                  })
                  .slice(0, 4)
                  .map((tutor) => (
                  <motion.div
                    key={tutor.public_id}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Card 
                      className={`p-6 hover:border-primary-500 transition-all duration-300 dark:bg-blue-950/70 shadow-lg hover:shadow-xl group ${
                        tutor.is_pinned ? 'border-l-4 border-l-yellow-400 dark:border-l-yellow-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <img
                          src={tutor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random&color=fff&size=128`}
                          alt={tutor.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-primary-500/30 shadow-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite loop
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random&color=fff&size=128`;
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {tutor.name}
                            </h3>
                            {tutor.is_pinned && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" title="Pinned Tutor" />
                            )}
                          </div>
                          <div className="flex items-center mt-2">
                            <GraduationCap className="w-4 h-4 text-primary-500 dark:text-primary-400 mr-1" />
                            <span className="text-sm text-gray-600 dark:text-blue-200">
                              {tutor.expertise?.join(', ') || 'General Learning'}
                            </span>
                          </div>
                          <div className="flex items-center mt-1">
                            <Sparkles className="w-4 h-4 text-yellow-500 dark:text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-600 dark:text-blue-200">
                              {tutor.teaching_style || 'Adaptive'}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600 dark:text-blue-200 line-clamp-2">
                            {tutor.description}
                          </div>
                          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigateToTutorSession(tutor.public_id)}
                              className="w-full"
                            >
                              <span className="flex items-center justify-center">
                              Start Learning
                              <ArrowRight className="w-4 h-4 ml-2" />
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Home className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
                Recent Activity
              </h2>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearActivities}
                  disabled={isClearingActivities || activities.length === 0}
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20 flex items-center"
                >
                  <Trash className="w-4 h-4 mr-1" />
                  {isClearingActivities ? 'Clearing...' : 'Clear'}
                </Button>
                
              </div>
            </div>
            
            <motion.div 
              className="p-6 dark:bg-blue-950/70 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              {isDashboardLoading ? (
                // Loading skeleton for activities
                <div className="space-y-6 animate-pulse">
                  {Array(3).fill(0).map((_, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                      <div className="flex-1">
                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-full mb-2"></div>
                        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full mb-1"></div>
                        <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-5">
                  {activities.map((activity, index) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-4"
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center
                          ${activity.type === 'session' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 
                            activity.type === 'achievement' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400' :
                            'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'}`
                        }>
                          {activity.type === 'session' && <Clock className="w-5 h-5" />}
                          {activity.type === 'achievement' && <Award className="w-5 h-5" />}
                          {activity.type === 'group' && <Users className="w-5 h-5" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-base text-gray-900 dark:text-white font-medium">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-blue-200 mt-1">
                          {activity.date}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {activity.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    No recent activities found. Start learning to see your activities here!
                  </p>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-blue-800/50">
                <Button
                  variant="outline"
                  className="w-full text-primary-600 dark:text-primary-400 border-primary-600/30 dark:border-primary-400/30 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  onClick={() => navigate('/activities')}
                >
                  <span className="flex items-center justify-center">
                    See All Activities
                  </span>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard; 