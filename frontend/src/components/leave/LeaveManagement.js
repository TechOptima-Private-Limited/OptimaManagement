


// import React, { useState, useEffect } from 'react';
// import { Tab } from '@headlessui/react';
// import { 
//   DocumentTextIcon, 
//   ChartBarIcon, 
//   ClockIcon, 
//   CalendarDaysIcon,
//   BellIcon,
//   CogIcon,
//   CheckCircleIcon,
//   SparklesIcon,
//   ExclamationTriangleIcon,
//   RocketLaunchIcon
// } from '@heroicons/react/24/outline';
// import { isHRManager } from '../../utils/auth';
// import { leaveAPI } from '../../services/api';
// import LeaveRequest from './LeaveRequest';
// import LeaveApproval from './LeaveApproval';
// import LeaveBalance from './LeaveBalance';
// import LeaveTypesManagement from './LeaveTypesManagement';

// function classNames(...classes) {
//   return classes.filter(Boolean).join(' ');
// }

// const LeaveManagement = () => {
//   const [selectedIndex, setSelectedIndex] = useState(0);
//   const [stats, setStats] = useState({
//     totalRequests: 0,
//     pendingApprovals: 0,
//     approvedThisMonth: 0,
//     totalDaysTaken: 0
//   });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (isHRManager()) {
//       fetchAnalytics();
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   const fetchAnalytics = async () => {
//     try {
//       const [analyticsResponse, requestsResponse] = await Promise.all([
//         leaveAPI.getLeaveAnalytics().catch(() => ({ data: {} })),
//         leaveAPI.getLeaveRequests()
//       ]);

//       const analytics = analyticsResponse.data;
//       const requests = requestsResponse.data.results || requestsResponse.data;
      
//       const currentMonth = new Date().getMonth();
//       const currentYear = new Date().getFullYear();
      
//       const approvedThisMonth = requests.filter(req => {
//         const reqDate = new Date(req.applied_on);
//         return req.status === 'APPROVED' && 
//                reqDate.getMonth() === currentMonth && 
//                reqDate.getFullYear() === currentYear;
//       }).length;

//       const pendingCount = requests.filter(req => req.status === 'PENDING').length;
//       const totalDays = requests
//         .filter(req => req.status === 'APPROVED')
//         .reduce((sum, req) => sum + parseFloat(req.days_requested || 0), 0);

//       setStats({
//         totalRequests: requests.length,
//         pendingApprovals: pendingCount,
//         approvedThisMonth: approvedThisMonth,
//         totalDaysTaken: totalDays
//       });
//     } catch (error) {
//       console.error('Error fetching analytics:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const tabs = [
//     {
//       name: 'My Requests',
//       icon: DocumentTextIcon,
//       component: LeaveRequest,
//       roles: ['EMPLOYEE', 'HR_MANAGER', 'ADMIN'],
//       description: 'Submit and track your leave requests with real-time status updates',
//       gradient: 'from-blue-500 to-purple-600'
//     },
//     // {
//     //   name: 'Leave Balance',
//     //   icon: ChartBarIcon,
//     //   component: LeaveBalance,
//     //   roles: ['EMPLOYEE', 'HR_MANAGER', 'ADMIN'],
//     //   description: 'Monitor your available leave balance and usage analytics',
//     //   gradient: 'from-emerald-500 to-teal-600'
//     // },
//     ...(isHRManager() ? [
//       {
//         name: 'Approvals',
//         icon: ClockIcon,
//         component: LeaveApproval,
//         roles: ['HR_MANAGER', 'ADMIN'],
//         description: 'Review and approve pending leave requests efficiently',
//         gradient: 'from-amber-500 to-orange-600'
//       },
//       {
//         name: 'Leave Types & Setup',
//         icon: CogIcon,
//         component: LeaveTypesManagement,
//         roles: ['HR_MANAGER', 'ADMIN'],
//         description: 'Configure leave types and initialize employee balances',
//         gradient: 'from-purple-500 to-indigo-600'
//       }
//     ] : [])
//   ];

//   const statsData = [
//     { 
//       name: 'Total Leave Requests', 
//       value: stats.totalRequests.toString(), 
//       change: '+12.5%', 
//       changeType: 'increase',
//       icon: DocumentTextIcon,
//       gradient: 'from-blue-500 to-blue-600',
//       bgGradient: 'from-blue-50 to-indigo-50'
//     },
//     { 
//       name: 'Pending Approvals', 
//       value: stats.pendingApprovals.toString(), 
//       change: stats.pendingApprovals > 5 ? 'High Priority' : 'Normal', 
//       changeType: stats.pendingApprovals > 5 ? 'increase' : 'neutral',
//       icon: BellIcon,
//       gradient: stats.pendingApprovals > 5 ? 'from-red-500 to-red-600' : 'from-amber-500 to-amber-600',
//       bgGradient: stats.pendingApprovals > 5 ? 'from-red-50 to-pink-50' : 'from-amber-50 to-yellow-50'
//     },
//     { 
//       name: 'Approved This Month', 
//       value: stats.approvedThisMonth.toString(), 
//       change: '+18.2%', 
//       changeType: 'increase',
//       icon: CheckCircleIcon,
//       gradient: 'from-emerald-500 to-emerald-600',
//       bgGradient: 'from-emerald-50 to-green-50'
//     },
//     { 
//       name: 'Total Days Taken', 
//       value: stats.totalDaysTaken.toString(), 
//       change: 'This year', 
//       changeType: 'neutral',
//       icon: CalendarDaysIcon,
//       gradient: 'from-purple-500 to-purple-600',
//       bgGradient: 'from-purple-50 to-indigo-50'
//     },
//   ];

//   const ActiveComponent = tabs[selectedIndex]?.component || LeaveRequest;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//       {/* Hero Header */}
//       <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//           <div className="md:flex md:items-center md:justify-between">
//             <div className="flex-1 min-w-0">
//               <div className="flex items-center space-x-4 mb-4">
//                 <div className="p-3 bg-white/20 rounded-2xl">
//                   <CalendarDaysIcon className="h-10 w-10" />
//                 </div>
//                 <div>
//                   <h1 className="text-4xl font-bold leading-tight">
//                     Leave Management
//                   </h1>
//                   <p className="text-xl text-blue-100 mt-2">
//                     {isHRManager() 
//                       ? 'Streamline leave processes with intelligent automation' 
//                       : 'Manage your work-life balance with ease'
//                     }
//                   </p>
//                 </div>
//               </div>
//               {isHRManager() && stats.pendingApprovals > 0 && (
//                 <div className="flex items-center space-x-3 mt-4">
//                   <SparklesIcon className="h-6 w-6 text-yellow-300" />
//                   <span className="text-lg font-medium bg-white/20 px-4 py-2 rounded-full">
//                     {stats.pendingApprovals} requests need your attention
//                   </span>
//                 </div>
//               )}
//             </div>
//             <div className="mt-6 md:mt-0 md:ml-6">
//               <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
//                 <div className="flex items-center space-x-3">
//                   <CalendarDaysIcon className="h-6 w-6" />
//                   <span className="text-lg font-semibold">
//                     {new Date().getFullYear()} Leave Year
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Stats Overview */}
//         {isHRManager() && !loading && (
//           <div className="mb-8 -mt-16 relative z-10">
//             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
//               {statsData.map((item) => {
//                 const IconComponent = item.icon;
                
