// import React, { useState, useEffect } from 'react';
// import { useForm } from 'react-hook-form';
// import { toast } from 'react-toastify';
// import { 
//   HomeIcon,
//   CalendarDaysIcon,
//   ClockIcon,
//   UserIcon,
//   ChartBarIcon,
//   FunnelIcon,
//   DocumentChartBarIcon,
//   CheckCircleIcon,
//   ExclamationTriangleIcon,
//   XCircleIcon,
//   PlusIcon,
//   EyeIcon
// } from '@heroicons/react/24/outline';
// import { useAuth } from '../../context/AuthContext';
// import { isHRManager } from '../../utils/auth';
// import { workFromHomeAPI } from '../../services/api';
// import { formatDate } from '../../utils/formatters';
// import StatusBadge from '../common/StatusBadge';
// import LoadingSpinner from '../common/LoadingSpinner';
// import Table from '../common/Table';
// import Modal from '../common/Modal';

// const WorkFromHomeRequests = () => {
//   const { user } = useAuth();
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [showApprovalModal, setShowApprovalModal] = useState(false);
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [selectedApproval, setSelectedApproval] = useState(null);
//   const [processingRequest, setProcessingRequest] = useState(null);
//   const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
//   const [stats, setStats] = useState({
//     totalRequests: 0,
//     approvedRequests: 0,
//     rejectedRequests: 0,
//     pendingRequests: 0
//   });
//   const [filters, setFilters] = useState({
//     start_date: '',
//     end_date: '',
//     status: '',
//     employee_id: ''
//   });

//   const { register, handleSubmit, reset, formState: { errors } } = useForm({
//     defaultValues: {
//       request_date: new Date().toISOString().split('T')[0],
//       reason: ''
//     }
//   });

//   const { register: registerApproval, handleSubmit: handleApprovalSubmit, reset: resetApproval, formState: { errors: approvalErrors } } = useForm();

//   useEffect(() => {
//     fetchWFHRequests();
//   }, [filters]);

//   const fetchWFHRequests = async () => {
//     try {
//       setLoading(true);
//       const filterParam = filters.status === '' ? null : filters.status;
//       const response = await workFromHomeAPI.getWFHRequests(filterParam);

//       // Handle different response formats
//       let requestsData = [];
//       if (response.results) {
//         requestsData = response.results;
//       } else if (Array.isArray(response)) {
//         requestsData = response;
//       } else if (response.data && response.data.results) {
//         requestsData = response.data.results;
//       } else if (response.data && Array.isArray(response.data)) {
//         requestsData = response.data;
//       }

//       setRequests(Array.isArray(requestsData) ? requestsData : []);

//       // Set pending approvals count for HR
//       if (isHRManager() && response.data?.pending_approvals_count !== undefined) {
//         setPendingApprovalsCount(response.data.pending_approvals_count);
//       }

//       // Calculate stats
//       calculateStats(Array.isArray(requestsData) ? requestsData : []);
//     } catch (error) {
//       console.error('Failed to fetch WFH requests:', error);
//       toast.error('Failed to load work from home requests');
//       setRequests([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculateStats = (requestsData) => {
//     const stats = {
//       totalRequests: requestsData.length,
//       approvedRequests: requestsData.filter(r => r.status === 'APPROVED').length,
//       rejectedRequests: requestsData.filter(r => r.status === 'REJECTED').length,
//       pendingRequests: requestsData.filter(r => r.status === 'PENDING').length
//     };
//     setStats(stats);
//     setPendingApprovalsCount(stats.pendingRequests);
//   };

//   const onSubmit = async (data) => {
//     setSubmitting(true);
//     try {
//       await workFromHomeAPI.createWFHRequest(data);
//       toast.success('Work from home request submitted successfully!');
//       reset({
//         request_date: new Date().toISOString().split('T')[0],
//         reason: ''
//       });
//       setShowRequestModal(false);
//       fetchWFHRequests();
//     } catch (error) {
//       console.error('Failed to create request:', error);
//       toast.error('Failed to submit request');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleApprove = async (requestId) => {
//     try {
//       setProcessingRequest(requestId);
//       await workFromHomeAPI.approveWFHRequest(requestId, { action: 'approve' });
//       toast.success('Work from home request approved!');
//       fetchWFHRequests();
//     } catch (error) {
//       console.error('Failed to approve request:', error);
//       toast.error('Failed to approve request');
//     } finally {
//       setProcessingRequest(null);
//     }
//   };

//   const handleReject = async (requestId, rejectionReason = '') => {
//     try {
//       setProcessingRequest(requestId);
//       await workFromHomeAPI.approveWFHRequest(requestId, { 
//         action: 'reject',
//         rejection_reason: rejectionReason || 'Request rejected by HR'
//       });
//       toast.success('Work from home request rejected!');
//       fetchWFHRequests();
//     } catch (error) {
//       console.error('Failed to reject request:', error);
//       toast.error('Failed to reject request');
//     } finally {
//       setProcessingRequest(null);
//     }
//   };

//   const handleApprovalAction = async (approvalData) => {
//     setSubmitting(true);
//     try {
//       const requestData = {
//         action: approvalData.action,
//         rejection_reason: approvalData.action === 'reject' ? approvalData.rejection_reason : undefined
//       };

//       await workFromHomeAPI.approveWFHRequest(selectedApproval.id, requestData);

//       toast.success(
//         approvalData.action === 'approve' 
//           ? '✅ Work from home request approved successfully!' 
//           : '❌ Work from home request rejected successfully!'
//       );

//       setShowApprovalModal(false);
//       setSelectedApproval(null);
//       resetApproval();
//       fetchWFHRequests();
//     } catch (error) {
//       toast.error(`Failed to ${approvalData.action} request`);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const openApprovalModal = (request, action) => {
//     const approval = {
//       id: request.id,
//       employee_name: request.employee_name,
//       employee_id: request.employee_id,
//       employee_department: request.employee_department,
//       request_date: request.request_date,
//       formatted_request_date: request.formatted_request_date,
//       reason: request.reason,
//       action: action
//     };

//     setSelectedApproval(approval);
//     setShowApprovalModal(true);

//     resetApproval({
//       action: action,
//       rejection_reason: ''
//     });
//   };

//   const handleFilterChange = (key, value) => {
//     setFilters(prev => ({ ...prev, [key]: value }));
//   };

//   const clearFilters = () => {
//     setFilters({ start_date: '', end_date: '', status: '', employee_id: '' });
//   };

//   const exportWFHRequests = () => {
//     const csvContent = "data:text/csv;charset=utf-8," + 
//       "Date,Employee,Department,Reason,Status,Applied On,Approved By\n" +
//       requests.map(request => 
//         `${request.formatted_request_date},${request.employee_name},${request.employee_department},"${request.reason}",${request.status},${request.formatted_applied_at},${request.approved_by_name || ''}`
//       ).join("\n");

