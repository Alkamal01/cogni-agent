import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/shared';
import { FaCalendarAlt, FaBook, FaUsers, FaInfoCircle, FaPlus, FaChartLine, FaComments } from 'react-icons/fa';
import studyGroupService, { 
  StudyGroup, GroupMember, GroupActivity, StudyResource, StudySessionParams 
} from '../services/studyGroupService';
import { chatService, Message } from '../services/chatService';
import SessionScheduler from '../components/groups/SessionScheduler';
import MaterialsRepository from '../components/groups/MaterialsRepository';
import LearningPairs from '../components/groups/LearningPairs';
import GroupPolls from '../components/groups/GroupPolls';
import MembersModal from '../components/groups/MembersModal';
import GroupRulesModal from '../components/groups/GroupRulesModal';
import DiscussionModal from '../components/groups/DiscussionModal';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';

// Define interface for study sessions
interface StudySession {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: number;
  participants: number;
  maxParticipants: number;
  isParticipant?: boolean;
}

// Define interface for RecentMessage
interface RecentMessage {
  id: number;
  content: string;
  timestamp: string;
  user: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
}

// Utility functions for formatting dates and times
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric'
  });
};

const formatTime = (timeString: string): string => {
  return timeString;
};

const GroupDetail: React.FC = () => {
  const { id: groupPublicId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal visibility states
  const [isSchedulerOpen, setIsSchedulerOpen] = useState<boolean>(false);
  const [isRepositoryOpen, setIsRepositoryOpen] = useState<boolean>(false);
  const [isPairsOpen, setIsPairsOpen] = useState<boolean>(false);
  const [isPollsOpen, setPollsOpen] = useState<boolean>(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState<boolean>(false);
  
  // Group data states
  const [group, setGroup] = useState<StudyGroup>({
    id: 0,
    public_id: '',
    name: '',
    description: '',
    creator_id: 0,
    is_private: false,
    max_members: 0,
    learning_level: 'beginner',
    member_count: 0,
    created_at: '',
    updated_at: ''
  });
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activities, setActivities] = useState<GroupActivity[]>([]);
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  
  // Adapt members for modal format
  const adaptMembersForModal = useCallback((members: GroupMember[]) => members.map(member => ({
    id: member.id.toString(),
    name: member.user?.username || 'Unknown User',
    role: member.role as 'admin' | 'moderator' | 'member',
    avatar: member.user?.avatar,
    lastActive: member.last_active_at || member.joined_at,
    skills: [],
    user_id: member.user_id
  })), []);

  // Function to fetch sessions from API
  const fetchSessions = async () => {
    if (!groupPublicId) return;

    try {
      const sessionsData = await studyGroupService.getGroupSessions(groupPublicId);
      const formattedSessions = sessionsData.map(session => ({
        id: session.id,
        title: session.title,
        date: session.date,
        time: session.time,
        duration: session.duration,
        participants: session.participant_count || 0,
        maxParticipants: session.max_participants,
        isParticipant: session.is_participant || false
      }));
      setSessions(formattedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Function to fetch polls from API
  const fetchPolls = async () => {
    if (!groupPublicId) return;

    try {
      const pollsData = await studyGroupService.getGroupPolls(groupPublicId);
      setPolls(pollsData);
    } catch (error) {
      console.error('Error fetching polls:', error);
    }
  };

  // Function to fetch group data - moved outside useEffect
  const fetchData = async () => {
    if (!groupPublicId) {
      toast({
        title: 'Invalid Group',
        description: 'The group you are trying to access does not exist.',
        variant: 'error'
      });
      navigate('/groups', { replace: true });
      return;
    }

    setLoading(true);
    try {
      
      // Fetch group details - with all related data
      const groupData = await studyGroupService.getGroupById(groupPublicId);
      setGroup(groupData);
      
      // Set members if available in the response
      if (groupData.members && groupData.members.length > 0) {
        setMembers(groupData.members);
      }
      
      // Set activities if available in the response
      if (groupData.recent_activities && groupData.recent_activities.length > 0) {
        setActivities(groupData.recent_activities);
      }
      
      // Set resources if available in the response
      if (groupData.resources && groupData.resources.length > 0) {
        setResources(groupData.resources);
      }
      
      // Fetch recent messages if possible
      try {
        const fetchedMessages = await chatService.getMessages(groupPublicId, 1, 3);
        
        // Map the messages to our local format
        const mappedMessages = fetchedMessages.reverse().map((message: Message) => ({
          id: message.id,
          content: message.content,
          timestamp: message.timestamp,
          user: {
            id: message.user.id,
            name: message.user.name || message.user.username,
            username: message.user.username,
            avatar: message.user.avatar
          }
        }));
        
        setRecentMessages(mappedMessages);
      } catch (err) {
        console.error('Error fetching recent messages:', err);
        // Don't set error state for messages - it's not critical
      }

      // Fetch sessions and polls
      await fetchSessions();
      await fetchPolls();

      setLoading(false);
    } catch (err) {
      console.error('Error fetching group data:', err);
      setError('Failed to load group details. Please try again.');
      setLoading(false);
    }
  };

  // Function to handle joining a session
  const handleJoinSession = async (sessionId: number) => {
    if (!groupPublicId) return;

    try {
      await studyGroupService.joinSession(groupPublicId, sessionId);

      // Refresh sessions to update participation status
      await fetchSessions();

      toast({
        title: 'Success',
        description: 'You have successfully joined the session!',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error joining session:', error);
      toast({
        title: 'Error',
        description: 'Failed to join the session. Please try again.',
        variant: 'error'
      });
    }
  };

  // Function to handle leaving a session
  const handleLeaveSession = async (sessionId: number) => {
    if (!groupPublicId) return;

    try {
      await studyGroupService.leaveSession(groupPublicId, sessionId);

      // Refresh sessions to update participation status
      await fetchSessions();

      toast({
        title: 'Success',
        description: 'You have left the session.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error leaving session:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave the session. Please try again.',
        variant: 'error'
      });
    }
  };

  // Use Effect for fetching data
  useEffect(() => {
    fetchData();
  }, [groupPublicId]);
  
  // Function to handle scheduling a new session
  const handleScheduleSession = async (sessionData: StudySessionParams) => {
    if (!groupPublicId) {
      toast({ title: 'Error', description: 'Group ID is missing.', variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      
      // Enhanced debug information
      const currentMember = members.find(m => m.user_id === user?.id);
      console.log("Current user:", user);
      console.log("Group ID:", groupPublicId);
      console.log("Current user's role in group:", currentMember?.role);
      console.log("Current user's ID:", user?.id);
      console.log("Members array:", members);
      console.log("Session data being sent:", sessionData);
      
      // Create the session using the API
      const createdSession = await studyGroupService.createSession(groupPublicId, sessionData);

      // Refresh sessions from API to get the latest data
      await fetchSessions();

      // Add a new activity for this session
      const newActivity: GroupActivity = {
        id: Date.now(),
        group_id: group.id,
        user_id: user?.id || 0,
        activity_type: 'session_scheduled',
        content: JSON.stringify({
          title: createdSession.title,
          date: createdSession.date,
          time: createdSession.time
        }),
        created_at: new Date().toISOString(),
        user: {
          id: user?.id || 0,
          username: user?.username || 'You'
        }
      };

      setActivities(prevActivities => [newActivity, ...prevActivities]);
      
      toast({
        title: 'Success',
        description: `Your session "${sessionData.title}" has been scheduled.`,
        variant: 'success'
      });
      
      setIsSchedulerOpen(false);
    } catch (error) {
      console.error('Error scheduling session:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule the session. Please try again.',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle adding a new resource
  const handleAddResource = async (resource: any) => {
    if (!groupPublicId) {
      toast({
        title: 'Error',
        description: 'Cannot add a resource without a valid group.',
        variant: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const resourceData = {
        title: resource.name,
        description: resource.description || '',
        resource_type: resource.type || 'link',
        resource_url: resource.url || '',
        content: resource.content || ''
      };
      
      // Add the resource using the API
      const newResource = await studyGroupService.addResource(groupPublicId, resourceData);
      
      // Update local state with the new resource
      setResources(prevResources => [...prevResources, newResource]);
      
      // Create a new activity for this resource
    const newActivity: GroupActivity = {
        id: Date.now(),
        group_id: group.id,
        user_id: 1, // Current user ID from auth context
        activity_type: 'resource_added',
        content: JSON.stringify(resourceData),
        created_at: new Date().toISOString(),
      user: {
          id: 1,
          username: 'You'
        }
      };
      
      setActivities(prevActivities => [newActivity, ...prevActivities]);
      
      toast({
        title: 'Success',
        description: `Resource "${resource.name}" has been added to the group.`,
        variant: 'success'
      });
      
      setIsRepositoryOpen(false);
    } catch (error) {
      console.error('Error adding resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to add the resource. Please try again.',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle leaving the group
  const handleLeaveGroup = async () => {
    try {
      if (!groupPublicId) return;
      
      await studyGroupService.leaveGroup(groupPublicId);
      
      toast({
        title: 'Success',
        description: `You've successfully left the group.`,
        variant: 'success'
      });
      
      // Navigate back to the groups page
      navigate('/study-groups');
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave the group. Please try again.',
        variant: 'error'
      });
    }
  };
  
  // Function to format message timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Open discussion modal
  const handleOpenDiscussion = () => {
    // Simply open the modal, let the modal handle the connection
    setIsDiscussionOpen(true);
  };

  // Close discussion modal
  const handleCloseDiscussion = () => {
    // Just close the modal, it will handle its own cleanup
    setIsDiscussionOpen(false);
  };
  
  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show error message if data fetch failed
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!groupPublicId) {
    // Awaiting navigation from fetchData
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Group Header */}
      <div className="flex justify-between items-center mb-6">
            <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
          <div className="flex mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 mr-2">
              {group.topic_name || 'General'}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
              {group.learning_level}
            </span>
              </div>
            </div>
            <Button 
          variant="outline"
          onClick={handleLeaveGroup}
          className="text-red-600 dark:text-red-400 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20"
            >
          Leave Group
            </Button>
          </div>

      {/* Group Description */}
      <div className="mb-8 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-3">
          <FaInfoCircle className="mr-3 text-blue-500 dark:text-blue-400" size={20} />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">About</h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{group.description || 'No description provided.'}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-gray-800 dark:text-gray-200">
              <strong className="text-gray-700 dark:text-gray-300">Goals:</strong> {group.goals || 'Not specified'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-gray-800 dark:text-gray-200">
              <strong className="text-gray-700 dark:text-gray-300">Meeting frequency:</strong> {group.meeting_frequency || 'Not specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: 2/3 width */}
        <div className="md:col-span-2 space-y-8">
          {/* Upcoming Sessions */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                  <FaCalendarAlt className="text-blue-600 dark:text-blue-400" size={18} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upcoming Sessions</h2>
              </div>
              <Button 
                variant="primary"
                onClick={() => setIsSchedulerOpen(true)}
                className="shadow-sm"
              >
                <span className="flex items-center">
                  <FaPlus className="mr-2 h-4 w-4" />
                Schedule
                </span>
              </Button>
            </div>
            
            {sessions.length > 0 ? (
            <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{session.title}</h3>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Date:</strong> {session.date}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Time:</strong> {session.time}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Duration:</strong> {session.duration} minutes</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Participants:</strong> {session.participants}/{session.maxParticipants}
                      </p>
                    </div>
                    <Button
                      variant={session.isParticipant ? "outline" : "secondary"}
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => session.isParticipant ? handleLeaveSession(session.id) : handleJoinSession(session.id)}
                    >
                      {session.isParticipant ? 'Leave Session' : 'Join Session'}
                    </Button>
                </div>
              ))}
            </div>
            ) : (
              <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No upcoming sessions scheduled.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Click the Schedule button to create a new session.</p>
              </div>
            )}
          </div>

          {/* Recent Activities */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                  <FaChartLine className="text-purple-600 dark:text-purple-400" size={18} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activities</h2>
              </div>
              <Button
                variant="outline"
                onClick={handleOpenDiscussion}
                className="shadow-sm"
              >
                <span className="flex items-center">
                  <FaComments className="mr-2 h-4 w-4" />
                  Discussion
                </span>
              </Button>
            </div>
            
            {activities.length > 0 ? (
            <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3 overflow-hidden border border-gray-300 dark:border-gray-600">
                        {activity.user?.avatar ? (
                          <img 
                            src={activity.user.avatar}
                            alt={activity.user?.username || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 font-semibold">
                            {(activity.user?.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{activity.user?.username || 'Unknown User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(activity.created_at)}
                        </p>
                  </div>
                    </div>
                    <div className="pl-12">
                      <p className="text-gray-700 dark:text-gray-300">{
                        activity.activity_type === 'session_scheduled' ? 'Scheduled a new study session' :
                        activity.activity_type === 'resource_added' ? 'Added a new resource' :
                        activity.activity_type === 'member_joined' ? 'Joined the group' :
                        activity.activity_type
                      }</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No recent activities.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Activities will appear here as group members interact.</p>
              </div>
            )}
          </div>
          
          {/* Group Discussion */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="text-green-600 dark:text-green-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Group Discussion</h2>
            </div>
              <Button 
                variant="primary"
                onClick={() => setIsDiscussionOpen(true)}
              >
                View All
              </Button>
            </div>
            
            {recentMessages.length > 0 ? (
              <div className="space-y-3">
                {recentMessages.map((message) => (
                  <div key={message.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        {message.user?.avatar ? (
                          <img
                            src={message.user.avatar}
                            alt={message.user.username}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {message.user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {message.user.name || message.user.username}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatMessageTime(message.timestamp)}
                          </span>
                  </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {message.content}
                        </p>
                    </div>
                    </div>
                  </div>
                ))}
                <div className="pt-2 text-center">
                  <Button 
                    variant="secondary"
                    size="sm" 
                    onClick={() => setIsDiscussionOpen(true)}
                    className="w-full"
                  >
                    Join the conversation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Be the first to post in this group's discussion.</p>
                <Button 
                  variant="secondary"
                  size="sm" 
                  onClick={() => setIsDiscussionOpen(true)}
                  className="mt-3"
                >
                  Start conversation
                </Button>
              </div>
            )}
            </div>
        </div>

        {/* Right Column: 1/3 width */}
        <div className="space-y-8">
          {/* Group Members */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                  <FaUsers className="text-indigo-600 dark:text-indigo-400" size={18} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Members ({group.member_count})</h2>
            </div>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => setIsMembersModalOpen(true)}
              >
                View All
              </Button>
            </div>
            
            {members.length > 0 ? (
              <div className="space-y-3">
                {members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3 overflow-hidden border border-gray-300 dark:border-gray-600">
                      {member.user?.avatar ? (
                        <img 
                          src={member.user.avatar}
                          alt={member.user?.username || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 font-semibold">
                          {(member.user?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{member.user?.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(member.joined_at).toLocaleDateString()} 
                      </p>
                    </div>
                    {member.role === 'admin' && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        Admin
                      </span>
                    )}
                  </div>
                ))}
                
                {members.length > 5 && (
                  <div className="pt-2 text-center border-t border-gray-100 dark:border-gray-700 mt-2">
              <Button 
                      variant="ghost"
                      size="sm" 
                      onClick={() => setIsMembersModalOpen(true)}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      View all {members.length} members
              </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No members found.</p>
              </div>
            )}
          </div>

          {/* Learning Resources */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg mr-3">
                  <FaBook className="text-amber-600 dark:text-amber-400" size={18} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Learning Resources</h2>
              </div>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => setIsRepositoryOpen(true)}
              >
                <span className="flex items-center">
                  <FaPlus className="mr-2 h-3 w-3" />
                  Add
                </span>
              </Button>
            </div>
            
            {resources.length > 0 ? (
              <div className="space-y-3">
                {resources.map((resource) => (
                  <div key={resource.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50 hover:shadow-sm transition-shadow">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{resource.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {resource.resource_type}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(resource.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No resources added yet.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Click "Add" to share learning materials.</p>
              </div>
            )}
          </div>

          {/* Learning Pairs */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="text-cyan-600 dark:text-cyan-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Learning Pairs</h2>
              </div>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => setIsPairsOpen(true)}
              >
                Find Partner
              </Button>
            </div>
            <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">
                Pair up with another group member for more effective studying.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Click "Find Partner" to get matched with someone with similar interests.
              </p>
            </div>
          </div>

          {/* Group Polls */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="text-red-600 dark:text-red-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Group Polls</h2>
              </div>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => setPollsOpen(true)}
              >
                View Polls
              </Button>
            </div>
            <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">
                Participate in group polls to help make decisions.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Vote on topics, study materials, and meeting times.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DiscussionModal 
        isOpen={isDiscussionOpen}
        onClose={handleCloseDiscussion}
        groupId={groupPublicId}
        groupName={group.name} 
      />
      
      <SessionScheduler 
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        groupId={groupPublicId}
        groupName={group.name} 
        onSubmit={handleScheduleSession}
      />
      
      <MaterialsRepository 
        isOpen={isRepositoryOpen}
        onClose={() => setIsRepositoryOpen(false)}
        groupId={groupPublicId}
        groupName={group.name} 
      />
      
      <LearningPairs 
        isOpen={isPairsOpen}
        onClose={() => setIsPairsOpen(false)}
        groupId={groupPublicId}
        groupName={group.name} 
      />
      
      <GroupPolls
        isOpen={isPollsOpen}
        onClose={() => setPollsOpen(false)}
        groupId={groupPublicId}
        groupName={group.name}
        polls={polls}
        onPollsUpdate={fetchPolls}
      />
      
      <MembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        groupId={groupPublicId}
        groupName={group.name}
        members={adaptMembersForModal(members)}
        currentUserId={user?.id || 0}
        isAdmin={members.find(m => m.user_id === user?.id)?.role === 'admin'}
        creatorId={group.creator_id}
        onMemberUpdate={fetchData}
      />
      
      <GroupRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        onAccept={() => console.log('Rules accepted')}
        groupName={group.name}
      />
    </div>
  );
};

export default GroupDetail; 