//                 return (
//                   <div key={item.name} className="group">
//                     <div className={`relative bg-gradient-to-br ${item.bgGradient} rounded-2xl shadow-lg border border-white/60 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
//                       <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
//                       <div className="relative p-6">
//                         <div className="flex items-center justify-between">
//                           <div className="flex-1">
//                             <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
//                               {item.name}
//                             </p>
//                             <p className="text-3xl font-bold text-gray-900 mt-2">
//                               {item.value}
//                             </p>
//                             <div className="mt-3">
//                               <div className={`inline-flex items-center text-sm font-semibold ${
//                                 item.changeType === 'increase' ? 'text-emerald-600' : 
//                                 item.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
//                               }`}>
//                                 {item.changeType === 'increase' && (
//                                   <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
//                                     <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
//                                   </svg>
//                                 )}
//                                 {item.change}
//                               </div>
//                             </div>
//                           </div>
//                           <div className={`p-4 rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg`}>
//                             <IconComponent className="h-8 w-8 text-white" />
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}

//         {/* HR Quick Actions */}
//         {isHRManager() && (
//           <div className="mb-8">
//             <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-2xl p-6">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-4">
//                   <div className="p-2 bg-blue-100 rounded-xl">
//                     <RocketLaunchIcon className="h-6 w-6 text-blue-600" />
//                   </div>
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
//                     <p className="text-sm text-gray-600 mt-1">
//                       {stats.pendingApprovals > 0 ? (
//                         <>
//                           <span className="font-medium text-blue-700">{stats.pendingApprovals}</span> requests need approval
//                         </>
//                       ) : (
//                         'All requests processed! 🎉'
//                       )}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex space-x-3">
//                   {stats.pendingApprovals > 0 && (
//                     <button
//                       onClick={() => setSelectedIndex(2)}
//                       className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2"
//                     >
//                       <ClockIcon className="h-4 w-4" />
//                       <span>Review Now</span>
//                     </button>
//                   )}
//                   <button
//                     onClick={() => setSelectedIndex(3)}
//                     className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2"
//                   >
//                     <CogIcon className="h-4 w-4" />
//                     <span>Manage Types</span>
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Setup Warning */}
//         {isHRManager() && (
//           <SetupWarning onSetupClick={() => setSelectedIndex(3)} />
//         )}

