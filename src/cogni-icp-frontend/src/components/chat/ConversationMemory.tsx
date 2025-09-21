import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  BookOpen, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  ChevronDown, 
  Plus,
  User,
  MessageSquare
} from 'lucide-react';
import { ConversationContext } from '../../services/conversationMemoryService';

interface ConversationMemoryProps {
  context: ConversationContext | null;
  onTopicChange?: (topic: string) => void;
  onDifficultyChange?: (difficulty: 'beginner' | 'intermediate' | 'advanced') => void;
}

const ConversationMemory: React.FC<ConversationMemoryProps> = ({
  context,
  onTopicChange,
  onDifficultyChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!context) return null;

  const { learningProgress, currentTopic, difficultyLevel, messages } = context;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Learning Progress
          </h3>
        </div>
        {isExpanded ? (
          <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400 rotate-45" />
        ) : (
          <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-4"
          >
            {/* Current Status */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">Current Topic:</span>
                <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                  {currentTopic || 'General discussion'}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Difficulty:</span>
                <span className="ml-2 font-medium text-blue-900 dark:text-blue-100 capitalize">
                  {difficultyLevel}
                </span>
              </div>
            </div>

            {/* Learning Style */}
            <div>
              <span className="text-blue-700 dark:text-blue-300 text-sm">Learning Style:</span>
              <span className="ml-2 font-medium text-blue-900 dark:text-blue-100 capitalize">
                {learningProgress.learningStyle}
              </span>
            </div>

            {/* Topics Covered */}
            {learningProgress.topicsCovered.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                    Topics Covered
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {learningProgress.topicsCovered.map((topic, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mastery Levels */}
            {Object.keys(learningProgress.masteryLevel).length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                    Mastery Levels
                  </span>
                </div>
                <div className="space-y-2">
                  {Object.entries(learningProgress.masteryLevel).map(([topic, mastery]) => (
                    <div key={topic} className="flex items-center justify-between">
                      <span className="text-xs text-blue-700 dark:text-blue-300">{topic}</span>
                      <div className="flex items-center">
                        <div className="w-16 h-2 bg-blue-200 dark:bg-blue-700 rounded-full mr-2">
                          <div
                            className="h-2 bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-300"
                            style={{ width: `${mastery * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-blue-700 dark:text-blue-300">
                          {Math.round(mastery * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths and Areas for Improvement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningProgress.strengths.length > 0 && (
                <div>
                  <div className="flex items-center mb-2">
                    <Target className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                    <span className="text-green-700 dark:text-green-300 text-sm font-medium">
                      Strengths
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {learningProgress.strengths.map((strength, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {learningProgress.areasForImprovement.length > 0 && (
                <div>
                  <div className="flex items-center mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2" />
                    <span className="text-orange-700 dark:text-orange-300 text-sm font-medium">
                      Areas to Improve
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {learningProgress.areasForImprovement.map((area, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Conversation Stats */}
            <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400">
                <div className="flex items-center">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  <span>{messages.length} messages</span>
                </div>
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  <span>Learning in progress</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConversationMemory;
