import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../shared';
import { Plus, X, CheckCircle, ArrowRight, MessageSquare, BookOpen, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
}

interface CodeEditorProps {
  sessionId: number;
  files?: CodeFile[];
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  sessionId, 
  files = [] 
}) => {
  const { user } = useAuth();
  const socket = useSocket();
  const { showToast } = useToast();
  
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>(files);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('javascript');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeUsers, setActiveUsers] = useState<{[key: string]: {cursor: number, selection?: [number, number]}}>({}); 

  // Set initial active file
  useEffect(() => {
    if (files.length > 0 && !activeFileId) {
      setActiveFileId(files[0].id);
      setCurrentCode(files[0].content);
      setLanguage(files[0].language);
    }
  }, [files, activeFileId]);

  // Socket connection for collaborative editing
  useEffect(() => {
    if (socket && sessionId && activeFileId) {
      // Join the specific code editing room
      socket.emit('join_code_editor', { 
        session_id: sessionId,
        file_id: activeFileId,
        user_id: user?.id
      });
      
      // Listen for code changes from other users
      socket.on('code_update', (data: { content: string, user_id: string | number }) => {
        if (data.user_id !== user?.id) {
          setCurrentCode(data.content);
        }
      });
      
      // Listen for cursor position updates
      socket.on('cursor_position', (data: {
        file_id: string,
        user_id: string,
        cursor: number,
        selection?: [number, number]
      }) => {
        if (data.user_id !== user?.id.toString()) {
          setActiveUsers(prev => ({
            ...prev,
            [data.user_id]: {
              cursor: data.cursor,
              selection: data.selection
            }
          }));
        }
      });
      
      // Cleanup on unmount or when changing files
      return () => {
        socket.emit('leave_code_editor', { 
          session_id: sessionId,
          file_id: activeFileId,
          user_id: user?.id
        });
        socket.off('code_update');
        socket.off('cursor_position');
      };
    }
  }, [socket, sessionId, activeFileId, user]);
  
  // Handle code changes
  const handleCodeChange = (value: string) => {
    setCurrentCode(value);
    setIsEditing(true);
    
    // Emit changes to other users
    if (socket && sessionId && activeFileId) {
      socket.emit('code_update', {
        session_id: sessionId,
        file_id: activeFileId,
        content: value,
        user_id: user?.id
      });
    }
  };
  
  // Handle cursor position changes
  const handleCursorChange = (cursor: number, selection?: [number, number]) => {
    if (socket && sessionId && activeFileId && user?.id) {
      socket.emit('cursor_update', {
        session_id: sessionId,
        file_id: activeFileId,
        cursor,
        selection,
        user_id: user.id
      });
    }
  };

  // Switch between files
  const handleFileSwitch = (fileId: string) => {
    const targetFile = codeFiles.find(file => file.id === fileId);
    if (targetFile) {
      setActiveFileId(fileId);
      setCurrentCode(targetFile.content);
      setLanguage(targetFile.language);
      setIsEditing(false);
    }
  };
  
  // Save current file
  const saveFile = () => {
    setCodeFiles(prev => 
      prev.map(file => 
        file.id === activeFileId 
          ? { ...file, content: currentCode } 
          : file
      )
    );
    setIsEditing(false);
    
    showToast('success', "File saved successfully");
  };
  
  // Download the current file
  const downloadFile = () => {
    const currentFile = codeFiles.find(file => file.id === activeFileId);
    if (!currentFile) return;
    
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('success', `File ${currentFile.name} downloaded`);
  };
  
  // Create a new file
  const createNewFile = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newFile: CodeFile = {
      id: newId,
      name: `file${codeFiles.length + 1}.js`,
      language: 'javascript',
      content: '// New file'
    };
    
    setCodeFiles(prev => [...prev, newFile]);
    setActiveFileId(newId);
    setCurrentCode(newFile.content);
    setLanguage(newFile.language);
    setIsEditing(false);
  };
  
  // Delete the current file
  const deleteFile = () => {
    if (codeFiles.length <= 1) {
      showToast('error', "Cannot delete the only file");
      return;
    }
    
    const newFiles = codeFiles.filter(file => file.id !== activeFileId);
    setCodeFiles(newFiles);
    setActiveFileId(newFiles[0].id);
    setCurrentCode(newFiles[0].content);
    setLanguage(newFiles[0].language);
    setIsEditing(false);
    
    showToast('success', "File deleted successfully");
  };

  // Rename the current file
  const renameFile = () => {
    const currentFile = codeFiles.find(file => file.id === activeFileId);
    if (!currentFile) return;
    
    const newName = prompt("Enter new file name", currentFile.name);
    if (!newName) return;
    
    setCodeFiles(prev => 
      prev.map(file => 
        file.id === activeFileId 
          ? { ...file, name: newName } 
          : file
      )
    );
    
    showToast('success', `File renamed to ${newName}`);
  };
  
  // Detect language from filename extension
  const detectLanguage = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'jsx': return 'javascript';
      case 'tsx': return 'typescript';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'c': return 'c';
      case 'cpp': return 'cpp';
      case 'cs': return 'csharp';
      case 'go': return 'go';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'javascript';
    }
  };
  
  // Get syntax highlighting class based on language
  const getHighlightClass = (language: string): string => {
    return `language-${language}`;
  };

  // Get active file
  const activeFile = codeFiles.find(file => file.id === activeFileId);
  
  return (
    <div className="flex flex-col h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Top toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center">
          <BookOpen className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">
            Collaborative Code Editor
          </h2>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={saveFile}
            disabled={!isEditing}
            icon={<CheckCircle className="h-4 w-4" />}
          >
            Save
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={downloadFile}
            icon={<ArrowRight className="h-4 w-4" />}
          >
            Download
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={createNewFile}
            icon={<Plus className="h-4 w-4" />}
          >
            New
          </Button>
        </div>
      </div>
      
      {/* File tabs */}
      <div className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 overflow-x-auto whitespace-nowrap p-1 px-2 flex">
        {codeFiles.map((file) => (
          <button
            key={file.id}
            onClick={() => handleFileSwitch(file.id)}
            className={`mr-2 rounded-md px-3 py-1.5 text-xs font-medium inline-flex items-center ${
              activeFileId === file.id 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-white hover:dark:bg-gray-700'
            }`}
          >
            {file.name}
            {activeFileId === file.id && codeFiles.length > 1 && (
              <span 
                className="ml-2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFile();
                }}
              >
                <X className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Editor area */}
      <div className="flex-1 overflow-auto relative bg-white dark:bg-gray-800">
        <pre className={`h-full m-0 p-4 text-sm font-mono overflow-auto ${getHighlightClass(language)}`}>
          {/* This is a simplified version without an actual code editor */}
          <textarea
            value={currentCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            onSelect={(e) => {
              const target = e.target as HTMLTextAreaElement;
              handleCursorChange(
                target.selectionStart,
                target.selectionStart !== target.selectionEnd 
                  ? [target.selectionStart, target.selectionEnd]
                  : undefined
              );
            }}
            className="w-full h-full bg-transparent text-gray-800 dark:text-gray-200 outline-none resize-none font-mono"
            spellCheck="false"
          />
        </pre>
        
        {/* Show cursors from other users - simplified */}
        {Object.entries(activeUsers).map(([userId, data]) => (
          <motion.div
            key={userId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute w-0.5 h-5 bg-red-500"
            style={{
              // This is a simplified positioning that doesn't account for line breaks
              // Real implementation would need to calculate exact position based on text content
              left: `${(data.cursor % 80) * 8}px`,
              top: `${Math.floor(data.cursor / 80) * 20}px`
            }}
          />
        ))}
      </div>
      
      {/* Bottom status bar */}
      <div className="bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <div>
          {activeFile?.name} ({language})
        </div>
        <div>
          {isEditing ? 'Edited' : 'Saved'} • {Object.keys(activeUsers).length + 1} users editing
        </div>
      </div>
    </div>
  );
};

export default CodeEditor; 