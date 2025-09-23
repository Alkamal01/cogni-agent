import React, { useState, useEffect } from 'react';
import { IoNotifications, IoPerson, IoSunny, IoMoon, IoPeople } from 'react-icons/io5';
import { FaBars } from 'react-icons/fa'; // Import FaBars
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import ConnectionRequestModal from '../groups/ConnectionRequestModal';
import { Link, useLocation } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import NotificationPanel from './NotificationPanel';

import connectionService, { 
  ConnectionRequest as ServiceConnectionRequest, 
  Connection as ServiceConnection 
} from '../../services/connectionService';

// Modal interfaces (matching ConnectionRequestModal interface)
interface NavbarConnectionRequest {
  id: string;
  from: {
    id: string;
    public_id: string;
    name: string;
    avatar?: string;
    compatibilityScore?: number;
    skills?: string[];
  };
  to?: {
    id: string;
    public_id: string;
    name: string;
    avatar?: string;
  };
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

interface Connection {
  id: string;
  user: {
    id: string;
    public_id: string;
    name: string;
    avatar?: string;
    skills?: string[];
    lastActive?: string;
    status?: 'online' | 'offline' | 'away';
  };
  connectedSince: string;
  compatibilityScore?: number;
}

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // const [searchText, setSearchText] = useState(''); // Removed searchText state
  
  // State for the connection requests
  const [connectionRequests, setConnectionRequests] = useState<NavbarConnectionRequest[]>([]);
  const [isConnectionRequestModalOpen, setIsConnectionRequestModalOpen] = useState(false);
  
  // State for the sent connection requests and established connections
  const [sentConnectionRequests, setSentConnectionRequests] = useState<NavbarConnectionRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  
  // Get counts of pending requests
  const pendingConnectionRequests = connectionRequests.filter((req: NavbarConnectionRequest) => req.status === 'pending').length;
  
  // State for unread notification count
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState<boolean>(false);
  
  // Add click outside handler for profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showProfileMenu && !target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);
  
  // Adapter functions to convert service interfaces to modal interfaces
  const adaptConnectionRequest = (request: any): NavbarConnectionRequest => {
    console.log('Adapting connection request:', request);
    if (!request) {
      console.error('Malformed connection request:', request);
      return {
        id: '',
        from: { id: '', public_id: '', name: '' },
        status: 'pending',
        timestamp: new Date().toISOString()
      };
    }

    // Get the sender and receiver IDs
    const senderId = request.sender_id;
    const receiverId = request.receiver_id;

    // Determine if the current user is the sender or receiver
    const isSender = senderId === user?.id;

    // For received requests, the "from" is the sender
    // For sent requests, the "to" is the receiver
    const fromUser = request.sender;
    const toUser = request.receiver;

    const adaptedRequest: any = {
      id: request.id.toString(),
      from: {
        id: fromUser?.id?.toString() || '',
        public_id: fromUser?.public_id || '',
        name: fromUser?.name || fromUser?.username || 'Unknown User',
        avatar: fromUser?.avatar_url
      },
      status: request.status || 'pending',
      timestamp: request.created_at || new Date().toISOString(),
      message: request.message
    };

    // Add "to" field for sent requests
    if (toUser) {
      adaptedRequest.to = {
        id: toUser.id?.toString() || '',
        public_id: toUser.public_id || '',
        name: toUser.name || toUser.username || 'Unknown User',
        avatar: toUser.avatar_url
      };
    }

    return adaptedRequest;
  };

  const adaptConnection = (serviceConnection: ServiceConnection): Connection => {
    console.log('Adapting connection:', serviceConnection);
    if (!serviceConnection || !serviceConnection.user) {
      console.error('Invalid connection data:', serviceConnection);
      return {
        id: '',
        user: {
          id: '',
          public_id: '',
          name: 'Unknown User',
          avatar: undefined,
          skills: [],
          lastActive: undefined,
          status: 'offline'
        },
        connectedSince: new Date().toISOString()
      };
    }

    // Ensure we have a public_id
    const public_id = serviceConnection.user.public_id || serviceConnection.user.id;
    console.log('Using public_id:', public_id);

    return {
      id: serviceConnection.id,
      user: {
        id: serviceConnection.user.id,
        public_id: public_id,
        name: serviceConnection.user.name || serviceConnection.user.username || 'Unknown User',
        avatar: serviceConnection.user.avatar,
        skills: [], // TODO: Add skills from user profile
        lastActive: serviceConnection.user.lastActive,
        status: serviceConnection.user.status
      },
      connectedSince: serviceConnection.connectedSince || serviceConnection.created_at || new Date().toISOString(),
      compatibilityScore: serviceConnection.compatibilityScore
    };
  };

