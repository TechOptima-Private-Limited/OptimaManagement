import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import { UserGroupIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { attendanceAPI, leaveAPI, workFromHomeAPI } from '../../services/api';

const MyTeam = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [manager, setManager] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    onTime: [],
    late: [],
    workFromHome: [],
    remoteLogin: [],
    onLeave: []
  });

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({ attendance: [], leaves: [], wfh: [] });
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Search for side panel
  const [teamSearchTerm, setTeamSearchTerm] = useState(''); // Search for main team list

  useEffect(() => {
    fetchTeamData();
    fetchCalendarData(calendarDate);
  }, [calendarDate]);

  // Helper to convert date to YYYY-MM-DD format
  const toLocalDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const [hours, minutes] = timeString.split(':');
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };

  const fetchTeamData = async () => {
    try {
      setLoading(true);

      // First fetch user profile to get role
      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const profileResponse = await fetch(`${apiBase}/auth/profile/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);

        const userRole = profileData.profile?.role;

        // Fetch team data based on role
        if (userRole === 'HR_MANAGER' || userRole === 'ADMIN') {
          await fetchAllManagersWithTeams();
        } else if (userRole === 'MANAGER') {
          await fetchManagerData();
        } else {
          // For EMPLOYEE, IT_SUPPORTER and others
          await fetchEmployeeProfileData();
        }

        // Note: fetchTeamAttendanceData will be called after team data is set in individual fetch functions
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamAttendanceData = async (teamMembers = null, currentUser = null) => {
    try {
      const today = toLocalDate(new Date());

      // Use provided team members or fall back to state, and always include the current employee
      // to ensure the manager/employee sees their own status in the overview
      const baseMembers = teamMembers || team;
      const effectiveEmployee = currentUser || employee;

      const membersToProcess = effectiveEmployee ? (
        baseMembers.some(m => String(m.id) === String(effectiveEmployee.id))
          ? baseMembers
          : [...baseMembers, effectiveEmployee]
      ) : baseMembers;

      // Get team member IDs
      const teamMemberIds = membersToProcess.map(member => member.id);

      if (teamMemberIds.length === 0) {
        setAttendanceStats({
          onTime: [],
          late: [],
          workFromHome: [],
          remoteLogin: [],
          onLeave: []
        });
        return;
      }

      // Fetch today's attendance records - API will filter based on user permissions
      // We'll filter for team members client-side
      const attendanceResponse = await attendanceAPI.getAttendanceRecords({
        start_date: today,
        end_date: today,
        include_peers: true
      });

      const attendanceRecords = attendanceResponse.data.results || attendanceResponse.data || [];

      // Filter records for team members only - handle both number and string IDs
      const teamMemberIdsSet = new Set(teamMemberIds.map(id => String(id)));
      const teamAttendanceRecords = attendanceRecords.filter(record => {
        // Try multiple ways to get employee ID from attendance record
        const recordEmployeeId = record.employee?.id || record.employee_id || record.employee;
        return recordEmployeeId && teamMemberIdsSet.has(String(recordEmployeeId));
      });

      // Fetch WFH requests for today - get all and filter by date client-side
      // since the API might not support date filtering
      let wfhRequests = [];
      try {
        const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
        const wfhResponse = await fetch(`${apiBase}/attendance/wfh/requests/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (wfhResponse.ok) {
          const wfhData = await wfhResponse.json();
          const allWFH = Array.isArray(wfhData) ? wfhData : (wfhData.results || []);
          // Filter for today's requests only
          wfhRequests = allWFH.filter(wfh => {
            const requestDate = wfh.request_date;
            // Handle both date string and full datetime formats
            const dateStr = typeof requestDate === 'string'
              ? requestDate.split('T')[0]
              : requestDate;
            return dateStr === today;
          });
        }
      } catch (error) {
        console.error('Error fetching WFH requests:', error);
        // Continue without WFH data
      }

      // Separate approved WFH requests - handle ID comparison
      const approvedWFH = wfhRequests.filter(wfh => {
        const wfhEmployeeId = wfh.employee?.id || wfh.employee;
        return wfh.status === 'APPROVED' && wfhEmployeeId && teamMemberIdsSet.has(String(wfhEmployeeId));
      });

      // Fetch leave requests for today
      let leaveRequests = [];
      try {
        const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
        const leaveResponse = await fetch(`${apiBase}/leave/requests/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (leaveResponse.ok) {
          const leaveData = await leaveResponse.json();
          const allLeaves = Array.isArray(leaveData) ? leaveData : (leaveData.results || []);
          // Filter for today's approved leave requests
          leaveRequests = allLeaves.filter(leave => {
            if (leave.status !== 'APPROVED') return false;

            const startDate = typeof leave.start_date === 'string'
              ? leave.start_date.split('T')[0]
              : leave.start_date;
            const endDate = typeof leave.end_date === 'string'
              ? leave.end_date.split('T')[0]
              : leave.end_date;

            // Check if today falls within the leave period
            return today >= startDate && today <= endDate;
          });
        }
      } catch (error) {
        console.error('Error fetching leave requests:', error);
        // Continue without leave data
      }

      // Separate approved leave requests for team members
      const approvedLeaves = leaveRequests.filter(leave => {
        const leaveEmployeeId = leave.employee?.id || leave.employee;
        return leaveEmployeeId && teamMemberIdsSet.has(String(leaveEmployeeId));
      });

      // Calculate stats
      const onTime = [];
      const late = [];
      const workFromHome = [];
      const remoteLogin = [];
      const onLeave = [];

      membersToProcess.forEach(member => {
        const memberIdStr = String(member.id);

        // Try multiple ways to match attendance record
        const attendanceRecord = teamAttendanceRecords.find(ar => {
          const arEmployeeId = ar.employee?.id || ar.employee_id || ar.employee;
          return arEmployeeId && String(arEmployeeId) === memberIdStr;
        });

        const hasWFH = approvedWFH.some(wfh => {
          const wfhEmployeeId = wfh.employee?.id || wfh.employee;
          return wfhEmployeeId && String(wfhEmployeeId) === memberIdStr;
        });

        const hasLeave = approvedLeaves.some(leave => {
          const leaveEmployeeId = leave.employee?.id || leave.employee;
          return leaveEmployeeId && String(leaveEmployeeId) === memberIdStr;
        });

        if (hasLeave) {
          onLeave.push(member);
          return;
        }

        const hasCheckedIn = !!(attendanceRecord && (attendanceRecord.check_in_time || attendanceRecord.status === 'PRESENT' || attendanceRecord.status === 'LATE'));

        // Determine lateness
        let isLate = false;
        if (hasCheckedIn && attendanceRecord.check_in_time) {
          const [hours, minutes, seconds] = attendanceRecord.check_in_time.split(':').map(Number);
          if (hours > 10 || (hours === 10 && (minutes > 0 || seconds > 0))) {
            isLate = true;
          }
          if (attendanceRecord.status === 'LATE') isLate = true;
        }

        if (hasCheckedIn) {
          // Add to late list if applicable
          if (isLate) {
            late.push({ ...member, attendanceRecord });
          } else {
            onTime.push({ ...member, attendanceRecord });
          }

          // Check for remote login indicators
          const notes = (attendanceRecord.notes || '').toLowerCase();
          const isRemoteNote = notes.includes('remote') || notes.includes('wfh') || notes.includes('work from home');
          const isOfficeNote = notes.includes('office');
          const isRemoteLogin = (hasWFH || isRemoteNote) && !isOfficeNote;

          if (isRemoteLogin) {
            remoteLogin.push(member);
          }
        }

        // Always add to WFH category if they have an approved request, regardless of check-in
        if (hasWFH) {
          workFromHome.push(member);
        }

        if (attendanceRecord && attendanceRecord.status === 'ABSENT' && !hasCheckedIn) {
          onLeave.push(member);
        }
      });

      // Remove duplicates from remoteLogin (in case someone is in both WFH and remoteLogin)
      const uniqueRemoteLogin = [...new Set(remoteLogin.map(m => m.id))].map(id =>
        remoteLogin.find(m => m.id === id)
      );

      setAttendanceStats({
        onTime,
        late,
        workFromHome,
        remoteLogin: uniqueRemoteLogin,
        onLeave
      });
    } catch (error) {
      console.error('Error fetching team attendance data:', error);
      // Don't show error toast, just log it
    }
  };

  const fetchCalendarData = async (date) => {
    try {
      setCalendarLoading(true);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Fetch attendance, leaves, and WFH for the month using shared API services
      const [attendanceRes, leaveRes, wfhRes] = await Promise.all([
        attendanceAPI.getAttendanceRecords({ start_date: startDate, end_date: endDate, include_peers: true }),
        leaveAPI.getLeaveRequests({ start_date: startDate, end_date: endDate, status: 'APPROVED' }),
        workFromHomeAPI.getWFHRequests({ status: 'APPROVED' }) // WFH API might not support date range in this specific method yet, but we'll filter it
      ]);

      const attendance = attendanceRes.data.results || attendanceRes.data || [];
      const leaves = leaveRes.data.results || leaveRes.data || [];
      const wfh = wfhRes.data.results || wfhRes.data || [];

      setCalendarData({
        attendance: Array.isArray(attendance) ? attendance : [],
        leaves: Array.isArray(leaves) ? leaves : [],
        wfh: Array.isArray(wfh) ? wfh : []
      });
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to update calendar data');
    } finally {
      setCalendarLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => {
      const dayDate = new Date(year, month, i + 1);
      return {
        day: i + 1,
        weekday: dayDate.toLocaleDateString('default', { weekday: 'short' })[0] // M, T, W...
      };
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(calendarDate.getMonth() + direction);
    setCalendarDate(newDate);
  };

  const getStatusForDate = (employeeId, day) => {
    if (!calendarData.attendance) return null;

    const currentYear = calendarDate.getFullYear();
    const currentMonth = calendarDate.getMonth();
    const dateObj = new Date(currentYear, currentMonth, day);
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const empIdStr = String(employeeId);

    // 1. Check Leave (High priority)
    const isOnLeave = calendarData.leaves?.some(l => {
      const start = (typeof l.start_date === 'string' ? l.start_date : String(l.start_date || '')).split('T')[0];
      const end = (typeof l.end_date === 'string' ? l.end_date : String(l.end_date || '')).split('T')[0];
      const empId = l.employee?.id || l.employee;
      return String(empId) === empIdStr && dateStr >= start && dateStr <= end;
    });
    if (isOnLeave) return 'LEAVE';

    // 2. Check Week Off (Saturday/Sunday)
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'WEEKOFF';

    // 3. Check Attendance
    const record = calendarData.attendance?.find(a => {
      const empId = a.employee?.id || a.employee_id || a.employee;
      return String(empId) === empIdStr && a.date === dateStr;
    });

    if (record) {
      // Map all possible backend statuses
      const s = record.status?.toUpperCase();
      if (s === 'LATE') return 'LATE';
      if (s === 'ABSENT') return 'ABSENT';
      if (s === 'HALF_DAY') return 'HALF_DAY';
      return 'PRESENT';
    }

    // 4. Check WFH
    const isWFH = calendarData.wfh?.some(w => {
      const date = (typeof w.request_date === 'string' ? w.request_date : String(w.request_date || '')).split('T')[0];
      const empId = w.employee?.id || w.employee;
      return String(empId) === empIdStr && date === dateStr;
    });
    if (isWFH) return 'WFH';

    return null;
  };

  const fetchEmployeeProfileData = async () => {
    try {
      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const response = await fetch(`${apiBase}/employees/profile-data/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const currentEmployee = data.employee;
        setEmployee(currentEmployee);
        // For employees, peers are colleagues (same manager), not direct reports
        // But for display purposes, we can show peers or empty array if they don't manage anyone
        const teamData = data.peers || [];
        setTeam(teamData);
        setManager(data.manager);

        // Fetch attendance after team data is loaded
        if (teamData.length > 0 || currentEmployee) {
          await fetchTeamAttendanceData(teamData, currentEmployee);
        }
      }
    } catch (error) {
      console.error('Error fetching employee profile data:', error);
      toast.error('Failed to load employee data');
    }
  };

  const fetchManagerData = async () => {
    try {
      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const response = await fetch(`${apiBase}/employees/managers/profile-data/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const currentEmployee = data.employee;
        setEmployee(currentEmployee);
        // For managers, peers are direct reports (team members)
        const teamData = data.peers || [];
        setTeam(teamData);
        setManager(data.manager);

        // Fetch attendance after team data is loaded
        if (teamData.length > 0 || currentEmployee) {
          await fetchTeamAttendanceData(teamData, currentEmployee);
        }
      }
    } catch (error) {
      console.error('Error fetching manager data:', error);
      toast.error('Failed to load manager data');
    }
  };

  const fetchAllManagersWithTeams = async () => {
    try {
      // For HR Manager, we still need to show their own team
      // fetchEmployeeProfileData will handle fetching attendance data
      await fetchEmployeeProfileData();

      // Optionally fetch all managers for HR view
      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const response = await fetch(`${apiBase}/employees/managers-with-teams/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // HR Manager can see all managers, but for "My Team" we show their direct team
        // The data structure may vary, so we keep using employee profile data
      }
    } catch (error) {
      console.error('Error fetching managers with teams:', error);
      // Don't show error for HR Manager, just use employee profile data
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const handleViewEmployees = (categoryKey) => {
    setSelectedCategory(categoryKey);
  };

  const closePanel = () => {
    setSelectedCategory(null);
    setSearchTerm('');
  };

  // Filter team members by category for the modal
  const getFilteredTeamMembers = () => {
    let members = [];
    switch (selectedCategory) {
      case 'on_time':
        members = attendanceStats.onTime;
        break;
      case 'late':
        members = attendanceStats.late;
        break;
      case 'wfh':
        members = attendanceStats.workFromHome;
        break;
      case 'remote':
        members = attendanceStats.remoteLogin;
        break;
      default:
        members = [];
    }

    if (!searchTerm) return members;
    const search = searchTerm.toLowerCase();
    return members.filter(member => {
      const name = (member.user_info?.full_name || `${member.user_info?.first_name || ''} ${member.user_info?.last_name || ''}`).toLowerCase();
      const empId = (member.employee_id || '').toLowerCase();
      const dept = (member.department?.name || '').toLowerCase();
      const pos = (member.position || '').toLowerCase();
      return name.includes(search) || empId.includes(search) || dept.includes(search) || pos.includes(search);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(99,102,241,0.2)]"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-bold tracking-wide animate-pulse uppercase text-xs">Loading team data...</p>
        </div>
      </div>
    );
  }

  const teamSize = team.length || 0;
  const userRole = profile?.profile?.role;

  return (
    <div className="min-h-screen bg-[#070B14] py-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Title Section */}
        <div className="pl-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">My Team</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-3xl leading-relaxed">
            {userRole === 'MANAGER'
              ? `Overview of your team's attendance today and calendar. You have ${teamSize} team ${teamSize === 1 ? 'member' : 'members'}.`
              : userRole === 'EMPLOYEE' || userRole === 'IT_SUPPORTER' || userRole === 'ADMIN'
                ? teamSize > 0
                  ? `You have ${teamSize} colleague${teamSize === 1 ? '' : 's'} on your team.`
                  : 'You don\'t have any team members assigned.'
                : `Overview of your team's attendance today and calendar.`
            }
          </p>
        </div>

        {/* Top row: who is off / not arrived */}
        {teamSize > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-black/10 dark:border-white/10 p-6 shadow-xl group hover:bg-black/10 dark:bg-white/10 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-24 w-24 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all duration-500 -mr-12 -mt-12"></div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center">
                  <div className="w-1.5 h-6 bg-rose-500 rounded-full mr-3"></div>
                  Who is off today
                </div>
                {attendanceStats.onLeave.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attendanceStats.onLeave.map(member => (
                      <div key={member.id} className="flex items-center space-x-3 p-2 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 group-hover:border-black/20 dark:border-white/20 transition-all">
                        <div className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-400 font-bold text-[10px] border border-rose-500/20">
                          {getInitials(member.user_info?.first_name, member.user_info?.last_name)}
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {member.user_info?.full_name || `${member.user_info?.first_name || ''} ${member.user_info?.last_name || ''}`.trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                    <p className="text-xs text-slate-500 font-bold italic opacity-60">No team members are on leave today.</p>
                  </div>
                )}
              </div>

              <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-black/10 dark:border-white/10 p-6 shadow-xl group hover:bg-black/10 dark:bg-white/10 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500 -mr-12 -mt-12"></div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center">
                  <div className="w-1.5 h-6 bg-amber-500 rounded-full mr-3"></div>
                  Not yet arrived today
                </div>
                {(() => {
                  const checkedInIds = new Set([
                    ...attendanceStats.onTime.map(m => String(m.id)),
                    ...attendanceStats.late.map(m => String(m.id)),
                    ...attendanceStats.workFromHome.map(m => String(m.id)),
                    ...attendanceStats.remoteLogin.map(m => String(m.id))
                  ]);

                  const notArrived = team.filter(member => {
                    const memberIdStr = String(member.id);
                    const isCheckedIn = checkedInIds.has(memberIdStr);
                    const isOnLeave = attendanceStats.onLeave.some(m => String(m.id) === memberIdStr);
                    return !isCheckedIn && !isOnLeave;
                  });

                  return notArrived.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {notArrived.map(member => (
                        <div key={member.id} className="flex items-center space-x-3 p-2 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 group-hover:border-black/20 dark:border-white/20 transition-all">
                          <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400 font-bold text-[10px] border border-amber-500/20">
                            {getInitials(member.user_info?.first_name, member.user_info?.last_name)}
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {member.user_info?.full_name || `${member.user_info?.first_name || ''} ${member.user_info?.last_name || ''}`.trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                      <p className="text-xs text-slate-500 font-bold italic opacity-60 uppercase tracking-widest">Everyone has checked in</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-black/10 dark:border-white/10 p-6 shadow-xl flex items-center justify-between group hover:bg-black/10 dark:bg-white/10 transition-all duration-300">
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">On Time</div>
                  <div className="text-4xl font-black text-emerald-400 tracking-tight group-hover:scale-110 transition-transform origin-left">{attendanceStats.onTime.length}</div>
                </div>
                {attendanceStats.onTime.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleViewEmployees('on_time')}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-500/20 active:scale-95 shadow-lg"
                  >
                    View List
                  </button>
                )}
              </div>

              <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-black/10 dark:border-white/10 p-6 shadow-xl flex items-center justify-between group hover:bg-black/10 dark:bg-white/10 transition-all duration-300">
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Late Arrival</div>
                  <div className="text-4xl font-black text-rose-500 tracking-tight group-hover:scale-110 transition-transform origin-left">{attendanceStats.late.length}</div>
                </div>
                {attendanceStats.late.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleViewEmployees('late')}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-400 text-[10px] font-black uppercase tracking-widest transition-all border border-rose-500/20 active:scale-95 shadow-lg"
                  >
                    View List
                  </button>
                )}
              </div>

              <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-black/10 dark:border-white/10 p-6 shadow-xl flex items-center justify-between group hover:bg-black/10 dark:bg-white/10 transition-all duration-300">
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Work from Home</div>
                  <div className="text-4xl font-black text-indigo-400 tracking-tight group-hover:scale-110 transition-transform origin-left">{attendanceStats.workFromHome.length}</div>
                </div>
                {attendanceStats.workFromHome.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleViewEmployees('wfh')}
                    className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg text-indigo-400 text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-500/20 active:scale-95 shadow-lg"
                  >
                    View List
                  </button>
                )}
              </div>

              <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-black/10 dark:border-white/10 p-6 shadow-xl flex items-center justify-between group hover:bg-black/10 dark:bg-white/10 transition-all duration-300">
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Remote Login</div>
                  <div className="text-4xl font-black text-purple-400 tracking-tight group-hover:scale-110 transition-transform origin-left">{attendanceStats.remoteLogin.length}</div>
                </div>
                {attendanceStats.remoteLogin.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleViewEmployees('remote')}
                    className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg text-purple-400 text-[10px] font-black uppercase tracking-widest transition-all border border-purple-500/20 active:scale-95 shadow-lg"
                  >
                    View List
                  </button>
                )}
              </div>
            </div>

            {/* Team calendar */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between pl-1">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center">
                  <div className="w-2 h-8 bg-indigo-500 rounded-full mr-4"></div>
                  Team calendar
                </h2>
              </div>

              <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-black/10 dark:border-white/10 overflow-hidden shadow-2xl">
                <div className="px-8 py-6 flex items-center justify-between border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-black/10 dark:bg-white/10 hover:text-slate-900 dark:text-white transition-all shadow-lg active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="text-2xl font-black text-slate-900 dark:text-white tracking-widest uppercase italic">
                    {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </div>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-black/10 dark:bg-white/10 hover:text-slate-900 dark:text-white transition-all shadow-lg active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                {calendarLoading ? (
                  <div className="text-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10">
                          <th className="sticky left-0 bg-[#0d1420] px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-r border-black/10 dark:border-white/10 min-w-[220px] z-10 shadow-[4px_0_10px_rgba(0,0,0,0.3)]">
                            Employee
                          </th>
                          {getDaysInMonth(calendarDate).map(({ day, weekday }) => (
                            <th key={day} className="px-1.5 py-2.5 text-center min-w-[36px] border-r border-black/5 dark:border-white/5 last:border-r-0">
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">{weekday}</span>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-200">{day}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {team.map(member => (
                          <tr key={member.id} className="hover:bg-black/5 dark:bg-white/5 transition-colors group">
                            <td className="sticky left-0 bg-[#0d1420] px-6 py-4 border-r border-black/10 dark:border-white/10 z-10 shadow-[4px_0_10px_rgba(0,0,0,0.3)]">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-900 dark:text-white shadow-lg ring-1 ring-white/20 group-hover:scale-110 transition-transform">
                                  {getInitials(member.user_info?.first_name, member.user_info?.last_name)}
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px] group-hover:text-slate-900 dark:text-white transition-colors">
                                  {member.user_info?.full_name || member.user_info?.first_name}
                                </span>
                              </div>
                            </td>
                            {getDaysInMonth(calendarDate).map(({ day }) => {
                              const status = getStatusForDate(member.id, day);
                              return (
                                <td key={day} className="px-1 py-2.5 text-center border-r border-black/5 dark:border-white/5 last:border-r-0">
                                  <div className={`w-6 h-6 mx-auto rounded-md flex items-center justify-center text-[8px] font-black transition-all duration-300 shadow-md transform hover:scale-125 hover:z-20 relative
                                ${status === 'PRESENT' ? 'bg-emerald-500 text-slate-900 dark:text-white ring-2 ring-emerald-500/50 shadow-emerald-500/20' :
                                      status === 'WFH' ? 'bg-indigo-500 text-slate-900 dark:text-white ring-2 ring-indigo-500/50 shadow-indigo-500/20' :
                                        status === 'LEAVE' ? 'bg-amber-500 text-slate-900 dark:text-white ring-2 ring-amber-500/50 shadow-amber-500/20' :
                                          status === 'ABSENT' ? 'bg-rose-500 text-slate-900 dark:text-white ring-2 ring-rose-500/50 shadow-rose-500/20' :
                                            status === 'HALF_DAY' ? 'bg-rose-500/50 text-slate-900 dark:text-white ring-2 ring-rose-500/30' :
                                              status === 'WEEKOFF' ? 'bg-slate-200 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 opacity-40 shadow-none' :
                                                'bg-black/5 dark:bg-white/5 text-slate-600 border border-black/5 dark:border-white/5 opacity-20 shadow-none'}
                              `}>
                                    {status === 'PRESENT' ? 'P' :
                                      status === 'WFH' ? 'W' :
                                        status === 'LEAVE' ? 'L' :
                                          status === 'ABSENT' ? 'A' :
                                            status === 'HALF_DAY' ? 'H' :
                                              status === 'WEEKOFF' ? '•' : ''}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="px-8 py-5 bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10 flex flex-wrap gap-x-10 gap-y-4 items-center">
                  <div className="flex items-center space-x-3 group">
                    <div className="w-5 h-5 bg-emerald-500 ring-2 ring-emerald-500/50 rounded-md flex items-center justify-center text-[8px] font-black text-slate-900 dark:text-white group-hover:scale-125 transition-transform">P</div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Present</span>
                  </div>
                  <div className="flex items-center space-x-3 group">
                    <div className="w-5 h-5 bg-indigo-500 ring-2 ring-indigo-500/50 rounded-md flex items-center justify-center text-[8px] font-black text-slate-900 dark:text-white group-hover:scale-125 transition-transform">W</div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">WFH</span>
                  </div>
                  <div className="flex items-center space-x-3 group">
                    <div className="w-5 h-5 bg-amber-500 ring-2 ring-amber-500/50 rounded-md flex items-center justify-center text-[8px] font-black text-slate-900 dark:text-white group-hover:scale-125 transition-transform">L</div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Leave</span>
                  </div>
                  <div className="flex items-center space-x-3 group">
                    <div className="w-5 h-5 bg-rose-500 ring-2 ring-rose-500/50 rounded-md flex items-center justify-center text-[8px] font-black text-slate-900 dark:text-white group-hover:scale-125 transition-transform">A</div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Absent</span>
                  </div>
                  <div className="flex items-center space-x-3 group">
                    <div className="w-5 h-5 bg-rose-500/50 ring-2 ring-rose-500/30 rounded-md flex items-center justify-center text-[8px] font-black text-slate-900 dark:text-white group-hover:scale-125 transition-transform">H</div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Half Day</span>
                  </div>
                  <div className="flex items-center space-x-3 group">
                    <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700/50 border border-black/10 dark:border-white/10 rounded-md flex items-center justify-center text-[8px] font-black text-slate-500 dark:text-slate-400 group-hover:scale-125 transition-transform">•</div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Week Off</span>
                  </div>
                  <div className="flex items-center space-x-3 group">
                    <div className="w-5 h-5 border border-black/5 dark:border-white/5 rounded-md opacity-20"></div>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">No Data</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Team Members List */}
        {teamSize > 0 && (
          <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-black/10 dark:border-white/10 p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-30 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 space-y-6 md:space-y-0 relative z-10">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center">
                <UserGroupIcon className="h-10 w-10 text-indigo-500 mr-4" />
                {userRole === 'MANAGER' ? 'Direct Reports' : 'Team Members'}
                <span className="ml-4 px-3 py-1 bg-black/10 dark:bg-white/10 rounded-xl text-sm font-black text-indigo-400 border border-black/10 dark:border-white/10">{teamSize}</span>
              </h2>
              <div className="relative w-full md:w-80">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search team..."
                  value={teamSearchTerm}
                  onChange={(e) => setTeamSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border border-black/10 dark:border-white/10 rounded-[1.25rem] leading-5 bg-black/5 dark:bg-white/5 placeholder-slate-500 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 text-sm transition-all shadow-inner"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {team.filter(member => {
                if (!teamSearchTerm) return true;
                const search = teamSearchTerm.toLowerCase();
                return (
                  (member.user_info?.full_name || '').toLowerCase().includes(search) ||
                  (member.employee_id || '').toLowerCase().includes(search) ||
                  (member.department?.name || '').toLowerCase().includes(search) ||
                  (member.position || '').toLowerCase().includes(search)
                );
              }).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center space-x-5 p-6 bg-black/5 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 hover:bg-black/10 dark:bg-white/10 hover:border-black/20 dark:border-white/20 hover:scale-[1.02] transform transition-all duration-300 group shadow-lg"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white text-xl font-black shadow-2xl flex-shrink-0 ring-4 ring-white/5 group-hover:rotate-6 transition-transform">
                    {getInitials(member.user_info?.first_name, member.user_info?.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white truncate tracking-tight group-hover:text-indigo-400 transition-colors">
                      {member.user_info?.full_name || `${member.user_info?.first_name || ''} ${member.user_info?.last_name || ''}`.trim()}
                    </h4>
                    <div className="flex flex-col mt-1 space-y-0.5">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate uppercase tracking-widest">{member.position || 'Position not specified'}</p>
                      <p className="text-[10px] font-black text-slate-500 truncate uppercase tracking-[0.2em]">{member.employee_id}</p>
                      <p className="text-[11px] text-indigo-400/70 truncate mt-1 italic">{member.user_info?.email}</p>
                    </div>
                    {member.department && (
                      <div className="mt-3 inline-block px-2 py-0.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {member.department.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {team.filter(member => {
              if (!teamSearchTerm) return true;
              const search = teamSearchTerm.toLowerCase();
              return (
                (member.user_info?.full_name || '').toLowerCase().includes(search) ||
                (member.employee_id || '').toLowerCase().includes(search) ||
                (member.department?.name || '').toLowerCase().includes(search) ||
                (member.position || '').toLowerCase().includes(search)
              );
            }).length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-slate-500 font-bold italic opacity-60">No team members found matching your search.</p>
                </div>
              )}
          </div>
        )}

        {teamSize === 0 && (
          <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-[3rem] border border-black/10 dark:border-white/10 p-24 shadow-2xl text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all duration-700 group-hover:bg-indigo-500/10"></div>
            <UserGroupIcon className="w-24 h-24 text-slate-900 dark:text-white/5 mx-auto mb-8 animate-pulse" />
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">No team members found</p>
            <p className="text-lg text-slate-500 dark:text-slate-400 mt-4 max-w-md mx-auto leading-relaxed">
              {userRole === 'MANAGER'
                ? 'You don\'t have any direct reports assigned to you.'
                : 'You don\'t have any team members assigned.'}
            </p>
          </div>
        )}

        {/* Side Panel for viewing employees by category */}
        {selectedCategory && (
          <div className="fixed inset-0 z-[150] flex justify-end">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
              onClick={closePanel}
            ></div>

            <div className="relative bg-[#070B14] w-full max-w-[95%] md:max-w-6xl h-full shadow-2xl border-l border-black/10 dark:border-white/10 flex flex-col animate-slide-in-right">
              <div className="px-8 py-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5 backdrop-blur-xl">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    View Employees
                  </h3>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedCategory.replace('_', ' ')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closePanel}
                  className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-black/10 dark:bg-white/10 transition-all shadow-lg active:scale-95"
                >
                  <XMarkIcon className="w-7 h-7" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-8 pb-0">
                  <div className="mb-8 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name, ID, or department"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3 border border-black/10 dark:border-white/10 rounded-2xl leading-5 bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 text-sm transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar px-4 pb-6">
                  <div className="bg-black/5 dark:bg-white/5 rounded-[2rem] border border-black/10 dark:border-white/10 overflow-hidden shadow-2xl">
                    {(selectedCategory === 'late' || selectedCategory === 'on_time') ? (
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full table-fixed border-collapse">
                          <thead>
                            <tr className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 text-left">
                              <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sticky left-0 bg-[#0d1420] z-20 border-r border-black/10 dark:border-white/10 min-w-[160px]">Employee</th>
                              <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-r border-black/5 dark:border-white/5 min-w-[105px]">Department</th>
                              <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-r border-black/5 dark:border-white/5 min-w-[115px]">Team</th>
                              <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-r border-black/5 dark:border-white/5 min-w-[85px]">Location</th>
                              <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-r border-black/5 dark:border-white/5 min-w-[115px]">Job</th>
                              <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center border-r border-black/5 dark:border-white/5 min-w-[95px]">Clock</th>
                              <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center border-r border-black/5 dark:border-white/5 min-w-[135px]">Shift</th>
                              <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center min-w-[75px]">Delay</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {getFilteredTeamMembers().map((member) => {
                              const record = member.attendanceRecord;
                              const isOnTime = selectedCategory === 'on_time';
                              let delayStr = isOnTime ? 'On time' : "0h 0m 0s";

                              if (!isOnTime && record?.check_in_time) {
                                const [h, m, s] = record.check_in_time.split(':').map(Number);
                                const checkInSec = h * 3600 + m * 60 + s;
                                const thresholdSec = 10 * 3600; // 10:00 AM
                                if (checkInSec > thresholdSec) {
                                  const diff = checkInSec - thresholdSec;
                                  const dh = Math.floor(diff / 3600);
                                  const dm = Math.floor((diff % 3600) / 60);
                                  const ds = diff % 60;
                                  delayStr = `${dh}h ${dm}m ${ds}s`;
                                }
                              }

                              return (
                                <tr key={member.id} className="hover:bg-black/5 dark:bg-white/5 transition-colors group">
                                  <td className="px-3 py-3 sticky left-0 bg-[#0d1420] z-10 border-r border-black/10 dark:border-white/10">
                                    <div className="flex flex-col">
                                      <span className="text-[12px] font-black text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors tracking-tight truncate">{member.user_info?.full_name}</span>
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{member.employee_id}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-[11px] text-slate-700 dark:text-slate-300 font-bold border-r border-black/5 dark:border-white/5 italic truncate">
                                    {member.department?.name || 'N/A'}
                                  </td>
                                  <td className="px-3 py-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium border-r border-black/5 dark:border-white/5 truncate">
                                    {member.manager?.user_info?.full_name || 'Individual'}
                                  </td>
                                  <td className="px-3 py-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium border-r border-black/5 dark:border-white/5 truncate">
                                    {member.location || 'Hyderabad'}
                                  </td>
                                  <td className="px-3 py-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium border-r border-black/5 dark:border-white/5 italic truncate">
                                    {member.position || 'Software Developer'}
                                  </td>
                                  <td className="px-3 py-3 text-[11px] text-emerald-400 font-black text-center border-r border-black/5 dark:border-white/5">
                                    {record?.check_in_time ? formatTime(record.check_in_time) : 'N/A'}
                                  </td>
                                  <td className="px-3 py-3 text-center border-r border-black/5 dark:border-white/5">
                                    <div className="flex flex-col items-center">
                                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 tracking-widest">10AM-7PM</span>
                                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">(10-7)</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-[11px] text-rose-500 font-black text-center">
                                    {delayStr}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                        {getFilteredTeamMembers().map((member) => (
                          <div key={member.id} className="flex items-center space-x-5 p-6 bg-black/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 hover:bg-black/10 dark:bg-white/10 hover:border-black/20 dark:border-white/20 transition-all group shadow-xl">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white text-lg font-black shadow-lg group-hover:rotate-6 transition-transform">
                              {getInitials(member.user_info?.first_name, member.user_info?.last_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-black text-slate-900 dark:text-white truncate tracking-tight group-hover:text-indigo-400 transition-colors">
                                {member.user_info?.full_name}
                              </p>
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate">{member.position || 'Position not specified'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {getFilteredTeamMembers().length === 0 && (
                      <p className="text-sm text-slate-500 font-bold italic opacity-60 text-center py-16 uppercase tracking-widest">No employees found.</p>
                    )}
                  </div>
                </div>

                <div className="px-3 py-2 bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10 flex justify-between items-center mt-auto backdrop-blur-xl">
                  <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Showing 1 to {getFilteredTeamMembers().length} of {getFilteredTeamMembers().length} employees
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-2">
                      <button className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 hover:text-slate-900 dark:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent" disabled>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white bg-indigo-500/80 px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/20 border border-black/10 dark:border-white/10 flex items-center">PAGE 1 OF 1</span>
                      <button className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 hover:text-slate-900 dark:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent" disabled>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeam;
