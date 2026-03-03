import React, { useState, useEffect } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { attendanceAPI } from '../../services/api';
import { isHRManager } from '../../utils/auth';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const AttendanceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateData, setSelectedDateData] = useState(null);

  useEffect(() => {
    fetchMonthlyAttendance();
  }, [currentDate]);

  const fetchMonthlyAttendance = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const response = await attendanceAPI.getAttendanceRecords({
        start_date: startDate,
        end_date: endDate
      });

      const records = response.data.results || response.data;
      const attendanceMap = {};
      
      records.forEach(record => {
        const dateKey = record.date;
        if (!attendanceMap[dateKey]) {
          attendanceMap[dateKey] = [];
        }
        attendanceMap[dateKey].push(record);
      });

      setAttendanceData(attendanceMap);
    } catch (error) {
      toast.error('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDate(null);
    setSelectedDateData(null);
  };

  const getAttendanceForDate = (date) => {
    if (!date) return null;
    const dateKey = date.toISOString().split('T')[0];
    return attendanceData[dateKey] || [];
  };

  const getDateStatusColor = (date) => {
    const attendance = getAttendanceForDate(date);
    if (!attendance.length) return 'bg-gray-100 text-gray-400';
    
    const hasPresent = attendance.some(a => a.status === 'PRESENT');
    const hasLate = attendance.some(a => a.status === 'LATE');
    const hasAbsent = attendance.some(a => a.status === 'ABSENT');
    const hasHalfDay = attendance.some(a => a.status === 'HALF_DAY');
    
    if (hasPresent && !hasLate && !hasAbsent) return 'bg-green-100 text-green-800';
    if (hasLate) return 'bg-yellow-100 text-yellow-800';
    if (hasAbsent) return 'bg-red-100 text-red-800';
    if (hasHalfDay) return 'bg-blue-100 text-blue-800';
    
    return 'bg-gray-100 text-gray-400';
  };

  const handleDateClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedDateData(getAttendanceForDate(date));
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date) => {
    if (!date) return false;
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);

  if (loading) {
    return <LoadingSpinner text="Loading calendar..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Calendar</h1>
        <p className="mt-1 text-sm text-gray-600">
          {isHRManager() ? 'View attendance calendar for all employees' : 'View your attendance calendar'}
        </p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Calendar Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {dayNames.map((day) => (
              <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {days.map((date, index) => (
              <div
                key={index}
                className={`
                  min-h-[80px] bg-white p-2 cursor-pointer hover:bg-gray-50 transition-colors
                  ${date ? 'border-b border-gray-200' : ''}
                `}
                onClick={() => handleDateClick(date)}
              >
                {date && (
                  <div className="h-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`
                        text-sm font-medium
                        ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}
                        ${isWeekend(date) ? 'text-gray-400' : ''}
                      `}>
                        {date.getDate()}
                      </span>
                      {isToday(date) && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    
                    {/* Attendance indicators */}
                    <div className="space-y-1">
                      {getAttendanceForDate(date).slice(0, 2).map((attendance, idx) => (
                        <div
                          key={idx}
                          className={`
                            px-1 py-0.5 text-xs rounded-sm truncate
                            ${getDateStatusColor(date)}
                          `}
                        >
                          {isHRManager() ? (
                            `${attendance.employee?.user?.first_name} ${attendance.employee?.user?.last_name}`
                          ) : (
                            attendance.status
                          )}
                        </div>
                      ))}
                      {getAttendanceForDate(date).length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{getAttendanceForDate(date).length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Legend</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded-sm mr-2"></div>
              <span className="text-gray-600">Present</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-100 rounded-sm mr-2"></div>
              <span className="text-gray-600">Late</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-100 rounded-sm mr-2"></div>
              <span className="text-gray-600">Absent</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-100 rounded-sm mr-2"></div>
              <span className="text-gray-600">Half Day</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-100 rounded-sm mr-2"></div>
              <span className="text-gray-600">No Data</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {formatDate(selectedDate)}
              </h3>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedDateData(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {selectedDateData && selectedDateData.length > 0 ? (
              <div className="space-y-4">
                {selectedDateData.map((attendance, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    {isHRManager() && (
                      <div className="flex items-center mb-3">
                        <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-xs font-medium">
                            {attendance.employee?.user?.first_name?.[0]}{attendance.employee?.user?.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {attendance.employee?.user?.first_name} {attendance.employee?.user?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{attendance.employee?.employee_id}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Check In:</span>
                        <div className="font-medium">{attendance.check_in_time || 'Not recorded'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Check Out:</span>
                        <div className="font-medium">{attendance.check_out_time || 'Not recorded'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <div><StatusBadge status={attendance.status} /></div>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <div className="font-medium">{attendance.attendance_type}</div>
                      </div>
                    </div>
                    
                    {attendance.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-gray-500 text-sm">Notes:</span>
                        <div className="text-sm text-gray-900 mt-1">{attendance.notes}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No attendance records found for this date.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;