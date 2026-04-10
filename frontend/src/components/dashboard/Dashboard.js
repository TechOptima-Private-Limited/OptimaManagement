import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  CakeIcon,
  HomeIcon,
  SparklesIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { isHRManager, isManager, getUserRole } from '../../utils/auth';
import { employeeAPI, attendanceAPI, leaveAPI, workFromHomeAPI, holidayAPI } from '../../services/api';
import { formatDate, formatTime } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import WorkFromHomePopup from '../attendance/WorkFromHomePopup';
import { useTheme } from '../../context/ThemeContext';
import { getLastWeekRange, getStatsForPeriod, formatMinutesAsHhMm } from '../../utils/attendanceStats';

// Helper to get local YYYY-MM-DD date (avoid UTC offset issues)
const toLocalDate = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const calculateAttendanceStats = (records, targetEmployeeId = null) => {
  const { start: lwStart, end: lwEnd } = getLastWeekRange();

  // Stats for target employee ("Me")
  const meStats = getStatsForPeriod(records, targetEmployeeId, lwStart, lwEnd);

  // Stats for the whole group ("Team")
  // By passing null for employeeId, getStatsForPeriod will average all records in the range
  const teamStats = getStatsForPeriod(records, null, lwStart, lwEnd);

  return {
    avgHours: formatMinutesAsHhMm(meStats.avgMinutes),
    onTimeArrival: `${meStats.onTimePercent}%`,
    teamAvgHours: formatMinutesAsHhMm(teamStats.avgMinutes),
    teamOnTime: `${teamStats.onTimePercent}%`
  };
};

