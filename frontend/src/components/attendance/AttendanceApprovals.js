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
import LoadingSpinner from '../common/LoadingSpinner';
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
          ? '✅ Attendance check-in approved!'
          : '❌ Attendance check-in rejected'
      );

      fetchPendingApprovals();
    } catch (error) {
      toast.error('Failed to process approval');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isHRManager() && !isManager()) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center p-12 bg-white/5 dark:bg-slate-900/60 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl max-w-md">
          <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
            <XCircleIcon className="w-10 h-10 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Access Denied</h3>
          <p className="text-slate-400 font-medium">Only HR Managers and Team Managers can manage attendance approvals.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-slate-950 flex justify-center items-center`}>
        <LoadingSpinner text="Querying pending approvals..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black text-slate-300 pb-12`}>
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-white/5 dark:bg-slate-900/20 border-b border-white/10 pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-violet-700 rounded-2xl shadow-2xl shadow-indigo-500/20 transform -rotate-3 border border-black/20 dark:border-white/20">
              <ClockIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="px-3 py-1 bg-indigo-500/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 text-indigo-400">
                  Management Console
                </span>
                <span className="px-3 py-1 bg-white/5/5 rounded-full text-[10px] font-black uppercase tracking-widest border border-black/10 dark:border-white/10 text-slate-400">
                  Verification Required
                </span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight uppercase">Attendance Approvals</h1>
              <p className="mt-2 text-slate-400 font-medium max-w-2xl">
                Review and authorize manual attendance adjustments and biometric corrections.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-10 sm:px-6 lg:px-8 relative z-20">
        {/* Quick Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white/5 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-black/10 dark:border-white/10 p-6 shadow-2xl group hover:border-indigo-500/30 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Queue Status</p>
                <p className="text-3xl font-black text-white tracking-tighter">{pendingApprovals.length}</p>
                <p className="text-[10px] font-bold text-indigo-400 uppercase mt-1">Pending Review</p>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                <ClockIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests Queue */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] flex items-center">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
              Requests Queue
            </h3>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-20 text-center shadow-2xl">
              <div className="w-24 h-24 bg-white/5/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                <CheckCircleIcon className="w-12 h-12 text-slate-600" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Queue is Empty</h3>
              <p className="text-slate-500 font-medium mt-2">All attendance requests have been processed successfully.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="bg-white/5 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl hover:border-black/10 dark:border-white/10 transition-all duration-300 group">
                  <div className="p-8">
                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8">
                      <div className="flex-1">
                        <div className="flex items-start space-x-6">
                          <div className="flex-shrink-0">
                            <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-violet-700 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/10 border border-black/10 dark:border-white/10 group-hover:scale-105 transition-transform duration-500 text-white text-2xl font-black uppercase">
                              {approval.employee_name?.charAt(0)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h4 className="text-2xl font-black text-white tracking-tight">{approval.employee_name}</h4>
                              <span className="px-3 py-0.5 bg-white/5/5 rounded-lg text-xs font-black text-slate-500 border border-black/10 dark:border-white/10 tracking-widest">{approval.employee_id}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 font-black uppercase tracking-widest">
                              <div className="flex items-center bg-white/5/5 px-3 py-1.5 rounded-full border border-white/10">
                                <CalendarIcon className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                                {formatDate(approval.date)}
                              </div>
                              <div className="flex items-center bg-white/5/5 px-3 py-1.5 rounded-full border border-white/10">
                                <ClockIcon className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                                Requested: {formatDateTime(approval.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Comparative Flow */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-6 bg-slate-950/50 rounded-3xl border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                              <XCircleIcon className="w-12 h-12 text-slate-400" />
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Current Record</p>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-600 uppercase">Check In</span> <span className="text-sm font-black text-slate-300">{approval.original_check_in || '—'}</span></div>
                              <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-600 uppercase">Check Out</span> <span className="text-sm font-black text-slate-300">{approval.original_check_out || '—'}</span></div>
                              <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-600 uppercase">Status</span> <span className="text-sm font-black text-slate-300">{approval.original_status || 'NEW'}</span></div>
                            </div>
                          </div>

                          <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                              <CheckCircleIcon className="w-12 h-12 text-indigo-400" />
                            </div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Proposed Adjustment</p>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center"><span className="text-xs font-bold text-indigo-400/60 uppercase">Check In</span> <span className="text-sm font-black text-white">{approval.pending_check_in || '—'}</span></div>
                              <div className="flex justify-between items-center"><span className="text-xs font-bold text-indigo-400/60 uppercase">Check Out</span> <span className="text-sm font-black text-white">{approval.pending_check_out || '—'}</span></div>
                              <div className="flex justify-between items-center"><span className="text-xs font-bold text-indigo-400/60 uppercase">Status</span> <span className="text-sm font-black text-white">{approval.pending_status}</span></div>
                            </div>
                          </div>
                        </div>

                        {approval.edit_reason && (
                          <div className="mt-4 p-5 bg-white/5/5 border border-white/10 rounded-2xl">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Justification</p>
                            <p className="text-sm text-slate-300 italic font-medium">"{approval.edit_reason}"</p>
                          </div>
                        )}
                      </div>

                      {/* Control Panel */}
                      <div className="flex flex-row xl:flex-col gap-3 min-w-[200px]">
                        <button
                          onClick={() => handleApproval(approval.id, 'APPROVED')}
                          disabled={submitting}
                          className="flex-1 inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 border border-emerald-500/30 rounded-2xl text-xs font-black text-white uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50"
                        >
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          Authorize
                        </button>
                        <button
                          onClick={() => handleApproval(approval.id, 'REJECTED')}
                          disabled={submitting}
                          className="flex-1 inline-flex items-center justify-center px-8 py-4 bg-white/5 dark:bg-slate-800 border border-white/10 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-600/20 transition-all duration-300 disabled:opacity-50"
                        >
                          <XCircleIcon className="h-5 w-5 mr-2" />
                          Decline
                        </button>
                      </div>
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
