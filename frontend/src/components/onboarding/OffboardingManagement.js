import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api, { adminUserAPI } from '../../services/api';
import { 
  PlusIcon,
  UserMinusIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const OffboardingManagement = () => {
  const [offboardings, setOffboardings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const createOffboarding = async () => {
    try {
      const formData = new FormData();
      formData.append('employee', newOffboarding.employee);
      formData.append('last_working_date', newOffboarding.last_working_date);
      formData.append('remarks', newOffboarding.remarks);
      
      if (newOffboarding.resignation_email_screenshot) {
        // Backend expects 'damaged_assets_file'
        formData.append('damaged_assets_file', newOffboarding.resignation_email_screenshot);
      }

      await api.post('/onboarding/offboarding/', formData);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offboarding Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage employee offboarding process and exit procedures
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Offboarding
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-red-500 text-white">
              <UserMinusIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total</h3>
              <p className="text-2xl font-bold text-gray-900">{(offboardings || []).length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-yellow-500 text-white">
              <CalendarDaysIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">This Week</h3>
              <p className="text-2xl font-bold text-gray-900">
                {(offboardings || []).filter(o => getDaysUntilLastWorking(o.last_working_date) >= 0 && getDaysUntilLastWorking(o.last_working_date) <= 7).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-green-500 text-white">
              <DocumentTextIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Completed</h3>
              <p className="text-2xl font-bold text-gray-900">
                {(offboardings || []).filter(o => isOverdue(o.last_working_date)).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-blue-500 text-white">
              <span className="text-lg font-bold">
                {(offboardings || []).length > 0 ? Math.round((offboardings || []).reduce((sum, o) => sum + (parseInt(o.notice_period_days || 0) || 0), 0) / (offboardings || []).length) : 0}
              </span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Avg Notice</h3>
              <p className="text-sm text-gray-500">Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search offboardings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Offboardings List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredOffboardings.length === 0 ? (
            <div className="text-center py-12">
              <UserMinusIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No offboardings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No offboarding records match your search criteria.
              </p>
            </div>
          ) : (
            filteredOffboardings.map((offboarding) => (
              <li key={offboarding.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-12 w-12 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {offboarding.employee_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {offboarding.employee_name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(offboarding.last_working_date)}`}>
                          {getStatusLabel(offboarding.last_working_date)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span>Last Working: {new Date(offboarding.last_working_date).toLocaleDateString()}</span>
                        <span>• Notice Period: {offboarding.notice_period_days} days</span>
                        {offboarding.employee_email && <span>• {offboarding.employee_email}</span>}
                      </div>
                      {offboarding.remarks && (
                        <p className="mt-1 text-sm text-gray-600 truncate">{offboarding.remarks}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedOffboarding(offboarding);
                        setShowDetailsModal(true);
                      }}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>

                    <button
                      onClick={() => deleteOffboarding(offboarding.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
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
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowCreateModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Add Offboarding Record
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee *</label>
                    <select
                      value={newOffboarding.employee}
                      onChange={(e) => setNewOffboarding({ ...newOffboarding, employee: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select Employee</option>
                      {(displayEmployees || []).map((employee) => {
                        const isOffboarded = offboardedEmployeeIds.has(employee.id);
                        const name = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.email;
                        return (
                          <option key={employee.id} value={employee.id} disabled={isOffboarded}>
                            {isOffboarded ? `${name} (already offboarded)` : name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Working Date *</label>
                    <input
                      type="date"
                      value={newOffboarding.last_working_date}
                      onChange={(e) => setNewOffboarding({ ...newOffboarding, last_working_date: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notice Period (Days) *</label>
                    <input
                      type="number"
                      value={newOffboarding.notice_period_days}
                      onChange={(e) => setNewOffboarding({ ...newOffboarding, notice_period_days: parseInt(e.target.value) })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resignation Email Screenshot</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewOffboarding({ ...newOffboarding, resignation_email_screenshot: e.target.files[0] })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Upload screenshot of resignation email (optional)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Remarks</label>
                    <textarea
                      value={newOffboarding.remarks}
                      onChange={(e) => setNewOffboarding({ ...newOffboarding, remarks: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      placeholder="Additional notes about the offboarding..."
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={createOffboarding}
                  disabled={!newOffboarding.employee || !newOffboarding.last_working_date}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Create Offboarding
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDetailsModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Offboarding Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOffboarding.employee_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOffboarding.employee_email || 'Not available'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Working Date</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedOffboarding.last_working_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notice Period</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOffboarding.notice_period_days} days</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOffboarding.last_working_date)}`}>
                      {getStatusLabel(selectedOffboarding.last_working_date)}
                    </span>
                  </div>
                  {selectedOffboarding.remarks && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Remarks</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedOffboarding.remarks}</p>
                    </div>
                  )}
                  {selectedOffboarding.damaged_assets_file && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Resignation Email Screenshot</label>
                      <div className="mt-1">
                        <img 
                          src={selectedOffboarding.damaged_assets_file} 
                          alt="Resignation Email"
                          className="max-w-full h-auto rounded-lg border border-gray-300"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
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

export default OffboardingManagement;