import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Award, MessageSquare, Users, Clock, BookOpen, Brain, Check, X } from 'lucide-react';
import { Card, Button } from '../components/shared';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import connectionService from '../services/connectionService';
import apiService from '../services/apiService';


// Types
interface UserProfileData {
  id: string;
  public_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  goals: string[];
  learning: {
    current: string[];
    completed: string[];
  };
  badges: {
    id: string;
    name: string;
    description: string;
    date: string;
  }[];
  stats: {
    groupsJoined: number;
    sessionsAttended: number;
    connectionsCount: number;
    joinedDate: string;
    lastActive: string;
  };
  connectionStatus: 'none' | 'pending' | 'connected' | 'self';
}

const UserProfile: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);

  useEffect(() => {
    // Fetch user profile and connection status
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        // Check if viewing own profile
        if (publicId === user?.public_id) {
          navigate('/profile');
          return;
        }
        
        // Fetch user profile from API using public_id
        const response = await apiService.get(`/api/users/${publicId}`);
        const userData = response.data;
        
        // Get connection status using public_id
        let connectionStatus: 'none' | 'pending' | 'connected' | 'self' = 'none';
        if (publicId) {
          try {
            const connectionStatusResponse = await connectionService.getConnectionStatus(publicId);
            switch (connectionStatusResponse.status) {
              case 'connected':
                connectionStatus = 'connected';
                break;
              case 'request_sent':
              case 'request_received':
                connectionStatus = 'pending';
                break;
              case 'self':
                connectionStatus = 'self';
                break;
              default:
                connectionStatus = 'none';
            }
          } catch (error) {
            console.error('Error fetching connection status:', error);
            connectionStatus = 'none';
          }
        }

        // Transform API data to match our interface
        const profile: UserProfileData = {
          id: userData.id,
          public_id: userData.public_id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          avatar: userData.avatar,
          bio: userData.bio,
          skills: userData.skills || [],
          interests: userData.interests || [],
          goals: userData.goals || [],
          learning: {
            current: userData.current_courses || [],
            completed: userData.completed_courses || []
          },
          badges: userData.badges || [],
          stats: {
            groupsJoined: userData.groups_joined || 0,
            sessionsAttended: userData.sessions_attended || 0,
            connectionsCount: userData.connections_count || 0,
            joinedDate: userData.created_at,
            lastActive: userData.last_active
          },
          connectionStatus
        };
        
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        showToast('error', 'Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [publicId, user, navigate, showToast]);

  const handleSendConnectionRequest = async () => {
    if (!userProfile || !publicId) return;
    
    try {
      await connectionService.sendConnectionRequest(publicId, connectionMessage);
      
      // Update local state
      setUserProfile({
        ...userProfile,
        connectionStatus: 'pending'
      });
      
      setShowMessageInput(false);
      setConnectionMessage('');
      showToast('success', 'Connection request sent successfully');
    } catch (error) {
      console.error('Error sending connection request:', error);
      showToast('error', 'Failed to send connection request');
    }
  };

  const handleCancelRequest = async () => {
    if (!userProfile || !publicId) return;
    
    try {
      // Get the request ID and cancel it
      const connectionStatus = await connectionService.getConnectionStatus(publicId);
      if (connectionStatus.request_id) {
        await connectionService.cancelConnectionRequest(connectionStatus.request_id);
      }
      
      // Update local state
      setUserProfile({
        ...userProfile,
        connectionStatus: 'none'
      });
      
      showToast('success', 'Connection request cancelled');
    } catch (error) {
      console.error('Error cancelling connection request:', error);
      showToast('error', 'Failed to cancel connection request');
    }
  };

  const handleSendMessage = () => {
    showToast('info', 'Messaging functionality would be implemented here');
    // In a real app, this would open a chat or redirect to messaging
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">User Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The user profile you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-32 w-32 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white text-4xl font-medium shadow-lg mb-4">
                {userProfile?.avatar ? (
                  <img 
                    src={userProfile.avatar} 
                    alt={`${userProfile.first_name} ${userProfile.last_name}`} 
                    className="h-32 w-32 rounded-full object-cover" 
                  />
                ) : (
                  userProfile?.first_name?.charAt(0)
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : ''}
              </h1>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {userProfile?.skills.slice(0, 3).map((skill, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
                  >
                    {skill}
                  </span>
                ))}
                {userProfile?.skills.length > 3 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                    +{userProfile.skills.length - 3} more
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {userProfile.bio && (
                <p className="text-gray-700 dark:text-gray-300">
                  {userProfile.bio}
                </p>
              )}
              <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <Clock className="w-4 h-4 mr-2" />
                Joined {new Date(userProfile.stats.joinedDate).toLocaleDateString()}
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <Clock className="w-4 h-4 mr-2" />
                Last active {userProfile.stats.lastActive === new Date().toISOString().split('T')[0] 
                  ? 'Today' 
                  : new Date(userProfile.stats.lastActive).toLocaleDateString()}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.stats.groupsJoined}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Groups</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.stats.sessionsAttended}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Sessions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.stats.connectionsCount}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Connections</div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {userProfile.connectionStatus === 'none' && (
                <div>
                  <Button 
                    className="w-full" 
                    onClick={() => setShowMessageInput(true)}
                    disabled={showMessageInput}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                  
                  {showMessageInput && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3"
                    >
                      <textarea
                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-sm"
                        placeholder="Add a message (optional)"
                        rows={3}
                        value={connectionMessage}
                        onChange={(e) => setConnectionMessage(e.target.value)}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="flex-1"
                          onClick={handleSendConnectionRequest}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Send
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setShowMessageInput(false);
                            setConnectionMessage('');
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              
              {userProfile.connectionStatus === 'pending' && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleCancelRequest}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Request
                </Button>
              )}
              
              {userProfile.connectionStatus === 'connected' && (
                <Button 
                  className="w-full" 
                  onClick={handleSendMessage}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Award className="w-5 h-5 text-primary-500 mr-2" />
              Achievements
            </h2>
            <div className="space-y-4">
              {userProfile.badges.map((badge) => (
                <div key={badge.id} className="flex items-start space-x-3">
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full">
                    <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {badge.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {badge.description}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(badge.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {userProfile.badges.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No achievements yet
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Detailed Info */}
        <div className="md:col-span-2 space-y-6">

          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Brain className="w-5 h-5 text-primary-500 mr-2" />
              Skills & Expertise
            </h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {userProfile.skills.map((skill, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
                >
                  {skill}
                </span>
              ))}
            </div>

            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2 mt-6">
              Interests
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {userProfile.interests.map((interest, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                >
                  {interest}
                </span>
              ))}
            </div>

            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2 mt-6">
              Learning Goals
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 mb-6 pl-2">
              {userProfile.goals.map((goal, index) => (
                <li key={index}>{goal}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 text-primary-500 mr-2" />
              Learning Journey
            </h2>
            
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs mr-2">
                  <Check className="w-3 h-3" />
                </span>
                Completed
              </h3>
              <div className="pl-7 space-y-2">
                {userProfile.learning.completed.map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800"
                  >
                    <span className="text-gray-900 dark:text-gray-100">{item}</span>
                  </div>
                ))}
                
                {userProfile.learning.completed.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400">
                    No completed courses yet
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs mr-2">
                  <Clock className="w-3 h-3" />
                </span>
                Currently Learning
              </h3>
              <div className="pl-7 space-y-2">
                {userProfile.learning.current.map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50"
                  >
                    <span className="text-gray-900 dark:text-gray-100">{item}</span>
                  </div>
                ))}
                
                {userProfile.learning.current.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400">
                    Not currently learning anything
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 