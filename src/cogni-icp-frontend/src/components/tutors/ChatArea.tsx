import React, { useRef, useEffect } from 'react';
import { FaBars } from 'react-icons/fa';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '../shared';
import { SendIcon } from './icons';
import ChatMessage from './ChatMessage';
import VoiceChat from './VoiceChat';
import { MarkdownRenderer } from '../shared';
import { Tutor } from '../../services/tutorService';
import { TutorMessageChunk } from '../../services/icpChatService';

interface ChatAreaProps {
  tutor: Tutor;
  messages: TutorMessageChunk[];
  input: string;
  isSending: boolean;
  tutorStatus: string;
  isConnected: boolean;
  isError: boolean;
  isCourseSidebarOpen: boolean;
  sessionStatus: string;
  sessionId?: string;
  isVoiceChatOpen: boolean;
  onToggleSidebar: () => void;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onToggleVoiceChat: () => void;
  onCloseVoiceChat: () => void;
  user?: any;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  tutor,
  messages,
  input,
  isSending,
  tutorStatus,
  isConnected,
  isError,
  isCourseSidebarOpen,
  sessionStatus,
  sessionId,
  isVoiceChatOpen,
  onToggleSidebar,
  onInputChange,
  onSendMessage,
  onKeyPress,
  onToggleVoiceChat,
  onCloseVoiceChat,
  user
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      <div className={`flex-1 flex flex-col overflow-hidden ${isCourseSidebarOpen && 'lg:ml-0'}`}>
        {/* Chat Header */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            {/* Toggler for course sidebar on small screens */}
            <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="lg:hidden mr-2 p-2 text-gray-600 dark:text-gray-400">
              <FaBars className="w-6 h-6" />
            </Button>
            <MessageSquare className="w-5 h-5 text-primary-500 mr-2" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chat with {tutor.name}</h2>
          </div>
          
          {/* Voice Chat Toggle Button */}
          {sessionStatus === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleVoiceChat}
              className="text-primary-600 border-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:border-primary-400 dark:hover:bg-primary-900/20"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
              Voice Chat
            </Button>
          )}
        </div>
        
        {/* Overlay for mobile when course sidebar is open */}
        {isCourseSidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black opacity-50 lg:hidden"
            onClick={onToggleSidebar}
          ></div>
        )}
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
          {!isConnected && isError && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-yellow-700 dark:text-yellow-400 text-sm flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Attempting to reconnect...
            </div>
          )}
          
          {messages.map((message, index) => (
            <ChatMessage key={index} author={message.sender} user={user} tutor={tutor}>
              <MarkdownRenderer content={message.content} />
            </ChatMessage>
          ))}
          
          {tutorStatus === 'thinking' && (
            <ChatMessage author="tutor" tutor={tutor}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </ChatMessage>
          )}
        </div>
        
        {/* Message input area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex">
            <textarea
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder={
                sessionStatus !== 'active'
                  ? 'This session has ended'
                  : 'Type your message here...'
              }
              value={input}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onInputChange(e.target.value)}
              onKeyPress={onKeyPress}
              disabled={sessionStatus !== 'active' || isSending}
              rows={1}
            />
            <button
              className={`px-4 rounded-r-md flex items-center justify-center ${
                !input.trim() || sessionStatus !== 'active' || isSending
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
              onClick={onSendMessage}
              disabled={!input.trim() || sessionStatus !== 'active' || isSending}
              aria-label="Send message"
              type="button"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Voice Chat Modal */}
      {isVoiceChatOpen && tutor && sessionId && (
        <VoiceChat
          isOpen={isVoiceChatOpen}
          onClose={onCloseVoiceChat}
          onSendMessage={onSendMessage}
          tutorName={tutor?.name || ''}
          tutorId={tutor?.public_id || ''}
          sessionId={sessionId || ''}
          tutorAvatarUrl={tutor?.avatar_url || ''}
        />
      )}
    </>
  );
};

export default ChatArea; 