//     const encodedUri = encodeURI(csvContent);
//     const link = document.createElement("a");
//     link.setAttribute("href", encodedUri);
//     link.setAttribute("download", "wfh_requests_report.csv");
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const getStatusBadge = (status) => {
//     const statusConfig = {
//       PENDING: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: ExclamationTriangleIcon, text: 'Pending' },
//       APPROVED: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircleIcon, text: 'Approved' },
//       REJECTED: { color: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircleIcon, text: 'Rejected' }
//     };

//     const config = statusConfig[status] || statusConfig.PENDING;
//     const Icon = config.icon;

//     return (
//       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
//         <Icon className="w-3 h-3 mr-1" />
//         {config.text}
//       </span>
//     );
//   };

//   const getEmployeeInitials = (name) => {
//     return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
//   };

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

//   const StatCard = ({ title, value, icon: Icon, color, percentage }) => (
//     <div className="group bg-white/5/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 overflow-hidden">
//       <div className="p-6">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
//               <Icon className="h-6 w-6 text-white" />
//             </div>
//             <div>
//               <p className="text-3xl font-bold text-white group-hover:text-indigo-600 transition-colors duration-300">
//                 {value}
//               </p>
//               <p className="text-sm font-medium text-gray-600">
//                 {title}
//               </p>
//               {percentage !== undefined && (
//                 <p className="text-xs text-emerald-600 font-medium">
//                   {percentage}% success rate
//                 </p>
//               )}
//             </div>
//           </div>
//           <ChartBarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" />
//         </div>
//       </div>
//     </div>
//   );

//   const columns = [
//     ...(isHRManager() ? [{
//       header: 'Employee',
//       accessor: 'employee_name',
//       render: (name, row) => {
//         const profileGradient = getProfileGradient(name);
//         const employeeInitials = getEmployeeInitials(name);

//         return (
//           <div className="flex items-center">
//             <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${profileGradient} flex items-center justify-center shadow-md mr-3`}>
//               <span className="text-white text-sm font-bold">
//                 {employeeInitials}
//               </span>
//             </div>
//             <div>
//               <div className="text-sm font-medium text-white">{name}</div>
//               <div className="text-sm text-slate-400">{row.employee_id} • {row.employee_department}</div>
//             </div>
//           </div>
//         );
//       },
//     }] : []),
//     {
//       header: 'Request Date',
//       accessor: 'formatted_request_date',
//       render: (date, row) => (
//         <div className="flex items-center">
//           <CalendarDaysIcon className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
//           <div>
//             <div className="text-sm font-medium text-white">{date}</div>
//             {row.days_until_request >= 0 && (
//               <div className="text-xs text-slate-400">
//                 {row.days_until_request === 0 ? 'Today' : 
//                  row.days_until_request === 1 ? 'Tomorrow' : 
//                  `In ${row.days_until_request} days`}
//               </div>
//             )}
//           </div>
//         </div>
//       ),
//     },
//     {
//       header: 'Applied On',
//       accessor: 'formatted_applied_at',
//       render: (date) => (
//         <div className="flex items-center">
//           <ClockIcon className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
//           <span className="text-sm text-gray-600">{date}</span>
//         </div>
//       ),
//     },
//     {
//       header: 'Status',
//       accessor: 'status',
//       render: (status) => getStatusBadge(status),
//     },
//     {
//       header: 'Reason',
//       accessor: 'reason',
//       render: (reason) => (
//         <span className="text-sm text-gray-600 truncate max-w-48" title={reason}>
//           {reason || '-'}
//         </span>
//       ),
//     },
//     {
//       header: 'Approved By',
//       accessor: 'approved_by_name',
//       render: (name) => (
//         <span className="text-sm text-gray-600">
//           {name || '-'}
//         </span>
//       ),
//     },
//     // {
//     //   header: 'Actions',
//     //   accessor: 'id',
//     //   render: (id, row) => (
//     //     <div className="flex items-center space-x-2">
//     //       <button
//     //         onClick={() => {
//     //           setSelectedRequest(row);
//     //           openApprovalModal(row, 'view');
//     //         }}
//     //         className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
//     //         title="View Details"
//     //       >
//     //         <EyeIcon className="h-4 w-4" />
//     //       </button>
//     //       {isHRManager() && row.status === 'PENDING' && (
//     //         <>
//     //           <button
//     //             onClick={() => handleApprove(row.id)}
//     //             disabled={processingRequest === row.id}
//     //             className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all duration-200 disabled:opacity-50"
//     //             title="Approve Request"
//     //           >
//     //             <CheckCircleIcon className="h-4 w-4" />
//     //           </button>
//     //           <button
//     //             onClick={() => openApprovalModal(row, 'reject')}
//     //             disabled={processingRequest === row.id}
//     //             className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-all duration-200 disabled:opacity-50"
//     //             title="Reject Request"
//     //           >
//     //             <XCircleIcon className="h-4 w-4" />
//     //           </button>
//     //         </>
//     //       )}
//     //     </div>
//     //   ),
//     // },
//   ];

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
//         <div className="text-center">
//           <div className="relative">
//             <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin">
//               <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
//             </div>
//           </div>
//           <p className="mt-4 text-lg font-medium text-gray-600">Loading work from home requests...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//       {/* Enhanced Page Header */}
//       <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700">
//         <div className="absolute inset-0 bg-black opacity-10"></div>

//         {/* Decorative elements */}
//         <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32"></div>
//         <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48"></div>

//         <div className="relative px-4 py-12 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center">
//               <div className="p-3 bg-black/20 dark:bg-white/5/20 rounded-xl backdrop-blur-sm mr-4">
//                 <HomeIcon className="w-8 h-8 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-4xl font-bold text-white">Work From Home Requests</h1>
//                 <p className="mt-1 text-xl text-blue-100">
//                   {isHRManager() ? 'Manage work from home requests for all employees' : 'Track your work from home requests'}
//                 </p>
//                 <div className="flex items-center space-x-6 text-blue-100 mt-4">
//                   <div className="flex items-center space-x-2">
//                     <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
//                     <span className="text-sm font-medium">{stats.totalRequests} Total Requests</span>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
//                     <span className="text-sm font-medium">{stats.pendingRequests} Pending Review</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div className="flex space-x-3">
//               <button
//                 onClick={exportWFHRequests}
//                 className="group relative inline-flex items-center px-6 py-3 bg-black/10 dark:bg-white/5/10 text-white rounded-xl font-medium backdrop-blur-sm border border-black/20 dark:border-white/20 hover:bg-black/20 dark:bg-white/5/20 transform hover:scale-105 transition-all duration-300"
//               >
//                 <DocumentChartBarIcon className="h-5 w-5 mr-2 group-hover:animate-bounce" />
//                 Export
//               </button>
//               {!isHRManager() && (
//                 <button
//                   onClick={() => setShowRequestModal(true)}
//                   className="group relative inline-flex items-center px-8 py-3 bg-white/5 text-blue-600 rounded-xl font-semibold shadow-2xl hover:shadow-white/25 transform hover:scale-105 transition-all duration-300"
//                 >
//                   <PlusIcon className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
//                   New Request
//                   <div className="absolute inset-0 bg-gradient-to-r from-white to-blue-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="px-4 py-8 sm:px-6 lg:px-8">
//         {/* HR Manager Pending Approvals Alert */}
//         {isHRManager() && pendingApprovalsCount > 0 && (
//           <div className="mb-6">
//             <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-lg">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
//                     <ExclamationTriangleIcon className="h-6 w-6 text-white animate-pulse" />
//                   </div>
//                 </div>
//                 <div className="ml-4">
//                   <h3 className="text-lg font-bold text-amber-800">Pending Approvals</h3>
//                   <div className="mt-2 text-amber-700">
//                     <p>
//                       You have <strong>{pendingApprovalsCount}</strong> work from home request{pendingApprovalsCount > 1 ? 's' : ''} waiting for approval.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Enhanced Stats Cards */}
//         <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
//           <StatCard
//             title="Total Requests"
//             value={stats.totalRequests}
//             icon={CalendarDaysIcon}
//             color="from-blue-500 to-blue-600"
//           />
//           <StatCard
//             title="Approved"
//             value={stats.approvedRequests}
//             icon={CheckCircleIcon}
//             color="from-emerald-500 to-emerald-600"
//             percentage={stats.totalRequests > 0 ? Math.round((stats.approvedRequests / stats.totalRequests) * 100) : 0}
//           />
//           <StatCard
//             title="Rejected"
//             value={stats.rejectedRequests}
//             icon={XCircleIcon}
//             color="from-rose-500 to-rose-600"
//           />
//           <StatCard
//             title="Pending"
//             value={stats.pendingRequests}
//             icon={ClockIcon}
//             color="from-amber-500 to-amber-600"
//           />
//         </div>

//         {/* Employee Pending Requests Section */}
//         {!isHRManager() && (
//           <div className="bg-white/5/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 mb-6 border border-white/50">
//             <h3 className="text-xl font-bold text-white mb-4 flex items-center">
//               <ClockIcon className="h-6 w-6 mr-2 text-amber-500" />
//               Your Pending Requests
//             </h3>

//             {requests.filter(request => request.status === 'PENDING').length > 0 ? (
//               <div className="space-y-3">
//                 {requests
//                   .filter(request => request.status === 'PENDING')
//                   .map((request) => (
//                     <div key={request.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
//                       <div className="flex items-center space-x-3">
//                         <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
//                           <ClockIcon className="h-5 w-5 text-white" />
//                         </div>
//                         <div>
//                           <p className="text-sm font-medium text-amber-800">
//                             Request for {request.formatted_request_date}
//                           </p>
//                           <p className="text-xs text-amber-600">
//                             Waiting for HR approval
//                           </p>
//                           <p className="text-xs text-amber-600 mt-1">
//                             Reason: {request.reason}
//                           </p>
//                         </div>
//                       </div>
//                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
//                         Pending Approval
//                       </span>
//                     </div>
//                   ))}
//               </div>
//             ) : (
//               <div className="text-center py-4 text-slate-400">
//                 <CheckCircleIcon className="mx-auto h-8 w-8 text-gray-600 dark:text-gray-400 mb-2" />
//                 <p className="text-sm">No pending requests</p>
//               </div>
//             )}
//           </div>
//         )}

//         {/* HR Approval Section */}
//         {isHRManager() && (
//           <div className="bg-white/5/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 mb-6 border border-white/50" data-approvals-section>
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-xl font-bold text-white flex items-center">
//                 <UserIcon className="h-6 w-6 mr-2 text-indigo-500" />
//                 Pending Approval Requests
//               </h3>
//               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
//                 {requests.filter(r => r.status === 'PENDING').length} Pending
//               </span>
//             </div>

//             {requests.filter(r => r.status === 'PENDING').length > 0 ? (
//               <div className="space-y-4">
//                 {requests
//                   .filter(request => request.status === 'PENDING')
//                   .map((request) => {
//                     const profileGradient = getProfileGradient(request.employee_name);
//                     const employeeInitials = getEmployeeInitials(request.employee_name);

//                     return (
//                       <div key={request.id} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
//                         <div className="flex justify-between items-start mb-3">
//                           <div className="flex items-start space-x-4">
//                             <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${profileGradient} flex items-center justify-center shadow-lg`}>
//                               <span className="text-white font-bold text-lg">
//                                 {employeeInitials}
//                               </span>
//                             </div>
//                             <div>
//                               <h4 className="text-md font-medium text-white">
//                                 {request.employee_name}
//                               </h4>
//                               <p className="text-sm text-gray-600">Employee ID: {request.employee_id}</p>
//                               <p className="text-sm text-gray-600">Department: {request.employee_department}</p>
//                               <p className="text-sm text-gray-600">Request Date: {request.formatted_request_date}</p>
//                               <p className="text-sm text-gray-700 mt-1">
//                                 <span className="font-medium">Reason:</span> {request.reason}
//                               </p>
//                             </div>
//                           </div>
//                           <div className="flex space-x-2">
//                             <button
//                               onClick={() => handleApprove(request.id)}
//                               disabled={processingRequest === request.id}
//                               className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-xl text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-50 transform hover:scale-105 transition-all duration-200"
//                             >
//                               {processingRequest === request.id ? (
//                                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
//                               ) : (
//                                 <CheckCircleIcon className="w-4 h-4 mr-1" />
//                               )}
//                               Approve
//                             </button>
//                             <button
//                               onClick={() => openApprovalModal(request, 'reject')}
//                               disabled={processingRequest === request.id}
//                               className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-xl text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:opacity-50 transform hover:scale-105 transition-all duration-200"
//                             >
//                               {processingRequest === request.id ? (
//                                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
//                               ) : (
//                                 <XCircleIcon className="w-4 h-4 mr-1" />
//                               )}
//                               Reject
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" />
//                 <h3 className="mt-2 text-sm font-medium text-white">No pending approvals</h3>
//                 <p className="mt-1 text-sm text-slate-400">
//                   All work from home requests have been processed.
//                 </p>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Enhanced Filters */}
//         <div className="bg-white/5/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 mb-6 border border-white/50">
//           <h3 className="text-xl font-bold text-white mb-4 flex items-center">
//             <FunnelIcon className="h-6 w-6 mr-2 text-indigo-500" />
//             Filter Requests
//           </h3>
//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
//               <input
//                 type="date"
//                 value={filters.start_date}
//                 onChange={(e) => handleFilterChange('start_date', e.target.value)}
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/5/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
//               <input
//                 type="date"
//                 value={filters.end_date}
//                 onChange={(e) => handleFilterChange('end_date', e.target.value)}
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/5/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
//               <select
//                 value={filters.status}
//                 onChange={(e) => handleFilterChange('status', e.target.value)}
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/5/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
//               >
//                 <option value="">All Status</option>
//                 <option value="PENDING">Pending</option>
//                 <option value="APPROVED">Approved</option>
//                 <option value="REJECTED">Rejected</option>
//               </select>
//             </div>

//             <div className="flex items-end">
//               <button
//                 onClick={clearFilters}
//                 className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 inline-flex items-center justify-center transform hover:scale-105 transition-all duration-200"
//               >
//                 <FunnelIcon className="h-4 w-4 mr-2" />
//                 Clear Filters
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Enhanced WFH Requests Table */}
//         <div className="bg-white/5/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/50 overflow-hidden">
//           <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <h3 className="text-xl font-bold text-white flex items-center">
//                 <DocumentChartBarIcon className="h-6 w-6 mr-2 text-indigo-500" />
//                 Work From Home Requests
//               </h3>
//               <div className="flex items-center space-x-2 text-sm text-gray-600">
//                 <CalendarDaysIcon className="h-4 w-4" />
//                 <span>{requests.length} requests</span>
//               </div>
//             </div>
//           </div>

//           <Table
//             columns={columns}
//             data={requests}
//             loading={loading}
//             emptyMessage="No work from home requests found"
//           />
//         </div>
//       </div>

//       {/* Enhanced New Request Modal */}
//       <Modal
//         isOpen={showRequestModal}
//         onClose={() => {
//           setShowRequestModal(false);
//           reset();
//         }}
//         title={
//           <div className="flex items-center">
//             <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
//               <PlusIcon className="h-6 w-6 text-blue-600" />
//             </div>
//             <div>
//               <h3 className="text-xl font-bold text-white">Submit Work From Home Request</h3>
//               <p className="text-sm text-gray-600">Request approval for remote work</p>
//             </div>
//           </div>
//         }
//       >
//         <form onSubmit={handleSubmit(onSubmit)}>
//           <div className="space-y-6">
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Request Date <span className="text-red-500">*</span>
//               </label>
//               <input
//                 {...register('request_date', { required: 'Request date is required' })}
//                 type="date"
//                 min={new Date().toISOString().split('T')[0]}
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/5/70 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
//               />
//               {errors.request_date && <p className="text-red-500 text-sm mt-1">{errors.request_date.message}</p>}
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Reason <span className="text-red-500">*</span>
//               </label>
//               <textarea
//                 {...register('reason', { required: 'Reason is required' })}
//                 rows={4}
//                 placeholder="Please provide a reason for your work from home request..."
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/5/70 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none resize-none"
//               />
//               {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>}
//             </div>

//             <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
//               <div className="flex">
//                 <div className="flex-shrink-0">
//                   <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//                   </svg>
//                 </div>
//                 <div className="ml-3">
//                   <h3 className="text-sm font-medium text-blue-800">
//                     Please Note
//                   </h3>
//                   <div className="mt-2 text-sm text-blue-700">
//                     <p>Your request will be sent to HR for approval. You'll receive a notification once it's reviewed.</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="flex space-x-3 pt-6">
//             <button
//               type="submit"
//               disabled={submitting}
//               className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
//             >
//               {submitting ? (
//                 <div className="flex items-center justify-center">
//                   <LoadingSpinner size="small" />
//                   <span className="ml-2">Submitting...</span>
//                 </div>
//               ) : (
//                 'Submit Request'
//               )}
//             </button>
//             <button
//               type="button"
//               onClick={() => {
//                 setShowRequestModal(false);
//                 reset();
//               }}
//               className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transform hover:scale-105 transition-all duration-200"
//             >
//               Cancel
//             </button>
//           </div>
//         </form>
//       </Modal>

//       {/* Enhanced Request Details Modal */}
//       {selectedRequest && selectedRequest !== selectedApproval && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//             <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setSelectedRequest(null)}></div>

//             <div className="inline-block align-bottom bg-white/5 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
//               {/* Header */}
//               <div className={`bg-gradient-to-r ${theme.primaryGradient} px-6 py-6`}>
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center">
//                     {/* <div className="w-12 h-12 bg-white/5 bg-opacity-20 rounded-xl flex items-center justify-center">
//                       <EyeIcon className="h-6 w-6 text-white" />
//                     </div> */}
//                     <div className="ml-4">
//                       <h3 className="text-2xl font-bold text-white">
//                         Work From Home Request Details
//                       </h3>
//                       <p className="text-blue-100">
//                         {selectedRequest.employee_name} - {selectedRequest.formatted_request_date}
//                       </p>
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => setSelectedRequest(null)}
//                     className="text-white hover:text-blue-200 transition-colors duration-200"
//                   >
//                     <XCircleIcon className="h-6 w-6" />
//                   </button>
//                 </div>
//               </div>

//               <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
//                 <div className="space-y-4">
//                   {isHRManager() && (
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">Department:</label>
//                         <p className="text-sm text-white bg-white/5/70 rounded-lg px-3 py-2">{selectedRequest.employee_department}</p>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID:</label>
//                         <p className="text-sm text-white bg-white/5/70 rounded-lg px-3 py-2">{selectedRequest.employee_id}</p>
//                       </div>
//                     </div>
//                   )}

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-semibold text-gray-700 mb-1">Request Date:</label>
//                       <p className="text-sm text-white bg-white/5/70 rounded-lg px-3 py-2">{selectedRequest.formatted_request_date}</p>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-semibold text-gray-700 mb-1">Applied On:</label>
//                       <p className="text-sm text-white bg-white/5/70 rounded-lg px-3 py-2">{selectedRequest.formatted_applied_at}</p>
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-1">Status:</label>
//                     <div className="mt-1">
//                       {getStatusBadge(selectedRequest.status)}
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-1">Reason:</label>
//                     <div className="bg-white/5/70 rounded-lg px-3 py-3">
//                       <p className="text-sm text-white">{selectedRequest.reason}</p>
//                     </div>
//                   </div>

//                   {selectedRequest.approved_by_name && (
//                     <div>
//                       <label className="block text-sm font-semibold text-gray-700 mb-1">Approved By:</label>
//                       <p className="text-sm text-white bg-white/5/70 rounded-lg px-3 py-2">{selectedRequest.approved_by_name}</p>
//                     </div>
//                   )}

