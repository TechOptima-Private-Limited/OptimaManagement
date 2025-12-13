// import React, { useState, useEffect } from 'react';
// import { useForm } from 'react-hook-form';
// import { toast } from 'react-toastify';
// import { 
//   PlusIcon, 
//   DocumentArrowUpIcon,
//   EyeIcon,
//   CalendarDaysIcon,
//   XMarkIcon,
//   ExclamationTriangleIcon,
//   TrashIcon
// } from '@heroicons/react/24/outline';
// import { leaveAPI } from '../../services/api';
// import { isHRManager } from '../../utils/auth';
// import { formatDate } from '../../utils/formatters';
// import StatusBadge from '../common/StatusBadge';
// import LoadingSpinner from '../common/LoadingSpinner';
// import Modal from '../common/Modal';

// const LeaveRequest = () => {
//   const [leaveRequests, setLeaveRequests] = useState([]);
//   const [leaveTypes, setLeaveTypes] = useState([]);
//   const [leaveBalances, setLeaveBalances] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [filters, setFilters] = useState({
//     status: '',
//     leave_type: '',
//     start_date: '',
//     end_date: ''
//   });

//   const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();

//   const startDate = watch('start_date');
//   const endDate = watch('end_date');
//   const leaveDuration = watch('leave_duration', 'FULL_DAY');
//   const selectedLeaveType = watch('leave_type');

//   useEffect(() => {
//     fetchLeaveRequests();
//     fetchLeaveTypes();
//     if (!isHRManager()) {
//       fetchLeaveBalances();
//     }
//   }, []);

//   const fetchLeaveBalances = async () => {
//     try {
//       // First try to initialize all missing balances, then get the updated list
//       const response = await leaveAPI.initializeMyBalances({ year: new Date().getFullYear() });
//       setLeaveBalances(response.data.balances);
//     } catch (error) {
//       console.error('Error initializing balances, trying regular fetch:', error);
//       // Fallback to regular fetch if initialization fails
//       try {
//         const response = await leaveAPI.getLeaveBalances({ year: new Date().getFullYear() });
//         setLeaveBalances(response.data.results || response.data);
//       } catch (fetchError) {
//         console.error('Error fetching leave balances:', fetchError);
//       }
//     }
//   };

//   useEffect(() => {
//     fetchLeaveRequests();
//   }, [filters]);

//   useEffect(() => {
//     if (startDate && endDate && leaveDuration) {
//       calculateDays();
//     }
//   }, [startDate, endDate, leaveDuration]);

//   const fetchLeaveRequests = async () => {
//     try {
//       setLoading(true);
//       const params = {};
//       if (filters.status) params.status = filters.status;
//       if (filters.leave_type) params.leave_type = filters.leave_type;
//       if (filters.start_date) params.start_date = filters.start_date;
//       if (filters.end_date) params.end_date = filters.end_date;

//       const response = await leaveAPI.getLeaveRequests(params);
//       setLeaveRequests(response.data.results || response.data);
//     } catch (error) {
//       toast.error('Failed to fetch leave requests');
//       console.error('Error fetching leave requests:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchLeaveTypes = async () => {
//     try {
//       const response = await leaveAPI.getLeaveTypes();
//       setLeaveTypes(response.data.results || response.data);
//     } catch (error) {
//       toast.error('Failed to fetch leave types');
//       console.error('Error fetching leave types:', error);
//     }
//   };

//   // const fetchLeaveBalances = async () => {
//   //   try {
//   //     const response = await leaveAPI.getLeaveBalances({ year: new Date().getFullYear() });
//   //     setLeaveBalances(response.data.results || response.data);
//   //   } catch (error) {
//   //     console.error('Error fetching leave balances:', error);
//   //   }
//   // };

//   const calculateDays = () => {
//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       const end = new Date(endDate);
//       const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
//       let days = totalDays;
//       if (leaveDuration === 'HALF_DAY_MORNING' || leaveDuration === 'HALF_DAY_AFTERNOON') {
//         days = startDate === endDate ? 0.5 : totalDays - 0.5;
//       }
      
//       setValue('days_requested', days > 0 ? days : 0);
//     }
//   };

//   const getAvailableBalance = (leaveTypeId) => {
//     const balance = leaveBalances.find(b => b.leave_type.id === parseInt(leaveTypeId));
//     return balance ? parseFloat(balance.remaining_days) : 0;
//   };

//   const validateLeaveBalance = (leaveTypeId, daysRequested) => {
//     const availableBalance = getAvailableBalance(leaveTypeId);
//     return availableBalance >= daysRequested;
//   };

