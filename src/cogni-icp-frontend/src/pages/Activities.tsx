import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, Award, Users, Trash, RotateCcw } from 'lucide-react';
import { Button } from '../components/shared';
import { useToast } from '../hooks/useToast';
import dashboardService, { Activity } from '../services/dashboardService';

const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();
  const isLoadingRef = useRef(false);

  const fetchActivities = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      // Get all activities (no limit)
      const allActivities = await dashboardService.getRecentActivities(50);
      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({ title: 'Error', description: 'Failed to load activities', variant: 'error' });
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []); // No dependencies to prevent recreation

  const handleClearActivities = async () => {
    try {
      setIsClearing(true);
      await dashboardService.clearActivities();
      setActivities([]);
      toast({ title: 'Success', description: 'Activities cleared successfully', variant: 'success' });
    } catch (error) {
      console.error('Error clearing activities:', error);
      toast({ title: 'Error', description: 'Failed to clear activities', variant: 'error' });
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []); // Only run once on mount

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session':
        return <Clock className="w-5 h-5" />;
      case 'achievement':
        return <Award className="w-5 h-5" />;
      case 'group':
        return <Users className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'session':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400';
      case 'achievement':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400';
      case 'group':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activities</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Your complete learning activity history
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={fetchActivities}
              disabled={isLoading}
              className="flex items-center"
            >
              <RotateCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleClearActivities}
              disabled={isClearing || activities.length === 0}
              className="flex items-center text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
            >
              <Trash className="w-4 h-4 mr-2" />
              {isClearing ? 'Clearing...' : 'Clear All'}
            </Button>
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Loading activities...</p>
            </div>
          ) : activities.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {activity.date}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 mt-2">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No activities yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start learning to see your activities here!
              </p>
            </div>
          )}
        </div>

        {/* Activity Stats */}
        {activities.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {activities.filter(a => a.type === 'session').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Learning Sessions</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {activities.filter(a => a.type === 'achievement').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Achievements</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {activities.filter(a => a.type === 'group').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Group Activities</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activities;
