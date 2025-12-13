import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import api, { employeeAPI } from '../../services/api';
import { getCurrentUser, hasAdminPrivileges } from '../../utils/auth';

const AccessRequestList = () => {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'APPROVAL_REQUIRED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
      case 'APPROVAL_REQUIRED':
        return `${baseClasses} bg-orange-100 text-orange-800 border border-orange-200`;
      case 'APPROVED':
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  };

  const getPriorityBadge = (priority) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded text-xs font-medium";
    switch (priority) {
      case 'LOW':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'MEDIUM':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'HIGH':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'URGENT':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const RequestDetailModal = ({ request, onClose }) => {
    const [approverEmail, setApproverEmail] = useState('');
    const [assignedTo, setAssignedTo] = useState(request?.assigned_to || null);
    const [requiresApproval, setRequiresApproval] = useState(Boolean(request?.requires_approval));
    const [notes, setNotes] = useState(request?.notes || '');
    const [users, setUsers] = useState([]);

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const res = await employeeAPI.getUsers();
          const data = res?.data?.results || res?.data || [];
          if (mounted) setUsers(data);
        } catch (e) {
          setUsers([]);
        }
      })();
      return () => { mounted = false; };
    }, []);

    useEffect(() => {
      setApproverEmail(request?.approver_email || '');
    }, [request]);
    if (!request) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
                <p className="text-sm text-gray-500">Ticket #{request.ticket_number}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Request Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(request.status)}
                    <span className={getStatusBadge(request.status)}>
                      {request.status_display || request.status}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <span className={getPriorityBadge(request.priority)}>
                    {request.priority_display || request.priority}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
                  <p className="text-gray-900">{request.request_type === 'IT' ? 'IT Support' : 'New Access'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requested At</label>
                  <p className="text-gray-900">{formatDate(request.requested_at)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <p className="text-gray-900">{request.duration} days</p>
                </div>
                
                {request.expires_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                    <p className="text-gray-900">{formatDate(request.expires_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resource Info (if not IT request) */}
            {request.request_type !== 'IT' && (
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Resource Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                    <p className="text-gray-900">{request.resource_name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                    <p className="text-gray-900">{request.access_level_name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Justification */}
            <div className="border-t pt-6">
              <label className="block text-lg font-medium text-gray-900 mb-4">Justification</label>
              <div 
                className="prose max-w-none text-gray-700 bg-gray-50 rounded-lg p-4"
                dangerouslySetInnerHTML={{ __html: request.justification || 'No justification provided.' }}
              />
            </div>

            {/* Additional Info */}
            {(request.approved_by || request.approved_at || request.status === 'REJECTED') && (
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Approval Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {request.status === 'REJECTED' && request.rejected_by_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rejected By</label>
                      <p className="text-gray-900">{request.rejected_by_name}</p>
                    </div>
                  )}
                  {request.status !== 'REJECTED' && request.approved_by && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Approved By</label>
                      <p className="text-gray-900">{request.approved_by_name || request.approved_by}</p>
                    </div>
                  )}
                  
                  {request.approved_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Approved At</label>
                      <p className="text-gray-900">{formatDate(request.approved_at)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Actions */}
            {isAdminLike && (
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Admin Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Assigned To</label>
                    <select
                      value={assignedTo || ''}
                      onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : null)}
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-6 md:mt-8">
                    <input
                      id="requiresApproval"
                      type="checkbox"
                      checked={requiresApproval}
                      onChange={(e) => setRequiresApproval(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="requiresApproval" className="text-sm text-gray-700">Requires Approval</label>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <input
                      value={request.status_display || request.status}
                      disabled
                      className="px-3 py-2 border border-gray-200 rounded bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">{request.status === 'REJECTED' ? 'Rejected By' : 'Approved By'}</label>
                    <input
                      value={(request.status === 'REJECTED' ? (request.rejected_by_name || '') : (request.approved_by_name || ''))}
                      disabled
                      className="px-3 py-2 border border-gray-200 rounded bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes or comments"
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <button
                    onClick={async () => {
                      await approveMutation.mutateAsync(request.id);
                      onClose();
                    }}
                    disabled={approveMutation.isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={async () => {
                      await rejectMutation.mutateAsync(request.id);
                      onClose();
                    }}
                    disabled={rejectMutation.isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <input
                    type="email"
                    value={approverEmail}
                    onChange={(e) => setApproverEmail(e.target.value)}
                    placeholder="Approver email"
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[240px]"
                  />
                  <button
                    onClick={async () => {
                      const payload = {
                        assigned_to: assignedTo,
                        requires_approval: requiresApproval,
                        notes: notes,
                        approver_email: approverEmail || null,
                      };
                      await updateRequestMutation.mutateAsync({ id: request.id, data: payload });
                      onClose();
                    }}
                    disabled={updateRequestMutation.isLoading}
                    className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={async () => {
                      const email = (approverEmail || '').trim();
                      if (!email) {
                        toast.error('Please enter approver email');
                        return;
                      }
                      await requestApprovalMutation.mutateAsync({ id: request.id, approver_email: email });
                      onClose();
                    }}
                    disabled={requestApprovalMutation.isLoading || !approverEmail}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send Approval To Manager
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            There was a problem loading your access requests. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Access Requests</h2>
        <p className="text-gray-600">Track the status of your resource access requests</p>
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
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2
                ${statusFilter === option.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <span>{option.label}</span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs
                ${statusFilter === option.value
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {option.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ticket number, resource, or description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
          <p className="mt-1 text-sm text-gray-500">
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
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(request.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      #{request.ticket_number}
                    </h3>
                    <p className="text-sm text-gray-500">
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
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Requested:</span>
                  <span className="ml-2 text-gray-900">{formatDate(request.requested_at)}</span>
                </div>
                
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 text-gray-900">{request.duration} days</span>
                </div>
                
                {request.expires_at && (
                  <div>
                    <span className="text-gray-500">Expires:</span>
                    <span className="ml-2 text-gray-900">{formatDate(request.expires_at)}</span>
                  </div>
                )}
              </div>

              {request.justification && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {request.justification.replace(/<[^>]*>/g, '').substring(0, 150)}...
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
      />
    </div>
  );
};

export default AccessRequestList;