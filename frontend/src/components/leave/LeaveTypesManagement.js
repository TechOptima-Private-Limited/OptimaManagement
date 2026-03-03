// import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
// import { 
//   PlusIcon,
//   PencilIcon,
//   TrashIcon,
//   CogIcon,
//   CalendarDaysIcon,
//   UsersIcon,
//   ChartBarIcon,
//   ExclamationTriangleIcon
// } from '@heroicons/react/24/outline';
// import { leaveAPI, employeeAPI } from '../../services/api';
// import { formatDate } from '../../utils/formatters';
// import LoadingSpinner from '../common/LoadingSpinner';
// import Modal from '../common/Modal';
// import { useForm } from 'react-hook-form';

// const LeaveTypesManagement = () => {
//   const [leaveTypes, setLeaveTypes] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [showTypeModal, setShowTypeModal] = useState(false);
//   const [showBalanceModal, setShowBalanceModal] = useState(false);
//   const [editingType, setEditingType] = useState(null);
//   const [activeTab, setActiveTab] = useState('types');

//   const { register, handleSubmit, reset, formState: { errors } } = useForm();
//   const { register: registerBalance, handleSubmit: handleSubmitBalance, reset: resetBalance, formState: { errors: balanceErrors } } = useForm();

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const [typesResponse, employeesResponse] = await Promise.all([
//         leaveAPI.getLeaveTypes(),
//         employeeAPI.getEmployees()
//       ]);
      
//       setLeaveTypes(typesResponse.data.results || typesResponse.data);
//       setEmployees(employeesResponse.data.results || employeesResponse.data);
//     } catch (error) {
//       toast.error('Failed to fetch data');
//       console.error('Error fetching data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onSubmitType = async (data) => {
//     setSubmitting(true);
//     try {
//       if (editingType) {
//         await leaveAPI.updateLeaveType(editingType.id, data);
//         toast.success('Leave type updated successfully!');
//       } else {
//         await leaveAPI.createLeaveType(data);
//         toast.success('Leave type created successfully!');
//       }
      
//       fetchData();
//       setShowTypeModal(false);
//       setEditingType(null);
//       reset();
//     } catch (error) {
//       const errorMessage = error.response?.data?.error || 'Failed to save leave type';
//       toast.error(errorMessage);
//       console.error('Error saving leave type:', error);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const onSubmitBalanceInit = async (data) => {
//     setSubmitting(true);
//     try {
//       await leaveAPI.initializeYearlyBalances(data);
//       toast.success(`Leave balances initialized for ${data.year}!`);
//       setShowBalanceModal(false);
//       resetBalance();
//     } catch (error) {
//       const errorMessage = error.response?.data?.error || 'Failed to initialize balances';
//       toast.error(errorMessage);
//       console.error('Error initializing balances:', error);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleEditType = (leaveType) => {
//     setEditingType(leaveType);
//     reset(leaveType);
//     setShowTypeModal(true);
//   };

//   const handleDeleteType = async (typeId) => {
//     if (window.confirm('Are you sure you want to delete this leave type? This action cannot be undone.')) {
//       try {
//         await leaveAPI.deleteLeaveType(typeId);
//         toast.success('Leave type deleted successfully!');
//         fetchData();
//       } catch (error) {
//         const errorMessage = error.response?.data?.error || 'Failed to delete leave type';
//         toast.error(errorMessage);
//         console.error('Error deleting leave type:', error);
//       }
//     }
//   };

//   const LeaveTypeCard = ({ leaveType }) => (
//     <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//       <div className="flex items-start justify-between">
//         <div className="flex-1">
//           <div className="flex items-center space-x-2 mb-2">
//             <h3 className="text-lg font-medium text-gray-900">{leaveType.name}</h3>
//             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
//               {leaveType.code}
//             </span>
//             {!leaveType.is_active && (
//               <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
//                 Inactive
//               </span>
//             )}
//           </div>
          
//           <p className="text-sm text-gray-600 mb-3">{leaveType.description}</p>
          
//           <div className="grid grid-cols-2 gap-4 text-sm">
//             <div>
//               <span className="font-medium text-gray-700">Days per year:</span>
//               <span className="ml-2 text-gray-900">{leaveType.days_allowed_per_year}</span>
//             </div>
//             <div>
//               <span className="font-medium text-gray-700">Carry forward:</span>
//               <span className="ml-2 text-gray-900">
//                 {leaveType.is_carry_forward ? `Yes (${leaveType.max_carry_forward_days} max)` : 'No'}
//               </span>
//             </div>
//           </div>
          
//           <div className="mt-2 text-xs text-gray-500">
//             Created: {formatDate(leaveType.created_at)}
//           </div>
//         </div>
        
//         <div className="flex items-center space-x-2 ml-4">
//           <button
//             onClick={() => handleEditType(leaveType)}
//             className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             title="Edit"
//           >
//             <PencilIcon className="h-4 w-4" />
//           </button>
//           <button
//             onClick={() => handleDeleteType(leaveType.id)}
//             className="inline-flex items-center p-2 border border-red-300 rounded-md shadow-sm bg-white text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
//             title="Delete"
//           >
//             <TrashIcon className="h-4 w-4" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   if (loading) {
//     return <LoadingSpinner text="Loading leave management..." />;
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h3 className="text-lg font-medium text-gray-900">Leave Types & Balance Management</h3>
//           <p className="mt-1 text-sm text-gray-500">
//             Manage leave types and initialize employee leave balances
//           </p>
//         </div>
//         <div className="flex space-x-3">
//           <button
//             onClick={() => setShowBalanceModal(true)}
//             className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//           >
//             <UsersIcon className="h-4 w-4 mr-2" />
//             Initialize Balances
//           </button>
//           <button
//             onClick={() => {
//               setEditingType(null);
//               reset();
//               setShowTypeModal(true);
//             }}
//             className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//           >
//             <PlusIcon className="h-4 w-4 mr-2" />
//             Add Leave Type
//           </button>
//         </div>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <div className="flex-shrink-0">
//               <CalendarDaysIcon className="h-8 w-8 text-blue-500" />
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-500">Total Leave Types</p>
//               <p className="text-2xl font-semibold text-gray-900">{leaveTypes.length}</p>
//             </div>
//           </div>
//         </div>
        
//         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <div className="flex-shrink-0">
//               <UsersIcon className="h-8 w-8 text-green-500" />
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-500">Total Employees</p>
//               <p className="text-2xl font-semibold text-gray-900">{employees.length}</p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <div className="flex-shrink-0">
//               <ChartBarIcon className="h-8 w-8 text-purple-500" />
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-500">Active Leave Types</p>
//               <p className="text-2xl font-semibold text-gray-900">
//                 {leaveTypes.filter(type => type.is_active).length}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Leave Types Grid */}
//       <div>
//         <h4 className="text-md font-medium text-gray-900 mb-4">Leave Types</h4>
        
//         {leaveTypes.length === 0 ? (
//           <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
//             <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
//             <h3 className="mt-2 text-sm font-medium text-gray-900">No leave types found</h3>
//             <p className="mt-1 text-sm text-gray-500">
//               Get started by creating your first leave type.
//             </p>
//             <button
//               onClick={() => {
//                 setEditingType(null);
//                 reset();
//                 setShowTypeModal(true);
//               }}
//               className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             >
//               <PlusIcon className="h-4 w-4 mr-2" />
//               Add Leave Type
//             </button>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {leaveTypes.map((leaveType) => (
//               <LeaveTypeCard key={leaveType.id} leaveType={leaveType} />
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Leave Type Modal */}
//       <Modal
//         isOpen={showTypeModal}
//         onClose={() => {
//           setShowTypeModal(false);
//           setEditingType(null);
//           reset();
//         }}
//         title={editingType ? 'Edit Leave Type' : 'Add Leave Type'}
//         size="large"
//       >
//         <form onSubmit={handleSubmit(onSubmitType)} className="space-y-6">
//           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
//             <div className="sm:col-span-2">
//               <label className="block text-sm font-medium text-gray-700">
//                 Leave Type Name *
//               </label>
//               <input
//                 {...register('name', { required: 'Leave type name is required' })}
//                 type="text"
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                 placeholder="e.g., Annual Leave, Sick Leave"
//               />
//               {errors.name && (
//                 <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Leave Code *
//               </label>
//               <input
//                 {...register('code', { required: 'Leave code is required' })}
//                 type="text"
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                 placeholder="e.g., AL, SL, ML"
//                 maxLength={10}
//               />
//               {errors.code && (
//                 <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Days Allowed Per Year *
//               </label>
//               <input
//                 {...register('days_allowed_per_year', { 
//                   required: 'Days allowed is required',
//                   min: { value: 0, message: 'Days must be 0 or greater' }
//                 })}
//                 type="number"
//                 min="0"
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//               />
//               {errors.days_allowed_per_year && (
//                 <p className="mt-1 text-sm text-red-600">{errors.days_allowed_per_year.message}</p>
//               )}
//             </div>

//             <div className="sm:col-span-2">
//               <label className="block text-sm font-medium text-gray-700">
//                 Description
//               </label>
//               <textarea
//                 {...register('description')}
//                 rows={3}
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                 placeholder="Brief description of this leave type..."
//               />
//             </div>

//             <div>
//               <div className="flex items-center">
//                 <input
//                   {...register('is_carry_forward')}
//                   type="checkbox"
//                   className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                 />
//                 <label className="ml-2 block text-sm text-gray-900">
//                   Allow carry forward to next year
//                 </label>
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Max Carry Forward Days
//               </label>
//               <input
//                 {...register('max_carry_forward_days')}
//                 type="number"
//                 min="0"
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                 placeholder="0"
//               />
//             </div>

//             <div className="sm:col-span-2">
//               <div className="flex items-center">
//                 <input
//                   {...register('is_active')}
//                   type="checkbox"
//                   defaultChecked={true}
//                   className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                 />
//                 <label className="ml-2 block text-sm text-gray-900">
//                   Active (employees can apply for this leave type)
//                 </label>
//               </div>
//             </div>
//           </div>

//           <div className="flex justify-end space-x-3 pt-6">
//             <button
//               type="button"
//               onClick={() => {
//                 setShowTypeModal(false);
//                 setEditingType(null);
//                 reset();
//               }}
//               className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={submitting}
//               className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
//             >
//               {submitting ? 'Saving...' : (editingType ? 'Update' : 'Create')}
//             </button>
//           </div>
//         </form>
//       </Modal>

//       {/* Initialize Balances Modal */}
//       <Modal
//         isOpen={showBalanceModal}
//         onClose={() => {
//           setShowBalanceModal(false);
//           resetBalance();
//         }}
//         title="Initialize Employee Leave Balances"
//         size="medium"
//       >
//         <div className="space-y-6">
//           <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
//             <div className="flex">
//               <div className="flex-shrink-0">
//                 <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
//               </div>
//               <div className="ml-3">
//                 <p className="text-sm text-yellow-700">
//                   <strong>Important:</strong> This will create leave balance records for all active employees
//                   for the specified year. Existing balances for the same year will not be overwritten.
//                 </p>
//               </div>
//             </div>
//           </div>

//           <form onSubmit={handleSubmitBalance(onSubmitBalanceInit)} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Year *
//               </label>
//               <select
//                 {...registerBalance('year', { required: 'Year is required' })}
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//               >
//                 <option value="">Select Year</option>
//                 {[2023, 2024, 2025, 2026].map(year => (
//                   <option key={year} value={year}>{year}</option>
//                 ))}
//               </select>
//               {balanceErrors.year && (
//                 <p className="mt-1 text-sm text-red-600">{balanceErrors.year.message}</p>
//               )}
//             </div>

//             <div className="bg-gray-50 p-4 rounded-md">
//               <h4 className="text-sm font-medium text-gray-900 mb-2">Summary</h4>
//               <div className="text-sm text-gray-600 space-y-1">
//                 <p>• <strong>{employees.length}</strong> active employees will receive leave balances</p>
//                 <p>• <strong>{leaveTypes.filter(t => t.is_active).length}</strong> active leave types will be assigned</p>
//                 <p>• Total balance records to create: <strong>{employees.length * leaveTypes.filter(t => t.is_active).length}</strong></p>
//               </div>
//             </div>

//             <div className="flex justify-end space-x-3 pt-4">
//               <button
//                 type="button"
//                 onClick={() => {
//                   setShowBalanceModal(false);
//                   resetBalance();
//                 }}
//                 className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 disabled={submitting}
//                 className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
//               >
//                 {submitting ? 'Initializing...' : 'Initialize Balances'}
//               </button>
//             </div>
//           </form>
//         </div>
//       </Modal>
//     </div>
//   );
// };

// export default LeaveTypesManagement;


import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CogIcon,
  CalendarDaysIcon,
  UsersIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { leaveAPI, employeeAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { useForm } from 'react-hook-form';

const LeaveTypesManagement = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerBalance, handleSubmit: handleSubmitBalance, reset: resetBalance, formState: { errors: balanceErrors } } = useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [typesResponse, employeesResponse] = await Promise.all([
        leaveAPI.getLeaveTypes(),
        employeeAPI.getEmployees()
      ]);
      
      setLeaveTypes(typesResponse.data.results || typesResponse.data);
      setEmployees(employeesResponse.data.results || employeesResponse.data);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitType = async (data) => {
    setSubmitting(true);
    try {
      if (editingType) {
        await leaveAPI.updateLeaveType(editingType.id, data);
        toast.success('Leave type updated successfully!');
      } else {
        await leaveAPI.createLeaveType(data);
        toast.success('Leave type created successfully!');
      }
      
      fetchData();
      setShowTypeModal(false);
      setEditingType(null);
      reset();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to save leave type';
      toast.error(errorMessage);
      console.error('Error saving leave type:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitBalanceInit = async (data) => {
    setSubmitting(true);
    try {
      await leaveAPI.initializeYearlyBalances(data);
      toast.success(`Leave balances initialized for ${data.year}!`);
      setShowBalanceModal(false);
      resetBalance();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to initialize balances';
      toast.error(errorMessage);
      console.error('Error initializing balances:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditType = (leaveType) => {
    setEditingType(leaveType);
    reset(leaveType);
    setShowTypeModal(true);
  };

  const handleDeleteType = async (typeId) => {
    if (window.confirm('Are you sure you want to delete this leave type? This action cannot be undone.')) {
      try {
        await leaveAPI.deleteLeaveType(typeId);
        toast.success('Leave type deleted successfully!');
        fetchData();
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to delete leave type';
        toast.error(errorMessage);
        console.error('Error deleting leave type:', error);
      }
    }
  };

  const LeaveTypeCard = ({ leaveType }) => (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <h3 className="text-2xl font-bold text-gray-900">{leaveType.name}</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
              {leaveType.code}
            </span>
            {!leaveType.is_active && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-red-100 to-pink-100 text-red-800">
                Inactive
              </span>
            )}
          </div>
          
          <p className="text-gray-600 mb-6 leading-relaxed">{leaveType.description}</p>
          
          <div className="grid grid-cols-2 gap-6 text-sm mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200">
              <span className="font-bold text-blue-700">Days per year:</span>
              <span className="ml-2 text-blue-900 text-lg font-black">{leaveType.days_allowed_per_year}</span>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200">
              <span className="font-bold text-green-700">Carry forward:</span>
              <span className="ml-2 text-green-900 font-bold">
                {leaveType.is_carry_forward ? `Yes (${leaveType.max_carry_forward_days} max)` : 'No'}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span className="font-semibold">Created: {formatDate(leaveType.created_at)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 ml-6">
          <button
            onClick={() => handleEditType(leaveType)}
            className="inline-flex items-center p-3 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-700 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDeleteType(leaveType.id)}
            className="inline-flex items-center p-3 bg-gradient-to-r from-red-100 to-pink-100 hover:from-red-200 hover:to-pink-200 text-red-700 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md"
            title="Delete"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSpinner text="Loading leave management..." />;
  }

  return (
    <div className="space-y-10">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-bold text-gray-900">Leave Types & Balance Management</h3>
          <p className="mt-2 text-gray-600 text-lg">
            Manage leave types and initialize employee leave balances
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowBalanceModal(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105"
          >
            <UsersIcon className="h-5 w-5 mr-2" />
            Initialize Balances
          </button>
          <button
            onClick={() => {
              setEditingType(null);
              reset();
              setShowTypeModal(true);
            }}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Leave Type
          </button>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-3xl shadow-lg border border-blue-200 hover:shadow-xl transition-all">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <CalendarDaysIcon className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="ml-6">
              <p className="text-sm font-bold text-blue-700 uppercase tracking-wider">Total Leave Types</p>
              <p className="text-4xl font-black text-gray-900">{leaveTypes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-3xl shadow-lg border border-green-200 hover:shadow-xl transition-all">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <UsersIcon className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="ml-6">
              <p className="text-sm font-bold text-green-700 uppercase tracking-wider">Total Employees</p>
              <p className="text-4xl font-black text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-8 rounded-3xl shadow-lg border border-purple-200 hover:shadow-xl transition-all">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                <ChartBarIcon className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="ml-6">
              <p className="text-sm font-bold text-purple-700 uppercase tracking-wider">Active Leave Types</p>
              <p className="text-4xl font-black text-gray-900">
                {leaveTypes.filter(type => type.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Leave Types Grid */}
      <div>
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
            <SparklesIcon className="h-8 w-8 text-white" />
          </div>
          <h4 className="text-2xl font-bold text-gray-900">Leave Types</h4>
        </div>
        
        {leaveTypes.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl shadow-lg border border-blue-200">
            <div className="p-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
              <CalendarDaysIcon className="h-16 w-16 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No leave types found</h3>
            <p className="text-gray-600 mb-8 text-lg">
              Get started by creating your first leave type.
            </p>
            <button
              onClick={() => {
                setEditingType(null);
                reset();
                setShowTypeModal(true);
              }}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105"
            >
              <PlusIcon className="h-6 w-6 mr-3" />
              Add Leave Type
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {leaveTypes.map((leaveType) => (
              <LeaveTypeCard key={leaveType.id} leaveType={leaveType} />
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Leave Type Modal */}
      <Modal
        isOpen={showTypeModal}
        onClose={() => {
          setShowTypeModal(false);
          setEditingType(null);
          reset();
        }}
        title={editingType ? 'Edit Leave Type' : 'Add Leave Type'}
        size="large"
      >
        <form onSubmit={handleSubmit(onSubmitType)} className="space-y-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Leave Type Name *
              </label>
              <input
                {...register('name', { required: 'Leave type name is required' })}
                type="text"
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium text-lg"
                placeholder="e.g., Annual Leave, Sick Leave"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Leave Code *
              </label>
              <input
                {...register('code', { required: 'Leave code is required' })}
                type="text"
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium text-lg"
                placeholder="e.g., AL, SL, ML"
                maxLength={10}
              />
              {errors.code && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Days Allowed Per Year *
              </label>
              <input
                {...register('days_allowed_per_year', { 
                  required: 'Days allowed is required',
                  min: { value: 0, message: 'Days must be 0 or greater' }
                })}
                type="number"
                min="0"
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium text-lg"
              />
              {errors.days_allowed_per_year && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{errors.days_allowed_per_year.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
                placeholder="Brief description of this leave type..."
              />
            </div>

            <div className="sm:col-span-2">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
                <div className="flex items-center mb-4">
                  <input
                    {...register('is_carry_forward')}
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-3 block text-lg font-bold text-gray-900">
                    Allow carry forward to next year
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Max Carry Forward Days
              </label>
              <input
                {...register('max_carry_forward_days')}
                type="number"
                min="0"
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium text-lg"
                placeholder="0"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                <div className="flex items-center">
                  <input
                    {...register('is_active')}
                    type="checkbox"
                    defaultChecked={true}
                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-3 block text-lg font-bold text-gray-900">
                    Active (employees can apply for this leave type)
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-8 border-t">
            <button
              type="button"
              onClick={() => {
                setShowTypeModal(false);
                setEditingType(null);
                reset();
              }}
              className="px-8 py-3 border border-gray-300 rounded-2xl shadow-sm bg-white font-bold text-gray-700 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {submitting ? 'Saving...' : (editingType ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enhanced Initialize Balances Modal */}
      <Modal
        isOpen={showBalanceModal}
        onClose={() => {
          setShowBalanceModal(false);
          resetBalance();
        }}
        title="Initialize Employee Leave Balances"
        size="medium"
      >
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl">
                  <ExclamationTriangleIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-yellow-800 mb-2">Important Notice</h4>
                <p className="text-yellow-700 leading-relaxed">
                  This will create leave balance records for all active employees for the specified year. 
                  Existing balances for the same year will not be overwritten.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitBalance(onSubmitBalanceInit)} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Year *
              </label>
              <select
                {...registerBalance('year', { required: 'Year is required' })}
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium text-lg"
              >
                <option value="">Select Year</option>
                {[2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {balanceErrors.year && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{balanceErrors.year.message}</p>
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <RocketLaunchIcon className="h-6 w-6 text-blue-600" />
                <h4 className="text-lg font-bold text-blue-900">Initialization Summary</h4>
              </div>
              <div className="space-y-3 text-blue-800">
                <div className="flex items-center justify-between bg-white/60 p-3 rounded-xl">
                  <span className="font-semibold">Active employees to receive balances:</span>
                  <span className="font-black text-xl">{employees.length}</span>
                </div>
                <div className="flex items-center justify-between bg-white/60 p-3 rounded-xl">
                  <span className="font-semibold">Active leave types to assign:</span>
                  <span className="font-black text-xl">{leaveTypes.filter(t => t.is_active).length}</span>
                </div>
                <div className="flex items-center justify-between bg-white/60 p-3 rounded-xl">
                  <span className="font-semibold">Total balance records to create:</span>
                  <span className="font-black text-xl">{employees.length * leaveTypes.filter(t => t.is_active).length}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-8 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowBalanceModal(false);
                  resetBalance();
                }}
                className="px-8 py-3 border border-gray-300 rounded-2xl shadow-sm bg-white font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {submitting ? 'Initializing...' : 'Initialize Balances'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default LeaveTypesManagement;