//   const onSubmit = async (data) => {
//     // Check leave balance before submission
//     const daysRequested = parseFloat(data.days_requested);
//     const leaveTypeId = data.leave_type;
    
//     if (!isHRManager() && !validateLeaveBalance(leaveTypeId, daysRequested)) {
//       const availableBalance = getAvailableBalance(leaveTypeId);
//       toast.error(`Insufficient leave balance. Available: ${availableBalance} days, Requested: ${daysRequested} days`);
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const formData = new FormData();
      
//       // Add all form fields except the file
//       Object.keys(data).forEach(key => {
//         if (key !== 'supporting_document' && data[key] !== null && data[key] !== undefined && data[key] !== '') {
//           formData.append(key, data[key]);
//         }
//       });

//       // Handle file upload - only add if file is selected
//       if (data.supporting_document && data.supporting_document.length > 0 && data.supporting_document[0]) {
//         formData.append('supporting_document', data.supporting_document[0]);
//       }

//       await leaveAPI.createLeaveRequest(formData);
//       toast.success('Leave request submitted successfully!');
//       reset();
//       setShowRequestModal(false);
//       fetchLeaveRequests();
      
//       // Refresh balances for non-HR users
//       if (!isHRManager()) {
//         fetchLeaveBalances();
//       }
//     } catch (error) {
//       // Handle validation errors from backend
//       if (error.response?.data) {
//         const errorData = error.response.data;
//         if (typeof errorData === 'string') {
//           toast.error(errorData);
//         } else if (errorData.error) {
//           toast.error(errorData.error);
//         } else if (errorData.non_field_errors) {
//           toast.error(errorData.non_field_errors[0]);
//         } else {
//           // Display field-specific errors
//           Object.keys(errorData).forEach(field => {
//             if (Array.isArray(errorData[field])) {
//               toast.error(`${field}: ${errorData[field][0]}`);
//             }
//           });
//         }
//       } else {
//         toast.error('Failed to submit leave request');
//       }
//       console.error('Error submitting leave request:', error);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleCancel = async (requestId) => {
//     if (window.confirm('Are you sure you want to cancel this leave request?')) {
//       try {
//         await leaveAPI.cancelLeaveRequest(requestId);
//         toast.success('Leave request cancelled successfully!');
//         fetchLeaveRequests();
        
//         // Refresh balances after cancellation
//         if (!isHRManager()) {
//           fetchLeaveBalances();
//         }
//       } catch (error) {
//         const errorMessage = error.response?.data?.error || 'Failed to cancel leave request';
//         toast.error(errorMessage);
//         console.error('Error cancelling leave request:', error);
//       }
//     }
//   };

//   const handleDelete = async (requestId, status) => {
//     const confirmMessage = status === 'APPROVED' 
//       ? 'Are you sure you want to delete this approved leave request? This will restore the leave balance.'
//       : 'Are you sure you want to delete this leave request?';
      
//     if (window.confirm(confirmMessage)) {
//       try {
//         await leaveAPI.deleteLeaveRequest(requestId);
//         toast.success('Leave request deleted successfully!');
//         fetchLeaveRequests();
        
//         // Refresh balances if it was an approved request
//         if (status === 'APPROVED' && !isHRManager()) {
//           fetchLeaveBalances();
//         }
//       } catch (error) {
//         const errorMessage = error.response?.data?.error || 'Failed to delete leave request';
//         toast.error(errorMessage);
//         console.error('Error deleting leave request:', error);
//       }
//     }
//   };

//   const showRequestDetails = (request) => {
//     setSelectedRequest(request);
//     setShowDetailsModal(true);
//   };

//   const handleFilterChange = (key, value) => {
//     setFilters(prev => ({ ...prev, [key]: value }));
//   };

//   const clearFilters = () => {
//     setFilters({ status: '', leave_type: '', start_date: '', end_date: '' });
//   };

//   const getBalanceWarning = () => {
//     const daysRequested = watch('days_requested');
//     const leaveTypeId = selectedLeaveType;
    
//     if (!leaveTypeId || !daysRequested || isHRManager()) {
//       return null;
//     }

//     const availableBalance = getAvailableBalance(leaveTypeId);
//     const isValid = validateLeaveBalance(leaveTypeId, daysRequested);
    
//     if (!isValid) {
//       return (
//         <div className="bg-red-50 border border-red-200 rounded-md p-3">
//           <div className="flex">
//             <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
//             <div className="ml-3">
//               <p className="text-sm text-red-800">
//                 <strong>Insufficient Balance:</strong> You have {availableBalance} days available, but requesting {daysRequested} days.
//               </p>
//             </div>
//           </div>
//         </div>
//       );
//     } else if (availableBalance - daysRequested <= 2) {
//       return (
//         <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
//           <div className="flex">
//             <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
//             <div className="ml-3">
//               <p className="text-sm text-yellow-800">
//                 <strong>Low Balance Warning:</strong> After this request, you'll have {availableBalance - daysRequested} days remaining.
//               </p>
//             </div>
//           </div>
//         </div>
//       );
//     }
    
