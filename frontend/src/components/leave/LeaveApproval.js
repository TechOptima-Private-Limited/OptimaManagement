

// import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
// import { 
//   CheckCircleIcon, 
//   XCircleIcon, 
//   EyeIcon,
//   ClockIcon,
//   UserIcon,
//   CalendarDaysIcon,
//   ExclamationTriangleIcon,
//   ChatBubbleLeftRightIcon
// } from '@heroicons/react/24/outline';
// import { leaveAPI } from '../../services/api';
// import { formatDate } from '../../utils/formatters';
// import StatusBadge from '../common/StatusBadge';
// import LoadingSpinner from '../common/LoadingSpinner';
// import Modal from '../common/Modal';

// const LeaveApproval = () => {
//   const [pendingRequests, setPendingRequests] = useState([]);
//   const [allRequests, setAllRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [showApprovalModal, setShowApprovalModal] = useState(false);
//   const [showRejectionModal, setShowRejectionModal] = useState(false);
//   const [actionLoading, setActionLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState('pending');
//   const [comments, setComments] = useState('');
//   const [rejectionReason, setRejectionReason] = useState('');
//   const [filters, setFilters] = useState({
//     status: '',
//     leave_type: '',
//     employee: ''
//   });

//   useEffect(() => {
//     fetchRequests();
//   }, []);

//   useEffect(() => {
//     fetchRequests();
//   }, [filters]);

