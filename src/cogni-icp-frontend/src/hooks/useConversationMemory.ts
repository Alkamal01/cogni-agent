import { useState, useCallback } from 'react';
import conversationMemoryService, { 
  ConversationContext, 
  ConversationMessage, 
  LearningProgress 
} from '../services/conversationMemoryService';

export interface UseConversationMemoryReturn {
  // State
  context: ConversationContext | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadContext: (sessionId: string) => Promise<void>;
  addMessage: (
    sessionId: string,
    tutorId: string,
    role: 'user' | 'tutor',
    content: string,
    topic?: string,
    difficulty?: 'beginner' | 'intermediate' | 'advanced',
    comprehensionScore?: number
  ) => Promise<void>;
  getConversationSummary: () => string;
  getLearningSuggestions: () => string[];
  clearMemory: (sessionId: string) => Promise<void>;
  updateTopic: (sessionId: string, topic: string) => Promise<void>;
  updateDifficulty: (sessionId: string, difficulty: 'beginner' | 'intermediate' | 'advanced') => Promise<void>;
  clearError: () => void;
}

export const useConversationMemory = (): UseConversationMemoryReturn => {
  const [context, setContext] = useState<ConversationContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContext = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedContext = await conversationMemoryService.getConversationContext(sessionId);
      setContext(loadedContext);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation context';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMessage = useCallback(async (
    sessionId: string,
    tutorId: string,
    role: 'user' | 'tutor',
    content: string,
    topic?: string,
    difficulty?: 'beginner' | 'intermediate' | 'advanced',
    comprehensionScore?: number
  ) => {
    setError(null);

    try {
      await conversationMemoryService.addMessage(
        sessionId,
        tutorId,
        role,
        content,
        topic,
        difficulty,
        comprehensionScore
      );

      // Reload context to get updated state
      await loadContext(sessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add message';
      setError(errorMessage);
    }
  }, [loadContext]);

  const getConversationSummary = useCallback((): string => {
    if (!context) return '';
    return conversationMemoryService.getConversationSummary(context);
  }, [context]);

  const getLearningSuggestions = useCallback((): string[] => {
    if (!context) return [];
    return conversationMemoryService.getLearningSuggestions(context);
  }, [context]);

  const clearMemory = useCallback(async (sessionId: string) => {
    setError(null);

    try {
      await conversationMemoryService.clearConversationMemory(sessionId);
      setContext(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear memory';
      setError(errorMessage);
    }
  }, []);

  const updateTopic = useCallback(async (sessionId: string, topic: string) => {
    if (!context) return;

    setError(null);

    try {
      const updatedContext = {
        ...context,
        currentTopic: topic,
        lastUpdated: new Date().toISOString(),
      };

      await conversationMemoryService.saveConversationContext(updatedContext);
      setContext(updatedContext);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update topic';
      setError(errorMessage);
    }
  }, [context]);

  const updateDifficulty = useCallback(async (
    sessionId: string, 
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ) => {
    if (!context) return;

    setError(null);

    try {
      const updatedContext = {
        ...context,
        difficultyLevel: difficulty,
        lastUpdated: new Date().toISOString(),
      };

      await conversationMemoryService.saveConversationContext(updatedContext);
      setContext(updatedContext);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update difficulty';
      setError(errorMessage);
    }
  }, [context]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    context,
    isLoading,
    error,

    // Actions
    loadContext,
    addMessage,
    getConversationSummary,
    getLearningSuggestions,
    clearMemory,
    updateTopic,
    updateDifficulty,
    clearError,
  };
};

export default useConversationMemory;

