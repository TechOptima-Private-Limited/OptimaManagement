import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
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
  ServerIcon
} from '@heroicons/react/24/outline';
import { attendanceAPI, authAPI, employeeAPI } from '../../services/api';
import { isHRManager, isManager, getUserRole, isAdmin } from '../../utils/auth';
import { ROLE_CATEGORIES } from '../../utils/roleConfig';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import Table from '../common/Table';
import Modal from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getAvgMinutesPerWeek, getLastWeekRange, getStatsForPeriod, getTotalMinutesThisWeek } from '../../utils/attendanceStats';
import AttendanceTrends from './AttendanceTrends';


const toLocalYMD = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Admin, HR, or C-level: org-wide attendance with tighter default range + filter bar */
const isOrgWideAttendanceRole = () => {
  const role = getUserRole();
  return isAdmin() || isHRManager() || ROLE_CATEGORIES.C_LEVEL.includes(role);
};

const getDefaultFilters = () => {
  const now = new Date();
  const end = toLocalYMD(now);
  const start = new Date(now);
  const daysBack = isOrgWideAttendanceRole() ? 6 : 29;
  start.setDate(start.getDate() - daysBack);
  return {
    start_date: toLocalYMD(start),
    end_date: end,
    status: '',
    employee_id: ''
  };
};
const AttendanceVisual = ({ logs }) => {
  if (!logs || logs.length === 0) return <div className="h-4 w-full bg-white/5 rounded-full border border-white/5"></div>;
  const sortedLogs = [...logs].sort((a, b) => a.time.localeCompare(b.time));
  const START_MIN = 8 * 60; // 08:00
  const END_MIN = 20 * 60;   // 20:00
  const TOTAL_MIN = END_MIN - START_MIN;
  const toMins = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };
  const segments = [];
  for (let i = 0; i < sortedLogs.length; i += 2) {
    const start = toMins(sortedLogs[i].time);
    const end = sortedLogs[i + 1] ? toMins(sortedLogs[i + 1].time) : null;
    segments.push({ start, end, startTime: sortedLogs[i].time, endTime: sortedLogs[i + 1]?.time });
  }
  return (
    <div className="relative h-4 w-48 bg-white/5 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm shadow-inner mt-1">
      {[...Array(11)].map((_, i) => (
        <div
          key={i}
          className="absolute h-full border-l border-white/5 z-10"
          style={{ left: `${((i + 1) * 60) / TOTAL_MIN * 100}%` }}
        ></div>
      ))}
      {segments.map((seg, idx) => {
        const left = ((seg.start - START_MIN) / TOTAL_MIN) * 100;
        let width = 0;
        if (seg.end) {
          width = ((seg.end - seg.start) / TOTAL_MIN) * 100;
        } else {
          const now = new Date();
          const nowMins = now.getHours() * 60 + now.getMinutes();
          width = ((Math.min(END_MIN, nowMins) - seg.start) / TOTAL_MIN) * 100;
        }
        if (left + width < 0 || left > 100) return null;
        const clippedLeft = Math.max(0, left);
        const clippedRight = Math.min(100, left + width);
        const clippedWidth = clippedRight - clippedLeft;
        if (clippedWidth <= 0) return null;
        return (
          <div
            key={idx}
            className="absolute top-0 h-full bg-indigo-500/80 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all hover:bg-indigo-400"
            style={{ left: `${clippedLeft}%`, width: `${clippedWidth}%` }}
            title={`${seg.startTime} - ${seg.endTime || 'Ongoing'}`}
          />
        );
      })}
    </div>
  );
};
const AttendanceTracker = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [userPendingRequests, setUserPendingRequests] = useState([]);
  const [biometricDevices, setBiometricDevices] = useState([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    avgMinutesPerWeek: 0,
    totalMinutesThisWeek: 0,
    onTimePercent: 0,
    lastWeekMe: { avgMinutes: 0, onTimePercent: 0 },
    lastWeekTeam: { avgMinutes: 0, onTimePercent: 0 }
  });
  const [filters, setFilters] = useState(() => getDefaultFilters());
  const [orgEmployeeOptions, setOrgEmployeeOptions] = useState([]);
  const filtersRef = useRef(filters);
  const employeeFromUrlRef = useRef('');
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    employeeFromUrlRef.current = params.get('employee') || '';
  }, [location.search]);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  useEffect(() => {
    const employeeParam = employeeFromUrlRef.current;
    if (!employeeParam) return;
    setFilters((prev) => ({ ...prev, employee_id: employeeParam }));
  }, [location.search]);
  const [use24Hour, setUse24Hour] = useState(false);
  const [now, setNow] = useState(new Date());
  const [permissions, setPermissions] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Check if user is HR Manager or Manager - both get management interface
  const isManagementRole = isHRManager() || isManager();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      status: 'PRESENT'
    }
  });
  const { register: registerApproval, handleSubmit: handleApprovalSubmit, reset: resetApproval } = useForm();
  const selectedDate = watch('date');
  // Load biometric devices
  useEffect(() => {
    if (isManagementRole) {
      fetchBiometricDevices();
    }
  }, [isManagementRole]);
  // Auto-poll database for updates every 10 seconds (reduced from 5 seconds)
  useEffect(() => {
    // Only poll if tab is active to save resources and avoid broken pipe
    const poll = () => {
      if (document.visibilityState === 'visible') {
        fetchAttendanceRecords(true);
      }
    };
    const pollInterval = setInterval(poll, 10000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAttendanceRecords(true);
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  // Refresh immediately when biometric sync is triggered from Biometric Integration
  useEffect(() => {
    const refresh = () => fetchAttendanceRecords(true);
    const onStorage = (e) => {
      if (e?.key === 'attendance_last_biometric_sync') refresh();
    };
    const onBiometricSync = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('attendance:biometric_sync', onBiometricSync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('attendance:biometric_sync', onBiometricSync);
    };
  }, []);
  useEffect(() => {
    fetchAttendanceRecords();
    fetchUserPendingRequests();
  }, [filters]);

  useEffect(() => {
    if (!isOrgWideAttendanceRole()) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await employeeAPI.getEmployees({ page_size: 500, status: 'ACTIVE' });
        const rows = res.data?.results || res.data || [];
        if (!cancelled) setOrgEmployeeOptions(Array.isArray(rows) ? rows : []);
      } catch (_) {
        if (!cancelled) setOrgEmployeeOptions([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);
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
      } catch (error) {
        // Handle broken pipe and network errors gracefully
        if (error.code === 'ECONNRESET' || error.message.includes('Network Error')) {
          console.warn('Network error fetching permissions, retrying in 2 seconds...');
          setTimeout(() => {
            authAPI.getMyPermissions()
              .then(resp => setPermissions(Array.isArray(resp?.data?.permissions) ? resp.data.permissions : []))
              .catch(() => setPermissions([]));
          }, 2000);
        } else {
          console.error('Failed to fetch permissions:', error);
          setPermissions([]);
        }
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
  const fetchAttendanceRecords = async (silent = false) => {
    // Use a ref or a flag to prevent overlapping requests
    if (fetchAttendanceRecords.isLoading && silent) return;
    try {
      if (!silent) setLoading(true);
      fetchAttendanceRecords.isLoading = true;
      const currentFilters = filtersRef.current;
      const employeeFromUrl = employeeFromUrlRef.current;
      const params = {};
      if (currentFilters.start_date) params.start_date = currentFilters.start_date;
      if (currentFilters.end_date) params.end_date = currentFilters.end_date;
      if (currentFilters.status) params.status = currentFilters.status;
      const effectiveEmployeeId = currentFilters.employee_id || employeeFromUrl;
      if (effectiveEmployeeId) params.employee_id = effectiveEmployeeId;
      const response = await attendanceAPI.getAttendanceRecords(params);
      console.log('Fetched attendance records:', response.data);
      // Handle the case where response might be wrapped in { results, ... } or just an array
      const records = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setAttendanceRecords(records);
      // Both HR Manager and Manager get pending approvals count
      if (isManagementRole && response.data.pending_approvals_count !== undefined) {
        setPendingApprovalsCount(response.data.pending_approvals_count);
      }
      // Filter records for the target employee to calculate stats (matching the user or filter)
      const targetId = effectiveEmployeeId || user?.employee_id;
      const recordsToStat = records.filter(r => {
        // Check all possible identity fields to ensure a match
        const recordId = r.display_id || r.employee_id || (r.employee && (r.employee.employee_id || r.employee.id));
        return String(recordId) === String(targetId);
      });
      calculateStats(recordsToStat, targetId);
    } catch (error) {
      if (!silent) {
        toast.error('Failed to fetch attendance records');
      }
      console.error('Attendance fetch error:', error);
      // Don't clear records on silent error to avoid UI flicker
      if (!silent) setAttendanceRecords([]);
    } finally {
      fetchAttendanceRecords.isLoading = false;
      if (!silent) setLoading(false);
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
  const calculateStats = (records, scopedEmployeeId) => {
    const approvedRecords = records.filter(r => !r.is_pending_approval);
    const presentDays = approvedRecords.filter(r => r.status === 'PRESENT' && !isLate(r.check_in_time)).length;
    const absentDays = approvedRecords.filter(r => r.status === 'ABSENT').length;
    const lateDays = approvedRecords.filter(r => r.status === 'LATE' || isLate(r.check_in_time)).length;
    const avgMinutesPerWeek = getAvgMinutesPerWeek(records, scopedEmployeeId);
    const totalMinutesThisWeek = getTotalMinutesThisWeek(records, scopedEmployeeId);
    const onTimeBase = presentDays + lateDays;
    const onTimePercent = onTimeBase > 0 ? Math.round((presentDays / onTimeBase) * 100) : 0;

    // Calculate Last Week stats for "Me" and "Team"
    const { start: lwStart, end: lwEnd } = getLastWeekRange();
    const lastWeekMe = getStatsForPeriod(records, scopedEmployeeId || user?.employee_id, lwStart, lwEnd);

    // For team stats: if manager, use their team records. If not, use organizational average from fetched records
    const otherRecords = records.filter(r => {
      const rId = r.display_id || r.employee_id || (r.employee && (r.employee.employee_id || r.employee.id));
      return String(rId) !== String(scopedEmployeeId || user?.employee_id);
    });

    const lastWeekTeam = otherRecords.length > 0
      ? getStatsForPeriod(records, null, lwStart, lwEnd) // Passing null to catch all in period for team average
      : { avgMinutes: 0, onTimePercent: 0 };

    setStats({
      totalDays: approvedRecords.length,
      presentDays,
      absentDays,
      lateDays,
      avgMinutesPerWeek,
      totalMinutesThisWeek,
      onTimePercent,
      lastWeekMe,
      lastWeekTeam
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
    setFilters({
      ...getDefaultFilters(),
      employee_id: employeeFromUrlRef.current || ''
    });
  };
  /**
   * Returns attendance records with virtual WEEK_OFF rows injected for Sundays
   * (and Saturdays if applicable) that have no existing attendance record.
   * Only applies when viewing a single employee's data (not management overview).
   */
  const getDisplayRecords = () => {
    const records = attendanceRecords;
    // Only inject week-off rows for single-employee views
    // For management with multiple employees, skip injection to avoid duplicates
    const startDateStr = filters.start_date;
    const endDateStr = filters.end_date;
    if (!startDateStr || !endDateStr) return records;
    const existingDates = new Set(records.map(r => r.date));
    const weekOffRows = [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay(); // 0 = Sunday
      const dateStr = current.toISOString().split('T')[0];
      if ((dayOfWeek === 0 || dayOfWeek === 6) && !existingDates.has(dateStr)) {
        // Saturday or Sunday with no attendance record → WEEK OFF
        weekOffRows.push({
          id: `week-off-${dateStr}`,
          date: dateStr,
          status: 'WEEK_OFF',
          check_in_time: null,
          check_out_time: null,
          attendance_type: '-',
          is_pending_approval: false,
          display_name: null,
          display_id: null,
          employee: null,
          biometric_logs: [],
          _isWeekOff: true,
        });
      }
      current.setDate(current.getDate() + 1);
    }
    if (weekOffRows.length === 0) return records;
    // Merge and sort descending by date (newest first)
    const merged = [...records, ...weekOffRows];
    merged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    // If a specific status filter is applied, filter week-off rows accordingly
    if (filters.status && filters.status !== 'WEEK_OFF') {
      return merged.filter(r => !r._isWeekOff);
    }
    return merged;
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
  const computeDurationMinutes = (checkIn, checkOut, recordDate) => {
    if (!checkIn) return 0;
    // Use a consistent date string to avoid duration leaps (like the year 2000 vs now)
    const dateStr = recordDate || new Date().toISOString().split('T')[0];
    const start = new Date(`${dateStr}T${checkIn}`);
    const end = checkOut ? new Date(`${dateStr}T${checkOut}`) : now;
    return Math.max(0, Math.floor((end - start) / 60000));
  };
  const todayDurationMinutes = todayRecord ? computeDurationMinutes(todayRecord.check_in_time, todayRecord.check_out_time, todayRecord.date) : 0;
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
    <div className="relative bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden group hover:border-white/20 transition-all duration-300 shadow-2xl backdrop-blur-xl">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <div className="relative p-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-black text-white uppercase tracking-tight">{value}</p>
              {percentage !== undefined && (
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-tighter">
                  {percentage}%
                </span>
              )}
            </div>
            {trend && (
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2">{trend}</p>
            )}
          </div>
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg shadow-black/20`}>
            <Icon className="h-6 w-6 text-white stroke-[2.5]" />
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
            <div className="text-sm font-bold text-white">
              {/* ✅ Use display_name from API - handles both employee and biometric */}
              {row.display_name || 'Unknown'}
            </div>
            <div className="text-sm font-medium text-slate-400">
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
          <div className="p-1 rounded-lg bg-red-50 mr-2">
            <CalendarIcon className="h-4 w-4 text-red-600" />
          </div>
          <span className="font-medium">{formatDate(date)}</span>
        </div>
      ),
    },
    {
      header: 'Check In',
      accessor: 'check_in_time',
      render: (time, row) => {
        if (row._isWeekOff) return <span className="text-gray-400">—</span>;
        return (
          <div className="flex items-center">
            <div className="p-1 rounded-lg bg-green-50 mr-2">
              <ClockIcon className="h-4 w-4 text-green-600" />
            </div>
            <span className={time ? 'text-white font-bold tracking-wide' : 'text-slate-500 italic'}>
              {formatTimeDisplay(time) || 'Not checked in'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Arrival',
      accessor: 'check_in_time',
      render: (time, row) => {
        if (row._isWeekOff) return <span className="text-gray-400">—</span>;
        if (!time) return <span className="text-gray-400">—</span>;
        // Parse check_in_time (HH:MM:SS or HH:MM)
        const [h, m] = time.split(':').map(Number);
        const checkInMinutes = h * 60 + m;
        const cutoffMinutes = 10 * 60; // 10:00 AM
        if (checkInMinutes <= cutoffMinutes) {
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ✓ On Time
            </span>
          );
        }
        const diffMinutes = checkInMinutes - cutoffMinutes;
        const lateHrs = Math.floor(diffMinutes / 60);
        const lateMins = diffMinutes % 60;
        const lateLabel = lateHrs > 0
          ? `${lateHrs}h ${lateMins}m late`
          : `${lateMins}m late`;
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            ⏰ {lateLabel}
          </span>
        );
      },
    },
    {
      header: 'Check Out',
      accessor: 'check_out_time',
      render: (time, row) => {
        if (row._isWeekOff) return <span className="text-gray-400">—</span>;
        return (
          <div className="flex items-center">
            <div className="p-1 rounded-lg bg-red-50 mr-2">
              <ClockIcon className="h-4 w-4 text-red-600" />
            </div>
            <span className={time ? 'text-white font-bold tracking-wide' : 'text-slate-500 italic'}>
              {formatTimeDisplay(time) || 'Not checked out'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      header: 'Type',
      accessor: 'attendance_type',
      render: (type, row) => {
        if (row._isWeekOff) return <span className="text-gray-400">—</span>;
        return (
          <div className="flex items-center">
            {type === 'BIOMETRIC' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-300 border border-white/20">
                <ServerIcon className="w-3 h-3 mr-1" />
                Biometric
              </span>
            )}
            {type === 'MANUAL' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                Manual
              </span>
            )}
            {type === 'QR_CODE' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                QR Code
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Approval Status',
      accessor: 'is_pending_approval',
      render: (isPending, row) => {
        if (row._isWeekOff) return <span className="text-gray-400">—</span>;
        if (isPending) {
          return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ClockIcon className="w-3 h-3 mr-1" />
              Pending
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      },
    },
    {
      header: 'Attendance Visual',
      accessor: 'biometric_logs',
      render: (logs) => <AttendanceVisual logs={logs} />,
    },
    {
      header: 'Effective Hours',
      accessor: 'biometric_logs',
      render: (logs) => {
        if (!logs || logs.length < 2) return <span className="text-gray-400">-</span>;
        const sortedLogs = [...logs].sort((a, b) => a.time.localeCompare(b.time));
        let totalMinutes = 0;
        const toMins = (timeStr) => {
          const [h, m] = timeStr.split(':').map(Number);
          return h * 60 + m;
        };
        for (let i = 0; i < sortedLogs.length; i += 2) {
          if (sortedLogs[i + 1]) {
            totalMinutes += (toMins(sortedLogs[i + 1].time) - toMins(sortedLogs[i].time));
          }
        }
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-semibold">
            {h}h {m}m
          </span>
        );
      },
    },
    {
      header: 'Gross Hours',
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
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Syncing Employee Lifecycle…</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-300">
      {/* Hero Section */}
      <div className={`relative overflow-hidden bg-gradient-to-br from-[#0B1120] to-[#070B14] border-b border-white/5 p-12 mb-8`}>
        <div className={`absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br ${theme.primaryGradient} opacity-10 rounded-full blur-3xl`}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center space-x-6">
              <div className="p-5 bg-white/5 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl">
                <ClockIcon className="h-12 w-12 text-indigo-400 stroke-[1.5]" />
              </div>
              <div>
                <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-3">Attendance Registry</h1>
                <p className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] opacity-80">
                  {isHRManager() ? 'Global Organizational Lifecycle Synchronization' :
                    isManager() ? 'Team Node Presence & Performance Monitor' :
                      'Personal Node Chronology & Attendance Verification'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isManagementRole && biometricDevices.length > 0 && (
                <div className="flex items-center space-x-3 px-6 py-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-xl transition-all">
                  <ServerIcon className="h-5 w-5 text-indigo-400" />
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Biometric Stream</p>
                    <p className="text-xs font-bold text-white uppercase">
                      Active ({biometricDevices.length} Nodes)
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={exportAttendance}
                className="group flex items-center px-10 py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/20 transition-all transform hover:scale-105 active:scale-95 shadow-2xl"
              >
                <DocumentChartBarIcon className="h-5 w-5 mr-3 text-indigo-400 group-hover:scale-125 transition-transform" />
                Export Dataset
              </button>
              <button
                onClick={() => setShowAnalytics(v => !v)}
                className={`group flex items-center px-8 py-5 border text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all transform hover:scale-105 active:scale-95 shadow-2xl ${
                  showAnalytics
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <SparklesIcon className="h-5 w-5 mr-3 text-indigo-400 group-hover:scale-125 transition-transform" />
                {showAnalytics ? 'Hide Analytics' : 'Analytics'}
              </button>

            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Management Role Pending Approvals Alert */}
        {canViewApprovals && pendingApprovalsCount > 0 && (
          <div className="mb-8">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                    <ExclamationTriangleIcon className="h-6 w-6 text-amber-400" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-amber-300">Action Required</h3>
                  <p className="text-amber-400/80 mt-1">
                    You have <span className="font-bold text-amber-300">{pendingApprovalsCount}</span> attendance edit request{pendingApprovalsCount > 1 ? 's' : ''} waiting for your approval
                    {(isManager() && !hasPerm('attendance.view_attendancerecord')) ? ' from your team members' : ''}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Overview Row: Stats Summary, Timings, Actions */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-12">
          {/* Attendance Stats (Me vs Team) - Redesigned to match sample */}
          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Attendance Stats</h3>
              <div className="flex items-center space-x-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Week</span>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Header Labels */}
              <div className="flex items-center justify-between px-2">
                <div className="w-1/3"></div>
                <div className="flex-1 flex justify-around">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Avg Hrs / Day</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">On Time Arrival</span>
                </div>
              </div>

              {/* Me Row */}
              <div className="group/row flex items-center justify-between p-4 bg-white/5 rounded-[1.5rem] border border-white/5 hover:border-indigo-500/30 transition-all">
                <div className="w-1/3 flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-amber-500" />
                  </div>
                  <span className="text-sm font-black text-white uppercase tracking-wider">Me</span>
                </div>
                <div className="flex-1 flex justify-around items-center">
                  <span className="text-lg font-black text-white tracking-tight">{minutesToHHMM(stats.lastWeekMe.avgMinutes)}</span>
                  <span className="text-lg font-black text-white tracking-tight">{stats.lastWeekMe.onTimePercent}%</span>
                </div>
              </div>

              {/* Team Row */}
              <div className="group/row flex items-center justify-between p-4 bg-white/5 rounded-[1.5rem] border border-white/5 hover:border-blue-500/30 transition-all opacity-80 hover:opacity-100">
                <div className="w-1/3 flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-sm font-black text-slate-300 uppercase tracking-wider">My Team</span>
                </div>
                <div className="flex-1 flex justify-around items-center">
                  <span className="text-lg font-black text-slate-300 tracking-tight">{minutesToHHMM(stats.lastWeekTeam.avgMinutes)}</span>
                  <span className="text-lg font-black text-slate-300 tracking-tight">{stats.lastWeekTeam.onTimePercent}%</span>
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 p-4">
              <div className="h-6 w-6 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-600 hover:text-white hover:border-white/30 cursor-help transition-colors">
                i
              </div>
            </div>
          </div>
          {/* Timings */}
          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chronological Status</h3>
              <div className="flex space-x-1.5">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => {
                  const jsDay = new Date().getDay();
                  const active = idx === jsDay;
                  return (
                    <span key={idx} className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg border transition-all ${active ? 'bg-indigo-500 text-white border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/5 text-slate-600 border-white/5 grayscale'}`}>{d}</span>
                  );
                })}
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-end justify-between">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-tight">
                  Node Status Today
                </p>
                <span className="text-[10px] font-medium text-slate-500 italic">
                  {todayRecord?.check_in_time ? `${formatTimeDisplay(todayRecord.check_in_time)} - ${todayRecord?.check_out_time ? formatTimeDisplay(todayRecord.check_out_time) : 'Active'}` : 'Inactive'}
                </span>
              </div>
              <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner p-1">
                {(() => {
                  const percent = Math.max(0, Math.min(100, Math.round((todayDurationMinutes / (9 * 60)) * 100)));
                  return <div className={`h-full bg-gradient-to-r ${theme.primaryGradient} rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]`} style={{ width: `${percent}%` }} />
                })()}
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Duration: <span className="text-white">{minutesToHHMM(todayDurationMinutes)}</span></span>
                <span className="text-slate-500">Objective: <span className="text-indigo-400">9.0H</span></span>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Control Interface</h3>
              <button
                type="button"
                onClick={() => setUse24Hour(!use24Hour)}
                className={`group flex items-center space-x-2 px-3 py-1 rounded-full border transition-all ${use24Hour ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5'}`}
              >
                <span className={`text-[9px] font-black uppercase tracking-tighter ${use24Hour ? 'text-indigo-400' : 'text-slate-500'}`}>24H Format</span>
                <div className={`w-6 h-3.5 rounded-full relative transition-colors ${use24Hour ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                  <div className={`absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-transform ${use24Hour ? 'left-[13px]' : 'left-[3px]'}`} />
                </div>
              </button>
            </div>
            <div className="flex flex-col items-center mb-10">
              <p className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{formatNow().split(' ')[0]}</p>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-2 opacity-80">{formatNow().split(' ')[1] || ''}</p>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-4">Node Clock: {new Date().toDateString()}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => handleQuickAction('clockin')} className="w-full text-left px-5 py-3 rounded-2xl bg-white/5 border border-white/5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 hover:text-white hover:border-white/20 transition-all flex items-center group/btn">
                <ClockIcon className="h-4 w-4 text-indigo-400 mr-3 group-hover/btn:scale-125 transition-transform" /> Quick Clock-In
              </button>
              <button onClick={() => handleQuickAction('wfh')} className="w-full text-left px-5 py-3 rounded-2xl bg-white/5 border border-white/5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 hover:text-white hover:border-white/20 transition-all flex items-center group/btn">
                <CalendarIcon className="h-4 w-4 text-indigo-400 mr-3 group-hover/btn:scale-125 transition-transform" /> Sync Remote Node
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
            gradient="from-red-500 to-red-600"
            trend="This month"
          />
          <StatCard
            title="Present Days"
            value={stats.presentDays}
            icon={UserIcon}
            gradient="from-rose-500 to-rose-600"
            percentage={stats.totalDays > 0 ? Math.round((stats.presentDays / stats.totalDays) * 100) : 0}
            trend="Attendance rate"
          />
          <StatCard
            title="Absent Days"
            value={stats.absentDays}
            icon={XCircleIcon}
            gradient="from-red-600 to-red-700"
            trend="Total absences"
          />
          <StatCard
            title="Late Days"
            value={stats.lateDays}
            icon={ClockIcon}
            gradient="from-orange-500 to-orange-600"
            trend="Late arrivals"
          />
          <StatCard
            title="On-Time Arrival"
            value={`${stats.onTimePercent}%`}
            icon={CheckCircleIcon}
            gradient="from-orange-500 to-red-600"
            trend="Punctuality"
          />
        </div>

        {/* ── Analytics Section ── */}
        {showAnalytics && (
          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-8 mb-12 shadow-2xl">
            <AttendanceTrends
              theme={theme}
              attendanceRecords={attendanceRecords}
              isManagementRole={isManagementRole}
            />
          </div>
        )}

        {/* Pending Edit Requests Section - Always show if requests exist, or for regular employees always */}
        {(!isManagementRole || userPendingRequests.length > 0) && (
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <ClockIcon className="h-6 w-6 mr-2 text-amber-400" />
              Your Pending Edit Requests
            </h3>
            {userPendingRequests.length > 0 ? (
              <div className="space-y-4">
                {userPendingRequests
                  .map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                          <ClockIcon className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-amber-300">
                            Edit request for {formatDate(record.date)}
                          </p>
                          <p className="text-xs text-amber-400/80 mt-1">
                            Waiting for {isHRManager() ? 'HR' : 'Manager'} approval
                          </p>
                          {record.edit_reason && (
                            <p className="text-xs text-amber-400/70 mt-1 italic">
                              "{record.edit_reason}"
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 border border-amber-500/30 text-amber-300">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        Pending
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-400" />
                </div>
                <p className="text-white font-medium">All caught up!</p>
                <p className="text-sm text-gray-400">No pending edit requests</p>
              </div>
            )}
          </div>
        )}
        {canViewApprovals && (
          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-10 mb-12 shadow-2xl relative overflow-hidden" data-approvals-section>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 shadow-2xl">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight flex items-center">
                    Registry Verification Queue
                    {isManager() && <span className="text-[10px] font-black text-slate-500 ml-4 uppercase tracking-[0.2em] bg-white/5 px-3 py-1 rounded-full border border-white/5">Team Nodes</span>}
                  </h3>
                  <p className="text-sm font-black text-slate-500 uppercase tracking-widest mt-1">Pending presence validation requests</p>
                </div>
              </div>
              <div className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                  {attendanceRecords.filter(r => r.is_pending_approval).length} QUEUED
                </span>
              </div>
            </div>
            {attendanceRecords.filter(r => r.is_pending_approval).length > 0 ? (
              <div className="space-y-8">
                {attendanceRecords
                  .filter(record => record.is_pending_approval)
                  .map((record) => (
                    <div key={record.id} className="bg-white/5 border border-white/5 rounded-[2rem] p-8 hover:bg-white/10 transition-all duration-300 shadow-inner group">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                        <div className="flex items-center space-x-5">
                          <div className="h-16 w-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 text-xl font-black text-white uppercase transform group-hover:rotate-6 transition-transform">
                            {record.display_name?.split(' ').map(n => n[0]).join('') || 'N/A'}
                          </div>
                          <div>
                            <h4 className="text-2xl font-black text-white uppercase tracking-tight">
                              {record.display_name || 'Unknown Node'}
                            </h4>
                            <div className="flex items-center space-x-3 mt-2">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">ID: {record.display_id || 'N/A'}</span>
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">{formatDate(record.date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-4">
                          <button
                            onClick={() => openApprovalModal(record, 'approve')}
                            disabled={submitting || !canActOnApprovals}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center space-x-3 shadow-xl shadow-emerald-500/20 transform hover:scale-105 active:scale-95"
                          >
                            <CheckCircleIcon className="h-4 w-4 stroke-[3]" />
                            <span>Validate Node</span>
                          </button>
                          <button
                            onClick={() => openApprovalModal(record, 'reject')}
                            disabled={submitting || !canActOnApprovals}
                            className="bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center space-x-3 transform hover:scale-105 active:scale-95"
                          >
                            <XCircleIcon className="h-4 w-4 stroke-[3]" />
                            <span>Abort Request</span>
                          </button>
                        </div>
                      </div>
                      {record.edit_reason && (
                        <div className="mb-8 p-6 bg-white/5 border border-white/5 rounded-2xl shadow-inner relative">
                          <div className="absolute top-0 right-4 -translate-y-1/2 bg-[#1A1F2E] px-3 py-1 rounded-full border border-white/5">
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Employee Rationalization</span>
                          </div>
                          <p className="text-sm font-bold text-slate-300 italic leading-relaxed">
                            "{record.edit_reason}"
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* ORIGINAL VALUES */}
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 shadow-inner flex flex-col grayscale opacity-50">
                          <h5 className="text-[10px] font-black text-slate-500 mb-6 flex items-center uppercase tracking-[0.2em]">
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Baseline Registry State
                          </h5>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Check In</span>
                              <span className="text-xs font-black text-slate-400 uppercase font-mono">{record.original_check_in_time || 'Null'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Check Out</span>
                              <span className="text-xs font-black text-slate-400 uppercase font-mono">{record.original_check_out_time || 'Null'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Protocol Status</span>
                              <span className="text-xs font-black text-slate-400 uppercase">{record.original_status || 'Null'}</span>
                            </div>
                          </div>
                        </div>
                        {/* REQUESTED VALUES */}
                        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 shadow-2xl flex flex-col">
                          <h5 className="text-[10px] font-black text-indigo-400 mb-6 flex items-center uppercase tracking-[0.2em]">
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Proposed Override State
                          </h5>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-indigo-500/10">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Check In</span>
                              <span className="text-xs font-black text-white uppercase font-mono shadow-[0_0_10px_rgba(255,255,255,0.1)]">{record.check_in_time || 'Null'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-indigo-500/10">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Check Out</span>
                              <span className="text-xs font-black text-white uppercase font-mono shadow-[0_0_10px_rgba(255,255,255,0.1)]">{record.check_out_time || 'Null'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Status</span>
                              <span className="text-xs font-black text-indigo-400 uppercase">{record.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-24 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                <div className="p-6 bg-emerald-500/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center border border-emerald-500/20 shadow-2xl">
                  <CheckCircleIcon className="h-10 w-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Queue Synchronized</h3>
                <p className="text-slate-500 mt-2 font-medium tracking-tight">
                  Zero pending verification requests in the current organizational node.
                </p>
              </div>
            )}
          </div>
        )}
        {/* Mark/Edit Attendance Form - Only for Employees (not for HR Manager or Manager) */}
        {!isManagementRole && (
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 bg-gradient-to-br ${theme.primaryGradient} rounded-xl`}>
                  <PlusIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {hasExistingRecord ? 'Edit Attendance' : 'Mark Attendance'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {hasExistingRecord ? 'Update your existing attendance record' : 'Record your daily attendance'}
                  </p>
                </div>
              </div>
              {hasExistingRecord && (
                <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-4 py-2 rounded-full text-sm font-medium">
                  ⚠️ Requires Approval
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Date</label>
                  <input
                    {...register('date', { required: 'Date is required' })}
                    type="date"
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors [color-scheme:dark]"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Check In Time</label>
                  <input
                    {...register('check_in_time')}
                    type="time"
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Check Out Time</label>
                  <input
                    {...register('check_out_time')}
                    type="time"
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
                  <select
                    {...register('status', { required: 'Status is required' })}
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-[#1e1e2d] text-white shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
                  {errors.status && <p className="text-red-400 text-sm mt-1">{errors.status.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Notes</label>
                  <input
                    {...register('notes')}
                    type="text"
                    placeholder="Optional notes..."
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors placeholder-gray-500"
                  />
                </div>
              </div>
              {/* Edit Reason Field - Only show if editing existing record OR past date */}
              {showEditReason && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-amber-300 mb-2">
                    Reason for Edit <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    {...register('edit_reason', {
                      required: showEditReason ? 'Reason is required for editing or adding past attendance' : false
                    })}
                    rows={3}
                    placeholder="Please explain why you need to edit this attendance record..."
                    className="w-full px-4 py-3 border border-amber-500/30 rounded-xl bg-white/5 text-white shadow-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors placeholder-amber-500/40 resize-none"
                  />
                  {errors.edit_reason && <p className="text-red-400 text-sm mt-1">{errors.edit_reason.message}</p>}
                  <p className="text-xs text-amber-400/80 mt-2 flex items-center">
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
        {/* Admin / HR / C-level: explicit filters (defaults to last 7 days vs. full history) */}
        {isOrgWideAttendanceRole() && (
          <div className="mb-8 rounded-3xl overflow-hidden border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-xl shadow-2xl">
            <div className="px-6 py-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <FunnelIcon className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Organization filters</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Employee, date range, and status — loads last 7 days by default
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Employee</label>
                <select
                  value={filters.employee_id}
                  onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 [color-scheme:dark]"
                >
                  <option value="">All employees</option>
                  {orgEmployeeOptions.map((emp) => {
                    const label = emp.user_info?.full_name || `${emp.user?.first_name || ''} ${emp.user?.last_name || ''}`.trim() || emp.employee_id || `ID ${emp.id}`;
                    return (
                      <option key={emp.id} value={emp.employee_id || ''}>
                        {label}{emp.employee_id ? ` (${emp.employee_id})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">From</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">To</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
                >
                  <option value="">All statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="HALF_DAY">Half day</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/15 hover:text-white transition-all"
                >
                  Reset filters
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Filters */}
        {(() => {
          const today = new Date();
          const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            return {
              label: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
              year: d.getFullYear(),
              month: d.getMonth(),
            };
          });
          const isLast7Active = (() => {
            const d7 = new Date(today);
            d7.setDate(today.getDate() - 6);
            return filters.start_date === toLocalYMD(d7) && filters.end_date === toLocalYMD(today);
          })();
          const isLast30Active = (() => {
            const d30 = new Date(today);
            d30.setDate(today.getDate() - 29);
            return filters.start_date === toLocalYMD(d30) && filters.end_date === toLocalYMD(today);
          })();
          const activeMonthIndex = months.findIndex(m => {
            const ms = new Date(m.year, m.month, 1);
            const me = new Date(m.year, m.month + 1, 0);
            return filters.start_date === toLocalYMD(ms) && filters.end_date === toLocalYMD(me);
          });
          const setLast7 = () => {
            const d7 = new Date(today);
            d7.setDate(today.getDate() - 6);
            handleFilterChange('start_date', toLocalYMD(d7));
            handleFilterChange('end_date', toLocalYMD(today));
          };
          const setLast30 = () => {
            const d30 = new Date(today);
            d30.setDate(today.getDate() - 29);
            handleFilterChange('start_date', toLocalYMD(d30));
            handleFilterChange('end_date', toLocalYMD(today));
          };
          const setMonth = (m) => {
            const ms = new Date(m.year, m.month, 1);
            const me = new Date(m.year, m.month + 1, 0);
            handleFilterChange('start_date', toLocalYMD(ms));
            handleFilterChange('end_date', toLocalYMD(me));
          };
          const orgWide = isOrgWideAttendanceRole();
          const timelineLabel = orgWide && isLast7Active
            ? 'LAST 7 DAYS'
            : isLast30Active
              ? 'LAST 30 CYCLES'
              : activeMonthIndex >= 0
                ? `${months[activeMonthIndex].label} ${months[activeMonthIndex].year}`
                : 'CUSTOM SPEC';
          return (
            <div className="mb-8 rounded-3xl overflow-hidden border border-white/5 bg-white/5 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center px-10 py-6 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <FunnelIcon className="h-4 w-4 text-indigo-400" />
                  </div>
                  <span className="text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    Timeline Query: {timelineLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {orgWide && (
                    <button
                      type="button"
                      onClick={setLast7}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${isLast7Active ? `bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]` : 'bg-white/5 text-slate-500 border border-white/5 hover:border-white/20'}`}
                    >
                      7 DAYS
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={setLast30}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${isLast30Active ? `bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]` : 'bg-white/5 text-slate-500 border border-white/5 hover:border-white/20'}`}
                  >
                    30 CYCLES
                  </button>
                  {months.map((m, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setMonth(m)}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${activeMonthIndex === i ? `bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]` : 'bg-white/5 text-slate-500 border border-white/5 hover:border-white/20 hover:text-white'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="px-10 py-8 border-b border-white/5 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <DocumentChartBarIcon className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">System Records</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Lifecycle event logs for current node query</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                <CalendarIcon className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-black text-white uppercase tracking-[0.15em]">{getDisplayRecords().length} LOGS</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <Table
              columns={columns}
              data={getDisplayRecords()}
              loading={loading}
              emptyMessage={
                isManager()
                  ? "SYSTEM ERROR: NO TEAM DATA NODES FOUND"
                  : "SYSTEM ERROR: NO ATTENDANCE DATA NODES FOUND"
              }
            />
          </div>
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
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
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
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-red-800">
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
              className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-full p-4 shadow-lg transition-all transform hover:scale-105"
              title={`${attendanceRecords.filter(r => r.is_pending_approval).length} pending approvals`}
            >
              <div className="relative">
                <ClockIcon className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 bg-white text-red-700 rounded-full text-xs font-bold w-6 h-6 flex items-center justify-center border-2 border-red-600">
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