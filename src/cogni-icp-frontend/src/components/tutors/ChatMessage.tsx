import React from 'react';
import { Tutor } from '../../services/tutorService';

interface ChatMessageProps {
  author: 'user' | 'tutor';
  children: React.ReactNode;
  user?: any;
  tutor?: Tutor | null;
  hideAvatar?: boolean;
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
    // Render either the image OR the initials, but never both at the same time
    if (tutor.avatar_url) {
      return (
        <img
          src={tutor.avatar_url}
          alt={tutor.name}
          className="w-10 h-10 rounded-full object-cover bg-primary-500 text-white text-sm font-semibold"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // If the image fails, replace it with initials
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<div class=\"w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-semibold\">${getInitials(tutor.name)}</div>`;
            }
          }}
        />
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-semibold">
        {getInitials(tutor.name)}
      </div>
    );
  }

  if (user) {
    // Debug: log user object to see what properties are available
    console.log('User object in Avatar:', user);
    
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
          />
        ) : (
          getInitials(userName)
        )}
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
  hideAvatar,
}) => {
  const isUser = author === 'user';

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start ${
        isUser 
          ? 'max-w-[85%] md:max-w-[70%]' // User messages: slightly wider on mobile
          : 'max-w-[95%] md:max-w-[80%]' // Tutor messages: much wider on mobile for better readability
      }`}>
        {!hideAvatar && (
          <div className={`hidden md:flex flex-shrink-0 mt-1 ${isUser ? 'ml-3' : 'mr-3'}`}>
            <Avatar user={isUser ? user : undefined} tutor={isUser ? undefined : tutor || undefined} />
          </div>
        )}
        <div
          className={`px-3 py-2 md:px-4 md:py-2 rounded-lg ${
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