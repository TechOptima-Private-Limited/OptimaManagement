import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { attendanceAPI } from '../../services/api';
import { isHRManager, isManager } from '../../utils/auth';
import { formatDate, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';

const AttendanceApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isHRManager() || isManager()) {
      fetchPendingApprovals();
    }
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getPendingApprovals();
      setPendingApprovals(response.data);
    } catch (error) {
      toast.error('Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (recordId, approvalStatus) => {
    setSubmitting(true);
    try {
      await attendanceAPI.approveAttendanceEdit(recordId, { approval_status: approvalStatus });
      
      toast.success(
        approvalStatus === 'APPROVED' 
          ? 'Attendance edit approved successfully!' 
          : 'Attendance edit rejected successfully!'
      );
      
      // Refresh the list
      fetchPendingApprovals();
    } catch (error) {
      toast.error('Failed to process approval');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isHRManager() && !isManager()) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            Only HR Managers and Team Managers can access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner text="Loading pending approvals..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Approvals</h1>
        <p className="mt-1 text-sm text-gray-600">
          Review and approve attendance edit requests
        </p>
      </div>

      {/* Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center">
          <ClockIcon className="h-8 w-8 text-yellow-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
            <p className="text-2xl font-semibold text-gray-900">{pendingApprovals.length}</p>
          </div>
        </div>
      </div>

      {/* Pending Approvals List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Requests</h3>
        </div>
        
        {pendingApprovals.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
            <p className="mt-1 text-sm text-gray-500">
              All attendance requests have been processed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingApprovals.map((approval) => (
              <div key={approval.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {approval.employee_name?.charAt(0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{approval.employee_name}</h4>
                        <span className="text-sm text-gray-500">({approval.employee_id})</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {formatDate(approval.date)}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatDateTime(approval.created_at)}
                        </div>
                      </div>

                      {/* Comparison */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* Original Values */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-red-800 mb-2">Original Values</h5>
                          <div className="space-y-1 text-sm">
                            <div><span className="text-red-700">Check In:</span> {approval.original_check_in || 'Not recorded'}</div>
                            <div><span className="text-red-700">Check Out:</span> {approval.original_check_out || 'Not recorded'}</div>
                            <div><span className="text-red-700">Status:</span> {approval.original_status || 'New record'}</div>
                            <div><span className="text-red-700">Notes:</span> {approval.original_notes || 'None'}</div>
                          </div>
                        </div>

                        {/* Requested Values */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-green-800 mb-2">Requested Changes</h5>
                          <div className="space-y-1 text-sm">
                            <div><span className="text-green-700">Check In:</span> {approval.pending_check_in || 'Not recorded'}</div>
                            <div><span className="text-green-700">Check Out:</span> {approval.pending_check_out || 'Not recorded'}</div>
                            <div><span className="text-green-700">Status:</span> {approval.pending_status}</div>
                            <div><span className="text-green-700">Notes:</span> {approval.pending_notes || 'None'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Reason */}
                      {approval.edit_reason && (
                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <span className="text-sm font-medium text-blue-800">Reason: </span>
                          <span className="text-sm text-blue-700">{approval.edit_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleApproval(approval.id, 'APPROVED')}
                      disabled={submitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(approval.id, 'REJECTED')}
                      disabled={submitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceApprovals;