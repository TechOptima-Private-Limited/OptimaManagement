import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  FireIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { leaveAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const LeaveApproval = () => {
  const location = useLocation();
  const employeeFromUrlRef = useRef('');
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    employeeFromUrlRef.current = params.get('employee') || '';
  }, [location.search]);

  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    leave_type: '',
    employee: ''
  });

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // // If you need to add the handleCancelRequest function:
  // const handleCancelRequest = async (requestId) => {
  //   try {
  //     setActionLoading(true);
  //     // Replace with your actual API call
  //     await leaveAPI.cancelLeaveRequest(requestId);
  //     toast.success('Leave request cancelled successfully');
  //     fetchRequests(); // Refresh the list
  //   } catch (error) {
  //     const errorMessage = error.response?.data?.error || 'Failed to cancel leave request';
  //     toast.error(errorMessage);
  //     console.error('Error cancelling leave request:', error);
  //   } finally {
  //     setActionLoading(false);
  //   }
  // };
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const effectiveEmployeeId = employeeFromUrlRef.current;
      const employeeScoped = effectiveEmployeeId ? { employee_id: effectiveEmployeeId } : {};
      const [pendingResponse, allResponse] = await Promise.all([
        leaveAPI.getLeaveRequests({ status: 'PENDING', ...filters, ...employeeScoped }),
        leaveAPI.getLeaveRequests({ ...filters, ...employeeScoped })
      ]);
      setPendingRequests(pendingResponse.data.results || pendingResponse.data);
      setAllRequests(allResponse.data.results || allResponse.data);
    } catch (error) {
      toast.error('Failed to fetch leave requests');
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, approvalComments = '') => {
    setActionLoading(true);
    try {
      await leaveAPI.approveLeaveRequest(requestId, { comments: approvalComments });
      toast.success('Leave request approved successfully!');
      fetchRequests();
      setShowApprovalModal(false);
      setShowDetailsModal(false);
      setComments('');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to approve leave request';
      toast.error(errorMessage);
      console.error('Error approving leave request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId, rejectComments) => {
    if (!rejectComments.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    setActionLoading(true);
    try {
      await leaveAPI.rejectLeaveRequest(requestId, { comments: rejectComments });
      toast.success('Leave request rejected');
      fetchRequests();
      setShowRejectionModal(false);
      setShowDetailsModal(false);
      setRejectionReason('');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to reject leave request';
      toast.error(errorMessage);
      console.error('Error rejecting leave request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const showRequestDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const getUrgencyColor = (request) => {
    const today = new Date();
    const startDate = new Date(request.start_date);
    const daysUntilStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilStart <= 1) return 'border-l-rose-500 bg-gradient-to-r from-rose-500/10 to-transparent';
    if (daysUntilStart <= 3) return 'border-l-amber-500 bg-gradient-to-r from-amber-500/10 to-transparent';
    return 'border-l-emerald-500 bg-gradient-to-r from-emerald-500/5 to-transparent';
  };

  const getDaysUntilStart = (startDate) => {
    const today = new Date();
    const start = new Date(startDate);
    return Math.ceil((start - today) / (1000 * 60 * 60 * 24));
  };

  const RequestCard = ({ request, showActions = true }) => {
    const daysUntilStart = getDaysUntilStart(request.start_date);

    return (
      <div className={`border-l-4 p-8 mb-6 rounded-r-[2rem] shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white/5 backdrop-blur-xl border border-white/10 ${getUrgencyColor(request)}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-6 flex-1">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                <span className="text-indigo-300 font-black text-xl">
                  {request.employee?.user_info?.first_name?.[0]}{request.employee?.user_info?.last_name?.[0]}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-4 mb-3">
                <h4 className="text-xl font-bold text-white tracking-wide">
                  {request.employee?.user_info?.first_name} {request.employee?.user_info?.last_name}
                </h4>
                <StatusBadge status={request.status} />
                {daysUntilStart <= 3 && daysUntilStart >= 0 && request.status === 'PENDING' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 border border-rose-500/30 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                    <FireIcon className="h-3 w-3 mr-1" />
                    {daysUntilStart === 0 ? 'Starts Today' : daysUntilStart === 1 ? 'Starts Tomorrow' : `${daysUntilStart} days`}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-medium text-slate-400 mb-4">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 mr-2 text-indigo-400" />
                  <span>{request.leave_type?.name}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-emerald-400" />
                  <span>{request.days_requested} day{request.days_requested !== 1 ? 's' : ''}</span>
                </div>
                <div className="col-span-1 md:col-span-1">
                  <span className="text-white">
                    {formatDate(request.start_date)} - {formatDate(request.end_date)}
                  </span>
                </div>
              </div>

              <div className="text-sm text-slate-300 mb-3 bg-[#0A0F1A] p-4 rounded-2xl border border-white/5 shadow-inner">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-xs block mb-1">Reason:</span>
                <span className="leading-relaxed">
                  {request.reason.length > 120 ? `${request.reason.substring(0, 120)}...` : request.reason}
                </span>
              </div>

              <div className="text-xs font-medium text-slate-500 flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-1 opacity-50" />
                Applied on {formatDate(request.applied_on)}
                {request.employee?.employee_id && (
                  <span className="ml-4 pl-4 border-l border-white/10 flex items-center">
                    <UserIcon className="h-4 w-4 mr-1 opacity-50" />
                    ID: {request.employee.employee_id}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3 ml-6">
            <button
              onClick={() => showRequestDetails(request)}
              className="inline-flex items-center justify-center p-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg w-full"
              title="View Details"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              View
            </button>

            {showActions && request.status === 'PENDING' && (
              <>
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowApprovalModal(true);
                  }}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg w-full disabled:opacity-50"
                  title="Approve"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowRejectionModal(true);
                  }}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center px-4 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg w-full disabled:opacity-50"
                  title="Reject"
                >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', leave_type: '', employee: '' });
  };

  if (loading) {
    return <LoadingSpinner text="Loading leave requests..." />;
  }

  return (
    <div className="space-y-8 relative z-10">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight">Leave Approvals</h3>
          <p className="mt-1 font-medium text-slate-400">
            Review and approve employee leave requests
          </p>
        </div>
        <div className="flex items-center bg-indigo-500/20 border border-indigo-500/30 px-5 py-2.5 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.3)] backdrop-blur-md">
          <BellIcon className="h-5 w-5 text-indigo-300 mr-2" />
          <span className="font-bold text-indigo-100">
            {pendingRequests.length} <span className="text-indigo-300">pending</span>
          </span>
        </div>
      </div>

      {/* Enhanced Quick Actions Alert */}
      {pendingRequests.length > 0 && (
        <div className="bg-[#0A0F1A]/80 backdrop-blur-xl border border-indigo-500/30 p-6 rounded-[2rem] shadow-[0_0_30px_rgba(79,70,229,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-400 to-purple-500"></div>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-indigo-500/20 rounded-2xl mr-4 border border-indigo-500/30">
              <ExclamationTriangleIcon className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <p className="text-white text-lg">
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Action Required:</span> You have{' '}
                <span className="font-black text-2xl mx-1">{pendingRequests.length}</span> pending request{pendingRequests.length !== 1 ? 's' : ''} waiting for approval.
              </p>
              {pendingRequests.filter(req => getDaysUntilStart(req.start_date) <= 3).length > 0 && (
                <div className="mt-2 inline-flex items-center px-3 py-1 bg-rose-500/20 border border-rose-500/30 rounded-full">
                  <span className="font-bold text-rose-300 text-sm">
                    {pendingRequests.filter(req => getDaysUntilStart(req.start_date) <= 3).length} request{pendingRequests.filter(req => getDaysUntilStart(req.start_date) <= 3).length !== 1 ? 's' : ''} starting soon!
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-full bg-[#0A0F1A] border-white/10 rounded-xl text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Leave Type</label>
            <select
              value={filters.leave_type}
              onChange={(e) => handleFilterChange('leave_type', e.target.value)}
              className="block w-full bg-[#0A0F1A] border-white/10 rounded-xl text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            >
              <option value="">All Types</option>
              <option value="1">Sick Leave</option>
              <option value="2">Annual Leave</option>
              <option value="3">Personal Leave</option>
              <option value="4">Maternity Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Employee</label>
            <input
              type="text"
              value={filters.employee}
              onChange={(e) => handleFilterChange('employee', e.target.value)}
              placeholder="Search employee..."
              className="block w-full bg-[#0A0F1A] border-white/10 rounded-xl text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium placeholder-slate-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl shadow-lg border border-white/10 transition-all transform hover:scale-105"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="border-b border-white/10">
        <nav className="-mb-px flex space-x-10">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-2 border-b-2 font-bold text-[15px] uppercase tracking-wider transition-all ${activeTab === 'pending'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-white/20'
              }`}
          >
            <div className="flex items-center">
              Pending Approvals
              <span className={`ml-3 px-3 py-1 rounded-full text-xs ${activeTab === 'pending' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/5 text-slate-400'
                }`}>
                {pendingRequests.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-2 border-b-2 font-bold text-[15px] uppercase tracking-wider transition-all ${activeTab === 'all'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-white/20'
              }`}
          >
            <div className="flex items-center">
              All Requests
              <span className={`ml-3 px-3 py-1 rounded-full text-xs ${activeTab === 'all' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/5 text-slate-400'
                }`}>
                {allRequests.length}
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Enhanced Content */}
      <div>
        {activeTab === 'pending' ? (
          pendingRequests.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl shadow-lg border border-blue-200">
              <div className="p-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                <ClockIcon className="h-16 w-16 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No pending requests</h3>
              <p className="text-gray-600 text-lg">
                All leave requests have been processed. Outstanding work! 🎉
              </p>
            </div>
          ) : (
            <div>
              {/* Urgent requests section */}
              {pendingRequests.filter(req => getDaysUntilStart(req.start_date) <= 3 && getDaysUntilStart(req.start_date) >= 0).length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg">
                      <FireIcon className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-red-700">Urgent - Starting Soon</h4>
                  </div>
                  {pendingRequests
                    .filter(req => getDaysUntilStart(req.start_date) <= 3 && getDaysUntilStart(req.start_date) >= 0)
                    .map(request => (
                      <RequestCard key={request.id} request={request} />
                    ))
                  }
                </div>
              )}

              {/* Regular pending requests */}
              <div>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                    <SparklesIcon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-700">Other Pending Requests</h4>
                </div>
                {pendingRequests
                  .filter(req => getDaysUntilStart(req.start_date) > 3 || getDaysUntilStart(req.start_date) < 0)
                  .map(request => (
                    <RequestCard key={request.id} request={request} />
                  ))
                }
              </div>
            </div>
          )
        ) : (
          allRequests.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl shadow-lg border border-blue-200">
              <div className="p-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                <UserIcon className="h-16 w-16 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No requests found</h3>
              <p className="text-gray-600 text-lg">
                No leave requests have been submitted yet.
              </p>
            </div>
          ) : (
            allRequests.map(request => (
              <RequestCard key={request.id} request={request} showActions={request.status === 'PENDING'} />
            ))
          )
        )}
      </div>

      {/* Enhanced Request Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Leave Request Details"
        size="large"
      >
        {selectedRequest && (
          <div className="space-y-8 relative z-10">
            {/* Employee Information */}
            <div className="bg-[#0A0F1A]/80 backdrop-blur-xl border border-indigo-500/30 p-8 rounded-[2rem] shadow-[0_0_30px_rgba(79,70,229,0.15)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-400 to-purple-500"></div>
              <div className="flex items-center space-x-6 relative z-10">
                <div className="h-20 w-20 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                  <span className="text-indigo-300 font-black text-3xl">
                    {selectedRequest.employee?.user_info?.first_name?.[0]}{selectedRequest.employee?.user_info?.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-wide">
                    {selectedRequest.employee?.user_info?.first_name} {selectedRequest.employee?.user_info?.last_name}
                  </h3>
                  <p className="text-indigo-300 font-bold mt-1 tracking-wider">{selectedRequest.employee?.employee_id}</p>
                  <p className="text-slate-400 font-medium">{selectedRequest.employee?.position}</p>
                </div>
              </div>
            </div>

            {/* Leave Details Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg hover:bg-white/10 transition-colors">
                <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Leave Type</label>
                <p className="text-xl font-bold text-white">{selectedRequest.leave_type?.name}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg hover:bg-white/10 transition-colors">
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Duration</label>
                <p className="text-xl font-bold text-white capitalize">
                  {selectedRequest.leave_duration?.replace('_', ' ')}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg hover:bg-white/10 transition-colors">
                <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Start Date</label>
                <p className="text-xl font-bold text-white">{formatDate(selectedRequest.start_date)}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg hover:bg-white/10 transition-colors">
                <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">End Date</label>
                <p className="text-xl font-bold text-white">{formatDate(selectedRequest.end_date)}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg hover:bg-white/10 transition-colors">
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Days Requested</label>
                <p className="text-xl font-bold text-white">{selectedRequest.days_requested} days</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg hover:bg-white/10 transition-colors">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Applied On</label>
                <p className="text-xl font-bold text-white">{formatDate(selectedRequest.applied_on)}</p>
              </div>
            </div>

            {/* Reason block */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Reason</label>
              <div className="bg-[#0A0F1A] p-6 rounded-2xl border border-white/5 shadow-inner">
                <p className="text-slate-300 leading-relaxed font-medium text-lg">{selectedRequest.reason}</p>
              </div>
            </div>

            {/* Employee Comments */}
            {selectedRequest.employee_comments && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Employee Comments</label>
                <div className="bg-[#0A0F1A] p-6 rounded-2xl border border-white/5 shadow-inner">
                  <p className="text-slate-300 leading-relaxed font-medium text-lg">{selectedRequest.employee_comments}</p>
                </div>
              </div>
            )}

            {/* Supporting Document */}
            {selectedRequest.supporting_document && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Supporting Document</label>
                <a
                  href={selectedRequest.supporting_document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-4 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 font-bold rounded-2xl shadow-[0_0_15px_rgba(79,70,229,0.2)] transition-all transform hover:-translate-y-1 w-full sm:w-auto justify-center"
                >
                  <EyeIcon className="h-6 w-6 mr-3" />
                  View Attached Document
                </a>
              </div>
            )}

            {/* Quick Actions Footer */}
            {selectedRequest.status === 'PENDING' && (
              <div className="border-t border-white/10 pt-8 mt-4">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    className="flex-1 inline-flex justify-center items-center px-6 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all transform hover:-translate-y-1"
                  >
                    <CheckCircleIcon className="h-6 w-6 mr-3" />
                    Approve Request
                  </button>
                  <button
                    onClick={() => setShowRejectionModal(true)}
                    className="flex-1 inline-flex justify-center items-center px-6 py-4 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-bold rounded-2xl shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all transform hover:-translate-y-1"
                  >
                    <XCircleIcon className="h-6 w-6 mr-3" />
                    Reject Request
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Enhanced Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="Approve Leave Request"
        size="medium"
      >
        {selectedRequest && (
          <div className="space-y-6 relative z-10">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-emerald-400 to-green-500"></div>
              <div className="flex items-center space-x-5 relative z-10">
                <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-emerald-400 mb-1">Confirmation Required</h4>
                  <p className="text-emerald-100/80 leading-relaxed">
                    You are about to <strong className="text-emerald-300">approve</strong> the leave request for{' '}
                    <span className="font-bold text-white">
                      {selectedRequest.employee?.user_info?.first_name} {selectedRequest.employee?.user_info?.last_name}
                    </span>{' '}
                    from {formatDate(selectedRequest.start_date)} to {formatDate(selectedRequest.end_date)}.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">
                Approval Comments <span className="text-slate-500 lowercase normal-case">(Optional)</span>
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-2xl text-white shadow-inner focus:ring-emerald-500 focus:border-emerald-500 font-medium placeholder-slate-500 p-4 transition-all"
                placeholder="Add any comments for the employee..."
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 pt-6 border-t border-white/10">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl shadow-lg border border-white/10 transition-all transform hover:-translate-y-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(selectedRequest.id, comments)}
                disabled={actionLoading}
                className="flex-1 inline-flex justify-center items-center px-6 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
              >
                {actionLoading ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Enhanced Rejection Modal */}
      <Modal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        title="Reject Leave Request"
        size="medium"
      >
        {selectedRequest && (
          <div className="space-y-6 relative z-10">
            <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[2rem] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-rose-400 to-red-500"></div>
              <div className="flex items-center space-x-5 relative z-10">
                <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30">
                  <XCircleIcon className="h-8 w-8 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-rose-400 mb-1">Rejection Notice</h4>
                  <p className="text-rose-100/80 leading-relaxed">
                    You are about to <strong className="text-rose-300">reject</strong> the leave request for{' '}
                    <span className="font-bold text-white">
                      {selectedRequest.employee?.user_info?.first_name} {selectedRequest.employee?.user_info?.last_name}
                    </span>.
                    Please provide a clear reason for the rejection below.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1 flex items-center">
                Rejection Reason <span className="text-rose-400 ml-1 text-lg leading-none">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-2xl text-white shadow-inner focus:ring-rose-500 focus:border-rose-500 font-medium placeholder-slate-500 p-4 transition-all"
                placeholder="Examine the reason for rejection here..."
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 pt-6 border-t border-white/10">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl shadow-lg border border-white/10 transition-all transform hover:-translate-y-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedRequest.id, rejectionReason)}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 inline-flex justify-center items-center px-6 py-4 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-bold rounded-2xl shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeaveApproval;