import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { learningAnalyticsService, LearningDashboard as LearningDashboardType, ProgressInsights } from '../../services/learningAnalyticsService';
import { useToast } from '../../hooks/useToast';
import Card from '../shared/Card';
import Button from '../shared/Button';

interface LearningDashboardProps {
  sessionId: string;
  onClose?: () => void;
}

const LearningDashboard: React.FC<LearningDashboardProps> = ({ sessionId, onClose }) => {
  const { backendActor } = useAuth();
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<LearningDashboardType | null>(null);
  const [insights, setInsights] = useState<ProgressInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [sessionId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboardData = await learningAnalyticsService.getLearningDashboard(sessionId, backendActor);
      setDashboard(dashboardData);
      
      const insightsData = learningAnalyticsService.generateInsights(dashboardData);
      setInsights(insightsData);
    } catch (err) {
      console.error('Error loading learning dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      toast({ title: 'Error', description: 'Failed to load learning analytics', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getEngagementColor = (level: string): string => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDifficultyTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'simplify': return '📉';
      case 'deepen': return '📈';
      case 'maintain': return '➡️';
      default: return '➡️';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold">Error Loading Dashboard</h3>
            <p className="text-gray-600">{error}</p>
          </div>
          <Button onClick={loadDashboard} variant="primary">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (!dashboard || !insights) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center">
          <p className="text-gray-600">No learning data available for this session.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Learning Analytics</h2>
        <div className="flex space-x-2">
          <Button onClick={loadDashboard} variant="secondary" size="sm">
            Refresh
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="secondary" size="sm">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {dashboard.progress.progress_percentage.toFixed(1)}%
              </p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Time Spent</p>
              <p className="text-2xl font-bold text-green-600">
                {formatTime(dashboard.totalTimeSpent)}
              </p>
            </div>
            <div className="text-2xl">⏱️</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Messages</p>
              <p className="text-2xl font-bold text-purple-600">
                {dashboard.messagesSent}
              </p>
            </div>
            <div className="text-2xl">💬</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Comprehension</p>
              <p className="text-2xl font-bold text-orange-600">
                {(dashboard.averageComprehension * 100).toFixed(0)}%
              </p>
            </div>
            <div className="text-2xl">🧠</div>
          </div>
        </Card>
      </div>

      {/* Learning Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        {insights.strengths.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
              <span className="mr-2">✅</span>
              Your Strengths
            </h3>
            <ul className="space-y-2">
              {insights.strengths.map((strength, index) => (
                <li key={index} className="text-gray-700 flex items-start">
                  <span className="mr-2 text-green-500">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Areas for Improvement */}
        {insights.areasForImprovement.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-orange-700 mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {insights.areasForImprovement.map((area, index) => (
                <li key={index} className="text-gray-700 flex items-start">
                  <span className="mr-2 text-orange-500">•</span>
                  {area}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {insights.recommendedActions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
            <span className="mr-2">💡</span>
            Recommended Actions
          </h3>
          <ul className="space-y-2">
            {insights.recommendedActions.map((action, index) => (
              <li key={index} className="text-gray-700 flex items-start">
                <span className="mr-2 text-blue-500">•</span>
                {action}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Learning Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Engagement Level</p>
            <p className={`text-lg font-semibold ${getEngagementColor(insights.engagementLevel)}`}>
              {insights.engagementLevel.charAt(0).toUpperCase() + insights.engagementLevel.slice(1)}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Learning Velocity</p>
            <p className="text-lg font-semibold text-indigo-600">
              {insights.learningVelocity.toFixed(1)} modules/hour
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Difficulty Trend</p>
            <p className="text-lg font-semibold text-gray-600 flex items-center justify-center">
              <span className="mr-1">{getDifficultyTrendIcon(dashboard.difficultyTrend)}</span>
              {dashboard.difficultyTrend.charAt(0).toUpperCase() + dashboard.difficultyTrend.slice(1)}
            </p>
          </div>
        </Card>
      </div>

      {/* Module Completions */}
      {dashboard.completions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Progress</h3>
          <div className="space-y-2">
            {dashboard.completions.map((completion) => (
              <div key={completion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className={`w-4 h-4 rounded-full mr-3 ${
                    completion.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}></span>
                  <span className="text-gray-700">Module {completion.module_id}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {completion.completed ? (
                    <span className="text-green-600">Completed</span>
                  ) : (
                    <span className="text-gray-500">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default LearningDashboard;
