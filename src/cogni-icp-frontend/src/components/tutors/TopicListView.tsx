import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  BookOpen, 
  AlertCircle, 
  ArrowRight,
  Loader2,
  MessageSquare,
  CheckCircle,
  BarChart2,
  Award,
  Star
} from 'lucide-react';
import { Button, Card, Input, Loading } from '../shared';
import { TrashIcon } from './icons';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { 
  Tutor, 
  TutorSession as TutorSessionType, 
  TutorCourse, 
  LearningProgress, 
  TutorMessage 
} from '../../services/tutorService';

interface SessionInfo {
  session: TutorSessionType;
  tutor: Tutor;
  course: TutorCourse;
  progress: LearningProgress;
  last_message: TutorMessage;
}

interface TopicSuggestion {
  topic: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  expertise_area: string;
}

interface TopicValidation {
  is_relevant: boolean;
  confidence: number;
  reasoning?: string;
  suggested_alternatives?: string[];
}

interface TopicListViewProps {
  tutor: Tutor;
  tutorSessions: SessionInfo[];
  topicListLoading: boolean;
  topicListError: string | null;
  topicSuggestions: TopicSuggestion[];
  isLoadingSuggestions: boolean;
  onStartSession: (e: React.FormEvent) => void;
  onTopicSuggestionClick: (suggestion: TopicSuggestion) => void;
  topic: string;
  setTopic: (topic: string) => void;
  isStartingSession: boolean;
  topicValidation: TopicValidation | null;
  showValidationMessage: boolean;
  isValidatingTopic: boolean;
  navigate: (path: string) => void;
  openDeleteModal: (sessionId: string) => void;
  deletingSessionId: string | null;
  isDeleting: boolean;
  deleteError: string | null;
  handleDeleteSession: (sessionId: string) => void;
  setDeletingSessionId: (sessionId: string | null) => void;
}

const TopicListView: React.FC<TopicListViewProps> = ({
  tutor,
  tutorSessions,
  topicListLoading,
  topicListError,
  topicSuggestions,
  isLoadingSuggestions,
  onStartSession,
  onTopicSuggestionClick,
  topic,
  setTopic,
  isStartingSession,
  topicValidation,
  showValidationMessage,
  isValidatingTopic,
  navigate,
  openDeleteModal,
  deletingSessionId,
  isDeleting,
  deleteError,
  handleDeleteSession,
  setDeletingSessionId
}) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <DeleteConfirmationModal
        isOpen={!!deletingSessionId}
        onClose={() => setDeletingSessionId(null)}
        onConfirm={handleDeleteSession}
        isDeleting={isDeleting}
        error={deleteError}
        sessionToDeleteId={deletingSessionId}
      />
      <div className="max-w-7xl mx-auto">
        {/* Header with Tutor Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center">
            <img
              src={tutor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random&color=fff&size=128`}
              alt={tutor.name}
              className="w-16 h-16 rounded-full mr-4"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random&color=fff&size=128`;
              }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tutor.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">{tutor.teaching_style} Tutor</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - New Session & Suggestions */}
          <div className="space-y-6">
            {/* Start New Session Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-primary-500" />
                Start a New Session
              </h2>
              <form onSubmit={onStartSession} className="space-y-4">
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    What would you like to learn about?
                  </label>
                  <input
                    type="text"
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter a topic you'd like to learn about..."
                    disabled={isStartingSession}
                  />
                  {showValidationMessage && topicValidation && (
                    <div className={`mt-2 text-sm ${topicValidation.is_relevant ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {topicValidation.reasoning}
                    </div>
                  )}
                  {isValidatingTopic && (
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Validating topic...
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isStartingSession || !topic.trim()}
                  isLoading={isStartingSession}
                >
                  Start Learning Session
                </Button>
              </form>
            </div>

            {/* Suggested Topics Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-primary-500" />
                Suggested Topics
              </h2>
              {isLoadingSuggestions ? (
                <div className="text-center py-4">
                  <Loading />
                </div>
              ) : topicSuggestions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topicSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 cursor-pointer transition-colors"
                      onClick={() => onTopicSuggestionClick(suggestion)}
                    >
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">{suggestion.topic}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{suggestion.description}</p>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full mr-2">
                          {suggestion.difficulty}
                        </span>
                        <span>{suggestion.expertise_area}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center">No suggestions available</p>
              )}
            </div>
          </div>

          {/* Right Column - Previous Sessions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary-500" />
              Previous Sessions
            </h2>
            
            {topicListLoading ? (
              <div className="text-center py-8">
                <Loading />
              </div>
            ) : topicListError ? (
              <div className="text-red-600 dark:text-red-400 text-center py-8">{topicListError}</div>
            ) : tutorSessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">No previous sessions found.</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Start a new session to begin learning!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tutorSessions.map((sessionInfo) => (
                  <div
                    key={sessionInfo.session.public_id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {sessionInfo.course.topic}
                        </h3>
                        <div className="flex flex-wrap items-center text-sm text-gray-600 dark:text-gray-400 gap-4">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(sessionInfo.session.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-1" />
                            {sessionInfo.course.difficulty_level}
                          </span>
                          <span className="flex items-center">
                            <Award className="w-4 h-4 mr-1" />
                            {sessionInfo.progress.progress_percentage}% complete
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            openDeleteModal(sessionInfo.session.public_id);
                          }}
                          className="inline-flex items-center justify-center h-8 px-3 text-sm border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete this session"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tutors/${tutor.public_id}/${sessionInfo.session.public_id}`);
                          }}
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicListView; 