//         {/* Main Content Tabs */}
//         <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
//           <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
//             {/* Tab Navigation */}
//             <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
//               <Tab.List className="flex space-x-1 p-2">
//                 {tabs.map((tab, index) => (
//                   <Tab
//                     key={tab.name}
//                     className={({ selected }) =>
//                       classNames(
//                         'flex-1 py-4 px-6 text-sm font-semibold rounded-2xl transition-all duration-200 focus:outline-none',
//                         selected
//                           ? 'bg-white text-gray-900 shadow-lg border border-gray-200'
//                           : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
//                       )
//                     }
//                   >
//                     <div className="flex items-center justify-center space-x-3">
//                       <div className={`p-2 rounded-xl ${selectedIndex === index ? `bg-gradient-to-r ${tab.gradient}` : 'bg-gray-200'}`}>
//                         <tab.icon className={`h-5 w-5 ${selectedIndex === index ? 'text-white' : 'text-gray-600'}`} />
//                       </div>
//                       <span>{tab.name}</span>
//                       {/* Notification Badge */}
//                       {tab.name === 'Approvals' && stats.pendingApprovals > 0 && (
//                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
//                           {stats.pendingApprovals}
//                         </span>
//                       )}
//                     </div>
//                   </Tab>
//                 ))}
//               </Tab.List>
//             </div>

//             {/* Tab Content */}
//             <Tab.Panels>
//               {tabs.map((tab, index) => (
//                 <Tab.Panel key={index} className="p-8">
//                   {/* Tab Header */}
//                   <div className="mb-8">
//                     <div className="flex items-center space-x-4 mb-4">
//                       <div className={`p-3 rounded-2xl bg-gradient-to-r ${tab.gradient}`}>
//                         <tab.icon className="h-8 w-8 text-white" />
//                       </div>
//                       <div>
//                         <h2 className="text-2xl font-bold text-gray-900">{tab.name}</h2>
//                         <p className="text-gray-600 mt-1">{tab.description}</p>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Component Content */}
//                   <ActiveComponent />
//                 </Tab.Panel>
//               ))}
//             </Tab.Panels>
//           </Tab.Group>
//         </div>

//         {/* Help Section */}
//         <div className="mt-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl p-8">
//           <div className="flex items-start space-x-4">
//             <div className="p-3 bg-blue-100 rounded-2xl">
//               <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
//             </div>
//             <div className="flex-1">
//               <h3 className="text-xl font-semibold text-gray-900 mb-4">Leave Management Guide</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-3">
//                   <h4 className="font-semibold text-gray-800">
//                     {isHRManager() ? '👑 HR Manager Tips' : '📝 Employee Guide'}
//                   </h4>
//                   <ul className="space-y-2 text-sm text-gray-700">
//                     {isHRManager() ? (
//                       <>
//                         <li className="flex items-center space-x-2">
//                           <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
//                           <span>Configure leave types and policies in "Leave Types & Setup"</span>
//                         </li>
//                         <li className="flex items-center space-x-2">
//                           <span className="w-2 h-2 bg-green-500 rounded-full"></span>
//                           <span>Monitor team leave patterns in the analytics dashboard</span>
//                         </li>
//                         <li className="flex items-center space-x-2">
//                           <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
//                           <span>Set up automated approval workflows for efficiency</span>
//                         </li>
//                       </>
//                     ) : (
//                       <>
//                         <li className="flex items-center space-x-2">
//                           <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
//                           <span>Check your leave balance before submitting requests</span>
//                         </li>
//                         <li className="flex items-center space-x-2">
//                           <span className="w-2 h-2 bg-green-500 rounded-full"></span>
//                           <span>Apply for leave at least 7 days in advance</span>
//                         </li>
//                         <li className="flex items-center space-x-2">
//                           <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
//                           <span>Upload medical certificates for sick leave over 3 days</span>
//                         </li>
//                       </>
//                     )}
//                   </ul>
//                 </div>
//                 <div className="space-y-3">
//                   <h4 className="font-semibold text-gray-800">🚀 Pro Features</h4>
//                   <ul className="space-y-2 text-sm text-gray-700">
//                     <li className="flex items-center space-x-2">
//                       <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
//                       <span>Real-time notifications for status updates</span>
//                     </li>
//                     <li className="flex items-center space-x-2">
//                       <span className="w-2 h-2 bg-red-500 rounded-full"></span>
//                       <span>Smart balance validation prevents over-booking</span>
//                     </li>
//                     <li className="flex items-center space-x-2">
//                       <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
//                       <span>Detailed analytics and usage insights</span>
//                     </li>
//                   </ul>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Setup Warning Component
// const SetupWarning = ({ onSetupClick }) => {
//   const [leaveTypes, setLeaveTypes] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchLeaveTypes = async () => {
//       try {
//         const response = await leaveAPI.getLeaveTypes();
//         setLeaveTypes(response.data.results || response.data);
//       } catch (error) {
//         console.error('Error fetching leave types:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLeaveTypes();
//   }, []);