//     return null;
//   };

//   if (loading) {
//     return <LoadingSpinner text="Loading leave requests..." />;
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header with action button */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h3 className="text-lg font-medium text-gray-900">Leave Requests</h3>
//           <p className="mt-1 text-sm text-gray-500">
//             {isHRManager() ? 'Manage all leave requests' : 'View and manage your leave requests'}
//           </p>
//         </div>
//         {!isHRManager() && (
//           <button
//             onClick={() => setShowRequestModal(true)}
//             className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//           >
//             <PlusIcon className="h-4 w-4 mr-2" />
//             Request Leave
//           </button>
//         )}
//       </div>

//       {/* Quick Balance Overview for Employees */}
//       {!isHRManager() && leaveBalances.length > 0 && (
//         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//           <h4 className="text-sm font-medium text-blue-900 mb-2">Your Leave Balance</h4>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//             {leaveBalances.map((balance) => (
//               <div key={balance.id} className="bg-white p-3 rounded-md border">
//                 <p className="text-xs font-medium text-gray-500">{balance.leave_type.name}</p>
//                 <p className="text-lg font-semibold text-gray-900">{balance.remaining_days}</p>
//                 <p className="text-xs text-gray-500">of {balance.total_days} days</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Filters */}
//       <div className="bg-gray-50 p-4 rounded-lg">
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//             <select
//               value={filters.status}
//               onChange={(e) => handleFilterChange('status', e.target.value)}
//               className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//             >
//               <option value="">All Status</option>
//               <option value="PENDING">Pending</option>
//               <option value="APPROVED">Approved</option>
//               <option value="REJECTED">Rejected</option>
//               <option value="CANCELLED">Cancelled</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
//             <select
//               value={filters.leave_type}
//               onChange={(e) => handleFilterChange('leave_type', e.target.value)}
//               className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//             >
//               <option value="">All Types</option>
//               {leaveTypes.map((type) => (
//                 <option key={type.id} value={type.id}>{type.name}</option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
//             <input
//               type="date"
//               value={filters.start_date}
//               onChange={(e) => handleFilterChange('start_date', e.target.value)}
//               className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
//             <input
//               type="date"
//               value={filters.end_date}
//               onChange={(e) => handleFilterChange('end_date', e.target.value)}
//               className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//             />
//           </div>

//           <div className="flex items-end">
//             <button
//               onClick={clearFilters}
//               className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             >
//               Clear Filters
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Requests Table */}
//       <div className="bg-white shadow overflow-hidden sm:rounded-md">
//         <ul className="divide-y divide-gray-200">
//           {leaveRequests.length === 0 ? (
//             <li className="p-6 text-center text-gray-500">
//               <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
//               <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests</h3>
//               <p className="mt-1 text-sm text-gray-500">
//                 {!isHRManager() ? 'Get started by creating a new leave request.' : 'No leave requests found matching your criteria.'}
//               </p>
//             </li>
//           ) : (
//             leaveRequests.map((request) => (
//               <li key={request.id}>
//                 <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
//                   <div className="flex items-center space-x-4">
//                     <div className="flex-shrink-0">
//                       {isHRManager() && (
//                         <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
//                           <span className="text-white font-medium text-sm">
//                             {request.employee?.user_info?.first_name?.[0]}{request.employee?.user_info?.last_name?.[0]}
//                           </span>
//                         </div>
//                       )}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center space-x-2">
//                         <p className="text-sm font-medium text-gray-900 truncate">
//                           {request.leave_type?.name}
//                         </p>
//                         <StatusBadge status={request.status} />
//                         {request.leave_duration !== 'FULL_DAY' && (
//                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
//                             {request.leave_duration.replace('_', ' ')}
//                           </span>
//                         )}
//                       </div>
//                       <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
//                         {isHRManager() && (
//                           <span>{request.employee?.user_info?.first_name} {request.employee?.user_info?.last_name}</span>
//                         )}
//                         <span>{formatDate(request.start_date)} - {formatDate(request.end_date)}</span>
//                         <span>{request.days_requested} day{request.days_requested !== 1 ? 's' : ''}</span>
//                         <span>Applied {formatDate(request.applied_on)}</span>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <button
//                       onClick={() => showRequestDetails(request)}
//                       className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                       title="View Details"
//                     >
//                       <EyeIcon className="h-4 w-4" />
//                     </button>
                    
