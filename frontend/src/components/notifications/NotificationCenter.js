import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { notificationAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { registerServiceWorker, subscribeUser } from '../../utils/pushNotification';
import api from '../../services/api';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread'

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
      if (showDropdown) fetchNotifications();
    }, 30000);

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
      setNotifications(prev =>
        prev.map(notif => notif.id === notificationId ? { ...notif, is_read: true } : notif)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      const deleted = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      if (deleted && !deleted.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) await markAsRead(notification.id);
    if (notification.action_url) {
      if (notification.action_url.startsWith('/')) navigate(notification.action_url);
      else window.location.href = notification.action_url;
    }
    setShowDropdown(false);
  };

  const handleEnableNotifications = async () => {
    try {
      const registration = await registerServiceWorker();
      if (!registration) { toast.error('Service Worker registration failed'); return; }

      let subscription;
      try {
        subscription = await subscribeUser(registration);
      } catch (subError) {
        toast.error(subError.message || 'Failed to subscribe to push notifications');
        return;
      }

      if (!subscription) {
        toast.error('Failed to subscribe to push notifications. Check browser permissions.');
        return;
      }

      const response = await api.post('/notifications/save-webpush/', {
        subscription,
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

  // --- Notification type helpers ---
  const getNotificationIcon = (type) => {
    const map = {
      ATTENDANCE_EDIT_REQUEST: '🕐',
      ATTENDANCE_EDIT_APPROVED: '✅',
      ATTENDANCE_EDIT_REJECTED: '❌',
      LEAVE_REQUEST: '📅',
      LEAVE_APPROVED: '✅',
      LEAVE_REJECTED: '❌',
      WFH_REQUEST: '🏠',
      WFH_APPROVED: '✅',
      WFH_REJECTED: '❌',
      RESOURCE_REQUEST: '📦',
      RESOURCE_APPROVED: '✅',
      RESOURCE_REJECTED: '❌',
      RESOURCE_ASSIGNED: '👤',
      RESOURCE_APPROVAL_REQUIRED: '⏳',
    };
    return map[type] || '🔔';
  };

  const getAccentColor = (type) => {
    if (!type) return 'border-l-gray-500';
    if (type.includes('APPROVED')) return 'border-l-emerald-500';
    if (type.includes('REJECTED')) return 'border-l-rose-500';
    if (type.includes('LEAVE')) return 'border-l-violet-500';
    if (type.includes('WFH')) return 'border-l-indigo-500';
    if (type.includes('RESOURCE')) return 'border-l-amber-500';
    if (type.includes('ATTENDANCE')) return 'border-l-blue-500';
    return 'border-l-gray-500';
  };

  const NotificationItem = ({ notification }) => (
    <div
      className={`
        p-3 border-l-4 cursor-pointer transition-all duration-200
        hover:bg-white/5
        ${notification.is_read ? 'opacity-60' : 'bg-white/3'}
        ${getAccentColor(notification.notification_type)}
      `}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-base flex-shrink-0">{getNotificationIcon(notification.notification_type)}</span>
            <h4 className={`text-xs font-semibold truncate ${notification.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-white'}`}>
              {notification.title}
            </h4>
            {!notification.is_read && (
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0 animate-pulse" />
            )}
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>From: {notification.sender_name || 'System'}</span>
            <span>{notification.time_since || 'Just now'}</span>
          </div>

          {notification.action_text && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                {notification.action_text}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
          {!notification.is_read && (
            <button
              onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
              className="p-1 text-slate-400 hover:text-emerald-400 transition-colors duration-200"
              title="Mark as read"
            >
              <CheckIcon className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors duration-200"
            title="Delete"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2.5 text-white/80 hover:text-white hover:bg-black/20 dark:bg-white/20 rounded-xl relative focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 backdrop-blur-sm border border-black/20 dark:border-white/20"
        aria-label="View notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-indigo-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-[#0B1120] shadow-lg font-bold animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />

          {/* Panel */}
          <div className="absolute right-0 mt-3 w-80 bg-[#0d1226]/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/50 z-50 border border-white/10 dark:border-white/10 max-h-[30rem] overflow-hidden transition-all duration-300">

            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 dark:border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-slate-400 hover:text-white transition-colors duration-200"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center justify-between mt-2.5">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-all duration-200 ${filter === 'all'
                      ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                      : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-all duration-200 ${filter === 'unread'
                      ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                      : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Enable Desktop Notifications */}
              <div className="mt-3">
                <button
                  onClick={handleEnableNotifications}
                  className="w-full flex items-center justify-center px-3 py-2 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-700 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20"
                >
                  <BellIcon className="h-3.5 w-3.5 mr-2" />
                  Enable Desktop Notifications
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {loading ? (
                <div className="p-6 text-center">
                  <LoadingSpinner size="small" />
                  <p className="text-xs text-slate-400 mt-2">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 dark:border-white/10 flex items-center justify-center mx-auto mb-3">
                    <BellIcon className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300">No notifications</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {filter === 'unread' ? 'No unread notifications' : "You're all caught up!"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {Array.isArray(notifications) && notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-white/10 dark:border-white/10 bg-white/5">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/attendance');
                  }}
                  className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
                >
                  View all in Attendance →
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