const Dashboard = () => {
  const { user } = useAuth();
  const userRole = getUserRole();
  const isManagerOnly = isManager() && !isHRManager();
  const isManagerOrAbove = isManager() || isHRManager();
  const { theme } = useTheme();

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    leaveBalances: [],
    upcomingLeaves: [],
    recentActivity: [],
    attendanceStats: null,
    currentTime: new Date(),
    onLeaveToday: [],
    wfhToday: [],
    loading: true
  });

  // Attendance state with localStorage persistence (only for employees and HR managers)
  const [attendanceState, setAttendanceState] = useState(() => {
    // Note: Previously we excluded isManagerOnly, but managers are also employees 
    // who need to see their own status (e.g. from biometric sync).

    const saved = localStorage.getItem(`attendance_${user?.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // We restore isCheckedIn from storage for immediate UI response.
        // checkTodayAttendance() will then sync with the server truth.
        return {
          isCheckedIn: parsed.isCheckedIn || false,
          checkInTime: parsed.checkInTime ? new Date(parsed.checkInTime) : null,
          workingHours: 0,
          workingMinutes: 0,
          workingSeconds: 0,
          isWorkFromHome: parsed.isWorkFromHome || false,
          todayAttendance: null,
          pendingSubmission: parsed.pendingSubmission || false,
          _restored: true
        };
      } catch (e) {
        console.error('Failed to parse saved attendance state', e);
      }
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

  // Use ref to track latest attendance state for interval callbacks
  const attendanceStateRef = React.useRef(attendanceState);
  useEffect(() => {
    attendanceStateRef.current = attendanceState;
  }, [attendanceState]);

  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Auto alert dismissed state (per session)
  const [dismissedAlerts, setDismissedAlerts] = useState({ late: false, forgotCheckout: false, onTime: false });
  const dismissAlert = (key) => setDismissedAlerts(prev => ({ ...prev, [key]: true }));

  // WFH related state (only for employees and HR managers)
  const [showWFHPopup, setShowWFHPopup] = useState(false);
  const [wfhStatus, setWFHStatus] = useState({
    hasApprovedRequest: false,
    hasPendingRequest: false,
    hasRejectedRequest: false,
    canWorkFromHome: false,
    requestStatus: null
  });

  // Birthday and Festival state
  const [birthdayFestivalData, setBirthdayFestivalData] = useState({
    birthdays: {
      todays_birthdays: [],
      upcoming_birthdays: [],
      has_birthdays_today: false
    },
    festivals: {
      todays_festivals: [],
      upcoming_festivals: [],
      has_festivals_today: false
    }
  });

  const [showHolidaysModal, setShowHolidaysModal] = useState(false);
  const [allHolidays, setAllHolidays] = useState([]);

  // ===================
  // EFFECTS & LIFECYCLE
  // ===================

  // Save attendance state to localStorage (only for employees and HR managers)
  useEffect(() => {
    if (!isManagerOnly && user?.id && attendanceState) {
      localStorage.setItem(`attendance_${user.id}`, JSON.stringify({
        isCheckedIn: attendanceState.isCheckedIn,
        checkInTime: attendanceState.checkInTime,
        isWorkFromHome: attendanceState.isWorkFromHome,
        pendingSubmission: attendanceState.pendingSubmission
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceState?.isCheckedIn, attendanceState?.checkInTime, attendanceState?.isWorkFromHome, attendanceState?.pendingSubmission, user?.id, isManagerOnly]);

  // Main effect for fetching data and setting timers
  useEffect(() => {
    fetchDashboardData();
    fetchAllHolidays();
    fetchBirthdayFestivalData();

    // Only setup attendance-related functionality for employees and HR managers
    if (!isManagerOnly) {
      checkTodayAttendance();
      checkPendingSubmissions();
      checkWFHStatus();
    }

    const timer = setInterval(() => {
      setDashboardData(prev => ({ ...prev, currentTime: new Date() }));
      if (!isManagerOnly) {
        updateWorkingTime();
        checkAutoSubmit();
      }
    }, 1000);

    // Background polling every 60 seconds to keep data fresh
    const poolTimer = setInterval(() => {
      fetchDashboardData(true);
      fetchAllHolidays(); // Keep this updated too
      if (!isManagerOnly) {
        checkTodayAttendance(true);
      }
    }, 60000);

    return () => {
      clearInterval(timer);
      clearInterval(poolTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManagerOnly, user?.id, user?.employee_id]);

  // ===================
  // API FUNCTIONS
  // ===================

  const syncAttendanceFromRecords = (records, silent = false) => {
    if (!records || records.length === 0) return;

    const todayStr = toLocalDate(new Date());
    const targetId = user?.employee_id || user?.employee_pk || user?.id;

    // Standardized matching logic used by alerts and UI
    const todayRecord = records.find(r => {
      if (r.date !== todayStr) return false;
      const rId = r.display_id || r.employee_id || (r.employee && (r.employee.employee_id || r.employee.id));
      const rPK = r.employee?.id || r.employee;
      
      return (
        String(rId) === String(targetId) || 
        String(rPK) === String(user?.employee_pk) || 
        String(rPK) === String(user?.id)
      );
    });

    if (todayRecord && todayRecord.check_in_time && (!todayRecord.check_out_time || todayRecord.check_out_time === todayRecord.check_in_time)) {
      const reconstructedCheckIn = new Date(`${todayRecord.date}T${todayRecord.check_in_time}`);
      
      setAttendanceState(prev => ({
        ...(prev || {}),
        isCheckedIn: true,
        checkInTime: reconstructedCheckIn,
        isWorkFromHome: todayRecord.attendance_type === 'WFH' || todayRecord.notes?.includes('Work from Home'),
        todayAttendance: todayRecord,
        pendingSubmission: prev?.pendingSubmission || false
      }));
    } else if (todayRecord?.check_out_time && todayRecord.check_out_time !== todayRecord.check_in_time) {
      // Record exists and is completed (checked out)
      setAttendanceState(prev => ({
        ...(prev || {}),
        isCheckedIn: false,
        checkInTime: null,
        isWorkFromHome: false,
        todayAttendance: todayRecord,
        pendingSubmission: false
      }));
    } else if (!todayRecord && !silent) {
       // Only reset if we are sure no record exists (not a silent background check)
       // This prevents flickering while data is loading
    }
  };

  const fetchBirthdayFestivalData = async () => {
    try {
      const response = await employeeAPI.getBirthdayFestivalData();
      const data = response.data;

      console.log('✅ Birthday/Festival data received:', data);

      setBirthdayFestivalData(data);

      if (data.birthdays.has_birthdays_today) {
        data.birthdays.todays_birthdays.forEach(birthday => {
          toast.success(
            `🎉 It's ${birthday.employee_name}'s birthday today! 🎂 
           Wishing them a wonderful ${birthday.age_today}th birthday! 🎈`
          );
        });
      }

    } catch (error) {
      console.error('❌ Network error fetching birthday/festival data:', error);

      setBirthdayFestivalData({
        birthdays: { todays_birthdays: [], upcoming_birthdays: [], has_birthdays_today: false },
        festivals: { todays_festivals: [], upcoming_festivals: [], has_festivals_today: false }
      });
    }
  };

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setDashboardData(prev => ({ ...prev, loading: true }));
      const promises = [];

      const now = new Date();
      const attendanceRangeStart = new Date(now);
      attendanceRangeStart.setDate(now.getDate() - 30);
      const attendanceStartDate = toLocalDate(attendanceRangeStart);
      const attendanceEndDate = toLocalDate(now);

      if (isManagerOrAbove) {
        // For managers and HR: fetch team data (page_size: 1000 for stats)
        promises.push(
          employeeAPI.getEmployees({ limit: 10 }),                       // [0]
          leaveAPI.getLeaveRequests({ status: 'PENDING', limit: 10 }),    // [1]
          leaveAPI.getLeaveRequests({ status: 'APPROVED', limit: 10 }),   // [2]
          attendanceAPI.getAttendanceRecords({ start_date: attendanceStartDate, end_date: attendanceEndDate, page_size: 1000 }), // [3]
          leaveAPI.getOnLeaveToday(),                                   // [4]
          workFromHomeAPI.getWFHToday()                                 // [5]
        );
      } else {
        // For employees: fetch personal data
        promises.push(
          leaveAPI.getLeaveSummary(),                                   // [0]
          attendanceAPI.getAttendanceRecords({ limit: 7 }),              // [1]
          leaveAPI.getLeaveRequests({ limit: 5 }),                      // [2]
          attendanceAPI.getAttendanceRecords({ start_date: attendanceStartDate, end_date: attendanceEndDate, page_size: 500 }), // [3]
          leaveAPI.getOnLeaveToday(),                                   // [4]
          workFromHomeAPI.getWFHToday()                                 // [5]
        );
      }

      const results = await Promise.all(promises);

      // Process attendance records for stats
      const allAttendance = results[3]?.data?.results || results[3]?.data || [];
      const stats = calculateAttendanceStats(allAttendance, user?.employee_id || user?.employee_pk || user?.id);

      // Mandatory Leave/WFH today data for both paths
      const onLeaveTodayData = results[4]?.data || [];
      const wfhTodayData = results[5]?.data || [];

      if (isManagerOrAbove) {
        // Find recent attendance for the current user from the stats list
        const myRecentAttendance = allAttendance.filter(r => {
          const rId = r.display_id || r.employee_id || (r.employee && (r.employee.employee_id || r.employee.id));
          const targetId = user?.employee_id || user?.employee_pk || user?.id;
          return String(rId) === String(targetId);
        }).slice(0, 7);

        setDashboardData(prev => ({
          ...prev,
          employees: results[0]?.data?.results || results[0]?.data || [],
          pendingLeaves: results[1]?.data?.results || results[1]?.data || [],
          approvedLeaves: results[2]?.data?.results || results[2]?.data || [],
          recentActivity: myRecentAttendance,
          attendanceStats: stats,
          onLeaveToday: onLeaveTodayData,
          wfhToday: wfhTodayData,
          currentTime: new Date(),
          loading: false
        }));
        // Sync attendance state for managers too
        syncAttendanceFromRecords(allAttendance, silent);
      } else {
        const recentActivity = results[1]?.data?.results || results[1]?.data || [];
        setDashboardData(prev => ({
          ...prev,
          leaveBalances: results[0].data.leave_balances || [],
          leaveSummary: results[0].data,
          recentActivity: recentActivity,
          attendanceStats: stats,
          onLeaveToday: onLeaveTodayData,
          wfhToday: wfhTodayData,
          currentTime: new Date(),
          loading: false
        }));
        // Sync attendance state from the personal records fetched
        syncAttendanceFromRecords(recentActivity, silent);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchAllHolidays = async () => {
    try {
      const response = await holidayAPI.getHolidays();
      const holidays = response.data.results || response.data || [];
      // Sort holidays by date
      const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date));
      setAllHolidays(sortedHolidays);
    } catch (error) {
      console.error('Failed to fetch all holidays:', error);
    }
  };

  // Employee and HR Manager only functions
  const checkTodayAttendance = async (silent = false) => {
    if (isManagerOnly) return;

    try {
      const today = toLocalDate(new Date());
      // For regular employees, the backend already handles isolation.
      // We only pass employee_id if we have it and it's a specific requirement.
      const params = {
        start_date: today,
        end_date: today
      };
      
      // Only add employee_id filter if it exists and we're not a regular employee
      // (regular employees are already scoped by backend)
      if (user?.employee_id && isManagerOrAbove) {
        params.employee_id = user.employee_id;
      }

      const response = await attendanceAPI.getAttendanceRecords(params);
      const allRecords = response.data?.results || response.data || [];
      
      syncAttendanceFromRecords(allRecords, silent);
    } catch (error) {
      console.error('Failed to check today attendance/WFH:', error);
    }
  };

  const checkWFHStatus = async () => {
    if (isManagerOnly) return;

    try {
      if (isHRManager()) {
        setWFHStatus({
          hasApprovedRequest: true,
          hasPendingRequest: false,
          hasRejectedRequest: false,
          canWorkFromHome: true,
          requestStatus: 'APPROVED'
        });
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      const response = await workFromHomeAPI.getWFHRequests();
      console.log('📡 WFH API response:', response);

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
      setWFHStatus({
        hasApprovedRequest: false,
        hasPendingRequest: false,
        hasRejectedRequest: false,
        canWorkFromHome: false,
        requestStatus: null
      });
    }
  };

  // Employee and HR Manager only attendance functions
  const checkPendingSubmissions = () => {
    if (isManagerOnly || !attendanceState) return;

    if (attendanceState.isCheckedIn && attendanceState.checkInTime) {
      const now = new Date();
      const checkInTime = new Date(attendanceState.checkInTime);
      const hoursDiff = (now - checkInTime) / (1000 * 60 * 60);

      if (hoursDiff >= 24) {
        submitPendingAttendance(false);
      }
    }
  };

  const checkAutoSubmit = () => {
    if (isManagerOnly || !attendanceStateRef.current) return;

    const currentState = attendanceStateRef.current;
    if (currentState.isCheckedIn && currentState.checkInTime) {
      const now = new Date();
      const checkInTime = new Date(currentState.checkInTime);
      const hoursDiff = (now - checkInTime) / (1000 * 60 * 60);

      if (hoursDiff >= 24 && !currentState.pendingSubmission) {
        toast.info('Auto-submitting attendance after 24 hours...');
        submitPendingAttendance(false);
      }
    }
  };

  const updateWorkingTime = () => {
    if (isManagerOnly || !attendanceStateRef.current) return;

    const currentState = attendanceStateRef.current;
    if (currentState.isCheckedIn && currentState.checkInTime) {
      const now = new Date();
      const checkInTime = new Date(currentState.checkInTime);
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

  const handleCheckIn = async (workFromHome = false) => {
    if (isManagerOnly) return;

    if (workFromHome) {
      if (isHRManager() || wfhStatus.hasApprovedRequest) {
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
        // Immediately create a check-in record
        try {
          const coords = await getGeoCoords();
          const attendanceData = {
            date: toLocalDate(now),
            check_in_time: now.toTimeString().slice(0, 8),
            status: 'PRESENT',
            attendance_type: 'MANUAL',
            notes: 'Work from Home'
          };
          if (coords) {
            attendanceData.check_in_lat = Number(coords.lat).toFixed(6);
            attendanceData.check_in_lng = Number(coords.lng).toFixed(6);
          }
          await attendanceAPI.markManualAttendance(attendanceData);
          checkTodayAttendance(true);
        } catch (err) {
          console.error('Failed to submit WFH check-in:', err);
          toast.error('Failed to submit check-in to server');
        }
        return;
      } else {
        setShowWFHPopup(true);
        return;
      }
    }

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

    toast.success('🌐 Remote Login successful! Timer is running.');
    // Immediately create a check-in record
    try {
      const coords = await getGeoCoords();
      const attendanceData = {
        date: toLocalDate(now),
        check_in_time: now.toTimeString().slice(0, 8),
        status: 'PRESENT',
        attendance_type: 'MANUAL',
        notes: 'Remote Login'
      };
      if (coords) {
        attendanceData.check_in_lat = Number(coords.lat).toFixed(6);
        attendanceData.check_in_lng = Number(coords.lng).toFixed(6);
      }
      await attendanceAPI.markManualAttendance(attendanceData);
      checkTodayAttendance(true);
    } catch (err) {
      console.error('Failed to submit office check-in:', err);
      toast.error('Failed to submit check-in to server');
    }
  };

  const handleCheckOut = async () => {
    if (isManagerOnly || !attendanceState) return;

    if (!attendanceState.isCheckedIn || !attendanceState.checkInTime) {
      toast.error('You need to check in first!');
      return;
    }

    setSubmittingAttendance(true);

    try {
      await submitPendingAttendance(true);

      const totalWorkedHours = `${attendanceState.workingHours}h ${attendanceState.workingMinutes}m`;

      setAttendanceState(prev => ({
        ...prev,
        isCheckedIn: false,
        checkInTime: null,
        workingHours: 0,
        workingMinutes: 0,
        workingSeconds: 0,
        pendingSubmission: false
      }));

      if (user?.id) {
        localStorage.removeItem(`attendance_${user.id}`);
      }

      toast.success(`✅ Checked out successfully! Total worked: ${totalWorkedHours}`);
      await checkTodayAttendance(true);
    } catch (error) {
      toast.error('Failed to check out. Please try again.');
      console.error('Check-out error:', error);
    } finally {
      setSubmittingAttendance(false);
    }
  };
  const submitPendingAttendance = async (includeCheckOut = true) => {
    if (isManagerOnly || !attendanceState?.checkInTime) return;

    const now = new Date();
    const checkInTime = new Date(attendanceState.checkInTime);

    const attendanceData = {
      date: toLocalDate(checkInTime),
      status: 'PRESENT',
      attendance_type: 'MANUAL',
      notes: attendanceState.isWorkFromHome ? 'Work from Home' : 'Remote Login'
    };

    // Only include check_in_time if we are NOT checking out.
    // When checking out, the backend already has the check-in time, and omitting it
    // avoids approval-triggering comparison mismatches.
    if (!includeCheckOut) {
      attendanceData.check_in_time = checkInTime.toTimeString().slice(0, 8);
    }

    if (includeCheckOut) {
      attendanceData.check_out_time = now.toTimeString().slice(0, 8);
      attendanceData.notes += ' - Completed';
      const coords = await getGeoCoords();
      if (coords) {
        attendanceData.check_out_lat = Number(coords.lat).toFixed(6);
        attendanceData.check_out_lng = Number(coords.lng).toFixed(6);
      }
    } else {
      attendanceData.notes += ' - Auto-submitted (no check-out)';
    }

    try {
      const response = await attendanceAPI.markManualAttendance(attendanceData);
      return response.data;
    } catch (error) {
      console.error('Failed to submit attendance:', error);
      const status = error?.response?.status;
      if (status === 404) {
        setAttendanceState(prev => prev ? { ...prev, pendingSubmission: false } : prev);
        if (user?.id) {
          localStorage.removeItem(`attendance_${user.id}`);
        }
      }
      throw error;
    }
  };

  const handleWFHSuccess = () => {
    toast.success('Work from home request submitted! You will be notified once approved.');
    checkWFHStatus();
    setShowWFHPopup(false);
  };

  // ===================
  // UTILITY FUNCTIONS
  // ===================

  const formatWorkingTime = () => {
    if (isManagerOnly || !attendanceState) return '00:00:00';

    const { workingHours, workingMinutes, workingSeconds } = attendanceState;
    if (workingHours === 0 && workingMinutes === 0 && workingSeconds === 0) {
      return '00:00:00';
    }
    return `${String(workingHours).padStart(2, '0')}:${String(workingMinutes).padStart(2, '0')}:${String(workingSeconds).padStart(2, '0')}`;
  };

  // Geolocation helpers
  const getGeoCoords = () => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  };

  // Hourly ping while checked in
  useEffect(() => {
    if (isManagerOnly || !attendanceState?.isCheckedIn) return;

    const ping = async () => {
      const coords = await getGeoCoords();
      if (!coords) return;
      try {
        await attendanceAPI.pingLocation({ latitude: Number(coords.lat).toFixed(6), longitude: Number(coords.lng).toFixed(6) });
      } catch (e) {
        // silent failure
      }
    };

    // Ping immediately and then every hour
    ping();
    const id = setInterval(ping, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [attendanceState?.isCheckedIn, isManagerOnly]);


  const BirthdayBanner = () => {
    if (!birthdayFestivalData.birthdays.has_birthdays_today) return null;

    return (
      <div className={`mb-6 bg-gradient-to-r ${theme.headerGradient} rounded-2xl p-6 text-white relative overflow-hidden shadow-2xl border border-white/10 group`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 left-10 text-6xl animate-bounce">🎂</div>
          <div className="absolute top-8 right-20 text-4xl animate-pulse">🎈</div>
          <div className="absolute bottom-4 left-1/4 text-5xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎉</div>
          <div className="absolute top-1/2 right-10 text-3xl animate-pulse" style={{ animationDelay: '1s' }}>✨</div>
          <div className="absolute bottom-8 right-1/3 text-4xl animate-bounce" style={{ animationDelay: '1.5s' }}>🎁</div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <CakeIcon className="w-8 h-8 mr-3" />
                🎉 Birthday Celebration! 🎉
              </h2>
              <div className="space-y-2">
                {birthdayFestivalData.birthdays.todays_birthdays.map((birthday) => (
                  <div key={birthday.id} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold backdrop-blur-sm border border-white/30">
                      {birthday.avatar_initials}
                    </div>
                    <div>
                      <p className="text-xl font-semibold">
                        Happy {birthday.age_today}th Birthday, {birthday.employee_name}! 🎂
                      </p>
                      <p className="text-white/90 text-sm">
                        {birthday.employee_department} • Wishing you joy, success, and happiness! 🌟
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-6xl animate-pulse">🎊</div>
          </div>
        </div>
      </div>
    );
  };

  const FestivalBanner = () => {
    if (!birthdayFestivalData.festivals.has_festivals_today) return null;

    return (
      <div className={`mb-6 bg-gradient-to-r ${theme.primaryGradient} rounded-2xl p-6 text-white relative overflow-hidden shadow-2xl border border-white/10`}>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <SparklesIcon className="w-8 h-8 mr-3" />
                Festival Celebration!
              </h2>
              <div className="space-y-2">
                {birthdayFestivalData.festivals.todays_festivals.map((festival) => (
                  <div key={festival.id} className="flex items-center space-x-3">
                    <div className="text-4xl">{festival.emoji}</div>
                    <div>
                      <p className="text-xl font-semibold">Happy {festival.name}!</p>
                      <p className="text-white/90 text-sm">{festival.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // ===================
  // CARD COMPONENTS
  // ===================

  const FestivalCard = ({ festival }) => {

    const getGradientClass = (type) => {
      switch (type?.toLowerCase()) {
        case 'religious': return 'from-amber-400 via-orange-500 to-red-500';
        case 'national': return 'from-blue-500 via-indigo-600 to-violet-600';
        case 'cultural': return 'from-emerald-400 via-teal-500 to-cyan-600';
        case 'international': return 'from-rose-400 via-pink-500 to-purple-600';
        default: return 'from-orange-400 via-red-500 to-pink-500';
      }
    };

    return (
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getGradientClass(festival.festival_type)} p-[2px] shadow-xl transform hover:scale-[1.02] transition-all duration-500 hover:shadow-2xl group min-w-[300px] max-w-[300px]`}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative bg-white/10 backdrop-blur-md rounded-[calc(1.5rem-2px)] p-5 h-full border border-white/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/20 transform group-hover:rotate-12 transition-transform duration-500">
                  {festival.emoji}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight drop-shadow-sm">{festival.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-md border border-white/30">
                      {festival.festival_type?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/30 shadow-lg text-center min-w-[70px]">
                <div className="text-lg font-black text-white leading-none">
                  {festival.days_until_festival === 0 ? 'TODAY' : festival.days_until_festival}
                </div>
                <div className="text-[10px] text-white/80 font-bold uppercase tracking-tighter">
                  {festival.days_until_festival === 0 ? '🎉' : 'Days to go'}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-white/90">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CalendarDaysIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold">{festival.formatted_date}</span>
              </div>

              {festival.is_holiday && (
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-red-500/30 backdrop-blur-md rounded-xl border border-red-400/30">
                  <span className="text-lg leading-none">🏖️</span>
                  <span className="text-[11px] font-bold text-white uppercase tracking-widest">Public Holiday</span>
                </div>
              )}

              {festival.description && (
                <p className="text-white/80 text-xs leading-relaxed line-clamp-2 italic font-medium">
                  "{festival.description}"
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Special Celebration</span>
            </div>
            <div className="flex -space-x-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BirthdayCard = ({ birthday }) => {
    return (

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-900 p-1 shadow-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl group min-w-[320px] max-w-[320px]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-3 left-6 text-4xl animate-bounce">🎂</div>
          <div className="absolute top-8 right-8 text-3xl animate-pulse" style={{ animationDelay: '0.5s' }}>🎈</div>
          <div className="absolute bottom-6 left-8 text-2xl animate-bounce" style={{ animationDelay: '1s' }}>🎉</div>
          <div className="absolute bottom-3 right-6 text-3xl animate-pulse" style={{ animationDelay: '1.5s' }}>🎁</div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl animate-pulse opacity-10">✨</div>
        </div>

        <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-4 h-full border border-white/20">
          <div className="flex items-start space-x-4 mb-2">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg border-4 border-white/30">
                {birthday.avatar_initials}
              </div>
              <div className="absolute -top-1 -right-1 text-xl animate-bounce">🎉</div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-white drop-shadow-md mb-0.5">{birthday.employee_name}</h3>
              <div className="text-indigo-200 text-sm mb-2">{birthday.employee_department}</div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium text-white/90 backdrop-blur-sm border border-white/30">
                  🎂 BIRTHDAY
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-2.5 border-2 border-white/30 shadow-lg">
                <div className="text-xl font-black text-white drop-shadow-md">{birthday.age_today}</div>
                <div className="text-xs text-white/90 font-medium">years</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 mb-2">
            <div className="text-white/90 text-center">
              <div className="text-lg font-semibold mb-1">🎉 Happy Birthday! 🎉</div>
              <div className="text-sm">Wishing you joy, success, and happiness on your special day! 🌟</div>
            </div>
          </div>

          <div className="text-white/80 text-xs text-center mb-2">📅 {birthday.formatted_birth_date}</div>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/20">
            <div className="flex items-center space-x-2">
              <CakeIcon className="w-4 h-4 text-yellow-300" />
              <span className="text-white/80 text-sm font-medium">Special Day</span>
            </div>
            <div className="flex space-x-1">
              <span className="text-lg animate-bounce">🎈</span>
              <span className="text-lg animate-bounce" style={{ animationDelay: '0.2s' }}>🎊</span>
              <span className="text-lg animate-bounce" style={{ animationDelay: '0.4s' }}>🎉</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // const QuickAccessCard = ({ title, children, className = "", gradient = false }) => (
  //   <div className={`${gradient ? 'bg-gradient-to-br from-white to-blue-50/50' : 'bg-white/80 backdrop-blur-sm'} rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 ${className}`}>
  //     <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">{title}</h3>
  //     {children}
  //   </div>
  // );
  const QuickAccessCard = ({ title, children, className = "", gradient = false, headerAction = null }) => {
    // If className contains a bg- class, don't apply the default background
    const hasCustomBg = className.includes('bg-');
    const defaultBg = gradient ? 'bg-white/10 backdrop-blur-xl border border-white/5 shadow-2xl' : 'bg-white/5 backdrop-blur-lg border border-white/5';

    return (
      <div className={`${hasCustomBg ? '' : defaultBg} rounded-2xl p-5 hover:border-white/10 transition-all duration-300 group ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center group-hover:text-indigo-400 transition-colors">
            {title}
          </h3>
          {headerAction}
        </div>
        <div className="relative">
          {children}
        </div>
      </div>
    );
  };

  const HolidaysModal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;

    const displayHolidays = data || [];
    const sortedHolidays = [...displayHolidays].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Helper to get month name (short)
    const getMonthName = (dateStr) => {
      return new Date(dateStr).toLocaleString('default', { month: 'short' }).toUpperCase();
    };

    // Helper to get day number
    const getDayNumber = (dateStr) => {
      return new Date(dateStr).getDate().toString().padStart(2, '0');
    };

    // Helper to get day name
    const getDayName = (dateStr) => {
      return new Date(dateStr).toLocaleString('default', { weekday: 'long' });
    };

    // Variety of colors for month header based on month
    const getMonthColor = (idx) => {
      const month = new Date(sortedHolidays[idx].date).getMonth();
      const styleMap = {
        0: 'bg-[#06b6d4]', // JAN: Cyan
        1: 'bg-[#fb7185]', // FEB: Rose
        2: 'bg-[#fbbf24]', // MAR: Amber
        7: 'bg-[#d946ef]', // AUG: Magenta
        8: 'bg-[#2dd4bf]', // SEPT: Teal
        9: 'bg-[#fb7185]', // OCT: Rose
        11: 'bg-[#3fbaf6]', // DEC: Blue
      };
      return styleMap[month] || 'bg-[#94a3b8]';
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-[#000000]/70 backdrop-blur-md" onClick={onClose} />

        {/* Modal Content */}
        <div className="relative bg-[#0b1221] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/5 animate-in zoom-in-95 duration-200">
          <div className="p-6 md:p-8">
            {/* Custom Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-6">
                <h2 className="text-xl font-medium text-white tracking-tight">Holidays</h2>
                <div className="flex items-center space-x-4 text-base">
                  <button className="text-slate-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <span className="font-semibold text-white tracking-wide">2026</span>
                  <button className="text-slate-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-all transform hover:rotate-90">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar-holiday">
              {sortedHolidays.length === 0 ? (
                <div className="col-span-2 text-center py-10 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-slate-400 text-base">No holidays found for this year.</p>
                </div>
              ) : (
                sortedHolidays.map((h, idx) => (
                  <div key={idx} className="flex items-center space-x-4 group">
                    {/* Calendar Icon */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden shadow-lg flex flex-col border border-white/10 group-hover:border-white/20 transition-colors shrink-0">
                      <div className={`h-5 ${getMonthColor(idx)} flex items-center justify-center text-[9px] font-black text-white tracking-[0.1em] opacity-90`}>
                        {getMonthName(h.date)}
                      </div>
                      <div className="flex-1 bg-[#1a2236] flex items-center justify-center text-xl font-bold text-white tracking-tighter">
                        {getDayNumber(h.date)}
                      </div>
                    </div>

                    {/* Holiday Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-slate-100 group-hover:text-white transition-colors mb-0.5 truncate">{h.name}</h4>
                      <p className="text-slate-500 text-sm font-medium">{getDayName(h.date)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
          .custom-scrollbar-holiday::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar-holiday::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 10px;
          }
          .custom-scrollbar-holiday::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar-holiday::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `}</style>
      </div>
    );
  };
  const LeaveBalanceCircle = ({ balance }) => {
    const used = balance.used_days;
    const total = balance.total_days;
    const remaining = balance.remaining_days;
    const percentage = (used / total) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="text-center p-4 rounded-xl border border-white/5 bg-white/5 transition-all duration-300">
        <div className="relative w-24 h-24 mx-auto mb-2">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
            <circle
              cx="50" cy="50" r="45" stroke="url(#primaryGradient)" strokeWidth="8" fill="none"
              strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
            />
            <defs>
              <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-black text-indigo-400">{remaining}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">left</div>
            </div>
          </div>
        </div>
        <div className="text-xs font-black text-slate-200 uppercase tracking-widest">{balance.leave_type?.code}</div>
        <div className="text-[10px] text-slate-500 font-bold">{used}/{total} used</div>
      </div>
    );
  };

  // ===================
  // AUTO ALERTS
  // ===================

  // Compute which alerts are active based on current time + attendance.
  // Uses recentActivity (API-fetched records) as ground truth to cover biometric
  // and any non-web check-ins where attendanceState may not be updated.
  const computeAutoAlerts = () => {
    if (isManagerOnly || !attendanceState) return { isLate: false, forgotCheckout: false, hasCheckedIn: false, checkInTime: null, isOnTime: false };

    const now = dashboardData.currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const totalMinutes = currentHour * 60 + currentMinute;

    // Check real API records for today (covers biometric + web check-ins)
    const todayStr = toLocalDate(now);
    const recentRecords = dashboardData.recentActivity || [];
    
    // Filter specifically for the current user's record today
    // (relevant for managers who might have multiple people's data in records)
    const todayApiRecord = recentRecords.find(r => {
      if (r.date !== todayStr) return false;
      const rId = r.display_id || r.employee_id || (r.employee && (r.employee.employee_id || r.employee.id));
      const targetId = user?.employee_id || user?.employee_pk || user?.id;
      return String(rId) === String(targetId);
    });

    // Employee has attended today if:
    //  1. Web UI state says checked in, OR
    //  2. todayAttendance is set from checkTodayAttendance, OR
    //  3. A fetched attendance record exists for today (biometric / other device)
    const todayRecord = attendanceState.todayAttendance || todayApiRecord;
    const hasCheckedInToday = attendanceState.isCheckedIn || !!todayRecord;

    // "Late" logic (Office starts at 10:00 AM)
    const lateThresholdMinutes = 10 * 60 + 5; // 10:05 AM (5 min grace period)

    let isLate = false;
    let checkInTimeStr = null;

    if (hasCheckedInToday) {
      // Find the EARLIEST check-in time across all sources
      let earliestCheckInMinutes = Infinity;
      let displayTime = null;

      // 1. Check API record
      const recordToProcess = attendanceState.todayAttendance || todayApiRecord;
      if (recordToProcess && recordToProcess.check_in_time) {
        const [h, m] = recordToProcess.check_in_time.split(':').map(Number);
        const minutes = h * 60 + m;
        if (minutes < earliestCheckInMinutes) {
          earliestCheckInMinutes = minutes;
          displayTime = recordToProcess.check_in_time;
        }
      }

      // 2. Check Web memory state (might be earlier than synced record)
      if (attendanceState.checkInTime) {
        const h = attendanceState.checkInTime.getHours();
        const m = attendanceState.checkInTime.getMinutes();
        const minutes = h * 60 + m;
        if (minutes < earliestCheckInMinutes) {
          earliestCheckInMinutes = minutes;
          displayTime = attendanceState.checkInTime;
        }
      }

      // 3. Evaluate if late
      if (earliestCheckInMinutes !== Infinity && earliestCheckInMinutes > lateThresholdMinutes) {
        isLate = true;
        checkInTimeStr = formatTime(displayTime);
      }
    } else {
      // Still haven't checked in, and past threshold
      if (totalMinutes >= lateThresholdMinutes) {
        isLate = true;
      }
    }

    // "Forgot to check out" = after 7:00 PM and an active check-in exists (no checkout yet)
    const checkoutThresholdMinutes = 19 * 60; // 7:00 PM
    const hasActiveCheckIn =
      attendanceState.isCheckedIn ||
      (todayApiRecord && todayApiRecord.check_in_time && !todayApiRecord.check_out_time);

    const forgotCheckout = totalMinutes >= checkoutThresholdMinutes && hasActiveCheckIn;

    const isOnTime = hasCheckedInToday && !isLate;
    const isWorkFromHome = (todayRecord?.attendance_type === 'WFH') || 
                          (todayRecord?.notes?.includes('Work from Home')) || 
                          (attendanceState.isWorkFromHome);

    return { 
      isLate, 
      forgotCheckout, 
      hasCheckedIn: hasCheckedInToday, 
      checkInTime: checkInTimeStr, 
      isOnTime,
      isWorkFromHome
    };
  };

  const autoAlerts = computeAutoAlerts();

  const AutoAlerts = () => {
    if (isManagerOnly) return null;

    const alerts = [];

    if (autoAlerts.isLate && !dismissedAlerts.late) {
      const isMissing = !autoAlerts.hasCheckedIn;
      alerts.push({
        key: 'late',
        emoji: isMissing ? '⏰' : '⚠️',
        title: isMissing ? 'You are late today' : 'Late Arrival Recorded',
        subtitle: isMissing
          ? 'It looks like you haven\'t checked in yet. Please check in as soon as possible.'
          : `You checked in at ${autoAlerts.checkInTime}, which is after the 10:00 AM shift start.`,
        gradient: isMissing
          ? 'from-rose-500/20 via-orange-500/15 to-amber-500/10'
          : 'from-orange-500/15 via-amber-500/10 to-transparent',
        border: isMissing ? 'border-rose-500/30' : 'border-orange-500/30',
        icon_bg: isMissing ? 'bg-rose-500/20' : 'bg-orange-500/20',
        icon_color: isMissing ? 'text-rose-400' : 'text-orange-400',
        accent: isMissing ? 'text-rose-300' : 'text-orange-300',
        pulse: isMissing ? 'bg-rose-500' : 'bg-orange-500',
        action: isMissing ? () => document.getElementById('checkin-btn')?.click() : null,
        actionLabel: isMissing ? 'Check In Now' : null
      });
    }

    if (autoAlerts.isOnTime && !dismissedAlerts.onTime) {
      alerts.push({
        key: 'onTime',
        emoji: '🙌',
        title: 'Great job!',
        subtitle: 'You arrived on time today. Keep up the excellent work! 🚀',
        gradient: 'from-emerald-500/20 via-teal-500/15 to-transparent',
        border: 'border-emerald-500/30',
        icon_bg: 'bg-emerald-500/20',
        icon_color: 'text-emerald-400',
        accent: 'text-emerald-300',
        pulse: 'bg-emerald-500',
        action: null,
        actionLabel: null
      });
    }

    if (autoAlerts.forgotCheckout && !dismissedAlerts.forgotCheckout) {
      alerts.push({
        key: 'forgotCheckout',
        emoji: '🔔',
        title: 'Forgot to check out?',
        subtitle: 'You are still marked as checked in. Don\'t forget to check out before you leave!',
        gradient: 'from-amber-500/20 via-yellow-500/15 to-orange-500/10',
        border: 'border-amber-500/30',
        icon_bg: 'bg-amber-500/20',
        icon_color: 'text-amber-400',
        accent: 'text-amber-300',
        pulse: 'bg-amber-400',
        action: null,
        actionLabel: null
      });
    }

    if (alerts.length === 0) return null;

    return (
      <div className="space-y-3 mb-6">
        {alerts.map((alert) => (
          <div
            key={alert.key}
            className={`relative flex items-start justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r ${alert.gradient} border ${alert.border} backdrop-blur-sm shadow-lg overflow-hidden group animate-in slide-in-from-top-2 duration-500`}
          >
            {/* Animated shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />

            <div className="flex items-start space-x-4">
              {/* Icon */}
              <div className={`flex-shrink-0 w-11 h-11 ${alert.icon_bg} rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/10`}>
                {alert.emoji}
              </div>

              {/* Text */}
              <div>
                <div className="flex items-center space-x-2 mb-0.5">
                  <div className={`w-2 h-2 ${alert.pulse} rounded-full animate-pulse`} />
                  <h4 className={`text-sm font-bold ${alert.accent} uppercase tracking-wider`}>
                    {alert.title}
                  </h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{alert.subtitle}</p>
                {alert.actionLabel && (
                  <button
                    onClick={alert.action}
                    className={`mt-2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${alert.icon_bg} ${alert.accent} border ${alert.border} hover:bg-white/10 transition-colors`}
                  >
                    {alert.actionLabel}
                  </button>
                )}
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => dismissAlert(alert.key)}
              className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-white/5"
              title="Dismiss"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    );
  };

  // ===================
  // MAIN RENDER
  // ===================

  if (dashboardData.loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient} flex items-center justify-center`}>
        <LoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient}`}>
      {/* Enhanced Header with Role-based Greeting */}
      {/* <div className={`bg-gradient-to-r ${theme.headerGradient} text-white border-b border-white/20 px-6 py-6 shadow-xl`}> */}
      <div className={`bg-slate-900 text-white border-b border-white/5 px-8 py-10 shadow-lg relative overflow-hidden`}>
        {/* Subtle pattern or overlay to break the solid red */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] -mr-48 -mt-48 opacity-40"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600 rounded-full blur-[100px] -ml-32 -mb-32 opacity-20"></div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 text-indigo-300">
                {userRole?.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              Welcome, {user?.first_name}! <span className="animate-bounce inline-block">👋</span>
            </h1>
            <p className="text-slate-400 mt-2 font-medium flex items-center">
              <CalendarDaysIcon className="h-4 w-4 mr-2 text-indigo-400" />
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center space-x-6">
            {/* Enhanced Status Display (Syncs with ground truth from alerts) */}
            {attendanceState && (
              <div className="text-right">
                <div className={`px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-md border border-white/10 ${autoAlerts.hasCheckedIn
                  ? autoAlerts.isWorkFromHome
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/5 text-slate-400 border-white/10'
                  }`}>
                  {autoAlerts.hasCheckedIn
                    ? autoAlerts.isWorkFromHome ? '🏠 Working from Home' : '🏢 Checked In'
                    : '⏸️ Not Checked In'
                  }
                </div>
                {attendanceState.isCheckedIn && (
                  <div className="text-slate-400 text-sm mt-1 font-medium italic">
                    Working: {formatWorkingTime()}
                  </div>
                )}
              </div>
            )}
            <div className="text-right">
              <div className="text-3xl font-bold text-white drop-shadow-lg">
                {dashboardData.currentTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </div>
              <div className="text-slate-400 font-medium">Current Time</div>
            </div>
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Auto Alerts */}
        <AutoAlerts />

        {/* Birthday Banner */}
        <BirthdayBanner />

        {/* Festival Banner */}
        <FestivalBanner />


        {/* On Leave and WFH Sections */}
        {isManagerOrAbove && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <QuickAccessCard title="Who's on Leave Today" gradient={true}>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar-holiday">
                {(dashboardData.onLeaveToday?.length || 0) > 0 ? (
                  dashboardData.onLeaveToday.map((leave, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 text-xs font-black">
                          {leave.initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{leave.employee_name}</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{leave.leave_type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">ON LEAVE</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 italic text-[11px] font-bold uppercase tracking-widest opacity-50">
                    No one is on leave today
                  </div>
                )}
              </div>
            </QuickAccessCard>

            <QuickAccessCard title="Who's Working From Home Today" gradient={true}>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar-holiday">
                {(dashboardData.wfhToday?.length || 0) > 0 ? (
                  dashboardData.wfhToday.map((wfh, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-400 text-xs font-black">
                          {wfh.initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{wfh.employee_name}</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Working Remote</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">WFH</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 italic text-[11px] font-bold uppercase tracking-widest opacity-50">
                    No one is working from home today
                  </div>
                )}
              </div>
            </QuickAccessCard>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {!isManagerOnly && attendanceState && (
              <QuickAccessCard title="⏱️ Quick Access" className="bg-[#0F172A] text-white border-white/5 overflow-hidden relative shadow-2xl">
                {/* Decorative pulse effect */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-600/20 rounded-full blur-[80px]"></div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="mb-8">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Current Time</div>
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Live Sync</span>
                      </div>
                    </div>
                    <div className="flex items-baseline space-x-3">
                      <div className="text-5xl font-black tracking-tighter text-white drop-shadow-sm">
                        {dashboardData.currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).split(' ')[0]}
                      </div>
                      <div className="text-xl font-bold text-indigo-500 uppercase tracking-tight">
                        {dashboardData.currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).split(' ')[1]}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-bold mt-2 uppercase tracking-tight">
                      {dashboardData.currentTime.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {!attendanceState.isCheckedIn ? (
                      <button
                        onClick={() => handleCheckIn(false)}
                        disabled={submittingAttendance}
                        className="w-full flex items-center justify-center py-4 px-6 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-indigo-600/20 text-xs tracking-widest uppercase"
                      >
                        {submittingAttendance ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          'CHECK IN'
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleCheckOut}
                        disabled={submittingAttendance}
                        className="w-full flex items-center justify-center py-4 px-6 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-bold transition-all duration-300 shadow-xl shadow-rose-600/20 text-xs tracking-widest uppercase border border-rose-500/10"
                      >
                        {submittingAttendance ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          'CHECK OUT'
                        )}
                      </button>
                    )}
                  </div>

                  {/* Progress Bar for Employees */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                      <span>Shift Progress</span>
                      <span>{Math.min(Math.round((attendanceState.workingHours / 9) * 100), 100)}%</span>
                    </div>
                    <div className="w-full rounded-full h-3 bg-slate-800 border border-white/5">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 shadow-sm bg-gradient-to-r ${theme.primaryGradient}`}
                        style={{ width: `${Math.min((attendanceState.workingHours / 9) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </QuickAccessCard>
            )}

            {/* Attendance Statistics Card */}
            <QuickAccessCard title="📊 Attendance Statistics" gradient={true}>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-white/5 shadow-inner bg-white/5">
                  <div className="text-[10px] font-bold uppercase mb-2 text-indigo-400 tracking-wider">My Performance (Last Week)</div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-2xl font-black text-white">{dashboardData.attendanceStats?.avgHours}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Avg Hrs / Day</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-white">{dashboardData.attendanceStats?.onTimeArrival}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">On-Time Arrival</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-4 rounded-xl border border-indigo-500/20 shadow-inner">
                  <div className="text-[10px] font-bold text-indigo-300 uppercase mb-2 tracking-wider">Team Overview (Last Week)</div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-2xl font-black text-white">{dashboardData.attendanceStats?.teamAvgHours}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">TEAM AVG HRS</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-white">{dashboardData.attendanceStats?.teamOnTime}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">TEAM ON-TIME</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-[9px] text-slate-500 italic opacity-75">* Stats are for the last completed week (Mon-Sun)</p>
              </div>
            </QuickAccessCard>
            {/* Manager/HR Quick Access */}
            <QuickAccessCard title="🚀 Quick Access" gradient={true}>
              <div className="grid grid-cols-2 gap-4">
                {/* Leave Management for Managers */}
                {isManagerOrAbove && (
                  <Link
                    to="/leave"
                    className="group flex items-center justify-center p-6 rounded-2xl border border-white/5 transition-all duration-300 transform hover:scale-105 shadow-2xl bg-white/5 backdrop-blur-xl hover:border-white/10 hover:bg-white/10"
                  >
                    <div className="text-center">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-all duration-500 bg-gradient-to-r ${theme.primaryGradient} group-hover:scale-110`}>
                        <CalendarDaysIcon className="h-7 w-7 text-white" />
                      </div>
                      <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">Manage Leaves</span>
                    </div>
                  </Link>
                )}

                {/* {isHRManager() && ( */}
                <>
                  <Link
                    to="/attendance"
                    className="group flex items-center justify-center p-6 rounded-2xl border border-white/5 transition-all duration-300 transform hover:scale-105 shadow-2xl bg-white/5 backdrop-blur-xl hover:border-white/10 hover:bg-white/10"
                  >
                    <div className="text-center">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-all duration-500 bg-gradient-to-r ${theme.secondaryGradient} group-hover:scale-110`}>
                        <ClockIcon className="h-7 w-7 text-white" />
                      </div>
                      <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">View Attendance</span>
                    </div>
                  </Link>
                </>
                {/* )} */}
                {/* Employee and HR Manager Quick Access */}
                {!isManagerOrAbove && (
                  <>
                    <Link
                      to="/leave"
                      className="group flex items-center justify-center p-6 rounded-2xl border border-white/5 transition-all duration-300 transform hover:scale-105 shadow-2xl bg-white/5 backdrop-blur-xl hover:border-white/10 hover:bg-white/10"
                    >
                      <div className="text-center">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-all duration-500 bg-gradient-to-r ${theme.primaryGradient} group-hover:scale-110`}>
                          <CalendarDaysIcon className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">Apply Leave</span>
                      </div>
                    </Link>

                  </>
                )}
              </div>
            </QuickAccessCard>


            <QuickAccessCard
              title="🎉 Upcoming Festivals & Celebrations"
              className="overflow-hidden"
              gradient={true}
              headerAction={
                <button
                  onClick={() => setShowHolidaysModal(true)}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5 hover:border-white/10"
                >
                  View All
                </button>
              }
            >
              {birthdayFestivalData.festivals.upcoming_festivals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-4xl">🎭</div>
                  </div>
                  <p className="text-slate-500 text-lg font-medium">No upcoming festivals</p>
                  <p className="text-slate-400 text-sm mt-2">Stay tuned for upcoming celebrations!</p>
                </div>
              ) : birthdayFestivalData.festivals.upcoming_festivals.length === 1 ? (
                // SINGLE CARD - CENTER IT
                <div className="flex justify-center">
                  <FestivalCard
                    key={birthdayFestivalData.festivals.upcoming_festivals[0].id}
                    festival={birthdayFestivalData.festivals.upcoming_festivals[0]}
                  />
                </div>
              ) : (
                // MULTIPLE CARDS - USE HORIZONTAL SCROLL
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0B1120] via-transparent to-transparent z-10 pointer-events-none"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0B1120] via-transparent to-transparent z-10 pointer-events-none"></div>

                  <div className="overflow-x-auto pb-4 scrollbar-hide">
                    <div className="flex space-x-6 px-2" style={{ width: 'max-content' }}>
                      {birthdayFestivalData.festivals.upcoming_festivals.map((festival) => (
                        <FestivalCard key={festival.id} festival={festival} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </QuickAccessCard>

            <HolidaysModal
              isOpen={showHolidaysModal}
              onClose={() => setShowHolidaysModal(false)}
              data={allHolidays}
            />
            {/* Enhanced Upcoming Birthdays Card */}
            <QuickAccessCard title="🎂 Upcoming Birthdays" className="overflow-hidden" gradient={false}>
              {birthdayFestivalData.birthdays.upcoming_birthdays.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-4xl">🎂</div>
                  </div>
                  <p className="text-slate-500 text-lg font-medium">No upcoming birthdays</p>
                  <p className="text-slate-400 text-sm mt-2">We'll let you know when someone's special day is coming up!</p>
                </div>
              ) : birthdayFestivalData.birthdays.upcoming_birthdays.length === 1 ? (
                // SINGLE CARD - CENTER IT
                <div className="flex justify-center">
                  <BirthdayCard
                    key={birthdayFestivalData.birthdays.upcoming_birthdays[0].id}
                    birthday={birthdayFestivalData.birthdays.upcoming_birthdays[0]}
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0B1120] via-transparent to-transparent z-10 pointer-events-none"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0B1120] via-transparent to-transparent z-10 pointer-events-none"></div>

                  <div className="overflow-x-auto pb-4 scrollbar-hide">
                    <div className="flex space-x-6 px-2" style={{ width: 'max-content' }}>
                      {birthdayFestivalData.birthdays.upcoming_birthdays.map((birthday) => (
                        <BirthdayCard key={birthday.id} birthday={birthday} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </QuickAccessCard>

            {/* Team Management for Managers */}
            {isManagerOrAbove && (
              <QuickAccessCard title="👥 Team Overview" gradient={true}>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                      <div className="text-2xl font-black text-indigo-400">{dashboardData.employees?.length || 0}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Employees</div>
                    </div>
                    <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                      <div className="text-2xl font-black text-indigo-400">{dashboardData.pendingLeaves?.length || 0}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pending Leaves</div>
                    </div>
                    <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                      <div className="text-2xl font-black text-indigo-400">{dashboardData.approvedLeaves?.length || 0}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Approved Leaves</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <Link
                      to="/employees"
                      className={`inline-flex items-center px-4 py-2 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg transform hover:scale-105 bg-gradient-to-r ${theme.primaryGradient}`}
                    >
                      View Team Details →
                    </Link>
                  </div>
                </div>
              </QuickAccessCard>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Go to Workplace Card */}
            <QuickAccessCard title="🏢 Go to Workplace" gradient={true}>
              <div className="space-y-4">
                <div className="p-6 rounded-xl border border-white/5 shadow-2xl text-center group transition-all duration-300 hover:border-white/10 bg-slate-900/60 backdrop-blur-xl">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500 bg-indigo-600 text-white">
                    <HomeIcon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Avarta Workplace</h4>
                  <p className="text-sm text-slate-400 mb-6 font-medium">
                    Access your technical workspace and project management tools.
                  </p>
                  <a
                    href="https://avarta.techoptima.ai/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center w-full px-8 py-4 text-white font-bold rounded-xl transition-all duration-300 shadow-lg transform hover:scale-[1.02] active:scale-95 bg-gradient-to-r ${theme.primaryGradient}`}
                  >
                    Go to Workplace
                    <span className="ml-2 text-xl">→</span>
                  </a>
                </div>
              </div>
            </QuickAccessCard>

            {/* Leave Balances - Only for Employees and HR Managers */}
            {!isManagerOnly && (
              <QuickAccessCard title="🏖️ Leave Balances" gradient={true}>
                <div className="space-y-4">
                  {dashboardData.leaveBalances?.length === 0 ? (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5 shadow-inner backdrop-blur-md">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CalendarDaysIcon className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">No leave balances available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {dashboardData.leaveBalances?.slice(0, 4).map((balance) => (
                        <LeaveBalanceCircle key={balance.id} balance={balance} />
                      ))}
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/5">
                    <Link
                      to="/leave"
                      className={`inline-flex items-center px-6 py-3 text-white font-bold rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 active:scale-95 bg-gradient-to-r ${theme.primaryGradient}`}
                    >
                      Request Leave
                      <span className="ml-2 text-xl">→</span>
                    </Link>
                  </div>
                </div>
              </QuickAccessCard>
            )}

            {/* Enhanced Birthdays Today & Upcoming */}
            <QuickAccessCard title="🎂 Birthdays & Celebrations" gradient={true}>
              <div className="space-y-6">
                {/* Today's Birthdays */}
                <div>
                  <div className="flex items-center text-sm text-slate-400 mb-3 font-semibold uppercase tracking-widest">
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full flex items-center justify-center mr-2 shadow-lg">
                      <CakeIcon className="w-3 h-3 text-white" />
                    </div>
                    <span>Birthdays Today</span>
                  </div>
                  {birthdayFestivalData.birthdays.has_birthdays_today ? (
                    <div className="space-y-3">
                      {birthdayFestivalData.birthdays.todays_birthdays.map((birthday) => (
                        <div key={birthday.id} className="flex items-center space-x-3 p-4 bg-white/5 border border-white/5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                          <div className={`w-12 h-12 bg-gradient-to-r ${theme.avatarGradient} rounded-full flex items-center justify-center shadow-lg`}>
                            <span className="text-white text-sm font-bold">{birthday.avatar_initials}</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-white">{birthday.employee_name}</div>
                            <div className="text-xs text-slate-400 font-medium">{birthday.employee_department}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl mb-1">🎂</div>
                            <div className="text-xs bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent font-bold">{birthday.age_today} years</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5 backdrop-blur-md">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                        <CakeIcon className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="text-sm text-slate-400 font-medium">No birthdays today</p>
                    </div>
                  )}
                </div>

                {/* Upcoming Birthdays */}
                <div>
                  <div className="text-sm text-slate-400 mb-3 font-semibold flex items-center uppercase tracking-widest">
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full flex items-center justify-center mr-2 shadow-lg">
                      <GiftIcon className="w-3 h-3 text-white" />
                    </div>
                    Upcoming Birthdays
                  </div>
                  {birthdayFestivalData.birthdays.upcoming_birthdays.length > 0 ? (
                    <div className="space-y-3">
                      {birthdayFestivalData.birthdays.upcoming_birthdays.slice(0, 3).map((birthday) => (
                        <div key={birthday.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:shadow-sm transition-all duration-300">
                          <div className={`w-10 h-10 bg-gradient-to-r ${theme.avatarGradient} rounded-full flex items-center justify-center shadow-md`}>
                            <span className="text-white text-xs font-bold">{birthday.avatar_initials}</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-white">{birthday.employee_name}</div>
                            <div className="text-xs text-slate-400 font-medium">{birthday.formatted_birth_date}</div>
                          </div>
                          <div className="text-xs bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent font-bold">
                            {birthday.days_until_birthday === 1 ? 'Tomorrow' : `${birthday.days_until_birthday} days`}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-white/5 rounded-lg border border-white/5">
                      <div className="text-4xl mb-2">🎁</div>
                      <p className="text-sm text-slate-400 font-medium">No upcoming birthdays</p>
                    </div>
                  )}
                </div>
              </div>
            </QuickAccessCard>

            {/* Enhanced Quick Actions */}
            <QuickAccessCard title="⚡ Quick Actions" gradient={true}>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
                  <span className="text-sm font-bold text-slate-400 flex items-center uppercase tracking-tighter">
                    <ClockIcon className="w-4 h-4 mr-2 text-indigo-400" />
                    Current Time
                  </span>
                  <span className="text-2xl font-black text-white">
                    {dashboardData.currentTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {/* Manager Quick Actions */}
                  {isManagerOrAbove ? (
                    <>
                      <Link
                        to="/leave"
                        className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-lg"
                      >
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-tight">Manage Team Leaves</span>
                        <CalendarDaysIcon className="w-5 h-5 transition-colors duration-300 text-indigo-400 group-hover:text-indigo-300" />
                      </Link>

                      <Link
                        to="/attendance"
                        className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-lg"
                      >
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-tight">Team Attendance Reports</span>
                        <ChartBarIcon className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" />
                      </Link>

                      <Link
                        to="/employees"
                        className="group flex items-center justify-between p-4 bg-slate-800/50 border border-white/10 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg"
                      >
                        <span className="text-sm font-semibold">Employee Management</span>
                        <UserGroupIcon className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" />
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* Employee and HR Manager Quick Actions */}
                      <Link
                        to="/attendance"
                        className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-lg"
                      >
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-tight">View Attendance Records</span>
                        <ChartBarIcon className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" />
                      </Link>

                      <Link
                        to="/leave"
                        className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-lg"
                      >
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-tight">Apply for Leave</span>
                        <CalendarDaysIcon className="w-5 h-5 transition-colors duration-300 text-indigo-400 group-hover:text-indigo-300" />
                      </Link>

                      <Link
                        to="/work-from-home"
                        className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-lg"
                      >
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-tight">Work From Home</span>
                        <HomeIcon className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </QuickAccessCard>

            {/* Enhanced Recent Activity - Role Based */}
            <QuickAccessCard title="📈 Recent Activity" gradient={true}>
              <div className="flex flex-col space-y-4">
                {/* Activity and Action items updated with deep theme */}
              </div>
            </QuickAccessCard>
          </div>
        </div>
      </div>

      {/* Work From Home Popup - Only show for employees and HR managers */}
      {!isManagerOnly && (
        <WorkFromHomePopup
          isOpen={showWFHPopup}
          onClose={() => setShowWFHPopup(false)}
          onSuccess={handleWFHSuccess}
        />
      )}

      {/* Enhanced Custom CSS */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Enhanced hover effects */
        .festival-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }
        
        .birthday-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }

        /* Smooth scrolling */
        .overflow-x-auto {
          scroll-behavior: smooth;
        }

        /* Custom animations */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        /* Gradient text effect */
        .gradient-text {
          background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 4s ease infinite;
        }

        /* Card hover animations */
        .card-hover-effect {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover-effect:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        /* Shimmer effect for loading states */
        .shimmer {
          position: relative;
          overflow: hidden;
        }

        .shimmer::after {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          animation: shimmer 2s infinite;
          content: '';
        }

        /* Enhanced gradient borders */
        .gradient-border {
          position: relative;
          background: linear-gradient(45deg, #6366f1, #8b5cf6);
          border-radius: 12px;
          padding: 2px;
        }

        .gradient-border::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 12px;
          padding: 2px;
          background: linear-gradient(45deg, #6366f1, #a855f7, #ec4899, #8b5cf6);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
        }

        /* Glass morphism effect */
        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Improved button animations */
        .btn-gradient {
          background: linear-gradient(45deg, #6366f1, #4f46e5);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .btn-gradient::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .btn-gradient:hover::before {
          left: 100%;
        }

        /* Progress bar animation */
        @keyframes progressFill {
          0% { width: 0%; }
          100% { width: var(--progress-width); }
        }

        .progress-bar {
          animation: progressFill 1.5s ease-out forwards;
        }

        /* Card entrance animations */
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .slide-in-up {
          animation: slideInUp 0.6s ease-out forwards;
        }

        /* Enhanced box shadows */
        .shadow-gradient {
          box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.15);
        }

        .shadow-gradient:hover {
          box-shadow: 0 6px 20px 0 rgba(102, 126, 234, 0.25);
        }

        /* Responsive design enhancements */
        @media (max-width: 768px) {
          .mobile-responsive {
            grid-template-columns: 1fr;
          }
        }

        /* Custom scrollbar for webkit browsers */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ffffff;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
