import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Plus,
  UserPlus,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Star,
  TrendingUp,
  RotateCcw,
  AlertTriangle,
  LinkIcon,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Shield,
  Filter,
  Search
} from 'lucide-react';

const OnboardingManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDocumentStatusModal, setShowDocumentStatusModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocumentListModal, setShowDocumentListModal] = useState(false);
  const [documentsList, setDocumentsList] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [uploadingEmployee, setUploadingEmployee] = useState(null);
  const [documentStatus, setDocumentStatus] = useState(null);
  const [fileInputs, setFileInputs] = useState([{ id: 1, docType: 'Aadhar and PAN Card', file: null }]);
  const [newEmployee, setNewEmployee] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    employee_type: 'employee',
    department: '',
    position: '',
    current_address: '',
    permanent_address: '',
    joining_date: ''
  });

  // Mock toast function - replace with your actual toast implementation
  const toast = {
    success: (message) => {
      // Replace with your toast library
      console.log('Success:', message);
      alert(`Success: ${message}`);
    },
    error: (message) => {
      // Replace with your toast library
      console.log('Error:', message);
      alert(`Error: ${message}`);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [filter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      let queryParams = '';

      if (filter === 'pending') {
        queryParams = '?status=pending';
      } else if (filter === 'accepted') {
        queryParams = '?status=accepted';
      } else if (filter === 'rejected') {
        queryParams = '?status=rejected';
      } else if (filter === 'deleted') {
        queryParams = '?deleted_only=true';
      }
      // 'all' doesn't need params - it will show active employees by default

      const { data } = await api.get(`/onboarding/employees/${queryParams}`);
      setEmployees(data.results || data);
    } catch (error) {
      console.error('Error:', error);
      if (error?.response?.status === 401) {
        toast.error('Session expired. Redirecting to login...');
      } else {
        toast.error('Failed to fetch employees');
      }
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async () => {
    try {
      // Normalize and validate input
      const deptChoices = ['hr', 'it', 'finance', 'marketing', 'sales', 'operations', 'development', 'design', 'qa', 'support'];
      const positionChoices = [
        'hr_manager', 'hr_executive', 'hr_intern',
        'it_manager', 'system_admin', 'network_engineer', 'it_support',
        'senior_developer', 'junior_developer', 'full_stack_developer', 'frontend_developer', 'backend_developer', 'devops_engineer', 'tech_lead',
        'ui_designer', 'ux_designer', 'graphic_designer',
        'qa_engineer', 'test_lead',
        'finance_manager', 'accountant', 'finance_executive',
        'marketing_manager', 'sales_manager', 'sales_executive', 'digital_marketer',
        'customer_support', 'team_lead',
        'project_manager', 'operations_manager',
        'intern', 'trainee'
      ];

      const mapEmployeeType = (val) => {
        if (!val) return undefined;
        const v = String(val).toLowerCase();
        if (v === 'intern' || v === 'fresher') return 'fresher';
        if (v === 'employee') return 'employee';
        return undefined;
      };

      const payload = {
        first_name: newEmployee.first_name?.trim(),
        last_name: newEmployee.last_name?.trim(),
        email: newEmployee.email?.trim(),
        phone_number: newEmployee.phone_number?.trim(),
        employee_type: mapEmployeeType(newEmployee.employee_type || 'employee') || 'employee',
        department: deptChoices.includes(String(newEmployee.department || '').toLowerCase()) ? String(newEmployee.department).toLowerCase() : undefined,
        position: positionChoices.includes(String(newEmployee.position || '').toLowerCase()) ? String(newEmployee.position).toLowerCase() : undefined,
        current_address: newEmployee.current_address ?? undefined,
        permanent_address: newEmployee.permanent_address ?? undefined,
        joining_date: newEmployee.joining_date || undefined,
      };

      // Client-side required checks
      const missing = [];
      if (!payload.first_name) missing.push('First name');
      if (!payload.last_name) missing.push('Last name');
      if (!payload.email) missing.push('Email');
      if (!payload.phone_number) missing.push('Phone number');
      if (!payload.employee_type) missing.push('Employee type');
      if (missing.length) {
        toast.error(`Please fill required fields: ${missing.join(', ')}`);
        return;
      }

      // Strip empty values
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined || payload[k] === '') delete payload[k];
      });

      const { data: result } = await api.post('/onboarding/employees/create/', payload);
      toast.success('Employee created successfully!');
      setShowCreateModal(false);
      setNewEmployee({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        employee_type: 'employee',
        department: '',
        position: '',
        current_address: '',
        permanent_address: '',
        joining_date: ''
      });
      fetchEmployees();
    } catch (error) {
      console.error('Error:', error);
      const data = error?.response?.data;
      let msg = data?.detail;
      if (!msg && data && typeof data === 'object') {
        try {
          msg = Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ');
        } catch (_) { }
      }
      toast.error(msg || 'Failed to create employee');
    }
  };

  const updateEmployee = async () => {
    if (!editingEmployee) return;

    try {
      const deptChoices = ['hr', 'it', 'finance', 'marketing', 'sales', 'operations', 'development', 'design', 'qa', 'support'];
      const positionChoices = [
        'hr_manager', 'hr_executive', 'hr_intern',
        'it_manager', 'system_admin', 'network_engineer', 'it_support',
        'senior_developer', 'junior_developer', 'full_stack_developer', 'frontend_developer', 'backend_developer', 'devops_engineer', 'tech_lead',
        'ui_designer', 'ux_designer', 'graphic_designer',
        'qa_engineer', 'test_lead',
        'finance_manager', 'accountant', 'finance_executive',
        'marketing_manager', 'sales_manager', 'sales_executive', 'digital_marketer',
        'customer_support', 'team_lead',
        'project_manager', 'operations_manager',
        'intern', 'trainee'
      ];

      const mapEmployeeType = (val) => {
        if (!val) return undefined;
        const v = String(val).toLowerCase();
        if (v === 'intern' || v === 'fresher') return 'fresher';
        if (v === 'employee') return 'employee';
        return undefined;
      };

      const payload = {
        first_name: editingEmployee.first_name?.trim(),
        last_name: editingEmployee.last_name?.trim(),
        email: editingEmployee.email?.trim(),
        phone_number: editingEmployee.phone_number?.trim(),
        employee_type: mapEmployeeType(editingEmployee.employee_type),
        department: deptChoices.includes(String(editingEmployee.department || '').toLowerCase()) ? String(editingEmployee.department).toLowerCase() : undefined,
        position: positionChoices.includes(String(editingEmployee.position || '').toLowerCase()) ? String(editingEmployee.position).toLowerCase() : undefined,
        current_address: editingEmployee.current_address ?? undefined,
        permanent_address: editingEmployee.permanent_address ?? undefined,
        joining_date: editingEmployee.joining_date || undefined,
      };

      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined || payload[k] === '') delete payload[k];
      });

      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8080/api";

      const response = await fetch(`${API_BASE_URL}/onboarding/employees/${editingEmployee.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Employee updated successfully!');
        setShowEditModal(false);
        setEditingEmployee(null);
        fetchEmployees();
      } else {
        let errorMsg = 'Failed to update employee';
        try {
          const error = await response.json();
          errorMsg = error?.detail || Object.entries(error || {})
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ') || errorMsg;
        } catch { }
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update employee');
    }
  };

  const softDeleteEmployee = async (employeeId) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8080/api";
      const response = await fetch(`${API_BASE_URL}/onboarding/employees/${employeeId}/soft_delete/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Employee deleted successfully!');
        setShowDeleteConfirm(false);
        setDeletingEmployee(null);
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
      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8080/api";
      const response = await fetch(`${API_BASE_URL}/onboarding/employees/${employeeId}/restore/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Employee restored successfully!');
        setShowRestoreConfirm(false);
        setDeletingEmployee(null);
        fetchEmployees();
      } else {
        toast.error('Failed to restore employee');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to restore employee');
    }
  };

  const fetchDocumentStatus = async (employeeId) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8080/api";
      const response = await fetch(`${API_BASE_URL}/onboarding/employees/${employeeId}/documents_status/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocumentStatus(data);
        setShowDocumentStatusModal(true);
      } else {
        toast.error('Failed to fetch document status');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch document status');
    }
  };

  const fetchDocumentsList = async (employeeId) => {
    try {
      const { data } = await api.get(`/onboarding/employees/${employeeId}/list_documents/`);
      setDocumentsList(data);
      setShowDocumentListModal(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch documents list');
    }
  };

  const updateEmployeeStatus = async (employeeId, status) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8080/api";
      const response = await fetch(`${API_BASE_URL}/onboarding/employees/${employeeId}/update_status/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Status updated to ${status}`);
        fetchEmployees();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update status');
    }
  };

  const uploadDocuments = async () => {
    if (!uploadingEmployee) return;

    try {
      const formData = new FormData();

      fileInputs.forEach(fileInput => {
        if (fileInput.file) {
          formData.append(`document_${fileInput.docType}`, fileInput.file);
        }
      });

      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8080/api";
      const response = await fetch(`${API_BASE_URL}/onboarding/employees/${uploadingEmployee.id}/upload_documents/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Documents uploaded successfully! ${result.files_uploaded?.length || 0} files processed.`);

        setShowUploadModal(false);
        setUploadingEmployee(null);
        setFileInputs([{ id: 1, docType: 'Aadhar and PAN Card', file: null }]);

        fetchEmployees();

        setTimeout(() => {
          fetchDocumentStatus(uploadingEmployee.id);
        }, 500);

      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to upload documents');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to upload documents');
    }
  };

  const checkDocumentCompletionStatus = async (employeeId) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8080/api";
      const response = await fetch(`${API_BASE_URL}/onboarding/employees/${employeeId}/documents_status/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.is_complete;
      }
      return false;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const documentTypes = [
    { value: 'Aadhar and PAN Card', label: 'Aadhar and PAN Card' },
    { value: 'Last 6 months payslips', label: 'Last 6 months payslips' },
    { value: 'Educational Certificates (Degree)', label: 'Educational Certificates (Degree)' },
    { value: 'Previous Offer Letter', label: 'Previous Offer Letter' },
    { value: 'Relieving & Experience Letters', label: 'Relieving & Experience Letters' },
    { value: 'Appraisal/Hike Letters', label: 'Appraisal/Hike Letters' },
  ];

  const addFileInput = () => {
    const newId = Math.max(...fileInputs.map(f => f.id)) + 1;
    setFileInputs([...fileInputs, { id: newId, docType: 'Aadhar and PAN Card', file: null }]);
  };

  const removeFileInput = (id) => {
    if (fileInputs.length > 1) {
      setFileInputs(fileInputs.filter(f => f.id !== id));
    }
  };

  const handleFileChange = (id, file) => {
    setFileInputs(fileInputs.map(f =>
      f.id === id ? { ...f, file } : f
    ));
  };

  const handleDocTypeChange = (id, docType) => {
    setFileInputs(fileInputs.map(f =>
      f.id === id ? { ...f, docType } : f
    ));
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

  const getEmployeeTypeColor = (type) => {
    switch (type) {
      case 'fresher':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEmployeeInitials = (employee) => {
    const firstName = employee.first_name || '';
    const lastName = employee.last_name || '';
    const fullName = `${firstName} ${lastName}`;
    return fullName.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getProfileGradient = (employee) => {
    const gradients = [
      'from-violet-500 to-purple-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-indigo-500 to-blue-600'
    ];
    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`;
    const index = fullName.length % gradients.length;
    return gradients[index];
  };

  const filteredEmployees = (employees || []).filter(emp => {
    // Apply filter logic
    let matchesFilter = true;
    if (filter === 'all') matchesFilter = !emp.is_deleted;
    else if (filter === 'deleted') matchesFilter = emp.is_deleted;
    else if (filter === 'pending') matchesFilter = !emp.is_deleted && emp.status === 'pending';
    else if (filter === 'accepted') matchesFilter = !emp.is_deleted && emp.status === 'accepted';
    else if (filter === 'rejected') matchesFilter = !emp.is_deleted && emp.status === 'rejected';

    // Apply search logic
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      (emp.first_name || '').toLowerCase().includes(searchLower) ||
      (emp.last_name || '').toLowerCase().includes(searchLower) ||
      (emp.email || '').toLowerCase().includes(searchLower) ||
      (emp.department || '').toLowerCase().includes(searchLower) ||
      (emp.position || '').toLowerCase().includes(searchLower);

    return matchesFilter && matchesSearch;
  });

  const employeeCounts = {
    all: (employees || []).filter(e => !e.is_deleted).length,
    pending: (employees || []).filter(e => !e.is_deleted && e.status === 'pending').length,
    accepted: (employees || []).filter(e => !e.is_deleted && e.status === 'accepted').length,
    rejected: (employees || []).filter(e => !e.is_deleted && e.status === 'rejected').length,
    deleted: (employees || []).filter(e => e.is_deleted).length,
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
          <p className="mt-4 text-lg font-medium text-gray-600">Loading onboarding data...</p>
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
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <Star className="h-6 w-6 text-yellow-300 animate-pulse" />
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
                Onboarding Management
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                Streamline your employee onboarding process with document verification and status tracking
              </p>

              <div className="flex items-center space-x-6 text-blue-100">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">{employeeCounts.all} Total Candidates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">{employeeCounts.pending} Pending Review</span>
                </div>
              </div>
            </div>

            <div className="mt-8 lg:mt-0 flex flex-col lg:flex-row gap-4">
              {/* Generate Link Button */}
              <Link
                to="/onboarding/link-generator"
                className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <LinkIcon className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Generate Link
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            { key: 'all', label: 'Active Candidates', count: employeeCounts.all, color: 'from-blue-500 to-blue-600', icon: UserPlus },
            { key: 'pending', label: 'Pending Review', count: employeeCounts.pending, color: 'from-amber-500 to-amber-600', icon: Clock },
            { key: 'accepted', label: 'Accepted', count: employeeCounts.accepted, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
            { key: 'rejected', label: 'Rejected', count: employeeCounts.rejected, color: 'from-rose-500 to-rose-600', icon: XCircle },
            { key: 'deleted', label: 'Deleted', count: employeeCounts.deleted, color: 'from-gray-500 to-gray-600', icon: Trash2 },
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
                { key: 'all', label: 'Active', count: employeeCounts.all },
                { key: 'pending', label: 'Pending', count: employeeCounts.pending },
                { key: 'accepted', label: 'Accepted', count: employeeCounts.accepted },
                { key: 'rejected', label: 'Rejected', count: employeeCounts.rejected },
                { key: 'deleted', label: 'Deleted', count: employeeCounts.deleted },
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

        {/* Enhanced Employee Cards */}
        <div className="grid grid-cols-1 gap-6">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative mx-auto w-32 h-32 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full animate-pulse"></div>
                <UserPlus className="absolute inset-4 text-indigo-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {employees.length === 0
                  ? "No candidates have been added to the onboarding process yet."
                  : "No candidates match your current filter and search criteria."
                }
              </p>
            </div>
          ) : (
            filteredEmployees.map((employee, index) => {
              const employeeInitials = getEmployeeInitials(employee);
              const profileGradient = getProfileGradient(employee);

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
                            {employee.is_deleted ? (
                              <Trash2 className="h-3 w-3 text-rose-500" />
                            ) : employee.is_self_submitted ? (
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Clock className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className={`text-xl font-bold group-hover:text-indigo-600 transition-colors duration-300 ${employee.is_deleted ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}>
                              {employee.first_name} {employee.last_name}
                              {employee.is_deleted && <span className="text-rose-500 ml-2">[DELETED]</span>}
                            </h3>

                            {!employee.is_deleted && employee.status && (
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(employee.status)}`}>
                                {employee.status}
                              </span>
                            )}

                            {employee.employee_type && (
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getEmployeeTypeColor(employee.employee_type)}`}>
                                {employee.employee_type}
                              </span>
                            )}

                            {employee.is_self_submitted && !employee.is_deleted && (
                              <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
                                ✓ Self-Submitted
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="font-medium">{employee.email}</span>
                            {employee.phone_number && <span>• {employee.phone_number}</span>}
                            {employee.department && <span>• {employee.department}</span>}
                            {employee.position && <span>• {employee.position}</span>}
                            {employee.joining_date && <span>• Joining: {new Date(employee.joining_date).toLocaleDateString()}</span>}
                          </div>

                          {/* Submission Info */}
                          {employee.is_self_submitted && employee.submitted_at && (
                            <div className="mt-2 text-xs text-gray-500">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                📅 Submitted: {new Date(employee.submitted_at).toLocaleDateString()} at {new Date(employee.submitted_at).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
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
                              setDeletingEmployee(employee);
                              setShowRestoreConfirm(true);
                            }}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
                            title="Restore Employee"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingEmployee({ ...employee });
                                setShowEditModal(true);
                              }}
                              className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 opacity-0 group-hover:opacity-100"
                              title="Edit Employee"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </button>

                            <button
                              onClick={() => {
                                setDeletingEmployee(employee);
                                setShowDeleteConfirm(true);
                              }}
                              className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-medium hover:from-rose-700 hover:to-red-700 transition-all duration-200 transform hover:scale-105 opacity-0 group-hover:opacity-100"
                              title="Delete Employee"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </button>

                            <button
                              onClick={() => fetchDocumentsList(employee.id)}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                              title="Check Document Status"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Documents
                            </button>

                            {employee.status === 'pending' && (
                              <PendingEmployeeActions
                                employee={employee}
                                onStatusUpdate={updateEmployeeStatus}
                                checkDocumentStatus={checkDocumentCompletionStatus}
                              />
                            )}
                          </>
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

      {showDocumentListModal && documentsList && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDocumentListModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Documents - {documentsList.employee_name}</h3>
                <p className="text-sm text-gray-500">{documentsList.total_documents} uploaded</p>
              </div>
              <div className="px-6 py-4">
                {documentsList.documents && documentsList.documents.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {documentsList.documents.map((doc, idx) => (
                      <li key={idx} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{doc.doc_type}</p>
                          {doc.name && <p className="text-xs text-gray-500 break-all">{doc.name}</p>}
                        </div>
                        <div className="flex items-center space-x-2">
                          {doc.url ? (
                            <>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-sm rounded-md border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">View</a>
                              <a href={doc.url} download className="px-3 py-1 text-sm rounded-md border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100">Download</a>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">No URL</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No documents uploaded yet.</p>
                    <div className="mt-4 flex items-center justify-center space-x-2">
                      <button onClick={() => { setShowDocumentListModal(false); fetchDocumentStatus(documentsList.employee_id); }} className="px-4 py-2 rounded-md bg-indigo-600 text-white">View Status</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 py-3 bg-gray-50 flex justify-end">
                <button onClick={() => setShowDocumentListModal(false)} className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 bg-white text-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Create Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowCreateModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">
                      Add New Candidate
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Create a new candidate profile for onboarding process
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newEmployee.first_name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newEmployee.last_name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                      placeholder="candidate@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newEmployee.phone_number}
                      onChange={(e) => setNewEmployee({ ...newEmployee, phone_number: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                      placeholder="+91 9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Employee Type
                    </label>
                    <select
                      value={newEmployee.employee_type}
                      onChange={(e) => setNewEmployee({ ...newEmployee, employee_type: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    >
                      <option value="fresher">🎓 Fresher</option>
                      <option value="employee">👔 Employee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={newEmployee.joining_date}
                      onChange={(e) => setNewEmployee({ ...newEmployee, joining_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3">
                <button
                  onClick={createEmployee}
                  className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-base font-semibold text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 transform hover:scale-105 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Candidate
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowEditModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <Edit className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">
                      Edit Employee
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {editingEmployee.first_name} {editingEmployee.last_name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={editingEmployee.first_name}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, first_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={editingEmployee.last_name}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, last_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={editingEmployee.email}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={editingEmployee.phone_number || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, phone_number: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                    <select
                      value={editingEmployee.department || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    >
                      <option value="">Select Department</option>
                      <option value="hr">HR</option>
                      <option value="it">IT</option>
                      <option value="finance">Finance</option>
                      <option value="marketing">Marketing</option>
                      <option value="sales">Sales</option>
                      <option value="development">Development</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                    <select
                      value={editingEmployee.position || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    >
                      <option value="">Select Position</option>
                      <option value="manager">Manager</option>
                      <option value="senior_developer">Senior Developer</option>
                      <option value="junior_developer">Junior Developer</option>
                      <option value="hr_executive">HR Executive</option>
                      <option value="finance_executive">Finance Executive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={updateEmployee}
                  className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold text-white hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transform hover:scale-105 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Employee
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && deletingEmployee && (
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
                        Are you sure you want to delete <strong className="text-gray-900">{deletingEmployee.first_name} {deletingEmployee.last_name}</strong>?
                        This will soft delete the employee record. You can restore it later if needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => softDeleteEmployee(deletingEmployee.id)}
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
      {showRestoreConfirm && deletingEmployee && (
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
                        Are you sure you want to restore <strong className="text-gray-900">{deletingEmployee.first_name} {deletingEmployee.last_name}</strong>?
                        This will reactivate the employee record and make it visible in the active employees list.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => restoreEmployee(deletingEmployee.id)}
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
    </div>
  );
};

// Component to handle pending employee actions with document verification
const PendingEmployeeActions = ({ employee, onStatusUpdate, checkDocumentStatus }) => {
  const [documentsComplete, setDocumentsComplete] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkDocuments = async () => {
      try {
        setChecking(true);
        const isComplete = await checkDocumentStatus(employee.id);
        setDocumentsComplete(isComplete);
      } catch (error) {
        console.error('Error checking document status:', error);
        setDocumentsComplete(false);
      } finally {
        setChecking(false);
      }
    };

    checkDocuments();
  }, [employee.id, checkDocumentStatus]);

  if (checking) {
    return (
      <div className="inline-flex items-center px-3 py-1 text-sm text-gray-500">
        <Clock className="h-4 w-4 mr-1 animate-spin" />
        Checking...
      </div>
    );
  }

  if (!documentsComplete) {
    return (
      <div className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-md text-sm font-medium">
        <Clock className="h-4 w-4 mr-1" />
        Pending Documents
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => onStatusUpdate(employee.id, 'accepted')}
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
        title="Accept Employee"
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        Accept
      </button>
      <button
        onClick={() => onStatusUpdate(employee.id, 'rejected')}
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-medium hover:from-rose-700 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
        title="Reject Employee"
      >
        <XCircle className="h-4 w-4 mr-1" />
        Reject
      </button>
    </>
  );
};

export default OnboardingManagement;