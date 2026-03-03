import React from 'react';
import { useQuery } from 'react-query';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  KeyIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ResourceDashboard = () => {
  const navigate = useNavigate();
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    'resource-dashboard',
    //() => api.get('http://127.0.0.1:8080/api/resource-management/access-requests/dashboard/').then(res => res.data),
    () => api.get('/resource-management/access-requests/dashboard/').then(res => res.data),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch recent requests
  const { data: recentRequests = [] } = useQuery(
    'recent-requests',
    //() => api.get('http://127.0.0.1:8080/api/resource-management/access-requests/?limit=5').then(res => res.data.results || res.data.slice(0, 5)),
    () => api.get('/resource-management/access-requests/?limit=5').then(res => res.data.results || res.data.slice(0, 5)),
    {
      refetchInterval: 30000,
    }
  );

  const stats = [
    {
      name: 'Pending Requests',
      value: dashboardData?.pending || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      change: '+2',
      changeType: 'increase'
    },
    {
      name: 'Approval Required',
      value: dashboardData?.approval_required || 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      change: '+1',
      changeType: 'increase'
    },
    {
      name: 'Approved',
      value: dashboardData?.approved || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      change: '+5',
      changeType: 'increase'
    },
    {
      name: 'Rejected',
      value: dashboardData?.rejected || 0,
      icon: XCircleIcon,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      change: '0',
      changeType: 'neutral'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'APPROVAL_REQUIRED':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />;
      case 'APPROVED':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'REJECTED':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'APPROVAL_REQUIRED':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'APPROVED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Support 24/7 Dashboard</h2>
        <p className="text-gray-600">Overview of your access requests and system status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className={`${stat.bgColor} rounded-xl p-6 border border-white/50 shadow-sm hover:shadow-md transition-all duration-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${stat.textColor}`}>{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg shadow-sm`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stat.changeType === 'increase' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <div className="h-4 w-4 mr-1"></div>
                )}
                <span className={`${stat.changeType === 'increase' ? 'text-green-600' : 'text-gray-500'} font-medium`}>
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            {recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">#{request.ticket_number}</p>
                        <p className="text-xs text-gray-500">
                          {request.request_type === 'IT' ? 'IT Support' : request.resource_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={getStatusBadge(request.status)}>
                        {request.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(request.requested_at)}
                      </span>
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <KeyIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            <button
              type="button"
              onClick={() => navigate('/resource-management/request')}
              aria-label="Create new access request"
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-red-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <ServerIcon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">New Access Request</p>
                  <p className="text-xs text-gray-500">Request access to resources</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-400 group-hover:text-red-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => navigate('/resource-management/request?type=IT')}
              aria-label="Open IT support request"
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-orange-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">IT Support</p>
                  <p className="text-xs text-gray-500">Get technical assistance</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => navigate('/resource-management/requests')}
              aria-label="View all access requests"
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-gray-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <ClockIcon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">View All Requests</p>
                  <p className="text-xs text-gray-500">Track request status</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">API Status</p>
                <p className="text-xs text-gray-500">All systems operational</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Email Service</p>
                <p className="text-xs text-gray-500">Notifications active</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Database</p>
                <p className="text-xs text-gray-500">Performance normal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDashboard;