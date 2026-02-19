// import React, { useState, useEffect } from 'react';
// import { useForm } from 'react-hook-form';
// import { toast } from 'react-toastify';
// import { 
//   CalendarIcon, 
//   ClockIcon, 
//   UserIcon, 
//   XCircleIcon,
//   FunnelIcon,
//   DocumentChartBarIcon,
//   CheckCircleIcon,
//   ExclamationTriangleIcon,
//   SparklesIcon,
//   PlusIcon,
//   ServerIcon,
//   ArrowPathIcon
// } from '@heroicons/react/24/outline';
// import { attendanceAPI, authAPI } from '../../services/api';
// import { isHRManager, isManager } from '../../utils/auth';
// import { formatDate } from '../../utils/formatters';
// import StatusBadge from '../common/StatusBadge';
// import LoadingSpinner from '../common/LoadingSpinner';
// import Table from '../common/Table';
// import Modal from '../common/Modal';
// import { useTheme } from '../../context/ThemeContext';

// const AttendanceTracker = () => {
//   const { theme } = useTheme();
//   const [attendanceRecords, setAttendanceRecords] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [showApprovalModal, setShowApprovalModal] = useState(false);
//   const [selectedApproval, setSelectedApproval] = useState(null);
//   const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
//   const [userPendingRequests, setUserPendingRequests] = useState([]);
//   const [biometricDevices, setBiometricDevices] = useState([]);
//   const [lastSyncTime, setLastSyncTime] = useState(null);
//   const [isSyncing, setIsSyncing] = useState(false);

//   const [stats, setStats] = useState({
//     totalDays: 0,
//     presentDays: 0,
//     absentDays: 0,
//     lateDays: 0,
//     avgMinutesPerDay: 0,
//     onTimePercent: 0
//   });
//   const [filters, setFilters] = useState({
//     start_date: '',
//     end_date: '',
//     status: '',
//     employee_id: ''
//   });
//   const [use24Hour, setUse24Hour] = useState(false);
//   const [now, setNow] = useState(new Date());
//   const [permissions, setPermissions] = useState([]);

//   // Check if user is HR Manager or Manager - both get management interface
//   const isManagementRole = isHRManager() || isManager();
//   const userRole = isHRManager() ? 'HR_MANAGER' : isManager() ? 'MANAGER' : 'EMPLOYEE';

//   const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
//     defaultValues: {
//       date: new Date().toISOString().split('T')[0],
//       status: 'PRESENT'
//     }
//   });

//   const { register: registerApproval, handleSubmit: handleApprovalSubmit, reset: resetApproval, formState: { errors: approvalErrors } } = useForm();

//   const selectedDate = watch('date');

//   // Load biometric devices
//   useEffect(() => {
//     if (isManagementRole) {
//       fetchBiometricDevices();
//     }
//   }, [isManagementRole]);

//   // Auto-sync biometric data every 1 minute
//   useEffect(() => {
//     if (isManagementRole && biometricDevices.length > 0) {
//       // Sync immediately on mount
//       syncAllBiometricDevices();

//       // Then sync every 1 minute
//       const syncInterval = setInterval(() => {
//         syncAllBiometricDevices();
//       }, 60000); // 60000ms = 1 minute

//       return () => clearInterval(syncInterval);
//     }
//   }, [isManagementRole, biometricDevices]);

//   useEffect(() => {
//     fetchAttendanceRecords();
//     fetchUserPendingRequests();
//   }, [filters]);

//   useEffect(() => {
//     const t = setInterval(() => setNow(new Date()), 1000);
//     return () => clearInterval(t);
//   }, []);

//   // Load effective Django permissions for permission-aware UI
//   useEffect(() => {
//     (async () => {
//       try {
//         const resp = await authAPI.getMyPermissions();
//         setPermissions(Array.isArray(resp?.data?.permissions) ? resp.data.permissions : []);
//       } catch (_) {
//         setPermissions([]);
//       }
//     })();
//   }, []);

//   const hasPerm = (code) => (permissions || []).includes(code);
//   const canViewApprovals = isManagementRole || hasPerm('attendance.view_attendancerecord');
//   const canActOnApprovals = isManagementRole || hasPerm('attendance.change_attendancerecord');

//   const fetchBiometricDevices = async () => {
//     try {
//       const response = await attendanceAPI.getBiometricDevices();
//       const devices = response.data.results || response.data || [];
//       console.log('Fetched biometric devices:', devices);
//       // Filter only active devices
//       setBiometricDevices(devices.filter(d => d.is_active));
//     } catch (error) {
//       console.error('Failed to fetch biometric devices:', error);
//     }
//   };

//   const syncAllBiometricDevices = async () => {
//     if (isSyncing || biometricDevices.length === 0) return;

//     setIsSyncing(true);
//     const today = new Date().toISOString().split('T')[0];
//     let totalSynced = 0;

//     try {
//       // Sync all active devices
//       for (const device of biometricDevices) {
//         try {
//           const response = await attendanceAPI.syncBiometricLogs(device.ip_address, today);
//           totalSynced += response.data.synced_count || 0;
//         } catch (error) {
//           console.error(`Failed to sync device ${device.device_name}:`, error);
//         }
//       }

//       if (totalSynced > 0) {
//         setLastSyncTime(new Date());
//         // Refresh attendance records
//         fetchAttendanceRecords();
//         // Show subtle notification
//         toast.success(`🔄 Auto-synced ${totalSynced} biometric records`, {
//           position: "bottom-right",
//           autoClose: 2000,
//           hideProgressBar: true,
//         });
//       } else {
//         setLastSyncTime(new Date());
//       }
//     } catch (error) {
//       console.error('Biometric auto-sync error:', error);
//     } finally {
//       setIsSyncing(false);
//     }
//   };

//   const fetchAttendanceRecords = async () => {
//     try {
//       setLoading(true);
//       const params = {};
//       if (filters.start_date) params.start_date = filters.start_date;
//       if (filters.end_date) params.end_date = filters.end_date;
//       if (filters.status) params.status = filters.status;
//       if (filters.employee_id) params.employee_id = filters.employee_id;

//       const response = await attendanceAPI.getAttendanceRecords(params);
//       console.log('Fetched attendance records:', response.data);
//       const records = response.data.results || response.data;
//       setAttendanceRecords(Array.isArray(records) ? records : []);

//       // Both HR Manager and Manager get pending approvals count
//       if (isManagementRole && response.data.pending_approvals_count !== undefined) {
//         setPendingApprovalsCount(response.data.pending_approvals_count);
//       }

//       calculateStats(Array.isArray(records) ? records : []);
//     } catch (error) {
//       toast.error('Failed to fetch attendance records');
//       setAttendanceRecords([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchUserPendingRequests = async () => {
//     try {
//       const response = await attendanceAPI.getPendingEdits();
//       setUserPendingRequests(Array.isArray(response.data) ? response.data : []);
//     } catch (error) {
//       console.error('Failed to fetch user pending requests:', error);
//     }
//   };

//   const calculateStats = (records) => {
//     const approvedRecords = records.filter(r => !r.is_pending_approval);
//     const presentDays = approvedRecords.filter(r => r.status === 'PRESENT').length;
//     const absentDays = approvedRecords.filter(r => r.status === 'ABSENT').length;
//     const lateDays = approvedRecords.filter(r => r.status === 'LATE').length;
//     const workingRecords = approvedRecords.filter(r => r.check_in_time && r.check_out_time);
//     let totalMinutes = 0;
//     for (const r of workingRecords) {
//       const start = new Date(`2000-01-01T${r.check_in_time}`);
//       const end = new Date(`2000-01-01T${r.check_out_time}`);
//       totalMinutes += Math.max(0, Math.floor((end - start) / 60000));
//     }
//     const avgMinutesPerDay = workingRecords.length > 0 ? Math.round(totalMinutes / workingRecords.length) : 0;
//     const onTimeBase = presentDays + lateDays;
//     const onTimePercent = onTimeBase > 0 ? Math.round((presentDays / onTimeBase) * 100) : 0;
//     setStats({
//       totalDays: approvedRecords.length,
//       presentDays,
//       absentDays,
//       lateDays,
//       avgMinutesPerDay,
//       onTimePercent
//     });
//   };

//   const minutesToHHMM = (m) => {
//     const h = Math.floor(m / 60);
//     const min = m % 60;
//     return `${h}h ${min}m`;
//   };

//   const to12h = (t) => {
//     const [h, m] = t.split(':');
//     let hh = parseInt(h, 10);
//     const ampm = hh >= 12 ? 'PM' : 'AM';
//     hh = ((hh + 11) % 12) + 1;
//     return `${hh}:${m} ${ampm}`;
//   };

//   const formatTimeDisplay = (t) => {
//     if (!t) return '';
//     return use24Hour ? t : to12h(t);
//   };

//   const onSubmit = async (data) => {
//     setSubmitting(true);
//     try {
//       const existingRecord = attendanceRecords.find(record => 
//         record.date === data.date
//       );

//       if (existingRecord) {
//         if (!data.edit_reason || data.edit_reason.trim() === '') {
//           toast.error('Please provide a reason for editing this attendance record');
//           setSubmitting(false);
//           return;
//         }
//       }

//       const response = await attendanceAPI.markManualAttendance(data);

//       const isPending = response.data?.requires_approval || response.data?.is_pending_approval;

//       if (isPending) {
//         toast.success(response.data?.message || '🎉 Edit request submitted! HR and managers have been notified for approval.');
//       } else {
//         toast.success('✅ Attendance marked successfully!');
//       }

//       reset({
//         date: new Date().toISOString().split('T')[0],
//         status: 'PRESENT'
//       });
//       fetchAttendanceRecords();
//       fetchUserPendingRequests();
//     } catch (error) {
//       toast.error(error.response?.data?.error || 'Failed to process request');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleApprovalAction = async (approvalData) => {
//     setSubmitting(true);
//     try {
//       const requestData = {
//         action: approvalData.action,
//         new_data: approvalData.action === 'approve' ? {
//           check_in_time: approvalData.check_in_time,
//           check_out_time: approvalData.check_out_time,
//           status: approvalData.status,
//           notes: approvalData.notes
//         } : {}
//       };

//       await attendanceAPI.approveEdit(selectedApproval.id, requestData);

//       toast.success(
//         approvalData.action === 'approve' 
//           ? '✅ Edit request approved successfully!' 
//           : '❌ Edit request rejected successfully!'
//       );

//       setShowApprovalModal(false);
//       setSelectedApproval(null);
//       resetApproval();
//       fetchAttendanceRecords();
//     } catch (error) {
//       toast.error(`Failed to ${approvalData.action} edit request`);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const openApprovalModal = (record, action) => {

//     const approval = {
//       id: record.id,
//       employee_name: record.employee?.user_info?.first_name + ' ' + record.employee?.user_info?.last_name,
//       employee_id: record.employee?.employee_id,
//       date: record.date,
//       edit_reason: record.edit_reason,

//       // ORIGINAL VALUES (what was there before edit request)
//       original_check_in_time: record.original_check_in_time || 'Not recorded',
//       original_check_out_time: record.original_check_out_time || 'Not recorded', 
//       original_status: record.original_status || 'Not recorded',
//       original_notes: record.original_notes || 'None',

//       // REQUESTED VALUES (what employee wants to change TO)
//       requested_check_in_time: record.check_in_time,
//       requested_check_out_time: record.check_out_time,
//       requested_status: record.status,
//       requested_notes: record.notes,

//       action: action
//     };

//     setSelectedApproval(approval);
//     setShowApprovalModal(true);

//     if (action === 'approve') {
//       // Pre-fill form with EMPLOYEE'S REQUESTED VALUES
//       resetApproval({
//         check_in_time: record.check_in_time || '',
//         check_out_time: record.check_out_time || '',
//         status: record.status || 'PRESENT',
//         notes: record.notes || '',
//         action: 'approve'
//       });
//     } else {
//       resetApproval({ action: 'reject' });
//     }
//   };

//   const handleFilterChange = (key, value) => {
//     setFilters(prev => ({ ...prev, [key]: value }));
//   };

//   const clearFilters = () => {
//     setFilters({ start_date: '', end_date: '', status: '', employee_id: '' });
//   };

//   const exportAttendance = () => {
//     const csvContent = "data:text/csv;charset=utf-8," + 
//       "Date,Employee,Check In,Check Out,Status,Type,Approval Status\n" +
//       attendanceRecords.map(record => 
//         `${record.date},${record.employee?.user_info?.first_name} ${record.employee?.user_info?.last_name},${record.check_in_time || ''},${record.check_out_time || ''},${record.status},${record.attendance_type},${record.is_pending_approval ? 'Pending' : 'Approved'}`
//       ).join("\n");

//     const encodedUri = encodeURI(csvContent);
//     const link = document.createElement("a");
//     link.setAttribute("href", encodedUri);
//     link.setAttribute("download", "attendance_report.csv");
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const todayStr = new Date().toISOString().split('T')[0];
//   const isPastDate = selectedDate && selectedDate < todayStr;
//   const hasExistingRecord = attendanceRecords.some(record => record.date === selectedDate);
//   const showEditReason = (hasExistingRecord || isPastDate) && !isHRManager();
//   const todayRecord = attendanceRecords.find(r => r.date === todayStr);
//   const computeDurationMinutes = (checkIn, checkOut) => {
//     if (!checkIn) return 0;
//     const start = new Date(`2000-01-01T${checkIn}`);
//     const end = checkOut ? new Date(`2000-01-01T${checkOut}`) : now;
//     return Math.max(0, Math.floor((end - start) / 60000));
//   };
//   const todayDurationMinutes = todayRecord ? computeDurationMinutes(todayRecord.check_in_time, todayRecord.check_out_time) : 0;
//   const pad = (n) => String(n).padStart(2, '0');
//   const formatNow = () => {
//     const h = now.getHours();
//     const m = pad(now.getMinutes());
//     const s = pad(now.getSeconds());
//     if (use24Hour) return `${pad(h)}:${m}:${s}`;
//     const ampm = h >= 12 ? 'PM' : 'AM';
//     const hh = ((h + 11) % 12) + 1;
//     return `${pad(hh)}:${m}:${s} ${ampm}`;
//   };
//   const handleQuickAction = (type) => {
//     if (type === 'clockin') {
//       toast.info('Web Clock-In coming soon');
//     } else if (type === 'wfh') {
//       toast.info('Open Work From Home request page');
//     } else if (type === 'policy') {
//       toast.info('Open Attendance Policy');
//     }
//   };

