import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  CalendarDaysIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { leaveAPI } from '../../services/api';
import { isHRManager } from '../../utils/auth';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const LeaveRequest = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    leave_type: '',
    start_date: '',
    end_date: ''
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();

  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const leaveDuration = watch('leave_duration', 'FULL_DAY');
  const selectedLeaveType = watch('leave_type');

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveTypes();
    if (!isHRManager()) {
      fetchLeaveBalances();
    }
  }, []);

  const fetchLeaveBalances = async () => {
    try {
      const response = await leaveAPI.initializeMyBalances({ year: new Date().getFullYear() });
      setLeaveBalances(response.data.balances);
    } catch (error) {
      console.error('Error initializing balances, trying regular fetch:', error);
      try {
        const response = await leaveAPI.getLeaveBalances({ year: new Date().getFullYear() });
        setLeaveBalances(response.data.results || response.data);
      } catch (fetchError) {
        console.error('Error fetching leave balances:', fetchError);
      }
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, [filters]);

  useEffect(() => {
    if (startDate && endDate && leaveDuration) {
      calculateDays();
    }
  }, [startDate, endDate, leaveDuration]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.leave_type) params.leave_type = filters.leave_type;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await leaveAPI.getLeaveRequests(params);
      setLeaveRequests(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to fetch leave requests');
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await leaveAPI.getLeaveTypes();
      setLeaveTypes(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to fetch leave types');
      console.error('Error fetching leave types:', error);
    }
  };

  const calculateDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      let days = totalDays;
      if (leaveDuration === 'HALF_DAY_MORNING' || leaveDuration === 'HALF_DAY_AFTERNOON') {
        days = startDate === endDate ? 0.5 : totalDays - 0.5;
      }

      setValue('days_requested', days > 0 ? days : 0);
    }
  };

  const getAvailableBalance = (leaveTypeId) => {
    const id = parseInt(leaveTypeId);
    const balance = leaveBalances.find(b => b.leave_type.id === id);
    if (balance) return parseFloat(balance.remaining_days);
    // Fallback to allowed days from leave types if balance isn't initialized yet
    const type = leaveTypes.find(t => t.id === id);
    return type ? parseFloat(type.days_allowed_per_year) : 0;
  };

  const validateLeaveBalance = (leaveTypeId, daysRequested) => {
    const availableBalance = getAvailableBalance(leaveTypeId);
    return availableBalance >= daysRequested;
  };

  const onSubmit = async (data) => {
    const daysRequested = parseFloat(data.days_requested);
    const leaveTypeId = data.leave_type;

    if (!isHRManager() && !validateLeaveBalance(leaveTypeId, daysRequested)) {
      const availableBalance = getAvailableBalance(leaveTypeId);
      toast.error("Insufficient leave balance. Available: " + availableBalance + " days, Requested: " + daysRequested + " days");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();

      Object.keys(data).forEach(key => {
        if (key !== 'supporting_document' && data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key]);
        }
      });

      if (data.supporting_document && data.supporting_document.length > 0 && data.supporting_document[0]) {
        formData.append('supporting_document', data.supporting_document[0]);
      }

      await leaveAPI.createLeaveRequest(formData);
      toast.success('Leave request submitted successfully!');
      reset();
      setShowRequestModal(false);
      fetchLeaveRequests();

      if (!isHRManager()) {
        fetchLeaveBalances();
      }
    } catch (error) {
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          toast.error(errorData);
        } else if (errorData.error) {
          toast.error(errorData.error);
        } else if (errorData.non_field_errors) {
          toast.error(errorData.non_field_errors[0]);
        } else {
          Object.keys(errorData).forEach(field => {
            if (Array.isArray(errorData[field])) {
              toast.error(`${field}: ${errorData[field][0]} `);
            }
          });
        }
      } else {
        toast.error('Failed to submit leave request');
      }
      console.error('Error submitting leave request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (requestId) => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      try {
        await leaveAPI.cancelLeaveRequest(requestId);
        toast.success('Leave request cancelled successfully!');
        fetchLeaveRequests();

        if (!isHRManager()) {
          fetchLeaveBalances();
        }
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to cancel leave request';
        toast.error(errorMessage);
        console.error('Error cancelling leave request:', error);
      }
    }
  };

  const handleDelete = async (requestId, status) => {
    const confirmMessage = status === 'APPROVED'
      ? 'Are you sure you want to delete this approved leave request? This will restore the leave balance.'
      : 'Are you sure you want to delete this leave request?';

    if (window.confirm(confirmMessage)) {
      try {
        await leaveAPI.deleteLeaveRequest(requestId);
        toast.success('Leave request deleted successfully!');
        fetchLeaveRequests();

        if (status === 'APPROVED' && !isHRManager()) {
          fetchLeaveBalances();
        }
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to delete leave request';
        toast.error(errorMessage);
        console.error('Error deleting leave request:', error);
      }
    }
  };

  const showRequestDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', leave_type: '', start_date: '', end_date: '' });
  };

  const getBalanceWarning = () => {
    const daysRequested = watch('days_requested');
    const leaveTypeId = selectedLeaveType;

    if (!leaveTypeId || !daysRequested || isHRManager()) {
      return null;
    }

    const availableBalance = getAvailableBalance(leaveTypeId);
    const isValid = validateLeaveBalance(leaveTypeId, daysRequested);

    if (!isValid) {
      return (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            <div className="ml-3">
              <p className="text-sm text-red-800 font-semibold">
                <strong>Insufficient Balance:</strong> You have {availableBalance} days available, but requesting {daysRequested} days.
              </p>
            </div>
          </div>
        </div>
      );
    } else if (availableBalance - daysRequested <= 2) {
      return (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm text-yellow-800 font-semibold">
                <strong>Low Balance Warning:</strong> After this request, you'll have {availableBalance - daysRequested} days remaining.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return <LoadingSpinner text="Loading leave requests..." />;
  }

  return (
    <div className="space-y-8 relative z-10">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight">Leave Requests</h3>
          <p className="mt-1 font-medium text-slate-400">
            {isHRManager() ? 'Manage all leave requests' : 'View and manage your leave requests'}
          </p>
        </div>
        {!isHRManager() && (
          <button
            onClick={() => setShowRequestModal(true)}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-indigo-400/50 transition-all transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Request Leave
          </button>
        )}
      </div>

      {/* Enhanced Balance Overview */}
      {!isHRManager() && leaveBalances.length > 0 && (
        <div className="bg-[#0A0F1A] border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
          <div className="flex items-center mb-6 relative z-10">
            <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl shadow-lg">
              <SparklesIcon className="h-8 w-8 text-indigo-400" />
            </div>
            <h4 className="text-xl font-bold text-white ml-4 tracking-wide">Your Leave Balance</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
            {leaveBalances.map((balance) => (
              <div key={balance.id} className="bg-white/5 p-6 rounded-[1.5rem] border border-white/10 shadow-lg hover:shadow-indigo-500/10 transition-all hover:-translate-y-1">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{balance.leave_type.name}</p>
                <div className="flex items-baseline space-x-2 mt-2">
                  <p className="text-3xl font-black text-white">{balance.remaining_days}</p>
                  <p className="text-sm font-medium text-slate-400">/ {balance.total_days}</p>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 mt-4 border border-white/10 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{ width: `${(balance.remaining_days / balance.total_days) * 100}% ` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
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
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">From Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="block w-full bg-[#0A0F1A] border-white/10 rounded-xl text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">To Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="block w-full bg-[#0A0F1A] border-white/10 rounded-xl text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium [color-scheme:dark]"
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

      {/* Enhanced Requests List */}
      <div className="bg-white/5 backdrop-blur-xl shadow-2xl rounded-[2rem] border border-white/10 overflow-hidden">
        <ul className="divide-y divide-white/5">
          {leaveRequests.length === 0 ? (
            <li className="p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-6 bg-white/5 border border-white/10 rounded-full">
                  <CalendarDaysIcon className="h-16 w-16 text-indigo-400/50" />
                </div>
                <h3 className="text-xl font-bold text-white">No leave requests</h3>
                <p className="text-slate-400 font-medium max-w-md">
                  {!isHRManager() ? 'Get started by creating a new leave request.' : 'No leave requests found matching your criteria.'}
                </p>
              </div>
            </li>
          ) : (
            leaveRequests.map((request) => (
              <li key={request.id}>
                <div className="px-8 py-6 hover:bg-white/5 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        {isHRManager() && (
                          <div className="h-14 w-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                            <span className="text-indigo-300 font-black text-lg">
                              {request.employee?.user_info?.first_name?.[0]}{request.employee?.user_info?.last_name?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <p className="text-lg font-bold text-white truncate">
                            {request.leave_type?.name}
                          </p>
                          <StatusBadge status={request.status} />
                          {request.leave_duration !== 'FULL_DAY' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {request.leave_duration.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-slate-400 font-medium mb-2">
                          {isHRManager() && (
                            <div className="flex items-center text-white font-bold">
                              <span>{request.employee?.user_info?.first_name} {request.employee?.user_info?.last_name}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <CalendarDaysIcon className="h-4 w-4 mr-2 text-indigo-400" />
                            <span>{formatDate(request.start_date)} - {formatDate(request.end_date)}</span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2 text-emerald-400" />
                            <span>{request.days_requested} day{request.days_requested !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircleIcon className="h-4 w-4 mr-2 text-purple-400" />
                            <span>Applied {formatDate(request.applied_on)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-6">
                      <button
                        onClick={() => showRequestDetails(request)}
                        className="inline-flex items-center p-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-2xl font-medium transition-all transform hover:scale-105 shadow-lg"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>

                      {!isHRManager() && ['PENDING', 'APPROVED'].includes(request.status) && (
                        <button
                          onClick={() => handleCancel(request.id)}
                          className="inline-flex items-center p-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-2xl font-medium transition-all transform hover:scale-105 shadow-lg"
                          title="Cancel Request"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}

                      {(
                        isHRManager() ||
                        (!isHRManager() && request.status === 'REJECTED') ||
                        (!isHRManager() && request.status === 'CANCELLED') ||
                        (!isHRManager() && request.status === 'APPROVED')
                      ) && (
                          <button
                            onClick={() => handleDelete(request.id, request.status)}
                            className="inline-flex items-center p-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-2xl font-medium transition-all transform hover:scale-105 shadow-lg"
                            title="Delete Request"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Enhanced Request Leave Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request Leave"
        size="large"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Leave Type *
              </label>
              <select
                {...register('leave_type', { required: 'Leave type is required' })}
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-xl text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              >
                <option value="">Select Leave Type</option>
                {leaveTypes.map((type) => {
                  const balance = leaveBalances.find(b => b.leave_type.id === type.id);
                  const availableDays = balance ? balance.remaining_days : type.days_allowed_per_year;

                  return (
                    <option key={type.id} value={type.id}>
                      {type.name} ({availableDays} days available)
                    </option>
                  );
                })}
              </select>
              {errors.leave_type && (
                <p className="mt-2 text-sm text-rose-500 font-semibold">{errors.leave_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Leave Duration
              </label>
              <select
                {...register('leave_duration')}
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-xl text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="HALF_DAY_MORNING">Half Day - Morning</option>
                <option value="HALF_DAY_AFTERNOON">Half Day - Afternoon</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Days Requested
              </label>
              <input
                {...register('days_requested')}
                type="number"
                step="0.5"
                readOnly
                className="block w-full bg-white/5 border-white/10 rounded-xl text-slate-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Start Date *
              </label>
              <input
                {...register('start_date', { required: 'Start date is required' })}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-xl text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium [color-scheme:dark]"
              />
              {errors.start_date && (
                <p className="mt-2 text-sm text-rose-500 font-semibold">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                End Date *
              </label>
              <input
                {...register('end_date', { required: 'End date is required' })}
                type="date"
                min={startDate || new Date().toISOString().split('T')[0]}
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-xl text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium [color-scheme:dark]"
              />
              {errors.end_date && (
                <p className="mt-2 text-sm text-rose-500 font-semibold">{errors.end_date.message}</p>
              )}
            </div>

            {/* Enhanced Balance Warning */}
            <div className="sm:col-span-2">
              {getBalanceWarning()}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Supporting Document <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-white/20 bg-white/5 rounded-2xl p-8 text-center hover:border-indigo-400/50 transition-colors">
                <DocumentArrowUpIcon className="mx-auto h-16 w-16 text-slate-500" />
                <div className="mt-4">
                  <label className="cursor-pointer bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 px-6 py-3 rounded-xl font-bold transition-all inline-block hover:-translate-y-0.5 shadow-lg">
                    <span>Upload a file</span>
                    <input
                      {...register('supporting_document')}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-4 text-sm text-slate-400 font-medium">PNG, JPG, PDF up to 10MB</p>
                  <p className="text-xs text-slate-500 mt-1">Medical certificate required for sick leave greater than 3 days</p>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Reason *
              </label>
              <textarea
                {...register('reason', { required: 'Reason is required' })}
                rows={4}
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-xl text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium placeholder-slate-500"
                placeholder="Please provide a detailed reason for your leave request..."
              />
              {errors.reason && (
                <p className="mt-2 text-sm text-rose-500 font-semibold">{errors.reason.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Additional Comments <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <textarea
                {...register('employee_comments')}
                rows={3}
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-xl text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium placeholder-slate-500"
                placeholder="Any additional comments or special requests..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-8 border-t border-white/10 mt-8">
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (!isHRManager() && selectedLeaveType && !validateLeaveBalance(selectedLeaveType, watch('days_requested')))}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-indigo-400/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enhanced Request Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Leave Request Details"
        size="large"
      >
        {selectedRequest && (
          <div className="space-y-8">
            {/* Employee Info */}
            {isHRManager() && (
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                    <span className="text-indigo-300 font-black text-xl">
                      {selectedRequest.employee?.user?.first_name?.[0]}{selectedRequest.employee?.user?.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">
                      {selectedRequest.employee?.user?.first_name} {selectedRequest.employee?.user?.last_name}
                    </h4>
                    <p className="text-slate-400">{selectedRequest.employee?.employee_id}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Leave Details */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#0A0F1A] border border-white/10 p-5 rounded-2xl shadow-inner">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Leave Type</label>
                <p className="text-lg font-bold text-white">{selectedRequest.leave_type?.name}</p>
              </div>
              <div className="bg-[#0A0F1A] border border-white/10 p-5 rounded-2xl shadow-inner">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Duration</label>
                <p className="text-lg font-bold text-white">
                  {selectedRequest.leave_duration?.replace('_', ' ')}
                </p>
              </div>
              <div className="bg-[#0A0F1A] border border-white/10 p-5 rounded-2xl shadow-inner">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Start Date</label>
                <p className="text-lg font-bold text-white">{formatDate(selectedRequest.start_date)}</p>
              </div>
              <div className="bg-[#0A0F1A] border border-white/10 p-5 rounded-2xl shadow-inner">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">End Date</label>
                <p className="text-lg font-bold text-white">{formatDate(selectedRequest.end_date)}</p>
              </div>
              <div className="bg-[#0A0F1A] border border-white/10 p-5 rounded-2xl shadow-inner">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Days Requested</label>
                <p className="text-lg font-bold text-white">{selectedRequest.days_requested} days</p>
              </div>
              <div className="bg-[#0A0F1A] border border-white/10 p-5 rounded-2xl shadow-inner">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</label>
                <div className="mt-1">
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-3">Reason</label>
              <div className="bg-indigo-500/10 p-6 rounded-2xl border border-indigo-500/20 shadow-inner">
                <p className="text-white leading-relaxed font-medium">
                  {selectedRequest.reason}
                </p>
              </div>
            </div>

            {/* Employee Comments */}
            {selectedRequest.employee_comments && (
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-3">Employee Comments</label>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-inner">
                  <p className="text-slate-300 leading-relaxed font-medium">
                    {selectedRequest.employee_comments}
                  </p>
                </div>
              </div>
            )}

            {/* Manager Comments */}
            {selectedRequest.manager_comments && (
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-3">Manager Comments</label>
                <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20 shadow-inner">
                  <p className="text-emerald-300 leading-relaxed font-medium">
                    {selectedRequest.manager_comments}
                  </p>
                </div>
              </div>
            )}

            {/* Approval Info */}
            {selectedRequest.approved_by_name && (
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg flex justify-between items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Approved By</label>
                  <p className="text-lg font-bold text-white">{selectedRequest.approved_by_name}</p>
                </div>
                {selectedRequest.approved_on && (
                  <div className="text-right">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Approved On</label>
                    <p className="text-sm text-slate-400 font-medium">
                      {formatDate(selectedRequest.approved_on)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Supporting Document */}
            {selectedRequest.supporting_document && (
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-3">Supporting Document</label>
                <div className="mt-2">
                  <a
                    href={selectedRequest.supporting_document}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold rounded-2xl border border-indigo-500/30 shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    <EyeIcon className="h-5 w-5 mr-3" />
                    View Document
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeaveRequest;