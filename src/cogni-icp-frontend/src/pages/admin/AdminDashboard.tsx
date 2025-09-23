import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { IoShield, IoLogOut, IoPeople, IoCheckmarkCircle, IoCalendar, IoWarning, IoAdd, IoPencil, IoTrash, IoSearch, IoFilter, IoRefresh, IoStatsChart, IoTime, IoTrendingUp, IoEye, IoBan, IoCheckmark, IoClose } from 'react-icons/io5';
import { Button, Card } from '../../components/shared';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { adminApi, AdminApiError } from '../../utils/adminApi';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'user' | 'tutor' | 'admin';
  joinDate: string;
  lastActive: string;
  location?: string;
  subscription: 'free' | 'pro' | 'enterprise';
  totalSessions: number;
  connectionCount: number;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday?: number;
  suspendedUsers?: number;
  paidUsers: number;
  proUsers?: number;
  enterpriseUsers?: number;
  tutors: number;
  admins: number;
}

interface AnalyticsData {
  userGrowth: Array<{ date: string; users: number; total: number }>;
  statusDistribution: Array<{ name: string; value: number; count: number; color?: string }>;
  subscriptionDistribution: Array<{ name: string; value: number; count: number; color?: string }>;
  roleDistribution: Array<{ name: string; value: number; count: number; color?: string }>;
  recentActivity: Array<{ action: string; user: string; timestamp: string; status: 'success' | 'warning' | 'error' }>;
  stats: {
    totalUsers: number;
    activeUsers: number;
    paidUsers: number;
    tutors: number;
    admins: number;
  };
}

interface RewardTask {
  id: string;
  public_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  token_reward: number;
  points_reward: number;
  requirements: string;
  is_active: boolean;
  is_repeatable: boolean;
  max_completions: number;
  expires_at?: string;
  created_at: string;
  metadata?: any;
}

