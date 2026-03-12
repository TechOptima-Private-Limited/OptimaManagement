import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpTrayIcon,
  PaperClipIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { adminUserAPI, authAPI, employeeAPI } from '../../services/api';
import { isHRManager, isAdmin } from '../../utils/auth';
import { formatDate, formatPhoneNumber } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api';

const InfoCard = ({ title, children, className = '' }) => (
  <div className={`bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-6 ${className}`}>
    <h3 className="text-lg font-black text-white mb-4 tracking-tight">{title}</h3>
    {children}
  </div>
);

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start space-x-3">
    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
      <Icon className="h-4 w-4 text-slate-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <div className="mt-1 text-sm font-semibold text-slate-200 break-words">{value || 'N/A'}</div>
    </div>
  </div>
);

const quickActionStyles = {
  blue: {
    card: 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30',
    icon: 'text-indigo-400',
    title: 'text-white',
    desc: 'text-slate-400',
  },
  green: {
    card: 'bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30',
    icon: 'text-emerald-400',
    title: 'text-white',
    desc: 'text-slate-400',
  },
  purple: {
    card: 'bg-violet-500/5 border border-violet-500/20 hover:bg-violet-500/10 hover:border-violet-500/30',
    icon: 'text-violet-400',
    title: 'text-white',
    desc: 'text-slate-400',
  },
};

const QuickActionCard = ({ title, description, href, icon: Icon, color = 'blue' }) => {
  const styles = quickActionStyles[color] || quickActionStyles.blue;
  return (
    <Link to={href} className={`block p-4 rounded-2xl transition-colors ${styles.card}`}>
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
          <Icon className={`h-5 w-5 ${styles.icon}`} />
        </div>
        <div>
          <div className={`text-sm font-black tracking-wide ${styles.title}`}>{title}</div>
          <div className={`text-xs font-semibold ${styles.desc}`}>{description}</div>
        </div>
      </div>
    </Link>
  );
};

const EmployeeDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    date_of_birth: '',
    emergency_contact: '',
    department_id: '',
    position: '',
    hire_date: '',
    manager: '',
    sub_department: '',
    location: '',
    status: 'ACTIVE',
  });
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);
  const [documentsFetched, setDocumentsFetched] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [documentInputs, setDocumentInputs] = useState([{ id: 'new-1', docType: '', file: null }]);
  const [onboardingEmployeeId, setOnboardingEmployeeId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const response = await employeeAPI.getEmployee(id);
      setEmployee(response.data);
    } catch (error) {
      toast.error('Failed to fetch employee details');
      navigate('/employees');
    } finally {
      setLoading(false);
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

  const fetchManagers = async () => {
    try {
      const response = await employeeAPI.getEmployees();
      const list = response.data.results || response.data || [];
      setManagers(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    }
  };

  const resolveOnboardingEmployee = async (emp) => {
    const email = emp?.user?.email || emp?.user_info?.email || emp?.email;
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

      const data = await response.json();
      const docs = Array.isArray(data?.documents) ? data.documents : [];
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch employee documents:', error);
      setDocumentsError('Unable to load existing documents');
    } finally {
      setDocumentsLoading(false);
      setDocumentsFetched(true);
    }
  };

  const addDocumentInput = () => {
    setDocumentInputs((prev) => [...prev, { id: `new-${Date.now()}`, docType: '', file: null }]);
  };

  const removeDocumentInput = (rowId) => {
    setDocumentInputs((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== rowId)));
  };

  const updateDocumentInput = (rowId, field, value) => {
    setDocumentInputs((prev) => prev.map((item) => (item.id === rowId ? { ...item, [field]: value } : item)));
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
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to upload documents');
      }

      const result = await response.json().catch(() => ({}));
      const uploadedCount = result.files_uploaded?.length || documentsToUpload.length;
      toast.success(`Uploaded ${uploadedCount} document${uploadedCount === 1 ? '' : 's'} successfully.`);

      setDocumentInputs([{ id: 'new-1', docType: '', file: null }]);
      fetchEmployeeDocuments(targetId);
    } catch (error) {
      console.error('Document upload failed:', error);
      toast.error(error.message || 'Failed to upload documents');
    } finally {
      setUploadingDocuments(false);
    }
  };

  const buildEditDataFromEmployee = (emp) => ({
    employee_id: emp?.employee_id || emp?.user?.username || emp?.user_info?.username || '',
    first_name: emp?.user?.first_name || emp?.user_info?.first_name || '',
    last_name: emp?.user?.last_name || emp?.user_info?.last_name || '',
    email: emp?.user?.email || emp?.user_info?.email || '',
    phone_number: emp?.user?.profile?.phone_number || '',
    address: emp?.user?.profile?.address || '',
    date_of_birth: emp?.user?.profile?.date_of_birth || '',
    emergency_contact: emp?.user?.profile?.emergency_contact || '',
    department_id: emp?.department?.id || '',
    position: emp?.position || '',
    hire_date: emp?.hire_date || '',
    manager: emp?.manager?.id || '',
    sub_department: emp?.sub_department || '',
    location: emp?.location || '',
    status: emp?.status || 'ACTIVE',
  });

  useEffect(() => {
    if (!employee) return;
    if (isEditing) return;
    setEditData(buildEditDataFromEmployee(employee));
  }, [employee, isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    fetchDepartments();
    fetchManagers();
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    if (!employee) return;

    setDocuments([]);
    setDocumentsError(null);
    setDocumentsFetched(false);
    setDocumentInputs([{ id: 'new-1', docType: '', file: null }]);
    setOnboardingEmployeeId(null);

    const initDocs = async () => {
      const resolvedId = await resolveOnboardingEmployee(employee);
      const effectiveId = resolvedId || employee.id;
      setOnboardingEmployeeId(effectiveId);

      if (resolvedId) {
        fetchEmployeeDocuments(effectiveId);
      } else {
        setDocumentsFetched(true);
        setDocumentsError(null);
      }
    };

    initDocs();
  }, [isEditing, employee]);

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const startEditing = () => {
    setEditData(buildEditDataFromEmployee(employee));
    setIsEditing(true);
  };

  useEffect(() => {
    if (!employee) return;
    if (isEditing) return;
    if (!location?.state?.editMode) return;

    startEditing();
    navigate(location.pathname, { replace: true, state: {} });
  }, [employee, isEditing, location?.state?.editMode, location.pathname, navigate]);

  const cancelEditing = () => {
    setEditData(buildEditDataFromEmployee(employee));
    setIsEditing(false);
  };

  const saveEdits = async () => {
    if (!employee?.id) return;
    setSaving(true);
    try {
      const updateData = { ...editData };

      if (updateData.department_id === '' || updateData.department_id === null || updateData.department_id === undefined) {
        delete updateData.department_id;
      } else {
        const depId = parseInt(updateData.department_id);
        if (isNaN(depId)) delete updateData.department_id;
        else updateData.department_id = depId;
      }

      if (updateData.manager === '' || updateData.manager === null || updateData.manager === undefined) {
        updateData.manager_id = null;
        delete updateData.manager;
      } else {
        const mgrId = parseInt(updateData.manager);
        if (!isNaN(mgrId)) updateData.manager_id = mgrId;
        delete updateData.manager;
      }

      const employeeUpdateData = { ...updateData };
      delete employeeUpdateData.first_name;
      delete employeeUpdateData.last_name;
      delete employeeUpdateData.email;
      delete employeeUpdateData.phone_number;
      delete employeeUpdateData.address;
      delete employeeUpdateData.date_of_birth;
      delete employeeUpdateData.emergency_contact;

      if (!employeeUpdateData.position) delete employeeUpdateData.position;
      if (!employeeUpdateData.employee_id) delete employeeUpdateData.employee_id;
      if (!employeeUpdateData.hire_date) delete employeeUpdateData.hire_date;
      if (!employeeUpdateData.sub_department) delete employeeUpdateData.sub_department;
      if (!employeeUpdateData.location) delete employeeUpdateData.location;

      const canEditOtherUsers = isHRManager() || isAdmin();
      const userId = employee?.user?.id || employee?.user_info?.id || employee?.user;

      const userUpdatePayload = {
        first_name: updateData.first_name,
        last_name: updateData.last_name,
        email: updateData.email,
        profile: {
          phone_number: updateData.phone_number,
          address: updateData.address,
          date_of_birth: updateData.date_of_birth || null,
          emergency_contact: updateData.emergency_contact,
        },
      };

      await Promise.all([
        employeeAPI.updateEmployee(employee.id, employeeUpdateData),
        canEditOtherUsers && userId
          ? adminUserAPI.updateUser(userId, userUpdatePayload)
          : authAPI.updateProfile({
              first_name: userUpdatePayload.first_name,
              last_name: userUpdatePayload.last_name,
              phone_number: userUpdatePayload.profile.phone_number,
              address: userUpdatePayload.profile.address,
              date_of_birth: userUpdatePayload.profile.date_of_birth,
              emergency_contact: userUpdatePayload.profile.emergency_contact,
            }),
      ]);

      toast.success('Employee updated successfully!');
      setIsEditing(false);
      fetchEmployee();
    } catch (error) {
      console.error('Error updating employee:', error);
      const data = error.response?.data;
      const errorMessage =
        data?.detail ||
        data?.error ||
        'Failed to update employee';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!employee?.id) return;
    setDeleting(true);
    try {
      await employeeAPI.deleteEmployee(employee.id);
      toast.success('Employee deleted successfully');
      navigate('/employees');
    } catch (error) {
      console.error('Failed to delete employee:', error);
      toast.error('Failed to delete employee');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!employee) return null;

  const yearsOfService = employee.hire_date
    ? Math.floor((new Date() - new Date(employee.hire_date)) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {employee.user_info?.full_name || `${employee.user?.first_name || ''} ${employee.user?.last_name || ''}`.trim() || 'Employee'}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <StatusBadge status={employee.status} />
              <span className="text-xs font-bold text-slate-500">ID: {employee.employee_id || 'N/A'}</span>
            </div>
          </div>

          {(isHRManager() || isAdmin()) && (
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm font-black hover:bg-white/10 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdits}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={startEditing}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm font-black hover:bg-white/10"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-black hover:bg-rose-500"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <InfoCard title="Profile Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</div>
                      {isEditing ? (
                        <input
                          type="text"
                          name="first_name"
                          value={editData.first_name}
                          onChange={handleEditInputChange}
                          className="mt-2 w-full px-4 py-3 bg-[#070B14] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold"
                        />
                      ) : (
                        <div className="mt-2 text-sm font-semibold text-white">{employee.user?.first_name || employee.user_info?.first_name || 'N/A'}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</div>
                      {isEditing ? (
                        <input
                          type="text"
                          name="last_name"
                          value={editData.last_name}
                          onChange={handleEditInputChange}
                          className="mt-2 w-full px-4 py-3 bg-[#070B14] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold"
                        />
                      ) : (
                        <div className="mt-2 text-sm font-semibold text-white">{employee.user?.last_name || employee.user_info?.last_name || 'N/A'}</div>
                      )}
                    </div>
                  </div>

                  <InfoCard title="Contact Information" className="p-0 bg-transparent border-0 shadow-none">
                    <div className="space-y-4">
                      <InfoItem
                        icon={EnvelopeIcon}
                        label="Email"
                        value={
                          isEditing ? (
                            <input
                              type="email"
                              name="email"
                              value={editData.email}
                              onChange={handleEditInputChange}
                              className="w-full px-4 py-3 bg-[#070B14] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold"
                            />
                          ) : (
                            employee.user?.email || employee.user_info?.email
                          )
                        }
                      />
                      <InfoItem
                        icon={PhoneIcon}
                        label="Phone"
                        value={
                          isEditing ? (
                            <input
                              type="text"
                              name="phone_number"
                              value={editData.phone_number}
                              onChange={handleEditInputChange}
                              className="w-full px-4 py-3 bg-[#070B14] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold"
                            />
                          ) : (
                            formatPhoneNumber(employee.user?.profile?.phone_number)
                          )
                        }
                      />
                      <InfoItem
                        icon={MapPinIcon}
                        label="Address"
                        value={
                          isEditing ? (
                            <textarea
                              name="address"
                              value={editData.address}
                              onChange={handleEditInputChange}
                              rows={2}
                              className="w-full px-4 py-3 bg-[#070B14] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold resize-none"
                            />
                          ) : (
                            employee.user?.profile?.address
                          )
                        }
                      />
                    </div>
                  </InfoCard>
                </div>

                <div className="space-y-6">
                  <InfoCard title="Employment Details" className="p-0 bg-transparent border-0 shadow-none">
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee ID</div>
                        {isEditing ? (
                          <input
                            type="text"
                            name="employee_id"
                            value={editData.employee_id}
                            onChange={handleEditInputChange}
                            className="mt-2 w-full px-4 py-3 bg-[#070B14] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold"
                          />
                        ) : (
                          <div className="mt-2 text-sm font-semibold text-white">{employee.employee_id || 'N/A'}</div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</div>
                        {isEditing ? (
                          <select
                            name="department_id"
                            value={editData.department_id}
                            onChange={handleEditInputChange}
                            className="mt-2 w-full px-4 py-3 bg-[#070B14] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold"
                          >
                            <option value="" className="bg-[#0A0F1A]">Select Department</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id} className="bg-[#0A0F1A]">{dept.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="mt-2 text-sm font-semibold text-white">{employee.department?.name || 'N/A'}</div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Position</div>
                        {isEditing ? (
                          <input
                            type="text"
                            name="position"
                            value={editData.position}
                            onChange={handleEditInputChange}
                            className="mt-2 w-full px-4 py-3 bg-[#070B14] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold"
                          />
                        ) : (
                          <div className="mt-2 text-sm font-semibold text-white">{employee.position || 'N/A'}</div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hire Date</div>
                        {isEditing ? (
                          <input
                            type="date"
                            name="hire_date"
                            value={editData.hire_date}
                            onChange={handleEditInputChange}
                            className="mt-2 w-full px-4 py-3 bg-[#070B14] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold [color-scheme:dark]"
                          />
                        ) : (
                          <div className="mt-2 text-sm font-semibold text-white">{formatDate(employee.hire_date)}</div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manager</div>
                        {isEditing ? (
                          <select
                            name="manager"
                            value={editData.manager}
                            onChange={handleEditInputChange}
                            className="mt-2 w-full px-4 py-3 bg-[#070B14] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold"
                          >
                            <option value="" className="bg-[#0A0F1A]">None</option>
                            {managers
                              .filter((m) => String(m.id) !== String(employee.id))
                              .map((m) => (
                                <option key={m.id} value={m.id} className="bg-[#0A0F1A]">
                                  {m.user_info?.full_name || `${m.user?.first_name || ''} ${m.user?.last_name || ''}`.trim() || m.user?.username || m.employee_id}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <div className="mt-2 text-sm font-semibold text-white">
                            {employee.manager?.user_info?.full_name || (employee.manager?.user ? `${employee.manager.user.first_name || ''} ${employee.manager.user.last_name || ''}`.trim() : '') || 'N/A'}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</div>
                        {isEditing ? (
                          <select
                            name="status"
                            value={editData.status}
                            onChange={handleEditInputChange}
                            className="mt-2 w-full px-4 py-3 bg-[#070B14] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold"
                          >
                            <option value="ACTIVE" className="bg-[#0A0F1A]">Active</option>
                            <option value="INACTIVE" className="bg-[#0A0F1A]">Inactive</option>
                            <option value="TERMINATED" className="bg-[#0A0F1A]">Terminated</option>
                          </select>
                        ) : (
                          <div className="mt-2 text-sm font-semibold text-white">{employee.status || 'N/A'}</div>
                        )}
                      </div>
                    </div>
                  </InfoCard>

                  <InfoCard title="Personal Information" className="p-0 bg-transparent border-0 shadow-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth</div>
                        {isEditing ? (
                          <input
                            type="date"
                            name="date_of_birth"
                            value={editData.date_of_birth}
                            onChange={handleEditInputChange}
                            className="mt-2 w-full px-4 py-3 bg-[#070B14] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold [color-scheme:dark]"
                          />
                        ) : (
                          <div className="mt-2 text-sm font-semibold text-white">{formatDate(employee.user?.profile?.date_of_birth)}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency Contact</div>
                        {isEditing ? (
                          <input
                            type="text"
                            name="emergency_contact"
                            value={editData.emergency_contact}
                            onChange={handleEditInputChange}
                            className="mt-2 w-full px-4 py-3 bg-[#070B14] border border-white/10 rounded-2xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold"
                          />
                        ) : (
                          <div className="mt-2 text-sm font-semibold text-white">{employee.user?.profile?.emergency_contact || 'N/A'}</div>
                        )}
                      </div>
                    </div>
                  </InfoCard>
                </div>
              </div>
            </InfoCard>

            {isEditing && (
              <InfoCard title="Documents">
                <div className="bg-[#070B14] border border-white/10 rounded-2xl overflow-hidden shadow-inner">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                        <ArrowUpTrayIcon className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-wide">Documents</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Manage employee onboarding files</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addDocumentInput}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 hover:text-indigo-200 transition-colors border border-indigo-500/20"
                    >
                      <PlusIcon className="h-3.5 w-3.5 mr-1" />
                      Add Row
                    </button>
                  </div>

                  <div className="divide-y divide-white/5">
                    {documentsFetched && (
                      <div className="px-6 py-4">
                        <div className="flex items-center mb-3">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Existing Files</span>
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white">{documents.length}</span>
                        </div>
                        {documentsLoading ? (
                          <div className="flex items-center space-x-2 text-indigo-400 py-2">
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">Loading files...</span>
                          </div>
                        ) : documents.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {documents.map((doc) => (
                              <div
                                key={`${doc.field}-${doc.doc_type}`}
                                className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors group"
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <PaperClipIcon className="h-4 w-4 text-slate-400 shrink-0" />
                                  <span className="text-xs font-semibold text-slate-300 truncate">{doc.doc_type}</span>
                                </div>
                                {doc.url ? (
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ml-2"
                                  >
                                    View
                                  </a>
                                ) : (
                                  <span className="text-[10px] uppercase font-bold text-slate-600 ml-2">Unavailable</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 py-2 font-medium">No files uploaded yet.</p>
                        )}
                        {documentsError && <p className="mt-2 text-xs font-bold text-rose-400">{documentsError}</p>}
                      </div>
                    )}

                    <div className="bg-[#0A0F1A]/50 px-6 py-5 space-y-4">
                      {documentInputs.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 bg-white/5 p-3 rounded-xl border border-white/5"
                        >
                          <div className="w-full sm:w-1/3">
                            <input
                              type="text"
                              value={item.docType}
                              onChange={(e) => updateDocumentInput(item.id, 'docType', e.target.value)}
                              placeholder="Document name"
                              className="w-full bg-[#070B14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 placeholder-slate-600 transition-all font-medium"
                            />
                          </div>
                          <div className="w-full sm:flex-1 relative">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={(e) => updateDocumentInput(item.id, 'file', e.target.files?.[0] || null)}
                              className="w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer file:transition-colors cursor-pointer"
                            />
                          </div>
                          <div className="flex shrink-0">
                            {documentInputs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeDocumentInput(item.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                                title="Remove row"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={uploadDocuments}
                          disabled={uploadingDocuments || documentInputs.every((d) => !d.file || !d.docType)}
                          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/5 hover:border-white/20"
                        >
                          {uploadingDocuments ? 'Uploading...' : 'Upload Files'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </InfoCard>
            )}
          </div>

          <div className="space-y-6">
            <InfoCard title="Quick Actions">
              <div className="space-y-3">
                <QuickActionCard
                  title="View Attendance"
                  description="Check attendance records"
                  href={`/attendance?employee=${employee.employee_id || id}`}
                  icon={ClockIcon}
                  color="blue"
                />
                <QuickActionCard
                  title="Leave History"
                  description="View leave requests"
                  href={`/leave?employee=${employee.employee_id || id}`}
                  icon={CalendarIcon}
                  color="green"
                />
                {(isHRManager() || isAdmin()) && (
                  <QuickActionCard
                    title="Onboarding Tasks"
                    description="Manage onboarding"
                    href={`/onboarding/employees?employee=${encodeURIComponent(employee.user?.email || employee.user_info?.email || '')}`}
                    icon={DocumentTextIcon}
                    color="purple"
                  />
                )}
              </div>
            </InfoCard>

            <InfoCard title="Employment Stats">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-semibold">Years of Service</span>
                  <span className="text-sm font-black text-white">{yearsOfService} years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-semibold">Employment Type</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="sub_department"
                      value={editData.sub_department}
                      onChange={handleEditInputChange}
                      className="w-44 px-3 py-2 bg-[#070B14] border border-white/10 rounded-xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-black text-right"
                    />
                  ) : (
                    <span className="text-sm font-black text-white">{employee.sub_department || 'N/A'}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-semibold">Work Location</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={editData.location}
                      onChange={handleEditInputChange}
                      className="w-44 px-3 py-2 bg-[#070B14] border border-white/10 rounded-xl text-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-black text-right"
                    />
                  ) : (
                    <span className="text-sm font-black text-white">{employee.location || 'N/A'}</span>
                  )}
                </div>
              </div>
            </InfoCard>
          </div>
        </div>
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Employee">
        <div className="space-y-4">
          <p className="text-sm text-white font-black">Are you sure you want to delete this employee?</p>
          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-rose-500 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Employee'}
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 bg-white/10 text-slate-200 px-4 py-2 rounded-xl text-sm font-black hover:bg-white/15"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeDetail;