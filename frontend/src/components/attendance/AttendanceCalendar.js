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
    if (!attendance.length) return 'bg-slate-800/50 text-slate-500';

    const hasPresent = attendance.some(a => a.status === 'PRESENT');
    const hasLate = attendance.some(a => a.status === 'LATE');
    const hasAbsent = attendance.some(a => a.status === 'ABSENT');
    const hasHalfDay = attendance.some(a => a.status === 'HALF_DAY');

    if (hasPresent && !hasLate && !hasAbsent) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (hasLate) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    if (hasAbsent) return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (hasHalfDay) return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';

    return 'bg-slate-800/50 text-slate-500';
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
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner text="Consulting the logs..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 text-slate-300">
      {/* Header */}
      <div className="mb-10 text-center lg:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-4">
          <CalendarDaysIcon className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Chronicle Viewer</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight uppercase">Attendance Calendar</h1>
        <p className="mt-2 text-slate-400 font-medium">
          {isHRManager() ? 'Global organization attendance timeline.' : 'Personal attendance history and schedule.'}
        </p>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        {/* Calendar Navigation */}
        <div className="px-8 py-6 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            {monthNames[currentDate.getMonth()]} <span className="text-indigo-500">{currentDate.getFullYear()}</span>
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all shadow-lg"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-6 py-2.5 text-xs font-black text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/10 transition-all uppercase tracking-widest"
            >
              Current
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all shadow-lg"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-8">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-4">
            {days.map((date, index) => {
              const attendance = getAttendanceForDate(date);
              const isTodayDate = isToday(date);
              const isWeekendDay = isWeekend(date);

              return (
                <div
                  key={index}
                  className={`
                    min-h-[120px] rounded-3xl p-3 cursor-pointer transition-all duration-300 border relative overflow-hidden group
                    ${!date ? 'opacity-0 pointer-events-none' : ''}
                    ${selectedDate?.toDateString() === date?.toDateString()
                      ? 'bg-indigo-500/20 border-indigo-500/50 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-900/60 border-white/5 hover:border-white/10 hover:translate-y-[-2px]'}
                  `}
                  onClick={() => handleDateClick(date)}
                >
                  {date && (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`
                          text-sm font-black tracking-tighter
                          ${isTodayDate ? 'text-indigo-400' : isWeekendDay ? 'text-slate-600' : 'text-slate-300'}
                        `}>
                          {date.getDate()}
                        </span>
                        {isTodayDate && (
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse"></div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1.5 overflow-hidden">
                        {attendance?.slice(0, 2).map((a, idx) => (
                          <div
                            key={idx}
                            className={`
                              px-2.5 py-1 text-[9px] font-black uppercase tracking-tight rounded-lg truncate transition-all
                              ${getDateStatusColor(date)}
                            `}
                          >
                            {isHRManager() ? `${a.employee?.user?.first_name}` : a.status}
                          </div>
                        ))}
                        {attendance?.length > 2 && (
                          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">
                            +{attendance.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Legend */}
        <div className="px-8 py-6 border-t border-white/5 bg-slate-900/40">
          <div className="flex flex-wrap items-center gap-8 justify-center">
            {[
              { label: 'Present', color: 'bg-emerald-500' },
              { label: 'Late Arrival', color: 'bg-amber-500' },
              { label: 'Absent', color: 'bg-rose-500' },
              { label: 'Half Day', color: 'bg-indigo-500' }
            ].map((item) => (
              <div key={item.label} className="flex items-center space-x-2">
                <div className={`w-2 h-2 ${item.color} rounded-full`}></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Inspector Sidebar/Overlay */}
      {selectedDate && (
        <div className="mt-8 bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-indigo-500/20 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5 duration-500">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Chronicle Detail</p>
              <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                {formatDate(selectedDate)}
              </h3>
            </div>
            <button
              onClick={() => { setSelectedDate(null); setSelectedDateData(null); }}
              className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors border border-white/5"
            >
              <XCircleIcon className="w-8 h-8" />
            </button>
          </div>

          <div className="p-8">
            {selectedDateData && selectedDateData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedDateData.map((a, index) => (
                  <div key={index} className="bg-slate-950/40 p-6 rounded-[2rem] border border-white/5 relative group hover:border-indigo-500/20 transition-all text-slate-300">
                    {isHRManager() && (
                      <div className="flex items-center mb-6">
                        <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-violet-700 rounded-xl flex items-center justify-center mr-4 shadow-lg text-white font-black uppercase border border-white/10">
                          {a.employee?.user?.first_name?.[0]}{a.employee?.user?.last_name?.[0]}
                        </div>
                        <div>
                          <div className="text-lg font-black text-white tracking-tight">
                            {a.employee?.user?.first_name} {a.employee?.user?.last_name}
                          </div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{a.employee?.employee_id}</div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Check In:</span>
                        <div className="font-medium text-white">{a.check_in_time || 'Not recorded'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Check Out:</span>
                        <div className="font-medium text-white">{a.check_out_time || 'Not recorded'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Status:</span>
                        <div><StatusBadge status={a.status} /></div>
                      </div>
                      <div>
                        <span className="text-slate-500">Type:</span>
                        <div className="font-medium text-white">{a.attendance_type}</div>
                      </div>
                    </div>

                    {a.notes && (
                      <div className="mt-6 pt-6 border-t border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-slate-500">Observations</p>
                        <p className="text-sm text-slate-300 italic font-medium leading-relaxed">"{a.notes}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 opacity-50">
                <CalendarDaysIcon className="mx-auto h-20 w-20 text-slate-700 mb-6" />
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Timeline Void</h3>
                <p className="text-slate-500 font-medium mt-2 max-w-xs mx-auto">No telemetry data recorded for this specific coordinate on the timeline.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;