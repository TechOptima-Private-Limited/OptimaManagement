import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { employeeAPI } from '../../services/api';
import { isHRManager, isAdmin } from '../../utils/auth';
import { formatDate } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8080/api";

const AddEmployeeModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    user: {
      username: '',
      email: '',
      first_name: '',
      last_name: ''
    },
    profile: {
      role: 'EMPLOYEE',
      phone_number: '',
      address: '',
      date_of_birth: '',
      emergency_contact: ''
    },
    employee_id: '',
    department_id: '',
    position: '',
    hire_date: new Date().toISOString().split('T')[0],
    manager: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchDepartments = async () => {
    try {
      const response = await employeeAPI.getDepartments();
      setDepartments(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getEmployees();
      setEmployees(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      toast.error('Failed to load employees');
    }
  };

  const handleInputChange = (e, nestedField = null) => {
    const { name, value } = e.target;
    if (nestedField) {
      setFormData(prev => ({
        ...prev,
        [nestedField]: {
          ...prev[nestedField],
          [name]: value
        }
      }));
      // Clear error for the field
      setErrors(prev => ({ ...prev, [nestedField]: { ...prev[nestedField], [name]: '' } }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.user.username) newErrors.user = { ...newErrors.user, username: 'Username is required' };
    if (!formData.user.email) {
      newErrors.user = { ...newErrors.user, email: 'Email is required' };
    } else if (!/\S+@\S+\.\S+/.test(formData.user.email)) {
      newErrors.user = { ...newErrors.user, email: 'Invalid email format' };
    }
    if (!formData.employee_id) newErrors.employee_id = 'Employee ID is required';
    if (!formData.department_id) newErrors.department_id = 'Department is required';
    if (!formData.position) newErrors.position = 'Position is required';
    if (!formData.hire_date) newErrors.hire_date = 'Hire date is required';
    if (formData.profile.phone_number && !/^\+?\d{10,15}$/.test(formData.profile.phone_number)) {
      newErrors.profile = { ...newErrors.profile, phone_number: 'Invalid phone number' };
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const response = await employeeAPI.createEmployee(formData);

      if (response.status === 201 || response.status === 200) {
        toast.success('Employee created successfully!');
        setFormData({
          user: {
            username: '',
            email: '',
            first_name: '',
            last_name: ''
          },
          profile: {
            role: 'EMPLOYEE',
            phone_number: '',
            address: '',
            date_of_birth: '',
            emergency_contact: ''
          },
          employee_id: '',
          department_id: '',
          position: '',
          hire_date: new Date().toISOString().split('T')[0],
          manager: ''
        });
        setErrors({});
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      const errorMessage = error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to create employee';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Enhanced backdrop with blur */}
        <div className="fixed inset-0 transition-opacity bg-[#070B14] dark:bg-[#070B14]/80 backdrop-blur-md" onClick={onClose}></div>

        {/* Modal centering trick */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Enhanced modal container */}
        <div className="relative inline-block align-bottom bg-[#0A0F1A] rounded-t-3xl sm:rounded-3xl text-left overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] transform transition-all duration-300 sm:my-8 sm:align-middle w-full sm:max-w-4xl border border-white/10 dark:border-white/10">

          {/* Enhanced header */}
          <div className="relative bg-gradient-to-r from-emerald-900/40 via-teal-900/40 to-[#0A0F1A] px-6 py-6 sm:px-8 border-b border-white/10">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl translate-y-24 -translate-x-24"></div>

            <div className="relative flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 p-[2px] shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                    <div className="w-full h-full bg-[#0A0F1A] rounded-[14px] flex items-center justify-center backdrop-blur-sm">
                      <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="ml-5">
                  <h2 className="text-2xl font-black text-white tracking-tight">Add New Employee</h2>
                  <p className="text-emerald-400/80 text-sm font-bold tracking-wide mt-1">Create a comprehensive employee profile</p>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-black/10 dark:bg-white/10 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hidden sm:block"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Enhanced content area */}
          <div className="bg-[#0A0F1A] px-4 sm:px-8 py-6 max-h-[70vh] overflow-y-auto relative z-10 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* User Fields */}
              <div className="space-y-4">
                <div className="bg-[#070B14] dark:bg-[#070B14] p-5 rounded-2xl border border-indigo-500/20 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:bg-indigo-500/10 transition-colors duration-500"></div>

                  <h3 className="text-sm font-black text-indigo-400 mb-5 flex items-center uppercase tracking-widest relative z-10">
                    <span className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center mr-3 border border-indigo-500/20">
                      <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    Personal Info
                  </h3>

                  <div className="space-y-4 relative z-10">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="username"
                        value={formData.user.username}
                        onChange={(e) => handleInputChange(e, 'user')}
                        className={`w-full px-4 py-2.5 bg-[#0A0F1A] border rounded-xl shadow-sm transition-all duration-300 outline-none text-sm text-white placeholder-slate-600 ${errors.user?.username
                          ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                          : 'border-white/10 dark:border-white/10 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 hover:border-black/20 dark:border-white/20'
                          }`}
                        placeholder="e.g. jdoe"
                        required
                      />
                      {errors.user?.username && <p className="text-rose-400 text-xs mt-1.5 flex items-center font-bold">
                        <svg className="h-3.5 w-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.user.username}
                      </p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.user.email}
                          onChange={(e) => handleInputChange(e, 'user')}
                          className={`w-full px-4 py-2.5 pl-11 bg-[#0A0F1A] border rounded-xl shadow-sm transition-all duration-300 outline-none text-sm text-white placeholder-slate-600 ${errors.user?.email
                            ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                            : 'border-white/10 dark:border-white/10 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 hover:border-black/20 dark:border-white/20'
                            }`}
                          placeholder="employee@company.com"
                          required
                        />
                        <svg className="h-4 w-4 text-slate-500 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      {errors.user?.email && <p className="text-rose-400 text-xs mt-1.5 flex items-center font-bold">
                        <svg className="h-3.5 w-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.user.email}
                      </p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">First Name</label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.user.first_name}
                          onChange={(e) => handleInputChange(e, 'user')}
                          className="w-full px-4 py-2.5 bg-[#0A0F1A] border border-white/10 dark:border-white/10 rounded-xl shadow-sm focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 hover:border-black/20 dark:border-white/20 transition-all duration-300 outline-none text-sm text-white placeholder-slate-600"
                          placeholder="Jane"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Last Name</label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.user.last_name}
                          onChange={(e) => handleInputChange(e, 'user')}
                          className="w-full px-4 py-2.5 bg-[#0A0F1A] border border-white/10 dark:border-white/10 rounded-xl shadow-sm focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 hover:border-black/20 dark:border-white/20 transition-all duration-300 outline-none text-sm text-white placeholder-slate-600"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* UserProfile Fields */}
              <div className="space-y-4">
                <div className="bg-[#070B14] dark:bg-[#070B14] p-5 rounded-2xl border border-emerald-500/20 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:bg-emerald-500/10 transition-colors duration-500"></div>

                  <h3 className="text-sm font-black text-emerald-400 mb-5 flex items-center uppercase tracking-widest relative z-10">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mr-3 border border-emerald-500/20">
                      <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </span>
                    Contact & Role
                  </h3>

                  <div className="space-y-4 relative z-10">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                      <div className="relative">
                        <select
                          name="role"
                          value={formData.profile.role}
                          onChange={(e) => handleInputChange(e, 'profile')}
                          className="w-full px-4 py-2.5 bg-[#0A0F1A] border border-white/10 dark:border-white/10 rounded-xl shadow-sm focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 hover:border-black/20 dark:border-white/20 transition-all duration-300 outline-none appearance-none cursor-pointer text-sm text-white"
                        >
                          <option value="EMPLOYEE" className="bg-[#0A0F1A]">Employee</option>
                          <option value="HR_MANAGER" className="bg-[#0A0F1A]">HR Manager</option>
                          <option value="ADMIN" className="bg-[#0A0F1A]">Admin</option>
                          <option value="MANAGER" className="bg-[#0A0F1A]">Manager</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                      <input
                        type="text"
                        name="phone_number"
                        value={formData.profile.phone_number}
                        onChange={(e) => handleInputChange(e, 'profile')}
                        className={`w-full px-4 py-2.5 bg-[#0A0F1A] border rounded-xl shadow-sm transition-all duration-300 outline-none text-sm text-white placeholder-slate-600 ${errors.profile?.phone_number
                          ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                          : 'border-white/10 dark:border-white/10 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 hover:border-black/20 dark:border-white/20'
                          }`}
                        placeholder="+1 (555) 000-0000"
                      />
                      {errors.profile?.phone_number && <p className="text-rose-400 text-xs mt-1.5 font-bold">{errors.profile.phone_number}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date of Birth</label>
                        <input
                          type="date"
                          name="date_of_birth"
                          value={formData.profile.date_of_birth}
                          onChange={(e) => handleInputChange(e, 'profile')}
                          className="w-full px-4 py-2.5 bg-[#0A0F1A] border border-white/10 dark:border-white/10 rounded-xl shadow-sm focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 hover:border-black/20 dark:border-white/20 transition-all duration-300 outline-none text-sm text-white [color-scheme:dark]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Emergency</label>
                        <input
                          type="text"
                          name="emergency_contact"
                          value={formData.profile.emergency_contact}
                          onChange={(e) => handleInputChange(e, 'profile')}
                          className="w-full px-4 py-2.5 bg-[#0A0F1A] border border-white/10 dark:border-white/10 rounded-xl shadow-sm focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 hover:border-black/20 dark:border-white/20 transition-all duration-300 outline-none text-sm text-white placeholder-slate-600"
                          placeholder="Contact Info"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address - Full Width Enhanced */}
              <div className="md:col-span-2">
                <div className="bg-[#070B14] dark:bg-[#070B14] p-5 rounded-2xl border border-violet-500/20 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 rounded-full blur-2xl -translate-y-24 translate-x-24 group-hover:bg-violet-500/10 transition-colors duration-500"></div>

                  <h3 className="text-sm font-black text-violet-400 mb-3 flex items-center uppercase tracking-widest relative z-10">
                    <span className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mr-3 border border-violet-500/20">
                      <svg className="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    Address
                  </h3>
                  <textarea
                    name="address"
                    value={formData.profile.address}
                    onChange={(e) => handleInputChange(e, 'profile')}
                    className="w-full px-4 py-3 bg-[#0A0F1A] border border-white/10 dark:border-white/10 rounded-xl shadow-sm focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 hover:border-black/20 dark:border-white/20 transition-all duration-300 outline-none resize-none text-sm text-white placeholder-slate-600 relative z-10"
                    placeholder="Enter full address"
                    rows="2"
                  />
                </div>
              </div>

              {/* Employee Fields */}
              <div className="md:col-span-2">
                <div className="bg-[#070B14] dark:bg-[#070B14] p-5 rounded-2xl border border-rose-500/20 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:bg-rose-500/10 transition-colors duration-500"></div>

                  <h3 className="text-sm font-black text-rose-400 mb-5 flex items-center uppercase tracking-widest relative z-10">
                    <span className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center mr-3 border border-rose-500/20">
                      <svg className="h-4 w-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                    </span>
                    Work Identity
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="employee_id"
                        value={formData.employee_id}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 bg-[#0A0F1A] border rounded-xl shadow-sm transition-all duration-300 outline-none text-sm text-white placeholder-slate-600 ${errors.employee_id
                          ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                          : 'border-white/10 dark:border-white/10 focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 hover:border-black/20 dark:border-white/20'
                          }`}
                        placeholder="e.g. TO-00076"
                        required
                      />
                      {errors.employee_id && <p className="text-rose-400 text-xs mt-1.5 font-bold">{errors.employee_id}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <select
                          name="department_id"
                          value={formData.department_id}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 bg-[#0A0F1A] border rounded-xl shadow-sm transition-all duration-300 outline-none text-sm text-white appearance-none cursor-pointer ${errors.department_id
                            ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                            : 'border-white/10 dark:border-white/10 focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 hover:border-black/20 dark:border-white/20'
                            }`}
                          required
                        >
                          <option value="" className="bg-[#0A0F1A]">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id} className="bg-[#0A0F1A]">
                              {dept.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {errors.department_id && <p className="text-rose-400 text-xs mt-1.5 font-bold">{errors.department_id}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Position <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 bg-[#0A0F1A] border rounded-xl shadow-sm transition-all duration-300 outline-none text-sm text-white placeholder-slate-600 ${errors.position
                          ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                          : 'border-white/10 dark:border-white/10 focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 hover:border-black/20 dark:border-white/20'
                          }`}
                        placeholder="e.g. Developer"
                        required
                      />
                      {errors.position && <p className="text-rose-400 text-xs mt-1.5 font-bold">{errors.position}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hire Date <span className="text-rose-500">*</span></label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="date"
                          name="hire_date"
                          value={formData.hire_date}
                          onChange={handleInputChange}
                          className={`flex-1 px-4 py-2.5 bg-[#0A0F1A] border rounded-xl shadow-sm transition-all duration-300 outline-none text-sm text-white [color-scheme:dark] ${errors.hire_date
                            ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                            : 'border-white/10 dark:border-white/10 focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 hover:border-black/20 dark:border-white/20'
                            }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            hire_date: new Date().toISOString().split('T')[0]
                          }))}
                          className="px-3 py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-colors duration-200 text-xs font-bold tracking-wide"
                        >
                          Today
                        </button>
                      </div>
                      {errors.hire_date && <p className="text-rose-400 text-xs mt-1.5 font-bold">{errors.hire_date}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Direct Manager</label>
                      <div className="relative">
                        <select
                          name="manager"
                          value={formData.manager}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-[#0A0F1A] border border-white/10 dark:border-white/10 rounded-xl shadow-sm focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 hover:border-black/20 dark:border-white/20 transition-all duration-300 outline-none text-sm text-white appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-[#0A0F1A]">None / Top Level</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id} className="bg-[#0A0F1A]">
                              {emp.user?.first_name} {emp.user?.last_name} ({emp.user?.username || emp.user_info?.username || emp.employee_id})
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="bg-white/5 px-6 py-5 sm:px-8 flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 border-t border-white/10 relative z-10 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-white/10 dark:border-white/10 px-6 py-2.5 bg-transparent text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl border border-transparent shadow-[0_0_20px_rgba(52,211,153,0.3)] px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-bold text-white hover:from-emerald-400 hover:to-teal-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-black/20 dark:border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Employee
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, employee, loading }) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-[#070B14] dark:bg-[#070B14]/80 backdrop-blur-md" onClick={onClose}></div>

        {/* Modal centering trick */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-[#0A0F1A] rounded-3xl text-left overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/10 dark:border-white/10">
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50"></div>

          <div className="px-6 pt-8 pb-6 sm:p-8 sm:pb-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.2)] sm:mx-0 sm:h-12 sm:w-12">
                <TrashIcon className="h-6 w-6 text-rose-400" />
              </div>
              <div className="mt-4 text-center sm:mt-0 sm:ml-6 sm:text-left">
                <h3 className="text-xl leading-6 font-black text-white tracking-tight">
                  Delete Employee
                </h3>
                <div className="mt-3">
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">
                    Are you sure you want to delete <span className="font-bold text-white bg-white/5 px-2 py-0.5 rounded-md border border-white/10 dark:border-white/10">{employee.user_info?.full_name || employee.user?.username || employee.employee_id}</span>?
                    This action cannot be undone and will permanently remove all associated data.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md px-6 py-4 sm:flex sm:flex-row-reverse sm:px-8 border-t border-white/10">
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-xl border border-transparent px-6 py-3 bg-rose-600 text-sm font-black text-white hover:bg-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-black/20 dark:border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Deleting...</span>
                </div>
              ) : (
                'Yes, Delete Employee'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-xl border border-white/10 dark:border-white/10 shadow-sm px-6 py-3 bg-white/5 text-sm font-bold text-slate-300 hover:bg-black/10 dark:bg-white/10 hover:text-white transition-all duration-300 focus:outline-none sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeList = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    status: '',
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchEmployees();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.department) params.department = filters.department;
      if (filters.status) params.status = filters.status;

      const response = await employeeAPI.getEmployees(params);
      console.log('Fetched employees:', response.data);
      setEmployees(response.data.results || response.data || []);
    } catch (error) {
      toast.error('Failed to fetch employees');
      console.error('Employee fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await employeeAPI.getDepartments();
      setDepartments(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', department: '', status: '' });
  };

  const handleAddEmployeeSuccess = () => {
    fetchEmployees();
    setShowAddModal(false);
  };

  const handleEditEmployee = (employee) => {
    navigate(`/employees/${employee.id}`, { state: { editMode: true } });
  };

  const handleDeleteEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedEmployee) return;

    setDeleteLoading(true);
    try {
      await employeeAPI.deleteEmployee(selectedEmployee.id);
      toast.success('Employee deleted successfully!');
      fetchEmployees();
      setShowDeleteModal(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Error deleting employee:', error);
      const errorMessage = error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to delete employee';
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'INACTIVE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'TERMINATED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-[#070B14]/10 text-slate-400 border-slate-500/20';
    }
  };

  // Helper function to get employee name
  const getEmployeeName = (employee) => {
    if (employee.user_info?.full_name) {
      return employee.user_info.full_name;
    }
    if (employee.user_info?.first_name || employee.user_info?.last_name) {
      return `${employee.user_info.first_name || ''} ${employee.user_info.last_name || ''}`.trim();
    }
    // Fallback for old format
    if (employee.user) {
      return `${employee.user.first_name || ''} ${employee.user.last_name || ''}`.trim();
    }
    return 'Unknown Employee';
  };

  // Helper function to get employee initials for profile picture
  const getEmployeeInitials = (employee) => {
    if (employee.user_info) {
      const firstName = employee.user_info.first_name || '';
      const lastName = employee.user_info.last_name || '';
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    // Fallback for old format
    if (employee.user) {
      const firstName = employee.user.first_name || '';
      const lastName = employee.user.last_name || '';
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return 'UE';
  };

  // Helper function to get manager name
  const getManagerName = (employee) => {
    if (employee.manager?.user_info?.full_name) {
      return employee.manager.user_info.full_name;
    }
    if (employee.manager?.user_info?.first_name || employee.manager?.user_info?.last_name) {
      return `${employee.manager.user_info.first_name || ''} ${employee.manager.user_info.last_name || ''}`.trim();
    }
    return 'No Manager';
  };

  // Generate a consistent gradient color for each employee based on their name
  const getProfileGradient = (name) => {
    const gradients = [
      'from-indigo-600 to-violet-700',
      'from-blue-600 to-indigo-700',
      'from-violet-600 to-purple-700',
      'from-cyan-600 to-blue-700',
      'from-indigo-500 to-blue-600',
      'from-purple-600 to-indigo-700'
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#070B14] dark:bg-[#070B14] flex justify-center items-center`}>
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-white/10 rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-full blur-xl animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-slate-400 font-medium tracking-wide animate-pulse">Syncing Directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] dark:bg-[#070B14] text-slate-200 selection:bg-indigo-500/30">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden pt-12 pb-20">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] translate-y-1/2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Organization Hub</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">
                Employee <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Directory</span>
              </h1>

              <p className="text-lg text-slate-400 max-w-2xl font-medium leading-relaxed">
                Empowering our team through seamless connectivity and expertise Discovery across <span className="text-slate-200">Optima Management</span>.
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 dark:border-white/10">
                  <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                    <UserGroupIcon className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Talent</div>
                    <div className="text-sm font-black text-white">{employees.length} Members</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 dark:border-white/10">
                  <div className="p-1.5 bg-blue-500/20 rounded-lg">
                    <BuildingOfficeIcon className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Business Units</div>
                    <div className="text-sm font-black text-white">{departments.length} Departments</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Add Employee Button */}
            {(isHRManager() || isAdmin()) && (
              <div className="flex-shrink-0">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="group relative inline-flex items-center px-8 py-4 bg-indigo-600 rounded-2xl font-black text-white shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_15px_50px_-10px_rgba(79,70,229,0.6)] transform hover:-translate-y-1 transition-all duration-300"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  <span>Onboard Talent</span>
                  {/* Glass shimmer effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Premium Filters Section */}
        <div className="bg-white/5 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/10 dark:border-white/10 p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-5 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Search Talent</label>
            <div className="relative group">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-300" />
              <input
                type="text"
                placeholder="Name, position, or ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#0A0F1A] border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none font-medium"
              />
            </div>
          </div>

          <div className="lg:col-span-3 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="w-full px-4 py-4 bg-[#0A0F1A] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none appearance-none cursor-pointer font-medium"
            >
              <option value="">All Business Units</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id} className="bg-[#0A0F1A]">{dept.name}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Work Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-4 bg-[#0A0F1A] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none appearance-none cursor-pointer font-medium"
            >
              <option value="">All Status</option>
              <option value="ACTIVE" className="bg-[#0A0F1A]">Active</option>
              <option value="INACTIVE" className="bg-[#0A0F1A]">Inactive</option>
              <option value="TERMINATED" className="bg-[#0A0F1A]">Terminated</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <button
              onClick={clearFilters}
              className="w-full inline-flex items-center justify-center px-6 py-4 bg-white/5 border border-white/10 dark:border-white/10 text-sm font-black text-slate-300 rounded-2xl hover:bg-black/10 dark:bg-white/10 hover:text-white transition-all duration-300 group"
            >
              <FunnelIcon className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Enhanced Employee Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {employees.length === 0 ? (
            <div className="col-span-full text-center py-24 bg-white/5 rounded-[40px] border border-white/10 dark:border-white/10 backdrop-blur-xl">
              <div className="relative mx-auto w-32 h-32 mb-8">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative flex items-center justify-center w-full h-full bg-[#0A0F1A] rounded-full border border-white/10 dark:border-white/10">
                  <UserIcon className="h-12 w-12 text-slate-500" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-white mb-3">No results found</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto font-medium">
                {filters.search || filters.department || filters.status
                  ? "We couldn't find any talent matching your refined search criteria."
                  : 'The directory is currently empty. Start by onboarding new talent.'}
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all duration-300"
              >
                Show All Directory
              </button>
            </div>
          ) : (
            employees.map((employee, index) => {
              const employeeName = getEmployeeName(employee);
              const employeeInitials = getEmployeeInitials(employee);
              const managerName = getManagerName(employee);
              const profileGradient = getProfileGradient(employeeName);

              return (
                <div
                  key={employee.id}
                  className="group relative bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 dark:border-white/10 hover:border-indigo-500/30 shadow-2xl transition-all duration-500 overflow-hidden hover:-translate-y-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Premium Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative p-8">
                    {/* Employee Header */}
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center space-x-5">
                        <div className="relative">
                          <div className={`h-20 w-20 rounded-3xl bg-gradient-to-br ${profileGradient} flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500`}>
                            <span className="text-white font-black text-2xl tracking-tighter">
                              {employeeInitials}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#070B14] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white/5 rounded-full animate-pulse"></div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors duration-300 leading-tight">
                            {employeeName}
                          </h3>
                          <div className="text-indigo-400 font-bold text-sm tracking-tight mt-1">
                            {employee.position || 'Specialist'}
                          </div>
                        </div>
                      </div>

                      {/* Compact Actions */}
                      {(isHRManager() || isAdmin()) && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="p-2 text-slate-500 hover:text-white hover:bg-black/10 dark:bg-white/10 rounded-xl transition-all duration-200"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all duration-200"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Employee Core Data */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Business Unit</div>
                          <div className="flex items-center text-sm font-black text-slate-200">
                            <BuildingOfficeIcon className="h-3.5 w-3.5 mr-2 text-indigo-400 opacity-70" />
                            {employee.department?.name || 'Unassigned'}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reports To</div>
                          <div className="flex items-center text-sm font-black text-slate-200 truncate">
                            <UserGroupIcon className="h-3.5 w-3.5 mr-2 text-blue-400 opacity-70" />
                            {managerName}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-black">Join Date</div>
                            <div className="flex items-center text-xs font-bold text-slate-300">
                              <CalendarIcon className="h-3.5 w-3.5 mr-2 text-emerald-400 opacity-70" />
                              {employee.hire_date ? formatDate(employee.hire_date) : '-'}
                            </div>
                          </div>

                          <div className="text-right space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-black">Talent ID</div>
                            <div className="text-xs font-black text-slate-300">
                              {employee.user?.username || employee.user_info?.username || employee.employee_id || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status & Engagement Badge */}
                    <div className="mt-8 flex items-center justify-between">
                      <span className={`inline-flex px-4 py-1.5 text-[10px] font-black tracking-widest uppercase rounded-full border ${getStatusColor(employee.status)} shadow-lg shadow-black/20`}>
                        {employee.status || 'ACTIVE'}
                      </span>

                      {employee.subordinates_count > 0 && (
                        <div className="flex items-center space-x-1 text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                          <span>{employee.subordinates_count} Direct Reports</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Premium Results Count */}
        {employees.length > 0 && (
          <div className="flex justify-center pb-12">
            <div className="inline-flex items-center px-6 py-3 bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 dark:border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Showing <span className="text-white font-black">{employees.length}</span> active directory records
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddEmployeeSuccess}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedEmployee(null);
        }}
        onConfirm={confirmDelete}
        employee={selectedEmployee}
        loading={deleteLoading}
      />
    </div>
  );
};

export default EmployeeList;
