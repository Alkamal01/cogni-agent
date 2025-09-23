import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../shared';
import { Clock, Plus, X, User, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface Comment {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  position: number; // Character position in document
}

interface DocumentEditorProps {
  sessionId: number;
  documentId: string;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ 
  sessionId,
  documentId 
}) => {
  const { user } = useAuth();
  const socket = useSocket();
  const { showToast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  
  // State for the document
  const [title, setTitle] = useState<string>('Untitled Document');
  const [content, setContent] = useState<string>('Start typing your collaborative document here...');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selection, setSelection] = useState<{start: number, end: number} | null>(null);
  const [collaborators, setCollaborators] = useState<{[key: string]: {name: string, cursor: number, color: string}}>({});
  const [showComments, setShowComments] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  
  // Generate a random color for each user
  const getRandomColor = () => {
    const colors = [
      'rgb(239, 68, 68)',   // red
      'rgb(16, 185, 129)',  // green
      'rgb(59, 130, 246)',  // blue
      'rgb(217, 70, 239)',  // purple
      'rgb(245, 158, 11)',  // amber
      'rgb(6, 182, 212)'    // cyan
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Socket connection for collaborative editing
  useEffect(() => {
    if (socket && sessionId && documentId) {
      // Join the document editing room
      socket.emit('join_document', { 
        session_id: sessionId, 
        document_id: documentId,
        user_id: user?.id,
        user_name: user?.name
      });
      
      // Listen for document data
      socket.on('document_data', (data: { title: string, content: string }) => {
        setTitle(data.title);
        setContent(data.content);
      });
      
      // Listen for changes from other users
      socket.on('content_update', (data: { content: string, user_id: string | number }) => {
        if (data.user_id !== user?.id) {
          setContent(data.content);
        }
      });
      
      // Listen for title changes
      socket.on('title_update', (data: { title: string, user_id: string | number }) => {
        if (data.user_id !== user?.id) {
          setTitle(data.title);
        }
      });
      
      // Listen for cursor position updates
      socket.on('cursor_position', (data: {
        user_id: string,
        cursor: number
      }) => {
        if (data.user_id === user?.id?.toString()) return;
        
        setCollaborators(prev => {
          // If this is a new collaborator, assign them a color
          if (!prev[data.user_id]) {
            return {
              ...prev,
              [data.user_id]: {
                name: user?.name || 'Anonymous',
                cursor: data.cursor,
                color: getRandomColor()
              }
            };
          }
          
          // Otherwise just update cursor position
          return {
            ...prev,
            [data.user_id]: {
              ...prev[data.user_id],
              cursor: data.cursor
            }
          };
        });
      });
      
      // Listen for comments
      socket.on('comment_added', (comment: Comment) => {
        setComments(prev => [...prev, comment]);
      });
      
      // Listen for user left
      socket.on('user_left_document', (userId: string) => {
        setCollaborators(prev => {
          const newCollaborators = {...prev};
          delete newCollaborators[userId];
          return newCollaborators;
        });
      });
      
      // Request initial document data
      socket.emit('get_document', { 
        session_id: sessionId, 
        document_id: documentId 
      });
      
      // Cleanup on unmount
      return () => {
        socket.emit('leave_document', { 
          session_id: sessionId, 
          document_id: documentId,
          user_id: user?.id
        });
        socket.off('document_data');
        socket.off('content_update');
        socket.off('title_update');
        socket.off('cursor_position');
        socket.off('comment_added');
        socket.off('user_left_document');
      };
    }
  }, [socket, sessionId, documentId, user]);
  
  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsEditing(true);
    
    // Emit changes to other users
    if (socket && sessionId && documentId) {
      socket.emit('content_update', {
        session_id: sessionId,
        document_id: documentId,
        content: newContent,
        user_id: user?.id
      });
    }
  };
  
  // Handle title changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Emit title changes to other users
    if (socket && sessionId && documentId) {
      socket.emit('title_update', {
        session_id: sessionId,
        document_id: documentId,
        title: newTitle,
        user_id: user?.id
      });
    }
  };
  
  // Handle cursor position changes
  const handleCursorChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const cursorPosition = target.selectionStart;
    
    setSelection({
      start: target.selectionStart,
      end: target.selectionEnd
    });
    
    // Emit cursor position to other users
    if (socket && sessionId && documentId && user?.id && user?.name) {
      socket.emit('cursor_position', {
        session_id: sessionId,
        document_id: documentId,
        cursor: cursorPosition,
        user_id: user.id,
        user_name: user.name
      });
    }
  };
  
  // Add a comment at current cursor position
  const addComment = () => {
    if (!selection) return;
    
    const commentContent = prompt('Enter your comment:');
    if (!commentContent) return;
    
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      user: {
        id: user?.id.toString() || '',
        name: user?.name || 'Anonymous',
        avatar: undefined
      },
      content: commentContent,
      timestamp: new Date().toISOString(),
      position: selection.start
    };
    
    setComments(prev => [...prev, newComment]);
    
    // Emit comment to other users
    if (socket && sessionId && documentId) {
      socket.emit('add_comment', {
        session_id: sessionId,
        document_id: documentId,
        comment: newComment
      });
    }
  };
  
  // Save the document
  const saveDocument = () => {
    // In a real app, this would call an API to save the document
    showToast('success', "All changes have been saved");
    setIsEditing(false);
  };
  
  // Function to position the cursor indicators (simplified)
  const getCursorStyle = (position: number) => {
    // This is a simplified positioning that doesn't account for word wrap
    // A real implementation would need to calculate exact position based on text content
    const charWidth = 8; // approximate width of character in pixels
    const lineHeight = 24; // approximate line height in pixels
    const contentUpToPosition = content.substring(0, position);
    const lines = contentUpToPosition.split('\n');
    const line = lines.length - 1;
    const column = lines[lines.length - 1].length;
    
    return {
      left: `${column * charWidth}px`,
      top: `${line * lineHeight}px`
    };
  };
  
  return (
    <div className="flex flex-col h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Top toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center flex-1">
          <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-none outline-none w-full"
            placeholder="Document Title"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant={showComments ? "primary" : "ghost"}
            onClick={() => setShowComments(!showComments)}
            icon={<MessageSquare className="h-4 w-4" />}
          >
            Comments {comments.length > 0 && `(${comments.length})`}
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={saveDocument}
            disabled={!isEditing}
          >
            Save
          </Button>
        </div>
      </div>
      
      {/* Collaborators list */}
      {Object.keys(collaborators).length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 p-2 flex overflow-x-auto">
          <div className="text-xs text-gray-500 dark:text-gray-400 mr-2 flex items-center">
            <User className="h-3 w-3 mr-1" /> 
            Collaborators:
          </div>
          
          {Object.entries(collaborators).map(([id, data]) => (
            <div 
              key={id}
              className="flex items-center mr-3 px-2 py-1 rounded-full text-xs"
              style={{ backgroundColor: `${data.color}20`, color: data.color }}
            >
              <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: data.color }}></span>
              {data.name}
            </div>
          ))}
        </div>
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document editor */}
        <div className="flex-1 relative" ref={editorRef}>
          <textarea
            value={content}
            onChange={handleContentChange}
            onSelect={handleCursorChange}
            className="w-full h-full p-4 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 resize-none outline-none font-sans text-sm leading-relaxed"
            spellCheck="false"
          />
          
          {/* Render cursors for other users */}
          {Object.entries(collaborators).map(([id, data]) => (
            <div 
              key={id}
              className="absolute pointer-events-none"
              style={{
                ...getCursorStyle(data.cursor),
                zIndex: 10
              }}
            >
              <div 
                className="w-0.5 h-5 absolute"
                style={{ backgroundColor: data.color }}
              />
              <div 
                className="absolute top-0 left-0 transform -translate-y-full whitespace-nowrap rounded px-1 text-xs text-white"
                style={{ backgroundColor: data.color }}
              >
                {data.name}
              </div>
            </div>
          ))}
          
          {/* Comment indicators */}
          {comments.map(comment => (
            <div
              key={comment.id}
              className="absolute w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-white text-xs cursor-pointer"
              style={{
                ...getCursorStyle(comment.position),
                transform: 'translate(-50%, -50%)'
              }}
              title={`${comment.user.name}: ${comment.content}`}
              onClick={() => setShowComments(true)}
            >
              !
            </div>
          ))}
        </div>
        
        {/* Comments panel */}
        {showComments && (
          <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Comments
              </h3>
              <button 
                onClick={() => setShowComments(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-3 space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No comments yet. Select text and click "Add Comment" to start a discussion.
                </p>
              ) : (
                comments.map(comment => (
                  <div 
                    key={comment.id}
                    className="bg-gray-50 dark:bg-gray-750 p-3 rounded-lg"
                  >
                    <div className="flex items-center mb-1">
                      <span className="font-medium text-xs text-gray-900 dark:text-white mr-1">
                        {comment.user.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 dark:text-gray-200">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={addComment}
                disabled={!selection || selection.start === selection.end}
                icon={<Plus className="h-3 w-3" />}
              >
                Add Comment
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom status bar */}
      <div className="bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <div>
          {Object.keys(collaborators).length + 1} users collaborating
        </div>
        <div>
          {isEditing ? 'Edited' : 'Saved'}
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor; 