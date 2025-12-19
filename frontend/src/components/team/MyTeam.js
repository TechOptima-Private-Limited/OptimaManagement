import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import { UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { attendanceAPI } from '../../services/api';

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

  useEffect(() => {
    fetchTeamData();
  }, []);

  // Helper to convert date to YYYY-MM-DD format
  const toLocalDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
        if (userRole === 'HR_MANAGER') {
          await fetchAllManagersWithTeams();
        } else if (userRole === 'MANAGER') {
          await fetchManagerData();
        } else {
          // For EMPLOYEE, IT_SUPPORTER, ADMIN, and others
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

  const fetchTeamAttendanceData = async (teamMembers = null) => {
    try {
      const today = toLocalDate(new Date());

      // Use provided team members or fall back to state
      const membersToProcess = teamMembers || team;

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
        end_date: today
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
        const memberName = member.user_info?.full_name || `${member.user_info?.first_name || ''} ${member.user_info?.last_name || ''}`.trim();

        // Try multiple ways to match attendance record
        const attendanceRecord = teamAttendanceRecords.find(ar => {
          const arEmployeeId = ar.employee?.id || ar.employee_id || ar.employee;
          return arEmployeeId && String(arEmployeeId) === memberIdStr;
        });


        const hasWFH = approvedWFH.some(wfh => {
          const wfhEmployeeId = wfh.employee?.id || wfh.employee;
          return wfhEmployeeId && String(wfhEmployeeId) === memberIdStr;
        });

        // Check if employee has approved leave for today
        const hasLeave = approvedLeaves.some(leave => {
          const leaveEmployeeId = leave.employee?.id || leave.employee;
          return leaveEmployeeId && String(leaveEmployeeId) === memberIdStr;
        });

        // If employee has approved leave, add to onLeave and skip other checks
        if (hasLeave) {
          onLeave.push(member);
          return;
        }

        // Check if they have checked in (has check_in_time)
        const hasCheckedIn = attendanceRecord && attendanceRecord.check_in_time;

        if (hasWFH && hasCheckedIn) {
          // Work from home and checked in - count as checked in and show in WFH category
          workFromHome.push(member);
          remoteLogin.push(member); // WFH is also considered remote login
        } else if (hasWFH) {
          // Work from home but not checked in yet
          workFromHome.push(member);
        } else if (hasCheckedIn) {
          // Checked in - determine if remote or office
          // Check for remote indicators: notes mentioning remote/WFH
          const notes = (attendanceRecord.notes || '').toLowerCase();
          const isRemoteNote = notes.includes('remote') || notes.includes('wfh') || notes.includes('work from home');
          const isOfficeNote = notes.includes('office');

          // Consider it remote if notes indicate remote/WFH (and not explicitly office)
          // If notes say "Office", it's definitely office check-in
          const isRemoteLogin = isRemoteNote && !isOfficeNote;

          if (isRemoteLogin) {
            // Remote login - show in remote login category but still count as checked in
            remoteLogin.push(member);
          } else {
            // Office check-in - categorize by status
            if (attendanceRecord.status === 'LATE') {
              late.push(member);
            } else {
              // Default to ON TIME if status is PRESENT, null, undefined, or any other value
              onTime.push(member);
            }
          }
        }
        // Note: "onLeave" would require leave management integration
        // For now, we'll check if status is ABSENT without check-in
        if (attendanceRecord && attendanceRecord.status === 'ABSENT' && !attendanceRecord.check_in_time) {
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
        setEmployee(data.employee);
        // For employees, peers are colleagues (same manager), not direct reports
        // But for display purposes, we can show peers or empty array if they don't manage anyone
        const teamData = data.peers || [];
        setTeam(teamData);
        setManager(data.manager);

        // Fetch attendance after team data is loaded
        if (teamData.length > 0) {
          await fetchTeamAttendanceData(teamData);
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
        setEmployee(data.employee);
        // For managers, peers are direct reports (team members)
        const teamData = data.peers || [];
        setTeam(teamData);
        setManager(data.manager);

        // Fetch attendance after team data is loaded
        if (teamData.length > 0) {
          await fetchTeamAttendanceData(teamData);
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

  const closePanel = () => setSelectedCategory(null);

  // Filter team members by category for the modal
  const getFilteredTeamMembers = () => {
    switch (selectedCategory) {
      case 'on_time':
        return attendanceStats.onTime;
      case 'late':
        return attendanceStats.late;
      case 'wfh':
        return attendanceStats.workFromHome;
      case 'remote':
        return attendanceStats.remoteLogin;
      default:
        return [];
    }
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

      {/* Team Members List */}
      {teamSize > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {userRole === 'MANAGER' ? 'Direct Reports' : 'Team Members'} ({teamSize})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.map((member) => (
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
                // Include all checked-in categories: onTime, late, workFromHome, and remoteLogin
                const checkedInIds = new Set([
                  ...attendanceStats.onTime.map(m => m.id),
                  ...attendanceStats.late.map(m => m.id),
                  ...attendanceStats.workFromHome.map(m => m.id),
                  ...attendanceStats.remoteLogin.map(m => m.id)
                ]);
                const notArrived = team.filter(member => !checkedInIds.has(member.id) && !attendanceStats.onLeave.find(m => m.id === member.id));

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
                <button className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100">
                  ‹
                </button>
                <div className="text-sm font-semibold text-gray-800">This Month</div>
                <button className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100">
                  ›
                </button>
              </div>

              <div className="px-4 py-2 text-[11px] text-gray-500 grid grid-cols-[220px_minmax(0,1fr)] gap-4 border-b border-gray-100">
                <div />
                <div className="flex justify-between">
                  {[]}
                </div>
              </div>

              <div className="px-4 pb-4 space-y-2 overflow-x-auto">
                {/* Team rows will be rendered here once wired to real calendar data */}
                <div className="text-center py-8 text-gray-400 text-sm">
                  Calendar view coming soon
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal for viewing employees by category */}
      {selectedCategory && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center bg-black/30">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md mx-2 mb-2 sm:mx-0 sm:mb-0 border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">
                {selectedCategory === 'on_time' && 'On time employees'}
                {selectedCategory === 'late' && 'Late arrivals'}
                {selectedCategory === 'wfh' && 'Work from home employees'}
                {selectedCategory === 'remote' && 'Remote login employees'}
              </h3>
              <button
                type="button"
                onClick={closePanel}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-4 max-h-96 overflow-y-auto">
              {getFilteredTeamMembers().length > 0 ? (
                <div className="space-y-2">
                  {getFilteredTeamMembers().map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(member.user_info?.first_name, member.user_info?.last_name)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {member.user_info?.full_name || `${member.user_info?.first_name || ''} ${member.user_info?.last_name || ''}`.trim()}
                        </p>
                        <p className="text-xs text-gray-500">{member.position || 'Position not specified'}</p>
                        <p className="text-xs text-gray-400">{member.user_info?.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No employees found in this category.
                </p>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={closePanel}
                className="px-4 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTeam;
