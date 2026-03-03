// // import React, { useState, useEffect } from 'react';
// // import { Link } from 'react-router-dom';
// // import { 
// //   UsersIcon, 
// //   ClockIcon, 
// //   CalendarDaysIcon, 
// //   ChartBarIcon,
// //   ExclamationTriangleIcon,
// //   PlusIcon,
// //   ArrowTrendingUpIcon,
// //   BellIcon
// // } from '@heroicons/react/24/outline';
// // import { useAuth } from '../../context/AuthContext';
// // import { isHRManager } from '../../utils/auth';
// // import { employeeAPI, attendanceAPI, leaveAPI } from '../../services/api';
// // import { formatDate } from '../../utils/formatters';

// // const Dashboard = () => {
// //   const { user } = useAuth();
// //   const [dashboardData, setDashboardData] = useState({
// //     stats: {},
// //     recentActivities: [],
// //     pendingActions: [],
// //     loading: true
// //   });

// //   useEffect(() => {
// //     fetchDashboardData();
// //   }, []);

// //   const fetchDashboardData = async () => {
// //     try {
// //       const promises = [];

// //       if (isHRManager()) {
// //         // HR Manager dashboard data
// //         promises.push(
// //           employeeAPI.getEmployees({ limit: 5 }),
// //           leaveAPI.getLeaveRequests({ status: 'PENDING', limit: 5 }),
// //           attendanceAPI.getAttendanceRecords({ limit: 5 })
// //         );
// //       } else {
// //         // Employee dashboard data
// //         promises.push(
// //           leaveAPI.getLeaveSummary(),
// //           attendanceAPI.getAttendanceRecords({ limit: 5 })
// //         );
// //       }

// //       const results = await Promise.all(promises);
      
// //       setDashboardData({
// //         stats: isHRManager() ? {
// //           totalEmployees: results[0].data.count || results[0].data.length,
// //           pendingLeaves: results[1].data.count || results[1].data.length,
// //           todayAttendance: results[2].data.count || results[2].data.length,
// //         } : {
// //           leaveBalance: results[0].data.leave_balances?.reduce((acc, bal) => acc + bal.remaining_days, 0) || 0,
// //           pendingRequests: results[0].data.pending_requests_count || 0,
// //           approvedThisYear: results[0].data.approved_requests_count || 0,
// //         },
// //         recentActivities: results[isHRManager() ? 2 : 1].data.results || results[isHRManager() ? 2 : 1].data || [],
// //         pendingActions: isHRManager() ? (results[1].data.results || results[1].data || []) : [],
// //         loading: false
// //       });
// //     } catch (error) {
// //       console.error('Failed to fetch dashboard data:', error);
// //       setDashboardData(prev => ({ ...prev, loading: false }));
// //     }
// //   };

// //   const { stats, recentActivities, pendingActions, loading } = dashboardData;

// //   if (loading) {
// //     return (
// //       <div className="flex justify-center items-center h-64">
// //         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
// //       </div>
// //     );
// //   }

// //   const StatCard = ({ title, value, icon: Icon, color, change, link }) => (
// //     <div className="bg-white overflow-hidden shadow-lg rounded-xl">
// //       <div className="p-6">
// //         <div className="flex items-center">
// //           <div className="flex-shrink-0">
// //             <div className={`p-3 rounded-lg ${color}`}>
// //               <Icon className="h-6 w-6 text-white" />
// //             </div>
// //           </div>
// //           <div className="ml-5 w-0 flex-1">
// //             <dl>
// //               <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
// //               <dd className="flex items-baseline">
// //                 <div className="text-2xl font-bold text-gray-900">{value}</div>
// //                 {change && (
// //                   <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
// //                     <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
// //                     <span className="sr-only">Increased by</span>
// //                     {change}
// //                   </div>
// //                 )}
// //               </dd>
// //             </dl>
// //           </div>
// //         </div>
// //       </div>
// //       {link && (
// //         <div className="bg-gray-50 px-6 py-3">
// //           <Link to={link} className="text-sm font-medium text-blue-600 hover:text-blue-500">
// //             View details →
// //           </Link>
// //         </div>
// //       )}
// //     </div>
// //   );

// //   const QuickActionCard = ({ title, description, icon: Icon, color, link }) => (
// //     <Link to={link} className="group">
// //       <div className="bg-white overflow-hidden shadow rounded-xl hover:shadow-lg transition-shadow duration-200">
// //         <div className="p-6">
// //           <div className="flex items-center">
// //             <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform duration-200`}>
// //               <Icon className="h-6 w-6 text-white" />
// //             </div>
// //             <div className="ml-4">
// //               <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
// //                 {title}
// //               </h3>
// //               <p className="text-sm text-gray-500">{description}</p>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </Link>
// //   );

// //   return (
// //     <div className="space-y-8">
// //       {/* Header */}
// //       <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
// //         <div className="flex items-center justify-between">
// //           <div>
// //             <h1 className="text-3xl font-bold">
// //               Welcome back, {user?.first_name}! 👋
// //             </h1>
// //             <p className="mt-1 text-blue-100">
// //               {isHRManager() 
// //                 ? "Here's what's happening in your organization today." 
// //                 : "Here's your dashboard overview for today."}
// //             </p>
// //           </div>
// //           <div className="text-right">
// //             <div className="text-2xl font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
// //             <div className="text-blue-100">{new Date().toLocaleDateString()}</div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Stats Grid */}
// //       <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
// //         {isHRManager() ? (
// //           <>
// //             <StatCard
// //               title="Total Employees"
// //               value={stats.totalEmployees}
// //               icon={UsersIcon}
// //               color="bg-blue-500"
// //               change="+2.5%"
// //               link="/employees"
// //             />
// //             <StatCard
// //               title="Pending Leave Requests"
// //               value={stats.pendingLeaves}
// //               icon={CalendarDaysIcon}
// //               color="bg-yellow-500"
// //               link="/leave"
// //             />
// //             <StatCard
// //               title="Today's Attendance"
// //               value={stats.todayAttendance}
// //               icon={ClockIcon}
// //               color="bg-green-500"
// //               change="+5.2%"
// //               link="/attendance"
// //             />
// //           </>
// //         ) : (
// //           <>
// //             <StatCard
// //               title="Leave Balance"
// //               value={`${stats.leaveBalance} days`}
// //               icon={CalendarDaysIcon}
// //               color="bg-blue-500"
// //               link="/leave"
// //             />
// //             <StatCard
// //               title="Pending Requests"
// //               value={stats.pendingRequests}
// //               icon={ExclamationTriangleIcon}
// //               color="bg-yellow-500"
// //               link="/leave"
// //             />
// //             <StatCard
// //               title="Approved This Year"
// //               value={stats.approvedThisYear}
// //               icon={ChartBarIcon}
// //               color="bg-green-500"
// //               link="/leave"
// //             />
// //           </>
// //         )}
// //       </div>

// //       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
// //         {/* Recent Activities / Quick Actions */}
// //         <div className="bg-white shadow-lg rounded-xl">
// //           <div className="px-6 py-4 border-b border-gray-200">
// //             <h3 className="text-lg font-medium text-gray-900">
// //               {isHRManager() ? 'Recent Activities' : 'Quick Actions'}
// //             </h3>
// //           </div>
// //           <div className="p-6">
// //             {isHRManager() ? (
// //               <div className="space-y-4">
// //                 {recentActivities.length === 0 ? (
// //                   <p className="text-gray-500 text-center py-4">No recent activities</p>
// //                 ) : (
// //                   recentActivities.slice(0, 5).map((activity, index) => (
// //                     <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
// //                       <ClockIcon className="h-5 w-5 text-gray-400" />
// //                       <div className="flex-1">
// //                         <p className="text-sm font-medium text-gray-900">
// //                           {activity.employee?.user?.first_name} {activity.employee?.user?.last_name}
// //                         </p>
// //                         <p className="text-sm text-gray-500">
// //                           {formatDate(activity.date)} - {activity.status}
// //                         </p>
// //                       </div>
// //                     </div>
// //                   ))
// //                 )}
// //               </div>
// //             ) : (
// //               <div className="space-y-4">
// //                 <QuickActionCard
// //                   title="Apply for Leave"
// //                   description="Submit a new leave request"
// //                   icon={CalendarDaysIcon}
// //                   color="bg-blue-500"
// //                   link="/leave"
// //                 />
// //                 <QuickActionCard
// //                   title="Mark Attendance"
// //                   description="Log your attendance for today"
// //                   icon={ClockIcon}
// //                   color="bg-green-500"
// //                   link="/attendance"
// //                 />
// //                 <QuickActionCard
// //                   title="View Profile"
// //                   description="Update your personal information"
// //                   icon={UsersIcon}
// //                   color="bg-purple-500"
// //                   link="/profile"
// //                 />
// //               </div>
// //             )}
// //           </div>
// //         </div>

// //         {/* Pending Actions / Notifications */}
// //         <div className="bg-white shadow-lg rounded-xl">
// //           <div className="px-6 py-4 border-b border-gray-200">
// //             <h3 className="text-lg font-medium text-gray-900">
// //               {isHRManager() ? 'Pending Approvals' : 'Recent Updates'}
// //             </h3>
// //           </div>
// //           <div className="p-6">
// //                     {isHRManager() ? (
// //           <div className="space-y-4">
// //             {pendingActions.length === 0 ? (
// //               <div className="text-center py-8">
// //                 <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
// //                 <p className="mt-2 text-sm text-gray-500">No pending approvals</p>
// //               </div>
// //             ) : (
// //               pendingActions.slice(0, 5).map((action, index) => (
// //                 <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
// //                   <div className="flex items-center space-x-3">
// //                     <CalendarDaysIcon className="h-5 w-5 text-yellow-600" />
// //                     <div>
// //                       <p className="text-sm font-medium text-gray-900">
// //                         {action.employee?.user?.first_name} {action.employee?.user?.last_name}
// //                       </p>
// //                       <p className="text-sm text-gray-500">
// //                         {action.leave_type?.name} - {formatDate(action.start_date)}
// //                       </p>
// //                     </div>
// //                   </div>
// //                   <Link
// //                     to="/leave"
// //                     className="text-sm font-medium text-blue-600 hover:text-blue-500"
// //                   >
// //                     Review
// //                   </Link>
// //                 </div>
// //               ))
// //             )}
// //           </div>
// //         ) : (
// //           <div className="space-y-4">
// //             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
// //               <div className="flex">
// //                 <div className="flex-shrink-0">
// //                   <BellIcon className="h-5 w-5 text-blue-400" />
// //                 </div>
// //                 <div className="ml-3">
// //                   <h4 className="text-sm font-medium text-blue-800">Welcome to HR System</h4>
// //                   <p className="mt-1 text-sm text-blue-700">
// //                     Complete your profile and explore the features available to you.
// //                   </p>
// //                 </div>
// //               </div>
// //             </div>
            
// //             <div className="bg-green-50 border border-green-200 rounded-lg p-4">
// //               <div className="flex">
// //                 <div className="flex-shrink-0">
// //                   <CalendarDaysIcon className="h-5 w-5 text-green-400" />
// //                 </div>
// //                 <div className="ml-3">
// //                   <h4 className="text-sm font-medium text-green-800">Leave Policy Updated</h4>
// //                   <p className="mt-1 text-sm text-green-700">
// //                     New leave policies are now in effect. Check your balance.
// //                   </p>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   </div>

// //   {/* Additional Actions for HR */}
// //   {isHRManager() && (
// //     <div className="bg-white shadow-lg rounded-xl p-6">
// //       <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Management Actions</h3>
// //       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //         <Link
// //           to="/employees/new"
// //           className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
// //         >
// //           <PlusIcon className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
// //           <div className="ml-3">
// //             <p className="text-sm font-medium text-blue-900">Add Employee</p>
// //             <p className="text-sm text-blue-700">Onboard a new team member</p>
// //           </div>
// //         </Link>
        
// //         <Link
// //           to="/analytics"
// //           className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
// //         >
// //           <ChartBarIcon className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform" />
// //           <div className="ml-3">
// //             <p className="text-sm font-medium text-green-900">View Analytics</p>
// //             <p className="text-sm text-green-700">Check performance metrics</p>
// //           </div>
// //         </Link>
        
// //         <Link
// //           to="/settings"
// //           className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
// //         >
// //           <svg className="h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
// //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
// //           </svg>
// //           <div className="ml-3">
// //             <p className="text-sm font-medium text-purple-900">System Settings</p>
// //             <p className="text-sm text-purple-700">Configure HR policies</p>
// //           </div>
// //         </Link>
// //       </div>
// //     </div>
// //   )}
// // </div>
// // );
// // };
// // export default Dashboard;




// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { 
//   CalendarDaysIcon,
//   ClockIcon,
//   UserGroupIcon,
//   ChartBarIcon,
//   CakeIcon,
//   BellIcon,
//   PlayIcon,
//   PauseIcon,
//   HomeIcon
// } from '@heroicons/react/24/outline';
// import { useAuth } from '../../context/AuthContext';
// import { isHRManager } from '../../utils/auth';
// import { employeeAPI, attendanceAPI, leaveAPI } from '../../services/api';
// import { formatDate, formatTime } from '../../utils/formatters';
// import StatusBadge from '../common/StatusBadge';
// import LoadingSpinner from '../common/LoadingSpinner';

// const Dashboard = () => {
//   const { user } = useAuth();
//   const [dashboardData, setDashboardData] = useState({
//     leaveBalances: [],
//     upcomingLeaves: [],
//     birthdays: [],
//     recentActivity: [],
//     attendanceStats: null,
//     currentTime: new Date(),
//     loading: true
//   });
//   const [clockedIn, setClockedIn] = useState(false);

//   useEffect(() => {
//     fetchDashboardData();
//     const timer = setInterval(() => {
//       setDashboardData(prev => ({ ...prev, currentTime: new Date() }));
//     }, 1000);

//     return () => clearInterval(timer);
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       const promises = [];

//       // Fetch leave summary for personal data
//       promises.push(leaveAPI.getLeaveSummary());
      
//       if (isHRManager()) {
//         // HR Manager specific data
//         promises.push(
//           employeeAPI.getEmployees({ limit: 10 }),
//           leaveAPI.getLeaveRequests({ status: 'PENDING', limit: 5 }),
//           leaveAPI.getLeaveRequests({ status: 'APPROVED', limit: 5 })
//         );
//       } else {
//         // Employee specific data
//         promises.push(
//           attendanceAPI.getAttendanceRecords({ limit: 7 }),
//           leaveAPI.getLeaveRequests({ limit: 5 })
//         );
//       }

//       const results = await Promise.all(promises);
      
//       // Mock upcoming birthdays and leaves data
//       const mockBirthdays = [
//         { id: 1, name: 'Aadit Palicha', date: '28 May', avatar: 'AP' },
//         { id: 2, name: 'Sameer Nigam', date: '30 May', avatar: 'SN' },
//         { id: 3, name: 'Ritesh Agarwal', date: '2 Jun', avatar: 'RA' },
//       ];

//       const mockUpcomingLeaves = [
//         { id: 1, employee: 'John Doe', leaveType: 'Annual Leave', startDate: '2024-06-01', endDate: '2024-06-03', days: 3 },
//         { id: 2, employee: 'Jane Smith', leaveType: 'Sick Leave', startDate: '2024-06-02', endDate: '2024-06-02', days: 1 },
//       ];

//       setDashboardData({
//         leaveBalances: results[0].data.leave_balances || [],
//         leaveSummary: results[0].data,
//         upcomingLeaves: mockUpcomingLeaves,
//         birthdays: mockBirthdays,
//         recentActivity: results[1]?.data?.results || results[1]?.data || [],
//         attendanceStats: {
//           avgHours: '8h 46m',
//           onTimeArrival: '60%',
//           teamAvgHours: '8h 27m',
//           teamOnTime: '13%'
//         },
//         currentTime: new Date(),
//         loading: false
//       });
//     } catch (error) {
//       console.error('Failed to fetch dashboard data:', error);
//       setDashboardData(prev => ({ ...prev, loading: false }));
//     }
//   };

//   const handleClockInOut = () => {
//     setClockedIn(!clockedIn);
//     // Here you would typically call an API to record the clock in/out
//   };

//   if (dashboardData.loading) {
//     return <LoadingSpinner text="Loading dashboard..." />;
//   }

//   const QuickAccessCard = ({ title, children, className = "" }) => (
//     <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
//       <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
//       {children}
//     </div>
//   );

//   const LeaveBalanceCircle = ({ balance }) => {
//     const used = balance.used_days;
//     const total = balance.total_days;
//     const remaining = balance.remaining_days;
//     const percentage = (used / total) * 100;
//     const circumference = 2 * Math.PI * 45;
//     const strokeDasharray = circumference;
//     const strokeDashoffset = circumference - (percentage / 100) * circumference;

//     return (
//       <div className="text-center">
//         <div className="relative w-24 h-24 mx-auto mb-2">
//           <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
//             <circle
//               cx="50"
//               cy="50"
//               r="45"
//               stroke="#e5e7eb"
//               strokeWidth="8"
//               fill="none"
//             />
//             <circle
//               cx="50"
//               cy="50"
//               r="45"
//               stroke="#3b82f6"
//               strokeWidth="8"
//               fill="none"
//               strokeDasharray={strokeDasharray}
//               strokeDashoffset={strokeDashoffset}
//               strokeLinecap="round"
//             />
//           </svg>
//           <div className="absolute inset-0 flex items-center justify-center">
//             <div className="text-center">
//               <div className="text-xl font-bold text-blue-600">{remaining}</div>
//               <div className="text-xs text-gray-500">left</div>
//             </div>
//           </div>
//         </div>
//         <div className="text-sm font-medium text-gray-900">{balance.leave_type?.code}</div>
//         <div className="text-xs text-gray-500">{used}/{total} used</div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 px-6 py-4">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">
//               Welcome, {user?.first_name}! 👋
//             </h1>
//             <p className="text-sm text-gray-600 mt-1">
//               {new Date().toLocaleDateString('en-US', { 
//                 weekday: 'long', 
//                 year: 'numeric', 
//                 month: 'long', 
//                 day: 'numeric' 
//               })}
//             </p>
//           </div>
//           <div className="flex items-center space-x-4">
//             <div className="text-right">
//               <div className="text-2xl font-bold text-gray-900">
//                 {dashboardData.currentTime.toLocaleTimeString([], { 
//                   hour: '2-digit', 
//                   minute: '2-digit',
//                   second: '2-digit'
//                 })}
//               </div>
//               <div className="text-sm text-gray-500">Current Time</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-6">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Left Column */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Quick Access */}
//             <QuickAccessCard title="Quick Access">
//               <div className="grid grid-cols-2 gap-4">
//                 <button className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
//                   <div className="text-center">
//                     <CalendarDaysIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
//                     <span className="text-sm font-medium text-blue-900">Apply Leave</span>
//                   </div>
//                 </button>
//                 <button className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
//                   <div className="text-center">
//                     <ClockIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
//                     <span className="text-sm font-medium text-green-900">View Attendance</span>
//                   </div>
//                 </button>
//               </div>
//             </QuickAccessCard>

//             {/* Attendance Stats */}
//             <QuickAccessCard title="Attendance Stats">
//               <div className="grid grid-cols-2 gap-6">
//                 <div>
//                   <div className="flex items-center mb-4">
//                     <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
//                       <span className="text-white font-semibold text-sm">Me</span>
//                     </div>
//                     <span className="font-medium text-gray-900">Me</span>
//                   </div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <div className="text-sm text-gray-500">AVG HRS / DAY</div>
//                       <div className="text-xl font-bold text-gray-900">{dashboardData.attendanceStats?.avgHours}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-gray-500">ON TIME ARRIVAL</div>
//                       <div className="text-xl font-bold text-gray-900">{dashboardData.attendanceStats?.onTimeArrival}</div>
//                     </div>
//                   </div>
//                 </div>

//                 <div>
//                   <div className="flex items-center mb-4">
//                     <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
//                       <UserGroupIcon className="w-4 h-4 text-white" />
//                     </div>
//                     <span className="font-medium text-gray-900">My Team</span>
//                   </div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <div className="text-sm text-gray-500">AVG HRS / DAY</div>
//                       <div className="text-xl font-bold text-gray-900">{dashboardData.attendanceStats?.teamAvgHours}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-gray-500">ON TIME ARRIVAL</div>
//                       <div className="text-xl font-bold text-gray-900">{dashboardData.attendanceStats?.teamOnTime}</div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </QuickAccessCard>

//             {/* Current Day Timing */}
//             <QuickAccessCard title="Today's Timing">
//               <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
//                 <div className="flex items-center justify-between mb-3">
//                   <span className="text-sm text-gray-600">Today (10:00 AM - 7:00 PM)</span>
//                   <span className="text-sm text-gray-500">Duration: 9h 0m</span>
//                 </div>
//                 <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
//                   <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <button
//                     onClick={handleClockInOut}
//                     className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
//                       clockedIn
//                         ? 'bg-red-100 text-red-700 hover:bg-red-200'
//                         : 'bg-green-100 text-green-700 hover:bg-green-200'
//                     }`}
//                   >
//                     {clockedIn ? <PauseIcon className="w-4 h-4 mr-2" /> : <PlayIcon className="w-4 h-4 mr-2" />}
//                     {clockedIn ? 'Clock Out' : 'Clock In'}
//                   </button>
//                   <div className="text-right">
//                     <div className="text-lg font-bold text-gray-900">
//                       {dashboardData.currentTime.toLocaleTimeString([], { 
//                         hour: '2-digit', 
//                         minute: '2-digit'
//                       })}
//                     </div>
//                     <div className="text-xs text-gray-500">Current Time</div>
//                   </div>
//                 </div>
//               </div>
//             </QuickAccessCard>

//             {/* Upcoming Leaves (HR Manager View) */}
//             {isHRManager() && (
//               <QuickAccessCard title="Upcoming Team Leaves">
//                 <div className="space-y-3">
//                   {dashboardData.upcomingLeaves.length === 0 ? (
//                     <p className="text-gray-500 text-sm">No upcoming leaves</p>
//                   ) : (
//                     dashboardData.upcomingLeaves.map((leave) => (
//                       <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                         <div>
//                           <div className="font-medium text-gray-900">{leave.employee}</div>
//                           <div className="text-sm text-gray-500">
//                             {leave.leaveType} • {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
//                           </div>
//                         </div>
//                         <div className="text-sm font-medium text-blue-600">
//                           {leave.days} day{leave.days !== 1 ? 's' : ''}
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </QuickAccessCard>
//             )}
//           </div>

//           {/* Right Column */}
//           <div className="space-y-6">
//             {/* Leave Balances */}
//             <QuickAccessCard title="Leave Balances">
//               <div className="space-y-4">
//                 {dashboardData.leaveBalances.length === 0 ? (
//                   <p className="text-gray-500 text-sm text-center py-4">No leave balances available</p>
//                 ) : (
//                   <div className="grid grid-cols-2 gap-4">
//                     {dashboardData.leaveBalances.slice(0, 4).map((balance) => (
//                       <LeaveBalanceCircle key={balance.id} balance={balance} />
//                     ))}
//                   </div>
//                 )}
//                 <div className="pt-4 border-t">
//                   <Link
//                     to="/leave"
//                     className="text-blue-600 hover:text-blue-500 text-sm font-medium"
//                   >
//                     Request Leave →
//                   </Link>
//                 </div>
//               </div>
//             </QuickAccessCard>

//             {/* Birthdays Today & Upcoming */}
//             <QuickAccessCard title="Birthdays & Celebrations">
//               <div className="space-y-4">
//                 <div>
//                   <div className="flex items-center text-sm text-gray-600 mb-2">
//                     <CakeIcon className="w-4 h-4 mr-1" />
//                     <span>Birthdays Today</span>
//                   </div>
//                   <div className="text-center py-6">
//                     <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
//                       <CakeIcon className="w-8 h-8 text-gray-400" />
//                     </div>
//                     <p className="text-sm text-gray-500">No birthdays today</p>
//                   </div>
//                 </div>

//                 <div>
//                   <div className="text-sm text-gray-600 mb-3">Upcoming Birthdays</div>
//                   <div className="space-y-2">
//                     {dashboardData.birthdays.map((birthday) => (
//                       <div key={birthday.id} className="flex items-center space-x-3">
//                         <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
//                           <span className="text-white text-xs font-medium">{birthday.avatar}</span>
//                         </div>
//                         <div className="flex-1">
//                           <div className="text-sm font-medium text-gray-900">{birthday.name}</div>
//                           <div className="text-xs text-gray-500">{birthday.date}</div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </QuickAccessCard>

//             {/* Actions Panel */}
//             <QuickAccessCard title="Actions">
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-700">Current Time</span>
//                   <span className="text-lg font-bold text-blue-600">
//                     {dashboardData.currentTime.toLocaleTimeString([], { 
//                       hour: '2-digit', 
//                       minute: '2-digit'
//                     })}
//                   </span>
//                 </div>
                
//                 <div className="grid grid-cols-1 gap-2">
//                   <button className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors">
//                     <span className="text-sm font-medium">Web Clock-In</span>
//                     <ClockIcon className="w-4 h-4" />
//                   </button>
                  
