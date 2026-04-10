import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTheme } from '../../context/ThemeContext';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  KeyIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCurrentUser, hasAdminPrivileges } from '../../utils/auth';
import RequestDetailModal, { getStatusIcon, getStatusBadge } from './RequestDetailModal';


const ResourceDashboard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);

  const user = getCurrentUser();
  const isAdminLike = (() => {
    if (typeof hasAdminPrivileges === 'function' && hasAdminPrivileges()) return true;
    const role = (user?.role || user?.profile?.role || '').toLowerCase?.();
    return ['admin', 'super_admin', 'hr_admin', 'hr_manager', 'it_supporter'].includes(role);
  })();

  // Mutations (consistent with AccessRequestList)
  const approveMutation = useMutation(
    (id) => api.post(`/resource-management/access-requests/${id}/approve/`),
    {
      onSuccess: () => {
        toast.success('Request approved');
        queryClient.invalidateQueries('resource-dashboard');
        queryClient.invalidateQueries('recent-requests');
      },
      onError: () => toast.error('Failed to approve request')
    }
  );

  const rejectMutation = useMutation(
    (id) => api.post(`/resource-management/access-requests/${id}/reject/`),
    {
      onSuccess: () => {
        toast.success('Request rejected');
        queryClient.invalidateQueries('resource-dashboard');
        queryClient.invalidateQueries('recent-requests');
      },
      onError: () => toast.error('Failed to reject request')
    }
  );

  const requestApprovalMutation = useMutation(
    ({ id, approver_email }) => api.post(`/resource-management/access-requests/${id}/request_approval/`, { approver_email }),
    {
      onSuccess: () => {
        toast.success('Approval request sent');
        queryClient.invalidateQueries('recent-requests');
      },
      onError: () => toast.error('Failed to send approval request')
    }
  );

  const updateRequestMutation = useMutation(
    ({ id, data }) => api.patch(`/resource-management/access-requests/${id}/`, data),
    {
      onSuccess: () => {
        toast.success('Request updated');
        queryClient.invalidateQueries('recent-requests');
      },
      onError: () => toast.error('Failed to update request')
    }
  );

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    'resource-dashboard',
    () => api.get('/resource-management/access-requests/dashboard/').then(res => res.data),
    {
      refetchInterval: 30000,
    }
  );

  const { data: recentRequests = [] } = useQuery(
    'recent-requests',
    () => api.get('/resource-management/access-requests/?limit=5')
      .then(res => res.data.results || res.data.slice(0, 5)),
    {
      refetchInterval: 30000,
    }
  );

  const stats = [
    {
      name: 'Pending Requests',
      value: dashboardData?.pending || 0,
      icon: ClockIcon,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-400',
      change: '+2',
      changeType: 'increase'
    },
    {
      name: 'Approval Required',
      value: dashboardData?.approval_required || 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-400',
      change: '+1',
      changeType: 'increase'
    },
    {
      name: 'Approved',
      value: dashboardData?.approved || 0,
      icon: CheckCircleIcon,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
      change: '+5',
      changeType: 'increase'
    },
    {
      name: 'Rejected',
      value: dashboardData?.rejected || 0,
      icon: XCircleIcon,
      color: 'bg-rose-500',
      bgColor: 'bg-rose-500/10',
      textColor: 'text-rose-400',
      change: '0',
      changeType: 'neutral'
    }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-24"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-xl h-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Support 24/7 Dashboard</h2>
        <p className="text-gray-400">Overview of your access requests and system status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className={`${stat.bgColor} rounded-xl p-6 border border-white/10 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${stat.textColor}`}>{stat.name}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stat.changeType === 'increase' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-400 mr-1" />
                ) : (
                  <div className="h-4 w-4 mr-1"></div>
                )}
                <span className={`${stat.changeType === 'increase' ? 'text-emerald-400' : 'text-gray-500'} font-medium`}>
                  {stat.change}
                </span>
                <span className="text-gray-500 ml-1">this week</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className={`bg-white/5 rounded-2xl border ${theme.cardBorder} shadow-xl backdrop-blur-sm`}>
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Recent Requests</h3>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            {recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white/5 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                        {getStatusIcon(request.status)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">#{request.ticket_number}</p>
                        <p className="text-xs text-gray-400">
                          {request.request_type === 'IT' ? 'IT Support' : request.resource_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-end space-y-1">
                        <span className={getStatusBadge(request.status)}>
                          {request.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(request.requested_at)}
                        </span>
                      </div>
                      <EyeIcon className="h-5 w-5 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ServerIcon className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No recent requests</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`bg-white/5 rounded-2xl border ${theme.cardBorder} shadow-xl backdrop-blur-sm`}>
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Quick Actions</h3>
              <KeyIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            <button
              type="button"
              onClick={() => navigate('/resource-management/request')}
              aria-label="Create new access request"
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl group-hover:scale-110 shadow-lg transition-transform">
                  <ServerIcon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">New Access Request</p>
                  <p className="text-xs text-gray-400">Request access to resources</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => navigate('/resource-management/request?type=IT')}
              aria-label="Open IT support request"
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl border border-orange-500/20 hover:border-orange-500/40 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2.5 rounded-xl group-hover:scale-110 shadow-lg transition-transform">
                  <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">IT Support</p>
                  <p className="text-xs text-gray-400">Get technical assistance</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-500 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => navigate('/resource-management/requests')}
              aria-label="View all access requests"
              className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/10 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-white/10 p-2.5 rounded-xl group-hover:scale-110 shadow-lg transition-transform border border-white/10">
                  <ClockIcon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">View All Requests</p>
                  <p className="text-xs text-gray-400">Track request status</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className={`bg-white/5 rounded-2xl border ${theme.cardBorder} shadow-xl backdrop-blur-sm`}>
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">System Status</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
              <div>
                <p className="text-sm font-bold text-white">API Status</p>
                <p className="text-xs text-gray-400">All systems operational</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
              <div>
                <p className="text-sm font-bold text-white">Email Service</p>
                <p className="text-xs text-gray-400">Notifications active</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
              <div>
                <p className="text-sm font-bold text-white">Database</p>
                <p className="text-xs text-gray-400">Performance normal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Request Detail Modal */}
      <RequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        theme={theme}
        isAdminLike={isAdminLike}
        approveMutation={approveMutation}
        rejectMutation={rejectMutation}
        requestApprovalMutation={requestApprovalMutation}
        updateRequestMutation={updateRequestMutation}
      />
    </div>
  );
};

export default ResourceDashboard;