//   if (loading || leaveTypes.length > 0) {
//     return null;
//   }

//   return (
//     <div className="mb-8">
//       <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-2xl p-6">
//         <div className="flex items-center space-x-4">
//           <div className="p-2 bg-amber-100 rounded-xl">
//             <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
//           </div>
//           <div className="flex-1">
//             <h3 className="text-lg font-semibold text-amber-900">Setup Required</h3>
//             <p className="text-amber-800 mt-1">
//               No leave types configured. Set up leave types and initialize employee balances to get started.
//             </p>
//           </div>
//           <button
//             onClick={onSetupClick}
//             className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2"
//           >
//             <CogIcon className="h-5 w-5" />
//             <span>Setup Now</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LeaveManagement;





// components/leave/LeaveManagement.js

import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  CalendarDaysIcon,
  BellIcon,
  CogIcon,
  CheckCircleIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { isHRManager, isManager, isHROrManager } from '../../utils/auth';
import { leaveAPI, authAPI } from '../../services/api';
import LeaveRequest from './LeaveRequest';
import LeaveApproval from './LeaveApproval';
import LeaveTypesManagement from './LeaveTypesManagement';
import { useTheme } from '../../context/ThemeContext';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const LeaveManagement = () => {
  const { theme } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingApprovals: 0,
    approvedThisMonth: 0,
    totalDaysTaken: 0,
    userRole: null
  });
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await authAPI.getMyPermissions();
        setPermissions(Array.isArray(resp?.data?.permissions) ? resp.data.permissions : []);
      } catch (_) {
        setPermissions([]);
      }
    })();
    if (isHROrManager()) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [analyticsResponse, requestsResponse] = await Promise.all([
        leaveAPI.getLeaveAnalytics().catch(() => ({ data: {} })),
        leaveAPI.getLeaveRequests()
      ]);

      const analytics = analyticsResponse.data;
      const requestsData = requestsResponse.data;
      
      // Handle both old and new response format
      const requests = requestsData.results || requestsData;
      const pendingFromAPI = requestsData.pending_approvals_count || 0;
      const userRole = requestsData.user_role || null;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const approvedThisMonth = requests.filter(req => {
        const reqDate = new Date(req.applied_on);
        return req.status === 'APPROVED' && 
               reqDate.getMonth() === currentMonth && 
               reqDate.getFullYear() === currentYear;
      }).length;

      const pendingCount = requests.filter(req => req.status === 'PENDING').length;
      const totalDays = requests
        .filter(req => req.status === 'APPROVED')
        .reduce((sum, req) => sum + parseFloat(req.days_requested || 0), 0);

      setStats({
        totalRequests: requests.length,
        pendingApprovals: pendingFromAPI || pendingCount,
        approvedThisMonth: approvedThisMonth,
        totalDaysTaken: totalDays,
        userRole: userRole
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPerm = (code) => (permissions || []).includes(code);
  const canViewApprovals = isHROrManager() || hasPerm('leave_management.view_leaverequest');
  const canActOnApprovals = isHROrManager() || hasPerm('leave_management.change_leaverequest');
  const canManageTypes = isHRManager() || (
    hasPerm('leave_management.view_leavetype') ||
    hasPerm('leave_management.add_leavetype') ||
    hasPerm('leave_management.change_leavetype') ||
    hasPerm('leave_management.delete_leavetype')
  );

  const tabs = [
    {
      name: 'My Requests',
      icon: DocumentTextIcon,
      component: LeaveRequest,
      roles: ['EMPLOYEE', 'MANAGER', 'HR_MANAGER'],
      description: 'Submit and track your leave requests with real-time status updates',
      gradient: 'from-blue-500 to-purple-600'
    },
    // Only show approvals tab for managers and HR
    ...(canViewApprovals ? [
      {
        name: 'Approvals',
        icon: ClockIcon,
        component: LeaveApproval,
        roles: ['MANAGER', 'HR_MANAGER'],
        description: isManager() 
          ? 'Review and approve your team\'s leave requests' 
          : 'Review and approve pending leave requests efficiently',
        gradient: 'from-amber-500 to-orange-600'
      }
    ] : []),
    // Only show leave types management for HR
    ...(canManageTypes ? [
      {
        name: 'Leave Types & Setup',
        icon: CogIcon,
        component: LeaveTypesManagement,
        roles: ['HR_MANAGER'],
        description: 'Configure leave types and initialize employee balances',
        gradient: 'from-purple-500 to-indigo-600'
      }
    ] : [])
  ];

  const statsData = [
    { 
      name: 'Total Leave Requests', 
      value: stats.totalRequests.toString(), 
      change: '+12.5%', 
      changeType: 'increase',
      icon: DocumentTextIcon,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-indigo-50'
    },
    { 
      name: 'Pending Approvals', 
      value: stats.pendingApprovals.toString(), 
      change: stats.pendingApprovals > 5 ? 'High Priority' : 'Normal', 
      changeType: stats.pendingApprovals > 5 ? 'increase' : 'neutral',
      icon: BellIcon,
      gradient: stats.pendingApprovals > 5 ? 'from-red-500 to-red-600' : 'from-amber-500 to-amber-600',
      bgGradient: stats.pendingApprovals > 5 ? 'from-red-50 to-pink-50' : 'from-amber-50 to-yellow-50'
    },
    { 
      name: 'Approved This Month', 
      value: stats.approvedThisMonth.toString(), 
      change: '+18.2%', 
      changeType: 'increase',
      icon: CheckCircleIcon,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-green-50'
    },
    { 
      name: 'Total Days Taken', 
      value: stats.totalDaysTaken.toString(), 
      change: 'This year', 
      changeType: 'neutral',
      icon: CalendarDaysIcon,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-indigo-50'
    },
  ];

  const ActiveComponent = tabs[selectedIndex]?.component || LeaveRequest;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient}`}>
      {/* Hero Header */}
      <div className={`bg-gradient-to-r ${theme.headerGradient} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <CalendarDaysIcon className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold leading-tight">
                    Leave Management
                  </h1>
                  <p className="text-xl text-blue-100 mt-2">
                    {isHRManager() 
                      ? 'Streamline leave processes with intelligent automation' 
                      : isManager()
                      ? 'Manage your team\'s leave requests efficiently'
                      : 'Manage your work-life balance with ease'
                    }
                  </p>
                </div>
              </div>
              {isHROrManager() && stats.pendingApprovals > 0 && (
                <div className="flex items-center space-x-3 mt-4">
                  <SparklesIcon className="h-6 w-6 text-yellow-300" />
                  <span className="text-lg font-medium bg-white/20 px-4 py-2 rounded-full">
                    {stats.pendingApprovals} {isManager() ? 'team ' : ''}requests need your attention
                  </span>
                </div>
              )}
            </div>
            <div className="mt-6 md:mt-0 md:ml-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <div className="flex items-center space-x-3">
                  <CalendarDaysIcon className="h-6 w-6" />
                  <span className="text-lg font-semibold">
                    {new Date().getFullYear()} Leave Year
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview - Show for managers and HR */}
        {canViewApprovals && !loading && (
          <div className="mb-8 -mt-16 relative z-10">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {statsData.map((item) => {
                const IconComponent = item.icon;
                
                return (
                  <div key={item.name} className="group">
                    <div className={`relative bg-gradient-to-br ${item.bgGradient} rounded-2xl shadow-lg border border-white/60 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                      <div className="relative p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                              {item.name}
                            </p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                              {item.value}
                            </p>
                            <div className="mt-3">
                              <div className={`inline-flex items-center text-sm font-semibold ${
                                item.changeType === 'increase' ? 'text-emerald-600' : 
                                item.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {item.changeType === 'increase' && (
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {item.change}
                              </div>
                            </div>
                          </div>
                          <div className={`p-4 rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg`}>
                            <IconComponent className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {canViewApprovals && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <RocketLaunchIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {stats.pendingApprovals > 0 ? (
                        <>
                          <span className="font-medium text-blue-700">{stats.pendingApprovals}</span> 
                          {isManager() ? ' team requests' : ' requests'} need approval
                        </>
                      ) : (
                        'All requests processed! 🎉'
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  {stats.pendingApprovals > 0 && (
                    <button
                      onClick={() => setSelectedIndex(isHRManager() ? 2 : 1)} // Adjust for tab index
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2"
                    >
                      <ClockIcon className="h-4 w-4" />
                      <span>Review Now</span>
                    </button>
                  )}
                  {isHRManager() && (
                    <button
                      onClick={() => setSelectedIndex(2)} // Leave Types tab for HR
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2"
                    >
                      <CogIcon className="h-4 w-4" />
                      <span>Manage Types</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Setup Warning - Only for HR */}
        {isHRManager() && (
          <SetupWarning onSetupClick={() => setSelectedIndex(2)} />
        )}

        {/* Main Content Tabs */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
              <Tab.List className="flex space-x-1 p-2">
                {tabs.map((tab, index) => (
                  <Tab
                    key={tab.name}
                    className={({ selected }) =>
                      classNames(
                        'flex-1 py-4 px-6 text-sm font-semibold rounded-2xl transition-all duration-200 focus:outline-none',
                        selected
                          ? 'bg-white text-gray-900 shadow-lg border border-gray-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      )
                    }
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <div className={`p-2 rounded-xl ${selectedIndex === index ? `bg-gradient-to-r ${tab.gradient}` : 'bg-gray-200'}`}>
                        <tab.icon className={`h-5 w-5 ${selectedIndex === index ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <span>{tab.name}</span>
                      {/* Notification Badge */}
                      {tab.name === 'Approvals' && stats.pendingApprovals > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                          {stats.pendingApprovals}
                        </span>
                      )}
                    </div>
                  </Tab>
                ))}
              </Tab.List>
            </div>

            {/* Tab Content */}
            <Tab.Panels>
              {tabs.map((tab, index) => (
                <Tab.Panel key={index} className="p-8">
                  {/* Tab Header */}
                  <div className="mb-8">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={`p-3 rounded-2xl bg-gradient-to-r ${tab.gradient}`}>
                        <tab.icon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{tab.name}</h2>
                        <p className="text-gray-600 mt-1">{tab.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Component Content */}
                  <ActiveComponent />
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl p-8">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-2xl">
              <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Leave Management Guide</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">
                    {isHRManager() ? '👑 HR Manager Tips' : isManager() ? '🎯 Manager Guide' : '📝 Employee Guide'}
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {isHRManager() ? (
                      <>
                        <li className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>Configure leave types and policies in "Leave Types & Setup"</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>Monitor company-wide leave patterns in analytics</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          <span>Override approval workflows when necessary</span>
                        </li>
                      </>
                    ) : isManager() ? (
                      <>
                        <li className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>Review your team's leave requests in "Approvals"</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>Monitor team leave patterns for better planning</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          <span>Ensure adequate team coverage during leave periods</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>Check your leave balance before submitting requests</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>Apply for leave at least 7 days in advance</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          <span>Upload medical certificates for sick leave over 3 days</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">🚀 Pro Features</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      <span>Real-time notifications for status updates</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span>Smart balance validation prevents over-booking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                      <span>Detailed analytics and usage insights</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Setup Warning Component - Only for HR
const SetupWarning = ({ onSetupClick }) => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await leaveAPI.getLeaveTypes();
        setLeaveTypes(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching leave types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveTypes();
  }, []);

  if (loading || leaveTypes.length > 0 || !isHRManager()) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-2xl p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-amber-100 rounded-xl">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-900">Setup Required</h3>
            <p className="text-amber-800 mt-1">
              No leave types configured. Set up leave types and initialize employee balances to get started.
            </p>
          </div>
          <button
            onClick={onSetupClick}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2"
          >
            <CogIcon className="h-5 w-5" />
            <span>Setup Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;