//   const StatCard = ({ title, value, icon: Icon, gradient, percentage, trend }) => (
//     <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300">
//       <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
//       <div className="relative p-6">
//         <div className="flex items-center justify-between">
//           <div className="flex-1">
//             <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
//             <div className="flex items-baseline space-x-2">
//               <p className="text-3xl font-bold text-gray-900">{value}</p>
//               {percentage !== undefined && (
//                 <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
//                   {percentage}%
//                 </span>
//               )}
//             </div>
//             {trend && (
//               <p className="text-xs text-gray-500 mt-1">{trend}</p>
//             )}
//           </div>
//           <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
//             <Icon className="h-6 w-6 text-white" />
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   const columns = [
//     // Show employee column for both HR Manager and Manager
//     ...(isManagementRole ? [{
//       header: 'Employee',
//       accessor: 'employee',
//       render: (employee) => (
//         <div className="flex items-center">
//           <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3">
//             <span className="text-white text-sm font-medium">
//               {employee?.user_info?.first_name?.[0]}{employee?.user_info?.last_name?.[0]}
//             </span>
//           </div>
//           <div>
//             <div className="text-sm font-medium text-gray-900">
//               {employee?.user_info?.first_name} {employee?.user_info?.last_name}
//             </div>
//             <div className="text-sm text-gray-500">{employee?.employee_id}</div>
//           </div>
//         </div>
//       ),
//     }] : []),
//     {
//       header: 'Date',
//       accessor: 'date',
//       render: (date) => (
//         <div className="flex items-center">
//           <div className="p-1 rounded-lg bg-blue-50 mr-2">
//             <CalendarIcon className="h-4 w-4 text-blue-600" />
//           </div>
//           <span className="font-medium">{formatDate(date)}</span>
//         </div>
//       ),
//     },
//     {
//       header: 'Check In',
//       accessor: 'check_in_time',
//       render: (time) => (
//         <div className="flex items-center">
//           <div className="p-1 rounded-lg bg-green-50 mr-2">
//             <ClockIcon className="h-4 w-4 text-green-600" />
//           </div>
//           <span className={time ? 'text-gray-900 font-medium' : 'text-gray-400'}>
//             {formatTimeDisplay(time) || 'Not checked in'}
//           </span>
//         </div>
//       ),
//     },
//     {
//       header: 'Check Out',
//       accessor: 'check_out_time',
//       render: (time) => (
//         <div className="flex items-center">
//           <div className="p-1 rounded-lg bg-red-50 mr-2">
//             <ClockIcon className="h-4 w-4 text-red-600" />
//           </div>
//           <span className={time ? 'text-gray-900 font-medium' : 'text-gray-400'}>
//             {formatTimeDisplay(time) || 'Not checked out'}
//           </span>
//         </div>
//       ),
//     },
//     {
//       header: 'Status',
//       accessor: 'status',
//       render: (status) => <StatusBadge status={status} />,
//     },
//     {
//       header: 'Type',
//       accessor: 'attendance_type',
//       render: (type) => (
//         <div className="flex items-center">
//           {type === 'BIOMETRIC' && (
//             <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
//               <ServerIcon className="w-3 h-3 mr-1" />
//               Biometric
//             </span>
//           )}
//           {type === 'MANUAL' && (
//             <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
//               Manual
//             </span>
//           )}
//           {type === 'QR_CODE' && (
//             <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
//               QR Code
//             </span>
//           )}
//         </div>
//       ),
//     },
//     {
//       header: 'Approval Status',
//       accessor: 'is_pending_approval',
//       render: (isPending) => {
//         if (isPending) {
//           return (
//             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
//               <ClockIcon className="w-3 h-3 mr-1" />
//               Pending
//             </span>
//           );
//         }
//         return (
//           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
//             <CheckCircleIcon className="w-3 h-3 mr-1" />
//             Approved
//           </span>
//         );
//       },
//     },
//     {
//       header: 'Working Hours',
//       accessor: 'check_in_time',
//       render: (checkIn, row) => {
//         if (!checkIn || !row.check_out_time) return <span className="text-gray-400">-</span>;

//         const checkInTime = new Date(`2000-01-01T${checkIn}`);
//         const checkOutTime = new Date(`2000-01-01T${row.check_out_time}`);
//         const diffMs = checkOutTime - checkInTime;
//         const hours = Math.floor(diffMs / (1000 * 60 * 60));
//         const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

//         return (
//           <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-50 text-blue-800 text-sm font-medium">
//             {hours}h {minutes}m
//           </span>
//         );
//       },
//     },
//   ];

//   if (loading) {
//     return (
//       <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient} flex items-center justify-center`}>
//         <LoadingSpinner text="Loading attendance data..." />
//       </div>
//     );
//   }

//   return (
//     <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient}`}>
//       {/* Hero Section */}
//       <div className={`bg-gradient-to-r ${theme.headerGradient} text-white`}>
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="flex items-center space-x-3 mb-2">
//                 <div className="p-2 bg-white/20 rounded-lg">
//                   <ClockIcon className="h-8 w-8" />
//                 </div>
//                 <div>
//                   <h1 className="text-3xl font-bold">Attendance Tracker</h1>
//                   <p className="text-blue-100 mt-1">
//                     {isHRManager() ? 'Manage attendance for all employees with smart insights' : 
//                      isManager() ? 'Manage attendance for your team with smart insights' : 
//                      'Track your daily attendance and performance'}
//                   </p>
//                 </div>
//               </div>
//               {canViewApprovals && pendingApprovalsCount > 0 && (
//                 <div className="flex items-center space-x-2 mt-3">
//                   <SparklesIcon className="h-5 w-5 text-yellow-300" />
//                   <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
//                     {pendingApprovalsCount} requests waiting for approval
//                   </span>
//                 </div>
//               )}
//               {/* Auto-Sync Status */}
//               {isManagementRole && biometricDevices.length > 0 && (
//                 <div className="flex items-center space-x-2 mt-3">
//                   <div className="flex items-center space-x-2 text-xs bg-white/10 px-3 py-1 rounded-full">
//                     {isSyncing ? (
//                       <>
//                         <ArrowPathIcon className="h-4 w-4 animate-spin" />
//                         <span>Syncing biometric data...</span>
//                       </>
//                     ) : (
//                       <>
//                         <ServerIcon className="h-4 w-4" />
//                         <span>Auto-sync: Active ({biometricDevices.length} devices)</span>
//                         {lastSyncTime && (
//                           <span className="text-blue-200">• Last: {lastSyncTime.toLocaleTimeString()}</span>
//                         )}
//                       </>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="flex space-x-3">
//               <button
//                 onClick={exportAttendance}
//                 className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2"
//               >
//                 <DocumentChartBarIcon className="h-5 w-5" />
//                 <span>Export Data</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Management Role Pending Approvals Alert */}
//         {canViewApprovals && pendingApprovalsCount > 0 && (
//           <div className="mb-8">
//             <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <div className="p-2 bg-amber-100 rounded-xl">
//                     <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
//                   </div>
//                 </div>
//                 <div className="ml-4">
//                   <h3 className="text-lg font-semibold text-amber-900">Action Required</h3>
//                   <p className="text-amber-700 mt-1">
//                     You have <span className="font-bold">{pendingApprovalsCount}</span> attendance edit request{pendingApprovalsCount > 1 ? 's' : ''} waiting for your approval
//                     {(isManager() && !hasPerm('attendance.view_attendancerecord')) ? ' from your team members' : ''}.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Overview Row: Stats Summary, Timings, Actions */}
//         <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
//           {/* Stats Summary */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-semibold text-gray-900">Attendance Stats</h3>
//               <span className="text-xs text-gray-500">This period</span>
//             </div>
//             <div className="grid grid-cols-2 gap-4">
//               <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
//                 <p className="text-xs text-blue-700 font-medium">Avg hrs / day</p>
//                 <div className="mt-1 flex items-center">
//                   <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
//                   <p className="text-lg font-semibold text-blue-900">{minutesToHHMM(stats.avgMinutesPerDay)}</p>
//                 </div>
//               </div>
//               <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
//                 <p className="text-xs text-emerald-700 font-medium">On time arrival</p>
//                 <div className="mt-1 flex items-center">
//                   <CheckCircleIcon className="h-5 w-5 text-emerald-600 mr-2" />
//                   <p className="text-lg font-semibold text-emerald-900">{stats.onTimePercent}%</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Timings */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-semibold text-gray-900">Timings</h3>
//               <div className="flex space-x-1">
//                 {['S','M','T','W','T','F','S'].map((d, idx) => {
//                   const jsDay = new Date().getDay();
//                   // Our array starts Sunday=0 like JS
//                   const active = idx === jsDay;
//                   return (
//                     <span key={idx} className={`text-xs px-2 py-1 rounded-md border ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{d}</span>
//                   );
//                 })}
//               </div>
//             </div>
//             <div className="space-y-2">
//               <p className="text-sm text-gray-600">
//                 Today {todayRecord?.check_in_time ? `(${formatTimeDisplay(todayRecord.check_in_time)}${todayRecord?.check_out_time ? ` - ${formatTimeDisplay(todayRecord.check_out_time)}` : ''})` : '(no check-in)'}
//               </p>
//               <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
//                 {(() => {
//                   const percent = Math.max(0, Math.min(100, Math.round((todayDurationMinutes / (9*60)) * 100)));
//                   return <div className={`h-full bg-gradient-to-r ${theme.primaryGradient}`} style={{ width: `${percent}%` }} />
//                 })()}
//               </div>
//               <div className="flex items-center justify-between text-xs text-gray-500">
//                 <span>Duration: {minutesToHHMM(todayDurationMinutes)}</span>
//                 <span>Target: 9h</span>
//               </div>
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
//               <div className="flex items-center space-x-2 text-xs">
//                 <span className="text-gray-600">24 hour format</span>
//                 <button
//                   type="button"
//                   onClick={() => setUse24Hour(!use24Hour)}
//                   className={`w-10 h-6 rounded-full border transition-colors ${use24Hour ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-200 border-gray-200'}`}
//                 >
//                   <span className={`block h-5 w-5 bg-white rounded-full transform transition-transform ${use24Hour ? 'translate-x-4' : 'translate-x-0'}`} />
//                 </button>
//               </div>
//             </div>
//             <div className="flex items-center justify-between mb-4">
//               <div>
//                 <p className="text-2xl font-bold text-gray-900">{formatNow()}</p>
//                 <p className="text-xs text-gray-500">{new Date().toDateString()}</p>
//               </div>
//             </div>
//             <div className="space-y-2">
//               <button onClick={() => handleQuickAction('clockin')} className="w-full text-left px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center">
//                 <ClockIcon className="h-5 w-5 text-gray-700 mr-2" /> Web Clock-In
//               </button>
//               <button onClick={() => handleQuickAction('wfh')} className="w-full text-left px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center">
//                 <CalendarIcon className="h-5 w-5 text-gray-700 mr-2" /> Work From Home
//               </button>
//               <button onClick={() => handleQuickAction('policy')} className="w-full text-left px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center">
//                 <DocumentChartBarIcon className="h-5 w-5 text-gray-700 mr-2" /> Attendance Policy
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
//           <StatCard
//             title="Total Days"
//             value={stats.totalDays}
//             icon={CalendarIcon}
//             gradient="from-blue-500 to-blue-600"
//             trend="This month"
//           />
//           <StatCard
//             title="Present Days"
//             value={stats.presentDays}
//             icon={UserIcon}
//             gradient="from-emerald-500 to-emerald-600"
//             percentage={stats.totalDays > 0 ? Math.round((stats.presentDays / stats.totalDays) * 100) : 0}
//             trend="Attendance rate"
//           />
//           <StatCard
//             title="Absent Days"
//             value={stats.absentDays}
//             icon={XCircleIcon}
//             gradient="from-red-500 to-red-600"
//             trend="Total absences"
//           />
//           <StatCard
//             title="Late Days"
//             value={stats.lateDays}
//             icon={ClockIcon}
//             gradient="from-amber-500 to-amber-600"
//             trend="Late arrivals"
//           />
//           <StatCard
//             title="Avg Hours / Day"
//             value={minutesToHHMM(stats.avgMinutesPerDay)}
//             icon={ClockIcon}
//             gradient="from-indigo-500 to-indigo-600"
//             trend="Working time"
//           />
//           <StatCard
//             title="On-Time Arrival"
//             value={`${stats.onTimePercent}%`}
//             icon={CheckCircleIcon}
//             gradient="from-teal-500 to-teal-600"
//             trend="Punctuality"
//           />
//         </div>

//         {/* Pending Edit Requests Section - Always show if requests exist, or for regular employees always */}
//         {(!isManagementRole || userPendingRequests.length > 0) && (
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
//             <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
//               <ClockIcon className="h-6 w-6 mr-2 text-amber-500" />
//               Your Pending Edit Requests
//             </h3>

//             {userPendingRequests.length > 0 ? (
//               <div className="space-y-4">
//                 {userPendingRequests
//                   .map((record) => (
//                     <div key={record.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
//                       <div className="flex items-center space-x-4">
//                         <div className="p-2 bg-amber-100 rounded-lg">
//                           <ClockIcon className="h-5 w-5 text-amber-600" />
//                         </div>
//                         <div>
//                           <p className="text-sm font-semibold text-amber-900">
//                             Edit request for {formatDate(record.date)}
//                           </p>
//                           <p className="text-xs text-amber-700 mt-1">
//                             Waiting for {isHRManager() ? 'HR' : 'Manager'} approval
//                           </p>
//                           {record.edit_reason && (
//                             <p className="text-xs text-amber-600 mt-1 italic">
//                               "{record.edit_reason}"
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                       <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
//                         <ClockIcon className="w-3 h-3 mr-1" />
//                         Pending
//                       </span>
//                     </div>
//                   ))}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <div className="p-3 bg-emerald-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
//                   <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
//                 </div>
//                 <p className="text-gray-600 font-medium">All caught up!</p>
//                 <p className="text-sm text-gray-500">No pending edit requests</p>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Management Approval Section - For HR Manager and Manager */}
//         {canViewApprovals && (
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8" data-approvals-section>
//             <div className="flex items-center justify-between mb-6">
//               <h3 className="text-xl font-semibold text-gray-900 flex items-center">
//                 <CheckCircleIcon className="h-6 w-6 mr-2 text-purple-500" />
//                 Pending Approval Requests
//                 {isManager() && <span className="text-sm font-normal text-gray-500 ml-2">(Your Team)</span>}
//               </h3>
//               <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
//                 {attendanceRecords.filter(r => r.is_pending_approval).length} Pending
//               </span>
//             </div>

//             {attendanceRecords.filter(r => r.is_pending_approval).length > 0 ? (
//               <div className="space-y-6">
//                 {attendanceRecords
//                   .filter(record => record.is_pending_approval)
//                   .map((record) => (
//                     <div key={record.id} className="border border-gray-200 rounded-2xl p-6 bg-gradient-to-r from-gray-50 to-blue-50">
//                       <div className="flex justify-between items-start mb-4">
//                         <div className="flex items-center space-x-4">
//                           <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
//                             <span className="text-white font-semibold">
//                               {record.employee?.user_info?.first_name?.[0]}{record.employee?.user_info?.last_name?.[0]}
//                             </span>
//                           </div>
//                           <div>
//                             <h4 className="text-lg font-semibold text-gray-900">
//                               {record.employee?.user_info?.first_name} {record.employee?.user_info?.last_name}
//                             </h4>
//                             <p className="text-sm text-gray-600">Employee ID: {record.employee?.employee_id}</p>
//                             <p className="text-sm text-gray-600">Date: {formatDate(record.date)}</p>
//                           </div>
//                         </div>
//                         <div className="flex space-x-3">
//                           <button
//                             onClick={() => openApprovalModal(record, 'approve')}
//                             disabled={submitting || !canActOnApprovals}
//                             className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center space-x-2"
//                           >
//                             <CheckCircleIcon className="h-4 w-4" />
//                             <span>Approve</span>
//                           </button>
//                           <button
//                             onClick={() => openApprovalModal(record, 'reject')}
//                             disabled={submitting || !canActOnApprovals}
//                             className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center space-x-2"
//                           >
//                             <XCircleIcon className="h-4 w-4" />
//                             <span>Reject</span>
//                           </button>
//                         </div>
//                       </div>

//                       {record.edit_reason && (
//                         <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
//                           <p className="text-sm text-blue-800">
//                             <span className="font-semibold">Employee's Reason:</span> "{record.edit_reason}"
//                           </p>
//                         </div>
//                       )}

//                       {/* Comparison: Original vs Requested */}
//                       <div className="grid grid-cols-2 gap-4">
//                         {/* ORIGINAL VALUES (Before Edit) */}
//                         <div className="bg-red-50 border border-red-200 rounded-xl p-4">
//                           <h5 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
//                             <XCircleIcon className="h-4 w-4 mr-1" />
//                             Original Record (Before Edit)
//                           </h5>
//                           <div className="space-y-2 text-sm">
//                             <div className="flex justify-between">
//                               <span className="text-red-700 font-medium">Check In:</span>
//                               <span className="text-red-900 font-semibold">{record.original_check_in_time || 'Not recorded'}</span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span className="text-red-700 font-medium">Check Out:</span>
//                               <span className="text-red-900 font-semibold">{record.original_check_out_time || 'Not recorded'}</span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span className="text-red-700 font-medium">Status:</span>
//                               <span className="text-red-900 font-semibold">{record.original_status || 'Not recorded'}</span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span className="text-red-700 font-medium">Notes:</span>
//                               <span className="text-red-900 font-semibold">{record.original_notes || 'None'}</span>
//                             </div>
//                           </div>
//                         </div>

//                         {/* REQUESTED VALUES */}
//                         <div className="bg-green-50 border border-green-200 rounded-xl p-4">
//                           <h5 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
//                             <CheckCircleIcon className="h-4 w-4 mr-1" />
//                             Employee's Requested Changes
//                           </h5>
//                           <div className="space-y-2 text-sm">
//                             <div className="flex justify-between">
//                               <span className="text-green-700 font-medium">Check In:</span>
//                               <span className="text-green-900 font-semibold">{record.check_in_time || 'Not recorded'}</span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span className="text-green-700 font-medium">Check Out:</span>
//                               <span className="text-green-900 font-semibold">{record.check_out_time || 'Not recorded'}</span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span className="text-green-700 font-medium">Status:</span>
//                               <span className="text-green-900 font-semibold">{record.status}</span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span className="text-green-700 font-medium">Notes:</span>
//                               <span className="text-green-900 font-semibold">{record.notes || 'None'}</span>
//                             </div>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Action Notice */}
//                       <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
//                         <p className="text-sm text-blue-800 flex items-center">
//                           <SparklesIcon className="h-4 w-4 mr-2" />
//                           <strong>Quick Approve:</strong> Click "Approve" to accept the employee's requested changes (green box above).
//                         </p>
//                       </div>
//                     </div>
//                   ))}
//               </div>
//             ) : (
//               <div className="text-center py-12">
//                 <div className="p-4 bg-emerald-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
//                   <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
//                 </div>
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
//                 <p className="text-gray-600">
//                   No pending approvals {isManager() ? 'from your team ' : ''}at the moment.
//                 </p>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Mark/Edit Attendance Form - Only for Employees (not for HR Manager or Manager) */}
//         {!isManagementRole && (
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center space-x-3">
//                 <div className={`p-2 bg-gradient-to-br ${theme.primaryGradient} rounded-xl`}>
//                   <PlusIcon className="h-6 w-6 text-white" />
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-semibold text-gray-900">
//                     {hasExistingRecord ? 'Edit Attendance' : 'Mark Attendance'}
//                   </h2>
//                   <p className="text-sm text-gray-600">
//                     {hasExistingRecord ? 'Update your existing attendance record' : 'Record your daily attendance'}
//                   </p>
//                 </div>
//               </div>
//               {hasExistingRecord && (
//                 <div className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium border border-amber-200">
//                   ⚠️ Requires Approval
//                 </div>
//               )}
//             </div>

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//               <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
//                   <input
//                     {...register('date', { required: 'Date is required' })}
//                     type="date"
//                     className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                     max={new Date().toISOString().split('T')[0]}
//                   />
//                   {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">Check In Time</label>
//                   <input
//                     {...register('check_in_time')}
//                     type="time"
//                     className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">Check Out Time</label>
//                   <input
//                     {...register('check_out_time')}
//                     type="time"
//                     className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
//                   <select
//                     {...register('status', { required: 'Status is required' })}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                   >
//                     <option value="PRESENT">Present</option>
//                     <option value="ABSENT">Absent</option>
//                     <option value="LATE">Late</option>
//                     <option value="HALF_DAY">Half Day</option>
//                   </select>
//                   {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
//                   <input
//                     {...register('notes')}
//                     type="text"
//                     placeholder="Optional notes..."
//                     className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                   />
//                 </div>
//               </div>

//               {/* Edit Reason Field - Only show if editing existing record OR past date */}
//               {showEditReason && (
//                 <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
//                   <label className="block text-sm font-semibold text-amber-800 mb-2">
//                     Reason for Edit <span className="text-red-500">*</span>
//                   </label>
//                   <textarea
//                     {...register('edit_reason', { 
//                       required: showEditReason ? 'Reason is required for editing or adding past attendance' : false 
//                     })}
//                     rows={3}
//                     placeholder="Please explain why you need to edit this attendance record..."
//                     className="w-full px-4 py-3 border border-amber-300 rounded-xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white"
//                   />
//                   {errors.edit_reason && <p className="text-red-500 text-sm mt-1">{errors.edit_reason.message}</p>}
//                   <p className="text-xs text-amber-700 mt-2 flex items-center">
//                     <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
//                     This edit request will be sent to HR and your manager for approval.
//                   </p>
//                 </div>
//               )}

//               <div className="flex justify-end">
//                 <button
//                   type="submit"
//                   disabled={submitting}
//                   className={`bg-gradient-to-r ${theme.primaryGradient} hover:opacity-90 text-white px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
//                 >
//                   {submitting ? (
//                     <>
//                       <LoadingSpinner size="small" />
//                       <span>
//                         {hasExistingRecord ? 'Submitting Edit...' : 'Marking...'}
//                       </span>
//                     </>
//                   ) : (
//                     <>
//                       {hasExistingRecord ? (
//                         <CheckCircleIcon className="h-5 w-5" />
//                       ) : (
//                         <PlusIcon className="h-5 w-5" />
//                       )}
//                       <span>{hasExistingRecord ? 'Submit Edit Request' : 'Mark Attendance'}</span>
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         )}

//         {/* Filters */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
//           <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
//             <FunnelIcon className="h-5 w-5 mr-2 text-purple-500" />
//             Filter Records
//           </h3>
//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
//               <input
//                 type="date"
//                 value={filters.start_date}
//                 onChange={(e) => handleFilterChange('start_date', e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
//               <input
//                 type="date"
//                 value={filters.end_date}
//                 onChange={(e) => handleFilterChange('end_date', e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
//               <select
//                 value={filters.status}
//                 onChange={(e) => handleFilterChange('status', e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//               >
//                 <option value="">All Status</option>
//                 <option value="PRESENT">Present</option>
//                 <option value="ABSENT">Absent</option>
//                 <option value="LATE">Late</option>
//                 <option value="HALF_DAY">Half Day</option>
//               </select>
//             </div>

//             <div className="flex items-end">
//               <button
//                 onClick={clearFilters}
//                 className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center space-x-2"
//               >
//                 <FunnelIcon className="h-4 w-4" />
//                 <span>Clear Filters</span>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Attendance Records */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//           <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
//             <div className="flex items-center justify-between">
//               <h3 className="text-xl font-semibold text-gray-900 flex items-center">
//                 <DocumentChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
//                 Attendance Records
//                 {isManager() && <span className="text-sm font-normal text-gray-500 ml-2">(Your Team)</span>}
//               </h3>
//               <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white px-3 py-1 rounded-lg border">
//                 <CalendarIcon className="h-4 w-4" />
//                 <span className="font-medium">{attendanceRecords.length} records</span>
//               </div>
//             </div>
//           </div>

//           <Table
//             columns={columns}
//             data={attendanceRecords}
//             loading={loading}
//             emptyMessage={
//               isManager() 
//                 ? "No attendance records found for your team" 
//                 : "No attendance records found"
//             }
//           />
//         </div>

//         {/* Approval Modal */}
//         <Modal
//           isOpen={showApprovalModal}
//           onClose={() => {
//             setShowApprovalModal(false);
//             setSelectedApproval(null);
//             resetApproval();
//           }}
//           title={
//             <div className="flex items-center space-x-2">
//               {selectedApproval?.action === 'approve' ? (
//                 <CheckCircleIcon className="h-6 w-6 text-green-600" />
//               ) : (
//                 <XCircleIcon className="h-6 w-6 text-red-600" />
//               )}
//               <span>{selectedApproval?.action === 'approve' ? 'Review & Approve Edit Request' : 'Reject Edit Request'}</span>
//             </div>
//           }
//         >
//           {selectedApproval && (
//             <form onSubmit={handleApprovalSubmit(handleApprovalAction)}>
//               <div className="mb-6">
//                 <div className="flex items-center space-x-4 mb-4">
//                   <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
//                     <span className="text-white font-semibold">
//                       {(attendanceRecords.biometric_user_name || selectedApproval.employee_name)
//                     ?.split(' ')
//                     .map(n => n[0])
//                     .join('')}
//                     </span>
//                   </div>
//                   <div>
//                     <h4 className="font-semibold text-gray-900 text-lg">
//                       {selectedApproval.employee_name}
//                     </h4>
//                     <p className="text-sm text-gray-600">
//                       {/* {formatDate(selectedApproval.date)} • Employee ID: {selectedApproval.employee_id} */}
//                       {formatDate(selectedApproval.date)} • Employee ID: {
//   attendanceRecords.biometric_user_id || selectedApproval.employee_id
// }
//                     </p>
//                   </div>
//                 </div>

//                 {selectedApproval.edit_reason && (
//                   <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
//                     <p className="text-sm text-blue-800">
//                       <span className="font-semibold">Employee's Reason:</span> "{selectedApproval.edit_reason}"
//                     </p>
//                   </div>
//                 )}

//                 {/* Show comparison between ORIGINAL and REQUESTED */}
//                 <div className="grid grid-cols-2 gap-4 mb-6">
//                   {/* ORIGINAL VALUES */}
//                   <div className="bg-red-50 border border-red-200 rounded-xl p-4">
//                     <h5 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
//                       <XCircleIcon className="h-4 w-4 mr-1" />
//                       Original Record (Before Edit)
//                     </h5>
//                     <div className="space-y-2 text-sm">
//                       <div className="flex justify-between">
//                         <span className="text-red-700 font-medium">Check In:</span>
//                         <span className="text-red-900 font-semibold">{selectedApproval.original_check_in_time}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-red-700 font-medium">Check Out:</span>
//                         <span className="text-red-900 font-semibold">{selectedApproval.original_check_out_time}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-red-700 font-medium">Status:</span>
//                         <span className="text-red-900 font-semibold">{selectedApproval.original_status}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-red-700 font-medium">Notes:</span>
//                         <span className="text-red-900 font-semibold">{selectedApproval.original_notes}</span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* REQUESTED VALUES */}
//                   <div className="bg-green-50 border border-green-200 rounded-xl p-4">
//                     <h5 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
//                       <CheckCircleIcon className="h-4 w-4 mr-1" />
//                       Employee's Requested Changes
//                     </h5>
//                     <div className="space-y-2 text-sm">
//                       <div className="flex justify-between">
//                         <span className="text-green-700 font-medium">Check In:</span>
//                         <span className="text-green-900 font-semibold">{selectedApproval.requested_check_in_time || 'Not recorded'}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-green-700 font-medium">Check Out:</span>
//                         <span className="text-green-900 font-semibold">{selectedApproval.requested_check_out_time || 'Not recorded'}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-green-700 font-medium">Status:</span>
//                         <span className="text-green-900 font-semibold">{selectedApproval.requested_status}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-green-700 font-medium">Notes:</span>
//                         <span className="text-green-900 font-semibold">{selectedApproval.requested_notes || 'None'}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {selectedApproval.action === 'approve' ? (
//                 <div className="space-y-4">
//                   <div className="bg-green-50 border border-green-200 rounded-xl p-4">
//                     <h5 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
//                       <CheckCircleIcon className="h-4 w-4 mr-1" />
//                       Review & Approve Employee's Changes
//                     </h5>
//                     <p className="text-sm text-green-700 mb-2">
//                       ✅ The form below is pre-filled with the employee's requested changes.
//                     </p>
//                     <p className="text-xs text-green-600">
//                       💡 You can modify these values if corrections are needed before approving.
//                     </p>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">Check In Time</label>
//                       <input
//                         {...registerApproval('check_in_time')}
//                         type="time"
//                         className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">Check Out Time</label>
//                       <input
//                         {...registerApproval('check_out_time')}
//                         type="time"
//                         className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
//                       />
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
//                       <select
//                         {...registerApproval('status', { required: 'Status is required' })}
//                         className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
//                       >
//                         <option value="PRESENT">Present</option>
//                         <option value="ABSENT">Absent</option>
//                         <option value="LATE">Late</option>
//                         <option value="HALF_DAY">Half Day</option>
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
//                       <input
//                         {...registerApproval('notes')}
//                         type="text"
//                         placeholder="Add any notes..."
//                         className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="mb-4">
//                   <div className="bg-red-50 border border-red-200 rounded-xl p-4">
//                     <p className="text-sm text-red-800 flex items-center">
//                       <XCircleIcon className="h-4 w-4 mr-2" />
//                       Are you sure you want to reject this attendance edit request? 
//                       The employee will need to resubmit if they want to make changes.
//                     </p>
//                   </div>
//                 </div>
//               )}

//               <input type="hidden" {...registerApproval('action')} />

//               <div className="flex space-x-3 pt-6">
//                 <button
//                   type="submit"
//                   disabled={submitting}
//                   className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center space-x-2 ${
//                     selectedApproval.action === 'approve'
//                       ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
//                       : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
//                   }`}
//                 >
//                   {submitting ? (
//                     <>
//                       <LoadingSpinner size="small" />
//                       <span>Processing...</span>
//                     </>
//                   ) : (
//                     <>
//                       {selectedApproval.action === 'approve' ? (
//                         <>
//                           <CheckCircleIcon className="h-5 w-5" />
//                           <span>Approve Changes</span>
//                         </>
//                       ) : (
//                         <>
//                           <XCircleIcon className="h-5 w-5" />
//                           <span>Reject Request</span>
//                         </>
//                       )}
//                     </>
//                   )}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowApprovalModal(false);
//                     setSelectedApproval(null);
//                     resetApproval();
//                   }}
//                   className="flex-1 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           )}
//         </Modal>

//         {/* Floating Action Button for Management Roles - Quick Access to Approvals */}
//         {isManagementRole && attendanceRecords.filter(r => r.is_pending_approval).length > 0 && (
//           <div className="fixed bottom-6 right-6 z-50">
//             <button
//               onClick={() => {
//                 document.querySelector('[data-approvals-section]')?.scrollIntoView({ behavior: 'smooth' });
//               }}
//               className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-full p-4 shadow-lg transition-all transform hover:scale-105"
//               title={`${attendanceRecords.filter(r => r.is_pending_approval).length} pending approvals`}
//             >
//               <div className="relative">
//                 <ClockIcon className="h-6 w-6" />
//                 <span className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full text-xs font-bold w-6 h-6 flex items-center justify-center border-2 border-red-500">
//                   {attendanceRecords.filter(r => r.is_pending_approval).length}
//                 </span>
//               </div>
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AttendanceTracker;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  XCircleIcon,
  FunnelIcon,
  DocumentChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  PlusIcon,
  ServerIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { attendanceAPI, authAPI } from '../../services/api';
import { isHRManager, isManager } from '../../utils/auth';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import Table from '../common/Table';
import Modal from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';

