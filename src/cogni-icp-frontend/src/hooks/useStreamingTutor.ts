import { useState, useEffect, useCallback, useRef } from 'react';
import { aiSocketService, TutorMessageChunk, TutorStatus } from '../services/aiSocketService';
import type { TutorMessage } from '../services/tutorService';

export type { TutorMessage };

export const useStreamingTutor = (sessionId: string | undefined) => {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [status, setStatus] = useState<TutorStatus>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const localMessageIdsRef = useRef<Set<string>>(new Set());
  
  // This effect now ONLY saves to localStorage. It no longer reads from it.
  useEffect(() => {
    if (!sessionId || messages.length === 0) return;
    try {
      // We only save if the history has been loaded, to avoid overwriting
      // a reloaded page's localStorage with an empty array before API responds.
      if (isHistoryLoaded) {
        localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages));
      }
    } catch (error) {
      console.error('Failed to save messages to localStorage', error);
    }
  }, [messages, sessionId, isHistoryLoaded]);

  useEffect(() => {
    if (!sessionId || sessionId === 'undefined') {
      setIsConnected(false);
      return;
    }

    const connect = async () => {
      try {
        const success = await aiSocketService.connect(sessionId);
        setIsConnected(success);
        setIsError(!success);
      } catch (error) {
        setIsConnected(false);
        setIsError(true);
      }
    };

    const handleMessage = (msg: TutorMessageChunk) => {
      setStatus('responding');
      
      setMessages(prevMessages => {
        const existingMessageIndex = prevMessages.findIndex(m => m.id === msg.id && m.sender === 'tutor');
        
        if (existingMessageIndex !== -1) {
          const updatedMessages = [...prevMessages];
          updatedMessages[existingMessageIndex] = {
            ...updatedMessages[existingMessageIndex],
            content: updatedMessages[existingMessageIndex].content + (msg.content || ''),
          };
          return updatedMessages;
        } else {
          const newTutorMessage: TutorMessage = {
            id: msg.id || `tutor-${Date.now()}`,
            sender: 'tutor',
            content: msg.content || '',
            timestamp: new Date().toISOString(),
            session_id: sessionId,
          };
          return [...prevMessages, newTutorMessage];
        }
      });

      if (msg.isComplete) {
        setStatus('idle');
      }
    };

    const handleError = (error: Error) => {
      console.error('Tutor WebSocket error:', error);
      setIsError(true);
      setStatus('error');
    };

    const handleUserMessage = (userMsg: any) => {
      // Check if this is a message we sent locally (ignore broadcasts of our own messages)
      const messageKey = `${userMsg.content}_${userMsg.timestamp}`;
      if (localMessageIdsRef.current.has(messageKey)) {
        console.log('Ignoring broadcast of locally sent message');
        return;
      }

      // Add user message from other devices to the message list
      const userMessage: TutorMessage = {
        id: userMsg.id || `user-${Date.now()}`,
        sender: 'user',
        content: userMsg.content,
        timestamp: userMsg.timestamp || new Date().toISOString(),
        session_id: sessionId,
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
    };

    connect();
    aiSocketService.onMessage(handleMessage);
    aiSocketService.onUserMessage(handleUserMessage);
    aiSocketService.onError(handleError);

    return () => {
      aiSocketService.offMessage(handleMessage);
      aiSocketService.offUserMessage(handleUserMessage);
      aiSocketService.offError(handleError);
      aiSocketService.disconnect();
    };
  }, [sessionId]);

  const sendMessage = useCallback((content: string) => {
    if (!sessionId || !content.trim()) return;

    const timestamp = new Date().toISOString();
    const userMessage: TutorMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content,
      timestamp,
      session_id: sessionId,
    };
    
    // Track this message as locally sent to ignore future broadcasts
    const messageKey = `${content}_${timestamp}`;
    localMessageIdsRef.current.add(messageKey);
    
    // Clean up old message keys after 30 seconds
    setTimeout(() => {
      localMessageIdsRef.current.delete(messageKey);
    }, 30000);
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setStatus('thinking');
    aiSocketService.sendMessage(content, timestamp);
  }, [sessionId]);

  const loadInitialMessages = useCallback((initialMessages: TutorMessage[]) => {
    if (!isHistoryLoaded) {
      // If localStorage has messages, we should probably use them,
      // as they might be more up-to-date than the database.
      // Let's check localStorage here ONE TIME.
      const savedMessagesRaw = localStorage.getItem(`chat_messages_${sessionId || ''}`);
      if (savedMessagesRaw) {
        try {
          const savedMessages = JSON.parse(savedMessagesRaw);
          if (savedMessages.length >= initialMessages.length) {
            setMessages(savedMessages);
            setIsHistoryLoaded(true);
            return;
          }
        } catch (e) {
            // ignore parsing error
        }
      }

      setMessages(initialMessages);
      setIsHistoryLoaded(true);
    }
  }, [isHistoryLoaded, sessionId]);

  return {
    isConnected,
    isError,
    status,
    messages,
    sendMessage,
    loadInitialMessages,
  };
}; 