//   const fetchRequests = async () => {
//     try {
//       setLoading(true);
//       const [pendingResponse, allResponse] = await Promise.all([
//         leaveAPI.getLeaveRequests({ status: 'PENDING', ...filters }),
//         leaveAPI.getLeaveRequests(filters)
//       ]);
//       console.log('Pending Response:', pendingResponse.data.results);
//       setPendingRequests(pendingResponse.data.results || pendingResponse.data);
//       setAllRequests(allResponse.data.results || allResponse.data);
//     } catch (error) {
//       toast.error('Failed to fetch leave requests');
//       console.error('Error fetching leave requests:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApprove = async (requestId, approvalComments = '') => {
//     setActionLoading(true);
//     try {
//       await leaveAPI.approveLeaveRequest(requestId, { comments: approvalComments });
//       toast.success('Leave request approved successfully!');
//       fetchRequests();
//       setShowApprovalModal(false);
//       setShowDetailsModal(false);
//       setComments('');
//     } catch (error) {
//       const errorMessage = error.response?.data?.error || 'Failed to approve leave request';
//       toast.error(errorMessage);
//       console.error('Error approving leave request:', error);
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const handleReject = async (requestId, rejectComments) => {
//     if (!rejectComments.trim()) {
//       toast.error('Rejection reason is required');
//       return;
//     }

//     setActionLoading(true);
//     try {
//       await leaveAPI.rejectLeaveRequest(requestId, { comments: rejectComments });
//       toast.success('Leave request rejected');
//       fetchRequests();
//       setShowRejectionModal(false);
//       setShowDetailsModal(false);
//       setRejectionReason('');
//     } catch (error) {
//       const errorMessage = error.response?.data?.error || 'Failed to reject leave request';
//       toast.error(errorMessage);
//       console.error('Error rejecting leave request:', error);
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const showRequestDetails = (request) => {
//     setSelectedRequest(request);
//     setShowDetailsModal(true);
//   };

//   const getUrgencyColor = (request) => {
//     const today = new Date();
//     const startDate = new Date(request.start_date);
//     const daysUntilStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    
//     if (daysUntilStart <= 1) return 'border-l-red-500 bg-red-50';
//     if (daysUntilStart <= 3) return 'border-l-yellow-500 bg-yellow-50';
//     return 'border-l-green-500 bg-green-50';
//   };

//   const getDaysUntilStart = (startDate) => {
//     const today = new Date();
//     const start = new Date(startDate);
//     return Math.ceil((start - today) / (1000 * 60 * 60 * 24));
//   };

//   const RequestCard = ({ request, showActions = true }) => {
//     const daysUntilStart = getDaysUntilStart(request.start_date);
    
//     return (
//       <div className={`border-l-4 p-4 mb-4 rounded-r-lg shadow-sm ${getUrgencyColor(request)}`}>
//         <div className="flex items-start justify-between">
//           <div className="flex items-start space-x-4 flex-1">
//             <div className="flex-shrink-0">
//               <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
//                 <span className="text-white font-medium text-sm">
//                   {/* {request.employee?.user?.first_name?.[0]}{request.employee?.user?.last_name?.[0]} */}
//                   {request.employee?.user_info?.first_name?.[0]}{request.employee?.user_info?.last_name?.[0]}

//                 </span>
//               </div>
//             </div>
            
//             <div className="flex-1 min-w-0">
//               <div className="flex items-center space-x-2 mb-2">
//                 <h4 className="text-lg font-medium text-gray-900">
//                   {/* {request.employee?.user?.first_name} {request.employee?.user?.last_name} */}
//                   {request.employee?.user_info?.first_name} {request.employee?.user_info?.last_name}

//                 </h4>
//                 <StatusBadge status={request.status} />
//                 {daysUntilStart <= 3 && daysUntilStart >= 0 && (
//                   <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
//                     {daysUntilStart === 0 ? 'Starts Today' : daysUntilStart === 1 ? 'Starts Tomorrow' : `${daysUntilStart} days`}
//                   </span>
//                 )}
//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
//                 <div className="flex items-center">
//                   <CalendarDaysIcon className="h-4 w-4 mr-1" />
//                   <span>{request.leave_type?.name}</span>
//                 </div>
//                 <div className="flex items-center">
//                   <ClockIcon className="h-4 w-4 mr-1" />
//                   <span>{request.days_requested} day{request.days_requested !== 1 ? 's' : ''}</span>
//                 </div>
//                 <div className="col-span-1 md:col-span-1">
//                   <span className="font-medium">
//                     {formatDate(request.start_date)} - {formatDate(request.end_date)}
//                   </span>
//                 </div>
//               </div>
              
//               <div className="text-sm text-gray-700 mb-2">
//                 <span className="font-medium">Reason:</span> 
//                 <span className="ml-1">
//                   {request.reason.length > 100 ? `${request.reason.substring(0, 100)}...` : request.reason}
//                 </span>
//               </div>
              
//               <div className="text-xs text-gray-500">
//                 Applied on {formatDate(request.applied_on)}
//                 {request.employee?.employee_id && (
//                   <span className="ml-3">ID: {request.employee.employee_id}</span>
//                 )}
//               </div>
//             </div>
//           </div>
          
//           <div className="flex items-center space-x-2 ml-4">
//             <button
//               onClick={() => showRequestDetails(request)}
//               className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//               title="View Details"
//             >
//               <EyeIcon className="h-4 w-4" />
//             </button>
            
//             {showActions && request.status === 'PENDING' && (
//               <>
//                 <button
//                   onClick={() => {
//                     setSelectedRequest(request);
//                     setShowApprovalModal(true);
//                   }}
//                   disabled={actionLoading}
//                   className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md shadow-sm bg-white text-sm font-medium text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
//                   title="Approve"
//                 >
//                   <CheckCircleIcon className="h-4 w-4 mr-1" />
//                   Approve
//                 </button>
//                 <button
//                   onClick={() => {
//                     setSelectedRequest(request);
//                     setShowRejectionModal(true);
//                   }}
//                   disabled={actionLoading}
//                   className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm bg-white text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
//                   title="Reject"
//                 >
//                   <XCircleIcon className="h-4 w-4 mr-1" />
//                   Reject
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const handleFilterChange = (key, value) => {
//     setFilters(prev => ({ ...prev, [key]: value }));
//   };

//   const clearFilters = () => {
//     setFilters({ status: '', leave_type: '', employee: '' });
//   };

//   if (loading) {
//     return <LoadingSpinner text="Loading leave requests..." />;
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h3 className="text-lg font-medium text-gray-900">Leave Approvals</h3>
//           <p className="mt-1 text-sm text-gray-500">
//             Review and approve employee leave requests
//           </p>
//         </div>
//         <div className="text-sm text-gray-500">
//           {pendingRequests.length} pending approval{pendingRequests.length !== 1 ? 's' : ''}
//         </div>
//       </div>

//       {/* Quick Actions Alert */}
//       {pendingRequests.length > 0 && (
//         <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
//           <div className="flex">
//             <div className="flex-shrink-0">
//               <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
//             </div>
//             <div className="ml-3">
//               <p className="text-sm text-blue-700">
//                 <span className="font-medium">Action Required:</span> You have{' '}
//                 <span className="font-medium">{pendingRequests.length}</span> pending leave request{pendingRequests.length !== 1 ? 's' : ''} waiting for approval.
//                 {pendingRequests.filter(req => getDaysUntilStart(req.start_date) <= 3).length > 0 && (
//                   <span className="ml-2 font-medium text-red-700">
//                     {pendingRequests.filter(req => getDaysUntilStart(req.start_date) <= 3).length} request{pendingRequests.filter(req => getDaysUntilStart(req.start_date) <= 3).length !== 1 ? 's' : ''} starting soon!
//                   </span>
//                 )}
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Filters */}
//       <div className="bg-gray-50 p-4 rounded-lg">
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
//               <option value="1">Sick Leave</option>
//               <option value="2">Annual Leave</option>
//               <option value="3">Personal Leave</option>
//               <option value="4">Maternity Leave</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
//             <input
//               type="text"
//               value={filters.employee}
//               onChange={(e) => handleFilterChange('employee', e.target.value)}
//               placeholder="Search employee..."
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

//       {/* Tabs */}
//       <div className="border-b border-gray-200">
//         <nav className="-mb-px flex space-x-8">
//           <button
//             onClick={() => setActiveTab('pending')}
//             className={`py-2 px-1 border-b-2 font-medium text-sm ${
//               activeTab === 'pending'
//                 ? 'border-blue-500 text-blue-600'
//                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//             }`}
//           >
//             Pending Approvals ({pendingRequests.length})
//           </button>
//           <button
//             onClick={() => setActiveTab('all')}
//             className={`py-2 px-1 border-b-2 font-medium text-sm ${
//               activeTab === 'all'
//                 ? 'border-blue-500 text-blue-600'
//                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//             }`}
//           >
//             All Requests ({allRequests.length})
//           </button>
//         </nav>
//       </div>

//       {/* Content */}
//       <div>
//         {activeTab === 'pending' ? (
//           pendingRequests.length === 0 ? (
//             <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
//               <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
//               <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
//               <p className="mt-1 text-sm text-gray-500">
//                 All leave requests have been processed.
//               </p>
//             </div>
//           ) : (
//             <div>
//               {/* Urgent requests section */}
//               {pendingRequests.filter(req => getDaysUntilStart(req.start_date) <= 3 && getDaysUntilStart(req.start_date) >= 0).length > 0 && (
//                 <div className="mb-6">
//                   <h4 className="text-md font-medium text-red-700 mb-3 flex items-center">
//                     <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
//                     Urgent - Starting Soon
//                   </h4>
//                   {pendingRequests
//                     .filter(req => getDaysUntilStart(req.start_date) <= 3 && getDaysUntilStart(req.start_date) >= 0)
//                     .map(request => (
//                       <RequestCard key={request.id} request={request} />
//                     ))
//                   }
//                 </div>
//               )}

//               {/* Regular pending requests */}
//               <div>
//                 <h4 className="text-md font-medium text-gray-700 mb-3">Other Pending Requests</h4>
//                 {pendingRequests
//                   .filter(req => getDaysUntilStart(req.start_date) > 3 || getDaysUntilStart(req.start_date) < 0)
//                   .map(request => (
//                     <RequestCard key={request.id} request={request} />
//                   ))
//                 }
//               </div>
//             </div>
//           )
//         ) : (
//           allRequests.length === 0 ? (
//             <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
//               <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
//               <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
//               <p className="mt-1 text-sm text-gray-500">
//                 No leave requests have been submitted yet.
//               </p>
//             </div>
//           ) : (
//             allRequests.map(request => (
//               <RequestCard key={request.id} request={request} showActions={request.status === 'PENDING'} />
//             ))
//           )
//         )}
//       </div>

//       {/* Request Details Modal */}
//       <Modal
//         isOpen={showDetailsModal}
//         onClose={() => setShowDetailsModal(false)}
//         title="Leave Request Details"
//         size="large"
//       >
//         {selectedRequest && (
//           <div className="space-y-6">
//             {/* Employee Information */}
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <div className="flex items-center space-x-4">
//                 <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center">
//                   <span className="text-white font-bold text-xl">
//                     {selectedRequest.employee?.user_info?.first_name?.[0]}{selectedRequest.employee?.user_info?.last_name?.[0]}
//                   </span>
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-medium text-gray-900">
//                     {/* {selectedRequest.employee?.user?.first_name} {selectedRequest.employee?.user?.last_name} */}
//                     {selectedRequest.employee?.user_info?.first_name} {selectedRequest.employee?.user_info?.last_name}

//                   </h3>
//                   <p className="text-sm text-gray-600">{selectedRequest.employee?.employee_id}</p>
//                   <p className="text-sm text-gray-600">{selectedRequest.employee?.position}</p>
//                 </div>
//               </div>
//             </div>

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
//                 <label className="block text-sm font-medium text-gray-700">Applied On</label>
//                 <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.applied_on)}</p>
//               </div>
//             </div>

//             {/* Reason */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
//               <div className="bg-gray-50 p-3 rounded-md">
//                 <p className="text-sm text-gray-900">{selectedRequest.reason}</p>
//               </div>
//             </div>

//             {/* Employee Comments */}
//             {selectedRequest.employee_comments && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Employee Comments</label>
//                 <div className="bg-gray-50 p-3 rounded-md">
//                   <p className="text-sm text-gray-900">{selectedRequest.employee_comments}</p>
//                 </div>
//               </div>
//             )}

//             {/* Supporting Document */}
//             {selectedRequest.supporting_document && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Document</label>
//                 <a
//                   href={selectedRequest.supporting_document}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                 >
//                   <EyeIcon className="h-4 w-4 mr-2" />
//                   View Document
//                 </a>
//               </div>
//             )}

//             {/* Quick Actions */}
//             {selectedRequest.status === 'PENDING' && (
//               <div className="border-t pt-6">
//                 <div className="flex space-x-3">
//                   <button
//                     onClick={() => setShowApprovalModal(true)}
//                     className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
//                   >
//                     <CheckCircleIcon className="h-4 w-4 mr-2" />
//                     Approve
//                   </button>
//                   <button
//                     onClick={() => setShowRejectionModal(true)}
//                     className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
//                   >
//                     <XCircleIcon className="h-4 w-4 mr-2" />
//                     Reject
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </Modal>

//       {/* Approval Modal */}
//       <Modal
//         isOpen={showApprovalModal}
//         onClose={() => setShowApprovalModal(false)}
//         title="Approve Leave Request"
//         size="medium"
//       >
//         {selectedRequest && (
//           <div className="space-y-4">
//             <div className="bg-green-50 p-4 rounded-lg">
//               <p className="text-sm text-green-800">
//                 You are about to approve the leave request for{' '}
//                 <span className="font-medium">
//                   {selectedRequest.employee?.user_info?.first_name} {selectedRequest.employee?.user_info?.last_name}
//                 </span>{' '}
//                 from {formatDate(selectedRequest.start_date)} to {formatDate(selectedRequest.end_date)}.
//               </p>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Approval Comments (Optional)
//               </label>
//               <textarea
//                 value={comments}
//                 onChange={(e) => setComments(e.target.value)}
//                 rows={3}
//                 className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                 placeholder="Add any comments for the employee..."
//               />
//             </div>

//             <div className="flex space-x-3 pt-4">
//               <button
//                 onClick={() => setShowApprovalModal(false)}
//                 className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => handleApprove(selectedRequest.id, comments)}
//                 disabled={actionLoading}
//                 className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
//               >
//                 {actionLoading ? 'Approving...' : 'Approve Request'}
//               </button>
//             </div>
//           </div>
//         )}
//       </Modal>

//       {/* Rejection Modal */}
//       <Modal
//         isOpen={showRejectionModal}
//         onClose={() => setShowRejectionModal(false)}
//         title="Reject Leave Request"
//         size="medium"
//       >
//         {selectedRequest && (
//           <div className="space-y-4">
//             <div className="bg-red-50 p-4 rounded-lg">
//               <p className="text-sm text-red-800">
//                 You are about to reject the leave request for{' '}
//                 <span className="font-medium">
//                   {selectedRequest.employee?.user_info?.first_name} {selectedRequest.employee?.user_info?.last_name}
//                 </span>.
//                 Please provide a clear reason for the rejection.
//               </p>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Rejection Reason *
//               </label>
//               <textarea
//                 value={rejectionReason}
//                 onChange={(e) => setRejectionReason(e.target.value)}
//                 rows={3}
//                 className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                 placeholder="Please explain why this request is being rejected..."
//                 required
//               />
//             </div>

//             <div className="flex space-x-3 pt-4">
//               <button
//                 onClick={() => setShowRejectionModal(false)}
//                 className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => handleReject(selectedRequest.id, rejectionReason)}
//                 disabled={actionLoading || !rejectionReason.trim()}
//                 className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
//               >
//                 {actionLoading ? 'Rejecting...' : 'Reject Request'}
//               </button>
//             </div>
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default LeaveApproval;



import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon,
  ClockIcon,
  UserIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  FireIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { leaveAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const LeaveApproval = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    leave_type: '',
    employee: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [filters]);
  
// // If you need to add the handleCancelRequest function:
// const handleCancelRequest = async (requestId) => {
//   try {
//     setActionLoading(true);
//     // Replace with your actual API call
//     await leaveAPI.cancelLeaveRequest(requestId);
//     toast.success('Leave request cancelled successfully');
//     fetchRequests(); // Refresh the list
//   } catch (error) {
//     const errorMessage = error.response?.data?.error || 'Failed to cancel leave request';
//     toast.error(errorMessage);
//     console.error('Error cancelling leave request:', error);
//   } finally {
//     setActionLoading(false);
//   }
// };
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [pendingResponse, allResponse] = await Promise.all([
        leaveAPI.getLeaveRequests({ status: 'PENDING', ...filters }),
        leaveAPI.getLeaveRequests(filters)
      ]);
      setPendingRequests(pendingResponse.data.results || pendingResponse.data);
      setAllRequests(allResponse.data.results || allResponse.data);
    } catch (error) {
      toast.error('Failed to fetch leave requests');
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, approvalComments = '') => {
    setActionLoading(true);
    try {
      await leaveAPI.approveLeaveRequest(requestId, { comments: approvalComments });
      toast.success('Leave request approved successfully!');
      fetchRequests();
      setShowApprovalModal(false);
      setShowDetailsModal(false);
      setComments('');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to approve leave request';
      toast.error(errorMessage);
      console.error('Error approving leave request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId, rejectComments) => {
    if (!rejectComments.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    setActionLoading(true);
    try {
      await leaveAPI.rejectLeaveRequest(requestId, { comments: rejectComments });
      toast.success('Leave request rejected');
      fetchRequests();
      setShowRejectionModal(false);
      setShowDetailsModal(false);
      setRejectionReason('');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to reject leave request';
      toast.error(errorMessage);
      console.error('Error rejecting leave request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const showRequestDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const getUrgencyColor = (request) => {
    const today = new Date();
    const startDate = new Date(request.start_date);
    const daysUntilStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilStart <= 1) return 'border-l-red-500 bg-gradient-to-r from-red-50 to-pink-50';
    if (daysUntilStart <= 3) return 'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50';
    return 'border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50';
  };

  const getDaysUntilStart = (startDate) => {
    const today = new Date();
    const start = new Date(startDate);
    return Math.ceil((start - today) / (1000 * 60 * 60 * 24));
  };

  const RequestCard = ({ request, showActions = true }) => {
    const daysUntilStart = getDaysUntilStart(request.start_date);
    
    return (
      <div className={`border-l-4 p-8 mb-6 rounded-r-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${getUrgencyColor(request)}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-6 flex-1">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {request.employee?.user_info?.first_name?.[0]}{request.employee?.user_info?.last_name?.[0]}
                </span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-4">
                <h4 className="text-xl font-bold text-gray-900">
                  {request.employee?.user_info?.first_name} {request.employee?.user_info?.last_name}
                </h4>
                <StatusBadge status={request.status} />
                {daysUntilStart <= 3 && daysUntilStart >= 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse shadow-lg">
                    {daysUntilStart === 0 ? 'Starts Today' : daysUntilStart === 1 ? 'Starts Tomorrow' : `${daysUntilStart} days`}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center bg-white/60 p-3 rounded-xl">
                  <CalendarDaysIcon className="h-5 w-5 mr-2 text-blue-500" />
                  <span className="font-semibold">{request.leave_type?.name}</span>
                </div>
                <div className="flex items-center bg-white/60 p-3 rounded-xl">
                  <ClockIcon className="h-5 w-5 mr-2 text-green-500" />
                  <span className="font-semibold">{request.days_requested} day{request.days_requested !== 1 ? 's' : ''}</span>
                </div>
                <div className="col-span-1 md:col-span-1 bg-white/60 p-3 rounded-xl">
                  <span className="font-semibold">
                    {formatDate(request.start_date)} - {formatDate(request.end_date)}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-700 mb-3 bg-white/60 p-4 rounded-xl">
                <span className="font-bold text-gray-900">Reason:</span> 
                <span className="ml-2">
                  {request.reason.length > 100 ? `${request.reason.substring(0, 100)}...` : request.reason}
                </span>
              </div>
              
              <div className="text-xs text-gray-500 bg-white/40 p-3 rounded-xl">
                Applied on {formatDate(request.applied_on)}
                {request.employee?.employee_id && (
                  <span className="ml-4 font-semibold">ID: {request.employee.employee_id}</span>
                )}
              </div>
            </div>
          </div>
          {/* <div className="flex items-center space-x-3 ml-6">
  <button
    onClick={() => showRequestDetails(request)}
    className="inline-flex items-center p-3 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-700 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md"
    title="View Details"
  >
    <EyeIcon className="h-5 w-5" />
  </button>
  
  {showActions && request.status === 'PENDING' && (
    <>
      <button
        onClick={() => {
          setSelectedRequest(request);
          setShowApprovalModal(true);
        }}
        disabled={actionLoading}
        className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 text-green-700 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md disabled:opacity-50"
        title="Approve"
      >
        <CheckCircleIcon className="h-5 w-5 mr-2" />
        Approve
      </button>
      <button
        onClick={() => {
          setSelectedRequest(request);
          setShowRejectionModal(true);
        }}
        disabled={actionLoading}
        className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-red-100 to-pink-100 hover:from-red-200 hover:to-pink-200 text-red-700 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md disabled:opacity-50"
        title="Reject"
      >
        <XCircleIcon className="h-5 w-5 mr-2" />
        Reject
      </button>
    </>
  )}
  
  {(request.status === 'PENDING' || request.status === 'REJECTED') && (
    <button
      onClick={() => handleCancelRequest(request.id)}
      className="inline-flex items-center p-3 bg-gradient-to-r from-red-100 to-pink-100 hover:from-red-200 hover:to-pink-200 text-red-700 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md"
      title="Cancel Request"
    >
      <XCircleIcon className="h-5 w-5" />
    </button>
  )}
</div> */}
          <div className="flex items-center space-x-3 ml-6">
            <button
              onClick={() => showRequestDetails(request)}
              className="inline-flex items-center p-3 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-700 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md"
              title="View Details"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            
            {showActions && request.status === 'PENDING' && (
              <>
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowApprovalModal(true);
                  }}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 text-green-700 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md disabled:opacity-50"
                  title="Approve"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowRejectionModal(true);
                  }}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-red-100 to-pink-100 hover:from-red-200 hover:to-pink-200 text-red-700 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-md disabled:opacity-50"
                  title="Reject"
                >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', leave_type: '', employee: '' });
  };

  if (loading) {
    return <LoadingSpinner text="Loading leave requests..." />;
  }

  return (
    <div className="space-y-10">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-bold text-gray-900">Leave Approvals</h3>
          <p className="mt-2 text-gray-600 text-lg">
            Review and approve employee leave requests
          </p>
        </div>
        <div className="text-lg text-gray-600 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 rounded-2xl border border-blue-200 font-semibold">
          {pendingRequests.length} pending approval{pendingRequests.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Enhanced Quick Actions Alert */}
      {pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-3xl p-8 shadow-lg">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg animate-pulse">
                <BellIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h4 className="text-xl font-bold text-blue-900 mb-2">Action Required</h4>
              <p className="text-blue-700 text-lg">
                You have <span className="font-black text-2xl">{pendingRequests.length}</span> pending leave request{pendingRequests.length !== 1 ? 's' : ''} waiting for approval.
                {pendingRequests.filter(req => getDaysUntilStart(req.start_date) <= 3).length > 0 && (
                  <span className="ml-2 font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full">
                    <FireIcon className="h-4 w-4 inline mr-1" />
                    {pendingRequests.filter(req => getDaysUntilStart(req.start_date) <= 3).length} request{pendingRequests.filter(req => getDaysUntilStart(req.start_date) <= 3).length !== 1 ? 's' : ''} starting soon!
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-3xl border border-gray-200 shadow-md">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
              <option value="1">Sick Leave</option>
              <option value="2">Annual Leave</option>
              <option value="3">Personal Leave</option>
              <option value="4">Maternity Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Employee</label>
            <input
              type="text"
              value={filters.employee}
              onChange={(e) => handleFilterChange('employee', e.target.value)}
              placeholder="Search employee..."
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

      {/* Enhanced Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-2 border-b-4 font-bold text-lg transition-all ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600 bg-gradient-to-t from-blue-50 to-transparent'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-6 w-6" />
              <span>Pending Approvals ({pendingRequests.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-2 border-b-4 font-bold text-lg transition-all ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600 bg-gradient-to-t from-blue-50 to-transparent'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <UserIcon className="h-6 w-6" />
              <span>All Requests ({allRequests.length})</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Enhanced Content */}
      <div>
        {activeTab === 'pending' ? (
          pendingRequests.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl shadow-lg border border-blue-200">
              <div className="p-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                <ClockIcon className="h-16 w-16 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No pending requests</h3>
              <p className="text-gray-600 text-lg">
                All leave requests have been processed. Outstanding work! 🎉
              </p>
            </div>
          ) : (
            <div>
              {/* Urgent requests section */}
              {pendingRequests.filter(req => getDaysUntilStart(req.start_date) <= 3 && getDaysUntilStart(req.start_date) >= 0).length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg">
                      <FireIcon className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-red-700">Urgent - Starting Soon</h4>
                  </div>
                  {pendingRequests
                    .filter(req => getDaysUntilStart(req.start_date) <= 3 && getDaysUntilStart(req.start_date) >= 0)
                    .map(request => (
                      <RequestCard key={request.id} request={request} />
                    ))
                  }
                </div>
              )}

              {/* Regular pending requests */}
              <div>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                    <SparklesIcon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-700">Other Pending Requests</h4>
                </div>
                {pendingRequests
                  .filter(req => getDaysUntilStart(req.start_date) > 3 || getDaysUntilStart(req.start_date) < 0)
                  .map(request => (
                    <RequestCard key={request.id} request={request} />
                  ))
                }
              </div>
            </div>
          )
        ) : (
          allRequests.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl shadow-lg border border-blue-200">
              <div className="p-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                <UserIcon className="h-16 w-16 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No requests found</h3>
              <p className="text-gray-600 text-lg">
                No leave requests have been submitted yet.
              </p>
            </div>
          ) : (
            allRequests.map(request => (
              <RequestCard key={request.id} request={request} showActions={request.status === 'PENDING'} />
            ))
          )
        )}
      </div>

      {/* Enhanced Request Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Leave Request Details"
        size="large"
      >
        {selectedRequest && (
          <div className="space-y-8">
            {/* Employee Information */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
              <div className="flex items-center space-x-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">
                    {selectedRequest.employee?.user_info?.first_name?.[0]}{selectedRequest.employee?.user_info?.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedRequest.employee?.user_info?.first_name} {selectedRequest.employee?.user_info?.last_name}
                  </h3>
                  <p className="text-gray-600 font-semibold">{selectedRequest.employee?.employee_id}</p>
                  <p className="text-gray-600">{selectedRequest.employee?.position}</p>
                </div>
              </div>
            </div>

            {/* Leave Details */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                <label className="block text-sm font-bold text-blue-700 mb-2">Leave Type</label>
                <p className="text-xl font-bold text-gray-900">{selectedRequest.leave_type?.name}</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                <label className="block text-sm font-bold text-green-700 mb-2">Duration</label>
                <p className="text-xl font-bold text-gray-900">
                  {selectedRequest.leave_duration?.replace('_', ' ')}
                </p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200">
                <label className="block text-sm font-bold text-purple-700 mb-2">Start Date</label>
                <p className="text-xl font-bold text-gray-900">{formatDate(selectedRequest.start_date)}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200">
                <label className="block text-sm font-bold text-orange-700 mb-2">End Date</label>
                <p className="text-xl font-bold text-gray-900">{formatDate(selectedRequest.end_date)}</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200">
                <label className="block text-sm font-bold text-yellow-700 mb-2">Days Requested</label>
                <p className="text-xl font-bold text-gray-900">{selectedRequest.days_requested} days</p>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">Applied On</label>
                <p className="text-xl font-bold text-gray-900">{formatDate(selectedRequest.applied_on)}</p>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Reason</label>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
                <p className="text-gray-900 leading-relaxed font-medium">{selectedRequest.reason}</p>
              </div>
            </div>

            {/* Employee Comments */}
            {selectedRequest.employee_comments && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Employee Comments</label>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                  <p className="text-gray-900 leading-relaxed font-medium">{selectedRequest.employee_comments}</p>
                </div>
              </div>
            )}

            {/* Supporting Document */}
            {selectedRequest.supporting_document && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Supporting Document</label>
                <a
                  href={selectedRequest.supporting_document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105"
                >
                  <EyeIcon className="h-5 w-5 mr-2" />
                  View Document
                </a>
              </div>
            )}

            {/* Quick Actions */}
            {selectedRequest.status === 'PENDING' && (
              <div className="border-t pt-8">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    className="flex-1 inline-flex justify-center items-center px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105"
                  >
                    <CheckCircleIcon className="h-6 w-6 mr-2" />
                    Approve Request
                  </button>
                  <button
                    onClick={() => setShowRejectionModal(true)}
                    className="flex-1 inline-flex justify-center items-center px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105"
                  >
                    <XCircleIcon className="h-6 w-6 mr-2" />
                    Reject Request
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Enhanced Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="Approve Leave Request"
        size="medium"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
              <div className="flex items-center space-x-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                <div>
                  <h4 className="text-lg font-bold text-green-800">Confirmation</h4>
                  <p className="text-green-700">
                    You are about to approve the leave request for{' '}
                    <span className="font-bold">
                      {selectedRequest.employee?.user_info?.first_name} {selectedRequest.employee?.user_info?.last_name}
                    </span>{' '}
                    from {formatDate(selectedRequest.start_date)} to {formatDate(selectedRequest.end_date)}.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Approval Comments (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
                placeholder="Add any comments for the employee..."
              />
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-2xl shadow-sm bg-white font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(selectedRequest.id, comments)}
                disabled={actionLoading}
                className="flex-1 inline-flex justify-center items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {actionLoading ? 'Approving...' : 'Approve Request'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Enhanced Rejection Modal */}
      <Modal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        title="Reject Leave Request"
        size="medium"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-2xl border border-red-200">
              <div className="flex items-center space-x-4">
                <XCircleIcon className="h-8 w-8 text-red-600" />
                <div>
                  <h4 className="text-lg font-bold text-red-800">Rejection Notice</h4>
                  <p className="text-red-700">
                    You are about to reject the leave request for{' '}
                    <span className="font-bold">
                      {selectedRequest.employee?.user_info?.first_name} {selectedRequest.employee?.user_info?.last_name}
                    </span>.
                    Please provide a clear reason for the rejection.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
                placeholder="Please explain why this request is being rejected..."
                required
              />
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-2xl shadow-sm bg-white font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedRequest.id, rejectionReason)}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 inline-flex justify-center items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeaveApproval;