import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Star, 
  Award, 
  CheckCircle, 
  ArrowRight,
  BookOpen as BookOpenIcon,
  Users,
  BarChart2,
  Brain,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, FeatureGate, UsageLimitIndicator, PlanBadge } from '../components/shared';
import { Link, useNavigate } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useToast } from '../hooks/useToast';

interface LearningPath {
  id: number;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  modules: number;
  enrolledCount: number;
  completionRate: number;
  thumbnail: string;
  tags: string[];
  isPopular?: boolean;
  progress?: number;
  aiRecommendation?: string;
  personalizedStrength?: number;
  adaptiveLearning?: boolean;
}

// AI Features Component
const AIFeatures: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.8 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      <div className="col-span-1 md:col-span-3 mb-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Agentic AI-Powered Learning
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          How our intelligent AI transforms your educational experience
        </p>
      </div>
      
      <Card className="p-6 border-l-4 border-primary-500 hover:shadow-lg transition-all duration-300">
        <div className="flex items-start">
          <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-lg mr-4">
            <Brain className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Personalized Learning</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">
              Our AI analyzes your learning style, pace, strengths, and weaknesses to create a truly personalized experience that adapts in real-time.
            </p>
          </div>
        </div>
      </Card>
      
      <Card className="p-6 border-l-4 border-purple-500 hover:shadow-lg transition-all duration-300">
        <div className="flex items-start">
          <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-lg mr-4">
            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Predictive Insights</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">
              Using advanced pattern recognition, our AI predicts learning obstacles before you encounter them and adjusts content to ensure continuous progress.
            </p>
          </div>
        </div>
      </Card>
      
      <Card className="p-6 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300">
        <div className="flex items-start">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg mr-4">
            <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Proactive Assistance</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">
              Unlike passive AI systems, our agent actively intervenes when optimal, providing hints, resources, and motivation exactly when you need them.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const LearningPaths: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(true);
  const { checkUsageLimit, hasFeatureAccess, showUpgradePrompt } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Mock data
  const learningPaths: LearningPath[] = [
    {
      id: 1,
      title: "Introduction to Machine Learning",
      description: "Learn the fundamentals of machine learning algorithms and applications.",
      level: "Beginner",
      duration: "6 weeks",
      modules: 8,
      enrolledCount: 2453,
      completionRate: 87,
      thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8bWFjaGluZSUyMGxlYXJuaW5nfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
      tags: ["AI", "Python", "Data Science"],
      isPopular: true,
      progress: 35,
      aiRecommendation: "Highly recommended based on your interests in data analysis",
      personalizedStrength: 92,
      adaptiveLearning: true
    },
    {
      id: 2,
      title: "Advanced Data Structures",
      description: "Master complex data structures and algorithms for efficient problem solving.",
      level: "Advanced",
      duration: "8 weeks",
      modules: 12,
      enrolledCount: 1287,
      completionRate: 72,
      thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8ZGF0YSUyMHN0cnVjdHVyZXN8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60",
      tags: ["Algorithms", "Computer Science", "Java"],
      progress: 0,
      aiRecommendation: "Recommended to advance your software engineering skills",
      personalizedStrength: 85,
      adaptiveLearning: true
    },
    {
      id: 3,
      title: "Multilingual Natural Language Processing",
      description: "Explore NLP techniques for processing and understanding multiple languages.",
      level: "Intermediate",
      duration: "10 weeks",
      modules: 15,
      enrolledCount: 954,
      completionRate: 81,
      thumbnail: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8bGFuZ3VhZ2V8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60",
      tags: ["NLP", "Languages", "AI"],
      isPopular: true,
      progress: 75
    },
    {
      id: 4,
      title: "Blockchain Technology & Applications",
      description: "Understand distributed systems principles and applications in various industries.",
      level: "Intermediate",
      duration: "7 weeks",
      modules: 9,
      enrolledCount: 1652,
      completionRate: 79,
      thumbnail: "https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8YmxvY2tjaGFpbnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60",
      tags: ["Blockchain", "Cryptography", "Decentralization"],
      progress: 0
    }
  ];

  const filters = [
    { id: 'all', label: 'All Courses' },
    { id: 'inProgress', label: 'In Progress' },
    { id: 'popular', label: 'AI Recommended' },
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' }
  ];

  const filteredPaths = learningPaths.filter(path => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'inProgress') return path.progress && path.progress > 0;
    if (selectedFilter === 'popular') return path.isPopular;
    return path.level.toLowerCase() === selectedFilter.toLowerCase();
  });

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

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
      case 'Intermediate':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
      case 'Advanced':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const handleStartLearning = (pathId: number) => {
    // Check if user has access to learning paths
    if (!hasFeatureAccess('learning_paths')) {
      showUpgradePrompt('learning_paths');
      toast({
        title: 'Premium Feature',
        description: 'Learning paths are available for Pro and Enterprise subscribers.',
        variant: 'warning'
      });
      return;
    }
    
    navigate(`/learning-paths/${pathId}`);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-900/30 dark:to-purple-900/30 p-8 rounded-xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <BookOpenIcon className="mr-3 h-8 w-8 text-primary-600 dark:text-primary-400" />
              AI Learning Hub
            </h1>
            <PlanBadge />
          </div>
          <p className="mt-2 text-gray-600 dark:text-blue-200 max-w-3xl">
            Your personalized AI-powered learning center. Get intelligent course recommendations, 
            adaptive learning paths, and real-time insights tailored to your learning style and goals.
          </p>
        </div>
      </motion.div>

      {/* Agentic AI Assistant */}
      <AnimatePresence>
        {showAIAssistant && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/40 dark:to-purple-900/40 border border-primary-100 dark:border-primary-800/50 rounded-xl p-6 shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2">
              <button 
                onClick={() => setShowAIAssistant(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-purple-600 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                  Agentic AI Learning Assistant
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Smart
                  </span>
                </h3>
                
                <p className="mt-1 text-gray-600 dark:text-blue-200">
                  Based on your recent progress and learning style, I've tailored these recommendations for you:
                </p>
                
                <div className="mt-4 space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Zap className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="ml-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Your learning pace</span> indicates you excel with hands-on projects. The Machine Learning path contains 4 interactive projects matching your style.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Zap className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="ml-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Based on your calendar</span>, I've scheduled optimal study times for the NLP modules, aligning with your productivity patterns.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Zap className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="ml-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Looking at your goals</span>, the Advanced Data Structures path will help you reach your career objectives faster.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex items-center"
                  >
                    <Brain className="mr-1.5 h-4 w-4" />
                    Customize My Plan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center"
                  >
                    View AI Insights
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map(filter => (
          <Button
            key={filter.id}
            variant={selectedFilter === filter.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter(filter.id)}
            className="rounded-full"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* AI Features Section */}
      <FeatureGate feature="advanced_analytics" showUpgradePrompt={true}>
        <AIFeatures />
      </FeatureGate>

      {/* Learning Paths Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredPaths.map((path) => (
          <motion.div 
            key={path.id}
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="h-full"
          >
            <Card className="overflow-hidden h-full flex flex-col border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-blue-950/70">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={path.thumbnail} 
                  alt={path.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                {path.isPopular && (
                  <div className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Popular
                  </div>
                )}
                {path.progress && path.progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200 dark:bg-gray-700">
                    <div 
                      className="h-full bg-primary-600 dark:bg-primary-500" 
                      style={{ width: `${path.progress}%` }}
                    />
                  </div>
                )}
                
                {/* AI Match Indicator */}
                {path.personalizedStrength && path.personalizedStrength > 80 && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                    <Brain className="h-3 w-3 mr-1" />
                    {path.personalizedStrength}% Match
                  </div>
                )}
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getLevelColor(path.level)}`}>
                    {path.level}
                  </span>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    {path.duration}
                  </div>
                </div>

                <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                  {path.title}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300 flex-1">
                  {path.description}
                </p>
                
                {/* AI Recommendation */}
                {path.aiRecommendation && (
                  <div className="mt-3 p-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800/30 rounded-lg">
                    <div className="flex items-start">
                      <Brain className="h-4 w-4 text-primary-600 dark:text-primary-400 mt-0.5 mr-1.5 flex-shrink-0" />
                      <p className="text-xs text-primary-700 dark:text-primary-300">
                        <span className="font-medium">AI recommendation:</span> {path.aiRecommendation}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {path.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  
                  {/* Adaptive Learning Badge */}
                  {path.adaptiveLearning && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full flex items-center">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Adaptive
                    </span>
                  )}
                </div>
                
                <div className="mt-6 grid grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex flex-col items-center">
                    <BookOpen className="h-4 w-4 mb-1 text-primary-600 dark:text-primary-400" />
                    <span>{path.modules} Modules</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Users className="h-4 w-4 mb-1 text-primary-600 dark:text-primary-400" />
                    <span>{path.enrolledCount.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <BarChart2 className="h-4 w-4 mb-1 text-primary-600 dark:text-primary-400" />
                    <span>{path.completionRate}% Complete</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {path.progress && path.progress > 0 ? (
                    <Button
                      variant="primary"
                      fullWidth
                      iconPosition="right"
                      icon={<ArrowRight className="h-4 w-4" />}
                      onClick={() => handleStartLearning(path.id)}
                    >
                      Continue Learning
                    </Button>
                  ) : (
                    <Button
                      variant="gradient"
                      fullWidth
                      iconPosition="right"
                      icon={<ArrowRight className="h-4 w-4" />}
                      onClick={() => handleStartLearning(path.id)}
                    >
                      Start Learning
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default LearningPaths; 