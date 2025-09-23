import React, { useState, useEffect } from 'react';
import { IoClose, IoPeople, IoChatbubble, IoTime, IoCheckmark, IoPerson, IoArrowForward, IoSearch, IoFilter, IoStar, IoSparkles, IoLocationOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../shared';
import Portal from '../shared/Portal';
import { Link, useNavigate } from 'react-router-dom';
import connectionService from '../../services/connectionService';

interface ConnectionRequest {
  id: string;
  from: {
    id: string;
    name: string;
    avatar?: string;
    compatibilityScore?: number;
    skills?: string[];
    public_id: string;
  };
  to?: {
    id: string;
    name: string;
    avatar?: string;
    public_id: string;
  };
  message?: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface Connection {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    skills?: string[];
    lastActive?: string;
    status?: 'online' | 'offline' | 'away';
    public_id: string;
  };
  connectedSince: string;
  compatibilityScore?: number;
}

interface DiscoverLearner {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  learningGoals: string[];
  location?: string;
  joinedDate: string;
  compatibilityScore: number;
  recommendedReason: string;
  isOnline: boolean;
  currentCourses?: string[];
  completedCourses?: string[];
  public_id: string;
}

interface ConnectionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: ConnectionRequest[];
  sentRequests?: ConnectionRequest[];
  connections?: Connection[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  onMessage?: (userId: string) => void;
}

const ConnectionRequestModal: React.FC<ConnectionRequestModalProps> = ({
  isOpen,
  onClose,
  requests,
  sentRequests = [],
  connections = [],
  onAccept,
  onDecline,
  onCancel = () => {},
  onMessage = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'sent' | 'connections' | 'discover'>('pending');
  const [messageInput, setMessageInput] = useState('');
  const [selectedUserForMessage, setSelectedUserForMessage] = useState<string | null>(null);
  const [discoverLearners, setDiscoverLearners] = useState<DiscoverLearner[]>([]);
  const [isLoadingDiscover, setIsLoadingDiscover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForConnection, setSelectedUserForConnection] = useState<DiscoverLearner | null>(null);
  const [connectionRequestMessage, setConnectionRequestMessage] = useState('');
  const navigate = useNavigate();
  
  // Filter requests based on active tab
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const acceptedRequests = sentRequests.filter(req => req.status === 'accepted');

  const handleAccept = async (requestId: string) => {
    try {
      await onAccept(requestId);
      // Refresh the connection list
      await connectionService.getConnectionRequests();
    } catch (error) {
      console.error('Error accepting connection request:', error);
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await onDecline(requestId);
      // Refresh the connection list
      await connectionService.getConnectionRequests();
    } catch (error) {
      console.error('Error declining connection request:', error);
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      await onCancel(requestId);
      // Refresh the connection list
      await connectionService.getConnectionRequests();
    } catch (error) {
      console.error('Error cancelling connection request:', error);
    }
  };

  const handleNavigateToProfile = (publicId: string) => {
    console.log('handleNavigateToProfile called with publicId:', publicId);
    if (!publicId) {
      console.error('No public_id provided for navigation');
      return;
    }
    console.log('Navigating to profile:', publicId);
    onClose(); // Close the modal first
    navigate(`/profile/${publicId}`); // Then navigate to the profile
  };

  const handleSendMessage = (userId: string) => {
    onMessage(userId);
    setSelectedUserForMessage(null);
    setMessageInput('');
  };

  const handleStartMessageCompose = (userId: string) => {
    setSelectedUserForMessage(userId);
  };

  const handleCancelMessage = () => {
    setSelectedUserForMessage(null);
    setMessageInput('');
  };

  const loadDiscoverLearners = async () => {
    setIsLoadingDiscover(true);
    try {
      const data = await connectionService.discoverLearners({ search: searchQuery });
      setDiscoverLearners(data.learners);
    } catch (error) {
      console.error('Error loading discover learners:', error);
    } finally {
      setIsLoadingDiscover(false);
    }
  };

  const handleSendConnectionRequest = async (learner: DiscoverLearner, message?: string) => {
    try {
      await connectionService.sendConnectionRequest(learner.id, message);
      setSelectedUserForConnection(null);
      setConnectionRequestMessage('');
      // Optionally show success toast or feedback
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const handleOpenConnectionModal = (learner: DiscoverLearner) => {
    setSelectedUserForConnection(learner);
  };

  const handleCloseConnectionModal = () => {
    setSelectedUserForConnection(null);
    setConnectionRequestMessage('');
  };

  // Load discover learners when discover tab is selected
  useEffect(() => {
    if (activeTab === 'discover' && isOpen) {
      loadDiscoverLearners();
    }
  }, [activeTab, isOpen, searchQuery]);

  if (!isOpen) return null;

  // Render appropriate content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'pending':
        return (
          <>
            {pendingRequests.length > 0 ? (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                  >
                    <div className="flex items-start space-x-4">
                      <Link
                        to={`/profile/${request.from.public_id}`}
                        className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm flex-shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
                        onClick={() => handleNavigateToProfile(request.from.public_id)}
                      >
                        {request.from.avatar ? (
                          <img
                            src={request.from.avatar}
                            alt={request.from.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">
                            {request.from.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </Link>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Link
                            to={`/profile/${request.from.public_id}`}
                            className="text-base font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            onClick={() => handleNavigateToProfile(request.from.public_id)}
                          >
                            {request.from.name}
                          </Link>
                          <div className="flex items-center">
                            <IoTime className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 mr-1" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(request.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {request.from.skills && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {request.from.skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {request.message && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                              "{request.message}"
                            </p>
                          </div>
                        )}
                        
                        {request.from.compatibilityScore && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <span className="font-medium text-primary-600 dark:text-primary-400 mr-1">
                              {request.from.compatibilityScore}%
                            </span> 
                            compatibility match
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAccept(request.id)}
                            className="flex-1"
                          >
                            <IoCheckmark className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDecline(request.id)}
                            className="flex-1"
                          >
                            <IoClose className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartMessageCompose(request.from.id)}
                          >
                            <IoChatbubble className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Reply Message Form - shown only when composing a message to this user */}
                    {selectedUserForMessage === request.from.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                      >
                        <div className="mb-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Reply to {request.from.name}:
                          </label>
                          <textarea
                            className="mt-1 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-gray-800"
                            rows={2}
                            placeholder="Write your message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCancelMessage}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => handleSendMessage(request.from.id)}
                            disabled={!messageInput.trim()}
                          >
                            <IoChatbubble className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                  <IoPeople className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  No connection requests
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  You don't have any pending connection requests at the moment.
                </p>
              </div>
            )}
          </>
        );
      
      case 'sent':
        return (
          <>
            {sentRequests.length > 0 ? (
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                  >
                    <div className="flex items-start space-x-4">
                      <Link
                        to={`/profile/${request.to?.public_id}`}
                        className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm flex-shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
                        onClick={() => handleNavigateToProfile(request.to?.public_id || '')}
                      >
                        {request.to?.avatar ? (
                          <img
                            src={request.to.avatar}
                            alt={request.to.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">
                            {request.to?.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </Link>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Link
                            to={`/profile/${request.to?.public_id}`}
                            className="text-base font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            onClick={() => handleNavigateToProfile(request.to?.public_id || '')}
                          >
                            {request.to?.name}
                          </Link>
                          <div className="flex items-center">
                            <IoTime className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 mr-1" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(request.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {request.message && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                              "{request.message}"
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' && (
                            <>
                          <Button
                            variant="outline"
                            size="sm"
                                onClick={() => handleCancel(request.id)}
                            className="flex-1"
                          >
                            <IoClose className="h-4 w-4 mr-1" />
                            Cancel Request
                          </Button>
                          <div className="flex-1 text-sm text-gray-500 dark:text-gray-400 text-center">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                              Pending
                            </span>
                          </div>
                            </>
                          )}
                          {request.status === 'accepted' && (
                            <div className="flex-1 text-sm text-green-500 dark:text-green-400 text-center">
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-xs">
                                Accepted
                              </span>
                        </div>
                          )}
                          {request.status === 'declined' && (
                            <div className="flex-1 text-sm text-red-500 dark:text-red-400 text-center">
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full text-xs">
                                Declined
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                  <IoArrowForward className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  No sent requests
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  You haven't sent any connection requests yet.
                </p>
              </div>
            )}
          </>
        );
      
      case 'connections':
        return (
          <>
            {connections.length > 0 ? (
              <div className="space-y-4">
                {connections.map((connection) => (
                  <motion.div
                    key={connection.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                  >
                    <div className="flex items-start space-x-4">
                      <button
                        onClick={() => handleNavigateToProfile(connection.user.public_id)}
                        className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm flex-shrink-0 hover:opacity-90 transition-opacity cursor-pointer relative"
                      >
                        {connection.user.avatar ? (
                          <img
                            src={connection.user.avatar}
                            alt={connection.user.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">
                            {connection.user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        {connection.user.status && (
                          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${
                            connection.user.status === 'online' 
                              ? 'bg-green-500' 
                              : connection.user.status === 'away' 
                                ? 'bg-amber-500' 
                                : 'bg-gray-400'
                          }`} />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <button
                            onClick={() => handleNavigateToProfile(connection.user.public_id)}
                            className="text-base font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors group flex items-center"
                          >
                            {connection.user.name}
                            <IoArrowForward className="h-3.5 w-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Connected {new Date(connection.connectedSince).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {connection.user.skills && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {connection.user.skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {connection.compatibilityScore && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <span className="font-medium text-primary-600 dark:text-primary-400 mr-1">
                              {connection.compatibilityScore}%
                            </span> 
                            compatibility match
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartMessageCompose(connection.user.id)}
                            className="flex-1"
                          >
                            <IoChatbubble className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleNavigateToProfile(connection.user.public_id)}
                          >
                            <IoPerson className="h-4 w-4 mr-1" />
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Message Form - shown only when composing a message to this user */}
                    {selectedUserForMessage === connection.user.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                      >
                        <div className="mb-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Message to {connection.user.name}:
                          </label>
                          <textarea
                            className="mt-1 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-gray-800"
                            rows={2}
                            placeholder="Write your message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCancelMessage}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => handleSendMessage(connection.user.id)}
                            disabled={!messageInput.trim()}
                          >
                            <IoChatbubble className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                  <IoPeople className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  No connections yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  You haven't connected with anyone yet. Accept connection requests or send your own to build your network.
                </p>
              </div>
            )}
          </>
        );
      
      case 'discover':
        return (
          <>
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IoSearch className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search learners by name, skills, or interests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            {/* Learners Grid */}
            {isLoadingDiscover ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Finding great matches for you...</p>
                </div>
              </div>
            ) : discoverLearners.length > 0 ? (
              <div className="space-y-4">
                {discoverLearners.map((learner) => (
                  <motion.div
                    key={learner.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-4">
                      <Link
                        to={`/profile/${learner.public_id}`}
                        className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm flex-shrink-0 hover:opacity-90 transition-opacity cursor-pointer relative"
                        onClick={() => handleNavigateToProfile(learner.public_id)}
                      >
                        {learner.avatar ? (
                          <img
                            src={learner.avatar}
                            alt={learner.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">
                            {learner.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        {learner.isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                        )}
                      </Link>
                      
                      <div className="flex-1 min-w-0">
                        {/* AI Recommendation Badge */}
                        <div className="flex items-center mb-2">
                          <IoSparkles className="h-3 w-3 text-yellow-500 mr-1" />
                          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                            AI Recommended • {learner.compatibilityScore}% match
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-1">
                          <Link
                            to={`/profile/${learner.public_id}`}
                            className="text-base font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            onClick={() => handleNavigateToProfile(learner.public_id)}
                          >
                            {learner.name}
                          </Link>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <IoLocationOutline className="h-3 w-3 mr-1" />
                            {learner.location || 'Remote'}
                          </div>
                        </div>
                        
                        {learner.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {learner.bio}
                          </p>
                        )}

                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {learner.recommendedReason}
                          </p>
                        </div>
                        
                        {learner.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {learner.skills.slice(0, 4).map((skill, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
                              >
                                {skill}
                              </span>
                            ))}
                            {learner.skills.length > 4 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{learner.skills.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenConnectionModal(learner)}
                            className="flex-1"
                          >
                            <IoPeople className="h-4 w-4 mr-1" />
                            Connect
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartMessageCompose(learner.id)}
                          >
                            <IoChatbubble className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                  <IoSparkles className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  No learners found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  {searchQuery ? 'Try adjusting your search terms.' : 'No learners to discover at the moment.'}
                </p>
              </div>
            )}
          </>
        );
    }
  };

  return (
    <Portal>
      <AnimatePresence>
        {/* Modal backdrop overlay */}
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50"
          onClick={onClose}
          style={{ pointerEvents: 'auto', zIndex: 10000 }}
        />
        
        {/* Modal container */}
        <motion.div
          key="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 overflow-hidden flex items-center justify-center p-8" 
          style={{ pointerEvents: 'auto', zIndex: 10001 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col m-auto"
            style={{ 
              maxHeight: 'min(80vh, 700px)', 
              margin: 'auto',
              position: 'relative'
            }}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/30">
                  <IoPeople className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'pending' 
                    ? 'Connection Requests' 
                    : activeTab === 'sent' 
                      ? 'Sent Requests' 
                      : activeTab === 'connections'
                        ? 'My Connections'
                        : 'Discover Learners'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeTab === 'pending' && pendingRequests.length > 0 
                    ? `${pendingRequests.length} pending requests` 
                    : activeTab === 'sent' && sentRequests.length > 0 
                      ? `${sentRequests.length} sent requests` 
                      : activeTab === 'connections' && connections.length > 0
                        ? `${connections.length} connections`
                        : activeTab === 'discover'
                          ? 'Find and connect with learners'
                          : 'Manage your network'}
                </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <IoClose className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Tab Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'pending'
                      ? 'bg-primary-100 dark:bg-primary-800/50 text-primary-700 dark:text-primary-200'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Pending
                  {pendingRequests.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-primary-600 dark:bg-primary-500 text-white">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('sent')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'sent'
                      ? 'bg-primary-100 dark:bg-primary-800/50 text-primary-700 dark:text-primary-200'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Sent
                  {sentRequests.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-primary-600 dark:bg-primary-500 text-white">
                      {sentRequests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('connections')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'connections'
                      ? 'bg-primary-100 dark:bg-primary-800/50 text-primary-700 dark:text-primary-200'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Connections
                </button>
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'discover'
                      ? 'bg-primary-100 dark:bg-primary-800/50 text-primary-700 dark:text-primary-200'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <IoSparkles className="h-4 w-4 mr-1 inline" />
                  Discover
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-4" style={{ maxHeight: 'min(50vh, 400px)' }}>
              {renderTabContent()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>

        {/* Connection Request Modal for Discover */}
        {selectedUserForConnection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4"
            style={{ zIndex: 10002 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Connect with {selectedUserForConnection.name}
                </h3>
                <button
                  onClick={handleCloseConnectionModal}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <IoClose className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white font-medium">
                  {selectedUserForConnection.avatar ? (
                    <img
                      src={selectedUserForConnection.avatar}
                      alt={selectedUserForConnection.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    selectedUserForConnection.name.charAt(0)
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {selectedUserForConnection.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedUserForConnection.compatibilityScore}% compatibility match
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add a personal message (optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-gray-800"
                  rows={3}
                  placeholder="Hi! I'd love to connect and learn together..."
                  value={connectionRequestMessage}
                  onChange={(e) => setConnectionRequestMessage(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCloseConnectionModal}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => handleSendConnectionRequest(selectedUserForConnection, connectionRequestMessage)}
                >
                  <IoCheckmark className="h-4 w-4 mr-2" />
                  Send Request
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
};

export default ConnectionRequestModal;