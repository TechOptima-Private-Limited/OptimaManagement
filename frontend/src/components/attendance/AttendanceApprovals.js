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
import Modal from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';

const AttendanceApprovals = () => {
  const { theme } = useTheme();
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
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient} flex justify-center items-center`}>
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-red-200 rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-red-600 rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-600">Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient}`}>
      {/* Enhanced Page Header */}
      <div className={`relative overflow-hidden bg-gradient-to-r from-[#E7473C] to-red-600`}>
        <div className="absolute inset-0 bg-black opacity-10"></div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48"></div>

        <div className="relative px-4 py-12 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm mr-4">
              <ClockIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Attendance Approvals</h1>
              <p className="mt-1 text-xl text-red-50">
                Review and approve attendance edit requests
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{pendingApprovals.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals List */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-[#F0F0F0]">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <CheckCircleIcon className="h-6 w-6 mr-2 text-red-600" />
              Pending Requests
            </h3>
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
                        <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                          <span className="text-white text-lg font-bold">
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
                          <div className="mt-4 bg-red-50/50 border border-red-100 rounded-xl p-4">
                            <p className="text-sm">
                              <span className="font-semibold text-red-800">Reason: </span>
                              <span className="text-red-700 italic">"{approval.edit_reason}"</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={() => handleApproval(approval.id, 'APPROVED')}
                        disabled={submitting}
                        className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-emerald-200/50 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:opacity-50 transform hover:scale-105 transition-all duration-200"
                      >
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(approval.id, 'REJECTED')}
                        disabled={submitting}
                        className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-lg hover:shadow-rose-200/50 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:opacity-50 transform hover:scale-105 transition-all duration-200"
                      >
                        <XCircleIcon className="h-5 w-5 mr-2" />
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
    </div>
  );
};

export default AttendanceApprovals;