import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/shared';
import { Card } from '../components/shared';
import Portal from '../components/shared/Portal';
import { 
  Award, 
  Star, 
  Zap, 
  Clock, 
  Users, 
  BookOpen, 
  MessageSquare, 
  TrendingUp, 
  Target, 
  CheckCircle,
  X,
  User,
  BarChart2
} from 'lucide-react';
import { taskService, Task } from '../services/taskService';
import connectionService from '../services/connectionService';
import { useSubscription } from '../contexts/SubscriptionContext';

import { AlertCircle } from 'lucide-react';
import api from '../utils/apiClient';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'Learning' | 'Social' | 'Performance' | 'Milestones';
  earned?: boolean;
  earnedDate?: string;
  progress?: number;
  total?: number;
  locked?: boolean;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  xp: number;
  image?: string;
}

interface TaskCompletionModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskPublicId: string, proofData: any) => Promise<void>;
}

const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  onComplete 
}) => {
  const [proofData, setProofData] = useState<any>({});
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [manualUserIds, setManualUserIds] = useState<string>('');
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const resetForm = () => {
    setProofData({});
    setSelectedParticipants([]);
    setManualUserIds('');
  };

  // Load connections when modal opens
  useEffect(() => {
    if (isOpen && (task?.category === 'social' || task?.category === 'study_group')) {
      loadConnections();
    }
  }, [isOpen, task]);

  const loadConnections = async () => {
    try {
      setIsLoadingConnections(true);
      const connectionsData = await connectionService.getConnections();
      setConnections(connectionsData);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine selected participants with manual user IDs
      const manualIds = manualUserIds.split(',').map(id => id.trim()).filter(id => id);
      const allParticipants = [...selectedParticipants, ...manualIds];
      
      // For social and study_group tasks, ensure current user is included
      if (task?.category === 'social' || task?.category === 'study_group') {
        if (user?.username && !allParticipants.includes(user.username)) {
          allParticipants.push(user.username);
        }
      }
      
      const finalProofData = {
        ...proofData,
        participants: allParticipants
      };

      // Debug logging
      console.log('Task completion attempt:', {
        taskId: task!.public_id,
        taskCategory: task!.category,
        proofData: finalProofData,
        allParticipants,
        currentUser: user?.username
      });

      // Validate required fields for social tasks
      if (task!.category === 'social') {
        if (!finalProofData.interaction_type) {
          toast({ 
            title: 'Validation Error', 
            description: 'Please select an interaction type', 
            variant: 'error' 
          });
          return;
        }
        if (!finalProofData.duration || finalProofData.duration < 300) {
          toast({ 
            title: 'Validation Error', 
            description: 'Duration must be at least 5 minutes', 
            variant: 'error' 
          });
          return;
        }
        if (!finalProofData.participants || finalProofData.participants.length < 2) {
          toast({ 
            title: 'Validation Error', 
            description: 'Must have at least 2 participants', 
            variant: 'error' 
          });
          return;
        }
      }

      await onComplete(task!.public_id, finalProofData);
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error completing task:', error);
      
      // Extract specific error message from backend
      let errorMessage = 'Failed to complete task. Please try again later.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProofFields = () => {
    if (!task) return null;

    const category = task.category.toLowerCase();

    switch (category) {
      case 'learning':
        return (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Study Duration (minutes)
                </label>
                <input
                  type="number"
                  min="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.study_duration || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProofData({
                    ...proofData,
                    study_duration: (parseInt(e.target.value) || 0) * 60 // Convert to seconds
                  })}
                  placeholder="Enter study duration in minutes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topics Covered
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={proofData.topics_covered || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProofData({
                    ...proofData,
                    topics_covered: e.target.value.split(',').map(t => t.trim())
                  })}
                  placeholder="Enter topics covered (comma-separated)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Date
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.completion_date || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    completion_date: e.target.value
                  })}
                />
              </div>
            </div>
          </>
        );

      case 'social':
        return (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interaction Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.interaction_type || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    interaction_type: e.target.value
                  })}
                >
                  <option value="">Select interaction type</option>
                  <option value="group_discussion">Group Discussion</option>
                  <option value="peer_review">Peer Review</option>
                  <option value="collaboration">Collaboration</option>
                  <option value="mentoring">Mentoring</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participants
                </label>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 mb-2">
                    Select users you collaborated with (from your connections)
                  </div>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {connections.length > 0 ? (
                      connections.map((connection) => (
                        <label key={connection.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedParticipants.includes(connection.user.username)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParticipants([...selectedParticipants, connection.user.username]);
                              } else {
                                setSelectedParticipants(selectedParticipants.filter(username => username !== connection.user.username));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                              {connection.user.avatar ? (
                                <img src={connection.user.avatar} alt={connection.user.name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                connection.user.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="text-sm text-gray-700">{connection.user.name}</span>
                            <span className="text-xs text-gray-500">(@{connection.user.username})</span>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 p-2">
                        No connections found. You can still enter usernames manually below.
                        <br />
                        <span className="text-xs text-blue-600">
                          Tip: You can enter your own username and another user's username to complete this task.
                          <br />
                          <span className="text-red-600">Note: Usernames are case-sensitive (e.g., "Alkamal" not "alkamal")</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs text-gray-500 mb-1">
                      Or enter usernames manually (comma-separated):
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={manualUserIds}
                      onChange={(e) => setManualUserIds(e.target.value)}
                      placeholder="e.g., admin, testuser, Aliyu, kamal.aliyu, Alkamal (include your username and at least one other)"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Available usernames: admin, testuser, Aliyu, kamal.aliyu, Alkamal, dscabudevs
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.duration || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    duration: (parseInt(e.target.value) || 0) * 60 // Convert to seconds
                  })}
                  placeholder="Enter interaction duration in minutes"
                />
              </div>
            </div>
          </>
        );

      case 'engagement':
        return (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Engagement Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.engagement_type || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    engagement_type: e.target.value
                  })}
                >
                  <option value="">Select engagement type</option>
                  <option value="comment">Comment</option>
                  <option value="like">Like</option>
                  <option value="share">Share</option>
                  <option value="bookmark">Bookmark</option>
                  <option value="follow">Follow</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content ID
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.content_id || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    content_id: e.target.value
                  })}
                  placeholder="Enter content ID"
                />
              </div>
              {proofData.engagement_type === 'comment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment Text
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={proofData.comment_text || ''}
                    onChange={(e) => setProofData({
                      ...proofData,
                      comment_text: e.target.value
                    })}
                    placeholder="Enter your comment (minimum 10 characters)"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timestamp
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.timestamp || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    timestamp: e.target.value
                  })}
                />
              </div>
            </div>
          </>
        );

      case 'quiz':
        return (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz ID
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.quiz_id || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    quiz_id: e.target.value
                  })}
                  placeholder="Enter quiz ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.score || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    score: parseInt(e.target.value)
                  })}
                  placeholder="Enter your score"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Questions
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.total_questions || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    total_questions: parseInt(e.target.value)
                  })}
                  placeholder="Enter total questions"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Time (seconds)
                </label>
                <input
                  type="number"
                  min="30"
                  max="3600"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.completion_time || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    completion_time: parseInt(e.target.value)
                  })}
                  placeholder="Enter completion time in seconds"
                />
              </div>
            </div>
          </>
        );

      case 'study_session':
        return (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Duration (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="240"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.session_duration || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    session_duration: parseInt(e.target.value) * 60 // Convert to seconds
                  })}
                  placeholder="Enter session duration in minutes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topics Studied
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={proofData.topics_studied || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    topics_studied: e.target.value.split(',').map(t => t.trim())
                  })}
                  placeholder="Enter topics studied (comma-separated)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.start_time || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    start_time: e.target.value
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.end_time || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    end_time: e.target.value
                  })}
                />
              </div>
            </div>
          </>
        );

      case 'study_group':
        return (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.group_name || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    group_name: e.target.value
                  })}
                  placeholder="Enter the name of the study group"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Activity Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.group_activity_type || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    group_activity_type: e.target.value
                  })}
                >
                  <option value="">Select activity type</option>
                  <option value="group_discussion">Group Discussion</option>
                  <option value="peer_review">Peer Review</option>
                  <option value="collaborative_study">Collaborative Study</option>
                  <option value="group_project">Group Project</option>
                  <option value="study_session">Study Session</option>
                  <option value="quiz_competition">Quiz Competition</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Members
                </label>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 mb-2">
                    Select group members from your connections
                  </div>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {connections.length > 0 ? (
                      connections.map((connection) => (
                        <label key={connection.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedParticipants.includes(connection.user.username)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParticipants([...selectedParticipants, connection.user.username]);
                              } else {
                                setSelectedParticipants(selectedParticipants.filter(username => username !== connection.user.username));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                              {connection.user.avatar ? (
                                <img src={connection.user.avatar} alt={connection.user.name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                connection.user.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="text-sm text-gray-700">{connection.user.name}</span>
                            <span className="text-xs text-gray-500">(@{connection.user.username})</span>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 p-2">
                        No connections found. You can still enter usernames manually below.
                        <br />
                        <span className="text-xs text-red-600">Note: Usernames are case-sensitive (e.g., "Alkamal" not "alkamal")</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs text-gray-500 mb-1">
                      Or enter usernames manually (comma-separated):
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={manualUserIds}
                      onChange={(e) => setManualUserIds(e.target.value)}
                      placeholder="e.g., admin, testuser, Aliyu, kamal.aliyu, Alkamal (include your username and at least one other)"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Available usernames: admin, testuser, Aliyu, kamal.aliyu, Alkamal, dscabudevs
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Duration (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="240"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.session_duration || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    session_duration: parseInt(e.target.value) * 60 // Convert to seconds
                  })}
                  placeholder="Enter session duration in minutes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topics Covered
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={proofData.topics_covered || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    topics_covered: e.target.value.split(',').map(t => t.trim())
                  })}
                  placeholder="Enter topics covered (comma-separated)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Size
                </label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={proofData.group_size || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    group_size: parseInt(e.target.value) || 0
                  })}
                  placeholder="Enter number of participants"
                />
              </div>
            </div>
          </>
        );

      default:
        return (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Request
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={proofData.verification_request || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    verification_request: e.target.value
                  })}
                  placeholder="Describe how you completed this task (minimum 20 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evidence Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={proofData.evidence_description || ''}
                  onChange={(e) => setProofData({
                    ...proofData,
                    evidence_description: e.target.value
                  })}
                  placeholder="Describe the evidence of your completion (minimum 10 characters)"
                />
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Complete Task: {task?.title}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Please provide proof of your task completion to earn rewards.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {renderProofFields()}
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Completing...' : 'Complete Task'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Achievements: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'achievements' | 'tasks'>('achievements');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [taskCompletionModal, setTaskCompletionModal] = useState<{
    task: Task | null;
    isOpen: boolean;
  }>({ task: null, isOpen: false });
  
  const { toast } = useToast();
  const { hasFeatureAccess } = useSubscription();
  
  // Initial achievements data
  useEffect(() => {
    const initialAchievements: Achievement[] = [
    {
      id: 1,
      name: "First Step",
      description: "Complete your first learning module",
      icon: <BookOpen />,
      category: 'Learning',
      earned: true,
      earnedDate: "2023-03-15",
      rarity: 'Common',
      xp: 50
    },
    {
      id: 2,
      name: "Knowledge Seeker",
      description: "Complete 10 learning modules in one path",
      icon: <BookOpen />,
      category: 'Learning',
      earned: true,
      earnedDate: "2023-03-22",
      rarity: 'Uncommon',
      xp: 150
    },
    {
      id: 3,
      name: "Social Butterfly",
      description: "Join 5 different study groups",
      icon: <Users />,
      category: 'Social',
      earned: true,
      earnedDate: "2023-04-01",
      rarity: 'Uncommon',
      xp: 100
    },
    {
      id: 4,
      name: "Perfect Score",
      description: "Get 100% on any module assessment",
      icon: <BookOpen />,
      category: 'Performance',
      earned: true,
      earnedDate: "2023-04-15",
      rarity: 'Rare',
      xp: 200
    },
    {
      id: 5,
      name: "30-Day Streak",
      description: "Login and complete at least one activity for 30 consecutive days",
      icon: <BookOpen />,
      category: 'Milestones',
      earned: false,
      progress: 18,
      total: 30,
      rarity: 'Epic',
      xp: 300
    },
    {
      id: 6,
      name: "AI Master",
      description: "Complete the Advanced AI Certification path",
      icon: <Award />,
      category: 'Learning',
      earned: false,
      locked: true,
      rarity: 'Legendary',
      xp: 500
    },
    {
      id: 7,
      name: "Deep Learner",
      description: "Spend more than 100 hours on the platform",
      icon: <BookOpen />,
      category: 'Milestones',
      earned: false,
      progress: 78,
      total: 100,
      rarity: 'Rare',
      xp: 250
    },
    {
      id: 8,
      name: "Data Wizard",
      description: "Complete 3 data analysis projects with top scores",
      icon: <BarChart2 />,
      category: 'Performance',
      earned: false,
      progress: 2,
      total: 3,
      rarity: 'Epic',
      xp: 350
    }
    ];
    
    setAchievements(initialAchievements);
  }, []);
  
  // Add a function to fetch achievements from the API
  useEffect(() => {
    // Fetch achievements
    const fetchAchievements = async () => {
      setIsLoading(true);
      try {
        // Use api client instead of direct fetch to include authentication
        const response = await api.get('/api/achievements/achievements');
        
        // Process the achievements
        let fetchedAchievements = response.data.achievements.map((a: any) => {
          // Map API achievement to our interface
          return {
            id: a.id,
            name: a.title,
            description: a.description,
            icon: getIconForAchievementType(a.type),
            category: getCategoryForAchievementType(a.type),
            earned: true,
            earnedDate: a.unlocked_at,
            rarity: a.metadata?.rarity || 'Common',
            xp: a.points
          };
        });
        
        setAchievements(fetchedAchievements);
      } catch (error) {
        console.error('Error fetching achievements:', error);
        // Fallback to mock data for development
        setTimeout(() => {
          setAchievements([]);
          setIsLoading(false);
        }, 1000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await taskService.getTasks({
          show_completed: true
        });
        
        if (response.success) {
          setTasks(response.tasks);
        } else {
          console.log('Tasks API returned error:', response);
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
        // Don't show error toast for now, just log it
      }
    };

    loadTasks();
  }, []);

  // Handle task completion
  const handleCompleteTask = async (taskPublicId: string) => {
    // Find the task to show in modal
    const task = tasks.find(t => t.public_id === taskPublicId);
    if (task) {
      setTaskCompletionModal({ task, isOpen: true });
    }
  };

  const handleTaskCompletion = async (taskPublicId: string, proofData: any) => {
    try {
      setCompletingTask(taskPublicId);
      
      // Complete the task with proof data
      const response = await taskService.completeTask(taskPublicId, proofData);
      
      if (response.success) {
        toast({ title: 'Success', description: response.message, variant: 'success' });
        
        // Reload tasks to update completion status
        const reloadResponse = await taskService.getTasks({ show_completed: true });
        if (reloadResponse.success) {
          setTasks(reloadResponse.tasks);
        }
      } else {
        toast({ title: 'Error', description: 'Failed to complete task. Please try again later.', variant: 'error' });
      }
    } catch (error: any) {
      console.error('Error completing task:', error);
      
      // Extract specific error message from backend
      let errorMessage = 'Failed to complete task. Please try again later.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'error' 
      });
    } finally {
      setCompletingTask(null);
    }
  };

  // Helper functions to map API data to our UI
  const getIconForAchievementType = (type: string) => {
    switch (type) {
      case 'learning_path_completion':
        return <BookOpen className="w-6 h-6" />;
      case 'course_completion':
        return <BookOpen className="w-6 h-6" />;
      case 'social':
        return <Users className="w-6 h-6" />;
      case 'streak':
        return <Clock className="w-6 h-6" />;
      case 'milestone':
        return <Award className="w-6 h-6" />;
      default:
        return <Award className="w-6 h-6" />;
    }
  };

  const getCategoryForAchievementType = (type: string): 'Learning' | 'Social' | 'Performance' | 'Milestones' => {
    switch (type) {
      case 'learning_path_completion':
      case 'course_completion':
        return 'Learning';
      case 'social':
        return 'Social';
      case 'streak':
      case 'assessment':
        return 'Performance';
      case 'milestone':
        return 'Milestones';
      default:
        return 'Learning';
    }
  };

  const categories = [
    { id: 'all', label: 'All Achievements' },
    { id: 'earned', label: 'Earned' },
    { id: 'inProgress', label: 'In Progress' },
    { id: 'Learning', label: 'Learning' },
    { id: 'Social', label: 'Social' },
    { id: 'Performance', label: 'Performance' },
    { id: 'Milestones', label: 'Milestones' }
  ];

  const taskCategories = [
    { id: 'all', label: 'All Tasks' },
    { id: 'learning', label: 'Learning' },
    { id: 'social', label: 'Social' },
    { id: 'engagement', label: 'Engagement' }
  ];

  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'earned') return achievement.earned;
    if (selectedCategory === 'inProgress') return !achievement.earned && !achievement.locked && achievement.progress !== undefined;
    return achievement.category === selectedCategory;
  });

  const filteredTasks = tasks.filter(task => {
    if (selectedCategory === 'all') return true;
    return task.category === selectedCategory;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }
  };

  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'Common':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'Uncommon':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
      case 'Rare':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
      case 'Epic':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400';
      case 'Legendary':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'learning':
        return <BookOpen className="w-4 h-4" />;
      case 'social':
        return <Users className="w-4 h-4" />;
      case 'engagement':
        return <Zap className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'learning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
      case 'social':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
      case 'engagement':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTotalRewards = () => {
    return tasks.reduce((total, task) => {
      if (task.completed) {
        return total + (task.tokens_earned || 0);
      }
      return total;
    }, 0);
  };

  const getCompletedTasksCount = () => {
    return tasks.filter(task => task.completed).length;
  };

  const getTotalCogniPoints = () => {
    // CP from achievements
    const achievementCP = achievements.reduce((sum, a) => sum + (a.xp || 0), 0);
    // CP from completed tasks (convert points_reward to CP)
    const taskCP = tasks.reduce((sum, task) => {
      if (task.completed) {
        return sum + (task.points_reward || 0);
      }
      return sum;
    }, 0);
    return achievementCP + taskCP;
  };

  const getEarnedCogniPoints = () => {
    // CP from earned achievements
    const earnedAchievementCP = filteredAchievements.reduce((sum, a) => sum + (a.earned ? (a.xp || 0) : 0), 0);
    // CP from completed tasks
    const earnedTaskCP = tasks.reduce((sum, task) => {
      if (task.completed) {
        return sum + (task.points_reward || 0);
      }
      return sum;
    }, 0);
    return earnedAchievementCP + earnedTaskCP;
  };

  return (
    <>
      <div className="space-y-8">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-900/30 dark:to-purple-900/30 p-8 rounded-xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Award className="mr-3 h-8 w-8 text-primary-600 dark:text-primary-400" />
              Rewards & Achievements
            </h1>
          </div>
          <div className="mt-2 text-gray-600 dark:text-blue-200 max-w-3xl">
            Track your learning journey milestones, complete reward tasks, and showcase your accomplishments.
          </div>
        </div>
      </motion.div>



      {/* Stats Section */}
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="p-4 dark:bg-blue-950/70 border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Earned</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredAchievements.filter(a => a.earned).length}/{achievements.length || 0}
                </p>
              </div>
              <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full">
                <Award className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="p-4 dark:bg-blue-950/70 border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">CP Earned</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{getEarnedCogniPoints()}/{getTotalCogniPoints()}</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
                  <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="p-4 dark:bg-blue-950/70 border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completion</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {achievements.length > 0 
                    ? Math.round((filteredAchievements.filter(a => a.earned).length / achievements.length) * 100)
                    : 0
                  }%
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                <BarChart2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
      )}

      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Card className="p-4 dark:bg-blue-950/70 border-0 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{getCompletedTasksCount()}/{tasks.length || 0}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="p-4 dark:bg-blue-950/70 border-0 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tokens Earned</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalRewards()}</p>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
                  <Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="p-4 dark:bg-blue-950/70 border-0 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Available</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.filter(t => !t.completed && t.is_active).length}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                  <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Filter Categories */}
      <div className="flex flex-wrap gap-3">
        {(activeTab === 'achievements' ? categories : taskCategories).map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'achievements'
              ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4 inline mr-2" />
          Achievements
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'tasks'
              ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 inline mr-2" />
          Reward Tasks
        </button>
      </div>

      {/* Content Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {activeTab === 'achievements' ? (
          // Achievements Grid
          filteredAchievements.map(achievement => (
          <motion.div 
            key={achievement.id}
            variants={itemVariants}
            className={`rounded-xl overflow-hidden ${achievement.locked ? 'opacity-60' : ''}`}
          >
            <Card className="h-full flex flex-col bg-white dark:bg-gray-800 border-0 shadow-lg overflow-hidden">
              {/* Achievement Header */}
              <div className={`p-4 ${achievement.rarity === 'Legendary' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 dark:from-yellow-700 dark:to-amber-700' : achievement.rarity === 'Epic' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-700 dark:to-indigo-700' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${achievement.rarity === 'Legendary' || achievement.rarity === 'Epic' ? 'bg-white/20' : 'bg-primary-100 dark:bg-primary-900/30'}`}>
                      {achievement.icon}
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${achievement.rarity === 'Legendary' || achievement.rarity === 'Epic' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {achievement.name}
                      </h3>
                      <p className={`text-sm ${achievement.rarity === 'Legendary' || achievement.rarity === 'Epic' ? 'text-white/80' : 'text-gray-600 dark:text-gray-300'}`}>
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                    {achievement.rarity}
                  </span>
                </div>
              </div>

              {/* Achievement Body */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="mb-4 flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Category: {achievement.category}</span>
                  <span className="ml-auto text-gray-500 dark:text-gray-400 text-sm flex items-center">
                    <Award className="w-4 h-4 mr-1 text-yellow-500" /> 
                    {achievement.xp} CP
                  </span>
                </div>
                
                {achievement.earned ? (
                  <div className="flex items-center mb-4">
                    <div className="flex-1 flex items-center">
                      <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center">
                        <Award className="w-3 h-3 mr-1" /> Earned
                      </div>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        {achievement.earnedDate && new Date(achievement.earnedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ) : achievement.progress !== undefined && achievement.total !== undefined ? (
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{achievement.progress}/{achievement.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-primary-600 dark:bg-primary-500 h-2.5 rounded-full" 
                        style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 flex items-center">
                    <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" /> Locked
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))
        ) : filteredTasks.length > 0 ? (
          // Tasks Grid
          filteredTasks.map(task => (
            <motion.div 
              key={task.public_id}
              variants={itemVariants}
              className="rounded-xl overflow-hidden"
            >
              <Card className="h-full flex flex-col bg-white dark:bg-gray-800 border-0 shadow-lg overflow-hidden">
                {/* Task Header */}
                <div className="p-4 bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-900/30 dark:to-purple-900/30">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full mr-3 bg-primary-100 dark:bg-primary-900/30">
                        <Zap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {task.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {task.description}
                        </p>
                      </div>
                    </div>
                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                      {task.difficulty}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(task.category)} flex items-center`}>
                      {getCategoryIcon(task.category)}
                      <span className="ml-1 capitalize">{task.category}</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                        {task.token_reward} tokens
                      </span>
                      {task.points_reward > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <Star className="w-4 h-4 mr-1 text-blue-500" />
                          {task.points_reward} CP
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task Body */}
                <div className="p-4 flex-1 flex flex-col">
                  {task.requirements && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <strong>Requirements:</strong> {task.requirements}
                      </p>
                    </div>
                  )}
                  
                  {task.expires_at && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Expires: {new Date(task.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {task.completed ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Completed {task.completion_count} time{task.completion_count !== 1 ? 's' : ''}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {new Date(task.completed_at!).toLocaleDateString()}
                        </span>
                      </div>
                      {task.points_reward > 0 && (
                        <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          Earned {task.points_reward} CP
                        </div>
                      )}
                      {task.is_repeatable && task.can_complete_again && (
                        <Button
                          onClick={() => handleCompleteTask(task.public_id)}
                          disabled={completingTask === task.public_id}
                          className="w-full"
                          variant="outline"
                        >
                          {completingTask === task.public_id ? 'Completing...' : 'Complete Again'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleCompleteTask(task.public_id)}
                      disabled={completingTask === task.public_id}
                      className="w-full"
                    >
                      {completingTask === task.public_id ? 'Completing...' : 'Complete Task'}
                    </Button>
                  )}
                  
                  {task.is_repeatable && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Can be completed up to {task.max_completions} times
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          // No tasks available
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No tasks available</h3>
              <p className="text-sm">Check back later for new reward tasks!</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>

    {/* Task Completion Modal */}
    <TaskCompletionModal
      task={taskCompletionModal.task}
      isOpen={taskCompletionModal.isOpen}
      onClose={() => setTaskCompletionModal({ task: null, isOpen: false })}
      onComplete={handleTaskCompletion}
    />
    </>
  );
};

export default Achievements; 