//                   <button className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors">
//                     <span className="text-sm font-medium">Work From Home</span>
//                     <HomeIcon className="w-4 h-4" />
//                   </button>
                  
//                   <Link
//                     to="/attendance"
//                     className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
//                   >
//                     <span className="text-sm font-medium">Attendance Policy</span>
//                     <ChartBarIcon className="w-4 h-4" />
//                   </Link>
//                 </div>
//               </div>
//             </QuickAccessCard>

//             {/* Recent Activity */}
//             <QuickAccessCard title="Recent Activity">
//               <div className="space-y-3">
//                 {dashboardData.leaveSummary?.recent_requests?.length === 0 ? (
//                   <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
//                 ) : (
//                   dashboardData.leaveSummary?.recent_requests?.slice(0, 3).map((request) => (
//                     <div key={request.id} className="border-l-4 border-blue-500 pl-3 py-2">
//                       <div className="text-sm font-medium text-gray-900">
//                         {request.leave_type?.name} Request
//                       </div>
//                       <div className="text-xs text-gray-500">
//                         {formatDate(request.start_date)} - {formatDate(request.end_date)} • {request.days_requested} days
//                       </div>
//                       <div className="mt-1">
//                         <StatusBadge status={request.status} />
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </QuickAccessCard>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;


// #################################################################################################################################


import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  CakeIcon,
  BellIcon,
  PlayIcon,
  PauseIcon,
  HomeIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { isHRManager } from '../../utils/auth';
