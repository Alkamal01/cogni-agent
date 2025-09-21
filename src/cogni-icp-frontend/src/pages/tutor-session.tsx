import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Loading } from '../components/shared';
import tutorService, { 
  Tutor, 
  TutorSession as TutorSessionType, 
  TutorMessage, 
  TutorCourse, 
  CourseModule, 
  LearningProgress
} from '../services/tutorService';
import { useDebounce } from '../hooks/useDebounce';
import icpChatService, { TutorMessageChunk, ProgressUpdate } from '../services/icpChatService';

// Import new components
import DeleteConfirmationModal from '../components/tutors/DeleteConfirmationModal';
import CourseSidebar from '../components/tutors/CourseSidebar';
import ChatArea from '../components/tutors/ChatArea';
import TopicListView from '../components/tutors/TopicListView';

interface SessionParams {
  sessionId?: string;
  tutorId?: string;
  [key: string]: string | undefined;
}

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

const TutorSession: React.FC = () => {
  const { id: tutorId, sessionId } = useParams<SessionParams>();
  const navigate = useNavigate();
  const { user, backendActor } = useAuth();
  const { showToast } = useToast();

  // State management
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [session, setSession] = useState<TutorSessionType | null>(null);
  const [course, setCourse] = useState<TutorCourse | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCourseSidebarOpen, setIsCourseSidebarOpen] = useState(true);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  
  // Voice chat state
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);

  // Topic list state (for when no session is active)
  const [tutorSessions, setTutorSessions] = useState<TutorSessionType[]>([]);
  const [topicListLoading, setTopicListLoading] = useState(false);
  const [topicListError, setTopicListError] = useState<string | null>(null);
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [topic, setTopic] = useState('');
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [topicValidation, setTopicValidation] = useState<TopicValidation | null>(null);
  const [showValidationMessage, setShowValidationMessage] = useState(false);
  const [isValidatingTopic, setIsValidatingTopic] = useState(false);

  // Delete modal state
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);



  const [debouncedTopic] = useDebounce(topic, 500);

  // Chat state management
  const [messages, setMessages] = useState<TutorMessageChunk[]>([]);
  const [tutorStatus, setTutorStatus] = useState<'idle' | 'thinking' | 'responding' | 'error'>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isError, setIsError] = useState(false);

  // Initialize session with optimized loading
  const initializeSession = async () => {
    if (!tutorId) return;

    try {
      setIsLoading(true);
      setError(null);
    
      // Set backend actor for chat service early
      if (backendActor) {
        icpChatService.setBackendActor(backendActor);
      }

      // Start with essential data loading in parallel
      const essentialPromises = [
        tutorService.getTutor(tutorId, backendActor)
      ];

      if (sessionId && sessionId !== 'undefined') {
        // For active sessions, load session data in parallel with tutor data
        essentialPromises.push(tutorService.getSession(sessionId, backendActor));
      }

      // Wait for essential data
      const results = await Promise.all(essentialPromises);
      const tutorData = results[0] as any;
      const sessionData = results[1] as any;
      
      if (!tutorData) {
        throw new Error(`Tutor with ID ${tutorId} not found`);
      }
      setTutor(tutorData);
      try {
        // Persist active tutor id for downstream validation endpoints
        if (tutorData?.public_id) {
          localStorage.setItem('last_active_tutor_public_id', tutorData.public_id);
        }
      } catch {}

      if (sessionId && sessionId !== 'undefined' && sessionData) {
        // Set session data immediately
        setSession(sessionData.session);
        setCourse(sessionData.course);
        setModules(sessionData.modules || []);
        setProgress(sessionData.progress);
        setMessages(sessionData.messages || []);
        
        // Connect to chat service (non-blocking)
        if (sessionData.session?.public_id) {
          setIsConnecting(true);
          icpChatService.connect(sessionData.session.public_id).then(connected => {
            setIsConnecting(false);
            if (connected) {
              setIsConnected(true);
              
              // Set up message listeners
              icpChatService.onMessage((chunk: TutorMessageChunk) => {
                setMessages(prev => [...prev, chunk]);
              });
              
              // Set up status listeners
              icpChatService.onStatus((status: 'idle' | 'thinking' | 'responding' | 'error') => {
                setTutorStatus(status);
              });
            } else {
              console.error('Failed to connect to chat service');
              setIsError(true);
            }
          }).catch(error => {
            setIsConnecting(false);
            console.error('Error connecting to chat service:', error);
            setIsError(true);
          });
        }
      } else {
        // No active session, show topic list
        // Load sessions and suggestions in parallel (non-blocking)
        Promise.all([
          fetchTutorSessions(),
          fetchTopicSuggestions(tutorId)
        ]).catch(error => {
          console.error('Error loading topic list data:', error);
        });
      }

      // Allow UI to render with essential data
      setIsLoading(false);

    } catch (err) {
      console.error('Error initializing session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
      setIsLoading(false);
    }
  };

  // Fetch tutor sessions for topic list
  const fetchTutorSessions = async () => {
    if (!tutorId) return;

    try {
      setTopicListLoading(true);
      const sessions = await tutorService.getAllSessions(backendActor);
      setTutorSessions(sessions);
    } catch (err) {
      console.error('Error fetching tutor sessions:', err);
      setTopicListError('Failed to load previous sessions');
    } finally {
      setTopicListLoading(false);
    }
  };

  // Fetch topic suggestions
  const fetchTopicSuggestions = async (tutorId: string): Promise<void> => {
    try {
      setIsLoadingSuggestions(true);
      console.log('🔍 Fetching topic suggestions for tutor:', tutorId);
      
      // Debug: Show all cached topics before fetching
      tutorService.debugCachedTopics();
      
      const suggestions = await tutorService.getSuggestedTopics(tutorId);
      console.log('✅ Received topic suggestions for tutor:', tutorId, suggestions);
      setTopicSuggestions(suggestions);
    } catch (err) {
      console.error('Error fetching topic suggestions:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Validate topic
    const validateTopic = async () => {
    if (!tutorId || !debouncedTopic || !debouncedTopic.trim()) return;

      try {
      setIsValidatingTopic(true);
      const validation = await tutorService.validateTopic(tutorId, debouncedTopic, backendActor);
        setTopicValidation(validation);
        setShowValidationMessage(true);
    } catch (err) {
      console.error('Error validating topic:', err);
      } finally {
        setIsValidatingTopic(false);
      }
    };

  // Start new session with automatic topic validation
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorId || !topic.trim()) return;

    try {
      setIsStartingSession(true);
      
      // First, validate the topic automatically
      try {
        const validation = await tutorService.validateAiTopic(tutorId, topic, backendActor);
        if (!validation.is_relevant) {
          showToast('warning', `Topic may not be suitable for this tutor. Confidence: ${(validation.confidence * 100).toFixed(0)}%`);
          if (validation.suggested_alternatives && validation.suggested_alternatives.length > 0) {
            showToast('info', `Suggested alternatives: ${validation.suggested_alternatives.join(', ')}`);
          }
          return;
        }
        showToast('success', `Topic validated! Confidence: ${(validation.confidence * 100).toFixed(0)}%`);
      } catch (validationError) {
        console.warn('Topic validation failed, proceeding anyway:', validationError);
        // Continue with session creation even if validation fails
      }
      
      const newSession = await tutorService.startSession(tutorId, topic, backendActor);
      navigate(`/tutors/${tutorId}/${newSession.public_id}`);
    } catch (err) {
      console.error('Error starting session:', err);
      showToast('error', 'Failed to start session');
    } finally {
      setIsStartingSession(false);
    }
  };

  // Handle topic suggestion click
  const handleTopicSuggestionClick = (suggestion: TopicSuggestion) => {
    setTopic(suggestion.topic);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!input.trim() || !session || isSending) return;

    try {
      setIsSending(true);
      setTutorStatus('thinking');
      
      // Send message via ICP chat service
      const success = await icpChatService.sendMessage(input.trim());
      
      if (success) {
        setInput('');
      } else {
        setTutorStatus('error');
        setIsError(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setTutorStatus('error');
      setIsError(true);
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
        handleSendMessage();
    }
  };

  // Toggle course sidebar
  const toggleCourseSidebar = () => setIsCourseSidebarOpen(!isCourseSidebarOpen);

  // Toggle voice chat
  const toggleVoiceChat = () => setIsVoiceChatOpen(true);
  const closeVoiceChat = () => setIsVoiceChatOpen(false);

  // Module functions
  const toggleModule = (moduleId: number) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const getModuleStatusIcon = (moduleStatus: string, isCurrent: boolean) => {
    // Implementation for module status icons
    return <div className="w-4 h-4 rounded-full bg-gray-300"></div>;
  };

  const completeModule = async (moduleId: number) => {
    // Implementation for completing modules
    console.log('Complete module:', moduleId);
  };

  const completeSession = async () => {
    // Implementation for completing sessions
    console.log('Complete session');
  };

  // Delete session functions
  const openDeleteModal = (sessionId: string) => {
    setDeletingSessionId(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await tutorService.deleteSession(sessionId, backendActor);
      setDeletingSessionId(null);
      await fetchTutorSessions();
      showToast('success', 'Session deleted successfully');
    } catch (err) {
      console.error('Error deleting session:', err);
      setDeleteError('Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format time utility
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Effects
  useEffect(() => {
    initializeSession();
    
    // Cleanup function
    return () => {
      icpChatService.disconnect();
    };
  }, [tutorId, sessionId]);

  useEffect(() => {
    if (debouncedTopic && debouncedTopic.length > 3) {
      validateTopic();
    }
  }, [debouncedTopic, tutorId]);

  useEffect(() => {
    // Progress updates from ICP chat service
    const handleProgress = (update: ProgressUpdate) => {
      setProgress(prev => prev ? { ...prev, progress_percentage: update.progress.progress_percentage } : null);
    };

    if (session) {
      icpChatService.onProgressUpdate(handleProgress);
    }

    return () => {
      icpChatService.offProgressUpdate(handleProgress);
    };
  }, [session]);

  // Update isSending based on tutor status
  useEffect(() => {
    if (tutorStatus === 'idle') {
      setIsSending(false);
    }
  }, [tutorStatus]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No session - show topic list
  if (!session && tutor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopicListView
        tutor={tutor}
        tutorSessions={tutorSessions}
        topicListLoading={topicListLoading}
        topicListError={topicListError}
        topicSuggestions={topicSuggestions}
        isLoadingSuggestions={isLoadingSuggestions}
        onStartSession={handleStartSession}
        onTopicSuggestionClick={handleTopicSuggestionClick}
        topic={topic}
        setTopic={setTopic}
        isStartingSession={isStartingSession}
        topicValidation={topicValidation}
        showValidationMessage={showValidationMessage}
        isValidatingTopic={isValidatingTopic}
        navigate={navigate}
        openDeleteModal={openDeleteModal}
        deletingSessionId={deletingSessionId}
        isDeleting={isDeleting}
        deleteError={deleteError}
        handleDeleteSession={handleDeleteSession}
        setDeletingSessionId={setDeletingSessionId}
      />
      </div>
    );
    }

  // Active session - show chat interface
  if (!tutor || !session || !course || !progress) {
    return (
      <div className="flex items-center justify-center h-screen">
          <Loading />
      </div>
    );
  }

    return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={!!deletingSessionId}
          onClose={() => setDeletingSessionId(null)}
          onConfirm={handleDeleteSession}
          isDeleting={isDeleting}
          error={deleteError}
          sessionToDeleteId={deletingSessionId}
        />


          {/* Course Sidebar */}
      <CourseSidebar
        tutor={tutor}
        tutorId={tutorId || ''}
        session={session}
        course={course}
        modules={modules}
        progress={progress}
        expandedModule={expandedModule}
        isCourseSidebarOpen={isCourseSidebarOpen}
        onToggleSidebar={toggleCourseSidebar}
        onToggleModule={toggleModule}
        onCompleteModule={completeModule}
        onCompleteSession={completeSession}
        onDeleteSession={openDeleteModal}
        formatTime={formatTime}
        getModuleStatusIcon={getModuleStatusIcon}
      />

      {/* Chat Area */}
      <ChatArea
        tutor={tutor}
        messages={messages}
        input={input}
        isSending={isSending}
        tutorStatus={tutorStatus}
        isConnected={isConnected}
        isConnecting={isConnecting}
        isError={!!error}
        isCourseSidebarOpen={isCourseSidebarOpen}
        sessionStatus={session.status}
        sessionId={sessionId}
        isVoiceChatOpen={isVoiceChatOpen}
        onToggleSidebar={toggleCourseSidebar}
        onInputChange={setInput}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
        onToggleVoiceChat={toggleVoiceChat}
        onCloseVoiceChat={closeVoiceChat}
        user={user}
      />

    </div>
  );
};

export default TutorSession;