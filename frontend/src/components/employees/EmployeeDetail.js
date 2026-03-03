import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
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
import { employeeAPI } from '../../services/api';
import { isHRManager, isAdmin } from '../../utils/auth';
import { formatDate, formatPhoneNumber } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await employeeAPI.deleteEmployee(id);
      toast.success('Employee deleted successfully');
      navigate('/employees');
    } catch (error) {
      toast.error('Failed to delete employee');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading employee details..." />;
  }

  if (!employee) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Employee not found</p>
          <Link to="/employees" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            Back to Employees
          </Link>
        </div>
      </div>
    );
  }

  const InfoCard = ({ title, children, className = "" }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );

  const InfoItem = ({ icon: Icon, label, value, href = null }) => (
    <div className="flex items-center space-x-3 py-3">
      <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {href ? (
          <a href={href} className="text-sm text-blue-600 hover:text-blue-500 truncate">
            {value || 'N/A'}
          </a>
        ) : (
          <p className="text-sm text-gray-900 truncate">{value || 'N/A'}</p>
        )}
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, href, icon: Icon, color = "blue" }) => (
    <Link
      to={href}
      className={`block p-4 bg-${color}-50 rounded-lg hover:bg-${color}-100 transition-colors border border-${color}-200`}
    >
      <div className="flex items-center space-x-3">
        <Icon className={`h-6 w-6 text-${color}-600`} />
        <div>
          <div className={`text-sm font-medium text-${color}-900`}>{title}</div>
          <div className={`text-xs text-${color}-700`}>{description}</div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/employees"
              className="text-gray-500 hover:text-gray-700 flex items-center"
            >
              ← Back to Employees
            </Link>
          </div>
          {(isHRManager() || isAdmin()) && (
            <div className="flex space-x-3">
              <Link
                to={`/employees/${id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <InfoCard title="Profile Information">
            <div className="flex items-center space-x-6 mb-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-3xl">
                  {employee.user.first_name?.[0]}{employee.user.last_name?.[0]}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {employee.user.first_name} {employee.user.last_name}
                </h1>
                <p className="text-lg text-gray-600">{employee.position}</p>
                <div className="mt-2 flex items-center space-x-4">
                  <StatusBadge status={employee.status} />
                  <span className="text-sm text-gray-500">ID: {employee.employee_id}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-1">
                  <InfoItem
                    icon={EnvelopeIcon}
                    label="Email"
                    value={employee.user.email}
                    href={`mailto:${employee.user.email}`}
                  />
                  <InfoItem
                    icon={PhoneIcon}
                    label="Phone"
                    value={formatPhoneNumber(employee.user.profile?.phone_number)}
                    href={employee.user.profile?.phone_number ? `tel:${employee.user.profile.phone_number}` : null}
                  />
                  <InfoItem
                    icon={MapPinIcon}
                    label="Address"
                    value={employee.user.profile?.address}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Employment Details</h4>
                <div className="space-y-1">
                  <InfoItem
                    icon={BuildingOfficeIcon}
                    label="Department"
                    value={employee.department?.name}
                  />
                  <InfoItem
                    icon={CalendarIcon}
                    label="Hire Date"
                    value={formatDate(employee.hire_date)}
                  />
                  <InfoItem
                    icon={UserIcon}
                    label="Manager"
                    value={employee.manager ? `${employee.manager.user.first_name} ${employee.manager.user.last_name}` : 'N/A'}
                  />
                </div>
              </div>
            </div>
          </InfoCard>

          {/* Personal Information */}
          <InfoCard title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem
                icon={CalendarIcon}
                label="Date of Birth"
                value={formatDate(employee.user.profile?.date_of_birth)}
              />
              <InfoItem
                icon={PhoneIcon}
                label="Emergency Contact"
                value={employee.user.profile?.emergency_contact}
              />
            </div>
          </InfoCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <InfoCard title="Quick Actions">
            <div className="space-y-3">
              <QuickActionCard
                title="View Attendance"
                description="Check attendance records"
                href={`/attendance?employee=${id}`}
                icon={ClockIcon}
                color="blue"
              />
              <QuickActionCard
                title="Leave History"
                description="View leave requests"
                href={`/leave?employee=${id}`}
                icon={CalendarIcon}
                color="green"
              />
              {(isHRManager() || isAdmin()) && (
                <QuickActionCard
                  title="Onboarding Tasks"
                  description="Manage onboarding"
                  href={`/onboarding?employee=${id}`}
                  icon={DocumentTextIcon}
                  color="purple"
                />
              )}
            </div>
          </InfoCard>

          {/* Employment Stats */}
          <InfoCard title="Employment Stats">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Years of Service</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.floor((new Date() - new Date(employee.hire_date)) / (365.25 * 24 * 60 * 60 * 1000))} years
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Employment Type</span>
                  <span className="text-sm font-medium text-gray-900">Full-time</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Work Location</span>
                  <span className="text-sm font-medium text-gray-900">Office</span>
                </div>
              </div>
            </div>
          </InfoCard>

          {/* Recent Activity */}
          <InfoCard title="Recent Activity">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <p className="text-xs text-gray-600">Last login</p>
                  <p className="text-sm font-medium text-gray-900">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div>
                  <p className="text-xs text-gray-600">Last attendance</p>
                  <p className="text-sm font-medium text-gray-900">Today, 9:00 AM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div>
                  <p className="text-xs text-gray-600">Profile updated</p>
                  <p className="text-sm font-medium text-gray-900">1 week ago</p>
                </div>
              </div>
            </div>
          </InfoCard>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Employee"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <TrashIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-900 font-medium">
                Are you sure you want to delete this employee?
              </p>
              <p className="text-sm text-gray-600">
                This action cannot be undone. All data associated with {employee.user.first_name} {employee.user.last_name} will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Employee'}
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
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