const AttendanceTracker = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [userPendingRequests, setUserPendingRequests] = useState([]);
  const [biometricDevices, setBiometricDevices] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    avgMinutesPerDay: 0,
    onTimePercent: 0
  });
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0], // Default to today's date YYYY-MM-DD
    status: '',
    employee_id: ''
  });
  const [use24Hour, setUse24Hour] = useState(false);
  const [now, setNow] = useState(new Date());
  const [permissions, setPermissions] = useState([]);

  // Check if user is HR Manager or Manager - both get management interface
  const isManagementRole = isHRManager() || isManager();
  const userRole = isHRManager() ? 'HR_MANAGER' : isManager() ? 'MANAGER' : 'EMPLOYEE';

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      status: 'PRESENT'
    }
  });

  const { register: registerApproval, handleSubmit: handleApprovalSubmit, reset: resetApproval, formState: { errors: approvalErrors } } = useForm();

  const selectedDate = watch('date');

  // Load biometric devices
  useEffect(() => {
    if (isManagementRole) {
      fetchBiometricDevices();
    }
  }, [isManagementRole]);

  // Auto-sync biometric data every 1 minute
  useEffect(() => {
    if (isManagementRole && biometricDevices.length > 0) {
      // Sync immediately on mount
      syncAllBiometricDevices();

      // Then sync every 1 minute
      const syncInterval = setInterval(() => {
        syncAllBiometricDevices();
      }, 60000); // 60000ms = 1 minute

      return () => clearInterval(syncInterval);
    }
  }, [isManagementRole, biometricDevices]);

  useEffect(() => {
    fetchAttendanceRecords();
    fetchUserPendingRequests();
  }, [filters]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load effective Django permissions for permission-aware UI
  useEffect(() => {
    (async () => {
      try {
        const resp = await authAPI.getMyPermissions();
        setPermissions(Array.isArray(resp?.data?.permissions) ? resp.data.permissions : []);
      } catch (_) {
        setPermissions([]);
      }
    })();
  }, []);

  const hasPerm = (code) => (permissions || []).includes(code);
  const canViewApprovals = isManagementRole || hasPerm('attendance.view_attendancerecord');
  const canActOnApprovals = isManagementRole || hasPerm('attendance.change_attendancerecord');

  const fetchBiometricDevices = async () => {
    try {
      const response = await attendanceAPI.getBiometricDevices();
      const devices = response.data.results || response.data || [];
      console.log('Fetched biometric devices:', devices);
      // Filter only active devices
      setBiometricDevices(devices.filter(d => d.is_active));
    } catch (error) {
      console.error('Failed to fetch biometric devices:', error);
    }
  };

  const syncAllBiometricDevices = async () => {
    if (isSyncing || biometricDevices.length === 0) return;

    setIsSyncing(true);
    const today = new Date().toISOString().split('T')[0];
    let totalSynced = 0;

    try {
      // Sync all active devices
      for (const device of biometricDevices) {
        try {
          const response = await attendanceAPI.syncBiometricLogs(device.ip_address, today);
          totalSynced += response.data.synced_count || 0;
        } catch (error) {
          console.error(`Failed to sync device ${device.device_name}:`, error);
        }
      }

      if (totalSynced > 0) {
        setLastSyncTime(new Date());
        // Refresh attendance records
        fetchAttendanceRecords();
        // Show subtle notification
        toast.success(`🔄 Auto-synced ${totalSynced} biometric records`, {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: true,
        });
      } else {
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error('Biometric auto-sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.date) {
        // Use the selected date for both start and end to get records for that specific day
        params.start_date = filters.date;
        params.end_date = filters.date;
      }

      if (filters.status) params.status = filters.status;
      if (filters.employee_id) params.employee_id = filters.employee_id;

      const response = await attendanceAPI.getAttendanceRecords(params);
      console.log('Fetched attendance records:', response.data);
      const records = response.data.results || response.data;
      setAttendanceRecords(Array.isArray(records) ? records : []);

      // Both HR Manager and Manager get pending approvals count
      if (isManagementRole && response.data.pending_approvals_count !== undefined) {
        setPendingApprovalsCount(response.data.pending_approvals_count);
      }

      const targetId = filters.employee_id || user?.employee_id;
      const recordsToStat = Array.isArray(records)
        ? records.filter(r => {
          const rEmpId = r.employee?.id || r.employee_id || r.employee;
          return String(rEmpId) === String(targetId);
        })
        : [];
      calculateStats(recordsToStat);
    } catch (error) {
      toast.error('Failed to fetch attendance records');
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPendingRequests = async () => {
    try {
      const response = await attendanceAPI.getPendingEdits();
      setUserPendingRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch user pending requests:', error);
    }
  };
  const isLate = (checkInTime) => {
    if (!checkInTime) return false;
    const [hours, minutes, seconds] = checkInTime.split(':').map(Number);
    return hours > 10 || (hours === 10 && (minutes > 0 || seconds > 0));
  };

  const calculateStats = (records) => {
    const approvedRecords = records.filter(r => !r.is_pending_approval);
    const presentDays = approvedRecords.filter(r => r.status === 'PRESENT' && !isLate(r.check_in_time)).length;
    const absentDays = approvedRecords.filter(r => r.status === 'ABSENT').length;
    const lateDays = approvedRecords.filter(r => r.status === 'LATE' || isLate(r.check_in_time)).length;
    const workingRecords = approvedRecords.filter(r => r.check_in_time && r.check_out_time);
    let totalMinutes = 0;
    for (const r of workingRecords) {
      const start = new Date(`2000-01-01T${r.check_in_time}`);
      const end = new Date(`2000-01-01T${r.check_out_time}`);
      totalMinutes += Math.max(0, Math.floor((end - start) / 60000));
    }
    const avgMinutesPerDay = workingRecords.length > 0 ? Math.round(totalMinutes / workingRecords.length) : 0;
    const onTimeBase = presentDays + lateDays;
    const onTimePercent = onTimeBase > 0 ? Math.round((presentDays / onTimeBase) * 100) : 0;
    setStats({
      totalDays: approvedRecords.length,
      presentDays,
      absentDays,
      lateDays,
      avgMinutesPerDay,
      onTimePercent
    });
  };

  const minutesToHHMM = (m) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h}h ${min}m`;
  };

  const to12h = (t) => {
    const [h, m] = t.split(':');
    let hh = parseInt(h, 10);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = ((hh + 11) % 12) + 1;
    return `${hh}:${m} ${ampm}`;
  };

  const formatTimeDisplay = (t) => {
    if (!t) return '';
    return use24Hour ? t : to12h(t);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const existingRecord = attendanceRecords.find(record =>
        record.date === data.date && (record.employee?.id === user?.employee_id || record.employee_id === user?.employee_id)
      );

      if (existingRecord) {
        if (!data.edit_reason || data.edit_reason.trim() === '') {
          toast.error('Please provide a reason for editing this attendance record');
          setSubmitting(false);
          return;
        }
      }

      const response = await attendanceAPI.markManualAttendance(data);

      const isPending = response.data?.requires_approval || response.data?.is_pending_approval;

      if (isPending) {
        toast.success(response.data?.message || '🎉 Edit request submitted! HR and managers have been notified for approval.');
      } else {
        toast.success('✅ Attendance marked successfully!');
      }

      reset({
        date: new Date().toISOString().split('T')[0],
        status: 'PRESENT'
      });
      fetchAttendanceRecords();
      fetchUserPendingRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovalAction = async (approvalData) => {
    setSubmitting(true);
    try {
      const requestData = {
        action: approvalData.action,
        new_data: approvalData.action === 'approve' ? {
          check_in_time: approvalData.check_in_time,
          check_out_time: approvalData.check_out_time,
          status: approvalData.status,
          notes: approvalData.notes
        } : {}
      };

      await attendanceAPI.approveEdit(selectedApproval.id, requestData);

      toast.success(
        approvalData.action === 'approve'
          ? '✅ Edit request approved successfully!'
          : '❌ Edit request rejected successfully!'
      );

      setShowApprovalModal(false);
      setSelectedApproval(null);
      resetApproval();
      fetchAttendanceRecords();
    } catch (error) {
      toast.error(`Failed to ${approvalData.action} edit request`);
    } finally {
      setSubmitting(false);
    }
  };

  const openApprovalModal = (record, action) => {
    const approval = {
      id: record.id,
      // ✅ Use display_name and display_id from API
      employee_name: record.display_name || 'Unknown',
      employee_id: record.display_id || 'N/A',
      date: record.date,
      edit_reason: record.edit_reason,

      // ORIGINAL VALUES (what was there before edit request)
      original_check_in_time: record.original_check_in_time || 'Not recorded',
      original_check_out_time: record.original_check_out_time || 'Not recorded',
      original_status: record.original_status || 'Not recorded',
      original_notes: record.original_notes || 'None',

      // REQUESTED VALUES (what employee wants to change TO)
      requested_check_in_time: record.check_in_time,
      requested_check_out_time: record.check_out_time,
      requested_status: record.status,
      requested_notes: record.notes,

      action: action
    };

    setSelectedApproval(approval);
    setShowApprovalModal(true);

    if (action === 'approve') {
      // Pre-fill form with EMPLOYEE'S REQUESTED VALUES
      resetApproval({
        check_in_time: record.check_in_time || '',
        check_out_time: record.check_out_time || '',
        status: record.status || 'PRESENT',
        notes: record.notes || '',
        action: 'approve'
      });
    } else {
      resetApproval({ action: 'reject' });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ date: new Date().toISOString().split('T')[0], status: '', employee_id: '' });
  };

  const exportAttendance = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Date,Employee,Employee ID,Check In,Check Out,Status,Type,Approval Status\n" +
      attendanceRecords.map(record =>
        `${record.date},${record.display_name || 'Unknown'},${record.display_id || 'N/A'},${record.check_in_time || ''},${record.check_out_time || ''},${record.status},${record.attendance_type},${record.is_pending_approval ? 'Pending' : 'Approved'}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isPastDate = selectedDate && selectedDate < todayStr;
  const hasExistingRecord = attendanceRecords.some(record => record.date === selectedDate);
  const showEditReason = (hasExistingRecord || isPastDate) && !isHRManager();
  const todayRecord = attendanceRecords.find(r => r.date === todayStr);
  const computeDurationMinutes = (checkIn, checkOut) => {
    if (!checkIn) return 0;
    const start = new Date(`2000-01-01T${checkIn}`);
    const end = checkOut ? new Date(`2000-01-01T${checkOut}`) : now;
    return Math.max(0, Math.floor((end - start) / 60000));
  };
  const todayDurationMinutes = todayRecord ? computeDurationMinutes(todayRecord.check_in_time, todayRecord.check_out_time) : 0;
  const pad = (n) => String(n).padStart(2, '0');
  const formatNow = () => {
    const h = now.getHours();
    const m = pad(now.getMinutes());
    const s = pad(now.getSeconds());
    if (use24Hour) return `${pad(h)}:${m}:${s}`;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = ((h + 11) % 12) + 1;
    return `${pad(hh)}:${m}:${s} ${ampm}`;
  };
  const handleQuickAction = (type) => {
    if (type === 'clockin') {
      toast.info('Web Clock-In coming soon');
    } else if (type === 'wfh') {
      navigate('/work-from-home');
    } else if (type === 'policy') {
      toast.info('Open Attendance Policy');
    }
  };

  const StatCard = ({ title, value, icon: Icon, gradient, percentage, trend }) => (
    <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {percentage !== undefined && (
                <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {percentage}%
                </span>
              )}
            </div>
            {trend && (
              <p className="text-xs text-gray-500 mt-1">{trend}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );

  const columns = [
    // ✅ UPDATED: Show employee column for both HR Manager and Manager with biometric support
    ...(isManagementRole ? [{
      header: 'Employee',
      accessor: 'employee',
      render: (employee, row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3">
            <span className="text-white text-sm font-medium">
              {employee ? (
                // Has employee record - use employee name
                `${employee?.user_info?.first_name?.[0] || ''}${employee?.user_info?.last_name?.[0] || ''}`
              ) : (
                // No employee - use biometric name or ID
                row.biometric_user_name?.split(' ').map(n => n[0]).join('') ||
                row.biometric_user_id?.substring(0, 2) ||
                'N/A'
              )}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {/* ✅ Use display_name from API - handles both employee and biometric */}
              {row.display_name || 'Unknown'}
            </div>
            <div className="text-sm text-gray-500">
              {/* ✅ Use display_id from API - handles both cases */}
              {row.display_id || 'N/A'}
            </div>
          </div>
        </div>
      ),
    }] : []),
    {
      header: 'Date',
      accessor: 'date',
      render: (date) => (
        <div className="flex items-center">
          <div className="p-1 rounded-lg bg-blue-50 mr-2">
            <CalendarIcon className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-medium">{formatDate(date)}</span>
        </div>
      ),
    },
    {
      header: 'Check In',
      accessor: 'check_in_time',
      render: (time) => (
        <div className="flex items-center">
          <div className="p-1 rounded-lg bg-green-50 mr-2">
            <ClockIcon className="h-4 w-4 text-green-600" />
          </div>
          <span className={time ? 'text-gray-900 font-medium' : 'text-gray-400'}>
            {formatTimeDisplay(time) || 'Not checked in'}
          </span>
        </div>
      ),
    },
    {
      header: 'Check Out',
      accessor: 'check_out_time',
      render: (time) => (
        <div className="flex items-center">
          <div className="p-1 rounded-lg bg-red-50 mr-2">
            <ClockIcon className="h-4 w-4 text-red-600" />
          </div>
          <span className={time ? 'text-gray-900 font-medium' : 'text-gray-400'}>
            {formatTimeDisplay(time) || 'Not checked out'}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      header: 'Type',
      accessor: 'attendance_type',
      render: (type) => (
        <div className="flex items-center">
          {type === 'BIOMETRIC' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
              <ServerIcon className="w-3 h-3 mr-1" />
              Biometric
            </span>
          )}
          {type === 'MANUAL' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              Manual
            </span>
          )}
          {type === 'QR_CODE' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              QR Code
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Approval Status',
      accessor: 'is_pending_approval',
      render: (isPending) => {
        if (isPending) {
          return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
              <ClockIcon className="w-3 h-3 mr-1" />
              Pending
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      },
    },
    {
      header: 'Working Hours',
      accessor: 'check_in_time',
      render: (checkIn, row) => {
        if (!checkIn || !row.check_out_time) return <span className="text-gray-400">-</span>;

        const checkInTime = new Date(`2000-01-01T${checkIn}`);
        const checkOutTime = new Date(`2000-01-01T${row.check_out_time}`);
        const diffMs = checkOutTime - checkInTime;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return (
          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-50 text-blue-800 text-sm font-medium">
            {hours}h {minutes}m
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient} flex items-center justify-center`}>
        <LoadingSpinner text="Loading attendance data..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient}`}>
      {/* Hero Section */}
      <div className={`bg-gradient-to-r ${theme.headerGradient} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <ClockIcon className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Attendance Tracker</h1>
                  <p className="text-blue-100 mt-1">
                    {isHRManager() ? 'Manage attendance for all employees with smart insights' :
                      isManager() ? 'Manage attendance for your team with smart insights' :
                        'Track your daily attendance and performance'}
                  </p>
                </div>
              </div>
              {canViewApprovals && pendingApprovalsCount > 0 && (
                <div className="flex items-center space-x-2 mt-3">
                  <SparklesIcon className="h-5 w-5 text-yellow-300" />
                  <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                    {pendingApprovalsCount} requests waiting for approval
                  </span>
                </div>
              )}
              {/* Auto-Sync Status */}
              {isManagementRole && biometricDevices.length > 0 && (
                <div className="flex items-center space-x-2 mt-3">
                  <div className="flex items-center space-x-2 text-xs bg-white/10 px-3 py-1 rounded-full">
                    {isSyncing ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        <span>Syncing biometric data...</span>
                      </>
                    ) : (
                      <>
                        <ServerIcon className="h-4 w-4" />
                        <span>Auto-sync: Active ({biometricDevices.length} devices)</span>
                        {lastSyncTime && (
                          <span className="text-blue-200">• Last: {lastSyncTime.toLocaleTimeString()}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={exportAttendance}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2"
              >
                <DocumentChartBarIcon className="h-5 w-5" />
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Management Role Pending Approvals Alert */}
        {canViewApprovals && pendingApprovalsCount > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-amber-900">Action Required</h3>
                  <p className="text-amber-700 mt-1">
                    You have <span className="font-bold">{pendingApprovalsCount}</span> attendance edit request{pendingApprovalsCount > 1 ? 's' : ''} waiting for your approval
                    {(isManager() && !hasPerm('attendance.view_attendancerecord')) ? ' from your team members' : ''}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview Row: Stats Summary, Timings, Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
          {/* Stats Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Attendance Stats</h3>
              <span className="text-xs text-gray-500">This period</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs text-blue-700 font-medium">Avg hrs / day</p>
                <div className="mt-1 flex items-center">
                  <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-lg font-semibold text-blue-900">{minutesToHHMM(stats.avgMinutesPerDay)}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs text-emerald-700 font-medium">On time arrival</p>
                <div className="mt-1 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-600 mr-2" />
                  <p className="text-lg font-semibold text-emerald-900">{stats.onTimePercent}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Timings</h3>
              <div className="flex space-x-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => {
                  const jsDay = new Date().getDay();
                  const active = idx === jsDay;
                  return (
                    <span key={idx} className={`text-xs px-2 py-1 rounded-md border ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{d}</span>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Today {todayRecord?.check_in_time ? `(${formatTimeDisplay(todayRecord.check_in_time)}${todayRecord?.check_out_time ? ` - ${formatTimeDisplay(todayRecord.check_out_time)}` : ''})` : '(no check-in)'}
              </p>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                {(() => {
                  const percent = Math.max(0, Math.min(100, Math.round((todayDurationMinutes / (9 * 60)) * 100)));
                  return <div className={`h-full bg-gradient-to-r ${theme.primaryGradient}`} style={{ width: `${percent}%` }} />
                })()}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Duration: {minutesToHHMM(todayDurationMinutes)}</span>
                <span>Target: 9h</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-600">24 hour format</span>
                <button
                  type="button"
                  onClick={() => setUse24Hour(!use24Hour)}
                  className={`w-10 h-6 rounded-full border transition-colors ${use24Hour ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-200 border-gray-200'}`}
                >
                  <span className={`block h-5 w-5 bg-white rounded-full transform transition-transform ${use24Hour ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatNow()}</p>
                <p className="text-xs text-gray-500">{new Date().toDateString()}</p>
              </div>
            </div>
            <div className="space-y-2">
              <button onClick={() => handleQuickAction('clockin')} className="w-full text-left px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-700 mr-2" /> Web Clock-In
              </button>
              <button onClick={() => handleQuickAction('wfh')} className="w-full text-left px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-700 mr-2" /> Work From Home
              </button>
              <button onClick={() => handleQuickAction('policy')} className="w-full text-left px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center">
                <DocumentChartBarIcon className="h-5 w-5 text-gray-700 mr-2" /> Attendance Policy
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Days"
            value={stats.totalDays}
            icon={CalendarIcon}
            gradient="from-blue-500 to-blue-600"
            trend="This month"
          />
          <StatCard
            title="Present Days"
            value={stats.presentDays}
            icon={UserIcon}
            gradient="from-emerald-500 to-emerald-600"
            percentage={stats.totalDays > 0 ? Math.round((stats.presentDays / stats.totalDays) * 100) : 0}
            trend="Attendance rate"
          />
          <StatCard
            title="Absent Days"
            value={stats.absentDays}
            icon={XCircleIcon}
            gradient="from-red-500 to-red-600"
            trend="Total absences"
          />
          <StatCard
            title="Late Days"
            value={stats.lateDays}
            icon={ClockIcon}
            gradient="from-amber-500 to-amber-600"
            trend="Late arrivals"
          />
          <StatCard
            title="Avg Hours / Day"
            value={minutesToHHMM(stats.avgMinutesPerDay)}
            icon={ClockIcon}
            gradient="from-indigo-500 to-indigo-600"
            trend="Working time"
          />
          <StatCard
            title="On-Time Arrival"
            value={`${stats.onTimePercent}%`}
            icon={CheckCircleIcon}
            gradient="from-teal-500 to-teal-600"
            trend="Punctuality"
          />
        </div>

        {/* Pending Edit Requests Section - Always show if requests exist, or for regular employees always */}
        {(!isManagementRole || userPendingRequests.length > 0) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <ClockIcon className="h-6 w-6 mr-2 text-amber-500" />
              Your Pending Edit Requests
            </h3>

            {userPendingRequests.length > 0 ? (
              <div className="space-y-4">
                {userPendingRequests
                  .map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <ClockIcon className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-amber-900">
                            Edit request for {formatDate(record.date)}
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            Waiting for {isHRManager() ? 'HR' : 'Manager'} approval
                          </p>
                          {record.edit_reason && (
                            <p className="text-xs text-amber-600 mt-1 italic">
                              "{record.edit_reason}"
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        Pending
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-3 bg-emerald-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-gray-600 font-medium">All caught up!</p>
                <p className="text-sm text-gray-500">No pending edit requests</p>
              </div>
            )}
          </div>
        )}

        {/* Management Approval Section - For HR Manager and Manager */}
        {canViewApprovals && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8" data-approvals-section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <CheckCircleIcon className="h-6 w-6 mr-2 text-purple-500" />
                Pending Approval Requests
                {isManager() && <span className="text-sm font-normal text-gray-500 ml-2">(Your Team)</span>}
              </h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                {attendanceRecords.filter(r => r.is_pending_approval).length} Pending
              </span>
            </div>

            {attendanceRecords.filter(r => r.is_pending_approval).length > 0 ? (
              <div className="space-y-6">
                {attendanceRecords
                  .filter(record => record.is_pending_approval)
                  .map((record) => (
                    <div key={record.id} className="border border-gray-200 rounded-2xl p-6 bg-gradient-to-r from-gray-50 to-blue-50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {/* ✅ Use display_name for avatar */}
                              {record.display_name?.split(' ').map(n => n[0]).join('') || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {/* ✅ Use display_name */}
                              {record.display_name || 'Unknown'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {/* ✅ Use display_id */}
                              Employee ID: {record.display_id || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600">Date: {formatDate(record.date)}</p>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => openApprovalModal(record, 'approve')}
                            disabled={submitting || !canActOnApprovals}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center space-x-2"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => openApprovalModal(record, 'reject')}
                            disabled={submitting || !canActOnApprovals}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center space-x-2"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>

                      {record.edit_reason && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <p className="text-sm text-blue-800">
                            <span className="font-semibold">Employee's Reason:</span> "{record.edit_reason}"
                          </p>
                        </div>
                      )}

                      {/* Comparison: Original vs Requested */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* ORIGINAL VALUES (Before Edit) */}
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <h5 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Original Record (Before Edit)
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-red-700 font-medium">Check In:</span>
                              <span className="text-red-900 font-semibold">{record.original_check_in_time || 'Not recorded'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-700 font-medium">Check Out:</span>
                              <span className="text-red-900 font-semibold">{record.original_check_out_time || 'Not recorded'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-700 font-medium">Status:</span>
                              <span className="text-red-900 font-semibold">{record.original_status || 'Not recorded'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-700 font-medium">Notes:</span>
                              <span className="text-red-900 font-semibold">{record.original_notes || 'None'}</span>
                            </div>
                          </div>
                        </div>

                        {/* REQUESTED VALUES */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <h5 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Employee's Requested Changes
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-green-700 font-medium">Check In:</span>
                              <span className="text-green-900 font-semibold">{record.check_in_time || 'Not recorded'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700 font-medium">Check Out:</span>
                              <span className="text-green-900 font-semibold">{record.check_out_time || 'Not recorded'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700 font-medium">Status:</span>
                              <span className="text-green-900 font-semibold">{record.status}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700 font-medium">Notes:</span>
                              <span className="text-green-900 font-semibold">{record.notes || 'None'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Notice */}
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <p className="text-sm text-blue-800 flex items-center">
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          <strong>Quick Approve:</strong> Click "Approve" to accept the employee's requested changes (green box above).
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-4 bg-emerald-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">
                  No pending approvals {isManager() ? 'from your team ' : ''}at the moment.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mark/Edit Attendance Form - Only for Employees (not for HR Manager or Manager) */}
        {!isManagementRole && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 bg-gradient-to-br ${theme.primaryGradient} rounded-xl`}>
                  <PlusIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {hasExistingRecord ? 'Edit Attendance' : 'Mark Attendance'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {hasExistingRecord ? 'Update your existing attendance record' : 'Record your daily attendance'}
                  </p>
                </div>
              </div>
              {hasExistingRecord && (
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium border border-amber-200">
                  ⚠️ Requires Approval
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    {...register('date', { required: 'Date is required' })}
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check In Time</label>
                  <input
                    {...register('check_in_time')}
                    type="time"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check Out Time</label>
                  <input
                    {...register('check_out_time')}
                    type="time"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    {...register('status', { required: 'Status is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
                  {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <input
                    {...register('notes')}
                    type="text"
                    placeholder="Optional notes..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Edit Reason Field - Only show if editing existing record OR past date */}
              {showEditReason && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-amber-800 mb-2">
                    Reason for Edit <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('edit_reason', {
                      required: showEditReason ? 'Reason is required for editing or adding past attendance' : false
                    })}
                    rows={3}
                    placeholder="Please explain why you need to edit this attendance record..."
                    className="w-full px-4 py-3 border border-amber-300 rounded-xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white"
                  />
                  {errors.edit_reason && <p className="text-red-500 text-sm mt-1">{errors.edit_reason.message}</p>}
                  <p className="text-xs text-amber-700 mt-2 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    This edit request will be sent to HR and your manager for approval.
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`bg-gradient-to-r ${theme.primaryGradient} hover:opacity-90 text-white px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span>
                        {hasExistingRecord ? 'Submitting Edit...' : 'Marking...'}
                      </span>
                    </>
                  ) : (
                    <>
                      {hasExistingRecord ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        <PlusIcon className="h-5 w-5" />
                      )}
                      <span>{hasExistingRecord ? 'Submit Edit Request' : 'Mark Attendance'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2 text-purple-500" />
            Filter Records
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">All Status</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="HALF_DAY">Half Day</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center space-x-2"
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <DocumentChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
                Attendance Records
                {isManager() && <span className="text-sm font-normal text-gray-500 ml-2">(Your Team)</span>}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white px-3 py-1 rounded-lg border">
                <CalendarIcon className="h-4 w-4" />
                <span className="font-medium">{attendanceRecords.length} records</span>
              </div>
            </div>
          </div>

          <Table
            columns={columns}
            data={attendanceRecords}
            loading={loading}
            emptyMessage={
              isManager()
                ? "No attendance records found for your team"
                : "No attendance records found"
            }
          />
        </div>

        {/* Approval Modal */}
        <Modal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedApproval(null);
            resetApproval();
          }}
          title={
            <div className="flex items-center space-x-2">
              {selectedApproval?.action === 'approve' ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-red-600" />
              )}
              <span>{selectedApproval?.action === 'approve' ? 'Review & Approve Edit Request' : 'Reject Edit Request'}</span>
            </div>
          }
        >
          {selectedApproval && (
            <form onSubmit={handleApprovalSubmit(handleApprovalAction)}>
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {/* ✅ Use employee_name from selectedApproval (already has display_name) */}
                      {selectedApproval.employee_name?.split(' ').map(n => n[0]).join('') || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {selectedApproval.employee_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {/* ✅ Use employee_id from selectedApproval (already has display_id) */}
                      {formatDate(selectedApproval.date)} • Employee ID: {selectedApproval.employee_id}
                    </p>
                  </div>
                </div>

                {selectedApproval.edit_reason && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Employee's Reason:</span> "{selectedApproval.edit_reason}"
                    </p>
                  </div>
                )}

                {/* Show comparison between ORIGINAL and REQUESTED */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* ORIGINAL VALUES */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h5 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Original Record (Before Edit)
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-red-700 font-medium">Check In:</span>
                        <span className="text-red-900 font-semibold">{selectedApproval.original_check_in_time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700 font-medium">Check Out:</span>
                        <span className="text-red-900 font-semibold">{selectedApproval.original_check_out_time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700 font-medium">Status:</span>
                        <span className="text-red-900 font-semibold">{selectedApproval.original_status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700 font-medium">Notes:</span>
                        <span className="text-red-900 font-semibold">{selectedApproval.original_notes}</span>
                      </div>
                    </div>
                  </div>

                  {/* REQUESTED VALUES */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h5 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Employee's Requested Changes
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700 font-medium">Check In:</span>
                        <span className="text-green-900 font-semibold">{selectedApproval.requested_check_in_time || 'Not recorded'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700 font-medium">Check Out:</span>
                        <span className="text-green-900 font-semibold">{selectedApproval.requested_check_out_time || 'Not recorded'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700 font-medium">Status:</span>
                        <span className="text-green-900 font-semibold">{selectedApproval.requested_status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700 font-medium">Notes:</span>
                        <span className="text-green-900 font-semibold">{selectedApproval.requested_notes || 'None'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedApproval.action === 'approve' ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h5 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Review & Approve Employee's Changes
                    </h5>
                    <p className="text-sm text-green-700 mb-2">
                      ✅ The form below is pre-filled with the employee's requested changes.
                    </p>
                    <p className="text-xs text-green-600">
                      💡 You can modify these values if corrections are needed before approving.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Check In Time</label>
                      <input
                        {...registerApproval('check_in_time')}
                        type="time"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Check Out Time</label>
                      <input
                        {...registerApproval('check_out_time')}
                        type="time"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                      <select
                        {...registerApproval('status', { required: 'Status is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="LATE">Late</option>
                        <option value="HALF_DAY">Half Day</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                      <input
                        {...registerApproval('notes')}
                        type="text"
                        placeholder="Add any notes..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-800 flex items-center">
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Are you sure you want to reject this attendance edit request?
                      The employee will need to resubmit if they want to make changes.
                    </p>
                  </div>
                </div>
              )}

              <input type="hidden" {...registerApproval('action')} />

              <div className="flex space-x-3 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center space-x-2 ${selectedApproval.action === 'approve'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                      : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                    }`}
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      {selectedApproval.action === 'approve' ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5" />
                          <span>Approve Changes</span>
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-5 w-5" />
                          <span>Reject Request</span>
                        </>
                      )}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedApproval(null);
                    resetApproval();
                  }}
                  className="flex-1 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* Floating Action Button for Management Roles - Quick Access to Approvals */}
        {isManagementRole && attendanceRecords.filter(r => r.is_pending_approval).length > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={() => {
                document.querySelector('[data-approvals-section]')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-full p-4 shadow-lg transition-all transform hover:scale-105"
              title={`${attendanceRecords.filter(r => r.is_pending_approval).length} pending approvals`}
            >
              <div className="relative">
                <ClockIcon className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full text-xs font-bold w-6 h-6 flex items-center justify-center border-2 border-red-500">
                  {attendanceRecords.filter(r => r.is_pending_approval).length}
                </span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracker;   