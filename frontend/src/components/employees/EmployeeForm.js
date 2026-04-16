import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ArrowLeftIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { employeeAPI } from '../../services/api';

const EmployeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchDepartments();
    fetchManagers();
    if (isEdit) {
      fetchEmployee();
    }
  }, [id, isEdit]);

  const fetchEmployee = async () => {
    try {
      const response = await employeeAPI.getEmployee(id);
      const employee = response.data;

      // Reset form with employee data
      reset({
        first_name: employee.user.first_name,
        last_name: employee.user.last_name,
        username: employee.user.username,
        email: employee.user.email,
        employee_id: employee.employee_id,
        position: employee.position,
        department: employee.department?.id || '',
        hire_date: employee.hire_date,
        status: employee.status,
        is_client_employee: employee.is_client_employee || false,
        manager: employee.manager?.id || '',
        phone_number: employee.user.profile?.phone_number || '',
        address: employee.user.profile?.address || '',
        date_of_birth: employee.user.profile?.date_of_birth || '',
        emergency_contact: employee.user.profile?.emergency_contact || '',
      });
    } catch (error) {
      toast.error('Failed to fetch employee data');
      navigate('/employees');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await employeeAPI.getDepartments();
      setDepartments(response.data?.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await employeeAPI.getEmployees({ role: 'HR_MANAGER' });
      console.log("fetching mangers ", response.data)
      setManagers(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch managers');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await employeeAPI.updateEmployee(id, data);
        toast.success('Employee updated successfully!');
      } else {
        await employeeAPI.createEmployee(data);
        toast.success('Employee created successfully!');
      }
      navigate('/employees');
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} employee`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/employees')}
            className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Employees
          </button>
        </div>
      </div>

      <div className="bg-white/5 shadow-lg rounded-xl overflow-hidden">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-white/5 bg-opacity-20 flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {isEdit ? 'Edit Employee' : 'Add New Employee'}
              </h1>
              <p className="text-blue-100 mt-1">
                {isEdit ? 'Update employee information' : 'Fill in the details to add a new employee'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          {/* Personal Information */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-medium text-white">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  {...register('first_name', { required: 'First name is required' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John"
                />
                {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  {...register('last_name', { required: 'Last name is required' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Doe"
                />
                {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Username *</label>
                <input
                  {...register('username', { required: 'Username is required' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="johndoe"
                />
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="john@example.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  {...register('phone_number')}
                  type="tel"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  {...register('date_of_birth')}
                  type="date"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  {...register('address')}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                <input
                  {...register('emergency_contact')}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contact name and phone number"
                />
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-medium text-white">Employment Information</h3>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee ID *</label>
                <input
                  {...register('employee_id', { required: 'Employee ID is required' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="EMP001"
                />
                {errors.employee_id && <p className="mt-1 text-sm text-red-600">{errors.employee_id.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Position *</label>
                <input
                  {...register('position', { required: 'Position is required' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Software Engineer"
                />
                {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  {...register('department')}
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {departments.length === 0 && (
                  <div className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2">
                    No departments found. Please contact HR to add departments.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hire Date *</label>
                <input
                  {...register('hire_date', { required: 'Hire date is required' })}
                  type="date"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.hire_date && <p className="mt-1 text-sm text-red-600">{errors.hire_date.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  {...register('status')}
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              </div>

              <div className="flex items-center mt-6">
                <input
                  {...register('is_client_employee')}
                  type="checkbox"
                  id="is_client_employee"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_client_employee" className="ml-2 block text-sm text-white font-medium">
                  Is Client Employee
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Manager</label>
                <select
                  {...register('manager')}
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Manager</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.user.first_name} {manager.user.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white/5 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Employee' : 'Create Employee')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;
