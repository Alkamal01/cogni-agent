import { useState, useCallback } from 'react';
import ragService, { RAGSearchResult, DocumentChunk } from '../services/ragService';

export interface UseRAGReturn {
  // State
  isProcessing: boolean;
  isSearching: boolean;
  error: string | null;
  documentStats: {
    totalChunks: number;
    totalFiles: number;
    fileNames: string[];
  } | null;

  // Actions
  processDocument: (tutorId: string, file: File) => Promise<void>;
  searchKnowledgeBase: (tutorId: string, query: string) => Promise<RAGSearchResult>;
  deleteTutorKnowledgeBase: (tutorId: string) => Promise<void>;
  refreshStats: (tutorId: string) => Promise<void>;
  clearError: () => void;
}

export const useRAG = (): UseRAGReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentStats, setDocumentStats] = useState<{
    totalChunks: number;
    totalFiles: number;
    fileNames: string[];
  } | null>(null);

  const processDocument = useCallback(async (tutorId: string, file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      await ragService.processDocument(tutorId, file);
      // Refresh stats after processing
      await refreshStats(tutorId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process document';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const searchKnowledgeBase = useCallback(async (tutorId: string, query: string): Promise<RAGSearchResult> => {
    setIsSearching(true);
    setError(null);

    try {
      const result = await ragService.searchChunks(tutorId, query);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search knowledge base';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const deleteTutorKnowledgeBase = useCallback(async (tutorId: string) => {
    setError(null);

    try {
      await ragService.deleteTutorChunks(tutorId);
      setDocumentStats(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete knowledge base';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshStats = useCallback(async (tutorId: string) => {
    try {
      const stats = await ragService.getTutorDocumentStats(tutorId);
      setDocumentStats(stats);
    } catch (err) {
      console.error('Failed to refresh document stats:', err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isProcessing,
    isSearching,
    error,
    documentStats,

    // Actions
    processDocument,
    searchKnowledgeBase,
    deleteTutorKnowledgeBase,
    refreshStats,
    clearError,
  };
};

export default useRAG;

