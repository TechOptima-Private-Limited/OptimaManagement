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
      const profileResponse = await fetch('http://127.0.0.1:8000/api/auth/profile/', {
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
        const wfhResponse = await fetch('http://127.0.0.1:8000/api/attendance/wfh/requests/', {
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
        const leaveResponse = await fetch('http://127.0.0.1:8000/api/leave/requests/', {
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

        const hasCheckedIn = !!(attendanceRecord && attendanceRecord.check_in_time);

        // Determine lateness
        let isLate = false;
        if (hasCheckedIn) {
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
      return String(empId) === empIdStr && (a.date === dateStr || (a.check_in_time && a.check_in_time.startsWith(dateStr)));
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
      const response = await fetch('http://127.0.0.1:8000/api/employees/profile-data/', {
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
      const response = await fetch('http://127.0.0.1:8000/api/employees/managers/profile-data/', {
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
      const response = await fetch('http://127.0.0.1:8000/api/employees/managers-with-teams/', {
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
      <div className="p-6 flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const teamSize = team.length || 0;
  const userRole = profile?.profile?.role;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-full">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Team</h1>
        <p className="mt-1 text-sm text-gray-500">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-800 mb-2">Who is off today</div>
              {attendanceStats.onLeave.length > 0 ? (
                <div className="space-y-1">
                  {attendanceStats.onLeave.map(member => (
                    <p key={member.id} className="text-xs text-gray-600">
                      • {member.user_info?.full_name || `${member.user_info?.first_name || ''} ${member.user_info?.last_name || ''}`.trim()}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No team members are on leave today.</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-800 mb-2">Not yet arrived today</div>
              {(() => {
                // Include all checked-in categories for accurate exclusion
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
                  <div className="space-y-1">
                    {notArrived.map(member => (
                      <p key={member.id} className="text-xs text-gray-600">
                        • {member.user_info?.full_name || `${member.user_info?.first_name || ''} ${member.user_info?.last_name || ''}`.trim()}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Everyone has checked in.</p>
                );
              })()}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-gray-500">On time employees</div>
                <div className="mt-2 text-2xl font-bold text-emerald-600">{attendanceStats.onTime.length}</div>
              </div>
              {attendanceStats.onTime.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleViewEmployees('on_time')}
                  className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline"
                >
                  View employees
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-gray-500">Late arrivals</div>
                <div className="mt-2 text-2xl font-bold text-rose-600">{attendanceStats.late.length}</div>
              </div>
              {attendanceStats.late.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleViewEmployees('late')}
                  className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline"
                >
                  View employees
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-gray-500">Work from home</div>
                <div className="mt-2 text-2xl font-bold text-sky-600">{attendanceStats.workFromHome.length}</div>
              </div>
              {attendanceStats.workFromHome.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleViewEmployees('wfh')}
                  className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline"
                >
                  View employees
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-gray-500">Remote login</div>
                <div className="mt-2 text-2xl font-bold text-purple-600">{attendanceStats.remoteLogin.length}</div>
              </div>
              {attendanceStats.remoteLogin.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleViewEmployees('remote')}
                  className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline"
                >
                  View employees
                </button>
              )}
            </div>
          </div>

          {/* Team calendar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Team calendar</h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-4 py-2 flex items-center justify-between border-b border-gray-200 bg-gray-50">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  ‹
                </button>
                <div className="text-sm font-semibold text-gray-800">
                  {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <button
                  onClick={() => navigateMonth(1)}
                  className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  ›
                </button>
              </div>

              {calendarLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="sticky left-0 bg-gray-50 px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-100 min-w-[200px] z-10">
                          Employee
                        </th>
                        {getDaysInMonth(calendarDate).map(({ day, weekday }) => (
                          <th key={day} className="px-2 py-2 text-center min-w-[36px]">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-gray-400 font-medium uppercase">{weekday}</span>
                              <span className="text-xs font-bold text-gray-600">{day}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {team.map(member => (
                        <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="sticky left-0 bg-white px-4 py-2 border-r border-gray-100 z-10">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600">
                                {getInitials(member.user_info?.first_name, member.user_info?.last_name)}
                              </div>
                              <span className="text-xs font-medium text-gray-700 truncate max-w-[140px]">
                                {member.user_info?.full_name || member.user_info?.first_name}
                              </span>
                            </div>
                          </td>
                          {getDaysInMonth(calendarDate).map(({ day }) => {
                            const status = getStatusForDate(member.id, day);
                            return (
                              <td key={day} className="px-1 py-2 text-center">
                                <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-200
                                  ${status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' :
                                    status === 'WFH' ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200' :
                                      status === 'LEAVE' ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-200' :
                                        status === 'ABSENT' ? 'bg-red-100 text-red-700 ring-1 ring-red-200' :
                                          status === 'HALF_DAY' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' :
                                            status === 'WEEKOFF' ? 'bg-gray-100 text-gray-500 ring-1 ring-gray-200' :
                                              'bg-gray-50 text-gray-300'}
                                `}>
                                  {status === 'PRESENT' ? 'P' :
                                    status === 'WFH' ? 'W' :
                                      status === 'LEAVE' ? 'L' :
                                        status === 'ABSENT' ? 'A' :
                                          status === 'HALF_DAY' ? 'H' :
                                            status === 'WEEKOFF' ? 'WO' : ''}
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

              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-x-6 gap-y-2 items-center">
                <div className="flex items-center space-x-1.5">
                  <div className="w-4 h-4 bg-emerald-100 ring-1 ring-emerald-200 rounded flex items-center justify-center text-[9px] font-bold text-emerald-700">P</div>
                  <span className="text-[10px] text-gray-500 font-medium">Present</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-4 h-4 bg-indigo-100 ring-1 ring-indigo-200 rounded flex items-center justify-center text-[9px] font-bold text-indigo-700">W</div>
                  <span className="text-[10px] text-gray-500 font-medium">WFH</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-4 h-4 bg-orange-100 ring-1 ring-orange-200 rounded flex items-center justify-center text-[9px] font-bold text-orange-700">L</div>
                  <span className="text-[10px] text-gray-500 font-medium">Leave (Vacation)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-4 h-4 bg-red-100 ring-1 ring-red-200 rounded flex items-center justify-center text-[9px] font-bold text-red-700">A</div>
                  <span className="text-[10px] text-gray-500 font-medium">Absent</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-4 h-4 bg-blue-100 ring-1 ring-blue-200 rounded flex items-center justify-center text-[9px] font-bold text-blue-700">H</div>
                  <span className="text-[10px] text-gray-500 font-medium">Half Day</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-4 h-4 bg-gray-100 ring-1 ring-gray-200 rounded flex items-center justify-center text-[9px] font-bold text-gray-500">WO</div>
                  <span className="text-[10px] text-gray-500 font-medium">Week Off</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-4 h-4 bg-gray-50 border border-gray-200 border-dashed rounded"></div>
                  <span className="text-[10px] text-gray-500 font-medium">No Data</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Team Members List */}
      {teamSize > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
            <h2 className="text-lg font-semibold text-gray-800">
              {userRole === 'MANAGER' ? 'Direct Reports' : 'Team Members'} ({teamSize})
            </h2>
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search team members..."
                value={teamSearchTerm}
                onChange={(e) => setTeamSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                  {getInitials(member.user_info?.first_name, member.user_info?.last_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {member.user_info?.full_name || `${member.user_info?.first_name || ''} ${member.user_info?.last_name || ''}`.trim()}
                  </h4>
                  <p className="text-xs text-gray-600 truncate">{member.position || 'Position not specified'}</p>
                  <p className="text-xs text-gray-500 truncate">ID: {member.employee_id}</p>
                  <p className="text-xs text-gray-500 truncate">{member.user_info?.email}</p>
                  {member.department && (
                    <p className="text-xs text-gray-500 truncate">{member.department.name}</p>
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
                <p className="text-gray-400 text-sm">No team members found matching your search.</p>
              </div>
            )}
        </div>
      )}

      {teamSize === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm text-center">
          <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No team members found</p>
          <p className="text-sm text-gray-400 mt-2">
            {userRole === 'MANAGER'
              ? 'You don\'t have any direct reports assigned to you.'
              : 'You don\'t have any team members assigned.'}
          </p>
        </div>
      )}

      {/* Side Panel for viewing employees by category */}
      {selectedCategory && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={closePanel}
          ></div>

          {/* Side Panel */}
          <div className="relative bg-[#0b121e] w-full max-w-[90%] md:max-w-6xl h-full shadow-2xl border-l border-gray-800 flex flex-col animate-slide-in-right">
            <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between bg-[#0b121e]">
              <h3 className="text-xl font-medium text-gray-200">
                View Employees
              </h3>
              <button
                type="button"
                onClick={closePanel}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-7 h-7" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 pb-0">
                <div className="mb-6 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, ID, or department"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-700/50 rounded-md leading-5 bg-[#161f2e] text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar px-6 pb-6">
                <div className="border border-gray-800 rounded-lg bg-[#161f2e] overflow-x-auto custom-scrollbar">
                  {selectedCategory === 'late' ? (
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full border-separate border-spacing-0">
                        <thead>
                          <tr className="bg-[#1c2636]">
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider sticky left-0 bg-[#1c2636] z-20 border-b border-gray-800 min-w-[220px]">Employee</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 min-w-[150px]">Department</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 min-w-[150px]">Team (Manager)</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 min-w-[120px]">Location</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 min-w-[150px]">Job Title</th>
                            <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 min-w-[120px]">Clock-in Time</th>
                            <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 min-w-[200px]">Assigned Shift</th>
                            <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 min-w-[100px]">Delay</th>
                          </tr>
                        </thead>
                        <tbody className="bg-[#0f172a] divide-y divide-gray-800">
                          {getFilteredTeamMembers().map((member) => {
                            const record = member.attendanceRecord;

                            // Calculate delay
                            let delayStr = "0h 0m 0s";
                            if (record?.check_in_time) {
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
                              <tr key={member.id} className="hover:bg-gray-800/20 transition-colors">
                                <td className="px-6 py-5 whitespace-nowrap sticky left-0 bg-[#161f2e] z-10 border-b border-gray-800/50 min-w-[220px]">
                                  <div className="flex flex-col">
                                    <span className="text-[13.5px] font-semibold text-pink-400/90">{member.user_info?.full_name}</span>
                                    <span className="text-[11px] text-gray-500 font-medium">{member.employee_id}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-[13px] text-gray-300 font-medium border-b border-gray-800/50">
                                  {member.department?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-[13px] text-gray-400 font-medium border-b border-gray-800/50">
                                  {member.manager?.user_info?.full_name || 'Individual'}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-[13px] text-gray-400 font-medium border-b border-gray-800/50">
                                  {member.location || 'Hyderabad'}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-[13px] text-gray-400 font-medium border-b border-gray-800/50">
                                  {member.position || 'Software Developer'}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-[13px] text-gray-200 font-bold text-center border-b border-gray-800/50">
                                  {record?.check_in_time ? formatTime(record.check_in_time) : 'N/A'}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-center border-b border-gray-800/50">
                                  <div className="flex flex-col items-center">
                                    <span className="text-[12px] font-bold text-gray-300">10AM - 7PM</span>
                                    <span className="text-[10px] text-gray-500 font-medium">(10:00 AM - 07:00 PM)</span>
                                  </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-[13px] text-gray-300 font-bold text-center border-b border-gray-800/50">
                                  {delayStr}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {getFilteredTeamMembers().length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-8">No late arrivals found.</p>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800/50">
                      {getFilteredTeamMembers().map((member) => (
                        <div key={member.id} className="flex items-center space-x-4 p-4 hover:bg-gray-800/20 transition-colors">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full flex items-center justify-center text-blue-400 text-sm font-bold border border-blue-500/20">
                            {getInitials(member.user_info?.first_name, member.user_info?.last_name)}
                          </div>
                          <div className="flex-1">
                            <p className="text-[14px] font-semibold text-gray-200">
                              {member.user_info?.full_name}
                            </p>
                            <p className="text-[12px] text-gray-500">{member.position || 'Position not specified'}</p>
                          </div>
                        </div>
                      ))}
                      {getFilteredTeamMembers().length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-12">No employees found.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-[#0b121e] border-t border-gray-800 flex justify-between items-center mt-auto">
                <div className="text-[12px] text-gray-500 font-medium">
                  1 to {getFilteredTeamMembers().length} of {getFilteredTeamMembers().length}
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <button className="p-1 text-gray-600 hover:text-gray-400 disabled:opacity-30" disabled>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="text-[12px] text-white bg-blue-600/80 px-2.5 py-1 rounded">Page 1 of 1</span>
                    <button className="p-1 text-gray-600 hover:text-gray-400 disabled:opacity-30" disabled>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTeam;