import { employeeAPI, attendanceAPI, leaveAPI, workFromHomeAPI } from '../../services/api';
import { formatDate, formatTime } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import WorkFromHomePopup from '../attendance/WorkFromHomePopup';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    leaveBalances: [],
    upcomingLeaves: [],
    birthdays: [],
    recentActivity: [],
    attendanceStats: null,
    currentTime: new Date(),
    loading: true
  });
  
  // Check-in/Check-out state with localStorage persistence
  const [attendanceState, setAttendanceState] = useState(() => {
    const saved = localStorage.getItem(`attendance_${user?.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        checkInTime: parsed.checkInTime ? new Date(parsed.checkInTime) : null,
        workingHours: 0,
        workingMinutes: 0,
        workingSeconds: 0
      };
    }
    return {
      isCheckedIn: false,
      checkInTime: null,
      workingHours: 0,
      workingMinutes: 0,
      workingSeconds: 0,
      isWorkFromHome: false,
      todayAttendance: null,
      pendingSubmission: false
    };
  });
  
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // WFH related state
  const [showWFHPopup, setShowWFHPopup] = useState(false);
  const [wfhStatus, setWFHStatus] = useState({
    hasApprovedRequest: false,
    hasPendingRequest: false,
    hasRejectedRequest: false,
    canWorkFromHome: false,
    requestStatus: null
  });
  
  // Save attendance state to localStorage whenever it changes
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`attendance_${user.id}`, JSON.stringify({
        isCheckedIn: attendanceState.isCheckedIn,
        checkInTime: attendanceState.checkInTime,
        isWorkFromHome: attendanceState.isWorkFromHome,
        pendingSubmission: attendanceState.pendingSubmission
      }));
    }
  }, [attendanceState.isCheckedIn, attendanceState.checkInTime, attendanceState.isWorkFromHome, attendanceState.pendingSubmission, user?.id]);

  useEffect(() => {
    fetchDashboardData();
    checkTodayAttendance();
    checkPendingSubmissions();
    checkWFHStatus();
    
    const timer = setInterval(() => {
      setDashboardData(prev => ({ ...prev, currentTime: new Date() }));
      updateWorkingTime();
      checkAutoSubmit();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const promises = [];
      promises.push(leaveAPI.getLeaveSummary());
      
      if (isHRManager()) {
        promises.push(
          employeeAPI.getEmployees({ limit: 10 }),
          leaveAPI.getLeaveRequests({ status: 'PENDING', limit: 5 }),
          leaveAPI.getLeaveRequests({ status: 'APPROVED', limit: 5 })
        );
      } else {
        promises.push(
          attendanceAPI.getAttendanceRecords({ limit: 7 }),
          leaveAPI.getLeaveRequests({ limit: 5 })
        );
      }

      const results = await Promise.all(promises);
      
      const mockBirthdays = [
        { id: 1, name: 'Aadit Palicha', date: '28 May', avatar: 'AP' },
        { id: 2, name: 'Sameer Nigam', date: '30 May', avatar: 'SN' },
        { id: 3, name: 'Ritesh Agarwal', date: '2 Jun', avatar: 'RA' },
      ];

      const mockUpcomingLeaves = [
        { id: 1, employee: 'John Doe', leaveType: 'Annual Leave', startDate: '2024-06-01', endDate: '2024-06-03', days: 3 },
        { id: 2, employee: 'Jane Smith', leaveType: 'Sick Leave', startDate: '2024-06-02', endDate: '2024-06-02', days: 1 },
      ];

      setDashboardData({
        leaveBalances: results[0].data.leave_balances || [],
        leaveSummary: results[0].data,
        upcomingLeaves: mockUpcomingLeaves,
        birthdays: mockBirthdays,
        recentActivity: results[1]?.data?.results || results[1]?.data || [],
        attendanceStats: {
          avgHours: '8h 46m',
          onTimeArrival: '60%',
          teamAvgHours: '8h 27m',
          teamOnTime: '13%'
        },
        currentTime: new Date(),
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await attendanceAPI.getAttendanceRecords({ 
        start_date: today, 
        end_date: today 
      });
      
      const todayRecord = response.data.results?.[0] || response.data?.[0];
      
      if (todayRecord) {
        setAttendanceState(prev => ({
          ...prev,
          todayAttendance: todayRecord,
          pendingSubmission: false // Clear pending if record exists
        }));
        
        // Clear localStorage if record is already submitted
        if (user?.id) {
          localStorage.removeItem(`attendance_${user.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to check today attendance:', error);
    }
  };

  const checkPendingSubmissions = () => {
    // Check if there's a pending submission that should be auto-submitted
    if (attendanceState.isCheckedIn && attendanceState.checkInTime) {
      const now = new Date();
      const checkInTime = new Date(attendanceState.checkInTime);
      const hoursDiff = (now - checkInTime) / (1000 * 60 * 60);
      
      // If more than 24 hours, auto-submit without check-out
      if (hoursDiff >= 24) {
        submitPendingAttendance(false);
      }
    }
  };

  const checkAutoSubmit = () => {
    if (attendanceState.isCheckedIn && attendanceState.checkInTime) {
      const now = new Date();
      const checkInTime = new Date(attendanceState.checkInTime);
      const hoursDiff = (now - checkInTime) / (1000 * 60 * 60);
      
      // Auto-submit after 24 hours
      if (hoursDiff >= 24 && !attendanceState.pendingSubmission) {
        toast.info('Auto-submitting attendance after 24 hours...');
        submitPendingAttendance(false);
      }
    }
  };

  const updateWorkingTime = () => {
    if (attendanceState.isCheckedIn && attendanceState.checkInTime) {
      const now = new Date();
      const checkInTime = new Date(attendanceState.checkInTime);
      const diffMs = now - checkInTime;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setAttendanceState(prev => ({
        ...prev,
        workingHours: hours,
        workingMinutes: minutes,
        workingSeconds: seconds
      }));
    }
  };

  // Enhanced WFH status check function
  const checkWFHStatus = async () => {
    try {
      // HR managers can always work from home
      if (isHRManager()) {
        setWFHStatus({
          hasApprovedRequest: true, // HR always has approval
          hasPendingRequest: false,
          hasRejectedRequest: false,
          canWorkFromHome: true,
          requestStatus: 'APPROVED'
        });
        return;
      }

      // For regular employees, check today's WFH requests
      const today = new Date().toISOString().split('T')[0];
      const response = await workFromHomeAPI.getWFHRequests();
      
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

      // Find today's WFH request
      const todayWFHRequest = requestsData.find(request => 
        request.request_date === today || request.formatted_request_date === today
      );

      if (todayWFHRequest) {
        setWFHStatus({
          hasApprovedRequest: todayWFHRequest.status === 'APPROVED',
          hasPendingRequest: todayWFHRequest.status === 'PENDING',
          hasRejectedRequest: todayWFHRequest.status === 'REJECTED',
          canWorkFromHome: todayWFHRequest.status === 'APPROVED',
          requestStatus: todayWFHRequest.status
        });
      } else {
        // No WFH request for today
        setWFHStatus({
          hasApprovedRequest: false,
          hasPendingRequest: false,
          hasRejectedRequest: false,
          canWorkFromHome: false,
          requestStatus: null
        });
      }
    } catch (error) {
      console.error('Failed to check WFH status:', error);
      // Set default values if API fails
      setWFHStatus({
        hasApprovedRequest: false,
        hasPendingRequest: false,
        hasRejectedRequest: false,
        canWorkFromHome: false,
        requestStatus: null
      });
    }
  };

  // Updated handleCheckIn function
  const handleCheckIn = async (workFromHome = false) => {
    if (workFromHome) {
      // If HR manager or has approved WFH request, proceed with check-in
      if (isHRManager() || wfhStatus.hasApprovedRequest) {
        // Direct check-in for WFH
        const now = new Date();
        setAttendanceState(prev => ({
          ...prev,
          isCheckedIn: true,
          checkInTime: now,
          isWorkFromHome: true,
          workingHours: 0,
          workingMinutes: 0,
          workingSeconds: 0,
          pendingSubmission: true
        }));

        toast.success('🏠 Work from Home started! Timer is running.');
        return;
      } else {
        // No approved WFH request, show application form
        setShowWFHPopup(true);
        return;
      }
    }
    
    // Regular office check-in
    const now = new Date();
    setAttendanceState(prev => ({
      ...prev,
      isCheckedIn: true,
      checkInTime: now,
      isWorkFromHome: false,
      workingHours: 0,
      workingMinutes: 0,
      workingSeconds: 0,
      pendingSubmission: true
    }));

    toast.success('🏢 Office Check-in successful! Timer is running.');
  };

  // WFH success handler
  const handleWFHSuccess = () => {
    toast.success('Work from home request submitted! You will be notified once approved.');
    checkWFHStatus(); // Refresh WFH status
    setShowWFHPopup(false);
  };

  // Render WFH button based on user role and status
  const renderWFHButton = () => {
    if (isHRManager()) {
      // HR managers can always work from home
      return (
        <button
          onClick={() => handleCheckIn(true)}
          disabled={submittingAttendance}
          className="flex items-center justify-center py-4 px-6 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          <HomeIcon className="w-5 h-5 mr-2" />
          Work From Home
        </button>
      );
    }

    // For regular employees
    if (wfhStatus.hasApprovedRequest) {
      // Has approved WFH request - direct check-in
      return (
        <button
          onClick={() => handleCheckIn(true)}
          disabled={submittingAttendance}
          className="flex items-center justify-center py-4 px-6 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          <HomeIcon className="w-5 h-5 mr-2" />
          Work From Home
        </button>
      );
    } else if (wfhStatus.hasPendingRequest) {
      // Has pending WFH request
      return (
        <button
          disabled={true}
          className="flex items-center justify-center py-4 px-6 bg-yellow-600 opacity-75 rounded-xl font-semibold cursor-not-allowed"
        >
          <ClockIcon className="w-5 h-5 mr-2" />
          WFH Pending
        </button>
      );
    } else if (wfhStatus.hasRejectedRequest) {
      // Has rejected WFH request
      return (
        <button
          onClick={() => setShowWFHPopup(true)}
          disabled={submittingAttendance}
          className="flex items-center justify-center py-4 px-6 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          <HomeIcon className="w-5 h-5 mr-2" />
          WFH Rejected - Reapply
        </button>
      );
    } else {
      // No WFH request for today
      return (
        <button
          onClick={() => setShowWFHPopup(true)}
          disabled={submittingAttendance}
          className="flex items-center justify-center py-4 px-6 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          <HomeIcon className="w-5 h-5 mr-2" />
          Apply WFH
        </button>
      );
    }
  };

  // Render WFH status indicator
  const renderWFHStatus = () => {
    if (isHRManager()) {
      return null; // HR doesn't need WFH status indicator
    }

    if (wfhStatus.hasApprovedRequest) {
      return (
        <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
          <div className="flex items-center text-green-200 text-sm">
            <HomeIcon className="w-4 h-4 mr-2" />
            <span>✅ WFH Request approved for today - You can work from home!</span>
          </div>
        </div>
      );
    } else if (wfhStatus.hasPendingRequest) {
      return (
        <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center text-yellow-200 text-sm">
            <ClockIcon className="w-4 h-4 mr-2" />
            <span>⏳ WFH Request for today is pending approval</span>
          </div>
        </div>
      );
    } else if (wfhStatus.hasRejectedRequest) {
      return (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center text-red-200 text-sm">
            <HomeIcon className="w-4 h-4 mr-2" />
            <span>❌ WFH Request for today was rejected - You can reapply</span>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const handleCheckOut = async () => {
    if (!attendanceState.isCheckedIn || !attendanceState.checkInTime) {
      toast.error('You need to check in first!');
      return;
    }

    setSubmittingAttendance(true);
    
    try {
      await submitPendingAttendance(true);
      
      const totalWorkedHours = `${attendanceState.workingHours}h ${attendanceState.workingMinutes}m`;
      
      // Reset state
      setAttendanceState(prev => ({
        ...prev,
        isCheckedIn: false,
        checkInTime: null,
        workingHours: 0,
        workingMinutes: 0,
        workingSeconds: 0,
        pendingSubmission: false
      }));

      // Clear localStorage
      if (user?.id) {
        localStorage.removeItem(`attendance_${user.id}`);
      }

      toast.success(`✅ Checked out successfully! Total worked: ${totalWorkedHours}`);
      checkTodayAttendance(); // Refresh today's attendance
    } catch (error) {
      toast.error('Failed to check out. Please try again.');
      console.error('Check-out error:', error);
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const submitPendingAttendance = async (includeCheckOut = true) => {
    if (!attendanceState.checkInTime) return;

    const now = new Date();
    const checkInTime = new Date(attendanceState.checkInTime);
    
    const attendanceData = {
      date: checkInTime.toISOString().split('T')[0],
      check_in_time: checkInTime.toTimeString().slice(0, 8),
      status: 'PRESENT',
      notes: attendanceState.isWorkFromHome ? 'Work from Home' : 'Office'
    };

    // Add check-out time if provided
    if (includeCheckOut) {
      attendanceData.check_out_time = now.toTimeString().slice(0, 8);
      attendanceData.notes += ' - Completed';
    } else {
      attendanceData.notes += ' - Auto-submitted (no check-out)';
    }

    await attendanceAPI.markManualAttendance(attendanceData);
  };

  const formatWorkingTime = () => {
    const { workingHours, workingMinutes, workingSeconds } = attendanceState;
    if (workingHours === 0 && workingMinutes === 0 && workingSeconds === 0) {
      return '00:00:00';
    }
    return `${String(workingHours).padStart(2, '0')}:${String(workingMinutes).padStart(2, '0')}:${String(workingSeconds).padStart(2, '0')}`;
  };

  const getShiftInfo = () => {
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long',
      day: '2-digit',
      month: 'short'
    });
    return `${today} • GENERAL (10:00 AM - 07:00 PM)`;
  };

  if (dashboardData.loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  const QuickAccessCard = ({ title, children, className = "" }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );

  const LeaveBalanceCircle = ({ balance }) => {
    const used = balance.used_days;
    const total = balance.total_days;
    const remaining = balance.remaining_days;
    const percentage = (used / total) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-2">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#3b82f6"
              strokeWidth="8"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{remaining}</div>
              <div className="text-xs text-gray-500">left</div>
            </div>
          </div>
        </div>
        <div className="text-sm font-medium text-gray-900">{balance.leave_type?.code}</div>
        <div className="text-xs text-gray-500">{used}/{total} used</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.first_name}! 👋
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Current Status */}
            <div className="text-right">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                attendanceState.isCheckedIn 
                  ? attendanceState.isWorkFromHome 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {attendanceState.isCheckedIn 
                  ? attendanceState.isWorkFromHome ? '🏠 Working from Home' : '🏢 Checked In'
                  : '⏸️ Not Checked In'
                }
              </div>
              {attendanceState.isCheckedIn && (
                <div className="text-sm text-gray-600 mt-1">
                  Working: {formatWorkingTime()}
                </div>
              )}
              {attendanceState.pendingSubmission && (
                <div className="text-xs text-orange-500 mt-1">
                  📝 Pending submission
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.currentTime.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
              <div className="text-sm text-gray-500">Current Time</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mobile-style Attendance Card */}
            <QuickAccessCard title="Today's Attendance">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white">
                {/* Shift Info */}
                <div className="text-sm text-slate-300 mb-4 flex items-center">
                  <span className="bg-slate-700 px-2 py-1 rounded text-xs mr-3">SHIFT TODAY</span>
                  <span>{getShiftInfo()}</span>
                </div>

                {/* Date and Status */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-2xl font-bold">
                      {new Date().getDate()} {new Date().toLocaleDateString('en-US', { month: 'short' })} {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                    <div className="text-slate-300 text-sm">
                      {attendanceState.isCheckedIn ? 'Working' : 'Not started'} • {attendanceState.workingHours}h / 9h
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-mono font-bold">
                      {formatWorkingTime()}
                    </div>
                    <div className="text-slate-300 text-xs">
                      {attendanceState.checkInTime 
                        ? `Started ${attendanceState.checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Not started'
                      }
                    </div>
                  </div>
                </div>

                {/* Check-in/Check-out Buttons */}
                <div className="space-y-3">
                  {!attendanceState.isCheckedIn ? (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Office Check-in Button - Disabled if WFH is approved */}
                      <button
                        onClick={() => handleCheckIn(false)}
                        disabled={submittingAttendance || (wfhStatus.hasApprovedRequest && !isHRManager())}
                        className={`flex items-center justify-center py-4 px-6 rounded-xl font-semibold transition-colors ${
                          (wfhStatus.hasApprovedRequest && !isHRManager())
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-green-600 hover:bg-green-700 disabled:opacity-50'
                        }`}
                        title={
                          (wfhStatus.hasApprovedRequest && !isHRManager())
                            ? 'Office check-in disabled - You have an approved WFH request for today'
                            : 'Check in from office'
                        }
                      >
                        <PlayIcon className="w-5 h-5 mr-2" />
                        {(wfhStatus.hasApprovedRequest && !isHRManager()) 
                          ? 'Office (Disabled)' 
                          : 'Check In (Office)'
                        }
                      </button>
                      
                      {renderWFHButton()}
                    </div>
                  ) : (
                    <button
                      onClick={handleCheckOut}
                      disabled={submittingAttendance}
                      className="w-full flex items-center justify-center py-4 px-6 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      {submittingAttendance ? (
                        <>
                          <LoadingSpinner size="small" />
                          <span className="ml-2">Checking Out...</span>
                        </>
                      ) : (
                        <>
                          <StopIcon className="w-5 h-5 mr-2" />
                          Check Out
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* WFH Status Indicator */}
                {renderWFHStatus()}

                {/* Additional info when office check-in is disabled */}
                {(wfhStatus.hasApprovedRequest && !isHRManager() && !attendanceState.isCheckedIn) && (
                  <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center text-blue-200 text-sm">
                      <HomeIcon className="w-4 h-4 mr-2" />
                      <span>💼 Office check-in is disabled because you have an approved work from home request for today.</span>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-300 mb-2">
                    <span>Progress</span>
                    <span>{Math.min(Math.round((attendanceState.workingHours / 9) * 100), 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min((attendanceState.workingHours / 9) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Warning for pending submission */}
                {attendanceState.pendingSubmission && (
                  <div className="mt-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                    <div className="flex items-center text-orange-200 text-sm">
                      <BellIcon className="w-4 h-4 mr-2" />
                      <span>Attendance will be auto-submitted after 24 hours if not checked out</span>
                    </div>
                  </div>
                )}
              </div>
            </QuickAccessCard>

            {/* Quick Access */}
            <QuickAccessCard title="Quick Access">
              <div className="grid grid-cols-2 gap-4">
                <Link 
                  to="/leave"
                  className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="text-center">
                    <CalendarDaysIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <span className="text-sm font-medium text-blue-900">Apply Leave</span>
                  </div>
                </Link>
                <Link 
                  to="/attendance"
                  className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="text-center">
                    <ClockIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <span className="text-sm font-medium text-green-900">View Attendance</span>
                  </div>
                </Link>
              </div>
            </QuickAccessCard>

            {/* Attendance Stats */}
            <QuickAccessCard title="Attendance Stats">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-semibold text-sm">Me</span>
                    </div>
                    <span className="font-medium text-gray-900">Me</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">AVG HRS / DAY</div>
                      <div className="text-xl font-bold text-gray-900">{dashboardData.attendanceStats?.teamOnTime}</div>
                    </div>
                  </div>
                </div>
              </div>
            </QuickAccessCard>

            {/* Upcoming Leaves (HR Manager View) */}
            {isHRManager() && (
              <QuickAccessCard title="Upcoming Team Leaves">
                <div className="space-y-3">
                  {dashboardData.upcomingLeaves.length === 0 ? (
                    <p className="text-gray-500 text-sm">No upcoming leaves</p>
                  ) : (
                    dashboardData.upcomingLeaves.map((leave) => (
                      <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{leave.employee}</div>
                          <div className="text-sm text-gray-500">
                            {leave.leaveType} • {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          {leave.days} day{leave.days !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </QuickAccessCard>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Leave Balances */}
            <QuickAccessCard title="Leave Balances">
              <div className="space-y-4">
                {dashboardData.leaveBalances.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No leave balances available</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {dashboardData.leaveBalances.slice(0, 4).map((balance) => (
                      <LeaveBalanceCircle key={balance.id} balance={balance} />
                    ))}
                  </div>
                )}
                <div className="pt-4 border-t">
                  <Link
                    to="/leave"
                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                  >
                    Request Leave →
                  </Link>
                </div>
              </div>
            </QuickAccessCard>

            {/* Birthdays Today & Upcoming */}
            <QuickAccessCard title="Birthdays & Celebrations">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <CakeIcon className="w-4 h-4 mr-1" />
                    <span>Birthdays Today</span>
                  </div>
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                      <CakeIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No birthdays today</p>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-3">Upcoming Birthdays</div>
                  <div className="space-y-2">
                    {dashboardData.birthdays.map((birthday) => (
                      <div key={birthday.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">{birthday.avatar}</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{birthday.name}</div>
                          <div className="text-xs text-gray-500">{birthday.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </QuickAccessCard>

            {/* Quick Actions */}
            <QuickAccessCard title="Quick Actions">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Current Time</span>
                  <span className="text-lg font-bold text-blue-600">
                    {dashboardData.currentTime.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Link
                    to="/attendance"
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm font-medium">View Attendance Records</span>
                    <ChartBarIcon className="w-4 h-4" />
                  </Link>
                  
                  <Link
                    to="/leave"
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <span className="text-sm font-medium">Apply for Leave</span>
                    <CalendarDaysIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </QuickAccessCard>

            {/* Recent Activity */}
            <QuickAccessCard title="Recent Activity">
              <div className="space-y-3">
                {dashboardData.leaveSummary?.recent_requests?.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
                ) : (
                  dashboardData.leaveSummary?.recent_requests?.slice(0, 3).map((request) => (
                    <div key={request.id} className="border-l-4 border-blue-500 pl-3 py-2">
                      <div className="text-sm font-medium text-gray-900">
                        {request.leave_type?.name} Request
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(request.start_date)} - {formatDate(request.end_date)} • {request.days_requested} days
                      </div>
                      <div className="mt-1">
                        <StatusBadge status={request.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </QuickAccessCard>
          </div>
        </div>
      </div>

      {/* Work From Home Popup - Only show for non-HR users */}
      {!isHRManager() && (
        <WorkFromHomePopup 
          isOpen={showWFHPopup}
          onClose={() => setShowWFHPopup(false)}
          onSuccess={handleWFHSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;


// ##################################################################################


// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import { 
//   CalendarDaysIcon,
//   ClockIcon,
//   UserGroupIcon,
//   ChartBarIcon,
//   CakeIcon,
//   BellIcon,
//   PlayIcon,
//   PauseIcon,
//   HomeIcon,
//   StopIcon
// } from '@heroicons/react/24/outline';
// import { useAuth } from '../../context/AuthContext';
// import { isHRManager } from '../../utils/auth';
// import { employeeAPI, attendanceAPI, leaveAPI } from '../../services/api';
// import { formatDate, formatTime } from '../../utils/formatters';
// import StatusBadge from '../common/StatusBadge';
// import LoadingSpinner from '../common/LoadingSpinner';
// import WorkFromHomePopup from '../attendance/WorkFromHomePopup';

// const Dashboard = () => {
//   const { user } = useAuth();
//   const [dashboardData, setDashboardData] = useState({
//     leaveBalances: [],
//     upcomingLeaves: [],
//     birthdays: [],
//     recentActivity: [],
//     attendanceStats: null,
//     currentTime: new Date(),
//     loading: true
//   });
  
//   // Check-in/Check-out state with localStorage persistence
//   const [attendanceState, setAttendanceState] = useState(() => {
//     const saved = localStorage.getItem(`attendance_${user?.id}`);
//     if (saved) {
//       const parsed = JSON.parse(saved);
//       return {
//         ...parsed,
//         checkInTime: parsed.checkInTime ? new Date(parsed.checkInTime) : null,
//         workingHours: 0,
//         workingMinutes: 0,
//         workingSeconds: 0
//       };
//     }
//     return {
//       isCheckedIn: false,
//       checkInTime: null,
//       workingHours: 0,
//       workingMinutes: 0,
//       workingSeconds: 0,
//       isWorkFromHome: false,
//       todayAttendance: null,
//       pendingSubmission: false
//     };
//   });
  
//   const [submittingAttendance, setSubmittingAttendance] = useState(false);

//   // WFH related state
//   const [showWFHPopup, setShowWFHPopup] = useState(false);
//   const [wfhStatus, setWFHStatus] = useState({
//     has_wfh_request: false,
//     can_work_from_home: false,
//     status: null,
//     is_hr_admin: false
//   });
  
//   // Save attendance state to localStorage whenever it changes
//   useEffect(() => {
//     if (user?.id) {
//       localStorage.setItem(`attendance_${user.id}`, JSON.stringify({
//         isCheckedIn: attendanceState.isCheckedIn,
//         checkInTime: attendanceState.checkInTime,
//         isWorkFromHome: attendanceState.isWorkFromHome,
//         pendingSubmission: attendanceState.pendingSubmission
//       }));
//     }
//   }, [attendanceState.isCheckedIn, attendanceState.checkInTime, attendanceState.isWorkFromHome, attendanceState.pendingSubmission, user?.id]);

//   useEffect(() => {
//     fetchDashboardData();
//     checkTodayAttendance();
//     checkPendingSubmissions();
//     checkWFHStatus();
    
//     const timer = setInterval(() => {
//       setDashboardData(prev => ({ ...prev, currentTime: new Date() }));
//       updateWorkingTime();
//       checkAutoSubmit();
//     }, 1000);

//     return () => clearInterval(timer);
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       const promises = [];
//       promises.push(leaveAPI.getLeaveSummary());
      
//       if (isHRManager()) {
//         promises.push(
//           employeeAPI.getEmployees({ limit: 10 }),
//           leaveAPI.getLeaveRequests({ status: 'PENDING', limit: 5 }),
//           leaveAPI.getLeaveRequests({ status: 'APPROVED', limit: 5 })
//         );
//       } else {
//         promises.push(
//           attendanceAPI.getAttendanceRecords({ limit: 7 }),
//           leaveAPI.getLeaveRequests({ limit: 5 })
//         );
//       }

//       const results = await Promise.all(promises);
      
//       const mockBirthdays = [
//         { id: 1, name: 'Aadit Palicha', date: '28 May', avatar: 'AP' },
//         { id: 2, name: 'Sameer Nigam', date: '30 May', avatar: 'SN' },
//         { id: 3, name: 'Ritesh Agarwal', date: '2 Jun', avatar: 'RA' },
//       ];

//       const mockUpcomingLeaves = [
//         { id: 1, employee: 'John Doe', leaveType: 'Annual Leave', startDate: '2024-06-01', endDate: '2024-06-03', days: 3 },
//         { id: 2, employee: 'Jane Smith', leaveType: 'Sick Leave', startDate: '2024-06-02', endDate: '2024-06-02', days: 1 },
//       ];

//       setDashboardData({
//         leaveBalances: results[0].data.leave_balances || [],
//         leaveSummary: results[0].data,
//         upcomingLeaves: mockUpcomingLeaves,
//         birthdays: mockBirthdays,
//         recentActivity: results[1]?.data?.results || results[1]?.data || [],
//         attendanceStats: {
//           avgHours: '8h 46m',
//           onTimeArrival: '60%',
//           teamAvgHours: '8h 27m',
//           teamOnTime: '13%'
//         },
//         currentTime: new Date(),
//         loading: false
//       });
//     } catch (error) {
//       console.error('Failed to fetch dashboard data:', error);
//       setDashboardData(prev => ({ ...prev, loading: false }));
//     }
//   };

//   const checkTodayAttendance = async () => {
//     try {
//       const today = new Date().toISOString().split('T')[0];
//       const response = await attendanceAPI.getAttendanceRecords({ 
//         start_date: today, 
//         end_date: today 
//       });
      
//       const todayRecord = response.data.results?.[0] || response.data?.[0];
      
//       if (todayRecord) {
//         setAttendanceState(prev => ({
//           ...prev,
//           todayAttendance: todayRecord,
//           pendingSubmission: false // Clear pending if record exists
//         }));
        
//         // Clear localStorage if record is already submitted
//         if (user?.id) {
//           localStorage.removeItem(`attendance_${user.id}`);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to check today attendance:', error);
//     }
//   };

//   const checkPendingSubmissions = () => {
//     // Check if there's a pending submission that should be auto-submitted
//     if (attendanceState.isCheckedIn && attendanceState.checkInTime) {
//       const now = new Date();
//       const checkInTime = new Date(attendanceState.checkInTime);
//       const hoursDiff = (now - checkInTime) / (1000 * 60 * 60);
      
//       // If more than 24 hours, auto-submit without check-out
//       if (hoursDiff >= 24) {
//         submitPendingAttendance(false);
//       }
//     }
//   };

//   const checkAutoSubmit = () => {
//     if (attendanceState.isCheckedIn && attendanceState.checkInTime) {
//       const now = new Date();
//       const checkInTime = new Date(attendanceState.checkInTime);
//       const hoursDiff = (now - checkInTime) / (1000 * 60 * 60);
      
//       // Auto-submit after 24 hours
//       if (hoursDiff >= 24 && !attendanceState.pendingSubmission) {
//         toast.info('Auto-submitting attendance after 24 hours...');
//         submitPendingAttendance(false);
//       }
//     }
//   };

//   const updateWorkingTime = () => {
//     if (attendanceState.isCheckedIn && attendanceState.checkInTime) {
//       const now = new Date();
//       const checkInTime = new Date(attendanceState.checkInTime);
//       const diffMs = now - checkInTime;
//       const hours = Math.floor(diffMs / (1000 * 60 * 60));
//       const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
//       const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
//       setAttendanceState(prev => ({
//         ...prev,
//         workingHours: hours,
//         workingMinutes: minutes,
//         workingSeconds: seconds
//       }));
//     }
//   };

//   // Check WFH status function
//   const checkWFHStatus = async () => {
//     try {
//       // Only check WFH status for employees, not HR managers
//       if (isHRManager()) {
//         setWFHStatus({
//           has_wfh_request: false,
//           can_work_from_home: true, // HR can always work from home
//           status: null,
//           is_hr_admin: true
//         });
//         return;
//       }

//       const today = new Date().toISOString().split('T')[0];
//       const response = await fetch(`http://127.0.0.1:8000/api/attendance/wfh/status/?date=${today}`, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//         }
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         setWFHStatus(data);
//       } else {
//         console.error('Failed to check WFH status:', response.statusText);
//         // Set default values for employees if API fails
//         setWFHStatus({
//           has_wfh_request: false,
//           can_work_from_home: false,
//           status: null,
//           is_hr_admin: false
//         });
//       }
//     } catch (error) {
//       console.error('Failed to check WFH status:', error);
//       // Set default values if network error
//       setWFHStatus({
//         has_wfh_request: false,
//         can_work_from_home: false,
//         status: null,
//         is_hr_admin: false
//       });
//     }
//   };

//   // Updated handleCheckIn function
//   const handleCheckIn = async (workFromHome = false) => {
//     if (workFromHome) {
//       // HR managers can always work from home
//       if (isHRManager()) {
//         // Allow HR to work from home without approval
//       } else {
//         // Regular employees need approval
//         if (!wfhStatus.can_work_from_home) {
//           // Show popup to apply for WFH
//           setShowWFHPopup(true);
//           return;
//         }
//       }
//     }
    
//     // Existing check-in logic
//     const now = new Date();
//     setAttendanceState(prev => ({
//       ...prev,
//       isCheckedIn: true,
//       checkInTime: now,
//       isWorkFromHome: workFromHome,
//       workingHours: 0,
//       workingMinutes: 0,
//       workingSeconds: 0,
//       pendingSubmission: true
//     }));

//     toast.success(
//       workFromHome 
//         ? '🏠 Work from Home started! Timer is running.' 
//         : '🏢 Office Check-in successful! Timer is running.'
//     );
//   };

//   // WFH success handler
//   const handleWFHSuccess = () => {
//     toast.success('Work from home request submitted! You will be notified once approved.');
//     checkWFHStatus(); // Refresh WFH status
//   };

//   // Render WFH button based on user role and status
//   const renderWFHButton = () => {
//     if (isHRManager()) {
//       // HR managers can always work from home
//       return (
//         <button
//           onClick={() => handleCheckIn(true)}
//           disabled={submittingAttendance}
//           className="flex items-center justify-center py-4 px-6 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
//         >
//           <HomeIcon className="w-5 h-5 mr-2" />
//           Work From Home
//         </button>
//       );
//     }

//     // For regular employees
//     return (
//       <button
//         onClick={() => handleCheckIn(true)}
//         disabled={submittingAttendance}
//         className={`flex items-center justify-center py-4 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 ${
//           wfhStatus.can_work_from_home 
//             ? 'bg-purple-600 hover:bg-purple-700' 
//             : wfhStatus.has_wfh_request && wfhStatus.status === 'PENDING'
//               ? 'bg-yellow-600 hover:bg-yellow-700'
//               : 'bg-purple-600 hover:bg-purple-700'
//         }`}
//       >
//         <HomeIcon className="w-5 h-5 mr-2" />
//         {wfhStatus.can_work_from_home 
//           ? 'Work From Home' 
//           : wfhStatus.has_wfh_request && wfhStatus.status === 'PENDING'
//             ? 'WFH Pending'
//             : 'Apply WFH'
//         }
//       </button>
//     );
//   };

//   // Render WFH status indicator
//   const renderWFHStatus = () => {
//     if (isHRManager()) {
//       return null; // HR doesn't need WFH status indicator
//     }

//     if (wfhStatus.has_wfh_request) {
//       return (
//         <div className="mt-4 p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg">
//           <div className="flex items-center text-purple-200 text-sm">
//             <HomeIcon className="w-4 h-4 mr-2" />
//             <span>
//               WFH Request for today: 
//               {wfhStatus.status === 'APPROVED' && ' ✅ Approved'}
//               {wfhStatus.status === 'PENDING' && ' ⏳ Pending approval'}
//               {wfhStatus.status === 'REJECTED' && ' ❌ Rejected'}
//             </span>
//           </div>
//         </div>
//       );
//     }
//     return null;
//   };

//   const handleCheckOut = async () => {
//     if (!attendanceState.isCheckedIn || !attendanceState.checkInTime) {
//       toast.error('You need to check in first!');
//       return;
//     }

//     setSubmittingAttendance(true);
    
//     try {
//       await submitPendingAttendance(true);
      
//       const totalWorkedHours = `${attendanceState.workingHours}h ${attendanceState.workingMinutes}m`;
      
//       // Reset state
//       setAttendanceState(prev => ({
//         ...prev,
//         isCheckedIn: false,
//         checkInTime: null,
//         workingHours: 0,
//         workingMinutes: 0,
//         workingSeconds: 0,
//         pendingSubmission: false
//       }));

//       // Clear localStorage
//       if (user?.id) {
//         localStorage.removeItem(`attendance_${user.id}`);
//       }

//       toast.success(`✅ Checked out successfully! Total worked: ${totalWorkedHours}`);
//       checkTodayAttendance(); // Refresh today's attendance
//     } catch (error) {
//       toast.error('Failed to check out. Please try again.');
//       console.error('Check-out error:', error);
//     } finally {
//       setSubmittingAttendance(false);
//     }
//   };

//   const submitPendingAttendance = async (includeCheckOut = true) => {
//     if (!attendanceState.checkInTime) return;

//     const now = new Date();
//     const checkInTime = new Date(attendanceState.checkInTime);
    
//     const attendanceData = {
//       date: checkInTime.toISOString().split('T')[0],
//       check_in_time: checkInTime.toTimeString().slice(0, 8),
//       status: 'PRESENT',
//       notes: attendanceState.isWorkFromHome ? 'Work from Home' : 'Office'
//     };

//     // Add check-out time if provided
//     if (includeCheckOut) {
//       attendanceData.check_out_time = now.toTimeString().slice(0, 8);
//       attendanceData.notes += ' - Completed';
//     } else {
//       attendanceData.notes += ' - Auto-submitted (no check-out)';
//     }

//     await attendanceAPI.markManualAttendance(attendanceData);
//   };

//   const formatWorkingTime = () => {
//     const { workingHours, workingMinutes, workingSeconds } = attendanceState;
//     if (workingHours === 0 && workingMinutes === 0 && workingSeconds === 0) {
//       return '00:00:00';
//     }
//     return `${String(workingHours).padStart(2, '0')}:${String(workingMinutes).padStart(2, '0')}:${String(workingSeconds).padStart(2, '0')}`;
//   };

//   const getShiftInfo = () => {
//     const today = new Date().toLocaleDateString('en-US', { 
//       weekday: 'long',
//       day: '2-digit',
//       month: 'short'
//     });
//     return `${today} • GENERAL (10:00 AM - 07:00 PM)`;
//   };

//   if (dashboardData.loading) {
//     return <LoadingSpinner text="Loading dashboard..." />;
//   }

//   const QuickAccessCard = ({ title, children, className = "" }) => (
//     <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
//       <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
//       {children}
//     </div>
//   );

//   const LeaveBalanceCircle = ({ balance }) => {
//     const used = balance.used_days;
//     const total = balance.total_days;
//     const remaining = balance.remaining_days;
//     const percentage = (used / total) * 100;
//     const circumference = 2 * Math.PI * 45;
//     const strokeDasharray = circumference;
//     const strokeDashoffset = circumference - (percentage / 100) * circumference;

//     return (
//       <div className="text-center">
//         <div className="relative w-24 h-24 mx-auto mb-2">
//           <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
//             <circle
//               cx="50"
//               cy="50"
//               r="45"
//               stroke="#e5e7eb"
//               strokeWidth="8"
//               fill="none"
//             />
//             <circle
//               cx="50"
//               cy="50"
//               r="45"
//               stroke="#3b82f6"
//               strokeWidth="8"
//               fill="none"
//               strokeDasharray={strokeDasharray}
//               strokeDashoffset={strokeDashoffset}
//               strokeLinecap="round"
//             />
//           </svg>
//           <div className="absolute inset-0 flex items-center justify-center">
//             <div className="text-center">
//               <div className="text-xl font-bold text-blue-600">{remaining}</div>
//               <div className="text-xs text-gray-500">left</div>
//             </div>
//           </div>
//         </div>
//         <div className="text-sm font-medium text-gray-900">{balance.leave_type?.code}</div>
//         <div className="text-xs text-gray-500">{used}/{total} used</div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 px-6 py-4">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">
//               Welcome, {user?.first_name}! 👋
//             </h1>
//             <p className="text-sm text-gray-600 mt-1">
//               {new Date().toLocaleDateString('en-US', { 
//                 weekday: 'long', 
//                 year: 'numeric', 
//                 month: 'long', 
//                 day: 'numeric' 
//               })}
//             </p>
//           </div>
//           <div className="flex items-center space-x-4">
//             {/* Current Status */}
//             <div className="text-right">
//               <div className={`px-3 py-1 rounded-full text-xs font-medium ${
//                 attendanceState.isCheckedIn 
//                   ? attendanceState.isWorkFromHome 
//                     ? 'bg-purple-100 text-purple-800' 
//                     : 'bg-green-100 text-green-800'
//                   : 'bg-gray-100 text-gray-800'
//               }`}>
//                 {attendanceState.isCheckedIn 
//                   ? attendanceState.isWorkFromHome ? '🏠 Working from Home' : '🏢 Checked In'
//                   : '⏸️ Not Checked In'
//                 }
//               </div>
//               {attendanceState.isCheckedIn && (
//                 <div className="text-sm text-gray-600 mt-1">
//                   Working: {formatWorkingTime()}
//                 </div>
//               )}
//               {attendanceState.pendingSubmission && (
//                 <div className="text-xs text-orange-500 mt-1">
//                   📝 Pending submission
//                 </div>
//               )}
//             </div>
//             <div className="text-right">
//               <div className="text-2xl font-bold text-gray-900">
//                 {dashboardData.currentTime.toLocaleTimeString([], { 
//                   hour: '2-digit', 
//                   minute: '2-digit',
//                   second: '2-digit'
//                 })}
//               </div>
//               <div className="text-sm text-gray-500">Current Time</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-6">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Left Column */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Mobile-style Attendance Card */}
//             <QuickAccessCard title="Today's Attendance">
//               <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white">
//                 {/* Shift Info */}
//                 <div className="text-sm text-slate-300 mb-4 flex items-center">
//                   <span className="bg-slate-700 px-2 py-1 rounded text-xs mr-3">SHIFT TODAY</span>
//                   <span>{getShiftInfo()}</span>
//                 </div>

//                 {/* Date and Status */}
//                 <div className="flex items-center justify-between mb-6">
//                   <div>
//                     <div className="text-2xl font-bold">
//                       {new Date().getDate()} {new Date().toLocaleDateString('en-US', { month: 'short' })} {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
//                     </div>
//                     <div className="text-slate-300 text-sm">
//                       {attendanceState.isCheckedIn ? 'Working' : 'Not started'} • {attendanceState.workingHours}h / 9h
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-3xl font-mono font-bold">
//                       {formatWorkingTime()}
//                     </div>
//                     <div className="text-slate-300 text-xs">
//                       {attendanceState.checkInTime 
//                         ? `Started ${attendanceState.checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
//                         : 'Not started'
//                       }
//                     </div>
//                   </div>
//                 </div>

//                 {/* Check-in/Check-out Buttons */}
//                 <div className="space-y-3">
//                   {!attendanceState.isCheckedIn ? (
//                     <div className="grid grid-cols-2 gap-3">
//                       <button
//                         onClick={() => handleCheckIn(false)}
//                         disabled={submittingAttendance}
//                         className="flex items-center justify-center py-4 px-6 bg-green-600 hover:bg-green-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
//                       >
//                         <PlayIcon className="w-5 h-5 mr-2" />
//                         Check In (Office)
//                       </button>
                      
//                       {renderWFHButton()}
//                     </div>
//                   ) : (
//                     <button
//                       onClick={handleCheckOut}
//                       disabled={submittingAttendance}
//                       className="w-full flex items-center justify-center py-4 px-6 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
//                     >
//                       {submittingAttendance ? (
//                         <>
//                           <LoadingSpinner size="small" />
//                           <span className="ml-2">Checking Out...</span>
//                         </>
//                       ) : (
//                         <>
//                           <StopIcon className="w-5 h-5 mr-2" />
//                           Check Out
//                         </>
//                       )}
//                     </button>
//                   )}
//                 </div>

//                 {/* WFH Status Indicator */}
//                 {renderWFHStatus()}

//                 {/* Progress Bar */}
//                 <div className="mt-4">
//                   <div className="flex justify-between text-xs text-slate-300 mb-2">
//                     <span>Progress</span>
//                     <span>{Math.min(Math.round((attendanceState.workingHours / 9) * 100), 100)}%</span>
//                   </div>
//                   <div className="w-full bg-slate-700 rounded-full h-2">
//                     <div 
//                       className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
//                       style={{ width: `${Math.min((attendanceState.workingHours / 9) * 100, 100)}%` }}
//                     ></div>
//                   </div>
//                 </div>

//                 {/* Warning for pending submission */}
//                 {attendanceState.pendingSubmission && (
//                   <div className="mt-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
//                     <div className="flex items-center text-orange-200 text-sm">
//                       <BellIcon className="w-4 h-4 mr-2" />
//                       <span>Attendance will be auto-submitted after 24 hours if not checked out</span>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </QuickAccessCard>

//             {/* Quick Access */}
//             <QuickAccessCard title="Quick Access">
//               <div className="grid grid-cols-2 gap-4">
//                 <Link 
//                   to="/leave"
//                   className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
//                 >
//                   <div className="text-center">
//                     <CalendarDaysIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
//                     <span className="text-sm font-medium text-blue-900">Apply Leave</span>
//                   </div>
//                 </Link>
//                 <Link 
//                   to="/attendance"
//                   className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
//                 >
//                   <div className="text-center">
//                     <ClockIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
//                     <span className="text-sm font-medium text-green-900">View Attendance</span>
//                   </div>
//                 </Link>
//               </div>
//             </QuickAccessCard>

//                         {/* Attendance Stats */}
//             <QuickAccessCard title="Attendance Stats">
//               <div className="grid grid-cols-2 gap-6">
//                 <div>
//                   <div className="flex items-center mb-4">
//                     <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
//                       <span className="text-white font-semibold text-sm">Me</span>
//                     </div>
//                     <span className="font-medium text-gray-900">Me</span>
//                   </div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <div className="text-sm text-gray-500">AVG HRS / DAY</div>
//                       <div className="text-xl font-bold text-gray-900">{dashboardData.attendanceStats?.teamOnTime}</div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </QuickAccessCard>

//             {/* Upcoming Leaves (HR Manager View) */}
//             {isHRManager() && (
//               <QuickAccessCard title="Upcoming Team Leaves">
//                 <div className="space-y-3">
//                   {dashboardData.upcomingLeaves.length === 0 ? (
//                     <p className="text-gray-500 text-sm">No upcoming leaves</p>
//                   ) : (
//                     dashboardData.upcomingLeaves.map((leave) => (
//                       <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                         <div>
//                           <div className="font-medium text-gray-900">{leave.employee}</div>
//                           <div className="text-sm text-gray-500">
//                             {leave.leaveType} • {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
//                           </div>
//                         </div>
//                         <div className="text-sm font-medium text-blue-600">
//                           {leave.days} day{leave.days !== 1 ? 's' : ''}
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </QuickAccessCard>
//             )}
//           </div>

//           {/* Right Column */}
//           <div className="space-y-6">
//             {/* Leave Balances */}
//             <QuickAccessCard title="Leave Balances">
//               <div className="space-y-4">
//                 {dashboardData.leaveBalances.length === 0 ? (
//                   <p className="text-gray-500 text-sm text-center py-4">No leave balances available</p>
//                 ) : (
//                   <div className="grid grid-cols-2 gap-4">
//                     {dashboardData.leaveBalances.slice(0, 4).map((balance) => (
//                       <LeaveBalanceCircle key={balance.id} balance={balance} />
//                     ))}
//                   </div>
//                 )}
//                 <div className="pt-4 border-t">
//                   <Link
//                     to="/leave"
//                     className="text-blue-600 hover:text-blue-500 text-sm font-medium"
//                   >
//                     Request Leave →
//                   </Link>
//                 </div>
//               </div>
//             </QuickAccessCard>

//             {/* Birthdays Today & Upcoming */}
//             <QuickAccessCard title="Birthdays & Celebrations">
//               <div className="space-y-4">
//                 <div>
//                   <div className="flex items-center text-sm text-gray-600 mb-2">
//                     <CakeIcon className="w-4 h-4 mr-1" />
//                     <span>Birthdays Today</span>
//                   </div>
//                   <div className="text-center py-6">
//                     <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
//                       <CakeIcon className="w-8 h-8 text-gray-400" />
//                     </div>
//                     <p className="text-sm text-gray-500">No birthdays today</p>
//                   </div>
//                 </div>

//                 <div>
//                   <div className="text-sm text-gray-600 mb-3">Upcoming Birthdays</div>
//                   <div className="space-y-2">
//                     {dashboardData.birthdays.map((birthday) => (
//                       <div key={birthday.id} className="flex items-center space-x-3">
//                         <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
//                           <span className="text-white text-xs font-medium">{birthday.avatar}</span>
//                         </div>
//                         <div className="flex-1">
//                           <div className="text-sm font-medium text-gray-900">{birthday.name}</div>
//                           <div className="text-xs text-gray-500">{birthday.date}</div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </QuickAccessCard>

//             {/* Quick Actions */}
//             <QuickAccessCard title="Quick Actions">
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-700">Current Time</span>
//                   <span className="text-lg font-bold text-blue-600">
//                     {dashboardData.currentTime.toLocaleTimeString([], { 
//                       hour: '2-digit', 
//                       minute: '2-digit'
//                     })}
//                   </span>
//                 </div>
                
//                 <div className="grid grid-cols-1 gap-2">
//                   <Link
//                     to="/attendance"
//                     className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
//                   >
//                     <span className="text-sm font-medium">View Attendance Records</span>
//                     <ChartBarIcon className="w-4 h-4" />
//                   </Link>
                  
//                   <Link
//                     to="/leave"
//                     className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
//                   >
//                     <span className="text-sm font-medium">Apply for Leave</span>
//                     <CalendarDaysIcon className="w-4 h-4" />
//                   </Link>
//                 </div>
//               </div>
//             </QuickAccessCard>

//             {/* Recent Activity */}
//             <QuickAccessCard title="Recent Activity">
//               <div className="space-y-3">
//                 {dashboardData.leaveSummary?.recent_requests?.length === 0 ? (
//                   <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
//                 ) : (
//                   dashboardData.leaveSummary?.recent_requests?.slice(0, 3).map((request) => (
//                     <div key={request.id} className="border-l-4 border-blue-500 pl-3 py-2">
//                       <div className="text-sm font-medium text-gray-900">
//                         {request.leave_type?.name} Request
//                       </div>
//                       <div className="text-xs text-gray-500">
//                         {formatDate(request.start_date)} - {formatDate(request.end_date)} • {request.days_requested} days
//                       </div>
//                       <div className="mt-1">
//                         <StatusBadge status={request.status} />
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </QuickAccessCard>
//           </div>
//         </div>
//       </div>

//       {/* Work From Home Popup - Only show for non-HR users */}
//       {!isHRManager() && (
//         <WorkFromHomePopup 
//           isOpen={showWFHPopup}
//           onClose={() => setShowWFHPopup(false)}
//           onSuccess={handleWFHSuccess}
//         />
//       )}
//     </div>
//   );
// };
// export default Dashboard;
// ##############################################################################################################################



// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import { 
//   CalendarDaysIcon,
//   ClockIcon,
//   UserGroupIcon,
//   ChartBarIcon,
//   CakeIcon,
//   BellIcon,
//   PlayIcon,
//   PauseIcon,
//   HomeIcon,
//   StopIcon
// } from '@heroicons/react/24/outline';
// import { useAuth } from '../../context/AuthContext';
// import { isHRManager } from '../../utils/auth';
// import { employeeAPI, attendanceAPI, leaveAPI } from '../../services/api';
// import { formatDate, formatTime } from '../../utils/formatters';
// import StatusBadge from '../common/StatusBadge';
// import LoadingSpinner from '../common/LoadingSpinner';

// const Dashboard = () => {
//   const { user } = useAuth();
//   const [dashboardData, setDashboardData] = useState({
//     leaveBalances: [],
//     upcomingLeaves: [],
//     birthdays: [],
//     recentActivity: [],
//     attendanceStats: null,
//     currentTime: new Date(),
//     loading: true
//   });
  
//   // Check-in/Check-out state with localStorage persistence
//   const [attendanceState, setAttendanceState] = useState(() => {
//     const saved = localStorage.getItem(`attendance_${user?.id}`);
//     if (saved) {
//       const parsed = JSON.parse(saved);
//       return {
//         ...parsed,
//         checkInTime: parsed.checkInTime ? new Date(parsed.checkInTime) : null,
//         workingHours: 0,
//         workingMinutes: 0,
//         workingSeconds: 0
//       };
//     }
//     return {
//       isCheckedIn: false,
//       checkInTime: null,
//       workingHours: 0,
//       workingMinutes: 0,
//       workingSeconds: 0,
//       isWorkFromHome: false,
//       todayAttendance: null,
//       pendingSubmission: false
//     };
//   });
  
//   const [submittingAttendance, setSubmittingAttendance] = useState(false);

//   // Save attendance state to localStorage whenever it changes
//   useEffect(() => {
//     if (user?.id) {
//       localStorage.setItem(`attendance_${user.id}`, JSON.stringify({
//         isCheckedIn: attendanceState.isCheckedIn,
//         checkInTime: attendanceState.checkInTime,
//         isWorkFromHome: attendanceState.isWorkFromHome,
//         pendingSubmission: attendanceState.pendingSubmission
//       }));
//     }
//   }, [attendanceState.isCheckedIn, attendanceState.checkInTime, attendanceState.isWorkFromHome, attendanceState.pendingSubmission, user?.id]);

//   useEffect(() => {
//     fetchDashboardData();
//     checkTodayAttendance();
//     checkPendingSubmissions();
    
//     const timer = setInterval(() => {
//       setDashboardData(prev => ({ ...prev, currentTime: new Date() }));
//       updateWorkingTime();
//       checkAutoSubmit();
//     }, 1000);

//     return () => clearInterval(timer);
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       const promises = [];
//       promises.push(leaveAPI.getLeaveSummary());
      
//       if (isHRManager()) {
//         promises.push(
//           employeeAPI.getEmployees({ limit: 10 }),
//           leaveAPI.getLeaveRequests({ status: 'PENDING', limit: 5 }),
//           leaveAPI.getLeaveRequests({ status: 'APPROVED', limit: 5 })
//         );
//       } else {
//         promises.push(
//           attendanceAPI.getAttendanceRecords({ limit: 7 }),
//           leaveAPI.getLeaveRequests({ limit: 5 })
//         );
//       }

//       const results = await Promise.all(promises);
      
//       const mockBirthdays = [
//         { id: 1, name: 'Aadit Palicha', date: '28 May', avatar: 'AP' },
//         { id: 2, name: 'Sameer Nigam', date: '30 May', avatar: 'SN' },
//         { id: 3, name: 'Ritesh Agarwal', date: '2 Jun', avatar: 'RA' },
//       ];

//       const mockUpcomingLeaves = [
//         { id: 1, employee: 'John Doe', leaveType: 'Annual Leave', startDate: '2024-06-01', endDate: '2024-06-03', days: 3 },
//         { id: 2, employee: 'Jane Smith', leaveType: 'Sick Leave', startDate: '2024-06-02', endDate: '2024-06-02', days: 1 },
//       ];

//       setDashboardData({
//         leaveBalances: results[0].data.leave_balances || [],
//         leaveSummary: results[0].data,
//         upcomingLeaves: mockUpcomingLeaves,
//         birthdays: mockBirthdays,
//         recentActivity: results[1]?.data?.results || results[1]?.data || [],
//         attendanceStats: {
//           avgHours: '8h 46m',
//           onTimeArrival: '60%',
//           teamAvgHours: '8h 27m',
//           teamOnTime: '13%'
//         },
//         currentTime: new Date(),
//         loading: false
//       });
//     } catch (error) {
//       console.error('Failed to fetch dashboard data:', error);
//       setDashboardData(prev => ({ ...prev, loading: false }));
//     }
//   };

//   const checkTodayAttendance = async () => {
//     try {
//       const today = new Date().toISOString().split('T')[0];
//       const response = await attendanceAPI.getAttendanceRecords({ 
//         start_date: today, 
//         end_date: today 
//       });
      
//       const todayRecord = response.data.results?.[0] || response.data?.[0];
      
//       if (todayRecord) {
//         setAttendanceState(prev => ({
//           ...prev,
//           todayAttendance: todayRecord,
//           pendingSubmission: false // Clear pending if record exists
//         }));
        
//         // Clear localStorage if record is already submitted
//         if (user?.id) {
//           localStorage.removeItem(`attendance_${user.id}`);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to check today attendance:', error);
//     }
//   };

//   const checkPendingSubmissions = () => {
//     // Check if there's a pending submission that should be auto-submitted
//     if (attendanceState.isCheckedIn && attendanceState.checkInTime) {
//       const now = new Date();
//       const checkInTime = new Date(attendanceState.checkInTime);
//       const hoursDiff = (now - checkInTime) / (1000 * 60 * 60);
      
//       // If more than 24 hours, auto-submit without check-out
//       if (hoursDiff >= 24) {
//         submitPendingAttendance(false);
//       }
//     }
//   };

//   const checkAutoSubmit = () => {
//     if (attendanceState.isCheckedIn && attendanceState.checkInTime) {
//       const now = new Date();
//       const checkInTime = new Date(attendanceState.checkInTime);
//       const hoursDiff = (now - checkInTime) / (1000 * 60 * 60);
      
//       // Auto-submit after 24 hours
//       if (hoursDiff >= 24 && !attendanceState.pendingSubmission) {
//         toast.info('Auto-submitting attendance after 24 hours...');
//         submitPendingAttendance(false);
//       }
//     }
//   };

//   const updateWorkingTime = () => {
//     if (attendanceState.isCheckedIn && attendanceState.checkInTime) {
//       const now = new Date();
//       const checkInTime = new Date(attendanceState.checkInTime);
//       const diffMs = now - checkInTime;
//       const hours = Math.floor(diffMs / (1000 * 60 * 60));
//       const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
//       const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
//       setAttendanceState(prev => ({
//         ...prev,
//         workingHours: hours,
//         workingMinutes: minutes,
//         workingSeconds: seconds
//       }));
//     }
//   };

//   const handleCheckIn = (workFromHome = false) => {
//     const now = new Date();
    
//     setAttendanceState(prev => ({
//       ...prev,
//       isCheckedIn: true,
//       checkInTime: now,
//       isWorkFromHome: workFromHome,
//       workingHours: 0,
//       workingMinutes: 0,
//       workingSeconds: 0,
//       pendingSubmission: true
//     }));

//     toast.success(
//       workFromHome 
//         ? '🏠 Work from Home started! Timer is running.' 
//         : '🏢 Office Check-in successful! Timer is running.'
//     );
//   };

//   const handleCheckOut = async () => {
//     if (!attendanceState.isCheckedIn || !attendanceState.checkInTime) {
//       toast.error('You need to check in first!');
//       return;
//     }

//     setSubmittingAttendance(true);
    
//     try {
//       await submitPendingAttendance(true);
      
//       const totalWorkedHours = `${attendanceState.workingHours}h ${attendanceState.workingMinutes}m`;
      
//       // Reset state
//       setAttendanceState(prev => ({
//         ...prev,
//         isCheckedIn: false,
//         checkInTime: null,
//         workingHours: 0,
//         workingMinutes: 0,
//         workingSeconds: 0,
//         pendingSubmission: false
//       }));

//       // Clear localStorage
//       if (user?.id) {
//         localStorage.removeItem(`attendance_${user.id}`);
//       }

//       toast.success(`✅ Checked out successfully! Total worked: ${totalWorkedHours}`);
//       checkTodayAttendance(); // Refresh today's attendance
//     } catch (error) {
//       toast.error('Failed to check out. Please try again.');
//       console.error('Check-out error:', error);
//     } finally {
//       setSubmittingAttendance(false);
//     }
//   };

//   const submitPendingAttendance = async (includeCheckOut = true) => {
//     if (!attendanceState.checkInTime) return;

//     const now = new Date();
//     const checkInTime = new Date(attendanceState.checkInTime);
    
//     const attendanceData = {
//       date: checkInTime.toISOString().split('T')[0],
//       check_in_time: checkInTime.toTimeString().slice(0, 8),
//       status: 'PRESENT',
//       notes: attendanceState.isWorkFromHome ? 'Work from Home' : 'Office'
//     };

//     // Add check-out time if provided
//     if (includeCheckOut) {
//       attendanceData.check_out_time = now.toTimeString().slice(0, 8);
//       attendanceData.notes += ' - Completed';
//     } else {
//       attendanceData.notes += ' - Auto-submitted (no check-out)';
//     }

//     await attendanceAPI.markManualAttendance(attendanceData);
//   };

//   const formatWorkingTime = () => {
//     const { workingHours, workingMinutes, workingSeconds } = attendanceState;
//     if (workingHours === 0 && workingMinutes === 0 && workingSeconds === 0) {
//       return '00:00:00';
//     }
//     return `${String(workingHours).padStart(2, '0')}:${String(workingMinutes).padStart(2, '0')}:${String(workingSeconds).padStart(2, '0')}`;
//   };

//   const getShiftInfo = () => {
//     const today = new Date().toLocaleDateString('en-US', { 
//       weekday: 'long',
//       day: '2-digit',
//       month: 'short'
//     });
//     return `${today} • GENERAL (10:00 AM - 07:00 PM)`;
//   };

//   if (dashboardData.loading) {
//     return <LoadingSpinner text="Loading dashboard..." />;
//   }

//   const QuickAccessCard = ({ title, children, className = "" }) => (
//     <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
//       <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
//       {children}
//     </div>
//   );

//   const LeaveBalanceCircle = ({ balance }) => {
//     const used = balance.used_days;
//     const total = balance.total_days;
//     const remaining = balance.remaining_days;
//     const percentage = (used / total) * 100;
//     const circumference = 2 * Math.PI * 45;
//     const strokeDasharray = circumference;
//     const strokeDashoffset = circumference - (percentage / 100) * circumference;

//     return (
//       <div className="text-center">
//         <div className="relative w-24 h-24 mx-auto mb-2">
//           <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
//             <circle
//               cx="50"
//               cy="50"
//               r="45"
//               stroke="#e5e7eb"
//               strokeWidth="8"
//               fill="none"
//             />
//             <circle
//               cx="50"
//               cy="50"
//               r="45"
//               stroke="#3b82f6"
//               strokeWidth="8"
//               fill="none"
//               strokeDasharray={strokeDasharray}
//               strokeDashoffset={strokeDashoffset}
//               strokeLinecap="round"
//             />
//           </svg>
//           <div className="absolute inset-0 flex items-center justify-center">
//             <div className="text-center">
//               <div className="text-xl font-bold text-blue-600">{remaining}</div>
//               <div className="text-xs text-gray-500">left</div>
//             </div>
//           </div>
//         </div>
//         <div className="text-sm font-medium text-gray-900">{balance.leave_type?.code}</div>
//         <div className="text-xs text-gray-500">{used}/{total} used</div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 px-6 py-4">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">
//               Welcome, {user?.first_name}! 👋
//             </h1>
//             <p className="text-sm text-gray-600 mt-1">
//               {new Date().toLocaleDateString('en-US', { 
//                 weekday: 'long', 
//                 year: 'numeric', 
//                 month: 'long', 
//                 day: 'numeric' 
//               })}
//             </p>
//           </div>
//           <div className="flex items-center space-x-4">
//             {/* Current Status */}
//             <div className="text-right">
//               <div className={`px-3 py-1 rounded-full text-xs font-medium ${
//                 attendanceState.isCheckedIn 
//                   ? attendanceState.isWorkFromHome 
//                     ? 'bg-purple-100 text-purple-800' 
//                     : 'bg-green-100 text-green-800'
//                   : 'bg-gray-100 text-gray-800'
//               }`}>
//                 {attendanceState.isCheckedIn 
//                   ? attendanceState.isWorkFromHome ? '🏠 Working from Home' : '🏢 Checked In'
//                   : '⏸️ Not Checked In'
//                 }
//               </div>
//               {attendanceState.isCheckedIn && (
//                 <div className="text-sm text-gray-600 mt-1">
//                   Working: {formatWorkingTime()}
//                 </div>
//               )}
//               {attendanceState.pendingSubmission && (
//                 <div className="text-xs text-orange-500 mt-1">
//                   📝 Pending submission
//                 </div>
//               )}
//             </div>
//             <div className="text-right">
//               <div className="text-2xl font-bold text-gray-900">
//                 {dashboardData.currentTime.toLocaleTimeString([], { 
//                   hour: '2-digit', 
//                   minute: '2-digit',
//                   second: '2-digit'
//                 })}
//               </div>
//               <div className="text-sm text-gray-500">Current Time</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-6">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Left Column */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Mobile-style Attendance Card */}
//             <QuickAccessCard title="Today's Attendance">
//               <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white">
//                 {/* Shift Info */}
//                 <div className="text-sm text-slate-300 mb-4 flex items-center">
//                   <span className="bg-slate-700 px-2 py-1 rounded text-xs mr-3">SHIFT TODAY</span>
//                   <span>{getShiftInfo()}</span>
//                 </div>

//                 {/* Date and Status */}
//                 <div className="flex items-center justify-between mb-6">
//                   <div>
//                     <div className="text-2xl font-bold">
//                       {new Date().getDate()} {new Date().toLocaleDateString('en-US', { month: 'short' })} {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
//                     </div>
//                     <div className="text-slate-300 text-sm">
//                       {attendanceState.isCheckedIn ? 'Working' : 'Not started'} • {attendanceState.workingHours}h / 9h
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-3xl font-mono font-bold">
//                       {formatWorkingTime()}
//                     </div>
//                     <div className="text-slate-300 text-xs">
//                       {attendanceState.checkInTime 
//                         ? `Started ${attendanceState.checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
//                         : 'Not started'
//                       }
//                     </div>
//                   </div>
//                 </div>

//                 {/* Check-in/Check-out Button */}
//                 <div className="space-y-3">
//                   {!attendanceState.isCheckedIn ? (
//                     <div className="grid grid-cols-2 gap-3">
//                       <button
//                         onClick={() => handleCheckIn(false)}
//                         disabled={submittingAttendance}
//                         className="flex items-center justify-center py-4 px-6 bg-green-600 hover:bg-green-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
//                       >
//                         <PlayIcon className="w-5 h-5 mr-2" />
//                         Check In (Office)
//                       </button>
//                       <button
//                         onClick={() => handleCheckIn(true)}
//                         disabled={submittingAttendance}
//                         className="flex items-center justify-center py-4 px-6 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
//                       >
//                         <HomeIcon className="w-5 h-5 mr-2" />
//                         Work From Home
//                       </button>
//                     </div>
//                   ) : (
//                     <button
//                       onClick={handleCheckOut}
//                       disabled={submittingAttendance}
//                       className="w-full flex items-center justify-center py-4 px-6 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
//                     >
//                       {submittingAttendance ? (
//                         <>
//                           <LoadingSpinner size="small" />
//                           <span className="ml-2">Checking Out...</span>
//                         </>
//                       ) : (
//                         <>
//                           <StopIcon className="w-5 h-5 mr-2" />
//                           Check Out
//                         </>
//                       )}
//                     </button>
//                   )}
//                 </div>

//                 {/* Progress Bar */}
//                 <div className="mt-4">
//                   <div className="flex justify-between text-xs text-slate-300 mb-2">
//                     <span>Progress</span>
//                     <span>{Math.min(Math.round((attendanceState.workingHours / 9) * 100), 100)}%</span>
//                   </div>
//                   <div className="w-full bg-slate-700 rounded-full h-2">
//                     <div 
//                       className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
//                       style={{ width: `${Math.min((attendanceState.workingHours / 9) * 100, 100)}%` }}
//                     ></div>
//                   </div>
//                 </div>

//                 {/* Warning for pending submission */}
//                 {attendanceState.pendingSubmission && (
//                   <div className="mt-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
//                     <div className="flex items-center text-orange-200 text-sm">
//                       <BellIcon className="w-4 h-4 mr-2" />
//                       <span>Attendance will be auto-submitted after 24 hours if not checked out</span>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </QuickAccessCard>

//             {/* Quick Access */}
//             <QuickAccessCard title="Quick Access">
//               <div className="grid grid-cols-2 gap-4">
//                 <Link 
//                   to="/leave"
//                   className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
//                 >
//                   <div className="text-center">
//                     <CalendarDaysIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
//                     <span className="text-sm font-medium text-blue-900">Apply Leave</span>
//                   </div>
//                 </Link>
//                 <Link 
//                   to="/attendance"
//                   className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
//                 >
//                   <div className="text-center">
//                     <ClockIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
//                     <span className="text-sm font-medium text-green-900">View Attendance</span>
//                   </div>
//                 </Link>
//               </div>
//             </QuickAccessCard>

//             {/* Attendance Stats */}
//             <QuickAccessCard title="Attendance Stats">
//               <div className="grid grid-cols-2 gap-6">
//                 <div>
//                   <div className="flex items-center mb-4">
//                     <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
//                       <span className="text-white font-semibold text-sm">Me</span>
//                     </div>
//                     <span className="font-medium text-gray-900">Me</span>
//                   </div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <div className="text-sm text-gray-500">AVG HRS / DAY</div>
//                       <div className="text-xl font-bold text-gray-900">{dashboardData.attendanceStats?.avgHours}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-gray-500">ON TIME ARRIVAL</div>
//                       <div className="text-xl font-bold text-gray-900">{dashboardData.attendanceStats?.onTimeArrival}</div>
//                     </div>
//                   </div>
//                 </div>

//                 <div>
//                   <div className="flex items-center mb-4">
//                     <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
//                       <UserGroupIcon className="w-4 h-4 text-white" />
//                     </div>
//                     <span className="font-medium text-gray-900">My Team</span>
//                   </div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <div className="text-sm text-gray-500">AVG HRS / DAY</div>
//                       <div className="text-xl font-bold text-gray-900">{dashboardData.attendanceStats?.teamAvgHours}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-gray-500">ON TIME ARRIVAL</div>
//                       <div className="text-xl font-bold text-gray-900">{dashboardData.attendanceStats?.teamOnTime}</div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </QuickAccessCard>

//             {/* Upcoming Leaves (HR Manager View) */}
//             {isHRManager() && (
//               <QuickAccessCard title="Upcoming Team Leaves">
//                 <div className="space-y-3">
//                   {dashboardData.upcomingLeaves.length === 0 ? (
//                     <p className="text-gray-500 text-sm">No upcoming leaves</p>
//                   ) : (
//                     dashboardData.upcomingLeaves.map((leave) => (
//                       <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                         <div>
//                           <div className="font-medium text-gray-900">{leave.employee}</div>
//                           <div className="text-sm text-gray-500">
//                             {leave.leaveType} • {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
//                           </div>
//                         </div>
//                         <div className="text-sm font-medium text-blue-600">
//                           {leave.days} day{leave.days !== 1 ? 's' : ''}
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </QuickAccessCard>
//             )}
//           </div>

//           {/* Right Column - Keep existing components */}
//           <div className="space-y-6">
//             {/* Leave Balances */}
//             <QuickAccessCard title="Leave Balances">
//               <div className="space-y-4">
//                 {dashboardData.leaveBalances.length === 0 ? (
//                   <p className="text-gray-500 text-sm text-center py-4">No leave balances available</p>
//                 ) : (
//                   <div className="grid grid-cols-2 gap-4">
//                     {dashboardData.leaveBalances.slice(0, 4).map((balance) => (
//                       <LeaveBalanceCircle key={balance.id} balance={balance} />
//                     ))}
//                   </div>
//                 )}
//                 <div className="pt-4 border-t">
//                   <Link
//                     to="/leave"
//                     className="text-blue-600 hover:text-blue-500 text-sm font-medium"
//                   >
//                     Request Leave →
//                   </Link>
//                 </div>
//               </div>
//             </QuickAccessCard>

//             {/* Birthdays Today & Upcoming */}
//             <QuickAccessCard title="Birthdays & Celebrations">
//               <div className="space-y-4">
//                 <div>
//                   <div className="flex items-center text-sm text-gray-600 mb-2">
//                     <CakeIcon className="w-4 h-4 mr-1" />
//                     <span>Birthdays Today</span>
//                   </div>
//                   <div className="text-center py-6">
//                     <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
//                       <CakeIcon className="w-8 h-8 text-gray-400" />
//                     </div>
//                     <p className="text-sm text-gray-500">No birthdays today</p>
//                   </div>
//                 </div>

//                 <div>
//                   <div className="text-sm text-gray-600 mb-3">Upcoming Birthdays</div>
//                   <div className="space-y-2">
//                     {dashboardData.birthdays.map((birthday) => (
//                       <div key={birthday.id} className="flex items-center space-x-3">
//                         <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
//                           <span className="text-white text-xs font-medium">{birthday.avatar}</span>
//                         </div>
//                         <div className="flex-1">
//                           <div className="text-sm font-medium text-gray-900">{birthday.name}</div>
//                           <div className="text-xs text-gray-500">{birthday.date}</div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </QuickAccessCard>

//             {/* Quick Actions */}
//             <QuickAccessCard title="Quick Actions">
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-700">Current Time</span>
//                   <span className="text-lg font-bold text-blue-600">
//                     {dashboardData.currentTime.toLocaleTimeString([], { 
//                       hour: '2-digit', 
//                       minute: '2-digit'
//                     })}
//                   </span>
//                 </div>
                
//                 <div className="grid grid-cols-1 gap-2">
//                   <Link
//                     to="/attendance"
//                     className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
//                   >
//                     <span className="text-sm font-medium">View Attendance Records</span>
//                     <ChartBarIcon className="w-4 h-4" />
//                   </Link>
                  
//                   <Link
//                     to="/leave"
//                     className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
//                   >
//                     <span className="text-sm font-medium">Apply for Leave</span>
//                     <CalendarDaysIcon className="w-4 h-4" />
//                   </Link>
//                 </div>
//               </div>
//             </QuickAccessCard>

//             {/* Recent Activity */}
//             <QuickAccessCard title="Recent Activity">
//               <div className="space-y-3">
//                 {dashboardData.leaveSummary?.recent_requests?.length === 0 ? (
//                   <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
//                 ) : (
//                   dashboardData.leaveSummary?.recent_requests?.slice(0, 3).map((request) => (
//                     <div key={request.id} className="border-l-4 border-blue-500 pl-3 py-2">
//                       <div className="text-sm font-medium text-gray-900">
//                         {request.leave_type?.name} Request
//                       </div>
//                       <div className="text-xs text-gray-500">
//                         {formatDate(request.start_date)} - {formatDate(request.end_date)} • {request.days_requested} days
//                       </div>
//                       <div className="mt-1">
//                         <StatusBadge status={request.status} />
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </QuickAccessCard>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;