//                   {selectedRequest.days_until_request >= 0 && (
//                     <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
//                       <div className="flex items-center">
//                         <CalendarDaysIcon className="h-5 w-5 text-blue-500 mr-2" />
//                         <div>
//                           <p className="text-sm font-medium text-blue-800">Time Until Request Date</p>
//                           <p className="text-sm text-blue-700">
//                             {selectedRequest.days_until_request === 0 ? 'Today' : 
//                              selectedRequest.days_until_request === 1 ? 'Tomorrow' : 
//                              `In ${selectedRequest.days_until_request} days`}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
//                 <button
//                   onClick={() => setSelectedRequest(null)}
//                   className="w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white/5 text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced Approval Modal */}
//       <Modal
//         isOpen={showApprovalModal}
//         onClose={() => {
//           setShowApprovalModal(false);
//           setSelectedApproval(null);
//           resetApproval();
//         }}
//         title={
//           <div className="flex items-center">
//             <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
//               selectedApproval?.action === 'approve' ? 'bg-emerald-500 bg-opacity-20' : 
//               selectedApproval?.action === 'reject' ? 'bg-rose-500 bg-opacity-20' : 'bg-blue-500 bg-opacity-20'
//             }`}>
//               {selectedApproval?.action === 'approve' ? (
//                 <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
//               ) : selectedApproval?.action === 'reject' ? (
//                 <XCircleIcon className="h-6 w-6 text-rose-600" />
//               ) : (
//                 <EyeIcon className="h-6 w-6 text-blue-600" />
//               )}
//             </div>
//             <div>
//               <h3 className="text-xl font-bold text-white">
//                 {selectedApproval?.action === 'approve' ? 'Approve Work From Home Request' : 
//                  selectedApproval?.action === 'reject' ? 'Reject Work From Home Request' : 
//                  'Work From Home Request Details'}
//               </h3>
//               <p className="text-sm text-gray-600">
//                 {selectedApproval?.employee_name} - {selectedApproval?.formatted_request_date}
//               </p>
//             </div>
//           </div>
//         }
//       >
//         {selectedApproval && (
//           <form onSubmit={handleApprovalSubmit(handleApprovalAction)}>
//             <div className="mb-6">
//               <div className="grid grid-cols-2 gap-4 mb-4">
//                 <div>
//                   <span className="text-sm font-semibold text-gray-700">Department:</span>
//                   <p className="text-sm text-white bg-gray-50 rounded-lg px-3 py-2 mt-1">{selectedApproval.employee_department}</p>
//                 </div>
//                 <div>
//                   <span className="text-sm font-semibold text-gray-700">Employee ID:</span>
//                   <p className="text-sm text-white bg-gray-50 rounded-lg px-3 py-2 mt-1">{selectedApproval.employee_id}</p>
//                 </div>
//               </div>
//               <div className="bg-gray-50 p-4 rounded-xl">
//                 <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
//                 <p className="text-sm text-white">{selectedApproval.reason}</p>
//               </div>
//             </div>

//             {selectedApproval.action === 'reject' && (
//               <div className="mb-6">
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Rejection Reason (Optional)
//                 </label>
//                 <textarea
//                   {...registerApproval('rejection_reason')}
//                   rows={3}
//                   placeholder="Please provide a reason for rejection..."
//                   className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/5/70 backdrop-blur-sm focus:border-rose-500 focus:ring-4 focus:ring-rose-100 transition-all duration-200 outline-none resize-none"
//                 />
//               </div>
//             )}

//             <input type="hidden" {...registerApproval('action')} />

//             {selectedApproval.action !== 'view' ? (
//               <div className="flex space-x-3 pt-4">
//                 <button
//                   type="submit"
//                   disabled={submitting}
//                   className={`flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 transform hover:scale-105 transition-all duration-200 ${
//                     selectedApproval.action === 'approve'
//                       ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 focus:ring-emerald-200'
//                       : 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-700 hover:to-red-700 focus:ring-rose-200'
//                   }`}
//                 >
//                   {submitting ? (
//                     <div className="flex items-center justify-center">
//                       <LoadingSpinner size="small" />
//                       <span className="ml-2">Processing...</span>
//                     </div>
//                   ) : (
//                     selectedApproval.action === 'approve' ? 'Approve Request' : 'Reject Request'
//                   )}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowApprovalModal(false);
//                     setSelectedApproval(null);
//                     resetApproval();
//                   }}
//                   className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transform hover:scale-105 transition-all duration-200"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             ) : (
//               <div className="flex justify-end pt-4">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowApprovalModal(false);
//                     setSelectedApproval(null);
//                     resetApproval();
//                   }}
//                   className="bg-gray-300 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transform hover:scale-105 transition-all duration-200"
//                 >
//                   Close
//                 </button>
//               </div>
//             )}
//           </form>
//         )}
//       </Modal>

//       {/* Enhanced Floating Action Button for HR - Quick Access to Approvals */}
//       {isHRManager() && requests.filter(r => r.status === 'PENDING').length > 0 && (
//         <div className="fixed bottom-6 right-6 z-50">
//           <button
//             onClick={() => {
//               document.querySelector('[data-approvals-section]')?.scrollIntoView({ behavior: 'smooth' });
//             }}
//             className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 transform hover:scale-110"
//             title={`${requests.filter(r => r.status === 'PENDING').length} pending approvals`}
//           >
//             <div className="relative">
//               <ClockIcon className="h-6 w-6" />
//               <span className="absolute -top-2 -right-2 bg-white/5 text-red-600 rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center animate-pulse">
//                 {requests.filter(r => r.status === 'PENDING').length}
//               </span>
//             </div>
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default WorkFromHomeRequests;

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  HomeIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  FunnelIcon,
  DocumentChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { isHRManager, isManager, isHROrManager } from '../../utils/auth';
import { workFromHomeAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import Table from '../common/Table';
import Modal from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';

const WorkFromHomeRequests = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [stats, setStats] = useState({
    totalRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    pendingRequests: 0
  });
  const [filters, setFilters] = useState({
    month: new Date().toISOString().slice(0, 7), // Default to current month YYYY-MM
    status: '',
    employee_id: ''
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      reason: ''
    }
  });

  const { register: registerApproval, handleSubmit: handleApprovalSubmit, reset: resetApproval, formState: { errors: approvalErrors } } = useForm();

  // Check if current user can approve (HR Manager or Manager)
  const canApprove = () => {
    return isHROrManager();
  };

  // Check if current user can see all requests or just their own
  const canViewAllRequests = () => {
    return isHROrManager();
  };

  // Get appropriate header text based on role
  const getHeaderText = () => {
    if (isHRManager()) {
      return 'Manage work from home requests for all employees';
    } else if (isManager()) {
      return 'Manage work from home requests for your team';
    } else {
      return 'Track your work from home requests';
    }
  };

  useEffect(() => {
    fetchWFHRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchWFHRequests = async () => {
    try {
      setLoading(true);
      const filterParam = filters.status === '' ? null : filters.status;
      const response = await workFromHomeAPI.getWFHRequests(filterParam);
      console.log('API response for WFH requests:', response);
      // Handle different response formats
      let requestsData = [];
      if (response.results) {
        requestsData = response.results;
      } else if (Array.isArray(response)) {
        requestsData = response;
      } else if (response.data && response.data.results) {
        requestsData = response.data.results;
      } else if (response.data && Array.isArray(response.data)) {
        requestsData = response.data;
      }
      console.log('Fetched WFH requests:', requestsData);
      setRequests(Array.isArray(requestsData) ? requestsData : []);

      // Set pending approvals count for HR and Managers
      if (canApprove() && response.data?.pending_approvals_count !== undefined) {
        setPendingApprovalsCount(response.data.pending_approvals_count);
      }

      // Calculate stats
      calculateStats(Array.isArray(requestsData) ? requestsData : []);
    } catch (error) {
      console.error('Failed to fetch WFH requests:', error);
      toast.error('Failed to load work from home requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (requestsData) => {
    const stats = {
      totalRequests: requestsData.length,
      approvedRequests: requestsData.filter(r => r.status === 'APPROVED').length,
      rejectedRequests: requestsData.filter(r => r.status === 'REJECTED').length,
      pendingRequests: requestsData.filter(r => r.status === 'PENDING').length
    };
    setStats(stats);
    setPendingApprovalsCount(stats.pendingRequests);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await workFromHomeAPI.createWFHRequest(data);
      toast.success('Work from home request submitted successfully!');
      reset({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
      setShowRequestModal(false);
      fetchWFHRequests();
    } catch (error) {
      console.error('Failed to create request:', error);
      const errorMsg = error.response?.data?.error ||
        (error.response?.data ? Object.values(error.response.data)[0] : null) ||
        'Failed to submit request';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessingRequest(requestId);
      await workFromHomeAPI.approveWFHRequest(requestId, { action: 'approve' });
      toast.success('Work from home request approved!');
      fetchWFHRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Failed to approve request');
    } finally {
      setProcessingRequest(null);
    }
  };

  // handleReject was removed because it was unused


  const handleApprovalAction = async (approvalData) => {
    setSubmitting(true);
    try {
      const requestData = {
        action: approvalData.action,
        rejection_reason: approvalData.action === 'reject' ? approvalData.rejection_reason : undefined
      };

      await workFromHomeAPI.approveWFHRequest(selectedApproval.id, requestData);

      toast.success(
        approvalData.action === 'approve'
          ? '✅ Work from home request approved successfully!'
          : '❌ Work from home request rejected successfully!'
      );

      setShowApprovalModal(false);
      setSelectedApproval(null);
      resetApproval();
      fetchWFHRequests();
    } catch (error) {
      toast.error(`Failed to ${approvalData.action} request`);
    } finally {
      setSubmitting(false);
    }
  };

  const openApprovalModal = (request, action) => {
    const approval = {
      id: request.id,
      employee_name: request.employee_name,
      employee_id: request.employee_id,
      employee_department: request.employee_department,
      start_date: request.start_date,
      end_date: request.end_date,
      formatted_start_date: request.formatted_start_date,
      formatted_end_date: request.formatted_end_date,
      reason: request.reason,
      action: action
    };

    setSelectedApproval(approval);
    setShowApprovalModal(true);

    resetApproval({
      action: action,
      rejection_reason: ''
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ month: new Date().toISOString().slice(0, 7), status: '', employee_id: '' });
  };

  const exportWFHRequests = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Date Range,Employee,Department,Reason,Status,Applied On,Approved By\n" +
      requests.map(request =>
        `${request.formatted_start_date} - ${request.formatted_end_date},${request.employee_name},${request.employee_department},"${request.reason}",${request.status},${request.formatted_applied_at},${request.approved_by_name || ''}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "wfh_requests_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: ExclamationTriangleIcon, text: 'Pending' },
      APPROVED: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircleIcon, text: 'Approved' },
      REJECTED: { color: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircleIcon, text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getEmployeeInitials = (name) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
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
    const index = name.length % gradients.length;
    return gradients[index];
  };

  const StatCard = ({ title, value, icon: Icon, color, percentage }) => (
    <div className={`group ${theme.cardBg} backdrop-blur-xl rounded-2xl ${theme.cardBorder} p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold text-white group-hover:text-indigo-400 transition-colors duration-300">
              {value}
            </p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            {percentage !== undefined && (
              <p className="text-xs text-emerald-400 font-medium">
                {percentage}% success rate
              </p>
            )}
          </div>
        </div>
        <ChartBarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" />
      </div>
    </div>
  );

  const columns = [
    ...(canViewAllRequests() ? [{
      header: 'Employee',
      accessor: 'employee_name',
      render: (name, row) => {
        const profileGradient = getProfileGradient(name);
        const employeeInitials = getEmployeeInitials(name);

        return (
          <div className="flex items-center">
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${profileGradient} flex items-center justify-center shadow-md mr-3`}>
              <span className="text-white text-sm font-bold">
                {employeeInitials}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-white">{name}</div>
              <div className="text-sm text-slate-400">{row.employee_id} • {row.employee_department}</div>
            </div>
          </div>
        );
      },
    }] : []),
    {
      header: 'Request Period',
      accessor: 'formatted_start_date',
      render: (date, row) => (
        <div className="flex items-center">
          <CalendarDaysIcon className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
          <div>
            <div className="text-sm font-medium text-white">
              {row.formatted_start_date === row.formatted_end_date ? row.formatted_start_date : `${row.formatted_start_date} - ${row.formatted_end_date}`}
            </div>
            {row.days_until_start >= 0 && (
              <div className="text-xs text-slate-400">
                {row.days_until_start === 0 ? 'Starts Today' :
                  row.days_until_start === 1 ? 'Starts Tomorrow' :
                    `Starts in ${row.days_until_start} days`}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Applied On',
      accessor: 'formatted_applied_at',
      render: (date) => (
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">{date}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (status) => getStatusBadge(status),
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: (reason) => (
        <span className="text-sm text-gray-600 truncate max-w-48" title={reason}>
          {reason || '-'}
        </span>
      ),
    },
    {
      header: 'Approved By',
      accessor: 'approved_by_name',
      render: (name) => (
        <span className="text-sm text-gray-600">
          {name || '-'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient} flex justify-center items-center`}>
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-600">Loading work from home requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient}`}>
      {/* Enhanced Page Header */}
      <div className={`relative overflow-hidden bg-gradient-to-r ${theme.headerGradient}`}>
        <div className="absolute inset-0 bg-black opacity-10"></div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48"></div>

        <div className="relative px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-black/20 dark:bg-white/5/20 rounded-xl backdrop-blur-sm mr-4">
                <HomeIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Work From Home Requests</h1>
                <p className="mt-1 text-xl text-blue-100">
                  {getHeaderText()}
                </p>
                <div className="flex items-center space-x-6 text-blue-100 mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">{stats.totalRequests} Total Requests</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">{stats.pendingRequests} Pending Review</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportWFHRequests}
                className="group relative inline-flex items-center px-6 py-3 bg-black/10 dark:bg-white/5/10 text-white rounded-xl font-medium backdrop-blur-sm border border-black/20 dark:border-white/20 hover:bg-black/20 dark:bg-white/5/20 transform hover:scale-105 transition-all duration-300"
              >
                <DocumentChartBarIcon className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                Export
              </button>
              {!canViewAllRequests() && (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className={`group relative inline-flex items-center px-8 py-3 bg-gradient-to-r ${theme.primaryGradient} text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transform hover:scale-105 transition-all duration-300`}
                >
                  <PlusIcon className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  New Request
                  <div className="absolute inset-0 bg-black/20 dark:bg-white/5/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        {/* HR Manager and Manager Pending Approvals Alert */}
        {canApprove() && pendingApprovalsCount > 0 && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                    <ExclamationTriangleIcon className="h-6 w-6 text-white animate-pulse" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-amber-800">Pending Approvals</h3>
                  <div className="mt-2 text-amber-700">
                    <p>
                      You have <strong>{pendingApprovalsCount}</strong> work from home request{pendingApprovalsCount > 1 ? 's' : ''} waiting for approval.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Requests"
            value={stats.totalRequests}
            icon={CalendarDaysIcon}
            color="from-blue-500 to-indigo-600"
          />
          <StatCard
            title="Approved"
            value={stats.approvedRequests}
            icon={CheckCircleIcon}
            color="from-emerald-500 to-teal-600"
            percentage={stats.totalRequests > 0 ? Math.round((stats.approvedRequests / stats.totalRequests) * 100) : 0}
          />
          <StatCard
            title="Rejected"
            value={stats.rejectedRequests}
            icon={XCircleIcon}
            color="from-rose-500 to-red-600"
          />
          <StatCard
            title="Pending"
            value={stats.pendingRequests}
            icon={ClockIcon}
            color="from-amber-500 to-orange-600"
          />
        </div>

        {/* Employee Pending Requests Section - Only for employees */}
        {!canViewAllRequests() && (
          <div className={`${theme.cardBg} backdrop-blur-xl shadow-xl rounded-2xl p-6 mb-6 border ${theme.cardBorder}`}>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <ClockIcon className="h-6 w-6 mr-2 text-amber-400" />
              Your Pending Requests
            </h3>

            {requests.filter(request => request.status === 'PENDING').length > 0 ? (
              <div className="space-y-3">
                {requests
                  .filter(request => request.status === 'PENDING')
                  .map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center">
                          <ClockIcon className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-300">
                            Range: {request.formatted_start_date} - {request.formatted_end_date}
                          </p>
                          <p className="text-xs text-amber-400/80">
                            Waiting for {isHRManager() ? 'HR' : 'manager'} approval
                          </p>
                          <p className="text-xs text-amber-400/80 mt-1">
                            Reason: {request.reason}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 border border-amber-500/30 text-amber-300">
                        Pending Approval
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400">
                <CheckCircleIcon className="mx-auto h-8 w-8 text-gray-600 dark:text-gray-400 mb-2" />
                <p className="text-sm">No pending requests</p>
              </div>
            )}
          </div>
        )}

        {/* HR and Manager Approval Section */}
        {canApprove() && (
          <div className={`${theme.cardBg} backdrop-blur-xl shadow-xl rounded-2xl p-6 mb-6 border ${theme.cardBorder}`} data-approvals-section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <UserIcon className="h-6 w-6 mr-2 text-indigo-400" />
                Pending Approval Requests
                {isManager() && (
                  <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">(Your Team)</span>
                )}
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 border border-red-500/30 text-red-300">
                {requests.filter(r => r.status === 'PENDING').length} Pending
              </span>
            </div>

            {requests.filter(r => r.status === 'PENDING').length > 0 ? (
              <div className="space-y-4">
                {requests
                  .filter(request => request.status === 'PENDING')
                  .map((request) => {
                    const profileGradient = getProfileGradient(request.employee_name);
                    const employeeInitials = getEmployeeInitials(request.employee_name);

                    return (
                      <div key={request.id} className="bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-6 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-start space-x-4">
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${profileGradient} flex items-center justify-center shadow-lg`}>
                              <span className="text-white font-bold text-lg">
                                {employeeInitials}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-md font-medium text-white">
                                {request.employee_name}
                              </h4>

                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Employee ID: {request.employee?.employee_id || '—'}
                              </p>

                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Department: {request.employee?.department || request.employee?.sub_department || '—'}
                              </p>

                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Request Date: {formatDate(request.request_date)}
                              </p>

                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <span className="font-medium text-gray-300">Reason:</span> {request.reason}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprove(request.id)}
                              disabled={processingRequest === request.id}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-xl text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-50 transform hover:scale-105 transition-all duration-200"
                            >
                              {processingRequest === request.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                              ) : (
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => openApprovalModal(request, 'reject')}
                              disabled={processingRequest === request.id}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-xl text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:opacity-50 transform hover:scale-105 transition-all duration-200"
                            >
                              {processingRequest === request.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                              ) : (
                                <XCircleIcon className="w-4 h-4 mr-1" />
                              )}
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-white">No pending approvals</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  All work from home requests have been processed.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Filters */}
        <div className={`${theme.cardBg} backdrop-blur-xl shadow-xl rounded-2xl p-6 mb-6 border ${theme.cardBorder}`}>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <FunnelIcon className="h-6 w-6 mr-2 text-indigo-400" />
            Filter Requests
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Month</label>
              <input
                type="month"
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="w-full px-4 py-3 border border-black/20 dark:border-white/20 rounded-xl bg-white/5 text-white backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 outline-none placeholder-gray-500 [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-3 border border-black/20 dark:border-white/20 rounded-xl bg-[#070B14] dark:bg-[#1e1e2d] text-white backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 outline-none"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-black/10 dark:bg-white/5/10 text-white px-4 py-3 rounded-xl hover:bg-black/20 dark:bg-white/5/20 border border-white/10 dark:border-white/10 focus:outline-none focus:ring-4 focus:ring-white/20 inline-flex items-center justify-center transform hover:scale-105 transition-all duration-200"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced WFH Requests Table */}
        <div className={`${theme.cardBg} backdrop-blur-xl shadow-xl rounded-2xl border ${theme.cardBorder} overflow-hidden`}>
          <div className="px-4 py-5 sm:px-6 border-b border-white/10 dark:border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center">
                <DocumentChartBarIcon className="h-6 w-6 mr-2 text-indigo-400" />
                Work From Home Requests
                {isManager() && (
                  <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">(Your Team)</span>
                )}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <CalendarDaysIcon className="h-4 w-4" />
                <span>{requests.length} requests</span>
              </div>
            </div>
          </div>

          <Table
            columns={columns}
            data={requests}
            loading={loading}
            emptyMessage="No work from home requests found"
          />
        </div>
      </div>

      {/* Enhanced New Request Modal - Only for employees */}
      {!canViewAllRequests() && (
        <Modal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            reset();
          }}
          title={
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-500 bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                <PlusIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Submit Work From Home Request</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Request approval for remote work</p>
              </div>
            </div>
          }
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('start_date', { required: 'Start date is required' })}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-black/20 dark:border-white/20 rounded-xl bg-white/5 text-white backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 outline-none [color-scheme:dark]"
                  />
                  {errors.start_date && <p className="text-red-400 text-sm mt-1">{errors.start_date.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('end_date', { required: 'End date is required' })}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-black/20 dark:border-white/20 rounded-xl bg-white/5 text-white backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 outline-none [color-scheme:dark]"
                  />
                  {errors.end_date && <p className="text-red-400 text-sm mt-1">{errors.end_date.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('reason', { required: 'Reason is required' })}
                  rows={4}
                  placeholder="Please provide a reason for your work from home request..."
                  className="w-full px-4 py-3 border border-black/20 dark:border-white/20 rounded-xl bg-white/5 text-white backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 outline-none resize-none placeholder-gray-500"
                />
                {errors.reason && <p className="text-red-400 text-sm mt-1">{errors.reason.message}</p>}
              </div>

              <div className="bg-white/5 border border-white/10 dark:border-white/10 rounded-xl p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-white">
                      Please Note
                    </h3>
                    <div className="mt-2 text-sm text-gray-300">
                      <p>Your request will be sent to {isHRManager() ? 'HR' : 'your manager and HR'} for approval. You'll receive a notification once it's reviewed.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 bg-gradient-to-r ${theme.primaryGradient} text-white px-4 py-3 rounded-xl hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Submitting...</span>
                  </div>
                ) : (
                  'Submit Request'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRequestModal(false);
                  reset();
                }}
                className="flex-1 bg-black/10 dark:bg-white/5/10 text-white px-4 py-3 rounded-xl hover:bg-black/20 dark:bg-white/5/20 border border-white/10 dark:border-white/10 focus:outline-none focus:ring-4 focus:ring-white/20 transform hover:scale-105 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Enhanced Request Details Modal */}
      {selectedRequest && selectedRequest !== selectedApproval && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setSelectedRequest(null)}></div>

            <div className="inline-block align-bottom bg-[#0A0F1A] border border-white/10 dark:border-white/10 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Header */}
              <div className={`bg-gradient-to-r ${theme.headerGradient} px-6 py-6 border-b border-white/10 dark:border-white/10`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-white">
                        Work From Home Request Details
                      </h3>
                      <p className="text-red-50">
                        {selectedRequest.employee_name} - {selectedRequest.formatted_start_date} to {selectedRequest.formatted_end_date}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-white/70 hover:text-white transition-colors duration-200"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="bg-white/5 p-6">
                <div className="space-y-4">
                  {canViewAllRequests() && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Department:</label>
                        <p className="text-sm text-white bg-white/5 border border-white/10 dark:border-white/10 rounded-lg px-3 py-2">{selectedRequest.employee_department}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Employee ID:</label>
                        <p className="text-sm text-white bg-white/5 border border-white/10 dark:border-white/10 rounded-lg px-3 py-2">{selectedRequest.employee_id}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Period:</label>
                      <p className="text-sm text-white bg-white/5 border border-white/10 dark:border-white/10 rounded-lg px-3 py-2">
                        {selectedRequest.formatted_start_date} to {selectedRequest.formatted_end_date}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Applied On:</label>
                      <p className="text-sm text-white bg-white/5 border border-white/10 dark:border-white/10 rounded-lg px-3 py-2">{selectedRequest.formatted_applied_at}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Status:</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Reason:</label>
                    <div className="bg-white/5 border border-white/10 dark:border-white/10 rounded-lg px-3 py-3">
                      <p className="text-sm text-white">{selectedRequest.reason}</p>
                    </div>
                  </div>

                  {selectedRequest.approved_by_name && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Approved By:</label>
                      <p className="text-sm text-white bg-white/5 border border-white/10 dark:border-white/10 rounded-lg px-3 py-2">{selectedRequest.approved_by_name}</p>
                    </div>
                  )}

                  {selectedRequest.days_until_start >= 0 && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-5 w-5 text-indigo-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-white">Time Until Start Date</p>
                          <p className="text-sm text-gray-300">
                            {selectedRequest.days_until_start === 0 ? 'Today' :
                              selectedRequest.days_until_start === 1 ? 'Tomorrow' :
                                `In ${selectedRequest.days_until_start} days`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#05080f] px-6 py-4 border-t border-white/10 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="w-full inline-flex justify-center rounded-xl bg-black/10 dark:bg-white/5/10 border border-black/20 dark:border-white/20 shadow-sm px-6 py-3 text-base font-medium text-white hover:bg-black/20 dark:bg-white/5/20 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedApproval(null);
          resetApproval();
        }}
        title={
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${selectedApproval?.action === 'approve' ? 'bg-emerald-500 bg-opacity-20' :
              selectedApproval?.action === 'reject' ? 'bg-rose-500 bg-opacity-20' : 'bg-red-500 bg-opacity-20'
              }`}>
              {selectedApproval?.action === 'approve' ? (
                <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
              ) : selectedApproval?.action === 'reject' ? (
                <XCircleIcon className="h-6 w-6 text-rose-600" />
              ) : (
                <EyeIcon className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {selectedApproval?.action === 'approve' ? 'Approve Work From Home Request' :
                  selectedApproval?.action === 'reject' ? 'Reject Work From Home Request' :
                    'Work From Home Request Details'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedApproval?.employee_name} - {selectedApproval?.formatted_start_date} to {selectedApproval?.formatted_end_date}
              </p>
            </div>
          </div>
        }
      >
        {selectedApproval && (
          <form onSubmit={handleApprovalSubmit(handleApprovalAction)}>
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Department:</span>
                  <p className="text-sm text-white bg-white/5 border border-white/10 dark:border-white/10 rounded-lg px-3 py-2 mt-1">{selectedApproval.employee_department}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Employee ID:</span>
                  <p className="text-sm text-white bg-white/5 border border-white/10 dark:border-white/10 rounded-lg px-3 py-2 mt-1">{selectedApproval.employee_id}</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 dark:border-white/10 p-4 rounded-xl">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Reason:</p>
                <p className="text-sm text-white">{selectedApproval.reason}</p>
              </div>
            </div>

            {selectedApproval.action === 'reject' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  {...registerApproval('rejection_reason')}
                  rows={3}
                  placeholder="Please provide a reason for rejection..."
                  className="w-full px-4 py-3 border border-black/20 dark:border-white/20 rounded-xl bg-white/5 text-white backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 outline-none resize-none"
                />
              </div>
            )}

            <input type="hidden" {...registerApproval('action')} />

            {selectedApproval.action !== 'view' ? (
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 transform hover:scale-105 transition-all duration-200 ${selectedApproval.action === 'approve'
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 focus:ring-emerald-200'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-700 hover:to-red-700 focus:ring-rose-200'
                    }`}
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="small" />
                      <span className="ml-2">Processing...</span>
                    </div>
                  ) : (
                    selectedApproval.action === 'approve' ? 'Approve Request' : 'Reject Request'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedApproval(null);
                    resetApproval();
                  }}
                  className="flex-1 bg-black/10 dark:bg-white/5/10 border border-white/10 dark:border-white/10 text-white px-4 py-3 rounded-xl hover:bg-black/20 dark:bg-white/5/20 focus:outline-none focus:ring-4 focus:ring-white/20 transform hover:scale-105 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedApproval(null);
                    resetApproval();
                  }}
                  className="bg-black/10 dark:bg-white/5/10 border border-white/10 dark:border-white/10 text-white px-6 py-3 rounded-xl hover:bg-black/20 dark:bg-white/5/20 focus:outline-none focus:ring-4 focus:ring-white/20 transform hover:scale-105 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            )}
          </form>
        )}
      </Modal>

      {/* Enhanced Floating Action Button for HR and Managers - Quick Access to Approvals */}
      {canApprove() && requests.filter(r => r.status === 'PENDING').length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => {
              document.querySelector('[data-approvals-section]')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`bg-gradient-to-r ${theme.primaryGradient} text-white rounded-full p-4 shadow-2xl transition-all duration-300 transform hover:scale-110`}
            title={`${requests.filter(r => r.status === 'PENDING').length} pending approvals`}
          >
            <div className="relative">
              <ClockIcon className="h-6 w-6" />
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center animate-pulse shadow-lg">
                {requests.filter(r => r.status === 'PENDING').length}
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkFromHomeRequests;