const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [newSubscription, setNewSubscription] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [generatedPasswordUser, setGeneratedPasswordUser] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'rewards'>('overview');
  const [tasks, setTasks] = useState<RewardTask[]>([]);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'General',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    token_reward: 10,
    points_reward: 100,
    requirements: '',
    is_repeatable: false,
    max_completions: 1,
    expires_at: '',
    metadata: ''
  });

  // User deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // User editing state
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Task editing state
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<RewardTask | null>(null);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

  const { logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Generate mock analytics data (fallback if real data is not available)
  const generateAnalyticsData = (users: User[]): AnalyticsData => {
    const now = new Date();
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 10) + 1,
        total: Math.floor(Math.random() * 50) + users.length - 25
      };
    });

    const statusDistribution = [
      { name: 'Active', value: users.filter(u => u.status === 'active').length, count: users.filter(u => u.status === 'active').length, color: '#10B981' },
      { name: 'Inactive', value: users.filter(u => u.status === 'inactive').length, count: users.filter(u => u.status === 'inactive').length, color: '#F59E0B' },
      { name: 'Suspended', value: users.filter(u => u.status === 'suspended').length, count: users.filter(u => u.status === 'suspended').length, color: '#EF4444' }
    ];

    const subscriptionDistribution = [
      { name: 'Free', value: users.filter(u => u.subscription === 'free').length, count: users.filter(u => u.subscription === 'free').length, color: '#6B7280' },
      { name: 'Pro', value: users.filter(u => u.subscription === 'pro').length, count: users.filter(u => u.subscription === 'pro').length, color: '#3B82F6' },
      { name: 'Enterprise', value: users.filter(u => u.subscription === 'enterprise').length, count: users.filter(u => u.subscription === 'enterprise').length, color: '#8B5CF6' }
    ];

    const roleDistribution = [
      { name: 'Users', value: users.filter(u => u.role === 'user').length, count: users.filter(u => u.role === 'user').length, color: '#6B7280' },
      { name: 'Tutors', value: users.filter(u => u.role === 'tutor').length, count: users.filter(u => u.role === 'tutor').length, color: '#10B981' },
      { name: 'Admins', value: users.filter(u => u.role === 'admin').length, count: users.filter(u => u.role === 'admin').length, color: '#EF4444' }
    ];

    const recentActivity = [
      { action: 'User registered', user: 'John Doe', timestamp: '2 minutes ago', status: 'success' as const },
      { action: 'User suspended', user: 'Jane Smith', timestamp: '1 hour ago', status: 'warning' as const },
      { action: 'Password reset', user: 'Bob Johnson', timestamp: '3 hours ago', status: 'success' as const },
      { action: 'Failed login attempt', user: 'Unknown', timestamp: '5 hours ago', status: 'error' as const },
      { action: 'User verified email', user: 'Alice Brown', timestamp: '1 day ago', status: 'success' as const }
    ];

    return {
      userGrowth: last30Days,
      statusDistribution,
      subscriptionDistribution,
      roleDistribution,
      recentActivity,
      stats: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        paidUsers: users.filter(u => u.subscription === 'pro' || u.subscription === 'enterprise').length,
        tutors: users.filter(u => u.role === 'tutor').length,
        admins: users.filter(u => u.role === 'admin').length
      }
    };
  };

  useEffect(() => {
    const loadAdminData = async () => {
      setIsLoading(true);
      try {
        await adminApi.verifyAccess();
        const [statsData, usersData, analyticsData] = await Promise.all([
          adminApi.getStats(),
          adminApi.getUsers({ per_page: 50 }),
          adminApi.getAnalytics()
        ]);
        
        // Use analytics data for stats if available, otherwise fallback to stats endpoint
        const finalStats = (analyticsData as any)?.stats || (statsData as any).stats;
        setStats(finalStats);
        const userData = (usersData as any).users || [];
        setUsers(userData);
        setFilteredUsers(userData);
        setAnalytics(analyticsData as AnalyticsData);
      } catch (error) {
        toast({ title: 'Loading Failed', description: 'Failed to load admin data.', variant: 'error' });
        navigate('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };
    loadAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'rewards') {
      loadRewardTasks();
    }
  }, [activeTab]);

  const loadRewardTasks = async () => {
    try {
      const response = await adminApi.getTasks();
      setTasks((response as any).tasks || []);
    } catch (error) {
      toast({ title: 'Failed to Load Tasks', description: 'Could not load reward tasks.', variant: 'error' });
    }
  };

  useEffect(() => {
    let filtered = users;
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    if (subscriptionFilter !== 'all') {
      filtered = filtered.filter(user => user.subscription === subscriptionFilter);
    }
    setFilteredUsers(filtered);
  }, [users, searchQuery, statusFilter, roleFilter, subscriptionFilter]);

  const handleCreateTask = async () => {
    setIsCreatingTask(true);
    try {
      // Format data to match smart contract structure
      const dataToSend = {
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        difficulty: newTask.difficulty,
        token_reward: newTask.token_reward,
        points_reward: newTask.points_reward,
        requirements: newTask.requirements,
        is_repeatable: newTask.is_repeatable,
        max_completions: newTask.max_completions,
        expires_at: newTask.expires_at ? parseInt(newTask.expires_at) : 0,
        metadata: newTask.metadata || '',
        public_id: `task_${Date.now()}` // For backend compatibility
      };
      
      const response = await adminApi.createTask(dataToSend);
      setTasks([...tasks, (response as any).task]);
      setShowCreateTaskModal(false);
      setNewTask({
        title: '', description: '', category: 'General', difficulty: 'medium' as 'easy' | 'medium' | 'hard',
        token_reward: 10, points_reward: 100, requirements: '',
        is_repeatable: false, max_completions: 1, expires_at: '', metadata: ''
      });
      toast({ title: 'Task Created', description: 'Reward task created successfully.', variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to Create Task', description: (error as AdminApiError).message, variant: 'error' });
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await adminApi.deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
      toast({ title: 'Task Deleted', description: 'The task has been successfully deleted.', variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to Delete Task', description: (error as AdminApiError).message, variant: 'error' });
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: boolean) => {
    try {
      await adminApi.updateTask(taskId, { is_active: !currentStatus });
      loadRewardTasks();
      toast({ title: 'Task Updated', description: `Task status changed to ${!currentStatus ? 'Active' : 'Inactive'}.`, variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to Update Task', description: (error as AdminApiError).message, variant: 'error' });
    }
  };

  const handleEditTask = (task: RewardTask) => {
    setEditingTask(task);
    setShowEditTaskModal(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    
    setIsUpdatingTask(true);
    try {
      const response = await adminApi.updateTask(editingTask.public_id, {
        title: editingTask.title,
        description: editingTask.description,
        category: editingTask.category,
        difficulty: editingTask.difficulty,
        token_reward: editingTask.token_reward,
        points_reward: editingTask.points_reward,
        requirements: editingTask.requirements,
        is_repeatable: editingTask.is_repeatable,
        max_completions: editingTask.max_completions,
        expires_at: editingTask.expires_at,
        metadata: editingTask.metadata || {}
      });
      
      // Reload tasks to get updated data
      loadRewardTasks();
      
      setShowEditTaskModal(false);
      setEditingTask(null);
      toast({ title: 'Task Updated', description: 'Task information updated successfully.', variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to Update Task', description: (error as AdminApiError).message, variant: 'error' });
    } finally {
      setIsUpdatingTask(false);
    }
  };

  // User editing functions
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    setIsUpdatingUser(true);
    try {
      // Update user status if changed
      if (editingUser.status !== users.find(u => u.id === editingUser.id)?.status) {
        await adminApi.updateUserStatus(editingUser.id, editingUser.status);
      }
      
      // Update user role if changed
      if (editingUser.role !== users.find(u => u.id === editingUser.id)?.role) {
        await adminApi.updateUserRole(editingUser.id, editingUser.role);
      }
      
      // Update user subscription if changed
      if (editingUser.subscription !== users.find(u => u.id === editingUser.id)?.subscription) {
        await adminApi.updateUserSubscription(editingUser.id, editingUser.subscription);
      }
      
      // Reload users to get updated data
      const usersData = await adminApi.getUsers({ per_page: 50 });
      const userData = (usersData as any).users || [];
      setUsers(userData);
      setFilteredUsers(userData);
      
      setShowEditUserModal(false);
      setEditingUser(null);
      toast({ title: 'User Updated', description: 'User information updated successfully.', variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to Update User', description: (error as AdminApiError).message, variant: 'error' });
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // User deletion functions
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      await adminApi.deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setFilteredUsers(filteredUsers.filter(u => u.id !== userToDelete.id));
      toast({ 
        title: 'User Deleted', 
        description: `${userToDelete.name} has been permanently deleted.`, 
        variant: 'success' 
      });
    } catch (error) {
      toast({ 
        title: 'Delete Failed', 
        description: (error as AdminApiError).message, 
        variant: 'error' 
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    setIsDeleting(true);
    try {
      await adminApi.bulkUserAction(selectedUsers, 'delete');
      setUsers(users.filter(u => !selectedUsers.includes(u.id)));
      setFilteredUsers(filteredUsers.filter(u => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
      setShowBulkActions(false);
      toast({ 
        title: 'Bulk Delete Complete', 
        description: `${selectedUsers.length} users have been deleted.`, 
        variant: 'success' 
      });
    } catch (error) {
      toast({ 
        title: 'Bulk Delete Failed', 
        description: (error as AdminApiError).message, 
        variant: 'error' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    logout();
    navigate('/admin/login');
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Enhanced Header */}
        <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <img src="/cognilogo.png" alt="CogniEdufy" className="h-8 w-8" />
                  <h1 className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                </div>
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <IoTime className="h-4 w-4" />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="flex items-center space-x-2"
                >
                  <IoRefresh className="h-4 w-4" />
                  <span>Refresh</span>
                </Button>
                <Button variant="secondary" onClick={handleLogout}>
                  <IoLogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Enhanced Stats Cards */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8"
            >
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalUsers}</p>
                  </div>
                  <IoPeople className="h-8 w-8 text-blue-600" />
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Users</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.activeUsers}</p>
                  </div>
                  <IoCheckmarkCircle className="h-8 w-8 text-green-600" />
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">New Today</p>
                    <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats.newUsersToday}</p>
                  </div>
                  <IoCalendar className="h-8 w-8 text-yellow-600" />
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Suspended</p>
                    <p className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.suspendedUsers}</p>
                  </div>
                  <IoWarning className="h-8 w-8 text-red-600" />
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Paid Users</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.paidUsers || 0}</p>
                  </div>
                  <IoCheckmark className="h-8 w-8 text-purple-600" />
                </div>
              </Card>
            </motion.div>
          )}

          {/* Enhanced Navigation Tabs */}
          <div className="mb-8">
            <nav className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              {[
                { id: 'overview', label: 'Overview', icon: IoStatsChart },
                { id: 'users', label: 'Users', icon: IoPeople },
                { id: 'analytics', label: 'Analytics', icon: IoTrendingUp },
                { id: 'rewards', label: 'Rewards', icon: IoAdd }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Growth Chart */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                    <IoTrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    User Growth (30 Days)
                  </h3>
                  {analytics && analytics.userGrowth && (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="total" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="users" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                {/* User Status Distribution */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                    <IoStatsChart className="h-5 w-5 mr-2 text-green-600" />
                    User Status Distribution
                  </h3>
                  {analytics && analytics.statusDistribution && (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics.statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, count }) => `${name}: ${count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.statusDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <IoTime className="h-5 w-5 mr-2 text-purple-600" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {analytics?.recentActivity?.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.status === 'success' ? 'bg-green-500' :
                          activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm font-medium">{activity.action}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">- {activity.user}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown'}
                      </span>
                    </div>
                  )) || (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No recent activity
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Subscription Distribution */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Subscription Distribution</h3>
                  {analytics && analytics.subscriptionDistribution && (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics.subscriptionDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, count }) => `${name}: ${count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.subscriptionDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                {/* Role Distribution */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Role Distribution</h3>
                  {analytics && analytics.roleDistribution && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.roleDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Enhanced User Management Header */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
                  <p className="text-gray-600 dark:text-gray-400">Manage and monitor user accounts</p>
                </div>
                
                {/* Bulk Actions */}
                {selectedUsers.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedUsers.length} selected
                    </span>
                    <Button
                      variant="outline"
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      <IoTrash className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedUsers([])}
                    >
                      <IoClose className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              {/* Enhanced Filters */}
              <Card className="p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="tutor">Tutor</option>
                    <option value="admin">Admin</option>
                  </select>
                  
                  <select
                    value={subscriptionFilter}
                    onChange={(e) => setSubscriptionFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Subscriptions</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </Card>
              
              {/* Enhanced Users Table */}
              <Card className="overflow-hidden">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading users...</p>
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                              onChange={handleSelectAll}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subscription</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={() => handleSelectUser(user.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                    {user.avatar ? (
                                      <img
                                        className="h-10 w-10 rounded-full object-cover"
                                        src={user.avatar}
                                        alt=""
                                      />
                                    ) : (
                                      <span className="text-sm font-medium text-white">
                                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                user.status === 'inactive' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                user.role === 'tutor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.subscription === 'enterprise' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                user.subscription === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {user.subscription}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(user.joinDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleEditUser(user)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  title="Edit User"
                                >
                                  <IoPencil className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Delete User"
                                >
                                  <IoTrash className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => {/* View user details */}}
                                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                                  title="View Details"
                                >
                                  <IoEye className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <IoPeople className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium mb-2">No users found</p>
                    <p>No users match your current search and filter criteria.</p>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {activeTab === 'rewards' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Reward Tasks</h2>
                <Button onClick={() => setShowCreateTaskModal(true)}><IoAdd className="mr-2" />Create Task</Button>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                {tasks.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {tasks.map(task => (
                      <div key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {task.token_reward} tokens
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                task.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {task.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{task.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>Category: {task.category}</span>
                              <span>Difficulty: {task.difficulty}</span>
                              <span>Points: {task.points_reward}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleToggleTaskStatus(task.public_id, task.is_active)}
                              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title={task.is_active ? 'Deactivate Task' : 'Activate Task'}
                            >
                              <IoCheckmarkCircle className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditTask(task)}
                              className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                              title="Edit Task"
                            >
                              <IoPencil className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteTask(task.public_id)}
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete Task"
                            >
                              <IoTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <p>No tasks created yet. Create your first task!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {showCreateTaskModal && (
          <motion.div
            key="create-task-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg"
            >
              <h3 className="text-lg font-bold mb-4">Create New Reward Task</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateTask(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                    <input 
                      type="text" 
                      placeholder="Task title" 
                      value={newTask.title} 
                      onChange={e => setNewTask({...newTask, title: e.target.value})} 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <textarea 
                      placeholder="Task description" 
                      value={newTask.description} 
                      onChange={e => setNewTask({...newTask, description: e.target.value})} 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                      rows={3}
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                      <select 
                        value={newTask.category} 
                        onChange={e => setNewTask({...newTask, category: e.target.value})} 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="General">General</option>
                        <option value="Learning">Learning</option>
                        <option value="Social">Social</option>
                        <option value="Achievement">Achievement</option>
                        <option value="Challenge">Challenge</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
                      <select 
                        value={newTask.difficulty} 
                        onChange={e => setNewTask({...newTask, difficulty: e.target.value as 'easy' | 'medium' | 'hard'})} 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Token Reward</label>
                      <input 
                        type="number" 
                        placeholder="Tokens to award" 
                        value={newTask.token_reward || ''} 
                        onChange={e => setNewTask({...newTask, token_reward: parseInt(e.target.value) || 0})} 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                        min="1"
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Points Reward</label>
                      <input 
                        type="number" 
                        placeholder="Points to award" 
                        value={newTask.points_reward || ''} 
                        onChange={e => setNewTask({...newTask, points_reward: parseInt(e.target.value) || 0})} 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                        min="0"
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Requirements</label>
                    <textarea 
                      placeholder="Task requirements or instructions" 
                      value={newTask.requirements} 
                      onChange={e => setNewTask({...newTask, requirements: e.target.value})} 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                      rows={2}
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Completions</label>
                      <input 
                        type="number" 
                        placeholder="Maximum completions allowed" 
                        value={newTask.max_completions || ''} 
                        onChange={e => setNewTask({...newTask, max_completions: parseInt(e.target.value) || 1})} 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                        min="1"
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expires At (Epoch)</label>
                      <input 
                        type="number" 
                        placeholder="0 for no expiration" 
                        value={newTask.expires_at || ''} 
                        onChange={e => setNewTask({...newTask, expires_at: e.target.value})} 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Metadata (Optional)</label>
                    <textarea 
                      placeholder="Additional metadata in JSON format" 
                      value={newTask.metadata || ''} 
                      onChange={e => setNewTask({...newTask, metadata: e.target.value})} 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="is_repeatable" 
                      checked={newTask.is_repeatable} 
                      onChange={e => setNewTask({...newTask, is_repeatable: e.target.checked})} 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_repeatable" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Task is repeatable
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateTaskModal(false)}>Cancel</Button>
                    <Button type="submit" disabled={isCreatingTask}>
                      {isCreatingTask ? 'Creating...' : 'Create Task'}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && editingUser && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg"
            >
              <h3 className="text-lg font-bold mb-4">Edit User: {editingUser.name}</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({...editingUser, status: e.target.value as 'active' | 'inactive' | 'suspended'})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value as 'user' | 'tutor' | 'admin'})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="user">User</option>
                      <option value="tutor">Tutor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subscription
                    </label>
                    <select
                      value={editingUser.subscription}
                      onChange={(e) => setEditingUser({...editingUser, subscription: e.target.value as 'free' | 'pro' | 'enterprise'})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowEditUserModal(false);
                        setEditingUser(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isUpdatingUser}
                    >
                      {isUpdatingUser ? 'Updating...' : 'Update User'}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Task Modal */}
        {showEditTaskModal && editingTask && (
          <motion.div
            key="edit-task-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-bold mb-4">Edit Task: {editingTask.title}</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateTask(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                    <input 
                      type="text" 
                      placeholder="Task title" 
                      value={editingTask.title} 
                      onChange={e => setEditingTask({...editingTask, title: e.target.value})} 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <textarea 
                      placeholder="Task description" 
                      value={editingTask.description} 
                      onChange={e => setEditingTask({...editingTask, description: e.target.value})} 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                      rows={3}
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                      <select 
                        value={editingTask.category} 
                        onChange={e => setEditingTask({...editingTask, category: e.target.value})} 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="General">General</option>
                        <option value="Learning">Learning</option>
                        <option value="Social">Social</option>
                        <option value="Achievement">Achievement</option>
                        <option value="Challenge">Challenge</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
                      <select 
                        value={editingTask.difficulty} 
                        onChange={e => setEditingTask({...editingTask, difficulty: e.target.value as 'easy' | 'medium' | 'hard'})} 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Token Reward</label>
                      <input 
                        type="number" 
                        placeholder="Tokens to award" 
                        value={editingTask.token_reward || ''} 
                        onChange={e => setEditingTask({...editingTask, token_reward: parseInt(e.target.value) || 0})} 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                        min="1"
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Points Reward</label>
                      <input 
                        type="number" 
                        placeholder="Points to award" 
                        value={editingTask.points_reward || ''} 
                        onChange={e => setEditingTask({...editingTask, points_reward: parseInt(e.target.value) || 0})} 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                        min="0"
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Requirements</label>
                    <textarea 
                      placeholder="Task requirements or instructions" 
                      value={editingTask.requirements} 
                      onChange={e => setEditingTask({...editingTask, requirements: e.target.value})} 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                      rows={2}
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Completions</label>
                      <input 
                        type="number" 
                        placeholder="Maximum completions allowed" 
                        value={editingTask.max_completions} 
                        onChange={e => setEditingTask({...editingTask, max_completions: parseInt(e.target.value) || 1})} 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                        min="1"
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expires At (Epoch)</label>
                      <input 
                        type="number" 
                        placeholder="0 for no expiration" 
                        value={editingTask.expires_at || ''} 
                        onChange={e => setEditingTask({...editingTask, expires_at: e.target.value})} 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Metadata (Optional)</label>
                    <textarea 
                      placeholder="Additional metadata in JSON format" 
                      value={typeof editingTask.metadata === 'string' ? editingTask.metadata : JSON.stringify(editingTask.metadata || {}, null, 2)} 
                      onChange={e => setEditingTask({...editingTask, metadata: e.target.value})} 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="edit_is_repeatable" 
                      checked={editingTask.is_repeatable} 
                      onChange={e => setEditingTask({...editingTask, is_repeatable: e.target.checked})} 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="edit_is_repeatable" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Task is repeatable
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowEditTaskModal(false);
                        setEditingTask(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isUpdatingTask}
                    >
                      {isUpdatingTask ? 'Updating...' : 'Update Task'}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}


        {/* Delete User Confirmation Modal */}
        {showDeleteModal && userToDelete && (
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <IoWarning className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Delete User Account
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Are you sure you want to permanently delete <strong>{userToDelete.name}</strong>? 
                  This action cannot be undone and will remove all user data.
                </p>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setUserToDelete(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={confirmDeleteUser}
                    disabled={isDeleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </div>
                    ) : (
                      'Delete User'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </>
  );
};

export default AdminDashboard; 