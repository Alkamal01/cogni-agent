import React, { useState } from 'react';
import { Button, Input, Textarea, Select } from '../shared';
import { StudySessionParams } from '../../services/studyGroupService';
import { Clock, Users, X } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useToast } from '../../hooks/useToast';

// Custom icons for those not available in lucide-react
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const TagIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
    <line x1="7" y1="7" x2="7.01" y2="7"></line>
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

interface SessionSchedulerProps {
  isOpen: boolean;
  groupId: string;
  groupName: string;
  onSubmit: (sessionData: StudySessionParams) => Promise<void>;
  onClose: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const SessionScheduler: React.FC<SessionSchedulerProps> = ({
  isOpen,
  groupId,
  groupName,
  onSubmit,
  onClose,
  onCancel,
  isLoading = false
}) => {
  const { checkUsageLimit, showUpgradePrompt, subscription } = useSubscription();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<StudySessionParams>({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    maxParticipants: 5,
    topics: []
  });

  const [newTopic, setNewTopic] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const addTopic = () => {
    if (newTopic.trim()) {
      setFormData(prev => ({
      ...prev,
        topics: [...(prev.topics || []), newTopic.trim()]
    }));
    setNewTopic('');
    }
  };

  const removeTopic = (index: number) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Temporary fix: Allow session creation for all users
    // TODO: Fix subscription system to properly recognize Pro users
    console.log('Current subscription plan:', subscription?.plan?.name || 'Free', subscription);

    // Skip session limit check for now - all users can create sessions
    // This will be fixed once the subscription system is properly configured
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (!formData.maxParticipants) newErrors.maxParticipants = 'Max participants is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        duration: 60,
        maxParticipants: 5,
        topics: []
      });
      onClose(); // Close the form after submission
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Schedule a Study Session</h2>
            <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
            <X size={20} />
            </button>
          </div>
          
        <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Session Title
                </label>
            <Input
                  id="title"
                  name="title"
              value={formData.title}
                  onChange={handleChange}
              placeholder="e.g., 'React Hooks Deep Dive'"
              error={errors.title}
              className="w-full"
            />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
            <Textarea
                  id="description"
                  name="description"
              value={formData.description}
                  onChange={handleChange}
              placeholder="What will you cover in this session?"
                  rows={3}
              className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <span className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Date
                </span>
                  </label>
              <Input
                    id="date"
                    name="date"
                type="date"
                value={formData.date}
                    onChange={handleChange}
                error={errors.date}
                className="w-full"
                min={new Date().toISOString().split('T')[0]} // Today or later
              />
                </div>
                
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Time
                </span>
                  </label>
              <Input
                    id="time"
                    name="time"
                type="time"
                value={formData.time}
                    onChange={handleChange}
                error={errors.time}
                className="w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration (minutes)
                  </label>
              <Select
                    id="duration"
                    name="duration"
                value={formData.duration.toString()}
                    onChange={handleChange}
                error={errors.duration}
                className="w-full"
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                    <option value="180">3 hours</option>
              </Select>
                </div>
                
                <div>
                  <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                    Max Participants
                </span>
                  </label>
              <Select
                    id="maxParticipants"
                    name="maxParticipants"
                value={formData.maxParticipants.toString()}
                    onChange={handleChange}
                error={errors.maxParticipants}
                className="w-full"
              >
                <option value="2">2 people</option>
                <option value="3">3 people</option>
                <option value="5">5 people</option>
                <option value="10">10 people</option>
                <option value="15">15 people</option>
                <option value="20">20 people</option>
              </Select>
                </div>
              </div>
              
              <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center">
                <TagIcon className="w-4 h-4 mr-1" />
                Topics (optional)
              </span>
                </label>
            
            <div className="flex mb-2">
              <Input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Add topic"
                className="flex-1 rounded-r-none"
                  />
                  <Button
                    type="button"
                onClick={addTopic}
                    variant="primary"
                size="md"
                    className="rounded-l-none"
                    disabled={!newTopic.trim()}
                  >
                    Add
                  </Button>
                </div>
            
            {formData.topics && formData.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.topics.map((topic, index) => (
                  <span
                      key={index}
                    className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm flex items-center"
                    >
                    {topic}
                      <button
                        type="button"
                      onClick={() => removeTopic(index)}
                      className="ml-1 text-primary-500 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                      <X size={14} />
                      </button>
                  </span>
                  ))}
              </div>
            )}
            </div>
            
          <div className="flex justify-end space-x-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
                Cancel
              </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
            >
              <CheckIcon className="mr-1" />
                Schedule Session
              </Button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default SessionScheduler; 