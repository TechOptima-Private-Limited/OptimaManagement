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

const EmployeeManagement = () => {
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
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700">
        <div className="absolute inset-0 bg-black opacity-10"></div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <Star className="h-6 w-6 text-yellow-300 animate-pulse" />
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
                Employee Management
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                Manage employee records, track onboarding status, and handle employee lifecycle
              </p>

              <div className="flex items-center space-x-6 text-blue-100">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">{employeeCounts.active} Active Employees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">{employeeCounts.submitted} Self-Submitted</span>
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
            { key: 'all', label: 'Total Employees', count: employeeCounts.all, color: 'from-blue-500 to-blue-600', icon: Users },
            { key: 'active', label: 'Active', count: employeeCounts.active, color: 'from-emerald-500 to-emerald-600', icon: UserCheck },
            { key: 'deleted', label: 'Deleted', count: employeeCounts.deleted, color: 'from-rose-500 to-rose-600', icon: UserX },
            { key: 'submitted', label: 'Self-Submitted', count: employeeCounts.submitted, color: 'from-purple-500 to-purple-600', icon: FileText },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.key} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                          {stat.count}
                        </p>
                        <p className="text-sm font-medium text-gray-600">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                    <TrendingUp className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Filter and Search */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/50 p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Filter Tabs */}
            <div className="flex space-x-2">
              {[
                { key: 'active', label: 'Active', count: employeeCounts.active },
                { key: 'deleted', label: 'Deleted', count: employeeCounts.deleted },
                { key: 'all', label: 'All', count: employeeCounts.all },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${filter === tab.key
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative lg:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
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
                  className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50 overflow-hidden transform hover:-translate-y-1 ${employee.is_deleted ? 'opacity-75' : ''
                    }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${profileGradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 ${employee.is_deleted ? 'grayscale' : ''
                            }`}>
                            <span className="text-white font-bold text-lg">
                              {employeeInitials}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-400 rounded-full border-2 border-white flex items-center justify-center">
                            {getSubmissionStatusIcon(employee)}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className={`text-xl font-bold group-hover:text-indigo-600 transition-colors duration-300 ${employee.is_deleted ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}>
                              {employee.first_name} {employee.last_name}
                              {employee.is_deleted && <span className="text-rose-500 ml-2">[DELETED]</span>}
                            </h3>

                            {employee.is_self_submitted && (
                              <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
                                ✓ Self-Submitted
                              </span>
                            )}

                            {employee.it_notification_sent && (
                              <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                                IT Notified
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-semibold text-gray-800">Email:</span> {employee.email}
                            </div>
                            {employee.department && (
                              <div>
                                <span className="font-semibold text-gray-800">Department:</span> {employee.department}
                              </div>
                            )}
                            {employee.position && (
                              <div>
                                <span className="font-semibold text-gray-800">Position:</span> {employee.position}
                              </div>
                            )}
                            {employee.joining_date && (
                              <div>
                                <span className="font-semibold text-gray-800">Joining:</span> {new Date(employee.joining_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          {/* Document Status */}
                          <div className="mt-3 flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                Documents: {documentStatus.documentsCollected}/{documentStatus.totalRequired} collected
                              </span>
                              {documentStatus.isComplete && (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Download className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                Files: {documentStatus.filesUploaded}/{documentStatus.totalRequired} uploaded
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>

                        {employee.is_deleted ? (
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowRestoreConfirm(true);
                            }}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
                            title="Restore Employee"
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
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                            title="Delete Employee"
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
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowDetailsModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">
                      Employee Details
                    </h3>
                    <p className="text-blue-100">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                      {selectedEmployee.is_deleted && <span className="text-rose-300"> [DELETED]</span>}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Basic Information</h4>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                      <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">
                        {selectedEmployee.first_name} {selectedEmployee.last_name}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                      <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">{selectedEmployee.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                      <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">{selectedEmployee.phone_number || 'Not provided'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Employee Type</label>
                      <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">{selectedEmployee.employee_type || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Employment Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Employment Details</h4>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                      <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">{selectedEmployee.department || 'Not assigned'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Position</label>
                      <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">{selectedEmployee.position || 'Not assigned'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Joining Date</label>
                      <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">
                        {selectedEmployee.joining_date ? new Date(selectedEmployee.joining_date).toLocaleDateString() : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div className="mt-6 space-y-4">
                  <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Status Information</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/70 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Submission Status</label>
                      {selectedEmployee.is_self_submitted ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                          <span className="text-sm font-medium text-emerald-700">Self-Submitted</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-amber-500" />
                          <span className="text-sm font-medium text-amber-700">Pending</span>
                        </div>
                      )}
                      {selectedEmployee.submitted_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted: {new Date(selectedEmployee.submitted_at).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="bg-white/70 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">IT Notification</label>
                      {selectedEmployee.it_notification_sent ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                          <span className="text-sm font-medium text-blue-700">Notified</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-5 w-5 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Not Notified</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/70 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Account Status</label>
                      {selectedEmployee.is_deleted ? (
                        <div className="flex items-center space-x-2">
                          <Trash2 className="h-5 w-5 text-rose-500" />
                          <span className="text-sm font-medium text-rose-700">Deleted</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                          <span className="text-sm font-medium text-emerald-700">Active</span>
                        </div>
                      )}
                      {selectedEmployee.deleted_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Deleted: {new Date(selectedEmployee.deleted_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Status */}
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Document Status</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'aadhar_pan', label: 'Aadhar & PAN Card' },
                      { key: 'payslips', label: 'Payslips' },
                      { key: 'educational_certificates', label: 'Educational Certificates' },
                      { key: 'previous_offer_letter', label: 'Previous Offer Letter' },
                      { key: 'relieving_experience_letters', label: 'Relieving & Experience Letters' },
                      { key: 'appraisal_hike_letters', label: 'Appraisal/Hike Letters' },
                    ].map((doc) => {
                      const collected = selectedEmployee[`${doc.key}_collected`];
                      const file = selectedEmployee[`${doc.key}_file`];

                      return (
                        <div key={doc.key} className="bg-white/70 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{doc.label}</span>
                            <div className="flex items-center space-x-2">
                              {collected && (
                                <CheckCircle className="h-4 w-4 text-emerald-500" title="Collected" />
                              )}
                              {file && (
                                <FileText className="h-4 w-4 text-blue-500" title="File Uploaded" />
                              )}
                              {!collected && !file && (
                                <XCircle className="h-4 w-4 text-gray-400" title="Not Collected" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
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
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowDeleteConfirm(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
              <div className="bg-gradient-to-br from-gray-50 to-red-50/30 px-6 py-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-xl font-bold text-gray-900">
                      Delete Employee
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete <strong className="text-gray-900">{selectedEmployee.first_name} {selectedEmployee.last_name}</strong>?
                        This will soft delete the employee record. You can restore it later if needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => softDeleteEmployee(selectedEmployee.id)}
                  className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-base font-semibold text-white hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-4 focus:ring-red-200 transform hover:scale-105 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:mt-0 sm:w-auto sm:text-sm"
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
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowRestoreConfirm(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
              <div className="bg-gradient-to-br from-gray-50 to-green-50/30 px-6 py-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <RotateCcw className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-xl font-bold text-gray-900">
                      Restore Employee
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to restore <strong className="text-gray-900">{selectedEmployee.first_name} {selectedEmployee.last_name}</strong>?
                        This will reactivate the employee record and make it visible in the active employees list.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => restoreEmployee(selectedEmployee.id)}
                  className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-base font-semibold text-white hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 transform hover:scale-105 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </button>
                <button
                  onClick={() => setShowRestoreConfirm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:mt-0 sm:w-auto sm:text-sm"
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