//                     {/* Cancel button for PENDING and APPROVED requests (Employee only) */}
//                     {!isHRManager() && ['PENDING', 'APPROVED'].includes(request.status) && (
//                       <button
//                         onClick={() => handleCancel(request.id)}
//                         className="inline-flex items-center p-2 border border-yellow-300 rounded-md shadow-sm bg-white text-sm font-medium text-yellow-700 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
//                         title="Cancel Request"
//                       >
//                         <XMarkIcon className="h-4 w-4" />
//                       </button>
//                     )}
                    
//                     {/* Delete button - Different permissions for different statuses */}
//                     {(
//                       // HR can delete any request
//                       isHRManager() ||
//                       // Employee can delete their own REJECTED requests
//                       (!isHRManager() && request.status === 'REJECTED') ||
//                       // Employee can delete their own CANCELLED requests  
//                       (!isHRManager() && request.status === 'CANCELLED') ||
//                       // Employee can delete their own APPROVED requests (with balance restore)
//                       (!isHRManager() && request.status === 'APPROVED')
//                     ) && (
//                       <button
//                         onClick={() => handleDelete(request.id, request.status)}
//                         className="inline-flex items-center p-2 border border-red-300 rounded-md shadow-sm bg-white text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
//                         title="Delete Request"
//                       >
//                         <TrashIcon className="h-4 w-4" />
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </li>
//             ))
//           )}
//         </ul>
//       </div>

//       {/* Request Leave Modal */}
//       <Modal
//         isOpen={showRequestModal}
//         onClose={() => setShowRequestModal(false)}
//         title="Request Leave"
//         size="large"
//       >
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
//             <div className="sm:col-span-2">
//               <label className="block text-sm font-medium text-gray-700">
//                 Leave Type *
//               </label>
//               <select
//                 {...register('leave_type', { required: 'Leave type is required' })}
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//               >
//                 <option value="">Select Leave Type</option>
//                 {leaveTypes.map((type) => {
//                   const balance = leaveBalances.find(b => b.leave_type.id === type.id);
//                   const availableDays = balance ? balance.remaining_days : type.days_allowed_per_year;
                  
//                   return (
//                     <option key={type.id} value={type.id}>
//                       {type.name} ({availableDays} days available)
//                     </option>
//                   );
//                 })}
//               </select>
//               {errors.leave_type && (
//                 <p className="mt-1 text-sm text-red-600">{errors.leave_type.message}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Leave Duration
//               </label>
//               <select
//                 {...register('leave_duration')}
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//               >
//                 <option value="FULL_DAY">Full Day</option>
//                 <option value="HALF_DAY_MORNING">Half Day - Morning</option>
//                 <option value="HALF_DAY_AFTERNOON">Half Day - Afternoon</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Days Requested
//               </label>
//               <input
//                 {...register('days_requested')}
//                 type="number"
//                 step="0.5"
//                 readOnly
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Start Date *
//               </label>
//               <input
//                 {...register('start_date', { required: 'Start date is required' })}
//                 type="date"
//                 min={new Date().toISOString().split('T')[0]}
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//               />
//               {errors.start_date && (
//                 <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 End Date *
//               </label>
//               <input
//                 {...register('end_date', { required: 'End date is required' })}
//                 type="date"
//                 min={startDate || new Date().toISOString().split('T')[0]}
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//               />
//               {errors.end_date && (
//                 <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
//               )}
//             </div>

//             {/* Balance Warning */}
//             <div className="sm:col-span-2">
//               {getBalanceWarning()}
//             </div>

//             <div className="sm:col-span-2">
//               <label className="block text-sm font-medium text-gray-700">
//                 Supporting Document <span className="text-gray-400">(Optional)</span>
//               </label>
//               <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
//                 <div className="space-y-1 text-center">
//                   <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
//                   <div className="flex text-sm text-gray-600">
//                     <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
//                       <span>Upload a file</span>
//                       <input
//                         {...register('supporting_document')}
//                         type="file"
//                         accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
//                         className="sr-only"
//                       />
//                     </label>
//                     <p className="pl-1">or drag and drop</p>
//                   </div>
//                   <p className="text-xs text-gray-500">
//                     PNG, JPG, PDF up to 10MB (Optional)
//                   </p>
//                   <p className="text-xs text-gray-400">
//                     Medical certificate required for sick leave greater than 3 days
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="sm:col-span-2">
//               <label className="block text-sm font-medium text-gray-700">
//                 Reason *
//               </label>
//               <textarea
//                 {...register('reason', { required: 'Reason is required' })}
//                 rows={3}
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                 placeholder="Please provide a detailed reason for your leave request..."
//               />
//               {errors.reason && (
//                 <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
//               )}
//             </div>

