import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  UsersIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { leaveAPI, employeeAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { useForm } from 'react-hook-form';

const LeaveTypesManagement = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerBalance, handleSubmit: handleSubmitBalance, reset: resetBalance, formState: { errors: balanceErrors } } = useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [typesResponse, employeesResponse] = await Promise.all([
        leaveAPI.getLeaveTypes(),
        employeeAPI.getEmployees()
      ]);

      setLeaveTypes(typesResponse.data.results || typesResponse.data);
      setEmployees(employeesResponse.data.results || employeesResponse.data);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitType = async (data) => {
    setSubmitting(true);
    try {
      if (editingType) {
        await leaveAPI.updateLeaveType(editingType.id, data);
        toast.success('Leave type updated successfully!');
      } else {
        await leaveAPI.createLeaveType(data);
        toast.success('Leave type created successfully!');
      }

      fetchData();
      setShowTypeModal(false);
      setEditingType(null);
      reset();
    } catch (error) {
      const d = error.response?.data;
      let errorMessage = d?.error || d?.detail;
      if (!errorMessage && d && typeof d === 'object') {
        const firstKey = Object.keys(d)[0];
        if (firstKey) {
          const v = d[firstKey];
          errorMessage = Array.isArray(v) ? `${firstKey}: ${v[0]}` : `${firstKey}: ${v}`;
        }
      }
      toast.error(errorMessage || 'Failed to save leave type');
      console.error('Error saving leave type:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitBalanceInit = async (data) => {
    setSubmitting(true);
    try {
      await leaveAPI.initializeYearlyBalances(data);
      toast.success(`Leave balances initialized for ${data.year}!`);
      setShowBalanceModal(false);
      resetBalance();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to initialize balances';
      toast.error(errorMessage);
      console.error('Error initializing balances:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditType = (leaveType) => {
    setEditingType(leaveType);
    reset(leaveType);
    setShowTypeModal(true);
  };

  const handleDeleteType = async (typeId) => {
    if (window.confirm('Are you sure you want to delete this leave type? This action cannot be undone.')) {
      try {
        await leaveAPI.deleteLeaveType(typeId);
        toast.success('Leave type deleted successfully!');
        fetchData();
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to delete leave type';
        toast.error(errorMessage);
        console.error('Error deleting leave type:', error);
      }
    }
  };

  const LeaveTypeCard = ({ leaveType }) => (
    <div className="bg-white/5 backdrop-blur-md rounded-[2rem] shadow-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <h3 className="text-xl font-black text-white">{leaveType.name}</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {leaveType.code}
            </span>
            {!leaveType.is_active && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Inactive
              </span>
            )}
          </div>

          <p className="text-slate-300 mb-4 leading-relaxed font-medium text-sm">{leaveType.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm mb-5">
            <div className="bg-[#0A0F1A] p-3 rounded-2xl border border-white/5 shadow-inner">
              <span className="font-bold text-indigo-400 block mb-0.5 uppercase tracking-wider text-[10px]">Days per year</span>
              <span className="text-white text-lg font-black">{leaveType.is_unpaid ? '∞' : leaveType.days_allowed_per_year}</span>
            </div>
            <div className="bg-[#0A0F1A] p-3 rounded-2xl border border-white/5 shadow-inner">
              <span className="font-bold text-emerald-400 block mb-0.5 uppercase tracking-wider text-[10px]">Type</span>
              <span className={`font-bold text-base ${leaveType.is_unpaid ? 'text-rose-400' : 'text-white'}`}>
                {leaveType.is_unpaid ? 'Unpaid (LOP)' : 'Paid'}
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {leaveType.start_date && (
              <div className="text-[10px] text-slate-400 bg-white/5 p-2 px-3 rounded-xl border border-white/5 inline-block">
                <div className="flex items-center space-x-2">
                  <CalendarDaysIcon className="h-3 w-3 text-emerald-400" />
                  <span className="font-bold tracking-wider">Start: {formatDate(leaveType.start_date)}</span>
                </div>
              </div>
            )}
            {leaveType.expiry_date && (
              <div className="text-[10px] text-slate-400 bg-white/5 p-2 px-3 rounded-xl border border-white/5 inline-block">
                <div className="flex items-center space-x-2">
                  <CalendarDaysIcon className="h-3 w-3 text-indigo-300" />
                  <span className="font-bold tracking-wider">Expiry: {formatDate(leaveType.expiry_date)}</span>
                </div>
              </div>
            )}
            <div className="text-[10px] text-slate-400 bg-white/5 p-2 px-3 rounded-xl border border-white/5 inline-block">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-3 w-3 text-emerald-400" />
                <span className="font-bold tracking-wider">Created: {formatDate(leaveType.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => handleEditType(leaveType)}
            className="inline-flex items-center justify-center p-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl font-bold transition-all shadow-[0_0_10px_rgba(79,70,229,0.2)] w-10 h-10"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteType(leaveType.id)}
            className="inline-flex items-center justify-center p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl font-bold transition-all shadow-[0_0_10px_rgba(244,63,94,0.2)] w-10 h-10"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSpinner text="Loading leave management..." />;
  }

  return (
    <div className="space-y-10 relative z-10">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0A0F1A]/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl point-events-none"></div>
        <div className="relative z-10">
          <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Leave Types & Balances
          </h3>
          <p className="mt-2 text-indigo-200/80 text-lg font-medium">
            Manage leave types and initialize employee leave balances
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 relative z-10">
          <button
            onClick={() => setShowBalanceModal(true)}
            className="inline-flex justify-center items-center px-6 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all transform hover:-translate-y-1"
          >
            <UsersIcon className="h-6 w-6 mr-3" />
            Initialize Balances
          </button>
          <button
            onClick={() => {
              setEditingType(null);
              reset();
              setShowTypeModal(true);
            }}
            className="inline-flex justify-center items-center px-6 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all transform hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(79,70,229,0.6)]"
          >
            <PlusIcon className="h-6 w-6 mr-3" />
            Add Leave Type
          </button>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#0A0F1A]/80 backdrop-blur-xl p-8 rounded-3xl border border-indigo-500/20 shadow-[0_0_30px_rgba(79,70,229,0.1)] relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CalendarDaysIcon className="h-24 w-24 text-indigo-400" />
          </div>
          <div className="flex items-center relative z-10">
            <div className="flex-shrink-0">
              <div className="p-4 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                <CalendarDaysIcon className="h-10 w-10 text-indigo-300" />
              </div>
            </div>
            <div className="ml-6">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Total Leave Types</p>
              <p className="text-4xl font-black text-white mt-1">{leaveTypes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0F1A]/80 backdrop-blur-xl p-8 rounded-3xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <UsersIcon className="h-24 w-24 text-emerald-400" />
          </div>
          <div className="flex items-center relative z-10">
            <div className="flex-shrink-0">
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <UsersIcon className="h-10 w-10 text-emerald-300" />
              </div>
            </div>
            <div className="ml-6">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Employees</p>
              <p className="text-4xl font-black text-white mt-1">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0F1A]/80 backdrop-blur-xl p-8 rounded-3xl border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.1)] relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ChartBarIcon className="h-24 w-24 text-purple-400" />
          </div>
          <div className="flex items-center relative z-10">
            <div className="flex-shrink-0">
              <div className="p-4 bg-purple-500/20 border border-purple-500/30 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <ChartBarIcon className="h-10 w-10 text-purple-300" />
              </div>
            </div>
            <div className="ml-6">
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Active Leave Types</p>
              <p className="text-4xl font-black text-white mt-1">
                {leaveTypes.filter(type => type.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Leave Types Grid */}
      <div>
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            <SparklesIcon className="h-8 w-8 text-indigo-400" />
          </div>
          <h4 className="text-2xl font-black text-white tracking-wide">Available Leave Types</h4>
        </div>

        {leaveTypes.length === 0 ? (
          <div className="text-center py-24 bg-[#0A0F1A]/50 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
            <div className="relative z-10">
              <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.2)]">
                <CalendarDaysIcon className="h-16 w-16 text-indigo-400" />
              </div>
              <h3 className="text-3xl font-black text-white mb-4">No Leave Types Yet</h3>
              <p className="text-slate-400 mb-10 text-xl font-medium max-w-md mx-auto">
                Get started by creating your first leave type for employees to request.
              </p>
              <button
                onClick={() => {
                  setEditingType(null);
                  reset();
                  setShowTypeModal(true);
                }}
                className="inline-flex justify-center items-center px-8 py-5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all transform hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] text-lg"
              >
                <PlusIcon className="h-6 w-6 mr-3" />
                Create First Leave Type
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {leaveTypes.map((leaveType) => (
              <LeaveTypeCard key={leaveType.id} leaveType={leaveType} />
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Leave Type Modal */}
      <Modal
        isOpen={showTypeModal}
        onClose={() => {
          setShowTypeModal(false);
          setEditingType(null);
          reset();
        }}
        title={editingType ? 'Edit Leave Type' : 'Add Leave Type'}
        size="large"
      >
        <form onSubmit={handleSubmit(onSubmitType)} className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Leave Type Name <span className="text-rose-400">*</span>
              </label>
              <input
                {...register('name', { required: 'Leave type name is required' })}
                type="text"
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-2xl text-white shadow-inner focus:ring-indigo-500 focus:border-indigo-500 font-medium text-lg placeholder-slate-500 p-4 transition-all"
                placeholder="e.g., Annual Leave, Sick Leave"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-rose-400 font-bold ml-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Leave Code <span className="text-rose-400">*</span>
              </label>
              <input
                {...register('code', { required: 'Leave code is required' })}
                type="text"
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-2xl text-white shadow-inner focus:ring-indigo-500 focus:border-indigo-500 font-medium text-lg placeholder-slate-500 p-4 transition-all uppercase"
                placeholder="e.g., AL, SL, ML"
                maxLength={10}
              />
              <p className="mt-1 text-xs text-slate-500 ml-1">
                For Earned Leave, use code <span className="text-indigo-300 font-semibold">EL</span> (required for accrual/ledger). Codes and names must be unique.
              </p>
              {errors.code && (
                <p className="mt-2 text-sm text-rose-400 font-bold ml-1">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Days Allowed Per Year <span className="text-rose-400">*</span>
              </label>
              <input
                {...register('days_allowed_per_year', {
                  required: 'Days allowed is required',
                  min: { value: 0, message: 'Days must be 0 or greater' }
                })}
                type="number"
                min="0"
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-2xl text-white shadow-inner focus:ring-indigo-500 focus:border-indigo-500 font-medium text-lg placeholder-slate-500 p-4 transition-all"
              />
              {errors.days_allowed_per_year && (
                <p className="mt-2 text-sm text-rose-400 font-bold ml-1">{errors.days_allowed_per_year.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Start Date <span className="text-rose-400">*</span>
              </label>
              <input
                {...register('start_date', { required: 'Start date is required' })}
                type="date"
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-2xl text-white shadow-inner focus:ring-indigo-500 focus:border-indigo-500 font-medium text-lg placeholder-slate-500 p-4 transition-all"
              />
              {errors.start_date && (
                <p className="mt-2 text-sm text-rose-400 font-bold ml-1">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Expiry Date
              </label>
              <input
                {...register('expiry_date')}
                type="date"
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-2xl text-white shadow-inner focus:ring-indigo-500 focus:border-indigo-500 font-medium text-lg placeholder-slate-500 p-4 transition-all"
              />
              {errors.expiry_date && (
                <p className="mt-2 text-sm text-rose-400 font-bold ml-1">{errors.expiry_date.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-2xl text-white shadow-inner focus:ring-indigo-500 focus:border-indigo-500 font-medium text-lg placeholder-slate-500 p-4 transition-all"
                placeholder="Brief description of this leave type..."
              />
            </div>

            <div className="sm:col-span-2">
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-400 to-purple-500"></div>
                <div className="flex items-center relative z-10 pl-2">
                  <div className="relative flex items-center">
                    <input
                      {...register('is_carry_forward')}
                      type="checkbox"
                      id="is_carry_forward"
                      className="peer sr-only"
                    />
                    <label
                      htmlFor="is_carry_forward"
                      className="relative h-6 w-11 cursor-pointer rounded-full bg-white/10 transition-colors before:absolute before:left-0.5 before:top-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow before:transition-transform before:content-[''] peer-checked:bg-indigo-500 peer-checked:before:translate-x-full peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-900 border border-white/20"
                    ></label>
                  </div>
                  <label htmlFor="is_carry_forward" className="ml-4 block text-lg font-bold text-white cursor-pointer">
                    Allow carry forward to next year
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Max Carry Forward Days
              </label>
              <input
                {...register('max_carry_forward_days')}
                type="number"
                min="0"
                className="block w-full bg-[#0A0F1A] border-white/10 rounded-2xl text-white shadow-inner focus:ring-indigo-500 focus:border-indigo-500 font-medium text-lg placeholder-slate-500 p-4 transition-all"
                placeholder="0"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-rose-400 to-pink-500"></div>
                <div className="flex items-center relative z-10 pl-2">
                  <div className="relative flex items-center">
                    <input
                      {...register('is_unpaid')}
                      type="checkbox"
                      id="is_unpaid"
                      className="peer sr-only"
                    />
                    <label
                      htmlFor="is_unpaid"
                      className="relative h-6 w-11 cursor-pointer rounded-full bg-white/10 transition-colors before:absolute before:left-0.5 before:top-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow before:transition-transform before:content-[''] peer-checked:bg-rose-500 peer-checked:before:translate-x-full peer-focus-visible:ring-2 peer-focus-visible:ring-rose-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-900 border border-white/20"
                    ></label>
                  </div>
                  <label htmlFor="is_unpaid" className="ml-4 block text-lg font-bold text-white cursor-pointer">
                    Mark as Unpaid <span className="text-rose-400/80 font-medium text-base ml-2">(triggers automated salary deduction)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-emerald-400 to-green-500"></div>
                <div className="flex items-center relative z-10 pl-2">
                  <div className="relative flex items-center">
                    <input
                      {...register('is_active')}
                      type="checkbox"
                      id="is_active"
                      defaultChecked={true}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor="is_active"
                      className="relative h-6 w-11 cursor-pointer rounded-full bg-white/10 transition-colors before:absolute before:left-0.5 before:top-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow before:transition-transform before:content-[''] peer-checked:bg-emerald-500 peer-checked:before:translate-x-full peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-900 border border-white/20"
                    ></label>
                  </div>
                  <label htmlFor="is_active" className="ml-4 block text-lg font-bold text-white cursor-pointer">
                    Active <span className="text-emerald-400 font-medium text-base ml-2">(employees can apply for this leave)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-6 pt-8 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setShowTypeModal(false);
                setEditingType(null);
                reset();
              }}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl shadow-lg border border-white/10 transition-all transform hover:-translate-y-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all transform hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] disabled:opacity-50 disabled:transform-none"
            >
              {submitting ? 'Saving...' : (editingType ? 'Update Leave Type' : 'Create Leave Type')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enhanced Initialize Balances Modal */}
      <Modal
        isOpen={showBalanceModal}
        onClose={() => {
          setShowBalanceModal(false);
          resetBalance();
        }}
        title="Initialize Employee Leave Balances"
        size="medium"
      >
        <div className="space-y-8 relative z-10">
          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-400 to-orange-500"></div>
            <div className="flex items-center space-x-5 relative z-10">
              <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30">
                <ExclamationTriangleIcon className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <h4 className="text-xl font-black text-amber-400 mb-1">Important Notice</h4>
                <p className="text-amber-100/80 leading-relaxed">
                  This will create leave balance records for all active employees for the specified year.
                  <strong className="text-amber-300 font-black ml-1">Existing balances will not be overwritten.</strong>
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitBalance(onSubmitBalanceInit)} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Year <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  {...registerBalance('year', { required: 'Year is required' })}
                  className="block w-full bg-[#0A0F1A] border-white/10 rounded-2xl text-white shadow-inner focus:ring-emerald-500 focus:border-emerald-500 font-medium text-lg p-4 transition-all appearance-none pr-10"
                >
                  <option value="" className="bg-slate-900 text-slate-400">Select Year</option>
                  {[2023, 2024, 2025, 2026].map(year => (
                    <option key={year} value={year} className="bg-slate-900">{year}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {balanceErrors.year && (
                <p className="mt-2 text-sm text-rose-400 font-bold ml-1">{balanceErrors.year.message}</p>
              )}
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-green-500"></div>
              <div className="flex items-center space-x-3 mb-6 relative z-10">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <RocketLaunchIcon className="h-6 w-6 text-emerald-400" />
                </div>
                <h4 className="text-xl font-black text-white">Initialization Summary</h4>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between bg-[#0A0F1A]/80 border border-white/5 p-4 rounded-xl shadow-inner">
                  <span className="font-bold text-slate-300">Active employees to receive balances:</span>
                  <span className="font-black text-2xl text-emerald-300">{employees.length}</span>
                </div>
                <div className="flex items-center justify-between bg-[#0A0F1A]/80 border border-white/5 p-4 rounded-xl shadow-inner">
                  <span className="font-bold text-slate-300">Active leave types to assign:</span>
                  <span className="font-black text-2xl text-emerald-300">{leaveTypes.filter(t => t.is_active).length}</span>
                </div>
                <div className="flex items-center justify-between bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.15)] mt-6">
                  <span className="font-bold text-white uppercase tracking-wider text-sm">Total balance records to create:</span>
                  <span className="font-black text-3xl text-emerald-400">{employees.length * leaveTypes.filter(t => t.is_active).length}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-6 pt-8 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowBalanceModal(false);
                  resetBalance();
                }}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl shadow-lg border border-white/10 transition-all transform hover:-translate-y-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
              >
                {submitting ? 'Initializing...' : 'Initialize Balances Now'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default LeaveTypesManagement;