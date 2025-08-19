import React from 'react';
import { Tutor } from '../../services/tutorService';

interface ChatMessageProps {
  author: 'user' | 'tutor';
  children: React.ReactNode;
  user?: any;
  tutor?: Tutor | null;
}

const Avatar = ({ user, tutor }: { user?: any; tutor?: Tutor }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (tutor) {
    return (
      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-semibold">
        {tutor.avatar_url ? (
          <img
            src={tutor.avatar_url}
            alt={tutor.name}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-semibold ${tutor.avatar_url ? 'hidden' : ''}`}>
          {getInitials(tutor.name)}
        </div>
      </div>
    );
  }

  if (user) {
    // Try different possible name properties
    const userName = user.name || user.full_name || user.display_name || user.username || 
                   (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : null) ||
                   user.first_name || 'User';
    
    return (
      <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm font-semibold">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={userName}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm font-semibold ${user.avatar_url ? 'hidden' : ''}`}>
          {getInitials(userName)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-semibold">
      ?
    </div>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({
  author,
  children,
  user,
  tutor,
}) => {
  const isUser = author === 'user';

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[80%]`}>
        <div className={`flex-shrink-0 mt-1 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <Avatar user={isUser ? user : undefined} tutor={isUser ? undefined : tutor || undefined} />
        </div>
        <div
          className={`px-4 py-2 rounded-lg ${
            isUser
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 