//             <div className="sm:col-span-2">
//               <label className="block text-sm font-medium text-gray-700">
//                 Additional Comments
//               </label>
//               <textarea
//                 {...register('employee_comments')}
//                 rows={2}
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                 placeholder="Any additional comments or special requests..."
//               />
//             </div>
//           </div>

//           <div className="flex justify-end space-x-3 pt-6">
//             <button
//               type="button"
//               onClick={() => setShowRequestModal(false)}
//               className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={submitting || (!isHRManager() && selectedLeaveType && !validateLeaveBalance(selectedLeaveType, watch('days_requested')))}
//               className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
//             >
//               {submitting ? 'Submitting...' : 'Submit Request'}
//             </button>
//           </div>
//         </form>
//       </Modal>

//       {/* Request Details Modal */}
//       <Modal
//         isOpen={showDetailsModal}
//         onClose={() => setShowDetailsModal(false)}
//         title="Leave Request Details"
//         size="large"
//       >
//         {selectedRequest && (
//           <div className="space-y-6">
//             {/* Employee Info */}
//             {isHRManager() && (
//               <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
//                 <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
//                   <span className="text-white font-medium">
//                     {selectedRequest.employee?.user?.first_name?.[0]}{selectedRequest.employee?.user?.last_name?.[0]}
//                   </span>
//                 </div>
//                 <div>
//                   <h4 className="text-lg font-medium text-gray-900">
//                     {selectedRequest.employee?.user?.first_name} {selectedRequest.employee?.user?.last_name}
//                   </h4>
//                   <p className="text-sm text-gray-500">{selectedRequest.employee?.employee_id}</p>
//                 </div>
//               </div>
//             )}

//             {/* Leave Details */}
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Leave Type</label>
//                 <p className="mt-1 text-sm text-gray-900">{selectedRequest.leave_type?.name}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Duration</label>
//                 <p className="mt-1 text-sm text-gray-900">
//                   {selectedRequest.leave_duration?.replace('_', ' ')}
//                 </p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Start Date</label>
//                 <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.start_date)}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">End Date</label>
//                 <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.end_date)}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Days Requested</label>
//                 <p className="mt-1 text-sm text-gray-900">{selectedRequest.days_requested} days</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Status</label>
//                 <div className="mt-1">
//                   <StatusBadge status={selectedRequest.status} />
//                 </div>
//               </div>
//             </div>

//             {/* Reason */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Reason</label>
//               <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
//                 {selectedRequest.reason}
//               </p>
//             </div>

//             {/* Employee Comments */}
//             {selectedRequest.employee_comments && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Employee Comments</label>
//                 <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
//                   {selectedRequest.employee_comments}
//                 </p>
//               </div>
//             )}

//             {/* Manager Comments */}
//             {selectedRequest.manager_comments && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Manager Comments</label>
//                 <p className="mt-1 text-sm text-gray-900 bg-blue-50 p-3 rounded-md">
//                   {selectedRequest.manager_comments}
//                 </p>
//               </div>
//             )}

//             {/* Approval Info */}
//             {selectedRequest.approved_by_name && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Approved By</label>
//                 <p className="mt-1 text-sm text-gray-900">{selectedRequest.approved_by_name}</p>
//                 {selectedRequest.approved_on && (
//                   <p className="text-xs text-gray-500">
//                     Approved on {formatDate(selectedRequest.approved_on)}
//                   </p>
//                 )}
//               </div>
//             )}

//             {/* Supporting Document */}
//             {selectedRequest.supporting_document && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Supporting Document</label>
//                 <div className="mt-1">
//                   <a
//                     href={selectedRequest.supporting_document}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                   >
//                     <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
//                     View Document
//                   </a>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default LeaveRequest;



