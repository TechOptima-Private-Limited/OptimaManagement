import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { notificationAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { registerServiceWorker, subscribeUser } from '../../utils/pushNotification';
import api from '../../services/api';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread'

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (showDropdown) {
        fetchNotifications();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [filter, showDropdown]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = filter === 'unread' ? { unread_only: true } : {};
      const response = await notificationAPI.getNotifications(params);

      setNotifications(response.data.results || []);
      if (response.data.unread_count !== undefined) {
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // For development, show some static data if API fails
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);

      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);

      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

      // Update unread count if deleted notification was unread
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }

    // Close dropdown
    setShowDropdown(false);
  };

  const handleEnableNotifications = async () => {
    try {
      const registration = await registerServiceWorker();
      if (!registration) {
        toast.error('Service Worker registration failed');
        return;
      }

      const subscription = await subscribeUser(registration);
      if (!subscription) {
        toast.error('Failed to subscribe to push notifications. Check browser permissions.');
        return;
      }

      console.log('Sending subscription to backend:', subscription);

      // Send subscription to backend using our standard api client
      // NEW: Pointing to our custom JWT-aware endpoint
      const response = await api.post('/notifications/save-webpush/', {
        subscription: subscription,
        browser: navigator.userAgent,
        status: true
      });

      if (response.status === 200 || response.status === 201) {
        toast.success('Desktop notifications enabled!');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      toast.error(`Failed to enable desktop notifications: ${errorMsg}`);
    }
  };

  const NotificationItem = ({ notification }) => {
    const getNotificationIcon = (type) => {
      switch (type) {
        case 'ATTENDANCE_EDIT_REQUEST':
          return '🕐';
        case 'ATTENDANCE_EDIT_APPROVED':
          return '✅';
        case 'ATTENDANCE_EDIT_REJECTED':
          return '❌';
        case 'LEAVE_REQUEST':
          return '📅';
        case 'LEAVE_APPROVED':
          return '✅';
        case 'LEAVE_REJECTED':
          return '❌';
        case 'WFH_REQUEST':
          return '🏠';
        case 'WFH_APPROVED':
          return '✅';
        case 'WFH_REJECTED':
          return '❌';
        case 'RESOURCE_REQUEST':
          return '📦';
        case 'RESOURCE_APPROVED':
          return '✅';
        case 'RESOURCE_REJECTED':
          return '❌';
        case 'RESOURCE_ASSIGNED':
          return '👤';
        case 'RESOURCE_APPROVAL_REQUIRED':
          return '⏳';
        default:
          return '🔔';
      }
    };

    const getNotificationColor = (type) => {
      switch (type) {
        case 'ATTENDANCE_EDIT_REQUEST':
          return 'border-l-blue-500 bg-blue-50';
        case 'ATTENDANCE_EDIT_APPROVED':
          return 'border-l-green-500 bg-green-50';
        case 'ATTENDANCE_EDIT_REJECTED':
          return 'border-l-red-500 bg-red-50';
        case 'LEAVE_REQUEST':
          return 'border-l-purple-500 bg-purple-50';
        case 'LEAVE_APPROVED':
          return 'border-l-green-500 bg-green-50';
        case 'LEAVE_REJECTED':
          return 'border-l-red-500 bg-red-50';
        case 'WFH_REQUEST':
          return 'border-l-indigo-500 bg-indigo-50';
        case 'WFH_APPROVED':
          return 'border-l-green-500 bg-green-50';
        case 'WFH_REJECTED':
          return 'border-l-red-500 bg-red-50';
        case 'RESOURCE_REQUEST':
          return 'border-l-orange-500 bg-orange-50';
        case 'RESOURCE_APPROVED':
          return 'border-l-green-500 bg-green-50';
        case 'RESOURCE_REJECTED':
          return 'border-l-red-500 bg-red-50';
        case 'RESOURCE_ASSIGNED':
          return 'border-l-blue-500 bg-blue-50';
        case 'RESOURCE_APPROVAL_REQUIRED':
          return 'border-l-yellow-500 bg-yellow-50';
        default:
          return 'border-l-gray-500 bg-gray-50';
      }
    };

    return (
      <div
        className={`
          p-3 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors
          ${notification.is_read ? 'opacity-75' : 'bg-white'}
          ${getNotificationColor(notification.notification_type)}
        `}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-lg">{getNotificationIcon(notification.notification_type)}</span>
              <h4 className={`text-sm font-medium ${notification.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                {notification.title}
              </h4>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </div>

            <p className={`text-xs ${notification.is_read ? 'text-gray-500' : 'text-gray-700'} mb-2 line-clamp-2`}>
              {notification.message}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>From: {notification.sender_name || 'System'}</span>
              <span>{notification.time_since || 'Just now'}</span>
            </div>

            {notification.action_text && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {notification.action_text}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1 ml-2">
            {!notification.is_read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(notification.id);
                }}
                className="p-1 text-gray-400 hover:text-green-600"
                title="Mark as read"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNotification(notification.id);
              }}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Notification Bell Icon - Glassmorphism style to match Navbar */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl relative focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 backdrop-blur-sm border border-white/20"
        aria-label="View notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white shadow-lg font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Content - Premium glassmorphism */}
          <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl py-1 z-50 border border-white/30 max-h-96 overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Filter and Actions */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-2 py-1 text-xs rounded-full ${filter === 'all'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-2 py-1 text-xs rounded-full ${filter === 'unread'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-3">
                <button
                  onClick={handleEnableNotifications}
                  className="w-full flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <BellIcon className="h-4 w-4 mr-2" />
                  Enable Desktop Notifications
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-72 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <LoadingSpinner size="small" />
                  <p className="text-xs text-gray-500 mt-2">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <BellIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {filter === 'unread' ? 'You have no unread notifications' : 'You have no notifications yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {Array.isArray(notifications) && notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    // Navigate to attendance page to see all requests
                    window.location.href = '/attendance';
                  }}
                  className="w-full text-center text-xs text-blue-600 hover:text-blue-800"
                >
                  View all in Attendance
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;