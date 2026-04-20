import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  RotateCcw,
  Trash2,
  Download,
  Filter,
  Search,
  AlertTriangle,
  Star,
  TrendingUp,
  Shield
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const EmployeeManagement = () => {
  const { theme, isDark } = useTheme();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // 'active', 'deleted', 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Mock toast function
  const toast = {
    success: (message) => alert(`Success: ${message}`),
    error: (message) => alert(`Error: ${message}`)
  };

  useEffect(() => {
    fetchEmployees();
  }, [filter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      let url = `${apiBase}/onboarding/employees/`;

      // Add filter parameters based on filter type
      if (filter === 'active') {
        url += '?active_only=true';
      } else if (filter === 'deleted') {
        url += '?deleted_only=true';
      }
      // 'all' doesn't need parameters

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.results || data);
      } else {
        toast.error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const softDeleteEmployee = async (employeeId) => {
    try {
      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const response = await fetch(`${apiBase}/onboarding/employees/${employeeId}/soft_delete/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Employee deleted successfully!');
        setShowDeleteConfirm(false);
        setSelectedEmployee(null);
        fetchEmployees();
      } else {
        toast.error('Failed to delete employee');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete employee');
    }
  };

  const restoreEmployee = async (employeeId) => {
    try {
      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const response = await fetch(`${apiBase}/onboarding/employees/${employeeId}/restore/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Employee restored successfully!');
        setShowRestoreConfirm(false);
        setSelectedEmployee(null);
        fetchEmployees();
      } else {
        toast.error('Failed to restore employee');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to restore employee');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-400 border-amber-200';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-400 border-emerald-500/20';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-white/5/10 text-white border-white/10';
    }
  };

  const getSubmissionStatusIcon = (employee) => {
    if (employee.is_deleted) {
      return <Trash2 className="h-5 w-5 text-rose-500" />;
    } else if (employee.is_self_submitted) {
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    } else {
      return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  const getDocumentStatus = (employee) => {
    const documentsCollected = [
      employee.aadhar_pan_collected,
      employee.payslips_collected,
      employee.educational_certificates_collected,
      employee.previous_offer_letter_collected,
      employee.relieving_experience_letters_collected,
      employee.appraisal_hike_letters_collected,
    ].filter(Boolean).length;

    const filesUploaded = [
      employee.aadhar_pan_file,
      employee.payslips_file,
      employee.educational_certificates_file,
      employee.previous_offer_letter_file,
      employee.relieving_experience_letters_file,
      employee.appraisal_hike_letters_file,
    ].filter(Boolean).length;

    const totalRequired = 6;

    return {
      documentsCollected,
      filesUploaded,
      totalRequired,
      isComplete: documentsCollected === totalRequired && filesUploaded === totalRequired
    };
  };

  const getEmployeeInitials = (name) => {
    const fullName = `${name.first_name || ''} ${name.last_name || ''}`;
    return fullName.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getProfileGradient = (name) => {
    const gradients = [
      'from-violet-500 to-purple-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-indigo-500 to-blue-600'
    ];
    const fullName = `${name.first_name || ''} ${name.last_name || ''}`;
    const index = fullName.length % gradients.length;
    return gradients[index];
  };

  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`;
    const searchLower = searchTerm.toLowerCase();
    return (
      fullName.toLowerCase().includes(searchLower) ||
      (employee.email || '').toLowerCase().includes(searchLower) ||
      (employee.department || '').toLowerCase().includes(searchLower) ||
      (employee.position || '').toLowerCase().includes(searchLower)
    );
  });

  const employeeCounts = {
    all: employees.length,
    active: employees.filter(e => !e.is_deleted).length,
    deleted: employees.filter(e => e.is_deleted).length,
    submitted: employees.filter(e => e.is_self_submitted && !e.is_deleted).length,
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient} flex justify-center items-center`}>
        <div className="text-center">
          <div className="relative">
            <div className={`w-20 h-20 border-4 ${isDark ? 'border-indigo-500/20' : 'border-indigo-100'} rounded-full animate-spin`}>
              <div className={`absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin`}></div>
            </div>
          </div>
          <p className={`mt-6 text-sm font-black uppercase tracking-widest ${theme.muted.text}`}>Loading employee matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient}`}>
      {/* Enhanced Header Section */}
      <div className={`relative overflow-hidden bg-gradient-to-r ${theme.primaryGradient}`}>
        <div className="absolute inset-0 bg-black opacity-10"></div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
              </div>

              <h1 className="text-5xl lg:text-7xl font-black text-white mb-4 tracking-tighter uppercase">
                Employee <span className="text-blue-200">Management</span>
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mb-8 leading-relaxed font-medium">
                Manage employee records, track onboarding status, and handle employee lifecycle transitions with high-fidelity control.
              </p>

              <div className="flex items-center space-x-8 text-white/90">
                <div className="flex items-center space-x-3 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                  <span className="text-xs font-black uppercase tracking-widest">{employeeCounts.active} Active</span>
                </div>
                <div className="flex items-center space-x-3 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                  <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]"></div>
                  <span className="text-xs font-black uppercase tracking-widest">{employeeCounts.submitted} Submitted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { key: 'all', label: 'Total Matrix', count: employeeCounts.all, color: 'from-blue-500 to-indigo-600', icon: Users },
            { key: 'active', label: 'Current Active', count: employeeCounts.active, color: 'from-emerald-500 to-teal-600', icon: UserCheck },
            { key: 'deleted', label: 'Archived', count: employeeCounts.deleted, color: 'from-rose-500 to-pink-600', icon: UserX },
            { key: 'submitted', label: 'Self-Verified', count: employeeCounts.submitted, color: 'from-purple-500 to-violet-600', icon: FileText },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.key} className={`${theme.cardBg} ${theme.cardBorder} backdrop-blur-xl rounded-[2rem] shadow-xl border overflow-hidden p-6 group hover:scale-[1.02] transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all duration-300`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>
                        {stat.count}
                      </p>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${theme.muted.text}`}>
                        {stat.label}
                      </p>
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Filter and Search */}
        <div className={`${theme.cardBg} ${theme.cardBorder} backdrop-blur-xl shadow-xl rounded-[2rem] border p-8 space-y-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            {/* Filter Tabs */}
            <div className={`flex p-1.5 ${isDark ? 'bg-black/20' : 'bg-slate-100'} rounded-2xl border ${theme.muted.border}`}>
              {[
                { key: 'active', label: 'Active', count: employeeCounts.active },
                { key: 'deleted', label: 'Archived', count: employeeCounts.deleted },
                { key: 'all', label: 'Matrix', count: employeeCounts.all },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${filter === tab.key
                    ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-lg shadow-indigo-500/20`
                    : `${theme.muted.text} hover:text-indigo-500`
                    }`}
                >
                  {tab.label} <span className="opacity-50 ml-1">[{tab.count}]</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative lg:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className={`h-5 w-5 ${theme.muted.text} group-focus-within:text-indigo-500 transition-colors`} />
              </div>
              <input
                type="text"
                placeholder="Search employee matrix..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-6 py-3.5 border-2 ${theme.muted.border} rounded-2xl ${isDark ? 'bg-black/20' : 'bg-white'} ${theme.text} focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none font-bold text-sm tracking-tight`}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Employee List */}
        <div className="grid grid-cols-1 gap-6">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative mx-auto w-32 h-32 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full animate-pulse"></div>
                <Users className="absolute inset-4 text-indigo-300" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No employees found</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                No employees match your current search and filter criteria.
              </p>
            </div>
          ) : (
            filteredEmployees.map((employee, index) => {
              const employeeInitials = getEmployeeInitials(employee);
              const profileGradient = getProfileGradient(employee);
              const documentStatus = getDocumentStatus(employee);

              return (
                <div
                  key={employee.id}
                  className={`${theme.cardBg} ${theme.cardBorder} backdrop-blur-xl rounded-[2.5rem] shadow-lg border overflow-hidden p-8 group hover:scale-[1.01] transition-all duration-500 ${employee.is_deleted ? 'opacity-60' : ''
                    }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.surfaceGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                  <div className="relative">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
                      <div className="flex items-center space-x-6">
                        <div className="relative group/avatar">
                          <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${profileGradient} flex items-center justify-center shadow-2xl group-hover/avatar:rotate-12 transition-all duration-500 ${employee.is_deleted ? 'grayscale' : ''
                            }`}>
                            <span className="text-white font-black text-2xl tracking-tighter">
                              {employeeInitials}
                            </span>
                          </div>
                          <div className={`absolute -bottom-2 -right-2 w-8 h-8 ${isDark ? 'bg-[#070B14]' : 'bg-white'} rounded-2xl border-2 ${theme.cardBorder.split(' ')[1]} flex items-center justify-center shadow-xl`}>
                            {getSubmissionStatusIcon(employee)}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className={`text-2xl font-black group-hover:text-indigo-500 transition-colors duration-300 tracking-tight ${employee.is_deleted ? 'line-through opacity-50' : isDark ? 'text-white' : 'text-slate-900'
                              }`}>
                              {employee.first_name} {employee.last_name}
                            </h3>

                            {employee.is_self_submitted && (
                              <span className={`inline-flex items-center px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border ${theme.success.bg} ${theme.success.text} ${theme.success.border} shadow-sm`}>
                                <CheckCircle className="h-3 w-3 mr-2" />
                                Verified
                              </span>
                            )}

                            {employee.it_notification_sent && (
                              <span className={`inline-flex items-center px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border ${theme.info.bg} ${theme.info.text} ${theme.info.border} shadow-sm`}>
                                <Shield className="h-3 w-3 mr-2" />
                                IT Ready
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                             <div className="flex items-center space-x-3">
                               <Mail className={`h-4 w-4 ${theme.muted.text}`} />
                               <span className={`text-xs font-bold ${theme.muted.text} tracking-tight truncate max-w-[180px]`}>{employee.email}</span>
                             </div>
                             <div className="flex items-center space-x-3">
                               <Building className={`h-4 w-4 ${theme.muted.text}`} />
                               <span className={`text-xs font-bold ${theme.muted.text} tracking-tight`}>{employee.department || 'No Dept'}</span>
                             </div>
                             <div className="flex items-center space-x-3">
                               <UserIcon className={`h-4 w-4 ${theme.muted.text}`} />
                               <span className={`text-xs font-bold ${theme.muted.text} tracking-tight`}>{employee.position || 'No Title'}</span>
                             </div>
                             <div className="flex items-center space-x-3">
                               <Calendar className={`h-4 w-4 ${theme.muted.text}`} />
                               <span className={`text-xs font-bold ${theme.muted.text} tracking-tight`}>Joined {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'N/A'}</span>
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                         <div className={`${isDark ? 'bg-black/20' : 'bg-slate-100'} p-3 rounded-2xl border ${theme.muted.border} hidden md:block`}>
                            <div className="flex items-center space-x-4">
                               <div className="text-center px-2">
                                  <p className={`text-[10px] font-black uppercase tracking-widest ${theme.muted.text} mb-1`}>Docs</p>
                                  <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{documentStatus.documentsCollected}/{documentStatus.totalRequired}</p>
                               </div>
                               <div className={`w-px h-6 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                               <div className="text-center px-2">
                                  <p className={`text-[10px] font-black uppercase tracking-widest ${theme.muted.text} mb-1`}>Files</p>
                                  <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{documentStatus.filesUploaded}/{documentStatus.totalRequired}</p>
                               </div>
                            </div>
                         </div>

                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowDetailsModal(true);
                          }}
                          className={`p-4 ${isDark ? 'bg-white/5' : 'bg-slate-100'} ${theme.muted.text} hover:text-indigo-500 hover:bg-indigo-500/10 rounded-2xl transition-all duration-300 border ${theme.muted.border} group-hover:shadow-lg`}
                          title="View Matrix"
                        >
                          <Eye className="h-5 w-5" />
                        </button>

                        {employee.is_deleted ? (
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowRestoreConfirm(true);
                            }}
                            className={`flex items-center px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-300`}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowDeleteConfirm(true);
                            }}
                            className={`p-4 ${isDark ? 'bg-white/5' : 'bg-slate-100'} ${theme.muted.text} hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all duration-300 border ${theme.muted.border} group-hover:shadow-lg`}
                            title="Archive Matrix"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Enhanced Employee Details Modal */}
      {showDetailsModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className={`fixed inset-0 ${isDark ? 'bg-[#070B14]/80' : 'bg-slate-900/40'} backdrop-blur-sm transition-opacity duration-300`} onClick={() => setShowDetailsModal(false)}></div>

            <div className={`inline-block align-bottom ${theme.cardBg} ${theme.cardBorder} rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border`}>
              {/* Header */}
              <div className={`bg-gradient-to-r ${theme.primaryGradient} px-8 py-8 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="relative flex items-center">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
                    <Eye className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                      Employee Matrix
                    </h3>
                    <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mt-1">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                      {selectedEmployee.is_deleted && <span className="text-rose-300"> [ARCHIVED]</span>}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 lg:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-[0.2em] border-b ${theme.muted.border.split(' ')[1]} pb-4 flex items-center`}>
                       <User className="h-4 w-4 mr-2 text-indigo-500" />
                       Core Data
                    </h4>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.muted.text} mb-2`}>Identity</label>
                        <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'} ${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-xl px-4 py-3 border ${theme.muted.border}`}>
                          {selectedEmployee.first_name} {selectedEmployee.last_name}
                        </p>
                      </div>

                      <div>
                        <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.muted.text} mb-2`}>Communication</label>
                        <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'} ${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-xl px-4 py-3 border ${theme.muted.border}`}>{selectedEmployee.email}</p>
                      </div>

                      <div>
                        <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.muted.text} mb-2`}>Mobile</label>
                        <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'} ${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-xl px-4 py-3 border ${theme.muted.border}`}>{selectedEmployee.phone_number || 'Securely Undisclosed'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Employment Details */}
                  <div className="space-y-6">
                    <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-[0.2em] border-b ${theme.muted.border.split(' ')[1]} pb-4 flex items-center`}>
                       <Building className="h-4 w-4 mr-2 text-indigo-500" />
                       Org Hierarchy
                    </h4>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.muted.text} mb-2`}>Unit</label>
                        <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'} ${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-xl px-4 py-3 border ${theme.muted.border}`}>{selectedEmployee.department || 'Awaiting Assignment'}</p>
                      </div>

                      <div>
                        <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.muted.text} mb-2`}>Designation</label>
                        <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'} ${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-xl px-4 py-3 border ${theme.muted.border}`}>{selectedEmployee.position || 'Awaiting Designation'}</p>
                      </div>

                      <div>
                        <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.muted.text} mb-2`}>Activation Date</label>
                        <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'} ${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-xl px-4 py-3 border ${theme.muted.border}`}>
                          {selectedEmployee.joining_date ? new Date(selectedEmployee.joining_date).toLocaleDateString() : 'Pending Activation'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div className="mt-12 space-y-6">
                  <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-[0.2em] border-b ${theme.muted.border.split(' ')[1]} pb-4`}>Compliance & Status</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-2xl p-5 border ${theme.muted.border}`}>
                      <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.muted.text} mb-3`}>Verification</label>
                      {selectedEmployee.is_self_submitted ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                          <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-amber-500" />
                          <span className="text-xs font-black uppercase tracking-widest text-amber-500">Pending</span>
                        </div>
                      )}
                      {selectedEmployee.submitted_at && (
                        <p className={`text-[10px] font-bold ${theme.muted.text} mt-2 uppercase`}>
                           {new Date(selectedEmployee.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-2xl p-5 border ${theme.muted.border}`}>
                      <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.muted.text} mb-3`}>IT Protocol</label>
                      {selectedEmployee.it_notification_sent ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-indigo-500" />
                          <span className="text-xs font-black uppercase tracking-widest text-indigo-500">Notified</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-5 w-5 text-slate-400" />
                          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Standby</span>
                        </div>
                      )}
                    </div>

                    <div className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-2xl p-5 border ${theme.muted.border}`}>
                      <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.muted.text} mb-3`}>Lifecycle</label>
                      {selectedEmployee.is_deleted ? (
                        <div className="flex items-center space-x-2">
                          <Trash2 className="h-5 w-5 text-rose-500" />
                          <span className="text-xs font-black uppercase tracking-widest text-rose-500">Archived</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                          <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Status */}
                <div className="mt-12">
                  <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-[0.2em] border-b ${theme.muted.border.split(' ')[1]} pb-4 mb-6`}>Secure Vault Status</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'aadhar_pan', label: 'Identity Protocol' },
                      { key: 'payslips', label: 'Financial Matrix' },
                      { key: 'educational_certificates', label: 'Academic Verified' },
                      { key: 'previous_offer_letter', label: 'Legacy Offer' },
                      { key: 'relieving_experience_letters', label: 'Clearance Docs' },
                      { key: 'appraisal_hike_letters', label: 'Growth Reports' },
                    ].map((doc) => {
                      const collected = selectedEmployee[`${doc.key}_collected`];
                      const file = selectedEmployee[`${doc.key}_file`];

                      return (
                        <div key={doc.key} className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-xl p-4 border ${theme.muted.border} group/doc hover:border-indigo-500/30 transition-all`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-700'}`}>{doc.label}</span>
                            <div className="flex items-center space-x-3">
                              {collected ? (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-rose-500/50" />
                              )}
                              {file && (
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={`px-8 py-6 ${isDark ? 'bg-white/5' : 'bg-slate-50'} border-t ${theme.muted.border.split(' ')[1]} flex justify-end`}>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`inline-flex items-center px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border ${theme.muted.border} ${theme.muted.text} hover:bg-white/10 transition-all shadow-lg active:scale-95`}
                >
                  Close Matrix
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className={`fixed inset-0 ${isDark ? 'bg-[#070B14]/80' : 'bg-slate-900/40'} backdrop-blur-sm transition-opacity duration-300`} onClick={() => setShowDeleteConfirm(false)}></div>

            <div className={`inline-block align-bottom ${theme.cardBg} ${theme.cardBorder} rounded-[2rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border`}>
              <div className="p-8">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-inner">
                    <AlertTriangle className="h-7 w-7 text-rose-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tight`}>
                      Archive Matrix
                    </h3>
                    <div className="mt-4">
                      <p className={`text-sm ${theme.muted.text} font-medium leading-relaxed`}>
                        Are you sure you want to archive <strong className={`${isDark ? 'text-white' : 'text-slate-900'} font-black`}>{selectedEmployee.first_name} {selectedEmployee.last_name}</strong>? 
                        This record will be moved to the archive matrix but can be restored by a system admin.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`px-8 py-6 ${isDark ? 'bg-white/5' : 'bg-slate-50'} border-t ${theme.muted.border.split(' ')[1]} flex flex-row-reverse gap-4`}>
                <button
                  onClick={() => softDeleteEmployee(selectedEmployee.id)}
                  className={`flex-1 inline-flex justify-center items-center rounded-2xl border border-transparent shadow-xl px-6 py-4 bg-gradient-to-r from-rose-600 to-red-600 text-xs font-black uppercase tracking-widest text-white hover:from-rose-500 hover:to-red-500 hover:shadow-rose-500/40 transform hover:-translate-y-1 transition-all duration-300 active:scale-95`}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Archive Profile
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`flex-1 inline-flex justify-center rounded-2xl border ${theme.muted.border} px-6 py-4 ${isDark ? 'bg-white/5' : 'bg-white'} text-xs font-black uppercase tracking-widest ${theme.muted.text} hover:bg-white/10 transition-all duration-200 active:scale-95`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Restore Confirmation Modal */}
      {showRestoreConfirm && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className={`fixed inset-0 ${isDark ? 'bg-[#070B14]/80' : 'bg-slate-900/40'} backdrop-blur-sm transition-opacity duration-300`} onClick={() => setShowRestoreConfirm(false)}></div>

            <div className={`inline-block align-bottom ${theme.cardBg} ${theme.cardBorder} rounded-[2rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border`}>
              <div className="p-8">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
                    <RotateCcw className="h-7 w-7 text-emerald-500 animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tight`}>
                      Restore Matrix
                    </h3>
                    <div className="mt-4">
                      <p className={`text-sm ${theme.muted.text} font-medium leading-relaxed`}>
                        Are you ready to restore <strong className={`${isDark ? 'text-white' : 'text-slate-900'} font-black`}>{selectedEmployee.first_name} {selectedEmployee.last_name}</strong>? 
                        The record will be reactivated and reintegrated into the primary matrix immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`px-8 py-6 ${isDark ? 'bg-white/5' : 'bg-slate-50'} border-t ${theme.muted.border.split(' ')[1]} flex flex-row-reverse gap-4`}>
                <button
                  onClick={() => restoreEmployee(selectedEmployee.id)}
                  className={`flex-1 inline-flex justify-center items-center rounded-2xl border border-transparent shadow-xl px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-black uppercase tracking-widest text-white hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/40 transform hover:-translate-y-1 transition-all duration-300 active:scale-95`}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore Matrix
                </button>
                <button
                  onClick={() => setShowRestoreConfirm(false)}
                  className={`flex-1 inline-flex justify-center rounded-2xl border ${theme.muted.border} px-6 py-4 ${isDark ? 'bg-white/5' : 'bg-white'} text-xs font-black uppercase tracking-widest ${theme.muted.text} hover:bg-white/10 transition-all duration-200 active:scale-95`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