import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { 
  PlusIcon, 
  DocumentArrowUpIcon,
  EyeIcon,
  CalendarDaysIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { leaveAPI } from '../../services/api';
import { isHRManager } from '../../utils/auth';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const LeaveRequest = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    leave_type: '',
    start_date: '',
    end_date: ''
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();

  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const leaveDuration = watch('leave_duration', 'FULL_DAY');
  const selectedLeaveType = watch('leave_type');

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveTypes();
    if (!isHRManager()) {
      fetchLeaveBalances();
    }
  }, []);

  const fetchLeaveBalances = async () => {
    try {
      const response = await leaveAPI.initializeMyBalances({ year: new Date().getFullYear() });
      setLeaveBalances(response.data.balances);
    } catch (error) {
      console.error('Error initializing balances, trying regular fetch:', error);
      try {
        const response = await leaveAPI.getLeaveBalances({ year: new Date().getFullYear() });
        setLeaveBalances(response.data.results || response.data);
      } catch (fetchError) {
        console.error('Error fetching leave balances:', fetchError);
      }
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, [filters]);

  useEffect(() => {
    if (startDate && endDate && leaveDuration) {
      calculateDays();
    }
  }, [startDate, endDate, leaveDuration]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.leave_type) params.leave_type = filters.leave_type;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await leaveAPI.getLeaveRequests(params);
      setLeaveRequests(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to fetch leave requests');
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await leaveAPI.getLeaveTypes();
      setLeaveTypes(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to fetch leave types');
      console.error('Error fetching leave types:', error);
    }
  };

  const calculateDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      let days = totalDays;
      if (leaveDuration === 'HALF_DAY_MORNING' || leaveDuration === 'HALF_DAY_AFTERNOON') {
        days = startDate === endDate ? 0.5 : totalDays - 0.5;
      }
      
      setValue('days_requested', days > 0 ? days : 0);
    }
  };

  const getAvailableBalance = (leaveTypeId) => {
    const id = parseInt(leaveTypeId);
    const balance = leaveBalances.find(b => b.leave_type.id === id);
    if (balance) return parseFloat(balance.remaining_days);
    // Fallback to allowed days from leave types if balance isn't initialized yet
    const type = leaveTypes.find(t => t.id === id);
    return type ? parseFloat(type.days_allowed_per_year) : 0;
  };

  const validateLeaveBalance = (leaveTypeId, daysRequested) => {
    const availableBalance = getAvailableBalance(leaveTypeId);
    return availableBalance >= daysRequested;
  };

  const onSubmit = async (data) => {
    const daysRequested = parseFloat(data.days_requested);
    const leaveTypeId = data.leave_type;
    
    if (!isHRManager() && !validateLeaveBalance(leaveTypeId, daysRequested)) {
      const availableBalance = getAvailableBalance(leaveTypeId);
      toast.error(`Insufficient leave balance. Available: ${availableBalance} days, Requested: ${daysRequested} days`);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      
      Object.keys(data).forEach(key => {
        if (key !== 'supporting_document' && data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key]);
        }
      });

      if (data.supporting_document && data.supporting_document.length > 0 && data.supporting_document[0]) {
        formData.append('supporting_document', data.supporting_document[0]);
      }

      await leaveAPI.createLeaveRequest(formData);
      toast.success('Leave request submitted successfully!');
      reset();
      setShowRequestModal(false);
      fetchLeaveRequests();
      
      if (!isHRManager()) {
        fetchLeaveBalances();
      }
    } catch (error) {
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          toast.error(errorData);
        } else if (errorData.error) {
          toast.error(errorData.error);
        } else if (errorData.non_field_errors) {
          toast.error(errorData.non_field_errors[0]);
        } else {
          Object.keys(errorData).forEach(field => {
            if (Array.isArray(errorData[field])) {
              toast.error(`${field}: ${errorData[field][0]}`);
            }
          });
        }
      } else {
        toast.error('Failed to submit leave request');
      }
      console.error('Error submitting leave request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (requestId) => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      try {
        await leaveAPI.cancelLeaveRequest(requestId);
        toast.success('Leave request cancelled successfully!');
        fetchLeaveRequests();
        
        if (!isHRManager()) {
          fetchLeaveBalances();
        }
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to cancel leave request';
        toast.error(errorMessage);
        console.error('Error cancelling leave request:', error);
      }
    }
  };

  const handleDelete = async (requestId, status) => {
    const confirmMessage = status === 'APPROVED' 
      ? 'Are you sure you want to delete this approved leave request? This will restore the leave balance.'
      : 'Are you sure you want to delete this leave request?';
      
    if (window.confirm(confirmMessage)) {
      try {
        await leaveAPI.deleteLeaveRequest(requestId);
        toast.success('Leave request deleted successfully!');
        fetchLeaveRequests();
        
        if (status === 'APPROVED' && !isHRManager()) {
          fetchLeaveBalances();
        }
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to delete leave request';
        toast.error(errorMessage);
        console.error('Error deleting leave request:', error);
      }
    }
  };

  const showRequestDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', leave_type: '', start_date: '', end_date: '' });
  };

  const getBalanceWarning = () => {
    const daysRequested = watch('days_requested');
    const leaveTypeId = selectedLeaveType;
    
    if (!leaveTypeId || !daysRequested || isHRManager()) {
      return null;
    }

    const availableBalance = getAvailableBalance(leaveTypeId);
    const isValid = validateLeaveBalance(leaveTypeId, daysRequested);
    
    if (!isValid) {
      return (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            <div className="ml-3">
              <p className="text-sm text-red-800 font-semibold">
                <strong>Insufficient Balance:</strong> You have {availableBalance} days available, but requesting {daysRequested} days.
              </p>
            </div>
          </div>
        </div>
      );
    } else if (availableBalance - daysRequested <= 2) {
      return (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm text-yellow-800 font-semibold">
                <strong>Low Balance Warning:</strong> After this request, you'll have {availableBalance - daysRequested} days remaining.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return <LoadingSpinner text="Loading leave requests..." />;
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Leave Requests</h3>
          <p className="mt-2 text-gray-600">
            {isHRManager() ? 'Manage all leave requests' : 'View and manage your leave requests'}
          </p>
        </div>
        {!isHRManager() && (
          <button
            onClick={() => setShowRequestModal(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Request Leave
          </button>
        )}
      </div>

      {/* Enhanced Balance Overview */}
      {!isHRManager() && leaveBalances.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-3xl p-8 shadow-lg">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
            <h4 className="text-xl font-bold text-blue-900 ml-4">Your Leave Balance</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {leaveBalances.map((balance) => (
              <div key={balance.id} className="bg-white p-6 rounded-2xl border border-blue-100 shadow-md hover:shadow-lg transition-shadow">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{balance.leave_type.name}</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{balance.remaining_days}</p>
                <p className="text-sm text-gray-500 mt-1">of {balance.total_days} days</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(balance.remaining_days / balance.total_days) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-3xl border border-gray-200 shadow-md">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Leave Type</label>
            <select
              value={filters.leave_type}
              onChange={(e) => handleFilterChange('leave_type', e.target.value)}
              className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
            >
              <option value="">All Types</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Requests List */}
      <div className="bg-white shadow-xl rounded-3xl border border-gray-100 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {leaveRequests.length === 0 ? (
            <li className="p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                  <CalendarDaysIcon className="h-16 w-16 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No leave requests</h3>
                <p className="text-gray-600 max-w-md">
                  {!isHRManager() ? 'Get started by creating a new leave request.' : 'No leave requests found matching your criteria.'}
                </p>
              </div>
            </li>
          ) : (
            leaveRequests.map((request) => (
              <li key={request.id}>
                <div className="px-8 py-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        {isHRManager() && (
                          <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {request.employee?.user_info?.first_name?.[0]}{request.employee?.user_info?.last_name?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <p className="text-lg font-bold text-gray-900 truncate">
                            {request.leave_type?.name}
                          </p>
                          <StatusBadge status={request.status} />
                          {request.leave_duration !== 'FULL_DAY' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                              {request.leave_duration.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                          {isHRManager() && (
                            <div className="flex items-center font-semibold">
                              <span>{request.employee?.user_info?.first_name} {request.employee?.user_info?.last_name}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <CalendarDaysIcon className="h-4 w-4 mr-2 text-blue-500" />
                            <span>{formatDate(request.start_date)} - {formatDate(request.end_date)}</span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2 text-green-500" />
                            <span>{request.days_requested} day{request.days_requested !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircleIcon className="h-4 w-4 mr-2 text-purple-500" />
                            <span>Applied {formatDate(request.applied_on)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-6">
                      <button
                        onClick={() => showRequestDetails(request)}
                        className="inline-flex items-center p-3 bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 text-blue-700 rounded-2xl font-medium transition-all transform hover:scale-105 shadow-md"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      
                      {!isHRManager() && ['PENDING', 'APPROVED'].includes(request.status) && (
                        <button
                          onClick={() => handleCancel(request.id)}
                          className="inline-flex items-center p-3 bg-gradient-to-r from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200 text-yellow-700 rounded-2xl font-medium transition-all transform hover:scale-105 shadow-md"
                          title="Cancel Request"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                      
                      {(
                        isHRManager() ||
                        (!isHRManager() && request.status === 'REJECTED') ||
                        (!isHRManager() && request.status === 'CANCELLED') ||
                        (!isHRManager() && request.status === 'APPROVED')
                      ) && (
                        <button
                          onClick={() => handleDelete(request.id, request.status)}
                          className="inline-flex items-center p-3 bg-gradient-to-r from-red-100 to-pink-100 hover:from-red-200 hover:to-pink-200 text-red-700 rounded-2xl font-medium transition-all transform hover:scale-105 shadow-md"
                          title="Delete Request"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Enhanced Request Leave Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request Leave"
        size="large"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Leave Type *
              </label>
              <select
                {...register('leave_type', { required: 'Leave type is required' })}
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
              >
                <option value="">Select Leave Type</option>
                {leaveTypes.map((type) => {
                  const balance = leaveBalances.find(b => b.leave_type.id === type.id);
                  const availableDays = balance ? balance.remaining_days : type.days_allowed_per_year;
                  
                  return (
                    <option key={type.id} value={type.id}>
                      {type.name} ({availableDays} days available)
                    </option>
                  );
                })}
              </select>
              {errors.leave_type && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{errors.leave_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Leave Duration
              </label>
              <select
                {...register('leave_duration')}
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="HALF_DAY_MORNING">Half Day - Morning</option>
                <option value="HALF_DAY_AFTERNOON">Half Day - Afternoon</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Days Requested
              </label>
              <input
                {...register('days_requested')}
                type="number"
                step="0.5"
                readOnly
                className="block w-full border-gray-300 rounded-xl shadow-sm bg-gray-50 focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                {...register('start_date', { required: 'Start date is required' })}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
              {errors.start_date && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                End Date *
              </label>
              <input
                {...register('end_date', { required: 'End date is required' })}
                type="date"
                min={startDate || new Date().toISOString().split('T')[0]}
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
              {errors.end_date && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{errors.end_date.message}</p>
              )}
            </div>

            {/* Enhanced Balance Warning */}
            <div className="sm:col-span-2">
              {getBalanceWarning()}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Supporting Document <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors">
                <DocumentArrowUpIcon className="mx-auto h-16 w-16 text-gray-400" />
                <div className="mt-4">
                  <label className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all">
                    <span>Upload a file</span>
                    <input
                      {...register('supporting_document')}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-2 text-sm text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  <p className="text-xs text-gray-400 mt-1">Medical certificate required for sick leave greater than 3 days</p>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Reason *
              </label>
              <textarea
                {...register('reason', { required: 'Reason is required' })}
                rows={4}
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
                placeholder="Please provide a detailed reason for your leave request..."
              />
              {errors.reason && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{errors.reason.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Additional Comments
              </label>
              <textarea
                {...register('employee_comments')}
                rows={3}
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
                placeholder="Any additional comments or special requests..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-8 border-t">
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              className="px-8 py-3 border border-gray-300 rounded-2xl shadow-sm bg-white text-gray-700 font-bold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (!isHRManager() && selectedLeaveType && !validateLeaveBalance(selectedLeaveType, watch('days_requested')))}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enhanced Request Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Leave Request Details"
        size="large"
      >
        {selectedRequest && (
          <div className="space-y-8">
            {/* Employee Info */}
            {isHRManager() && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">
                      {selectedRequest.employee?.user?.first_name?.[0]}{selectedRequest.employee?.user?.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {selectedRequest.employee?.user?.first_name} {selectedRequest.employee?.user?.last_name}
                    </h4>
                    <p className="text-gray-600">{selectedRequest.employee?.employee_id}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Leave Details */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-bold text-gray-700 mb-1">Leave Type</label>
                <p className="text-lg font-semibold text-gray-900">{selectedRequest.leave_type?.name}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-bold text-gray-700 mb-1">Duration</label>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedRequest.leave_duration?.replace('_', ' ')}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
                <p className="text-lg font-semibold text-gray-900">{formatDate(selectedRequest.start_date)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
                <p className="text-lg font-semibold text-gray-900">{formatDate(selectedRequest.end_date)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-bold text-gray-700 mb-1">Days Requested</label>
                <p className="text-lg font-semibold text-gray-900">{selectedRequest.days_requested} days</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                <div className="mt-1">
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Reason</label>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
                <p className="text-gray-900 leading-relaxed">
                  {selectedRequest.reason}
                </p>
              </div>
            </div>

            {/* Employee Comments */}
            {selectedRequest.employee_comments && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Employee Comments</label>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                  <p className="text-gray-900 leading-relaxed">
                    {selectedRequest.employee_comments}
                  </p>
                </div>
              </div>
            )}

            {/* Manager Comments */}
            {selectedRequest.manager_comments && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Manager Comments</label>
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-200">
                  <p className="text-gray-900 leading-relaxed">
                    {selectedRequest.manager_comments}
                  </p>
                </div>
              </div>
            )}

            {/* Approval Info */}
            {selectedRequest.approved_by_name && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">Approved By</label>
                <p className="text-lg font-semibold text-gray-900">{selectedRequest.approved_by_name}</p>
                {selectedRequest.approved_on && (
                  <p className="text-sm text-gray-600 mt-1">
                    Approved on {formatDate(selectedRequest.approved_on)}
                  </p>
                )}
              </div>
            )}

            {/* Supporting Document */}
            {selectedRequest.supporting_document && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Supporting Document</label>
                <div className="mt-2">
                  <a
                    href={selectedRequest.supporting_document}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105"
                  >
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    View Document
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeaveRequest;