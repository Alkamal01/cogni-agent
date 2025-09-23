import React, { useState, useEffect, MouseEvent } from 'react';
import { IoClose, IoNotifications, IoInformationCircle, IoAlertCircle, IoCheckmarkCircle } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import notificationService, { Notification } from '../../services/notificationService';

interface NotificationPanelProps {
  onClose?: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications();
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If integrated with navbar, we're always visible
    if (onClose) {
      fetchNotifications();
    } else {
      // Only fetch if standalone and panel is shown
      if (showPanel) {
        fetchNotifications();
      }
    }
    
    // Fetch notifications every 30 seconds if panel is visible
    const shouldPoll = onClose || showPanel;
    let intervalId: NodeJS.Timeout | null = null;
    
    if (shouldPoll) {
      intervalId = setInterval(fetchNotifications, 30000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [onClose, showPanel]);

  const togglePanel = () => {
    const newState = !showPanel;
    setShowPanel(newState);
    
    // If we're closing the panel and we have an onClose prop, call it
    if (!newState && onClose) {
      onClose();
    }
  };

  const removeNotification = async (id: number) => {
    try {
      const result = await notificationService.deleteNotification(id);
      if (result.success) {
    setNotifications(prev => prev.filter(n => n.id !== id));
        fetchNotifications(); // Refresh unread count
      }
    } catch (error) {
      console.error('Failed to remove notification:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const result = await notificationService.markAsRead(id);
      if (result) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const result = await notificationService.clearAllNotifications();
      if (result.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead();
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <IoInformationCircle className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <IoCheckmarkCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <IoAlertCircle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <IoAlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <IoInformationCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500';
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500';
      case 'warning':
        return 'border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-500';
      case 'error':
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      {/* If onClose is provided, we're rendering in the navbar, so don't show the fixed button */}
      {!onClose && (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={togglePanel}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-[210]"
        animate={{ rotate: showPanel ? 45 : 0 }}
      >
        {showPanel ? (
          <IoClose className="h-6 w-6" />
        ) : (
          <div className="relative">
            <IoNotifications className="h-6 w-6" />
              {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        )}
      </motion.button>
      )}

      <AnimatePresence>
        {(showPanel || onClose) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`bg-white dark:bg-blue-950 rounded-xl shadow-2xl border border-gray-100 dark:border-blue-900 overflow-hidden z-[210] ${
              onClose 
                ? "absolute top-16 right-4 w-[90vw] max-w-sm md:w-96" // Positioned below navbar
                : "fixed bottom-20 right-4 w-[90vw] max-w-sm md:right-6 md:w-96" // Mobile-friendly sizing
            }`}
          >
            <div className="p-4 border-b border-gray-200 dark:border-blue-900/50 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                  <IoNotifications className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                  Notifications
                </h2>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400 px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-800/40">
                      {unreadCount} New
                </span>
                  )}
                  {onClose && (
                    <button 
                      onClick={onClose}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <IoClose className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p>Loading notifications...</p>
                </div>
              ) : (
              <AnimatePresence>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <motion.div 
                      key={notification.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                        className={`p-4 m-3 rounded-lg ${getNotificationStyles(notification.type)} ${!notification.is_read ? 'ring-2 ring-offset-1 ring-primary-300 dark:ring-primary-700' : ''}`}
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(notification.id);
                          }
                        }}
                    >
                      <div className="flex">
                        <div className="flex-shrink-0 mr-3">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 pr-6">
                          <p className="text-sm text-gray-700 dark:text-gray-200">
                            {notification.content}
                          </p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTimestamp(notification.timestamp)}
                              </p>
                              {!notification.is_read && (
                                <span className="inline-block h-2 w-2 rounded-full bg-primary-500"></span>
                              )}
                            </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                            onClick={(e: MouseEvent<HTMLButtonElement>) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 absolute top-4 right-4"
                        >
                          <IoClose className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 text-center text-gray-500 dark:text-gray-400"
                  >
                      <p>No notifications</p>
                  </motion.div>
                )}
              </AnimatePresence>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-blue-900/50 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30">
                <div className="flex space-x-2">
                  <button 
                    onClick={clearAllNotifications}
                    className="flex-1 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    Clear all
                  </button>
                  {unreadCount > 0 && (
                <button 
                      onClick={markAllAsRead}
                      className="flex-1 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                      Mark all as read
                </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NotificationPanel; 