import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../shared';
import { X, Plus, Clock, MessageSquare, Users, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';

// File types and interfaces
interface SharedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploaded_by: {
    id: string;
    name: string;
  };
  created_at: string;
  url: string;
  thumbnail?: string;
}

interface Folder {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  files: SharedFile[];
}

interface FileSharingProps {
  sessionId: number;
  groupId?: number;
}

const FileSharing: React.FC<FileSharingProps> = ({ sessionId, groupId }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const { showToast } = useToast();
  
  // States
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Load files when component mounts
  useEffect(() => {
    // Mock data loading - in a real app this would come from an API
    const mockFiles: SharedFile[] = [
      {
        id: '1',
        name: 'project-requirements.pdf',
        type: 'application/pdf',
        size: 1240000,
        uploaded_by: {
          id: '1',
          name: 'John Doe'
        },
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        url: '#',
        thumbnail: 'https://via.placeholder.com/100x100.png?text=PDF'
      },
      {
        id: '2',
        name: 'data-analysis.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 850000,
        uploaded_by: {
          id: '2',
          name: 'Jane Smith'
        },
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        url: '#',
        thumbnail: 'https://via.placeholder.com/100x100.png?text=XLSX'
      },
      {
        id: '3',
        name: 'presentation.pptx',
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: 2450000,
        uploaded_by: {
          id: '1',
          name: 'John Doe'
        },
        created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
        url: '#',
        thumbnail: 'https://via.placeholder.com/100x100.png?text=PPTX'
      },
      {
        id: '4',
        name: 'team-photo.jpg',
        type: 'image/jpeg',
        size: 3240000,
        uploaded_by: {
          id: '3',
          name: 'Alice Johnson'
        },
        created_at: new Date(Date.now() - 3600000 * 100).toISOString(),
        url: '#',
        thumbnail: 'https://via.placeholder.com/100x100.png?text=JPG'
      },
      {
        id: '5',
        name: 'code-sample.py',
        type: 'text/x-python',
        size: 12400,
        uploaded_by: {
          id: '2',
          name: 'Jane Smith'
        },
        created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
        url: '#'
      }
    ];
    
    const mockFolders: Folder[] = [
      {
        id: 'folder1',
        name: 'Documentation',
        created_by: '1',
        created_at: new Date(Date.now() - 3600000 * 240).toISOString(),
        files: []
      },
      {
        id: 'folder2',
        name: 'Images',
        created_by: '2',
        created_at: new Date(Date.now() - 3600000 * 360).toISOString(),
        files: []
      },
      {
        id: 'folder3',
        name: 'Code',
        created_by: '1',
        created_at: new Date(Date.now() - 3600000 * 480).toISOString(),
        files: []
      }
    ];
    
    setFiles(mockFiles);
    setFolders(mockFolders);
    
    // In a real app, we would fetch from API
    // fetchFiles();
  }, [sessionId, groupId]);
  
  // Connect to socket for real-time updates
  useEffect(() => {
    if (socket && sessionId) {
      // Join file sharing room
      socket.emit('join_file_sharing', { session_id: sessionId });
      
      // Listen for new files
      socket.on('file_uploaded', (file: SharedFile) => {
        setFiles(prev => [...prev, file]);
        
        showToast('info', `${file.uploaded_by.name} uploaded ${file.name}`);
      });
      
      // Listen for file deletions
      socket.on('file_deleted', (fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
      });
      
      // Listen for new folders
      socket.on('folder_created', (folder: Folder) => {
        setFolders(prev => [...prev, folder]);
      });
      
      // Cleanup on unmount
      return () => {
        socket.emit('leave_file_sharing', { session_id: sessionId });
        socket.off('file_uploaded');
        socket.off('file_deleted');
        socket.off('folder_created');
      };
    }
  }, [socket, sessionId, showToast]);
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    // Start upload simulation
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    // Simulate upload completion
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      
      // Create file objects and add to state
      const uploadedFiles = files.map(file => {
        const newFile: SharedFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type.split('/')[0] || 'other',
          size: file.size,
          uploaded_by: {
            id: user?.id?.toString() || '0',
            name: user?.name || 'Anonymous'
          },
          created_at: new Date().toISOString(),
          url: URL.createObjectURL(file),
          thumbnail: file.type.includes('image') ? URL.createObjectURL(file) : undefined
        };
        return newFile;
      });
      
      // Add to state
      setFiles(prev => [...prev, ...uploadedFiles]);
      
      // Emit to others via socket
      if (socket) {
        socket.emit('upload_file', {
          session_id: sessionId,
          files: uploadedFiles
        });
      }
      
      setIsUploading(false);
      setUploadProgress(0);
      
      showToast('success', `${uploadedFiles.length} file(s) uploaded successfully`);
      
      // Reset input
      e.target.value = '';
    }, 3000);
  };
  
  // Delete a file
  const deleteFile = (fileId: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
      
      // Notify others
      if (socket) {
        socket.emit('delete_file', {
          session_id: sessionId,
          file_id: fileId
        });
      }
      
      showToast('success', 'The file has been deleted successfully');
    }
  };
  
  // Create a new folder
  const createFolder = () => {
    if (!newFolderName.trim()) {
      showToast('error', 'Please enter a folder name');
      return;
    }
    
    const newFolder: Folder = {
      id: Math.random().toString(36).substr(2, 9),
      name: newFolderName,
      created_by: user?.id?.toString() || '0',
      created_at: new Date().toISOString(),
      files: []
    };
    
    setFolders(prev => [...prev, newFolder]);
    
    // Notify others
    if (socket) {
      socket.emit('create_folder', {
        session_id: sessionId,
        folder: newFolder
      });
    }
    
    setShowNewFolderModal(false);
    setNewFolderName('');
    
    showToast('success', `Folder "${newFolderName}" created`);
  };
  
  // Format bytes to human readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Get icon based on file type
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'application':
        return <BookOpen className="h-5 w-5 text-red-500" />;
      case 'text':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'video':
        return <Clock className="h-5 w-5 text-purple-500" />;
      case 'audio':
        return <Users className="h-5 w-5 text-pink-500" />;
      case 'archive':
        return <X className="h-5 w-5 text-yellow-500" />;
      default:
        return <BookOpen className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Filter files based on search query
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get files for current view
  const displayedFiles = currentFolder 
    ? files.filter(file => file.id.startsWith(currentFolder)) // Simplified - in real app would use actual folder relationship
    : filteredFiles;
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
      {/* Header with search and actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
            File Sharing
          </h2>
          
          <div className="flex items-center space-x-2">
            <Button 
              size="sm"
              variant="outline"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              icon={<MessageSquare className="h-4 w-4" />}
            >
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </Button>
            
            <Button
              size="sm"
              onClick={() => setShowNewFolderModal(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              New Folder
            </Button>
            
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                className="sr-only"
                onChange={handleFileUpload}
                disabled={isUploading}
                multiple
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Files
              </label>
            </div>
          </div>
        </div>
        
        {/* Search bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search files..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Upload progress */}
      {isUploading && (
        <div className="p-4 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploading...</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-primary-600 h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Breadcrumb navigation */}
      {currentFolder && (
        <div className="p-4 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <button
                  onClick={() => setCurrentFolder(null)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  All Files
                </button>
              </li>
              <li className="flex items-center">
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-gray-900 dark:text-white">
                  {folders.find(f => f.id === currentFolder)?.name || 'Unknown Folder'}
                </span>
              </li>
            </ol>
          </nav>
        </div>
      )}
      
      {/* Main content area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Show folders (only at root level) */}
        {!currentFolder && folders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Folders</h3>
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'space-y-2'}>
              {folders.map(folder => (
                <div 
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id)}
                  className={
                    viewMode === 'grid'
                      ? 'p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors'
                      : 'p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors flex items-center'
                  }
                >
                  <div className={viewMode === 'grid' ? 'flex flex-col items-center' : 'flex items-center'}>
                    <BookOpen className={viewMode === 'grid' ? 'h-12 w-12 text-yellow-500 mb-2' : 'h-8 w-8 text-yellow-500 mr-3'} />
                    <div className={viewMode === 'grid' ? 'text-center' : ''}>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate" style={viewMode === 'grid' ? { maxWidth: '100px' } : {}}>
                        {folder.name}
                      </h4>
                      {viewMode === 'list' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created {new Date(folder.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Files section */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Files</h3>
          {displayedFiles.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No files found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery ? 'Try a different search term' : 'Upload files to get started'}
              </p>
              
              {!searchQuery && (
                <div className="relative inline-block">
                  <input
                    type="file"
                    id="empty-upload"
                    className="sr-only"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    multiple
                  />
                  <label
                    htmlFor="empty-upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Files
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'space-y-2'}>
              {displayedFiles.map(file => (
                <div 
                  key={file.id}
                  className={
                    viewMode === 'grid'
                      ? 'relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group'
                      : 'relative p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex items-center group'
                  }
                >
                  {/* Delete button */}
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  {viewMode === 'grid' ? (
                    <>
                      <div className="h-32 flex items-center justify-center mb-2">
                        {file.thumbnail ? (
                          <img src={file.thumbnail} alt={file.name} className="h-full object-contain" />
                        ) : (
                          getFileIcon(file.type)
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </h4>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)}
                          </span>
                          <button
                            onClick={() => window.open(file.url, '_blank')}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900 hover:bg-primary-200 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Download
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center flex-1">
                        <div className="h-12 w-12 flex items-center justify-center mr-3">
                          {file.thumbnail ? (
                            <img src={file.thumbnail} alt={file.name} className="h-full object-contain" />
                          ) : (
                            getFileIcon(file.type)
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)} • Uploaded {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(file.url, '_blank')}
                        className="ml-4 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900 hover:bg-primary-200 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Download
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* New folder modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowNewFolderModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Create New Folder
                    </h3>
                    <div className="mt-4">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Folder name"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-750 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button"
                  onClick={createFolder}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Create
                </button>
                <button 
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-650 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileSharing; 