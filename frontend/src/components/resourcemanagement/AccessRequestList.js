import React, { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import api, { employeeAPI, adminUserAPI } from '../../services/api';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { getCurrentUser, hasAdminPrivileges } from '../../utils/auth';

// Helper Functions
import RequestDetailModal, { getStatusIcon, getStatusBadge, getPriorityBadge, formatDate } from './RequestDetailModal';


const AccessRequestList = () => {
  const { theme } = useTheme();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const isAdminLike = (() => {
    // Prefer centralized privilege check
    if (typeof hasAdminPrivileges === 'function' && hasAdminPrivileges()) return true;
    const role = (user?.role || user?.profile?.role || '').toLowerCase?.();
    const byRole = ['admin', 'super_admin', 'hr_admin', 'hr_manager', 'it_supporter'].includes(role);
    const byStaff = Boolean(user?.is_staff || user?.isSuperuser || user?.is_superuser);
    return byRole || byStaff;
  })();

  const { data: requests = [], isLoading, error } = useQuery(
    'access-requests',
    () => api.get('/resource-management/access-requests/').then(res => res.data.results || res.data),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const approveMutation = useMutation(
    (id) => api.post(`/resource-management/access-requests/${id}/approve/`),
    {
      onSuccess: () => {
        toast.success('Request approved');
        queryClient.invalidateQueries('access-requests');
      },
      onError: (err) => {
        console.error(err);
        toast.error('Failed to approve request');
      }
    }
  );

  const rejectMutation = useMutation(
    (id) => api.post(`/resource-management/access-requests/${id}/reject/`),
    {
      onSuccess: () => {
        toast.success('Request rejected');
        queryClient.invalidateQueries('access-requests');
      },
      onError: (err) => {
        console.error(err);
        toast.error('Failed to reject request');
      }
    }
  );

  const requestApprovalMutation = useMutation(
    ({ id, approver_email }) => api.post(`/resource-management/access-requests/${id}/request_approval/`, { approver_email }),
    {
      onSuccess: () => {
        toast.success('Approval request sent to manager');
        queryClient.invalidateQueries('access-requests');
      },
      onError: (err) => {
        console.error(err);
        toast.error('Failed to send approval request');
      }
    }
  );

  const updateRequestMutation = useMutation(
    ({ id, data }) => api.patch(`/resource-management/access-requests/${id}/`, data),
    {
      onSuccess: () => {
        toast.success('Request updated');
        queryClient.invalidateQueries('access-requests');
      },
      onError: (err) => {
        console.error(err);
        toast.error('Failed to update request');
      }
    }
  );

  const statusOptions = [
    { value: 'ALL', label: 'All Requests', count: requests.length },
    { value: 'PENDING', label: 'Pending', count: requests.filter(r => r.status === 'PENDING').length },
    { value: 'APPROVAL_REQUIRED', label: 'Approval Required', count: requests.filter(r => r.status === 'APPROVAL_REQUIRED').length },
    { value: 'APPROVED', label: 'Approved', count: requests.filter(r => r.status === 'APPROVED').length },
    { value: 'REJECTED', label: 'Rejected', count: requests.filter(r => r.status === 'REJECTED').length }
  ];

  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
    const matchesSearch = searchTerm === '' ||
      request.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.resource_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.justification?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-white/5/5 border border-black/10 dark:border-white/10 rounded-2xl backdrop-blur-sm">
          <XCircleIcon className="mx-auto h-12 w-12 text-rose-400" />
          <h3 className="mt-4 text-lg font-bold text-rose-400">Error loading requests</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            There was a problem loading your access requests. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className={`text-2xl font-bold bg-gradient-to-r ${theme.primaryGradient} bg-clip-text text-transparent mb-2`}>My Access Requests</h2>
        <p className="text-gray-600 dark:text-gray-400">Track the status of your resource access requests</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`
                px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center space-x-2
                ${statusFilter === option.value
                  ? `bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]`
                  : 'bg-white/5/5 text-gray-600 dark:text-gray-400 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:bg-white/5/10 hover:border-black/20 dark:border-white/20'
                }
              `}
            >
              <span>{option.label}</span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-bold
                ${statusFilter === option.value
                  ? 'bg-indigo-500/30 text-indigo-300'
                  : 'bg-black/10 dark:bg-white/5/10 text-slate-400'
                }
              `}>
                {option.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ticket number, resource..."
            className="w-full pl-12 pr-4 py-3 bg-white/5/5 border border-black/10 dark:border-white/10 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-500"
          />
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white/5/5 border border-black/10 dark:border-white/10 rounded-2xl backdrop-blur-sm">
          <ClockIcon className="mx-auto h-16 w-16 text-slate-400" />
          <h3 className="mt-4 text-lg font-bold text-white">No requests found</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Try adjusting your filters or search term.'
              : 'You haven\'t submitted any access requests yet.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className={`bg-white/5/5 border ${theme.cardBorder} rounded-2xl p-6 hover:bg-black/10 dark:bg-white/5/10 transition-all duration-300 group`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/5/5 rounded-xl group-hover:bg-black/10 dark:bg-white/5/10 transition-colors">
                    {getStatusIcon(request.status)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                      #{request.ticket_number}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {request.request_type === 'IT' ? 'IT Support Request' : `Access to ${request.resource_name || 'Resource'}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={getPriorityBadge(request.priority)}>
                    {request.priority_display || request.priority}
                  </span>
                  <span className={getStatusBadge(request.status)}>
                    {request.status_display || request.status}
                  </span>
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all duration-200"
                    title="View details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm bg-black/20 p-5 rounded-xl border border-white/10">
                <div>
                  <span className="text-slate-400 block mb-1">Requested</span>
                  <span className="text-indigo-100 font-medium font-mono">{formatDate(request.requested_at)}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Duration</span>
                  <span className="text-indigo-100 font-medium">{request.duration} days</span>
                </div>

                {request.expires_at && (
                  <div>
                    <span className="text-slate-400 block mb-1">Expires</span>
                    <span className="text-rose-200 font-medium font-mono">{formatDate(request.expires_at)}</span>
                  </div>
                )}
              </div>

              {request.justification && (
                <div className="mt-5 pt-5 border-t border-black/10 dark:border-white/10">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 italic">
                    "{request.justification.replace(/<[^>]*>/g, '').substring(0, 150)}..."
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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

export default AccessRequestList;
