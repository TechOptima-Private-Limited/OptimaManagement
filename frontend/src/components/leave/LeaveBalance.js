import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  CalendarDaysIcon, 
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
  StarIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { leaveAPI } from '../../services/api';
import { isHRManager } from '../../utils/auth';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';

const LeaveBalance = () => {
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchLeaveBalances();
    if (!isHRManager()) {
      fetchLeaveSummary();
    }
  }, [selectedYear]);

  const fetchLeaveBalances = async () => {
    try {
      setLoading(true);
      const response = await leaveAPI.getLeaveBalances({ year: selectedYear });
      setLeaveBalances(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to fetch leave balances');
      console.error('Error fetching leave balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveSummary = async () => {
    try {
      const response = await leaveAPI.getLeaveSummary();
      setLeaveSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch leave summary:', error);
    }
  };

  const getBalanceColor = (remaining, total) => {
    const percentage = (remaining / total) * 100;
    if (percentage <= 20) return 'text-red-600 bg-gradient-to-r from-red-50 to-pink-50 border-red-200';
    if (percentage <= 50) return 'text-yellow-600 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200';
    return 'text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
  };

  const getProgressBarGradient = (remaining, total) => {
    const percentage = (remaining / total) * 100;
    if (percentage <= 20) return 'from-red-500 to-red-600';
    if (percentage <= 50) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-500';
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  };

  const BalanceCard = ({ balance }) => {
    const usagePercentage = balance.total_days > 0 ? (balance.used_days / balance.total_days) * 100 : 0;
    const remainingPercentage = balance.total_days > 0 ? (balance.remaining_days / balance.total_days) * 100 : 0;
    
    return (
      <div className="bg-white/5 rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">{balance.leave_type_name || balance.leave_type?.name}</h3>
            <p className="text-sm text-slate-400 font-semibold">{balance.leave_type?.code}</p>
          </div>
          <div className={`px-4 py-2 rounded-full border ${getBalanceColor(balance.remaining_days, balance.total_days)}`}>
            <span className="text-sm font-bold">
              {balance.remaining_days} days left
            </span>
          </div>
        </div>

        {/* Enhanced Usage Statistics */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-semibold">Total Allocated:</span>
            <span className="font-bold text-white text-lg">{balance.total_days} days</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-semibold">Used:</span>
            <span className="font-bold text-white text-lg">{balance.used_days} days</span>
          </div>

          {balance.carried_forward_days > 0 && (
            <div className="flex justify-between text-sm bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-200">
              <span className="text-blue-700 font-semibold">Carried Forward:</span>
              <span className="font-bold text-blue-800">+{balance.carried_forward_days} days</span>
            </div>
          )}
        </div>

        {/* Enhanced Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-600 font-semibold mb-3">
            <span>Usage: {Math.round(usagePercentage)}%</span>
            <span>Remaining: {Math.round(remainingPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
            <div
              className={`h-4 rounded-full transition-all duration-500 bg-gradient-to-r ${getProgressBarGradient(balance.remaining_days, balance.total_days)} shadow-md`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Enhanced Status Indicator */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold">Year: {balance.year}</span>
          {remainingPercentage <= 20 && (
            <div className="flex items-center text-red-600 bg-red-100 px-3 py-1 rounded-full">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              <span className="font-bold">Low Balance</span>
            </div>
          )}
          {remainingPercentage > 80 && (
            <div className="flex items-center text-green-600 bg-green-100 px-3 py-1 rounded-full">
              <StarIcon className="h-4 w-4 mr-1" />
              <span className="font-bold">Excellent</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Loading leave balances..." />;
  }

  return (
    <div className="space-y-10">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-bold text-white">Leave Balance</h3>
          <p className="mt-2 text-gray-600 text-lg">
            View your current leave balance and usage for {selectedYear}
          </p>
        </div>
        <div className="flex items-center space-x-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium text-lg"
            >
              {generateYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      {leaveSummary && !isHRManager() && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-3xl shadow-lg border border-blue-200 hover:shadow-xl transition-all">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <CalendarDaysIcon className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-bold text-blue-700 uppercase tracking-wider">Pending Requests</p>
                <p className="text-3xl font-black text-white">
                  {leaveSummary.pending_requests_count}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-3xl shadow-lg border border-green-200 hover:shadow-xl transition-all">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <CheckCircleIcon className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-bold text-green-700 uppercase tracking-wider">Approved This Year</p>
                <p className="text-3xl font-black text-white">
                  {leaveSummary.approved_requests_count}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-3xl shadow-lg border border-purple-200 hover:shadow-xl transition-all">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                  <ChartBarIcon className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-bold text-purple-700 uppercase tracking-wider">Total Days Taken</p>
                <p className="text-3xl font-black text-white">
                  {leaveSummary.total_days_taken}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-3xl shadow-lg border border-orange-200 hover:shadow-xl transition-all">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-lg">
                  <ClockIcon className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-bold text-orange-700 uppercase tracking-wider">Total Balance</p>
                <p className="text-3xl font-black text-white">
                  {leaveSummary.leave_balances?.reduce((acc, bal) => acc + parseFloat(bal.remaining_days || 0), 0) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Leave Balance Cards */}
      <div>
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
            <SparklesIcon className="h-8 w-8 text-white" />
          </div>
          <h4 className="text-2xl font-bold text-white">Leave Types & Balances</h4>
        </div>
        
        {leaveBalances.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl shadow-lg border border-blue-200">
            <div className="p-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CalendarDaysIcon className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No leave balances found</h3>
            <p className="text-gray-600">
              Leave balances for {selectedYear} are not available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {leaveBalances.map((balance) => (
              <BalanceCard key={balance.id} balance={balance} />
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Recent Leave Requests */}
      {leaveSummary && leaveSummary.recent_requests && leaveSummary.recent_requests.length > 0 && (
        <div className="bg-white/5 rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white">Recent Leave Requests</h4>
                <p className="text-gray-600">Your latest leave request activity</p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              {leaveSummary.recent_requests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between py-6 border-b border-gray-100 last:border-b-0 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-2xl px-4 transition-all">
                  <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <CalendarDaysIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">
                        {request.leave_type?.name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {formatDate(request.start_date)} - {formatDate(request.end_date)} 
                        <span className="ml-3 font-semibold">({request.days_requested} day{request.days_requested !== 1 ? 's' : ''})</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <StatusBadge status={request.status} />
                    <div className="text-sm text-slate-400 font-semibold">
                      {formatDate(request.applied_on)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Leave Policy Information */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-3xl p-8 shadow-lg">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <ExclamationTriangleIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="ml-3">
            <h4 className="text-xl font-bold text-blue-900 mb-4">Leave Policy Reminders</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-3 text-blue-800">
                <li className="flex items-center space-x-3 bg-white/5/60 p-3 rounded-xl">
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                  <span>Leave requests should be submitted at least 7 days in advance</span>
                </li>
                <li className="flex items-center space-x-3 bg-white/5/60 p-3 rounded-xl">
                  <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                  <span>Unused annual leave may be carried forward (check policy for limits)</span>
                </li>
                <li className="flex items-center space-x-3 bg-white/5/60 p-3 rounded-xl">
                  <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></span>
                  <span>Medical certificates required for sick leave exceeding 3 days</span>
                </li>
              </ul>
              <ul className="space-y-3 text-blue-800">
                <li className="flex items-center space-x-3 bg-white/5/60 p-3 rounded-xl">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></span>
                  <span>Emergency leave can be applied retroactively with manager approval</span>
                </li>
                <li className="flex items-center space-x-3 bg-white/5/60 p-3 rounded-xl">
                  <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                  <span>Half-day leaves are available for most leave types</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Balance Insights */}
      {leaveBalances.length > 0 && (
        <div className="bg-white/5 rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
              <TrophyIcon className="h-8 w-8 text-white" />
            </div>
            <h4 className="text-2xl font-bold text-white">Balance Insights</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Most Used Leave Type */}
            <div>
              <h5 className="text-lg font-bold text-gray-700 mb-4">Most Used Leave Type</h5>
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
                {(() => {
                  const mostUsed = leaveBalances.reduce((prev, current) => 
                    (parseFloat(prev.used_days) > parseFloat(current.used_days)) ? prev : current
                  );
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FireIcon className="h-6 w-6 text-red-500" />
                        <span className="text-lg font-bold text-white">{mostUsed.leave_type_name || mostUsed.leave_type?.name}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-700 bg-white/5 px-4 py-2 rounded-xl shadow">
                        {mostUsed.used_days} days used
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Leave Utilization */}
            <div>
              <h5 className="text-lg font-bold text-gray-700 mb-4">Overall Utilization</h5>
              <div className="bg-gradient-to-r from-gray-50 to-purple-50 p-6 rounded-2xl border border-gray-200">
                {(() => {
                  const totalAllocated = leaveBalances.reduce((sum, bal) => sum + parseFloat(bal.total_days || 0), 0);
                  const totalUsed = leaveBalances.reduce((sum, bal) => sum + parseFloat(bal.used_days || 0), 0);
                  const utilizationPercentage = totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;
                  
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <ChartBarIcon className="h-6 w-6 text-purple-500" />
                          <span className="text-lg font-bold text-white">
                            {totalUsed} of {totalAllocated} days used
                          </span>
                        </div>
                        <span className="text-lg font-bold text-gray-700 bg-white/5 px-4 py-2 rounded-xl shadow">
                          {Math.round(utilizationPercentage)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Enhanced Recommendations */}
          <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl">
            <div className="flex items-center space-x-3 mb-3">
              <StarIcon className="h-6 w-6 text-yellow-600" />
              <h5 className="text-lg font-bold text-yellow-800">Smart Recommendations</h5>
            </div>
            <div className="text-sm text-yellow-700">
              {(() => {
                const lowBalanceTypes = leaveBalances.filter(bal => 
                  (parseFloat(bal.remaining_days) / parseFloat(bal.total_days)) * 100 <= 20
                );
                const highBalanceTypes = leaveBalances.filter(bal => 
                  (parseFloat(bal.remaining_days) / parseFloat(bal.total_days)) * 100 >= 80
                );

                if (lowBalanceTypes.length > 0) {
                  return (
                    <div className="bg-white/5/70 p-4 rounded-xl">
                      <p className="font-semibold">
                        ⚠️ <strong>Plan Ahead:</strong> Consider planning ahead for {lowBalanceTypes.map(b => b.leave_type_name || b.leave_type?.name).join(', ')} as you have low remaining balance.
                      </p>
                    </div>
                  );
                } else if (highBalanceTypes.length > 0) {
                  return (
                    <div className="bg-white/5/70 p-4 rounded-xl">
                      <p className="font-semibold">
                        🌟 <strong>Take a Break:</strong> You have substantial unused leave in {highBalanceTypes.map(b => b.leave_type_name || b.leave_type?.name).join(', ')}. Consider taking some time off!
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-white/5/70 p-4 rounded-xl">
                      <p className="font-semibold">
                        ✅ <strong>Perfect Balance:</strong> Your leave usage is well balanced. Keep maintaining a good work-life balance!
                      </p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveBalance;
