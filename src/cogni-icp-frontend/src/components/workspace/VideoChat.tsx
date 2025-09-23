import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../shared';
import { MessageSquare, User, X, CheckCircle, ArrowRight, Users, Clock } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
  role?: string;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
}

interface VideoChatProps {
  sessionId: number;
  participants: Participant[];
}

const VideoChat: React.FC<VideoChatProps> = ({ sessionId, participants }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  
  // State
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeParticipants, setActiveParticipants] = useState<Participant[]>([]);
  const [message, setMessage] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{id: string, user: string, content: string, timestamp: string}[]>([]);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  
  // When component mounts, initialize video participants from prop
  useEffect(() => {
    const initialParticipants = participants.map(p => ({
      ...p,
      isAudioEnabled: false,
      isVideoEnabled: false
    }));
    setActiveParticipants(initialParticipants);
  }, [participants]);
  
  // Socket connections
  useEffect(() => {
    if (!socket || !sessionId) return;
    
    // Join video room
    socket.emit('join_video', { 
      session_id: sessionId, 
      user_id: user?.id,
      user_name: user?.name
    });
    
    // Listen for participants updates
    socket.on('participant_update', (data: { 
      user_id: string, 
      audio: boolean, 
      video: boolean 
    }) => {
      setActiveParticipants(prev => 
        prev.map(p => 
          p.id === data.user_id 
            ? { ...p, isAudioEnabled: data.audio, isVideoEnabled: data.video } 
            : p
        )
      );
    });
    
    // Listen for new chat messages
    socket.on('video_chat_message', (data: {
      id: string,
      user: string,
      content: string,
      timestamp: string
    }) => {
      setChatMessages(prev => [...prev, data]);
    });
    
    // Cleanup function
    return () => {
      socket.emit('leave_video', { 
        session_id: sessionId, 
        user_id: user?.id 
      });
      socket.off('participant_update');
      socket.off('video_chat_message');
    };
  }, [socket, sessionId, user]);
  
  // Function to toggle audio
  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    
    // Notify other participants
    if (socket && sessionId) {
      socket.emit('update_media_state', {
        session_id: sessionId,
        user_id: user?.id,
        audio: newState,
        video: isVideoEnabled
      });
    }
  };
  
  // Function to toggle video
  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    
    // If enabling video, request camera access
    if (newState) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error('Error accessing camera:', err);
          setIsVideoEnabled(false);
        });
    } else {
      // Turn off video if it was on
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
      }
    }
    
    // Notify other participants
    if (socket && sessionId) {
      socket.emit('update_media_state', {
        session_id: sessionId,
        user_id: user?.id,
        audio: isAudioEnabled,
        video: newState
      });
    }
  };
  
  // Join the video call
  const joinCall = () => {
    setIsConnecting(true);
    
    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      
      // Add self to participants with default states
      if (user) {
        const selfParticipant: Participant = {
          id: user.id.toString(),
          name: user.name,
          isAudioEnabled: false,
          isVideoEnabled: false
        };
        
        setActiveParticipants(prev => {
          // Check if user already in list
          if (prev.some(p => p.id === user.id.toString())) {
            return prev;
          }
          return [...prev, selfParticipant];
        });
      }
    }, 1500);
  };
  
  // Leave the video call
  const leaveCall = () => {
    setIsConnected(false);
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
    
    // Turn off local media
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    
    // Remove self from participants
    if (user) {
      setActiveParticipants(prev => 
        prev.filter(p => p.id !== user.id.toString())
      );
    }
    
    // Notify others
    if (socket && sessionId) {
      socket.emit('leave_video', { 
        session_id: sessionId, 
        user_id: user?.id 
      });
    }
  };
  
  // Send chat message
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const msgData = {
      id: Math.random().toString(36).substr(2, 9),
      user: user?.name || 'Anonymous',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, msgData]);
    setMessage('');
    
    // Send to others
    if (socket && sessionId) {
      socket.emit('video_chat_message', {
        session_id: sessionId,
        ...msgData
      });
    }
  };
  
  // Layout helpers
  const getParticipantGridClass = (count: number): string => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    return 'grid-cols-3';
  };
  
  // Placeholder for video element
  const VideoPlaceholder: React.FC<{ participant: Participant }> = ({ participant }) => (
    <div className="flex flex-col items-center justify-center h-full bg-gray-800 rounded-lg">
      <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center mb-2">
        <span className="text-primary-600 dark:text-primary-200 text-2xl font-medium">
          {participant.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <p className="text-white text-sm">{participant.name}</p>
    </div>
  );
  
  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-850 rounded-lg overflow-hidden">
      {/* Top section - video grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        {!isConnected ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Video Conference
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
              Connect with your team members in real-time with video and audio.
            </p>
            
            <Button
              onClick={joinCall}
              disabled={isConnecting}
              className="w-40"
            >
              {isConnecting ? 'Connecting...' : 'Join Video Call'}
            </Button>
          </div>
        ) : (
          <div className={`grid ${getParticipantGridClass(activeParticipants.length)} gap-4 h-full`}>
            {/* Local video */}
            <div className="relative h-full bg-gray-900 rounded-lg overflow-hidden">
              {isVideoEnabled ? (
                <video 
                  ref={localVideoRef}
                  autoPlay 
                  muted 
                  className="w-full h-full object-cover"
                />
              ) : (
                <VideoPlaceholder participant={{ id: user?.id?.toString() || '', name: `${user?.name || 'You'} (You)` }} />
              )}
              
              <div className="absolute bottom-2 left-2 flex items-center">
                <span className={`w-2 h-2 rounded-full ${isAudioEnabled ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-full">
                  {user?.name || 'You'} (You)
                </span>
              </div>
            </div>
            
            {/* Other participants */}
            {activeParticipants
              .filter(p => p.id !== user?.id?.toString()) // Filter out self
              .map(participant => (
                <div key={participant.id} className="relative h-full bg-gray-900 rounded-lg overflow-hidden">
                  {participant.isVideoEnabled ? (
                    <div className="w-full h-full bg-gray-800">
                      {/* Placeholder for remote video - in a real app this would be connected to WebRTC */}
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-white text-sm">Video feed would appear here</p>
                      </div>
                    </div>
                  ) : (
                    <VideoPlaceholder participant={participant} />
                  )}
                  
                  <div className="absolute bottom-2 left-2 flex items-center">
                    <span className={`w-2 h-2 rounded-full ${participant.isAudioEnabled ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                    <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-full">
                      {participant.name}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      
      {/* Controls section */}
      {isConnected && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={toggleAudio}
                className={!isAudioEnabled ? 'bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800' : ''}
                icon={isAudioEnabled ? <Users className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              >
                {isAudioEnabled ? 'Mute' : 'Unmute'}
              </Button>
              
              <Button
                variant="outline"
                onClick={toggleVideo}
                className={!isVideoEnabled ? 'bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800' : ''}
                icon={isVideoEnabled ? <Users className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              >
                {isVideoEnabled ? 'Stop Video' : 'Start Video'}
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsChatOpen(!isChatOpen)}
                icon={<MessageSquare className="h-4 w-4" />}
              >
                Chat {chatMessages.length > 0 && `(${chatMessages.length})`}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setActiveParticipants(participants)}
                icon={<Users className="h-4 w-4" />}
              >
                Participants ({activeParticipants.length})
              </Button>
              
              <Button
                variant="danger"
                onClick={leaveCall}
              >
                Leave Call
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat sidebar */}
      {isConnected && isChatOpen && (
        <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col z-10">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white">Chat</h3>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatMessages.length === 0 ? (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                No messages yet
              </p>
            ) : (
              chatMessages.map(msg => (
                <div key={msg.id} className="flex flex-col">
                  <div className="flex items-baseline space-x-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{msg.user}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">{msg.content}</p>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={sendChatMessage} className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <Button type="submit" size="sm" disabled={!message.trim()}>
                Send
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoChat; 