  // Load connection data
  const loadConnectionData = async () => {
    try {
      console.log('Loading connection data...');
      const requests = await connectionService.getConnectionRequests();
      console.log('Connection requests:', requests);
      
      const allConnections = await connectionService.getConnections();
      console.log('All connections:', allConnections);
      
      const adaptedRequests = requests.received.map(adaptConnectionRequest);
      console.log('Adapted received requests:', adaptedRequests);
      
      const adaptedSentRequests = requests.sent.map(adaptConnectionRequest);
      console.log('Adapted sent requests:', adaptedSentRequests);
      
      const adaptedConnections = allConnections.map(adaptConnection);
      console.log('Adapted connections:', adaptedConnections);
      
      setConnectionRequests(adaptedRequests);
      setSentConnectionRequests(adaptedSentRequests);
      setConnections(adaptedConnections);
    } catch (error) {
      console.error('Error loading connection data:', error);
    }
  };

  // Handle accepting a connection request
  const handleAcceptConnectionRequest = async (requestId: string) => {
    try {
      await connectionService.acceptConnectionRequest(requestId);
      await loadConnectionData(); // Reload data after action
    } catch (error) {
      console.error('Error accepting connection request:', error);
    }
  };
  
  // Handle declining a connection request
  const handleDeclineConnectionRequest = async (requestId: string) => {
    try {
      await connectionService.declineConnectionRequest(requestId);
      await loadConnectionData(); // Reload data after action
    } catch (error) {
      console.error('Error declining connection request:', error);
    }
  };

  // Toggle connection request modal
  const toggleConnectionRequestModal = () => {
    setIsConnectionRequestModalOpen(!isConnectionRequestModalOpen);
  };

  // Handle canceling a sent connection request
  const handleCancelConnectionRequest = async (requestId: string) => {
    try {
      await connectionService.cancelConnectionRequest(requestId);
      await loadConnectionData(); // Reload data after action
    } catch (error) {
      console.error('Error canceling connection request:', error);
    }
  };

  // Handle sending a message to a user
  const handleSendMessage = (userId: string) => {
    // In a real app, this would open a chat with the user or redirect to a messaging page
    alert(`Message functionality would be implemented here for user: ${userId}`);
  };

  // Toggle notification panel
  const toggleNotificationPanel = () => {
    setShowNotificationPanel(prev => !prev);
  };

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const { unread_count } = await notificationService.getNotifications({ is_read: false });
        setUnreadNotificationCount(unread_count);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };
    
    fetchNotificationCount();
    
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Load connection data on mount
  useEffect(() => {
    loadConnectionData();
  }, []);

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side: Hamburger Menu (mobile) & Search Bar */}
          <div className="flex items-center">
            {/* Hamburger menu button - visible on small screens */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 -ml-2 mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              aria-label="Open sidebar"
            >
              <FaBars className="h-6 w-6" /> {/* Changed to FaBars */}
            </button>
            
            {/* Search Bar Removed */}
            {/* <div className="hidden sm:flex items-center flex-1 max-w-md"> ... </div> */}
          </div> {/* Closes "flex items-center" for left side (toggler) */}

          {/* Right Side Icons - This div might need adjustment if the search bar removal affects layout significantly, e.g. justify-end on parent or spacer */}
          {/* The parent <div className="flex justify-between h-16"> should handle spacing */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              {theme === 'dark' ? (
                <IoSunny className="h-5 w-5 text-amber-400" />
              ) : (
                <IoMoon className="h-5 w-5" />
              )}
            </motion.button>

            {/* Notifications Button */}
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleNotificationPanel}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 relative"
            >
              <IoNotifications className="h-5 w-5" />
              {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </motion.button>
            
            {/* Connection Requests Button */}
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleConnectionRequestModal}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 relative"
            >
              <IoPeople className="h-5 w-5" />
              {pendingConnectionRequests > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </motion.button>
            
            {/* User Profile */}
            <div className="relative profile-menu-container">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {user ? user.first_name?.charAt(0) : ''}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-200">{user?.first_name}</span>
              </motion.button>
              
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={{
                      hidden: { opacity: 0, y: -10, transition: { duration: 0.2 } },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
                    }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700"
                  >
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">My Profile</Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Settings</Link>
                    <button
                      onClick={logout}
                      className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      
      {/* Connection Request Modal */}
      <ConnectionRequestModal
        isOpen={isConnectionRequestModalOpen}
        onClose={toggleConnectionRequestModal}
        requests={connectionRequests as any}
        sentRequests={sentConnectionRequests as any}
        connections={connections}
        onAccept={handleAcceptConnectionRequest}
        onDecline={handleDeclineConnectionRequest}
        onCancel={handleCancelConnectionRequest}
        onMessage={handleSendMessage}
      />

      {/* Notification Panel */}
      {showNotificationPanel && (
        <NotificationPanel 
          onClose={toggleNotificationPanel}
        />
      )}
    </motion.nav>
  );
};

export default Navbar; 
