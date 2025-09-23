import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { CheckCircle, X, Clock, Users, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '../shared';
import { motion } from 'framer-motion';

// Types and interfaces
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  creator: {
    id: string;
    name: string;
  };
  createdAt: string;
  dueDate?: string;
  tags: string[];
}

interface TaskManagerProps {
  sessionId: number;
  collaborators?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
}

const TaskManager: React.FC<TaskManagerProps> = ({ 
  sessionId, 
  collaborators = [] 
}) => {
  const { user } = useAuth();
  const socket = useSocket();
  
  // States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'my-tasks' | 'unassigned'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'review' | 'completed';
    priority: 'low' | 'medium' | 'high';
    tags: string[];
    dueDate?: string;
    assignee?: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    tags: []
  });
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load initial tasks or connect to socket for real-time updates
  useEffect(() => {
    if (socket) {
      // Listen for task updates from other collaborators
      socket.on('task-created', (task: Task) => {
        setTasks(prev => [...prev, task]);
      });

      socket.on('task-updated', (updatedTask: Task) => {
        setTasks(prev => 
          prev.map(task => task.id === updatedTask.id ? updatedTask : task)
        );
      });

      socket.on('task-deleted', (taskId: string) => {
        setTasks(prev => prev.filter(task => task.id !== taskId));
      });

      // Load initial tasks for this session
      socket.emit('get-tasks', { sessionId });

      socket.on('tasks-list', (tasksList: Task[]) => {
        setTasks(tasksList);
      });

      // Cleanup on unmount
      return () => {
        socket.off('task-created');
        socket.off('task-updated');
        socket.off('task-deleted');
        socket.off('tasks-list');
      };
    } else {
      // Mock data for development
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Research neural network architectures',
          description: 'Find and summarize recent papers on CNN architectures for image recognition',
          status: 'todo',
          priority: 'high',
          creator: {
            id: '1',
            name: 'John Doe'
          },
          assignee: {
            id: '1',
            name: 'John Doe'
          },
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
          tags: ['research', 'neural-networks']
        },
        {
          id: '2',
          title: 'Create data preprocessing pipeline',
          description: 'Implement data normalization and augmentation for training dataset',
          status: 'in-progress',
          priority: 'medium',
          creator: {
            id: '2',
            name: 'Jane Smith'
          },
          assignee: {
            id: '2',
            name: 'Jane Smith'
          },
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
          tags: ['data-processing', 'implementation']
        },
        {
          id: '3',
          title: 'Design experiment methodology',
          description: 'Outline evaluation metrics and experimental setup',
          status: 'completed',
          priority: 'medium',
          creator: {
            id: '3',
            name: 'Alice Johnson'
          },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          tags: ['planning', 'methodology']
        }
      ];
      
      setTasks(mockTasks);
    }
  }, [socket, sessionId]);

  // Filter tasks based on current filters and search query
  const filteredTasks = tasks.filter(task => {
    // Filter by status
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }
    
    // Filter by assignment
    if (filter === 'my-tasks' && (!task.assignee || task.assignee.id !== user?.id?.toString())) {
      return false;
    }
    
    if (filter === 'unassigned' && task.assignee) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // Create a new task
  const handleCreateTask = () => {
    if (!newTask.title.trim()) return;
    
    const task: Task = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      creator: {
        id: user?.id?.toString() || '0',
        name: user?.name || 'Anonymous'
      },
      assignee: newTask.assignee,
      createdAt: new Date().toISOString(),
      dueDate: newTask.dueDate,
      tags: newTask.tags
    };
    
    // Add to local state
    setTasks(prev => [...prev, task]);
    
    // Reset form
    setNewTask({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      tags: []
    });
    
    setIsAddingTask(false);
    
    // Emit to other collaborators
    if (socket) {
      socket.emit('create-task', { sessionId, task });
    }
  };

  // Update a task
  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => 
      prev.map(task => task.id === updatedTask.id ? updatedTask : task)
    );
    
    if (socket) {
      socket.emit('update-task', { sessionId, task: updatedTask });
    }
    
    setEditingTaskId(null);
  };

  // Delete a task
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    
    if (socket) {
      socket.emit('delete-task', { sessionId, taskId });
    }
  };

  // Update task status
  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;
    
    const updatedTask = { ...taskToUpdate, status: newStatus };
    handleUpdateTask(updatedTask);
  };

  // Assign task to user
  const handleAssignTask = (taskId: string, userId: string, userName: string) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;
    
    const updatedTask = { 
      ...taskToUpdate, 
      assignee: { 
        id: userId, 
        name: userName 
      } 
    };
    
    handleUpdateTask(updatedTask);
  };

  // Add tag to task
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    setNewTask(prev => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()]
    }));
    
    setNewTag('');
  };

  // Remove tag from task
  const handleRemoveTag = (tagToRemove: string) => {
    setNewTask(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Get task priority color
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 dark:text-red-400';
      case 'medium':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'low':
        return 'text-green-500 dark:text-green-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  // Get task status color
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900 rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
          Task Manager
        </h2>
        <Button
          size="sm"
          variant={isAddingTask ? "outline" : "primary"}
          onClick={() => setIsAddingTask(!isAddingTask)}
          icon={isAddingTask ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        >
          {isAddingTask ? 'Cancel' : 'Add Task'}
        </Button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by</p>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All Tasks
            </Button>
            <Button
              size="sm"
              variant={filter === 'my-tasks' ? 'primary' : 'outline'}
              onClick={() => setFilter('my-tasks')}
            >
              My Tasks
            </Button>
            <Button
              size="sm"
              variant={filter === 'unassigned' ? 'primary' : 'outline'}
              onClick={() => setFilter('unassigned')}
            >
              Unassigned
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
          <div className="flex space-x-2 flex-wrap">
            <Button
              size="sm"
              variant={statusFilter === 'all' ? 'primary' : 'outline'}
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'todo' ? 'primary' : 'outline'}
              onClick={() => setStatusFilter('todo')}
            >
              To Do
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'in-progress' ? 'primary' : 'outline'}
              onClick={() => setStatusFilter('in-progress')}
            >
              In Progress
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'review' ? 'primary' : 'outline'}
              onClick={() => setStatusFilter('review')}
            >
              Review
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'completed' ? 'primary' : 'outline'}
              onClick={() => setStatusFilter('completed')}
            >
              Completed
            </Button>
          </div>
        </div>
      </div>

      {/* Task creation form */}
      {isAddingTask && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 border-b border-gray-200 dark:border-gray-800"
        >
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Create New Task</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Task title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Describe the task"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={newTask.dueDate ? new Date(newTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assignee (Optional)
              </label>
              <select
                value={newTask.assignee?.id || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (selectedId) {
                    const selectedCollaborator = collaborators.find(c => c.id === selectedId);
                    setNewTask({ 
                      ...newTask, 
                      assignee: selectedCollaborator ? 
                        { id: selectedCollaborator.id, name: selectedCollaborator.name } : 
                        undefined 
                    });
                  } else {
                    setNewTask({ ...newTask, assignee: undefined });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Unassigned</option>
                {collaborators.map(collaborator => (
                  <option key={collaborator.id} value={collaborator.id}>
                    {collaborator.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-l-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-l-none"
                  onClick={handleAddTag}
                >
                  Add
                </Button>
              </div>
              
              {newTask.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {newTask.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                    >
                      {tag}
                      <button
                        type="button"
                        className="ml-1 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => setIsAddingTask(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleCreateTask}
                disabled={!newTask.title.trim()}
              >
                Create Task
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Task search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="Search tasks..."
        />
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tasks found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {searchQuery 
                ? 'Try a different search term' 
                : isAddingTask 
                  ? 'Create your first task' 
                  : 'Click the "Add Task" button to create a new task'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map(task => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status === 'todo' ? 'To Do' : 
                     task.status === 'in-progress' ? 'In Progress' : 
                     task.status === 'review' ? 'Review' : 'Completed'}
                  </span>
                </div>
                
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {task.description}
                </p>
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 mr-1">Priority:</span>
                    <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 mr-1">Assigned to:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {task.assignee ? task.assignee.name : 'Unassigned'}
                    </span>
                  </div>
                  
                  {task.dueDate && (
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400 mr-1" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 mr-1">Created by:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {task.creator.name}
                    </span>
                  </div>
                </div>
                
                {task.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {task.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                      className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      Delete
                    </Button>
                    
                    {!task.assignee && (
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => handleAssignTask(task.id, user?.id?.toString() || '0', user?.name || 'Me')}
                      >
                        Assign to me
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager; 