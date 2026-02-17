
import React, { useState, useEffect } from 'react';
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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';


const EditEmployeeModal = ({ isOpen, onClose, onSuccess, employee }) => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: '',
    department_id: '',
    position: '',
    hire_date: '',
    salary: '',
    manager: '',
    status: 'ACTIVE'
  });
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);
  const [documentsFetched, setDocumentsFetched] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [documentInputs, setDocumentInputs] = useState([{ id: 1, docType: '', file: null }]);
  const [onboardingEmployeeId, setOnboardingEmployeeId] = useState(null);

  const { theme } = useTheme();
  useEffect(() => {
    if (isOpen && employee) {
      // Reset document state for each employee to avoid leaking between employees
      setDocuments([]);
      setDocumentsError(null);
      setDocumentsFetched(false);
      setDocumentInputs([{ id: 'new-1', docType: '', file: null }]);
      setOnboardingEmployeeId(null);

      setFormData({
        employee_id: employee.user?.username || employee.user_info?.username || employee.employee_id || '',
        department_id: employee.department?.id || '',
        position: employee.position || '',
        hire_date: employee.hire_date || '',
        salary: employee.decrypted_salary || '',
        manager: employee.manager?.id || '',
        status: employee.status || 'ACTIVE'
      });
      fetchDepartments();
      fetchEmployees();
      const initDocs = async () => {
        const resolvedId = await resolveOnboardingEmployee(employee);
        const effectiveId = resolvedId || employee.id;
        setOnboardingEmployeeId(effectiveId);
        if (resolvedId) {
          fetchEmployeeDocuments(effectiveId);
        } else {
          // No onboarding record yet; allow upload to trigger backend auto-create
          setDocumentsFetched(true);
          setDocumentsError(null);
        }
      };
      initDocs();
    }
  }, [isOpen, employee]);

  const resolveOnboardingEmployee = async (emp) => {
    const email = emp?.user_info?.email || emp?.email;
    if (!email) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/employees/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) return null;
      const data = await response.json();
      const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      const match = list.find((item) => item.email?.toLowerCase() === email.toLowerCase());
      return match?.id || null;
    } catch (error) {
      console.error('Failed to resolve onboarding employee:', error);
      return null;
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await employeeAPI.getDepartments();
      setDepartments(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getEmployees();
      setEmployees(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchEmployeeDocuments = async (targetId) => {
    const effectiveId = targetId ?? onboardingEmployeeId;
    if (!employee?.id || !effectiveId) return;
    try {
      setDocumentsLoading(true);
      setDocumentsError(null);
      setDocumentsFetched(false);
      const response = await fetch(`${API_BASE_URL}/onboarding/employees/${effectiveId}/list_documents/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      //if (!response.ok) {
      //  setDocumentsError('Unable to load existing documents');
      //  return;
      //}

      const data = await response.json();
      const docs = Array.isArray(data.documents) ? data.documents : [];
      setDocuments(docs);
      if (docs.length > 0) {
        setDocumentInputs(
          docs.map((doc, idx) => ({
            id: `existing-${idx}`,
            docType: doc.doc_type || '',
            file: null,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch employee documents:', error);
      setDocumentsError('Unable to load existing documents');
    } finally {
      setDocumentsLoading(false);
      setDocumentsFetched(true);
    }
  };

  const addDocumentInput = () => {
    setDocumentInputs((prev) => [...prev, { id: Date.now(), docType: '', file: null }]);
  };

  const removeDocumentInput = (id) => {
    setDocumentInputs((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const updateDocumentInput = (id, field, value) => {
    setDocumentInputs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleDocumentFileChange = (id, file) => {
    updateDocumentInput(id, 'file', file);
  };

  const uploadDocuments = async () => {
    if (!employee?.id) return;
    const targetId = onboardingEmployeeId || employee.id;
    const documentsToUpload = documentInputs.filter((item) => item.file && item.docType);
    if (documentsToUpload.length === 0) {
      toast.info('Add at least one document with a type before uploading.');
      return;
    }

    try {
      setUploadingDocuments(true);
      const formData = new FormData();
      documentsToUpload.forEach((item) => {
        formData.append(`document_${item.docType}`, item.file);
      });

      const response = await fetch(`${API_BASE_URL}/onboarding/employees/${targetId}/upload_documents/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload documents');
      }

      const result = await response.json();
      const uploadedCount = result.files_uploaded?.length || documentsToUpload.length;
      toast.success(`Uploaded ${uploadedCount} document${uploadedCount === 1 ? '' : 's'} successfully.`);
      setDocumentInputs((prev) =>
        prev.map((item) => ({ ...item, file: null }))
      );
      fetchEmployeeDocuments(targetId);
    } catch (error) {
      console.error('Document upload failed:', error);
      toast.error(error.message || 'Failed to upload documents');
    } finally {
      setUploadingDocuments(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const updateData = { ...formData };
      // Remove fields not accepted by the backend serializer
      delete updateData.salary; // salary isn't part of the update serializer
      // Normalize department
      if (updateData.department_id === '' || updateData.department_id === null || updateData.department_id === undefined) {
        delete updateData.department_id;
      } else {
        const depId = parseInt(updateData.department_id);
        if (isNaN(depId)) delete updateData.department_id; else updateData.department_id = depId;
      }
      // Normalize manager
      if (updateData.manager === '' || updateData.manager === null || updateData.manager === undefined) {
        // Explicitly clear manager when "None" is selected
        updateData.manager_id = null;
        delete updateData.manager;
      } else {
        const mgrId = parseInt(updateData.manager);
        if (!isNaN(mgrId)) {
          updateData.manager_id = mgrId;
        }
        delete updateData.manager;
      }
      // Omit empty optional fields
      if (!updateData.position) delete updateData.position;
      if (!updateData.employee_id) delete updateData.employee_id;
      if (!updateData.hire_date) delete updateData.hire_date; // avoid sending ''

      const response = await employeeAPI.updateEmployee(employee.id, updateData);
      
      if (response.status === 200) {
        toast.success('Employee updated successfully!');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      const data = error.response?.data;
      const fieldErrors = data && typeof data === 'object' && !data.detail && !data.message
        ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        : null;
      const errorMessage = data?.detail || data?.message || fieldErrors || 'Failed to update employee';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get employee name for display
  const getEmployeeName = (employee) => {
    return employee?.user_info?.full_name || 
           `${employee?.user_info?.first_name || ''} ${employee?.user_info?.last_name || ''}`.trim() ||
           'Unknown Employee';
  };

  // Helper function to get employee initials
  const getEmployeeInitials = (employee) => {
    const name = getEmployeeName(employee);
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  // Helper function to get profile gradient
  const getProfileGradient = (name) => {
    const gradients = [
      'from-violet-500 to-purple-600',
      'from-blue-500 to-cyan-600', 
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-indigo-500 to-blue-600'
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  if (!isOpen || !employee) return null;

  const employeeName = getEmployeeName(employee);
  const employeeInitials = getEmployeeInitials(employee);
  const profileGradient = getProfileGradient(employeeName);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Enhanced backdrop with blur */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" 
          onClick={onClose}
        ></div>

        {/* Modal positioning */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Enhanced modal container */}
        <div className="relative inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all duration-300 sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-0 border border-gray-100">
          
          {/* Enhanced header with employee info */}
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 px-6 py-8 sm:px-8">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative flex items-center">
              {/* Employee avatar */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${profileGradient} flex items-center justify-center shadow-xl border-2 border-white/20`}>
                <span className="text-white font-bold text-lg">
                  {employeeInitials}
                </span>
              </div>
              
              <div className="ml-4 flex-1">
                <h3 className="text-2xl font-bold text-white">
                  Edit Employee
                </h3>
                <p className="text-blue-100 text-lg font-medium">
                  {employeeName}
                </p>
                <p className="text-blue-200 text-sm">
                  Username: {formData.employee_id}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Enhanced content area */}
          <div className="px-6 py-8 sm:px-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Employee ID */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none font-medium"
                    placeholder="Enter employee ID"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department
                </label>
                <div className="relative">
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none appearance-none cursor-pointer font-medium"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none font-medium"
                  placeholder="Enter position"
                />
              </div>

              {/* Hire Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hire Date
                </label>
                <input
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none font-medium"
                />
              </div>

              {/* Salary */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Salary
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none font-medium"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Manager */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Manager
                </label>
                <div className="relative">
                  <select
                    name="manager"
                    value={formData.manager}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none appearance-none cursor-pointer font-medium"
                  >
                    <option value="">None</option>
                    {employees
                      .filter(emp => emp.id !== employee.id) // Don't allow self-reporting
                      .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user_info?.full_name || `${emp.user?.first_name} ${emp.user?.last_name}`} ({emp.user?.username || emp.user_info?.username || emp.employee_id})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none appearance-none cursor-pointer font-medium"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Upload Documents */}
              <div className="md:col-span-2">
                <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm">
                  <div className="flex items-start justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center space-x-2">
                        <ArrowUpTrayIcon className="h-5 w-5 text-indigo-500" />
                        <h4 className="text-base font-semibold text-gray-900">Upload Documents</h4>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        HR managers can upload or replace documents the employee submitted.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addDocumentInput}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 border border-indigo-100"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Row
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {/* Existing documents - show only if this employee has any */}
                    {documentsFetched && (
                      <div className="px-4 sm:px-6 py-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-800">Existing documents</span>
                        </div>
                        {documentsLoading ? (
                          <p className="text-sm text-gray-500">Loading documents...</p>
                        ) : documents.length > 0 ? (
                          <div className="space-y-2">
                            {documents.map((doc) => (
                              <div
                                key={`${doc.field}-${doc.doc_type}`}
                                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 bg-gray-50"
                              >
                                <div className="flex items-center space-x-2">
                                  <PaperClipIcon className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-800">{doc.doc_type}</span>
                                </div>
                                {doc.url ? (
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                  >
                                    View
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-500">Not available</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                        )}
                      </div>
                    )}
                    {documentsError && <p className="px-4 sm:px-6 py-2 text-sm text-red-600">{documentsError}</p>}

                    {/* Upload rows */}
                    <div className="px-4 sm:px-6 py-4 space-y-3">
                      {documentInputs.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0"
                        >
                          <div className="flex-1">
                            <label className="sr-only">Document type</label>
                            <input
                              type="text"
                              value={item.docType}
                              onChange={(e) => updateDocumentInput(item.id, 'docType', e.target.value)}
                              placeholder="Document type (e.g., Aadhar, PAN, Offer Letter)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="sr-only">File upload</label>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={(e) => handleDocumentFileChange(item.id, e.target.files?.[0] || null)}
                              className="w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            {documentInputs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeDocumentInput(item.id)}
                                className="text-sm text-red-600 hover:text-red-700 px-2 py-1"
                              >
                                Remove
                              </button>
                            )}
                            {idx === documentInputs.length - 1 && (
                              <button
                                type="button"
                                onClick={addDocumentInput}
                                className="text-sm text-indigo-600 hover:text-indigo-800 px-2 py-1"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={uploadDocuments}
                          disabled={uploadingDocuments}
                          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {uploadingDocuments ? (
                            'Uploading...'
                          ) : (
                            <>
                              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                              Upload Documents
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Footer */}
          <div className="bg-gray-50 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full sm:w-auto inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r ${theme.primaryGradient} text-base font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 sm:ml-3`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Update Employee
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full sm:mt-0 sm:w-auto inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, employee, loading }) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Delete Employee
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <span className="font-semibold">{employee.user_info?.full_name}</span>? 
                    This action cannot be undone and will remove all employee data permanently.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


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
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Enhanced backdrop with blur - Responsive */}
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm" onClick={onClose}></div>
        
        {/* Enhanced modal container - Responsive */}
        <div className="inline-block align-bottom bg-white rounded-t-2xl sm:rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full sm:max-w-4xl sm:w-full max-h-screen sm:max-h-none">
          
          {/* Enhanced header - Responsive */}
          <div className={`bg-gradient-to-r ${theme.primaryGradient} px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 sm:h-7 sm:w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 sm:ml-4">
                <h2 className="text-lg sm:text-2xl font-bold text-white">Add New Employee</h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">Create a comprehensive employee profile</p>
              </div>
            </div>
          </div>
          
          {/* Enhanced content area - Responsive with scrolling */}
          <div className="bg-white px-4 sm:px-6 py-4 sm:py-6 max-h-[70vh] sm:max-h-none overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* User Fields - Enhanced & Responsive */}
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-200">
                  <h3 className="text-sm sm:text-md font-semibold text-blue-900 mb-3 sm:mb-4 flex items-center">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Information
                  </h3>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Username <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="username"
                        value={formData.user.username}
                        onChange={(e) => handleInputChange(e, 'user')}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${
                          errors.user?.username 
                            ? 'border-red-300 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
                        }`}
                        placeholder="Enter username"
                        required
                      />
                      {errors.user?.username && <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.user.username}
                      </p>}
                    </div>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Email <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.user.email}
                          onChange={(e) => handleInputChange(e, 'user')}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 pl-10 sm:pl-12 border-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${
                            errors.user?.email 
                              ? 'border-red-300 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' 
                              : 'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
                          }`}
                          placeholder="employee@company.com"
                          required
                        />
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      {errors.user?.email && <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.user.email}
                      </p>}
                    </div>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">First Name</label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.user.first_name}
                        onChange={(e) => handleInputChange(e, 'user')}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-sm sm:text-base"
                        placeholder="Enter first name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.user.last_name}
                        onChange={(e) => handleInputChange(e, 'user')}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-sm sm:text-base"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* UserProfile Fields - Enhanced & Responsive */}
              <div className="space-y-4">
                <div className="bg-green-50 p-3 sm:p-4 rounded-xl border border-green-200">
                  <h3 className="text-sm sm:text-md font-semibold text-green-900 mb-3 sm:mb-4 flex items-center">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Contact & Role
                  </h3>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Role</label>
                      <select
                        name="role"
                        value={formData.profile.role}
                        onChange={(e) => handleInputChange(e, 'profile')}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none bg-white text-sm sm:text-base"
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="HR_MANAGER">HR Manager</option>
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">MANAGER</option>

                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Phone Number</label>
                      <input
                        type="text"
                        name="phone_number"
                        value={formData.profile.phone_number}
                        onChange={(e) => handleInputChange(e, 'profile')}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${
                          errors.profile?.phone_number 
                            ? 'border-red-300 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
                        }`}
                        placeholder="Enter phone number"
                      />
                      {errors.profile?.phone_number && <p className="text-red-500 text-xs mt-1">{errors.profile.phone_number}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Date of Birth</label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.profile.date_of_birth}
                        onChange={(e) => handleInputChange(e, 'profile')}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-sm sm:text-base"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Emergency Contact</label>
                      <input
                        type="text"
                        name="emergency_contact"
                        value={formData.profile.emergency_contact}
                        onChange={(e) => handleInputChange(e, 'profile')}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-sm sm:text-base"
                        placeholder="Enter emergency contact"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address - Full Width Enhanced & Responsive */}
              <div className="md:col-span-2">
                <div className="bg-purple-50 p-3 sm:p-4 rounded-xl border border-purple-200">
                  <h3 className="text-sm sm:text-md font-semibold text-purple-900 mb-3 sm:mb-4 flex items-center">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Address Information
                  </h3>
                  <textarea
                    name="address"
                    value={formData.profile.address}
                    onChange={(e) => handleInputChange(e, 'profile')}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none resize-none text-sm sm:text-base"
                    placeholder="Enter address"
                    rows="3"
                  />
                </div>
              </div>

              {/* Employee Fields - Enhanced & Responsive */}
              <div className="md:col-span-2">
                <div className="bg-orange-50 p-3 sm:p-4 rounded-xl border border-orange-200">
                  <h3 className="text-sm sm:text-md font-semibold text-orange-900 mb-3 sm:mb-4 flex items-center">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                    Work Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Username <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="employee_id"
                        value={formData.employee_id}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${
                          errors.employee_id 
                            ? 'border-red-300 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
                        }`}
                        placeholder="Enter username (e.g. TO-00076)"
                        required
                      />
                      {errors.employee_id && <p className="text-red-500 text-xs mt-1">{errors.employee_id}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Department <span className="text-red-500">*</span></label>
                      <select
                        name="department_id"
                        value={formData.department_id}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 outline-none bg-white text-sm sm:text-base ${
                          errors.department_id 
                            ? 'border-red-300 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
                        }`}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                      {errors.department_id && <p className="text-red-500 text-xs mt-1">{errors.department_id}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Position <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${
                          errors.position 
                            ? 'border-red-300 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
                        }`}
                        placeholder="Enter position"
                        required
                      />
                      {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Hire Date <span className="text-red-500">*</span></label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="date"
                          name="hire_date"
                          value={formData.hire_date}
                          onChange={handleInputChange}
                          className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${
                            errors.hire_date 
                              ? 'border-red-300 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' 
                              : 'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            hire_date: new Date().toISOString().split('T')[0]
                          }))}
                          className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-lg sm:rounded-xl hover:bg-blue-200 transition-colors duration-200 font-medium"
                        >
                          Today
                        </button>
                      </div>
                      {errors.hire_date && <p className="text-red-500 text-xs mt-1">{errors.hire_date}</p>}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Manager</label>
                      <select
                        name="manager"
                        value={formData.manager}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none bg-white text-sm sm:text-base"
                      >
                        <option value="">None</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.user?.first_name} {emp.user?.last_name} ({emp.user?.username || emp.user_info?.username || emp.employee_id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Footer - Responsive */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto inline-flex justify-center rounded-lg sm:rounded-xl border-2 border-gray-300 shadow-sm px-4 sm:px-6 py-2 sm:py-3 bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-gray-200 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg sm:rounded-xl border border-transparent shadow-lg px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-sm sm:text-base font-semibold text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

const EmployeeList = () => {
  const { theme } = useTheme();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleDeleteEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const handleEditSuccess = () => {
    fetchEmployees();
    setShowEditModal(false);
    setSelectedEmployee(null);
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
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INACTIVE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'TERMINATED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      'from-violet-500 to-purple-600',
      'from-blue-500 to-cyan-600', 
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-indigo-500 to-blue-600',
      'from-cyan-500 to-blue-600',
      'from-teal-500 to-emerald-600'
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient} flex justify-center items-center`}>
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient}`}>
      {/* Enhanced Header Section */}
      <div className={`relative overflow-hidden bg-gradient-to-r ${theme.headerGradient}`}>
        <div className="absolute inset-0 bg-black opacity-10"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="sm:flex sm:items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <UserGroupIcon className="h-8 w-8 text-white" />
                </div>
                <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
                Employee's
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                Discover our amazing team members and their expertise across the organization
              </p>
              
              <div className="flex items-center space-x-6 text-blue-100">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">{employees.length} Team Members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">{departments.length} Departments</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced Add Employee Button (HR Manager and Admin) */}
            {(isHRManager() || isAdmin()) && (
              <div className="mt-8 lg:mt-0">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="group relative inline-flex items-center px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold shadow-2xl hover:shadow-white/25 transform hover:scale-105 transition-all duration-300"
                >
                  <PlusIcon className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  Add Employee
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-blue-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enhanced Filters */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/50 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Smart Filters</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="relative group">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search employees..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none hover:bg-white"
              />
            </div>

            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none hover:bg-white appearance-none cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none hover:bg-white appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TERMINATED">Terminated</option>
            </select>

            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white/70 backdrop-blur-sm hover:bg-white hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-200 group"
            >
              <FunnelIcon className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Enhanced Employee Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {employees.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className="relative mx-auto w-32 h-32 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full animate-pulse"></div>
                <UserIcon className="absolute inset-4 text-indigo-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {filters.search || filters.department || filters.status
                  ? 'Try adjusting your search criteria to find what you\'re looking for.'
                  : 'No employees to display at the moment.'}
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors duration-200"
              >
                Reset Filters
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
                  className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50 overflow-hidden transform hover:-translate-y-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Card background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative p-6">
                    {/* Employee Header */}
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${profileGradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                            <span className="text-white font-bold text-lg">
                              {employeeInitials}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                          {employeeName}
                        </h3>
                        <p className="text-indigo-600 font-medium mt-1">{employee.position || 'No Position'}</p>
                        <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block mt-1">
                          Username: {employee.user?.username || employee.user_info?.username || employee.employee_id || 'No ID'}
                        </p>
                      </div>
                      {/* Enhanced Action Buttons (HR Manager and Admin) */}
                      {(isHRManager() || isAdmin()) && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
                            title="Edit Employee"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
                            title="Delete Employee"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Employee Details */}
                    <div className="mt-6 space-y-4">
                      {/* Department */}
                      <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                        <BuildingOfficeIcon className="h-4 w-4 mr-3 text-indigo-400" />
                        <span className="font-medium">Department:</span>
                        <span className="ml-2 text-indigo-600 font-medium">{employee.department?.name || 'Not Assigned'}</span>
                      </div>
                      
                      {/* Manager */}
                      <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                        <UserGroupIcon className="h-4 w-4 mr-3 text-purple-400" />
                        <span className="font-medium">Reports to:</span>
                        <span className="ml-2 text-purple-600 font-medium">{managerName}</span>
                      </div>
                      
                      {/* Hire Date */}
                      <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                        <CalendarIcon className="h-4 w-4 mr-3 text-emerald-400" />
                        <span className="font-medium">Joined:</span>
                        <span className="ml-2">{employee.hire_date ? formatDate(employee.hire_date) : 'Unknown'}</span>
                      </div>
                    </div>

                    {/* Status Badge & Subordinates */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(employee.status)}`}>
                        {employee.status || 'ACTIVE'}
                      </span>
                      
                      {/* Subordinates count if available */}
                      {employee.subordinates_count > 0 && (
                        <span className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-medium">
                          {employee.subordinates_count} direct report{employee.subordinates_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Enhanced Results Count */}
        {employees.length > 0 && (
          <div className="flex justify-center">
            <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <p className="text-sm font-medium text-gray-700">
                  Showing <span className="text-indigo-600 font-bold">{employees.length}</span> employee{employees.length !== 1 ? 's' : ''}
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

      <EditEmployeeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEmployee(null);
        }}
        onSuccess={handleEditSuccess}
        employee={selectedEmployee}
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



// import React, { useState, useEffect } from 'react';
// import { 
//   PlusIcon, 
//   MagnifyingGlassIcon, 
//   FunnelIcon,
//   UserIcon,
//   BuildingOfficeIcon,
//   CalendarIcon,
//   UserGroupIcon,
//   PencilIcon,
//   TrashIcon,
//   EllipsisVerticalIcon
// } from '@heroicons/react/24/outline';
// import { toast } from 'react-toastify';
// import { employeeAPI } from '../../services/api';
// import { isHRManager, isManager, getUserRole } from '../../utils/auth';
// import { formatDate } from '../../utils/formatters';


// const EditEmployeeModal = ({ isOpen, onClose, onSuccess, employee }) => {
//   const [loading, setLoading] = useState(false);
//   const [departments, setDepartments] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [formData, setFormData] = useState({
//     employee_id: '',
//     department_id: '',
//     position: '',
//     hire_date: '',
//     salary: '',
//     manager: '',
//     status: 'ACTIVE'
//   });

//   useEffect(() => {
//     if (isOpen && employee) {
//       setFormData({
//         employee_id: employee.employee_id || '',
//         department_id: employee.department?.id || '',
//         position: employee.position || '',
//         hire_date: employee.hire_date || '',
//         salary: employee.decrypted_salary || '',
//         manager: employee.manager?.id || '',
//         status: employee.status || 'ACTIVE'
//       });
//       fetchDepartments();
//       fetchEmployees();
//     }
//   }, [isOpen, employee]);

//   const fetchDepartments = async () => {
//     try {
//       const response = await employeeAPI.getDepartments();
//       setDepartments(response.data.results || response.data || []);
//     } catch (error) {
//       console.error('Failed to fetch departments:', error);
//     }
//   };

//   const fetchEmployees = async () => {
//     try {
//       const response = await employeeAPI.getEmployees();
//       setEmployees(response.data.results || response.data || []);
//     } catch (error) {
//       console.error('Failed to fetch employees:', error);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async () => {
//     setLoading(true);
//     try {
//       const updateData = { ...formData };
//       if (updateData.department_id) {
//         updateData.department_id = parseInt(updateData.department_id);
//       }
//       if (updateData.manager) {
//         updateData.manager_id = parseInt(updateData.manager);
//         delete updateData.manager;
//       }

//       const response = await employeeAPI.updateEmployee(employee.id, updateData);
      
//       if (response.status === 200) {
//         toast.success('Employee updated successfully!');
//         onSuccess();
//         onClose();
//       }
//     } catch (error) {
//       console.error('Error updating employee:', error);
//       const errorMessage = error.response?.data?.detail || 
//                           error.response?.data?.message || 
//                           'Failed to update employee';
//       toast.error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Helper function to get employee name for display
//   const getEmployeeName = (employee) => {
//     return employee?.user_info?.full_name || 
//            `${employee?.user_info?.first_name || ''} ${employee?.user_info?.last_name || ''}`.trim() ||
//            'Unknown Employee';
//   };

//   // Helper function to get employee initials
//   const getEmployeeInitials = (employee) => {
//     const name = getEmployeeName(employee);
//     return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
//   };

//   // Helper function to get profile gradient
//   const getProfileGradient = (name) => {
//     const gradients = [
//       'from-violet-500 to-purple-600',
//       'from-blue-500 to-cyan-600', 
//       'from-emerald-500 to-teal-600',
//       'from-amber-500 to-orange-600',
//       'from-rose-500 to-pink-600',
//       'from-indigo-500 to-blue-600'
//     ];
//     const index = name.length % gradients.length;
//     return gradients[index];
//   };

//   if (!isOpen || !employee) return null;

//   const employeeName = getEmployeeName(employee);
//   const employeeInitials = getEmployeeInitials(employee);
//   const profileGradient = getProfileGradient(employeeName);

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       {/* Enhanced backdrop with blur */}
//       <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//         <div 
//           className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" 
//           onClick={onClose}
//         ></div>

//         {/* Modal positioning */}
//         <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

//         {/* Enhanced modal container */}
//         <div className="relative inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all duration-300 sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-0 border border-gray-100">
          
//           {/* Enhanced header with employee info */}
//           <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 px-6 py-8 sm:px-8">
//             {/* Decorative elements */}
//             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
//             <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
//             <div className="relative flex items-center">
//               {/* Employee avatar */}
//               <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${profileGradient} flex items-center justify-center shadow-xl border-2 border-white/20`}>
//                 <span className="text-white font-bold text-lg">
//                   {employeeInitials}
//                 </span>
//               </div>
              
//               <div className="ml-4 flex-1">
//                 <h3 className="text-2xl font-bold text-white">
//                   Edit Employee
//                 </h3>
//                 <p className="text-blue-100 text-lg font-medium">
//                   {employeeName}
//                 </p>
//                 <p className="text-blue-200 text-sm">
//                   ID: {employee.employee_id}
//                 </p>
//               </div>

//               {/* Close button */}
//               <button
//                 onClick={onClose}
//                 className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>
//           </div>
          
//           {/* Enhanced content area */}
//           <div className="px-6 py-8 sm:px-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
//               {/* Employee ID */}
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Employee ID
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="text"
//                     name="employee_id"
//                     value={formData.employee_id}
//                     onChange={handleInputChange}
//                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none font-medium"
//                     placeholder="Enter employee ID"
//                   />
//                 </div>
//               </div>

//               {/* Department */}
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Department
//                 </label>
//                 <div className="relative">
//                   <select
//                     name="department_id"
//                     value={formData.department_id}
//                     onChange={handleInputChange}
//                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none appearance-none cursor-pointer font-medium"
//                   >
//                     <option value="">Select Department</option>
//                     {departments.map((dept) => (
//                       <option key={dept.id} value={dept.id}>
//                         {dept.name}
//                       </option>
//                     ))}
//                   </select>
//                   <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
//                     <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>

//               {/* Position */}
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Position
//                 </label>
//                 <input
//                   type="text"
//                   name="position"
//                   value={formData.position}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none font-medium"
//                   placeholder="Enter position"
//                 />
//               </div>

//               {/* Hire Date */}
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Hire Date
//                 </label>
//                 <input
//                   type="date"
//                   name="hire_date"
//                   value={formData.hire_date}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none font-medium"
//                 />
//               </div>

//               {/* Salary */}
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Salary
//                 </label>
//                 <div className="relative">
//                   <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
//                   <input
//                     type="number"
//                     name="salary"
//                     value={formData.salary}
//                     onChange={handleInputChange}
//                     className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none font-medium"
//                     placeholder="0"
//                   />
//                 </div>
//               </div>

//               {/* Manager */}
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Manager
//                 </label>
//                 <div className="relative">
//                   <select
//                     name="manager"
//                     value={formData.manager}
//                     onChange={handleInputChange}
//                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none appearance-none cursor-pointer font-medium"
//                   >
//                     <option value="">None</option>
//                     {employees
//                       .filter(emp => emp.id !== employee.id) // Don't allow self-reporting
//                       .map((emp) => (
//                       <option key={emp.id} value={emp.id}>
//                         {emp.user_info?.full_name || `${emp.user?.first_name} ${emp.user?.last_name}`} ({emp.employee_id})
//                       </option>
//                     ))}
//                   </select>
//                   <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
//                     <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>

//               {/* Status */}
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Status
//                 </label>
//                 <div className="relative">
//                   <select
//                     name="status"
//                     value={formData.status}
//                     onChange={handleInputChange}
//                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none appearance-none cursor-pointer font-medium"
//                   >
//                     <option value="ACTIVE">Active</option>
//                     <option value="INACTIVE">Inactive</option>
//                     <option value="TERMINATED">Terminated</option>
//                   </select>
//                   <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
//                     <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
          
//           {/* Enhanced Footer */}
//           <div className="bg-gray-50 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse">
//             <button
//               type="button"
//               onClick={handleSubmit}
//               disabled={loading}
//               className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-base font-semibold text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 sm:ml-3"
//             >
//               {loading ? (
//                 <>
//                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Updating...
//                 </>
//               ) : (
//                 <>
//                   <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
//                   </svg>
//                   Update Employee
//                 </>
//               )}
//             </button>
//             <button
//               type="button"
//               onClick={onClose}
//               className="mt-3 w-full sm:mt-0 sm:w-auto inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Delete Confirmation Modal Component
// const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, employee, loading }) => {
//   if (!isOpen || !employee) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//         <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
//         <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
//           <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
//             <div className="sm:flex sm:items-start">
//               <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
//                 <TrashIcon className="h-6 w-6 text-red-600" />
//               </div>
//               <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
//                 <h3 className="text-lg leading-6 font-medium text-gray-900">
//                   Delete Employee
//                 </h3>
//                 <div className="mt-2">
//                   <p className="text-sm text-gray-500">
//                     Are you sure you want to delete <span className="font-semibold">{employee.user_info?.full_name}</span>? 
//                     This action cannot be undone and will remove all employee data permanently.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
//             <button
//               type="button"
//               onClick={onConfirm}
//               disabled={loading}
//               className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
//             >
//               {loading ? 'Deleting...' : 'Delete'}
//             </button>
//             <button
//               type="button"
//               onClick={onClose}
//               className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };


// const AddEmployeeModal = ({ isOpen, onClose, onSuccess }) => {
//   const [loading, setLoading] = useState(false);
//   const [departments, setDepartments] = useState([]);
//   const [employees, setEmployees] = useState([]);

//   const [formData, setFormData] = useState({
//     user: {
//       username: '',
//       email: '',
//       first_name: '',
//       last_name: ''
//     },
//     profile: {
//       role: 'EMPLOYEE',
//       phone_number: '',
//       address: '',
//       date_of_birth: '',
//       emergency_contact: ''
//     },
//     employee_id: '',
//     department_id: '',
//     position: '',
//     hire_date: new Date().toISOString().split('T')[0],
//     manager: ''
//   });

//   const [errors, setErrors] = useState({});

//   useEffect(() => {
//     if (isOpen) {
//       fetchDepartments();
//       fetchEmployees();
//     }
//   }, [isOpen]);

//   const fetchDepartments = async () => {
//     try {
//       const response = await employeeAPI.getDepartments();
//       setDepartments(response.data.results || response.data || []);
//     } catch (error) {
//       console.error('Failed to fetch departments:', error);
//       toast.error('Failed to load departments');
//     }
//   };

//   const fetchEmployees = async () => {
//     try {
//       const response = await employeeAPI.getEmployees();
//       setEmployees(response.data.results || response.data || []);
//     } catch (error) {
//       console.error('Failed to fetch employees:', error);
//       toast.error('Failed to load employees');
//     }
//   };

//   const handleInputChange = (e, nestedField = null) => {
//     const { name, value } = e.target;
//     if (nestedField) {
//       setFormData(prev => ({
//         ...prev,
//         [nestedField]: {
//           ...prev[nestedField],
//           [name]: value
//         }
//       }));
//       // Clear error for the field
//       setErrors(prev => ({ ...prev, [nestedField]: { ...prev[nestedField], [name]: '' } }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [name]: value
//       }));
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.user.username) newErrors.user = { ...newErrors.user, username: 'Username is required' };
//     if (!formData.user.email) {
//       newErrors.user = { ...newErrors.user, email: 'Email is required' };
//     } else if (!/\S+@\S+\.\S+/.test(formData.user.email)) {
//       newErrors.user = { ...newErrors.user, email: 'Invalid email format' };
//     }
//     if (!formData.employee_id) newErrors.employee_id = 'Employee ID is required';
//     if (!formData.department_id) newErrors.department_id = 'Department is required';
//     if (!formData.position) newErrors.position = 'Position is required';
//     if (!formData.hire_date) newErrors.hire_date = 'Hire date is required';
//     if (formData.profile.phone_number && !/^\+?\d{10,15}$/.test(formData.profile.phone_number)) {
//       newErrors.profile = { ...newErrors.profile, phone_number: 'Invalid phone number' };
//     }
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) {
//       toast.error('Please fix the errors in the form');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await employeeAPI.createEmployee(formData);
      
//       if (response.status === 201 || response.status === 200) {
//         toast.success('Employee created successfully!');
//         setFormData({
//           user: {
//             username: '',
//             email: '',
//             first_name: '',
//             last_name: ''
//           },
//           profile: {
//             role: 'EMPLOYEE',
//             phone_number: '',
//             address: '',
//             date_of_birth: '',
//             emergency_contact: ''
//           },
//           employee_id: '',
//           department_id: '',
//           position: '',
//           hire_date: new Date().toISOString().split('T')[0],
//           manager: ''
//         });
//         setErrors({});
//         onSuccess();
//         onClose();
//       }
//     } catch (error) {
//       console.error('Error creating employee:', error);
//       const errorMessage = error.response?.data?.detail || 
//                           error.response?.data?.message || 
//                           'Failed to create employee';
//       toast.error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//         {/* Enhanced backdrop with blur - Responsive */}
//         <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm" onClick={onClose}></div>
        
//         {/* Enhanced modal container - Responsive */}
//         <div className="inline-block align-bottom bg-white rounded-t-2xl sm:rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full sm:max-w-4xl sm:w-full max-h-screen sm:max-h-none">
          
//           {/* Enhanced header - Responsive */}
//           <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
//                   <svg className="h-5 w-5 sm:h-7 sm:w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                   </svg>
//                 </div>
//               </div>
//               <div className="ml-3 sm:ml-4">
//                 <h2 className="text-lg sm:text-2xl font-bold text-white">Add New Employee</h2>
//                 <p className="text-blue-100 text-xs sm:text-sm mt-1">Create a comprehensive employee profile</p>
//               </div>
//             </div>
//           </div>
          
//           {/* Enhanced content area - Responsive with scrolling */}
//           <div className="bg-white px-4 sm:px-6 py-4 sm:py-6 max-h-[70vh] sm:max-h-none overflow-y-auto">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
//               {/* User Fields - Enhanced & Responsive */}
//               <div className="space-y-4">
//                 <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-200">
//                   <h3 className="text-sm sm:text-md font-semibold text-blue-900 mb-3 sm:mb-4 flex items-center">
//                     <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                     </svg>
//                     Personal Information
//                   </h3>
                  
//                   <div className="space-y-3 sm:space-y-4">
//                     <div>
//                       <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Username <span className="text-red-500">*</span></label>
//                       <input
//                         type="text"
//                         name="username"
//                         value={formData.user.username}
//                         onChange={(e) => handleInputChange(e, 'user')}
//                         className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${
//                           errors.user?.username 
//                             ? 'border-red-300 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' 
//                             : 'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
//                         }`}
//                         placeholder="Enter username"
//                         required
//                       />
//                       {errors.user?.username && <p className="text-red-500 text-xs mt-1 flex items-center">
//                         <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                         </svg>
//                         {errors.user.username}
//                       </p>}
//                     </div>
                    
//                     <div>
//                       <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Email <span className="text-red-500">*</span></label>
//                       <div className="relative">
//                         <input
//                           type="email"
//                           name="email"
//                           value={formData.user.email}
//                           onChange={(e) => handleInputChange(e, 'user')}
//                           className={`w-full px-3 sm:px-4 py-2 sm:py-3 pl-10 sm:pl-12 border-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${
//                             errors.user?.email 
//                               ? 'border-red-300 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' 
//                               : 'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
//                           }`}
//                           placeholder="employee@company.com"
//                           required
//                         />
//                         <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
//                         </svg>
//                       </div>
//                       {errors.user?.email && <p className="text-red-500 text-xs mt-1 flex items-center">
//                         <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                         </svg>
//                         {errors.user.email}
//                       </p>}
//                     </div>
                    
//                     <div>
//                       <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">First Name</label>
//                       <input
//                         type="text"
//                         name="first_name"
//                         value={formData.user.first_name}
//                         onChange={(e) => handleInputChange(e, 'user')}
//                         className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-sm sm:text-base"
//                         placeholder="Enter first name"
//                       />
//                     </div>
                    
//                     <div>
//                       <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Last Name</label>
//                       <input
//                         type="text"
//                         name="last_name"
//                         value={formData.user.last_name}
//                         onChange={(e) => handleInputChange(e, 'user')}
//                         className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-sm sm:text-base"
//                         placeholder="Enter last name"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* UserProfile Fields - Enhanced & Responsive */}
//               <div className="space-y-4">
//                 <div className="bg-green-50 p-3 sm:p-4 rounded-xl border border-green-200">
//                   <h3 className="text-sm sm:text-md font-semibold text-green-900 mb-3 sm:mb-4 flex items-center">
//                     <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                     </svg>
//                     Contact & Role
//                   </h3>
                  
//                   <div className="space-y-3 sm:space-y-4">
//                     <div>
//                       <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Role</label>
//                       <select
//                         name="role"
//                         value={formData.profile.role}
//                         onChange={(e) => handleInputChange(e, 'profile')}
//                         className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none bg-white text-sm sm:text-base"
//                       >
//                         <option value="EMPLOYEE">Employee</option>
//                         <option value="MANAGER">Manager</option>
//                         <option value="HR_MANAGER">HR Manager</option>
//                         <option value="ADMIN">Admin</option>
//                       </select>
//                     </div>
                    
//                     <div>
//                       <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Phone Number</label>
//                       <input
//                         type="text"
//                         name="phone_number"
//                         value={formData.profile.phone_number}
//                         onChange={(e) => handleInputChange(e, 'profile')}
//                         className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${
//                           errors.profile?.phone_number 
//                             ? 'border-red-300 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' 
//                             : 'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
//                         }`}
//                         placeholder="Enter phone number"
//                       />
//                       {errors.profile?.phone_number && <p className="text-red-500 text-xs mt-1">{errors.profile.phone_number}</p>}
//                     </div>
                    
//                     <div>
//                       <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Date of Birth</label>
//                       <input
//                         type="date"
//                         name="date_of_birth"
//                         value={formData.profile.date_of_birth}
//                         onChange={(e) => handleInputChange(e, 'profile')}
//                         className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-sm sm:text-base"
//                       />
//                     </div>
                    
//                     <div>
//                       <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Emergency Contact</label>
//                       <input
//                         type="text"
//                         name="emergency_contact"
//                         value={formData.profile.emergency_contact}
//                         onChange={(e) => handleInputChange(e, 'profile')}
//                         className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-sm sm:text-base"
//                         placeholder="Enter emergency contact"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Address - Full Width Enhanced & Responsive */}
//               <div className="md:col-span-2">
//                 <div className="bg-purple-50 p-3 sm:p-4 rounded-xl border border-purple-200">
//                   <h3 className="text-sm sm:text-md font-semibold text-purple-900 mb-3 sm:mb-4 flex items-center">
//                     <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
//                     </svg>
//                     Address Information
//                   </h3>
//                   <textarea
//                     name="address"
//                     value={formData.profile.address}
//                     onChange={(e) => handleInputChange(e, 'profile')}
//                     className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none resize-none text-sm sm:text-base"
//                     placeholder="Enter address"
//                     rows="3"
//                   />
//                 </div>
//               </div>

//               {/* Employee Fields - Enhanced & Responsive */}
//               <div className="md:col-span-2">
//                 <div className="bg-orange-50 p-3 sm:p-4 rounded-xl border border-orange-200">
//                   <h3 className="text-sm sm:text-md font-semibold text-orange-900 mb-3 sm:mb-4 flex items-center">
//                     <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
//                     </svg>
//                     Work Information
//                   </h3>
                  
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
//                     <div>
//                       <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Employee ID <span className="text-red-500">*</span></label>
//                       <input
//                         type="text"
//                         name="employee_id"
//                         value={formData.employee_id}
//                         onChange={handleInputChange}
//                         className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${
//                           errors.employee_id 
//                             ? 'border-red-300 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' 
//                             : 'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
//                         }`}
//                         placeholder="Enter employee ID"
//                         required
//                       />
//                       {errors.employee_id && <p className="text-red-500 text-xs mt-1">{errors.employee_id}</p>}
//                     </div>
                    
//                     <div>
//                       <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Department <span className="text-red-500">*</span></label>
//                       <select
//                         name="department_id"
//                         value={formData.department_id}
//                         onChange={handleInputChange}
//                         className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 outline-none bg-white text-sm sm:text-base ${
//                           errors.department_id 
//                             ? 'border-red-300 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' 
//                             : 'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
//                         }`}
//                         required
//                       >
//                         <option value="">Select Department</option>
//                         {departments.map((dept) => (
//                           <option key={dept.id} value={dept.id}>
//                             {dept.name}
//                           </option>
//                         ))}
//                       </select>
//                       {errors.department_id && <p className="text-red-500 text-xs mt-1">{errors.department_id}</p>}
//                     </div>
                    
//                     <div>
//                       <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Position <span className="text-red-500">*</span></label>
//                       <input
//                         type="text"
//                         name="position"
//                         value={formData.position}
//                         onChange={handleInputChange}
//                         className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${
//                           errors.position 
//                             ? 'border-red-300 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' 
//                             : 'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
//                         }`}
//                         placeholder="Enter position"
//                         required
//                       />
//                       {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
//                     </div>
                    
//                     <div>
//                       <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Hire Date <span className="text-red-500">*</span></label>
//                       <div className="flex items-center space-x-2">
//                         <input
//                           type="date"
//                           name="hire_date"
//                           value={formData.hire_date}
//                           onChange={handleInputChange}
//                           className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${
//                             errors.hire_date 
//                               ? 'border-red-300 focus:border-red-500 focus:ring-2 sm:focus:ring-4 focus:ring-red-100' 
//                               : 'border-gray-200 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100'
//                           }`}
//                           required
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setFormData(prev => ({
//                             ...prev,
//                             hire_date: new Date().toISOString().split('T')[0]
//                           }))}
//                           className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-lg sm:rounded-xl hover:bg-blue-200 transition-colors duration-200 font-medium"
//                         >
//                           Today
//                         </button>
//                       </div>
//                       {errors.hire_date && <p className="text-red-500 text-xs mt-1">{errors.hire_date}</p>}
//                     </div>
                    
//                     <div className="md:col-span-2">
//                       <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Manager</label>
//                       <select
//                         name="manager"
//                         value={formData.manager}
//                         onChange={handleInputChange}
//                         className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none bg-white text-sm sm:text-base"
//                       >
//                         <option value="">None</option>
//                         {employees.map((emp) => (
//                           <option key={emp.id} value={emp.id}>
//                             {emp.user?.first_name} {emp.user?.last_name} ({emp.employee_id})
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
          
//           {/* Enhanced Footer - Responsive */}
//           <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
//             <button
//               type="button"
//               onClick={onClose}
//               className="w-full sm:w-auto inline-flex justify-center rounded-lg sm:rounded-xl border-2 border-gray-300 shadow-sm px-4 sm:px-6 py-2 sm:py-3 bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-gray-200 transition-all duration-200"
//             >
//               Cancel
//             </button>
//             <button
//               type="button"
//               onClick={handleSubmit}
//               disabled={loading}
//               className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg sm:rounded-xl border border-transparent shadow-lg px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-sm sm:text-base font-semibold text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
//             >
//               {loading ? (
//                 <>
//                   <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Creating...
//                 </>
//               ) : (
//                 <>
//                   <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                   </svg>
//                   Create Employee
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const EmployeeList = () => {
//   const [employees, setEmployees] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [selectedEmployee, setSelectedEmployee] = useState(null);
//   const [deleteLoading, setDeleteLoading] = useState(false);
//   const [filters, setFilters] = useState({
//     search: '',
//     department: '',
//     status: '',
//   });

//   // Get user role for permission checking
//   const userRole = getUserRole();
//   const isManagerOnly = isManager() && !isHRManager();

//   useEffect(() => {
//     fetchEmployees();
//     fetchDepartments();
//   }, []);

//   useEffect(() => {
//     const delayedSearch = setTimeout(() => {
//       fetchEmployees();
//     }, 300);

//     return () => clearTimeout(delayedSearch);
//   }, [filters]);

//   const fetchEmployees = async () => {
//     try {
//       setLoading(true);
//       const params = {};
//       if (filters.search) params.search = filters.search;
//       if (filters.department) params.department = filters.department;
//       if (filters.status) params.status = filters.status;

//       const response = await employeeAPI.getEmployees(params);
//       console.log('Fetched employees:', response.data);
//       setEmployees(response.data.results || response.data || []);
//     } catch (error) {
//       toast.error('Failed to fetch employees');
//       console.error('Employee fetch error:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchDepartments = async () => {
//     try {
//       const response = await employeeAPI.getDepartments();
//       setDepartments(response.data.results || response.data || []);
//     } catch (error) {
//       console.error('Failed to fetch departments');
//     }
//   };

//   const handleFilterChange = (key, value) => {
//     setFilters(prev => ({ ...prev, [key]: value }));
//   };

//   const clearFilters = () => {
//     setFilters({ search: '', department: '', status: '' });
//   };

//   const handleAddEmployeeSuccess = () => {
//     fetchEmployees();
//     setShowAddModal(false);
//   };

//   const handleEditEmployee = (employee) => {
//     setSelectedEmployee(employee);
//     setShowEditModal(true);
//   };

//   const handleDeleteEmployee = (employee) => {
//     setSelectedEmployee(employee);
//     setShowDeleteModal(true);
//   };

//   const handleEditSuccess = () => {
//     fetchEmployees();
//     setShowEditModal(false);
//     setSelectedEmployee(null);
//   };

//   const confirmDelete = async () => {
//     if (!selectedEmployee) return;
    
//     setDeleteLoading(true);
//     try {
//       await employeeAPI.deleteEmployee(selectedEmployee.id);
//       toast.success('Employee deleted successfully!');
//       fetchEmployees();
//       setShowDeleteModal(false);
//       setSelectedEmployee(null);
//     } catch (error) {
//       console.error('Error deleting employee:', error);
//       const errorMessage = error.response?.data?.detail || 
//                           error.response?.data?.message || 
//                           'Failed to delete employee';
//       toast.error(errorMessage);
//     } finally {
//       setDeleteLoading(false);
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'ACTIVE':
//         return 'bg-emerald-100 text-emerald-800 border-emerald-200';
//       case 'INACTIVE':
//         return 'bg-amber-100 text-amber-800 border-amber-200';
//       case 'TERMINATED':
//         return 'bg-rose-100 text-rose-800 border-rose-200';
//       default:
//         return 'bg-gray-100 text-gray-800 border-gray-200';
//     }
//   };

//   // Helper function to get employee name
//   const getEmployeeName = (employee) => {
//     if (employee.user_info?.full_name) {
//       return employee.user_info.full_name;
//     }
//     if (employee.user_info?.first_name || employee.user_info?.last_name) {
//       return `${employee.user_info.first_name || ''} ${employee.user_info.last_name || ''}`.trim();
//     }
//     // Fallback for old format
//     if (employee.user) {
//       return `${employee.user.first_name || ''} ${employee.user.last_name || ''}`.trim();
//     }
//     return 'Unknown Employee';
//   };

//   // Helper function to get employee initials for profile picture
//   const getEmployeeInitials = (employee) => {
//     if (employee.user_info) {
//       const firstName = employee.user_info.first_name || '';
//       const lastName = employee.user_info.last_name || '';
//       return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
//     }
//     // Fallback for old format
//     if (employee.user) {
//       const firstName = employee.user.first_name || '';
//       const lastName = employee.user.last_name || '';
//       return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
//     }
//     return 'UE';
//   };

//   // Helper function to get manager name
//   const getManagerName = (employee) => {
//     return 'No Manager';
//   };

//   // Generate a consistent gradient color for each employee based on their name
//   const getProfileGradient = (name) => {
//     const gradients = [
//       'from-violet-500 to-purple-600',
//       'from-blue-500 to-cyan-600', 
//       'from-emerald-500 to-teal-600',
//       'from-amber-500 to-orange-600',
//       'from-rose-500 to-pink-600',
//       'from-indigo-500 to-blue-600',
//       'from-cyan-500 to-blue-600',
//       'from-teal-500 to-emerald-600'
//     ];
//     const index = name.length % gradients.length;
//     return gradients[index];
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
//         <div className="text-center">
//           <div className="relative">
//             <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin">
//               <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
//             </div>
//           </div>
//           <p className="mt-4 text-lg font-medium text-gray-600">Loading employees...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//       {/* Enhanced Header Section */}
//       <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700">
//         <div className="absolute inset-0 bg-black opacity-10"></div>
        
//         {/* Decorative elements */}
//         <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32"></div>
//         <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48"></div>
        
//         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//           <div className="sm:flex sm:items-center justify-between">
//             <div className="flex-1">
//               <div className="flex items-center space-x-3 mb-4">
//                 <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
//                   <UserGroupIcon className="h-8 w-8 text-white" />
//                 </div>
//                 <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
//               </div>
              
//               <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
//                 Employee's
//               </h1>
//               <p className="text-xl text-blue-100 mb-6">
//                 {isManagerOnly ? 
//                   'View your team members and their information' : 
//                   'Discover our amazing team members and their expertise across the organization'
//                 }
//               </p>
              
//               <div className="flex items-center space-x-6 text-blue-100">
//                 <div className="flex items-center space-x-2">
//                   <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
//                   <span className="text-sm font-medium">{employees.length} Team Members</span>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
//                   <span className="text-sm font-medium">{departments.length} Departments</span>
//                 </div>
//                 {isManagerOnly && (
//                   <div className="flex items-center space-x-2">
//                     <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
//                     <span className="text-sm font-medium">👨‍💼 Manager View</span>
//                   </div>
//                 )}
//               </div>
//             </div>
            
//             {/* Enhanced Add Employee Button - Only for HR Managers */}
//             {isHRManager() && (
//               <div className="mt-8 lg:mt-0">
//                 <button
//                   onClick={() => setShowAddModal(true)}
//                   className="group relative inline-flex items-center px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold shadow-2xl hover:shadow-white/25 transform hover:scale-105 transition-all duration-300"
//                 >
//                   <PlusIcon className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
//                   Add Employee
//                   <div className="absolute inset-0 bg-gradient-to-r from-white to-blue-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
//         {/* Enhanced Filters */}
//         <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/50 p-6">
//           <h2 className="text-lg font-semibold text-gray-800 mb-6">Smart Filters</h2>
//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
//             <div className="relative group">
//               <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" />
//               <input
//                 type="text"
//                 placeholder="Search employees..."
//                 value={filters.search}
//                 onChange={(e) => handleFilterChange('search', e.target.value)}
//                 className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none hover:bg-white"
//               />
//             </div>

//             <select
//               value={filters.department}
//               onChange={(e) => handleFilterChange('department', e.target.value)}
//               className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none hover:bg-white appearance-none cursor-pointer"
//             >
//               <option value="">All Departments</option>
//               {departments.map((dept) => (
//                 <option key={dept.id} value={dept.id}>
//                   {dept.name}
//                 </option>
//               ))}
//             </select>

//             <select
//               value={filters.status}
//               onChange={(e) => handleFilterChange('status', e.target.value)}
//               className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none hover:bg-white appearance-none cursor-pointer"
//             >
//               <option value="">All Status</option>
//               <option value="ACTIVE">Active</option>
//               <option value="INACTIVE">Inactive</option>
//               <option value="TERMINATED">Terminated</option>
//             </select>

//             <button
//               onClick={clearFilters}
//               className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white/70 backdrop-blur-sm hover:bg-white hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-200 group"
//             >
//               <FunnelIcon className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
//               Clear Filters
//             </button>
//           </div>
//         </div>

//         {/* Enhanced Employee Grid */}
//         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//           {employees.length === 0 ? (
//             <div className="col-span-full text-center py-20">
//               <div className="relative mx-auto w-32 h-32 mb-8">
//                 <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full animate-pulse"></div>
//                 <UserIcon className="absolute inset-4 text-indigo-300" />
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900 mb-2">No employees found</h3>
//               <p className="text-gray-500 mb-6 max-w-md mx-auto">
//                 {filters.search || filters.department || filters.status
//                   ? 'Try adjusting your search criteria to find what you\'re looking for.'
//                   : 'No employees to display at the moment.'}
//               </p>
//               <button
//                 onClick={clearFilters}
//                 className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors duration-200"
//               >
//                 Reset Filters
//               </button>
//             </div>
//           ) : (
//             employees.map((employee, index) => {
//               const employeeName = getEmployeeName(employee);
//               const employeeInitials = getEmployeeInitials(employee);
//               const managerName = getManagerName(employee);
//               const profileGradient = getProfileGradient(employeeName);

//               return (
//                 <div 
//                   key={employee.id} 
//                   className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50 overflow-hidden transform hover:-translate-y-2"
//                   style={{ animationDelay: `${index * 100}ms` }}
//                 >
//                   {/* Card background gradient overlay */}
//                   <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
//                   <div className="relative p-6">
//                     {/* Employee Header */}
//                     <div className="flex items-center">
//                       <div className="flex-shrink-0">
//                         <div className="relative">
//                           <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${profileGradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
//                             <span className="text-white font-bold text-lg">
//                               {employeeInitials}
//                             </span>
//                           </div>
//                           <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
//                             <div className="w-2 h-2 bg-white rounded-full"></div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="ml-4 flex-1">
//                         <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
//                           {employeeName}
//                         </h3>
//                         <p className="text-indigo-600 font-medium mt-1">{employee.position || 'No Position'}</p>
//                         <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block mt-1">
//                           ID: {employee.employee_id || 'No ID'}
//                         </p>
//                       </div>
//                       {/* Enhanced Action Buttons - Only for HR Managers */}
//                       {isHRManager() && (
//                         <div className="flex items-center space-x-2">
//                           <button
//                             onClick={() => handleEditEmployee(employee)}
//                             className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
//                             title="Edit Employee"
//                           >
//                             <PencilIcon className="h-5 w-5" />
//                           </button>
//                           <button
//                             onClick={() => handleDeleteEmployee(employee)}
//                             className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
//                             title="Delete Employee"
//                           >
//                             <TrashIcon className="h-5 w-5" />
//                           </button>
//                         </div>
//                       )}
//                       {/* Manager View Indicator */}
//                       {isManagerOnly && (
//                         <div className="flex items-center space-x-2">
//                           <div className="p-2 text-gray-400 rounded-xl opacity-60">
//                             <span className="text-xs font-medium text-gray-500">View Only</span>
//                           </div>
//                         </div>
//                       )}
//                     </div>
                    
//                     {/* Employee Details */}
//                     <div className="mt-6 space-y-4">
//                       {/* Department */}
//                       <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
//                         <BuildingOfficeIcon className="h-4 w-4 mr-3 text-indigo-400" />
//                         <span className="font-medium">Department:</span>
//                         <span className="ml-2 text-indigo-600 font-medium">{employee.department?.name || 'Not Assigned'}</span>
//                       </div>
                      
//                       {/* Manager */}
//                       <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
//                         <UserGroupIcon className="h-4 w-4 mr-3 text-purple-400" />
//                         <span className="font-medium">Reports to:</span>
//                         <span className="ml-2 text-purple-600 font-medium">{managerName}</span>
//                       </div>
                      
//                       {/* Hire Date */}
//                       <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
//                         <CalendarIcon className="h-4 w-4 mr-3 text-emerald-400" />
//                         <span className="font-medium">Joined:</span>
//                         <span className="ml-2">{employee.hire_date ? formatDate(employee.hire_date) : 'Unknown'}</span>
//                       </div>
//                     </div>

//                     {/* Status Badge & Subordinates */}
//                     <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
//                       <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(employee.status)}`}>
//                         {employee.status || 'ACTIVE'}
//                       </span>
                      
//                       {/* Subordinates count if available */}
//                       {employee.subordinates_count > 0 && (
//                         <span className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-medium">
//                           {employee.subordinates_count} direct report{employee.subordinates_count !== 1 ? 's' : ''}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>

//         {/* Enhanced Results Count */}
//         {employees.length > 0 && (
//           <div className="flex justify-center">
//             <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50">
//               <div className="flex items-center space-x-2">
//                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
//                 <p className="text-sm font-medium text-gray-700">
//                   Showing <span className="text-indigo-600 font-bold">{employees.length}</span> employee{employees.length !== 1 ? 's' : ''}
//                   {isManagerOnly && <span className="text-purple-600"> • Manager View</span>}
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Modals - Only show for HR Managers */}
//       {isHRManager() && (
//         <>
//           <AddEmployeeModal
//             isOpen={showAddModal}
//             onClose={() => setShowAddModal(false)}
//             onSuccess={handleAddEmployeeSuccess}
//           />

//           <EditEmployeeModal
//             isOpen={showEditModal}
//             onClose={() => {
//               setShowEditModal(false);
//               setSelectedEmployee(null);
//             }}
//             onSuccess={handleEditSuccess}
//             employee={selectedEmployee}
//           />

//           <DeleteConfirmationModal
//             isOpen={showDeleteModal}
//             onClose={() => {
//               setShowDeleteModal(false);
//               setSelectedEmployee(null);
//             }}
//             onConfirm={confirmDelete}
//             employee={selectedEmployee}
//             loading={deleteLoading}
//           />
//         </>
//       )}
//     </div>
//   );
// };

// export default EmployeeList;