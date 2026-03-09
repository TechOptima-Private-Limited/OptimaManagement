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
      const [, requestsResponse] = await Promise.all([
        leaveAPI.getLeaveAnalytics().catch(() => ({ data: {} })),
        leaveAPI.getLeaveRequests()
      ]);

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
      bgGradient: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      name: 'Pending Approvals',
      value: stats.pendingApprovals.toString(),
      change: stats.pendingApprovals > 5 ? 'High Priority' : 'Normal',
      changeType: stats.pendingApprovals > 5 ? 'increase' : 'neutral',
      icon: BellIcon,
      gradient: stats.pendingApprovals > 5 ? 'from-rose-500 to-rose-600' : 'from-amber-500 to-amber-600',
      bgGradient: stats.pendingApprovals > 5 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-amber-500/10 border-amber-500/20'
    },
    {
      name: 'Approved This Month',
      value: stats.approvedThisMonth.toString(),
      change: '+18.2%',
      changeType: 'increase',
      icon: CheckCircleIcon,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      name: 'Total Days Taken',
      value: stats.totalDaysTaken.toString(),
      change: 'This year',
      changeType: 'neutral',
      icon: CalendarDaysIcon,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'bg-purple-500/10 border-purple-500/20'
    },
  ];


  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient}`}>
      {/* Hero Header */}
      <div className={`border-b border-white/10 text-white relative overflow-hidden`}>
        <div className={`absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br ${theme.primaryGradient} opacity-10 rounded-full blur-3xl`}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
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
                    <div className={`relative bg-white/5 rounded-[2.5rem] shadow-2xl border backdrop-blur-xl ${item.bgGradient} overflow-hidden transition-all duration-300 hover:shadow-indigo-500/10 hover:-translate-y-1`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                      <div className="relative p-8">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                              {item.name}
                            </p>
                            <p className="text-3xl font-black text-white uppercase tracking-tight">
                              {item.value}
                            </p>
                            <div className="mt-3">
                              <div className={`inline-flex items-center text-sm font-semibold ${item.changeType === 'increase' ? 'text-emerald-400' :
                                item.changeType === 'decrease' ? 'text-red-400' : 'text-slate-400'
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
                          <div className={`p-4 rounded-2xl bg-gradient-to-br ${item.gradient} shadow-[0_0_20px_rgba(0,0,0,0.3)] border border-white/20`}>
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
          <div className="mb-8 relative z-10">
            <div className="bg-indigo-500/10 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl">
                    <RocketLaunchIcon className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">Quick Actions</h3>
                    <p className="text-sm text-slate-400 mt-1 font-medium">
                      {stats.pendingApprovals > 0 ? (
                        <>
                          <span className="font-bold text-indigo-300">{stats.pendingApprovals}</span>
                          {isManager() ? ' team requests' : ' requests'} need approval
                        </>
                      ) : (
                        <span className="text-emerald-400">All requests processed! 🎉</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  {stats.pendingApprovals > 0 && (
                    <button
                      onClick={() => setSelectedIndex(isHRManager() ? 2 : 1)} // Adjust for tab index
                      className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-indigo-400/50 px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2"
                    >
                      <ClockIcon className="h-4 w-4" />
                      <span>Review Now</span>
                    </button>
                  )}
                  {isHRManager() && (
                    <button
                      onClick={() => setSelectedIndex(2)} // Leave Types tab for HR
                      className="bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] border border-purple-400/50 px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2"
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
        <div className="bg-[#0A0F1A] rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden relative z-10 backdrop-blur-xl">
          <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
            {/* Tab Navigation */}
            <div className="bg-white/5 border-b border-white/10 p-2">
              <Tab.List className="flex space-x-2">
                {tabs.map((tab, index) => (
                  <Tab
                    key={tab.name}
                    className={({ selected }) =>
                      classNames(
                        'flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider rounded-2xl transition-all duration-300 focus:outline-none flex items-center justify-center space-x-3',
                        selected
                          ? 'bg-indigo-500/20 text-indigo-300 shadow-lg border border-indigo-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                      )
                    }
                  >
                    <div className={`p-2 rounded-xl ${selectedIndex === index ? `bg-gradient-to-r ${tab.gradient} shadow-lg shadow-indigo-500/20` : 'bg-white/10'}`}>
                      <tab.icon className={`h-5 w-5 ${selectedIndex === index ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <span>{tab.name}</span>
                    {/* Notification Badge */}
                    {tab.name === 'Approvals' && stats.pendingApprovals > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse">
                        {stats.pendingApprovals}
                      </span>
                    )}
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
                    <h2 className="text-2xl font-black text-white tracking-tight">{tab.name}</h2>
                    <p className="text-slate-400 mt-1 font-medium">{tab.description}</p>
                  </div>

                  {/* Component Content */}
                  <tab.component />
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-[#0A0F1A] border border-white/10 rounded-3xl p-8 relative overflow-hidden backdrop-blur-xl z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
          <div className="flex items-start space-x-6 relative z-10">
            <div className="p-4 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl">
              <CalendarDaysIcon className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-6">Leave Management Guide</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-indigo-300 tracking-wide uppercase text-xs">
                    {isHRManager() ? '👑 HR Manager Tips' : isManager() ? '🎯 Manager Guide' : '📝 Employee Guide'}
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-300 font-medium">
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
                <div className="space-y-4">
                  <h4 className="font-bold text-purple-300 tracking-wide uppercase text-xs">🚀 Pro Features</h4>
                  <ul className="space-y-3 text-sm text-slate-300 font-medium">
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
      </div >
    </div >
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
    <div className="mb-8 relative z-10">
      <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 rounded-2xl p-6 shadow-lg shadow-amber-500/5">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-amber-300">Setup Required</h3>
            <p className="text-amber-200/80 mt-1 font-medium">
              No leave types configured. Set up leave types and initialize employee balances to get started.
            </p>
          </div>
          <button
            onClick={onSetupClick}
            className="bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(217,119,6,0.4)] border border-amber-400/50 px-6 py-3 rounded-xl font-bold transition-all flex items-center space-x-2"
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