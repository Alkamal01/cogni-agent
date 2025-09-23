import React, { useState, useEffect } from 'react';
import { X, BarChart2, Plus, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../shared';
import studyGroupService from '../../services/studyGroupService';
import { useToast } from '../../hooks/useToast';

interface GroupPollsProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | undefined;
  groupName: string;
  polls?: any[];
  onPollsUpdate?: () => void;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date | null;
  isActive: boolean;
  totalVotes: number;
  hasVoted?: boolean;
  selectedOptionId?: string;
}

const GroupPolls: React.FC<GroupPollsProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  polls: propPolls = [],
  onPollsUpdate
}) => {
  const { toast } = useToast();

  // State for creating a new poll
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '']);
  const [newOptionText, setNewOptionText] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Use polls from props or empty array
  const [polls, setPolls] = useState<Poll[]>([]);

  // Update polls when propPolls changes
  useEffect(() => {
    if (propPolls && propPolls.length > 0) {
      const formattedPolls = propPolls.map(poll => ({
        id: poll.id.toString(),
        question: poll.question,
        options: poll.options.map((option: any) => ({
          id: option.id.toString(),
          text: option.text,
          votes: option.vote_count || 0
        })),
        createdBy: poll.creator?.username || 'Unknown',
        createdAt: new Date(poll.created_at),
        expiresAt: poll.expires_at ? new Date(poll.expires_at) : null,
        isActive: poll.is_active,
        totalVotes: poll.total_votes || 0,
        hasVoted: poll.user_vote_id !== null,
        selectedOptionId: poll.user_vote_id?.toString()
      }));
      setPolls(formattedPolls);
    } else {
      setPolls([]);
    }
  }, [propPolls]);

  const handleAddOption = () => {
    if (newPollOptions.length >= 8) {
      // Maximum 8 options per poll
      return;
    }
    
    if (newOptionText.trim()) {
      setNewPollOptions([...newPollOptions, newOptionText.trim()]);
      setNewOptionText('');
    } else {
      setNewPollOptions([...newPollOptions, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (newPollOptions.length <= 2) {
      // Need at least 2 options
      return;
    }
    
    const updatedOptions = [...newPollOptions];
    updatedOptions.splice(index, 1);
    setNewPollOptions(updatedOptions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...newPollOptions];
    updatedOptions[index] = value;
    setNewPollOptions(updatedOptions);
  };

  const handleCreatePoll = async () => {
    if (!newPollQuestion.trim() || newPollOptions.some(opt => !opt.trim())) {
      return; // Validate all fields are filled
    }

    if (!groupId) {
      toast({
        title: 'Error',
        description: 'Group ID is missing.',
        variant: 'error'
      });
      return;
    }

    try {
      const pollData = {
        question: newPollQuestion.trim(),
        options: newPollOptions.filter(opt => opt.trim()).map(opt => opt.trim()),
        expires_at: expiryDate || undefined
      };

      await studyGroupService.createPoll(String(groupId!), pollData);

      // Refresh polls
      if (onPollsUpdate) {
        onPollsUpdate();
      }

      toast({
        title: 'Success',
        description: 'Poll created successfully!',
        variant: 'success'
      });

      resetPollCreation();
    } catch (error) {
      console.error('Error creating poll:', error);
      toast({
        title: 'Error',
        description: 'Failed to create poll. Please try again.',
        variant: 'error'
      });
    }
  };

  const resetPollCreation = () => {
    setIsCreatingPoll(false);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
    setExpiryDate('');
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!groupId) {
      toast({
        title: 'Error',
        description: 'Group ID is missing.',
        variant: 'error'
      });
      return;
    }

    try {
      await studyGroupService.votePoll(String(groupId!), parseInt(pollId), parseInt(optionId));

      // Refresh polls to get updated vote counts
      if (onPollsUpdate) {
        onPollsUpdate();
      }

      toast({
        title: 'Success',
        description: 'Your vote has been recorded!',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error voting on poll:', error);
      toast({
        title: 'Error',
        description: 'Failed to vote on poll. Please try again.',
        variant: 'error'
      });
    }
  };

  const calculatePercentage = (votes: number, totalVotes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/30">
                <BarChart2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Group Polls</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{groupName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {isCreatingPoll ? (
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New Poll</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Question
                    </label>
                    <input
                      type="text"
                      value={newPollQuestion}
                      onChange={(e) => setNewPollQuestion(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="What would you like to ask the group?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Options
                    </label>
                    <div className="space-y-2">
                      {newPollOptions.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder={`Option ${index + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(index)}
                            disabled={newPollOptions.length <= 2}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                          >
                            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={handleAddOption}
                        disabled={newPollOptions.length >= 8}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={resetPollCreation}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleCreatePoll}
                      disabled={!newPollQuestion.trim() || newPollOptions.some(opt => !opt.trim())}
                    >
                      Create Poll
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 flex justify-end">
                <Button 
                  variant="primary" 
                  className="flex items-center"
                  onClick={() => setIsCreatingPoll(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Poll
                </Button>
              </div>
            )}
            
            <div className="px-6 pb-6 space-y-6">
              {polls.length > 0 ? (
                polls.map((poll) => (
                  <div 
                    key={poll.id}
                    className={`border rounded-lg overflow-hidden ${
                      poll.isActive
                        ? 'border-primary-200 dark:border-primary-800'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className={`px-4 py-3 ${
                      poll.isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {poll.question}
                        </h3>
                        {poll.isActive ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            Closed
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span>Created by {poll.createdBy} on {formatDate(poll.createdAt)}</span>
                        {poll.expiresAt && (
                          <>
                            <span className="mx-2">•</span>
                            <span>
                              {new Date() > poll.expiresAt
                                ? 'Expired on'
                                : 'Expires on'} {formatDate(poll.expiresAt)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      {poll.options.map((option) => (
                        <div key={option.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                              {poll.isActive && !poll.hasVoted ? (
                                <button
                                  onClick={() => handleVote(poll.id, option.id)}
                                  className="mr-3 h-5 w-5 rounded-full border border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 flex items-center justify-center group"
                                >
                                  <div className="h-3 w-3 rounded-full bg-primary-500 dark:bg-primary-400 scale-0 group-hover:scale-100 transition-transform" />
                                </button>
                              ) : (
                                <div className={`mr-3 h-5 w-5 rounded-full border flex items-center justify-center ${
                                  poll.selectedOptionId === option.id
                                    ? 'border-primary-500 dark:border-primary-400'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                  {poll.selectedOptionId === option.id && (
                                    <div className="h-3 w-3 rounded-full bg-primary-500 dark:bg-primary-400" />
                                  )}
                                </div>
                              )}
                              <span className="text-gray-900 dark:text-white flex-1">{option.text}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {calculatePercentage(option.votes, poll.totalVotes)}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 dark:bg-primary-600"
                              style={{ width: `${calculatePercentage(option.votes, poll.totalVotes)}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {option.votes} vote{option.votes !== 1 ? 's' : ''}
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-2 text-sm text-gray-500 dark:text-gray-400">
                        Total: {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No polls yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Create a poll to gather opinions from group members
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GroupPolls; 