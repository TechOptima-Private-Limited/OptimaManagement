import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api, { adminUserAPI } from '../../services/api';
import {
  PlusIcon,
  UserMinusIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const OffboardingManagement = () => {
  const [offboardings, setOffboardings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOffboarding, setSelectedOffboarding] = useState(null);
  const [newOffboarding, setNewOffboarding] = useState({
    employee: '',
    last_working_date: '',
    notice_period_days: 30,
    remarks: '',
    resignation_email_screenshot: null
  });

  useEffect(() => {
    fetchOffboardings();
    fetchEmployees();
  }, []);

  const fetchOffboardings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/onboarding/offboarding/');
      setOffboardings(data.results || data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch offboardings');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await adminUserAPI.getUsers();
      setEmployees(data.results || data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    }
  };

  const getEmployeeDisplayName = (employee) => {
    return employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.email;
  };

  const createOffboarding = async () => {
    try {
      const formData = new FormData();
      formData.append('employee', newOffboarding.employee);
      formData.append('last_working_date', newOffboarding.last_working_date);
      formData.append('notice_period_days', newOffboarding.notice_period_days ?? 30);
      formData.append('remarks', newOffboarding.remarks);

      if (newOffboarding.resignation_email_screenshot) {
        // Backend expects 'damaged_assets_file'
        formData.append('damaged_assets_file', newOffboarding.resignation_email_screenshot);
      }

      await api.post('/onboarding/offboarding/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Offboarding created successfully!');
      setShowCreateModal(false);
      setNewOffboarding({
        employee: '',
        last_working_date: '',
        notice_period_days: 30,
        remarks: '',
        resignation_email_screenshot: null
      });
      fetchOffboardings();
    } catch (error) {
      console.error('Error:', error);
      const message = error?.response?.data?.error || error?.response?.data?.detail || 'Failed to create offboarding';
      toast.error(message);
    }
  };

  const deleteOffboarding = async (offboardingId) => {
    if (!window.confirm('Are you sure you want to delete this offboarding record?')) {
      return;
    }

    try {
      await api.delete(`/onboarding/offboarding/${offboardingId}/`);
      toast.success('Offboarding deleted successfully!');
      fetchOffboardings();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete offboarding');
    }
  };

  const isOverdue = (lastWorkingDate) => {
    return new Date(lastWorkingDate) < new Date();
  };

  const getDaysUntilLastWorking = (lastWorkingDate) => {
    const today = new Date();
    const lastDate = new Date(lastWorkingDate);
    const diffTime = lastDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (lastWorkingDate) => {
    const days = getDaysUntilLastWorking(lastWorkingDate);
    if (days < 0) return 'bg-red-100 text-red-800';
    if (days <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusLabel = (lastWorkingDate) => {
    const days = getDaysUntilLastWorking(lastWorkingDate);
    if (days < 0) return 'Completed';
    if (days === 0) return 'Last Day';
    if (days <= 7) return `${days} days left`;
    return `${days} days left`;
  };

  const filteredOffboardings = (offboardings || []).filter(offboarding =>
    offboarding.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offboarding.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Track employees who already have an offboarding record (for disabling options)
  const offboardedEmployeeIds = new Set((offboardings || []).map(o => o.employee));
  const displayEmployees = (employees || []);
  const matchingEmployees = employeeSearchTerm.trim().length >= 2
    ? displayEmployees.filter((employee) =>
      getEmployeeDisplayName(employee).toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      (employee.email || '').toLowerCase().includes(employeeSearchTerm.toLowerCase())
    )
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-black text-slate-700 dark:text-slate-300 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Offboarding Management</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Manage employee offboarding process and exit procedures
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setEmployeeSearchTerm('');
              setShowEmployeeDropdown(false);
            }}
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 border border-rose-500/50 rounded-xl shadow-lg shadow-rose-500/20 text-sm font-bold text-slate-900 dark:text-white hover:from-rose-400 hover:to-red-500 hover:shadow-rose-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Offboarding
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-lg p-6 hover:bg-white dark:bg-slate-900/80 transition-all duration-300 group">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-xl bg-indigo-500/20 shadow-inner border border-indigo-500/30 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <UserMinusIcon className="h-7 w-7" />
              </div>
              <div className="ml-5">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</h3>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{(offboardings || []).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-lg p-6 hover:bg-white dark:bg-slate-900/80 transition-all duration-300 group">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-xl bg-amber-500/20 shadow-inner border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform duration-300">
                <CalendarDaysIcon className="h-7 w-7" />
              </div>
              <div className="ml-5">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">This Week</h3>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {(offboardings || []).filter(o => getDaysUntilLastWorking(o.last_working_date) >= 0 && getDaysUntilLastWorking(o.last_working_date) <= 7).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-lg p-6 hover:bg-white dark:bg-slate-900/80 transition-all duration-300 group">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-xl bg-emerald-500/20 shadow-inner border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                <DocumentTextIcon className="h-7 w-7" />
              </div>
              <div className="ml-5">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</h3>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {(offboardings || []).filter(o => isOverdue(o.last_working_date)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-lg p-6 hover:bg-white dark:bg-slate-900/80 transition-all duration-300 group">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-xl bg-purple-500/20 shadow-inner border border-purple-500/30 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                <span className="text-xl font-bold">
                  {(offboardings || []).length > 0 ? Math.round((offboardings || []).reduce((sum, o) => sum + (parseInt(o.notice_period_days || 0) || 0), 0) / (offboardings || []).length) : 0}
                </span>
              </div>
              <div className="ml-5">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Notice</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search offboardings by name or remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-black/20 border border-black/10 dark:border-white/10 rounded-xl leading-5 text-slate-700 dark:text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-black/40 transition-all duration-200"
            />
          </div>
        </div>

        {/* Offboardings List */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
          <ul className="divide-y divide-white/5">
            {filteredOffboardings.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full mb-4 shadow-inner">
                  <UserMinusIcon className="h-10 w-10 text-slate-500" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-slate-700 dark:text-slate-300">No offboardings found</h3>
                <p className="mt-2 text-sm text-slate-500">
                  No offboarding records match your search criteria.
                </p>
              </div>
            ) : (
              filteredOffboardings.map((offboarding) => (
                <li key={offboarding.id} className="px-6 py-5 hover:bg-black/5 dark:bg-white/5 transition-colors duration-150 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-5">
                      <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-black/10 dark:border-white/10 rounded-xl flex items-center justify-center shadow-inner group-hover:border-indigo-500/30 transition-colors">
                        <span className="text-indigo-300 font-bold text-lg">
                          {offboarding.employee_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-300 transition-colors">
                            {offboarding.employee_name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(offboarding.last_working_date).replace('bg-red-100 text-red-800', 'bg-rose-500/20 text-rose-300 border-rose-500/30')
                            .replace('bg-yellow-100 text-yellow-800', 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                            .replace('bg-green-100 text-green-800', 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                            }`}>
                            {getStatusLabel(offboarding.last_working_date)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="flex items-center">
                            <CalendarDaysIcon className="w-4 h-4 mr-1.5 text-slate-500" />
                            Last Working: <span className="text-slate-700 dark:text-slate-300 ml-1">{new Date(offboarding.last_working_date).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center">
                            <DocumentTextIcon className="w-4 h-4 mr-1.5 text-slate-500" />
                            Notice: <span className="text-slate-700 dark:text-slate-300 ml-1">{offboarding.notice_period_days} days</span>
                          </span>
                        </div>
                        {offboarding.remarks && (
                          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 truncate bg-black/20 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 inline-block max-w-lg">
                            {offboarding.remarks}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedOffboarding(offboarding);
                          setShowDetailsModal(true);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-black/10 dark:border-white/10 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-black/20 hover:bg-black/10 dark:bg-white/10 hover:text-slate-900 dark:text-white transition-colors"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View
                      </button>

                      <button
                        onClick={() => deleteOffboarding(offboarding.id)}
                        className="inline-flex items-center px-3 py-2 border border-rose-500/30 rounded-lg text-sm font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Create Offboarding Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-white dark:bg-slate-900/90 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
              <div className="inline-block align-bottom bg-[#0A0F1A] border border-black/10 dark:border-white/10 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                  <div className="flex items-center justify-between mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Add Offboarding Record
                    </h3>
                    <button onClick={() => setShowCreateModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Employee *</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={employeeSearchTerm}
                          onChange={(e) => {
                            setEmployeeSearchTerm(e.target.value);
                            setShowEmployeeDropdown(true);
                            if (newOffboarding.employee) {
                              setNewOffboarding({ ...newOffboarding, employee: '' });
                            }
                          }}
                          onFocus={() => setShowEmployeeDropdown(true)}
                          placeholder="Type at least 2 letters to search employee"
                          className="block w-full bg-black/20 border border-black/10 dark:border-white/10 rounded-xl shadow-sm py-2.5 px-3 text-slate-700 dark:text-slate-300 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                        />
                        {showEmployeeDropdown && (
                          <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                            {employeeSearchTerm.trim().length < 2 ? (
                              <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                                Type at least 2 letters to search
                              </div>
                            ) : matchingEmployees.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                                No matching employees
                              </div>
                            ) : (
                              matchingEmployees.map((employee) => {
                                const isOffboarded = offboardedEmployeeIds.has(employee.id);
                                const name = getEmployeeDisplayName(employee);
                                return (
                                  <button
                                    type="button"
                                    key={employee.id}
                                    disabled={isOffboarded}
                                    onClick={() => {
                                      setNewOffboarding({ ...newOffboarding, employee: employee.id });
                                      setEmployeeSearchTerm(name);
                                      setShowEmployeeDropdown(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-black/10 dark:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isOffboarded ? `${name} (already offboarded)` : name}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Last Working Date *</label>
                      <input
                        type="date"
                        value={newOffboarding.last_working_date}
                        onChange={(e) => setNewOffboarding({ ...newOffboarding, last_working_date: e.target.value })}
                        className="block w-full bg-black/20 border border-black/10 dark:border-white/10 rounded-xl shadow-sm py-2.5 px-3 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notice Period (Days) *</label>
                      <input
                        type="number"
                        value={newOffboarding.notice_period_days}
                        onChange={(e) => setNewOffboarding({ ...newOffboarding, notice_period_days: parseInt(e.target.value) })}
                        className="block w-full bg-black/20 border border-black/10 dark:border-white/10 rounded-xl shadow-sm py-2.5 px-3 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Resignation Email Screenshot</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewOffboarding({ ...newOffboarding, resignation_email_screenshot: e.target.files[0] })}
                        className="block w-full bg-black/20 border border-black/10 dark:border-white/10 rounded-xl shadow-sm py-2 px-3 text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 transition-all focus:outline-none"
                      />
                      <p className="mt-2 text-xs text-slate-500">Upload screenshot of resignation email (optional)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Remarks</label>
                      <textarea
                        value={newOffboarding.remarks}
                        onChange={(e) => setNewOffboarding({ ...newOffboarding, remarks: e.target.value })}
                        rows={3}
                        className="block w-full bg-black/20 border border-black/10 dark:border-white/10 rounded-xl shadow-sm py-2.5 px-3 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                        placeholder="Additional notes about the offboarding..."
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10 px-6 py-4 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={createOffboarding}
                    disabled={!newOffboarding.employee || !newOffboarding.last_working_date}
                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-base font-bold text-slate-900 dark:text-white hover:from-rose-400 hover:to-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F1A] focus:ring-rose-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Confirm Offboarding
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-black/10 dark:border-white/10 shadow-sm px-6 py-2.5 bg-black/5 dark:bg-white/5 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-black/10 dark:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F1A] focus:ring-slate-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Offboarding Details Modal */}
        {showDetailsModal && selectedOffboarding && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-white dark:bg-slate-900/90 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)}></div>
              <div className="inline-block align-bottom bg-[#0A0F1A] border border-black/10 dark:border-white/10 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                  <div className="flex items-center justify-between mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Offboarding Details
                    </h3>
                    <button onClick={() => setShowDetailsModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-4">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee Name</label>
                      <p className="mt-1.5 text-base font-medium text-slate-900 dark:text-white">{selectedOffboarding.employee_name}</p>
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-4">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                      <p className="mt-1.5 text-base font-medium text-slate-900 dark:text-white">{selectedOffboarding.employee_email || 'Not available'}</p>
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-4">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Working Date</label>
                      <p className="mt-1.5 text-base font-medium text-slate-900 dark:text-white">{new Date(selectedOffboarding.last_working_date).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-4">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Notice Period</label>
                      <p className="mt-1.5 text-base font-medium text-slate-900 dark:text-white">{selectedOffboarding.notice_period_days} days</p>
                    </div>
                    <div className="col-span-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-4">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedOffboarding.last_working_date).replace('bg-red-100 text-red-800', 'bg-rose-500/20 text-rose-300 border-rose-500/30')
                        .replace('bg-yellow-100 text-yellow-800', 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                        .replace('bg-green-100 text-green-800', 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                        }`}>
                        {getStatusLabel(selectedOffboarding.last_working_date)}
                      </span>
                    </div>
                    {selectedOffboarding.remarks && (
                      <div className="col-span-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-4">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks</label>
                        <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedOffboarding.remarks}</p>
                      </div>
                    )}
                    {selectedOffboarding.damaged_assets_file && (
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resignation Email Screenshot</label>
                        <div className="mt-2 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-lg group">
                          <img
                            src={selectedOffboarding.damaged_assets_file}
                            alt="Resignation Email"
                            className="w-full h-auto object-contain bg-black/50 group-hover:scale-[1.02] transition-transform duration-300"
                            style={{ maxHeight: '400px' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10 px-6 py-4 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="w-full inline-flex justify-center rounded-xl border border-black/10 dark:border-white/10 shadow-sm px-6 py-2.5 bg-black/5 dark:bg-white/5 text-base font-medium text-slate-900 dark:text-white hover:bg-black/10 dark:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F1A] focus:ring-slate-500 sm:ml-3 sm:w-auto sm:text-sm transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OffboardingManagement;