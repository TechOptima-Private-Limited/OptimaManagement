import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  CheckCircleIcon,
  BuildingOfficeIcon,
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
import { formatTime } from '../../utils/formatters';
import DashboardSkeleton from './DashboardSkeleton';
import WorkFromHomePopup from '../attendance/WorkFromHomePopup';
import WorkingFormatCard from './WorkingFormatCard';
import { useTheme } from '../../context/ThemeContext';
import { 
  getLastWeekRange, 
  getStatsForPeriod, 
  formatMinutesAsHhMm, 
  getDailyStatsForLast7Days,
  getAttendanceStreak,
  getMonthlyOnTimeScore,
  getMonthlyBadge
} from '../../utils/attendanceStats';
import PerformanceTrends from './PerformanceTrends';

const MicroStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    .card-hover-lift {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .card-hover-lift:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
    }
    .btn-glow-primary:hover {
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
      transform: scale(1.02);
    }
    .btn-glow-danger:hover {
      box-shadow: 0 0 15px rgba(244, 63, 94, 0.4);
      transform: scale(1.02);
    }
    .smooth-transition {
      transition: all 0.3s ease-in-out;
    }
    @keyframes flicker {
      0% { transform: scale(1) rotate(-1deg); filter: drop-shadow(0 0 5px rgba(244,63,94,0.4)); }
      50% { transform: scale(1.1) rotate(1deg); filter: drop-shadow(0 0 15px rgba(244,63,94,0.6)); }
      100% { transform: scale(1) rotate(-1deg); filter: drop-shadow(0 0 5px rgba(244,63,94,0.4)); }
    }
    .animate-flicker {
      animation: flicker 1.5s infinite ease-in-out;
      display: inline-block;
    }
  `}} />
);

// Helper to get local YYYY-MM-DD date (avoid UTC offset issues)
const toLocalDate = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const normalizeRecordDate = (value) => {
  if (!value) return '';
  if (value instanceof Date) return toLocalDate(value);
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const isoLike = raw.match(/^(\d{4}-\d{2}-\d{2})[T\s].*$/);
  if (isoLike) return isoLike[1];
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? '' : toLocalDate(parsed);
};

const parseTimeOnDate = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  const raw = String(timeStr).trim();
  const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const seconds = parseInt(ampmMatch[3] || '0', 10);
    const ampm = ampmMatch[4].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(hours, minutes, seconds, 0);
    return d;
  }
  const normalized = /^\d{1,2}:\d{2}$/.test(raw) ? `${raw}:00` : raw;
  const parsed = new Date(`${dateStr}T${normalized}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

const BirthdayBanner = ({ data, theme }) => {
  if (!data.birthdays.has_birthdays_today) return null;

  return (
    <div className={`mb-6 bg-gradient-to-r ${theme.headerGradient} rounded-2xl p-6 text-slate-900 dark:text-white relative overflow-hidden shadow-2xl border border-white/10 group`}>
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
              <CakeIcon className="w-8 h-8 mr-3 text-indigo-500" />
              🎉 Birthday Celebration! 🎉
            </h2>
            <div className="space-y-2">
              {data.birthdays.todays_birthdays.map((birthday) => (
                <div key={birthday.id} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-lg font-bold backdrop-blur-sm border border-indigo-500/20 text-indigo-600 dark:text-white">
                    {birthday.avatar_initials}
                  </div>
                  <div>
                    <p className="text-xl font-semibold">
                      Happy {birthday.age_today}th Birthday, {birthday.employee_name}! 🎂
                    </p>
                    <p className="text-slate-600 dark:text-white/90 text-sm">
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

const FestivalBanner = ({ data, theme }) => {
  if (!data.festivals.has_festivals_today) return null;

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
              {data.festivals.todays_festivals.map((festival) => (
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

const UpcomingTimeline = ({ nextHoliday, nextLeave, theme }) => {
  if (!nextHoliday && !nextLeave) return null;

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return 0;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className={`${theme.muted.bg} backdrop-blur-xl rounded-2xl p-5 border ${theme.muted.border} shadow-lg relative overflow-hidden transition-all duration-300 hover:border-white/10 mb-6 card-hover-lift smooth-transition`}>
      <div className="relative z-10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
          <CalendarDaysIcon className="w-3 h-3 mr-2" />
          Upcoming Timeline
        </h3>

        <div className="space-y-4">
          {/* Next Holiday */}
          {nextHoliday && (
            <div className="flex items-center gap-4 group">
              <div className={`flex flex-col items-center justify-center w-12 h-12 ${theme.info.bg} rounded-xl border ${theme.info.border} group-hover:bg-indigo-500/30 transition-all duration-300`}>
                <span className={`text-[10px] font-black ${theme.info.text} uppercase leading-none mb-1 opacity-70`}>
                   {new Date(nextHoliday.date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className={`text-lg font-black ${theme.isDark ? 'text-white' : theme.info.text} leading-none`}>
                   {new Date(nextHoliday.date).getDate()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Next Holiday</p>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {nextHoliday.name}
                  {getDaysUntil(nextHoliday.date) <= 3 && (
                    <span className={`text-[8px] ${theme.success.bg} ${theme.success.text} px-1.5 py-0.5 rounded-full border ${theme.success.border} animate-pulse`}>Soon</span>
                  )}
                </h4>
              </div>
            </div>
          )}

          {/* Next Leave */}
          {nextLeave ? (
            <div className="flex items-center gap-4 group">
              <div className={`flex flex-col items-center justify-center w-12 h-12 ${theme.info.bg.replace('indigo', 'violet')} rounded-xl border ${theme.info.border.replace('indigo', 'violet')} group-hover:bg-violet-500/30 transition-all duration-300`}>
                <span className={`text-[10px] font-black ${theme.info.text.replace('indigo', 'violet')} uppercase leading-none mb-1 opacity-70`}>
                   {new Date(nextLeave.start_date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className={`text-lg font-black ${theme.isDark ? 'text-white' : theme.info.text.replace('indigo', 'violet')} leading-none`}>
                   {new Date(nextLeave.start_date).getDate()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Your Upcoming Leave</p>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">{nextLeave.leave_type_name || 'Vacation'}</h4>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  {getDaysUntil(nextLeave.start_date)} days remaining
                </p>
              </div>
            </div>
          ) : (
            <div className={`p-3 ${theme.muted.bg} rounded-xl border ${theme.muted.border} border-dashed text-center`}>
               <p className="text-[10px] text-slate-600 font-bold uppercase">No upcoming leaves</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BirthdayCard = ({ birthday, theme }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.birthdayGradient} p-1 shadow-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl group w-full max-w-[320px] mx-auto sm:mx-0`}>
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
            <div className={`w-14 h-14 bg-gradient-to-br ${theme.avatarGradient} rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg border-4 border-white/30`}>
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
            <div className={`bg-gradient-to-br ${theme.specialGradient} rounded-xl p-2.5 border-2 border-white/30 shadow-lg`}>
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

const QuickAccessCard = ({ title, children, className = "", gradient = false, headerAction = null, theme }) => {
  const hasCustomBg = className.includes('bg-');
  const defaultBg = gradient ? 'bg-white/10 backdrop-blur-xl border border-white/5 shadow-2xl' : `${theme.muted.bg} backdrop-blur-lg border ${theme.muted.border}`;

  return (
    <div className={`${hasCustomBg ? '' : defaultBg} rounded-2xl p-5 hover:border-white/10 transition-all duration-300 group card-hover-lift smooth-transition ${className}`}>
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

const HolidaysModal = ({ isOpen, onClose, data, theme }) => {
  if (!isOpen) return null;

  const displayHolidays = data || [];
  const sortedHolidays = [...displayHolidays].sort((a, b) => new Date(a.date) - new Date(b.date));

  const getMonthName = (dateStr) => {
    return new Date(dateStr).toLocaleString('default', { month: 'short' }).toUpperCase();
  };

  const getDayNumber = (dateStr) => {
    return new Date(dateStr).getDate().toString().padStart(2, '0');
  };

  const getDayName = (dateStr) => {
    return new Date(dateStr).toLocaleString('default', { weekday: 'long' });
  };

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
      <div className="absolute inset-0 bg-[#000000]/70 backdrop-blur-md" onClick={onClose} />
      <div className={`relative ${theme.modalBg} w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border ${theme.muted.border} animate-in zoom-in-95 duration-200`}>
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <h2 className="text-xl font-medium text-slate-800 dark:text-white tracking-tight">Holidays</h2>
              <div className="flex items-center space-x-4 text-base">
                <button className="text-slate-400 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <span className="font-semibold text-slate-800 dark:text-white tracking-wide">2026</span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar-holiday">
            {sortedHolidays.length === 0 ? (
              <div className="col-span-2 text-center py-10 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-slate-400 text-base">No holidays found for this year.</p>
              </div>
            ) : (
              sortedHolidays.map((h, idx) => (
                <div key={idx} className="flex items-center space-x-4 group">
                  <div className="w-14 h-14 rounded-lg overflow-hidden shadow-lg flex flex-col border border-white/10 group-hover:border-white/20 transition-colors shrink-0">
                    <div className={`h-5 ${getMonthColor(idx)} flex items-center justify-center text-[9px] font-black text-white tracking-[0.1em] opacity-90`}>
                      {getMonthName(h.date)}
                    </div>
                    <div className={`${theme.isDark ? 'bg-[#1a2236]' : 'bg-slate-200'} flex-1 flex items-center justify-center text-xl font-bold ${theme.isDark ? 'text-white' : 'text-slate-800'} tracking-tighter`}>
                      {getDayNumber(h.date)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-medium text-slate-800 dark:text-slate-100 group-hover:dark:text-white group-hover:text-indigo-600 transition-colors mb-0.5 truncate">{h.name}</h4>
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

const LeaveBalanceCircle = ({ balance, theme }) => {
  const used = balance.used_days;
  const total = balance.total_days;
  const remaining = balance.remaining_days;
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = isNaN(percentage) ? circumference : circumference - (percentage / 100) * circumference;

  return (
    <div className={`text-center p-3 rounded-xl border ${theme.muted.border} ${theme.muted.bg} transition-all duration-300`}>
      <div className="relative w-20 h-20 mx-auto mb-1.5">
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
          <circle
            cx="50" cy="50" r="45" stroke="url(#primaryGradient)" strokeWidth="8" fill="none"
            strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
          />
          <defs>
            <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={theme.accentColor} />
              <stop offset="100%" stopColor={theme.secondaryColor} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`font-black ${theme.info.text} ${remaining > 500 ? 'text-2xl pt-1' : 'text-lg'}`}>
              {remaining > 500 ? '∞' : remaining}
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">left</div>
          </div>
        </div>
      </div>
      <div className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-tight">{balance.leave_type?.code}</div>
      <div className="text-[9px] text-slate-500 font-bold">
        {total > 500 ? `${used} Days Used` : `${used}/${total} used`}
      </div>
    </div>
  );
};

const AutoAlerts = ({ alerts, dismissedAlerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {alerts.map((alert) => (
        <div
          key={alert.key}
          className={`relative flex items-start justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r ${alert.gradient} border ${alert.border} backdrop-blur-sm shadow-lg overflow-hidden group animate-in slide-in-from-top-2 duration-500`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />

          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-11 h-11 ${alert.icon_bg} rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/10`}>
              {alert.emoji}
            </div>

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

          <button
            onClick={() => onDismiss(alert.key)}
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

const DailySummaryCard = ({ attendanceState, todayWindow, isManagerOnly, theme }) => {
  if (isManagerOnly || !attendanceState) return null;

  // Use the active record from the todayWindow (Same as Attendance Tracker "todayRecord")
  const activeRecord = todayWindow.activeRecord;
  const checkInTime = attendanceState.firstCheckInTime || todayWindow.earliestIn;
  
  let workHours = attendanceState.workingHours || 0;
  let workMinutes = attendanceState.workingMinutes || 0;

  // Logic from AttendanceTracker.js: computeDurationMinutes
  const recordDate = activeRecord?.date || toLocalDate(new Date());
  
  if (activeRecord && activeRecord.check_in_time) {
    const start = parseTimeOnDate(recordDate, activeRecord.check_in_time);
    const checkOutDate = activeRecord.check_out_time ? parseTimeOnDate(recordDate, activeRecord.check_out_time) : null;
    
    const now = new Date();
    const end = (checkOutDate && checkOutDate > start) ? checkOutDate : now;
    
    if (start && !isNaN(start.getTime())) {
      const durationMinutes = Math.max(0, Math.floor((end - start) / 60000));
      workHours = Math.floor(durationMinutes / 60);
      workMinutes = durationMinutes % 60;
    }
  } else if (checkInTime) {
    const start = checkInTime instanceof Date ? checkInTime : parseTimeOnDate(recordDate, String(checkInTime));
    const now = new Date();
    
    if (start && !isNaN(start.getTime())) {
      const durationMinutes = Math.max(0, Math.floor((now - start) / 60000));
      workHours = Math.floor(durationMinutes / 60);
      workMinutes = durationMinutes % 60;
    }
  }

  const isOvertime = workHours >= 9;
  const otHours = workHours - 9;
  const otMinutes = workMinutes;

  const formattedCheckIn = checkInTime 
    ? (checkInTime instanceof Date ? checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : String(checkInTime))
    : 'Not checked in';

  // Status calculation (Late / On Time)
  let status = 'Pending';
  let statusColor = 'text-slate-400';
  
  if (checkInTime) {
    let h, m;
    if (checkInTime instanceof Date) {
      h = checkInTime.getHours();
      m = checkInTime.getMinutes();
    } else {
      const parts = String(checkInTime).split(':');
      h = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
    }
    
    if (!isNaN(h) && !isNaN(m)) {
      const totalMinutes = h * 60 + m;
      const isLate = totalMinutes > (10 * 60 + 5);
      status = isLate ? 'Late' : 'On Time';
      statusColor = isLate ? theme.warning.text : theme.success.text;
    }
  }

  return (
    <div className={`${theme.muted.bg} backdrop-blur-xl rounded-2xl p-5 border ${theme.muted.border} shadow-lg group relative overflow-hidden transition-all duration-300 hover:border-white/20 mb-6`}>
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <ClockIcon className="w-12 h-12 text-white" />
      </div>
      <div className="relative z-10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
          <SparklesIcon className="w-3 h-3 mr-2" />
          Today's Summary
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Check-in</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{formattedCheckIn}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Status</p>
            <p className={`text-lg font-black ${statusColor}`}>{status}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Work Hours so far</p>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-black text-slate-800 dark:text-white">
                {workHours}h {workMinutes}m
              </p>
              {isOvertime && (
                <span className={`px-3 py-1 ${theme.danger.bg} ${theme.danger.text} text-[10px] font-black uppercase tracking-widest rounded-lg animate-pulse border ${theme.danger.border} flex items-center gap-2`}>
                  <span className="bg-rose-500 w-1 h-1 rounded-full shadow-[0_0_5px_rgba(244,63,94,0.8)]"></span>
                  Overtime +{otHours}h {String(otMinutes).padStart(2, '0')}m 🔥
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const GamificationCard = ({ records, targetEmployeeId, isManagerOnly, theme }) => {
  if (isManagerOnly || !records || records.length === 0) return null;

  const streak = getAttendanceStreak(records, targetEmployeeId);
  const onTimeScore = getMonthlyOnTimeScore(records, targetEmployeeId);
  const badge = getMonthlyBadge(records, targetEmployeeId);

  return (
    <div className={`${theme.muted.bg} backdrop-blur-xl rounded-2xl p-5 border ${theme.muted.border} shadow-lg relative overflow-hidden transition-all duration-300 hover:border-white/10 mb-6 card-hover-lift smooth-transition`}>
      {/* Background Decorative Element */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${theme.info.bg.replace('/20', '/10')} rounded-full blur-3xl`}></div>
      
      <div className="relative z-10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
          <ChartBarIcon className="w-3 h-3 mr-2" />
          Performance Hub
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {/* Streak */}
          <div className="bg-white/5 p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Streak</p>
            <div className="flex items-center gap-1">
              {streak > 0 ? (
                <>
                  <span className={`text-xl font-black ${theme.danger.text} drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]`}>
                    {streak}
                  </span>
                  <span className="text-lg animate-flicker transition-transform duration-300">🔥</span>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg animate-bounce">🚀</span>
                  <span className={`text-[9px] ${theme.info.text} font-black uppercase tracking-tighter leading-tight`}>
                    Start your<br/>streak today
                  </span>
                </div>
              )}
            </div>
            {streak > 0 && (
              <div className={`mt-1 w-full ${theme.muted.bg} h-1 rounded-full overflow-hidden`}>
                <div className={`${theme.danger.text.replace('text', 'bg')} h-full transition-all duration-1000`} style={{ width: `${Math.min(100, (streak / 30) * 100)}%` }}></div>
              </div>
            )}
          </div>

          {/* On-Time Score */}
          <div className={`${theme.muted.bg} p-3 rounded-xl border ${theme.muted.border} hover:bg-white/10 transition-colors`}>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Punctuality</p>
            <div className="flex items-center gap-1">
              <span className={`text-xl font-black ${theme.success.text}`}>
                {onTimeScore}%
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${theme.success.text.replace('text', 'bg')} animate-pulse`}></div>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">This Month</p>
          </div>

          {/* Monthly Badge */}
          {badge ? (
            <div className={`${theme.muted.bg} p-3 rounded-xl border ${theme.muted.border} border-dashed hover:bg-white/10 transition-colors flex flex-col items-center justify-center text-center`}>
              <div className="text-2xl mb-1 drop-shadow-xl transform group-hover:scale-110 transition-transform">
                {badge.icon}
              </div>
              <p className={`text-[8px] font-black uppercase tracking-tight ${badge.color}`}>
                {badge.name}
              </p>
            </div>
          ) : (
             <div className={`${theme.muted.bg} p-3 rounded-xl border ${theme.muted.border} border-dashed flex flex-col items-center justify-center text-center`}>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">No Badge</div>
                <p className="text-[7px] text-slate-500 mt-1">Keep it up!</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
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
    allAttendance: [],
    attendanceStats: null,
    currentTime: new Date(),
    onLeaveToday: [],
    wfhToday: [],
    nextHoliday: null,
    nextLeave: null,
    loading: true
  });

  // Attendance state with localStorage persistence (only for employees and HR managers)
  const [attendanceState, setAttendanceState] = useState(() => {
    const saved = localStorage.getItem(`attendance_${user?.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          isCheckedIn: parsed.isCheckedIn || false,
          hasOpenSession: parsed.hasOpenSession || false,
          checkInTime: parsed.checkInTime ? new Date(parsed.checkInTime) : null,
          firstCheckInTime: parsed.firstCheckInTime ? new Date(parsed.firstCheckInTime) : null,
          lastCheckOutTime: parsed.lastCheckOutTime ? new Date(parsed.lastCheckOutTime) : null,
          workingHours: parsed.workingHours || 0,
          workingMinutes: parsed.workingMinutes || 0,
          workingSeconds: parsed.workingSeconds || 0,
          isWorkFromHome: parsed.isWorkFromHome || false,
          todayAttendance: null,
          pendingSubmission: parsed.pendingSubmission || false,
          lastActionTime: parsed.lastActionTime || 0,
          _restored: true
        };
      } catch (e) {
        console.error('Failed to parse saved attendance state', e);
      }
    }
    return {
      isCheckedIn: false,
      hasOpenSession: false,
      checkInTime: null,
      firstCheckInTime: null,
      lastCheckOutTime: null,
      workingHours: 0,
      workingMinutes: 0,
      workingSeconds: 0,
      isWorkFromHome: false,
      todayAttendance: null,
      pendingSubmission: false,
      lastActionTime: 0
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

  const isActiveAttendanceRecord = useCallback((record) => {
    if (!record?.check_in_time) return false;
    if (!record.check_out_time || record.check_out_time === record.check_in_time) return true;
    const recordDate = normalizeRecordDate(record.date);
    const inDate = parseTimeOnDate(recordDate, record.check_in_time);
    const outDate = parseTimeOnDate(recordDate, record.check_out_time);
    if (!inDate || !outDate) return true;
    // If checkout is not after check-in, treat as still active (handles re-check-in on same record).
    if (outDate <= inDate) return true;
    // Treat sub-5-minute IN/OUT as accidental pulse and keep session active.
    return Number.isFinite(outDate - inDate) && (outDate - inDate) < (5 * 60 * 1000);
  }, []);
  const isBiometricAttendanceRecord = useCallback((record) => {
    return String(record?.attendance_type || '').toUpperCase() === 'BIOMETRIC';
  }, []);

  const getTodayUserRecords = useCallback((records, dateStr) => {
    const source = Array.isArray(records) ? records : [];
    const targetDate = dateStr || toLocalDate(new Date());
    const targetId = user?.employee_id || user?.employee_pk || user?.id;

    return source.filter((r) => {
      const recordDate = normalizeRecordDate(r?.date);
      if (recordDate !== targetDate) return false;
      // Employee responses are backend-scoped already, so date match is enough.
      if (!isManagerOrAbove) return true;
      const rId = r.display_id || r.employee_id || r.employee?.employee_id;
      const rPk = r.employee?.id || r.employee;
      return (
        String(rId) === String(targetId) ||
        String(rPk) === String(user?.employee_pk) ||
        String(rPk) === String(user?.id)
      );
    });
  }, [isManagerOrAbove, user]);

  const getTodayAttendanceWindow = useCallback((records) => {
    let earliestIn = null;
    let latestIn = null;
    let latestOut = null;
    let latestInRecord = null;
    let fallbackActiveRecord = null;

    (records || []).forEach((r) => {
      const recordDate = normalizeRecordDate(r?.date);
      if (!recordDate) return;
      if (r?.check_in_time) {
        const inDate = parseTimeOnDate(recordDate, r.check_in_time);
        if (inDate && (!earliestIn || inDate < earliestIn)) earliestIn = inDate;
        if (inDate && (!latestIn || inDate > latestIn)) {
          latestIn = inDate;
          latestInRecord = r;
        }
      }
      if (r?.check_out_time) {
        const outDate = parseTimeOnDate(recordDate, r.check_out_time);
        if (outDate && (!latestOut || outDate > latestOut)) latestOut = outDate;
      }
      if (!fallbackActiveRecord && isActiveAttendanceRecord(r)) {
        fallbackActiveRecord = r;
      }

      // Biometric fallback: odd number of day logs means currently "IN".
      const logs = Array.isArray(r.biometric_logs) ? [...r.biometric_logs] : [];
      if (logs.length > 0) {
        const sortedLogs = logs
          .filter(log => log?.time)
          .sort((a, b) => String(a.time).localeCompare(String(b.time)));

        if (sortedLogs.length > 0) {
          const lastLogTime = sortedLogs[sortedLogs.length - 1].time;
          const logInDate = parseTimeOnDate(recordDate, lastLogTime);
          const hasOpenBiometricSession = sortedLogs.length % 2 === 1;
          if (hasOpenBiometricSession && logInDate && (!latestIn || logInDate > latestIn)) {
            latestIn = logInDate;
            latestInRecord = r;
            fallbackActiveRecord = r;
          }
        }
      }
    });

    const hasOpenSession = !!(latestIn && (!latestOut || latestIn > latestOut));
    const activeRecord = hasOpenSession ? latestInRecord : fallbackActiveRecord;
    return { earliestIn, latestIn, latestOut, hasOpenSession, activeRecord };
  }, [isActiveAttendanceRecord]);


  // ===================
  // API FUNCTIONS
  // ===================

  const submitPendingAttendance = useCallback(async (includeCheckOut = true) => {
    // Use ref to avoid dependency on attendanceState changing every second
    const currentState = attendanceStateRef.current;
    if (isManagerOnly || !currentState?.checkInTime) return;

    const now = new Date();
    const checkInTime = new Date(currentState.checkInTime);

    const attendanceData = {
      date: toLocalDate(checkInTime),
      status: 'PRESENT',
      attendance_type: 'MANUAL',
      notes: currentState.isWorkFromHome ? 'Work from Home' : 'Remote Login'
    };

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
  }, [isManagerOnly, user?.id]);

  const syncAttendanceFromRecords = useCallback((records, silent = false) => {
    if (!records || records.length === 0) return;

    const todayStr = toLocalDate(new Date());
    const todayRecords = getTodayUserRecords(records, todayStr);

    if (todayRecords.length > 0) {
      const { earliestIn, latestOut, hasOpenSession, activeRecord: currentActiveRecord } = getTodayAttendanceWindow(todayRecords);

      const now = Date.now();
      const actionThreshold = 10000; // 10 second protection window after manual action

      if (currentActiveRecord) {
        setAttendanceState(prev => {
          // If we just clicked Check-Out, and the API still shows an active record, ignore it
          if (prev?.lastActionTime && (now - prev.lastActionTime < actionThreshold) && !prev.isCheckedIn) {
            return prev;
          }

          const isBiometricActive = isBiometricAttendanceRecord(currentActiveRecord);
          return {
            ...(prev || {}),
            isCheckedIn: !isBiometricActive,
            hasOpenSession: hasOpenSession,
            checkInTime: isBiometricActive
              ? null
              : (parseTimeOnDate(normalizeRecordDate(currentActiveRecord.date), currentActiveRecord.check_in_time) || prev?.checkInTime || new Date()),
            firstCheckInTime: earliestIn,
            lastCheckOutTime: null,
            isWorkFromHome: !isBiometricActive && (currentActiveRecord.attendance_type === 'WFH' || currentActiveRecord.notes?.includes('Work from Home')),
            todayAttendance: currentActiveRecord,
            pendingSubmission: false,
            lastActionTime: 0
          };
        });
      } else {
        setAttendanceState(prev => {
          const recentlyActed = prev?.lastActionTime && (now - prev.lastActionTime < actionThreshold);
          return {
            ...(prev || {}),
            isCheckedIn: recentlyActed ? prev.isCheckedIn : false,
            hasOpenSession: hasOpenSession,
            firstCheckInTime: earliestIn,
            lastCheckOutTime: latestOut,
            isWorkFromHome: false,
            todayAttendance: todayRecords[todayRecords.length - 1],
            pendingSubmission: false,
            lastActionTime: 0
          };
        });
      }
    } else if (!todayRecords.length && !silent) {
      // Optional: Reset state if no records exist for today
    }
  }, [getTodayAttendanceWindow, getTodayUserRecords, isBiometricAttendanceRecord]);

  const fetchBirthdayFestivalData = useCallback(async () => {
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
  }, []);

  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      // Only show skeleton if we don't have enough data yet
      if (!silent) {
        setDashboardData(prev => {
          if (prev.recentActivity.length > 0 || prev.attendanceStats) return prev;
          return { ...prev, loading: true };
        });
      }

      // ── PHASE 1: Fast small payloads → clears skeleton immediately ──

      const now = new Date();
      const streakStartDate = new Date();
      streakStartDate.setDate(now.getDate() - 45); // 45 days for solid streaks and stats
      const attendanceStartDate = toLocalDate(streakStartDate);
      const attendanceEndDate = toLocalDate(now);

      const phase1 = isManagerOrAbove
        ? [
          employeeAPI.getEmployees({ limit: 10 }),                      // [0]
          leaveAPI.getLeaveRequests({ status: 'PENDING', limit: 10 }), /// [1]
          leaveAPI.getLeaveRequests({ status: 'APPROVED', limit: 10 }), /// [2]
        ]
        : [
          leaveAPI.getLeaveSummary(),                       // [0]
          attendanceAPI.getAttendanceRecords({ limit: 7 }), /// [1]
          leaveAPI.getLeaveRequests({ limit: 5 }),          // [2]
        ];

      const p1 = await Promise.all(phase1);

      // Render dashboard shell immediately after phase 1
      if (isManagerOrAbove) {
        setDashboardData(prev => ({
          ...prev,
          employees: p1[0]?.data?.results || p1[0]?.data || [],
          pendingLeaves: p1[1]?.data?.results || p1[1]?.data || [],
          approvedLeaves: p1[2]?.data?.results || p1[2]?.data || [],
          currentTime: new Date(),
          loading: false,
        }));
      } else {
        const earlyActivity = p1[1]?.data?.results || p1[1]?.data || [];
        setDashboardData(prev => ({
          ...prev,
          leaveBalances: p1[0]?.data?.leave_balances || [],
          leaveSummary: p1[0]?.data,
          recentActivity: earlyActivity,
          allAttendance: earlyActivity,
          currentTime: new Date(),
          loading: false,
        }));
        syncAttendanceFromRecords(earlyActivity, silent);
      }

      // ── PHASE 2: Heavy payloads — load after skeleton is gone ──────────
      const p2 = await Promise.all([
        attendanceAPI.getAttendanceRecords({
          start_date: attendanceStartDate,
          end_date: attendanceEndDate,
          page_size: isManagerOrAbove ? 1000 : 250,
        }),
        leaveAPI.getOnLeaveToday(),
        workFromHomeAPI.getWFHToday(),
        holidayAPI.getHolidays(),
        leaveAPI.getLeaveRequests({ status: 'APPROVED' })
      ]);

      const allAttendance = p2[0]?.data?.results || p2[0]?.data || [];
      const onLeaveTodayData = p2[1]?.data || [];
      const wfhTodayData = p2[2]?.data || [];
      const holidays = p2[3]?.data?.results || p2[3]?.data || [];
      const myLeaves = p2[4]?.data?.results || p2[4]?.data || [];

      // Find Next Holiday
      const todayStr = toLocalDate(new Date());
      const nextHoliday = holidays
        .filter(h => h.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))[0] || null;

      // Find Next Leave for User
      const myUpcomingLeaves = myLeaves
        .filter(l => l.start_date >= todayStr)
        .sort((a, b) => a.start_date.localeCompare(b.start_date));
      const nextLeave = myUpcomingLeaves[0] || null;

      const stats = calculateAttendanceStats(allAttendance, user?.employee_id || user?.employee_pk || user?.id);
      const dailyStats = getDailyStatsForLast7Days(allAttendance, user?.employee_id || user?.employee_pk || user?.id);

      if (isManagerOrAbove) {
        const myRecentAttendance = allAttendance.filter(r => {
          const rId = r.display_id || r.employee_id || (r.employee && (r.employee.employee_id || r.employee.id));
          const targetId = user?.employee_id || user?.employee_pk || user?.id;
          return String(rId) === String(targetId);
        }).slice(0, 7);

        setDashboardData(prev => ({
          ...prev,
          recentActivity: myRecentAttendance,
          allAttendance: allAttendance,
          attendanceStats: stats,
          dailyStats: dailyStats,
          onLeaveToday: onLeaveTodayData,
          wfhToday: wfhTodayData,
          nextHoliday,
          nextLeave,
          currentTime: new Date(),
        }));
        syncAttendanceFromRecords(allAttendance, silent);
      } else {
        setDashboardData(prev => ({
          ...prev,
          allAttendance: allAttendance,
          attendanceStats: stats,
          dailyStats: dailyStats,
          onLeaveToday: onLeaveTodayData,
          wfhToday: wfhTodayData,
          nextHoliday,
          nextLeave,
          currentTime: new Date(),
        }));
        syncAttendanceFromRecords(allAttendance, silent);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  }, [isManagerOrAbove, user, syncAttendanceFromRecords]);

  const fetchAllHolidays = useCallback(async () => {
    try {
      const response = await holidayAPI.getHolidays();
      const holidays = response.data.results || response.data || [];
      // Sort holidays by date
      const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date));
      setAllHolidays(sortedHolidays);
    } catch (error) {
      console.error('Failed to fetch all holidays:', error);
    }
  }, []);

  useEffect(() => {
    if (showHolidaysModal && allHolidays.length === 0) {
      fetchAllHolidays();
    }
  }, [showHolidaysModal, allHolidays.length, fetchAllHolidays]);

  // Employee and HR Manager only functions
  const checkTodayAttendance = useCallback(async (silent = false) => {
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
  }, [isManagerOnly, user, isManagerOrAbove, syncAttendanceFromRecords]);

  const checkWFHStatus = useCallback(async () => {
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
  }, [isManagerOnly]);

  // Employee and HR Manager only attendance functions
  const checkPendingSubmissions = useCallback(() => {
    const currentState = attendanceStateRef.current;
    if (isManagerOnly || !currentState) return;

    if (currentState.isCheckedIn && currentState.checkInTime) {
      const now = new Date();
      const checkInTime = new Date(currentState.checkInTime);
      const hoursDiff = (now - checkInTime) / (1000 * 60 * 60);

      if (hoursDiff >= 24) {
        submitPendingAttendance(false);
      }
    }
  }, [isManagerOnly, submitPendingAttendance]);

  const checkAutoSubmit = useCallback(() => {
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
  }, [isManagerOnly, submitPendingAttendance]);

  const updateWorkingTime = useCallback(() => {
    if (isManagerOnly || !attendanceStateRef.current) return;

    const currentState = attendanceStateRef.current;

    // Timer should work from first check-in time
    const startTime = currentState.firstCheckInTime || currentState.checkInTime;
    if (!startTime) return;

    let endTime;
    if (currentState.isCheckedIn || currentState.hasOpenSession) {
      endTime = new Date();
    } else if (currentState.lastCheckOutTime) {
      endTime = currentState.lastCheckOutTime;
    } else {
      return;
    }

    const diffMs = Math.max(0, endTime - startTime);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    setAttendanceState(prev => ({
      ...prev,
      workingHours: hours,
      workingMinutes: minutes,
      workingSeconds: seconds
    }));
  }, [isManagerOnly]);

  const handleCheckIn = async (workFromHome = false) => {
    if (isManagerOnly) return;

    if (workFromHome) {
      if (isHRManager() || wfhStatus.hasApprovedRequest) {
        const now = new Date();
        setAttendanceState(prev => ({
          ...prev,
          isCheckedIn: true,
          checkInTime: now,
          firstCheckInTime: prev.firstCheckInTime || now,
          isWorkFromHome: true,
          workingHours: 0,
          workingMinutes: 0,
          workingSeconds: 0,
          pendingSubmission: true,
          lastActionTime: Date.now()
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
      firstCheckInTime: prev.firstCheckInTime || now,
      isWorkFromHome: false,
      workingHours: 0,
      workingMinutes: 0,
      workingSeconds: 0,
      pendingSubmission: true,
      lastActionTime: Date.now()
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
        lastCheckOutTime: null,
        workingHours: 0,
        workingMinutes: 0,
        workingSeconds: 0,
        pendingSubmission: false,
        lastActionTime: Date.now()
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

  // ===================
  // EFFECTS & LIFECYCLE
  // ===================

  // Save attendance state to localStorage (only for employees and HR managers)
  useEffect(() => {
    if (!isManagerOnly && user?.id && attendanceState) {
      localStorage.setItem(`attendance_${user.id}`, JSON.stringify({
        isCheckedIn: attendanceState.isCheckedIn,
        hasOpenSession: attendanceState.hasOpenSession,
        checkInTime: attendanceState.checkInTime,
        firstCheckInTime: attendanceState.firstCheckInTime,
        lastCheckOutTime: attendanceState.lastCheckOutTime,
        workingHours: attendanceState.workingHours,
        workingMinutes: attendanceState.workingMinutes,
        workingSeconds: attendanceState.workingSeconds,
        isWorkFromHome: attendanceState.isWorkFromHome,
        pendingSubmission: attendanceState.pendingSubmission,
        lastActionTime: attendanceState.lastActionTime
      }));
    }
  }, [attendanceState, user?.id, isManagerOnly]);

  // Main effect for fetching data and setting timers
  useEffect(() => {
    fetchDashboardData();
    fetchBirthdayFestivalData();

    // Only setup attendance-related functionality for employees and HR managers
    if (!isManagerOnly) {
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
    }, 60000);

    return () => {
      clearInterval(timer);
      clearInterval(poolTimer);
    };
  }, [isManagerOnly, fetchDashboardData, fetchBirthdayFestivalData, checkPendingSubmissions, checkWFHStatus, updateWorkingTime, checkAutoSubmit]);
  const handleWFHSuccess = useCallback(() => {
    toast.success('Work from home request submitted! You will be notified once approved.');
    checkWFHStatus();
    setShowWFHPopup(false);
  }, [checkWFHStatus]);

  // ===================
  // UTILITY FUNCTIONS
  // ===================


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


  // Derived state for attendance and alerts
  const todayStr = toLocalDate(dashboardData.currentTime);
  const recentRecords = dashboardData.recentActivity || [];
  const todayApiRecords = getTodayUserRecords(recentRecords, todayStr);
  const todayWindow = getTodayAttendanceWindow(todayApiRecords);
  const activeBiometricTodayRecordForUi = todayApiRecords.find(isBiometricAttendanceRecord);
  const effectiveIsCheckedIn = attendanceState.isCheckedIn || todayWindow.hasOpenSession;

  // Compute active alerts for the AutoAlerts component
  const computeAlertsArray = () => {
    if (isManagerOnly || !attendanceState) return [];

    const now = dashboardData.currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const totalMinutes = currentHour * 60 + currentMinute;

    const todayApiRecord = todayWindow.activeRecord || todayApiRecords[0];
    const todayRecord = attendanceState.todayAttendance || todayApiRecord;
    const hasCheckedInToday = attendanceState.isCheckedIn || !!todayRecord;
    const lateThresholdMinutes = 10 * 60 + 5; // 10:05 AM

    let isLate = false;
    let checkInTimeStr = null;

    if (hasCheckedInToday) {
      let earliestCheckInMinutes = Infinity;
      let displayTime = null;

      const recordToProcess = attendanceState.todayAttendance || todayApiRecord;
      if (recordToProcess && recordToProcess.check_in_time) {
        const [h, m] = recordToProcess.check_in_time.split(':').map(Number);
        const minutes = h * 60 + m;
        if (minutes < earliestCheckInMinutes) {
          earliestCheckInMinutes = minutes;
          displayTime = recordToProcess.check_in_time;
        }
      }

      if (attendanceState.checkInTime) {
        const h = attendanceState.checkInTime.getHours();
        const m = attendanceState.checkInTime.getMinutes();
        const minutes = h * 60 + m;
        if (minutes < earliestCheckInMinutes) {
          earliestCheckInMinutes = minutes;
          displayTime = attendanceState.checkInTime;
        }
      }

      if (earliestCheckInMinutes !== Infinity && earliestCheckInMinutes > lateThresholdMinutes) {
        isLate = true;
        checkInTimeStr = displayTime instanceof Date ? formatTime(displayTime) : displayTime;
      }
    } else if (totalMinutes >= lateThresholdMinutes) {
      isLate = true;
    }

    const checkoutThresholdMinutes = 19 * 60; // 7:00 PM
    const hasActiveCheckIn = effectiveIsCheckedIn;
    const forgotCheckout = totalMinutes >= checkoutThresholdMinutes && hasActiveCheckIn;
    const isOnTime = hasCheckedInToday && !isLate;

    const alerts = [];

    if (isLate && !dismissedAlerts.late) {
      const isMissing = !hasCheckedInToday;
      alerts.push({
        key: 'late',
        emoji: isMissing ? '⏰' : '⚠️',
        title: isMissing ? 'You are late today' : 'Late Arrival Recorded',
        subtitle: isMissing
          ? "It looks like you haven't checked in yet. Please check in as soon as possible."
          : `You checked in at ${checkInTimeStr}, which is after the 10:00 AM shift start.`,
        gradient: isMissing ? 'from-rose-500/20 via-orange-500/15 to-amber-500/10' : 'from-orange-500/15 via-amber-500/10 to-transparent',
        border: isMissing ? 'border-rose-500/30' : 'border-orange-500/30',
        icon_bg: isMissing ? 'bg-rose-500/20' : 'bg-orange-500/20',
        accent: isMissing ? 'text-rose-300' : 'text-orange-300',
        pulse: isMissing ? 'bg-rose-500' : 'bg-orange-500',
        action: isMissing ? () => document.getElementById('checkin-btn')?.click() : null,
        actionLabel: isMissing ? 'Check In Now' : null
      });
    }

    if (isOnTime && !dismissedAlerts.onTime) {
      alerts.push({
        key: 'onTime',
        emoji: '🙌',
        title: 'Great job!',
        subtitle: 'You arrived on time today. Keep up the excellent work! 🚀',
        gradient: 'from-emerald-500/20 via-teal-500/15 to-transparent',
        border: 'border-emerald-500/30',
        icon_bg: 'bg-emerald-500/20',
        accent: 'text-emerald-300',
        pulse: 'bg-emerald-500'
      });
    }

    if (forgotCheckout && !dismissedAlerts.forgotCheckout) {
      alerts.push({
        key: 'forgotCheckout',
        emoji: '🔔',
        title: 'Forgot to check out?',
        subtitle: "You are still marked as checked in. Don't forget to check out before you leave!",
        gradient: 'from-amber-500/20 via-yellow-500/15 to-orange-500/10',
        border: 'border-amber-500/30',
        icon_bg: 'bg-amber-500/20',
        accent: 'text-amber-300',
        pulse: 'bg-amber-400'
      });
    }

    return alerts;
  };

  const activeAlerts = computeAlertsArray();



  // ===================
  // MAIN RENDER
  // ===================

  if (dashboardData.loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient}`}>
      <MicroStyles />
      {/* Enhanced Header with Role-based Greeting */}
      <div className={`bg-gradient-to-r ${theme.headerGradient} border-b ${theme.muted.border} px-4 sm:px-8 py-6 sm:py-10 shadow-lg relative overflow-hidden`}>
        {/* Subtle pattern or overlay to break the solid red */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] -mr-48 -mt-48 opacity-40"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600 rounded-full blur-[100px] -ml-32 -mb-32 opacity-20"></div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <span className={`px-3 py-1 ${theme.muted.bg} rounded-full text-[10px] font-bold uppercase tracking-widest border ${theme.muted.border} ${theme.info.text}`}>
                {userRole?.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return `Good Morning, ${user?.first_name} 🌅`;
                if (hour < 17) return `Good Afternoon, ${user?.first_name} ☀️`;
                return `Good Evening, ${user?.first_name} 🌙`;
              })()}
            </h1>
            <p className="text-slate-400 mt-1 sm:mt-2 text-xs sm:text-sm font-medium flex items-center">
              <CalendarDaysIcon className={`h-4 w-4 mr-2 ${theme.info.text}`} />
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center">
            <div className="text-right">
              <div className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white drop-shadow-lg tabular-nums">
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


      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">

        {/* Today's Summary for Quick View */}
        <DailySummaryCard
          attendanceState={attendanceState}
          todayWindow={todayWindow}
          isManagerOnly={isManagerOnly}
          theme={theme}
        />

        {/* Gamification Hub */}
        <GamificationCard
          records={dashboardData.allAttendance || []}
          targetEmployeeId={user?.employee_id || user?.employee_pk || user?.id}
          isManagerOnly={isManagerOnly}
          theme={theme}
        />

        {/* Birthday Banner */}
        <BirthdayBanner data={birthdayFestivalData} theme={theme} />

        {/* Festival Banner */}
        <FestivalBanner data={birthdayFestivalData} theme={theme} />


        {/* On Leave and WFH Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <QuickAccessCard title="Who's on Leave Today" gradient={true} theme={theme}>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar-holiday">
              {(dashboardData.onLeaveToday?.length || 0) > 0 ? (
                dashboardData.onLeaveToday.map((leave, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${theme.info.bg.replace('/20', '/10')} border ${theme.info.border.replace('/30', '/20')} rounded-full flex items-center justify-center ${theme.info.text} text-xs font-black`}>
                        {leave.initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{leave.employee_name}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{leave.leave_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 ${theme.info.bg.replace('/20', '/10')} ${theme.info.text} border ${theme.info.border.replace('/30', '/20')} rounded-lg text-[10px] font-black uppercase tracking-widest`}>ON LEAVE</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center animate-pulse">
                  <div className={`w-16 h-16 ${theme.success.bg.replace('/20', '/10')} rounded-full flex items-center justify-center mb-4 border ${theme.success.border.replace('/30', '/20')} shadow-[0_0_20px_rgba(34,197,94,0.1)]`}>
                    <CheckCircleIcon className={`w-8 h-8 ${theme.success.text}`} />
                  </div>
                  <p className="text-white font-bold text-sm">Full Strength Today! 🎉</p>
                  <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-black">Everyone is available</p>
                </div>
              )}
            </div>
          </QuickAccessCard>

          <QuickAccessCard title="Who's Working From Home Today" gradient={true} theme={theme}>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar-holiday">
              {(dashboardData.wfhToday?.length || 0) > 0 ? (
                dashboardData.wfhToday.map((wfh, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${theme.warning.bg.replace('/20', '/10')} border ${theme.warning.border.replace('/30', '/20')} rounded-full flex items-center justify-center ${theme.warning.text} text-xs font-black`}>
                        {wfh.initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{wfh.employee_name}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Working Remote</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 ${theme.warning.bg.replace('/20', '/10')} ${theme.warning.text} border ${theme.warning.border.replace('/30', '/20')} rounded-lg text-[10px] font-black uppercase tracking-widest`}>WFH</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center animate-pulse">
                  <div className={`w-16 h-16 ${theme.info.bg.replace('/20', '/10')} rounded-full flex items-center justify-center mb-4 border ${theme.info.border.replace('/30', '/20')} shadow-[0_0_20px_rgba(99,102,241,0.1)]`}>
                    <BuildingOfficeIcon className={`w-8 h-8 ${theme.info.text}`} />
                  </div>
                  <p className="text-white font-bold text-sm">All Hands at Office 🏢</p>
                  <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-black">No remote sessions today</p>
                </div>
              )}
            </div>
          </QuickAccessCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {!isManagerOnly && attendanceState && (
              <QuickAccessCard title="⚡ Quick Access" className={`${theme.cardBg} ${theme.cardBorder} overflow-hidden relative shadow-2xl`} theme={theme}>
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-[70px]" />
                <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-violet-500/10 blur-[55px]" />

                <div className="relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        if (!effectiveIsCheckedIn && activeBiometricTodayRecordForUi) {
                          toast.info('Biometric session is active. Remote check-in/check-out stays separate.');
                          return;
                        }
                        if (!effectiveIsCheckedIn) {
                          handleCheckIn(false);
                          return;
                        }
                        handleCheckOut();
                      }}
                      disabled={submittingAttendance}
                      className={`group relative w-full overflow-hidden flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold transition-all duration-300 text-sm tracking-wider uppercase card-hover-lift smooth-transition ${effectiveIsCheckedIn
                        ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-[#ffffff] hover:brightness-110 shadow-xl shadow-rose-600/25 border border-rose-400/20 btn-glow-danger'
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-[#ffffff] hover:brightness-110 shadow-xl shadow-indigo-700/30 border border-indigo-400/20 btn-glow-primary'
                        }`}
                    >
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10" />
                      <span className="relative">{effectiveIsCheckedIn ? '🛑' : '✅'}</span>
                      <span className="relative">
                        {submittingAttendance ? 'PROCESSING...' : (effectiveIsCheckedIn ? 'CHECK OUT' : 'CHECK IN')}
                      </span>
                    </button>

                    <button
                      onClick={() => handleCheckIn(true)}
                      disabled={submittingAttendance || effectiveIsCheckedIn}
                      className="group relative w-full overflow-hidden flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold transition-all duration-300 text-sm tracking-wider uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-[#ffffff] hover:brightness-110 border border-amber-300/30 shadow-lg shadow-amber-600/25 disabled:opacity-50 disabled:cursor-not-allowed card-hover-lift smooth-transition btn-glow-primary"
                    >
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10" />
                      <span className="relative">🏠</span>
                      <span className="relative">WORK FROM HOME</span>
                    </button>

                    <Link
                      to="/leave"
                      className="group w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold transition-all duration-300 text-sm tracking-wider uppercase bg-white/5 border border-white/10 text-slate-900 dark:text-slate-200 hover:bg-white/10 hover:border-white/20"
                    >
                      <span>📝</span>
                      <span>APPLY LEAVE</span>
                    </Link>

                    <Link
                      to="/attendance"
                      className="group w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold transition-all duration-300 text-sm tracking-wider uppercase bg-white/5 border border-white/10 text-slate-900 dark:text-slate-200 hover:bg-white/10 hover:border-white/20"
                    >
                      <span>📅</span>
                      <span>VIEW ATTENDANCE</span>
                    </Link>
                  </div>
                </div>
              </QuickAccessCard>
            )}

            {/* Performance Trends Card */}
            <QuickAccessCard title="📈 Performance Trends" gradient={true} theme={theme}>
              {/* Visual Attendance Trends */}
              <div className="mb-6">
                <PerformanceTrends data={dashboardData.dailyStats || []} />
              </div>
              <p className="text-[9px] text-slate-500 italic opacity-75">* Stats are for the last completed week (Mon-Sun)</p>
            </QuickAccessCard>

            {/* Manager/HR Quick Access */}
            <QuickAccessCard title="🚀 Quick Access" className={`${theme.cardBg} ${theme.cardBorder} overflow-hidden shadow-2xl`} theme={theme}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Leave Management for Managers */}
                {isManagerOrAbove && (
                  <Link
                    to="/leave"
                    className="group flex items-center justify-center p-6 rounded-2xl border border-white/5 transition-all duration-300 transform hover:scale-105 shadow-2xl bg-white/5 backdrop-blur-xl hover:border-white/10 hover:bg-white/10"
                  >
                    <div className="text-center">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-all duration-500 bg-gradient-to-r ${theme.primaryGradient} group-hover:scale-110`}>
                        <CalendarDaysIcon className="h-7 w-7 text-[#ffffff]" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Manage Leaves</span>
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
                        <ClockIcon className="h-7 w-7 text-[#ffffff]" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">View Attendance</span>
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
                          <CalendarDaysIcon className="h-7 w-7 text-[#ffffff]" />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Apply Leave</span>
                      </div>
                    </Link>

                  </>
                )}
              </div>
            </QuickAccessCard>


            {/* Upcoming Timeline (Holiday & Leaves) */}
            <UpcomingTimeline 
              nextHoliday={dashboardData.nextHoliday}
              nextLeave={dashboardData.nextLeave}
              theme={theme}
            />

            <HolidaysModal
              isOpen={showHolidaysModal}
              onClose={() => setShowHolidaysModal(false)}
              data={allHolidays}
              theme={theme}
            />
            {/* Enhanced Upcoming Birthdays Card */}
            <QuickAccessCard title="🎂 Upcoming Birthdays" className="overflow-hidden" gradient={false} theme={theme}>
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
                    key={birthdayFestivalData.birthdays.upcoming_birthdays[0].id || 'birthday-single'}
                    birthday={birthdayFestivalData.birthdays.upcoming_birthdays[0]}
                    theme={theme}
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0B1120] via-transparent to-transparent z-10 pointer-events-none"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0B1120] via-transparent to-transparent z-10 pointer-events-none"></div>

                  <div className="overflow-x-auto pb-4 scrollbar-hide">
                    <div className="flex space-x-6 px-2" style={{ width: 'max-content' }}>
                      {birthdayFestivalData.birthdays.upcoming_birthdays.map((birthday) => (
                        <BirthdayCard key={birthday.id} birthday={birthday} theme={theme} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </QuickAccessCard>

            {/* Team Management for Managers */}
            {isManagerOrAbove && (
              <QuickAccessCard title="👥 Team Overview" gradient={true} theme={theme}>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl border ${theme.muted.border} ${theme.muted.bg}`}>
                      <div className={`text-2xl font-black ${theme.info.text}`}>{dashboardData.employees?.length || 0}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Employees</div>
                    </div>
                    <div className={`p-4 rounded-xl border ${theme.muted.border} ${theme.muted.bg}`}>
                      <div className={`text-2xl font-black ${theme.info.text}`}>{dashboardData.pendingLeaves?.length || 0}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pending Leaves</div>
                    </div>
                    <div className={`p-4 rounded-xl border ${theme.muted.border} ${theme.muted.bg}`}>
                      <div className={`text-2xl font-black ${theme.info.text}`}>{dashboardData.approvedLeaves?.length || 0}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Approved Leaves</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <Link
                      to="/employees"
                      className={`inline-flex items-center px-4 py-2 text-[#ffffff] font-semibold rounded-lg transition-all duration-300 shadow-lg transform hover:scale-105 bg-gradient-to-r ${theme.primaryGradient}`}
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
            <WorkingFormatCard />

            {/* Go to Workplace Card */}
            <QuickAccessCard title="🏢 Go to Workplace" gradient={true} theme={theme}>
              <div className="space-y-4">
                <div className={`p-5 rounded-xl border ${theme.muted.border} shadow-2xl text-center group transition-all duration-300 hover:border-white/10 bg-slate-900/60 backdrop-blur-xl`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-500 bg-gradient-to-r ${theme.primaryGradient} text-white`}>
                    <HomeIcon className="w-6 h-6 text-[#ffffff]" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">Avarta Workplace</h4>
                  <p className="text-xs text-slate-400 mb-4 font-medium">
                    Access your technical workspace and project management tools.
                  </p>
                  <a
                    href="https:/avarta.techoptima.ai/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center w-full px-6 py-3 text-[#ffffff] font-bold rounded-xl transition-all duration-300 shadow-lg transform hover:scale-[1.02] active:scale-95 bg-gradient-to-r ${theme.primaryGradient}`}
                  >
                    Go to Workplace
                    <span className="ml-2 text-lg">→</span>
                  </a>
                </div>
              </div>
            </QuickAccessCard>

            {/* Leave Balances - Only for Employees and HR Managers */}
            {!isManagerOnly && (
              <QuickAccessCard title="🏖️ Leave Balances" gradient={true} theme={theme}>
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
                      {dashboardData.leaveBalances?.slice(0, 4).map((balance, idx) => (
                        <LeaveBalanceCircle key={balance.id || `leave-${idx}`} balance={balance} theme={theme} />
                      ))}
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/5">
                    <Link
                      to="/leave"
                      className={`inline-flex items-center px-6 py-3 text-[#ffffff] font-bold rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 active:scale-95 bg-gradient-to-r ${theme.primaryGradient}`}
                    >
                      Request Leave
                      <span className="ml-2 text-xl">→</span>
                    </Link>
                  </div>
                </div>
              </QuickAccessCard>
            )}

            {/* Enhanced Birthdays Today & Upcoming */}
            <QuickAccessCard title="🎂 Birthdays & Celebrations" gradient={true} theme={theme}>
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
                      {birthdayFestivalData.birthdays.todays_birthdays.map((birthday, idx) => (
                        <div key={birthday.id || `today-bday-${idx}`} className="flex items-center space-x-3 p-4 bg-white/5 border border-white/5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
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
                      {birthdayFestivalData.birthdays.upcoming_birthdays.slice(0, 3).map((birthday, idx) => (
                        <div key={birthday.id || `upcoming-list-bday-${idx}`} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:shadow-sm transition-all duration-300">
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
            <QuickAccessCard title="⚡ Quick Actions" gradient={true} theme={theme}>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
                  <span className="text-sm font-bold text-slate-400 flex items-center uppercase tracking-tighter">
                    <ClockIcon className={`w-4 h-4 mr-2 ${theme.info.text}`} />
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
                        className={`group flex items-center justify-between p-4 rounded-xl border ${theme.muted.border} ${theme.muted.bg} hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-lg`}
                      >
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-tight">Team Attendance Reports</span>
                        <ChartBarIcon className={`w-5 h-5 ${theme.info.text} group-hover:text-indigo-300 transition-colors duration-300`} />
                      </Link>

                      <Link
                        to="/employees"
                        className={`group flex items-center justify-between p-4 ${theme.muted.bg} border ${theme.muted.border} rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg`}
                      >
                        <span className="text-sm font-semibold">Employee Management</span>
                        <UserGroupIcon className={`w-5 h-5 ${theme.info.text} group-hover:text-indigo-300 transition-colors duration-300`} />
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* Employee and HR Manager Quick Actions */}
                      <Link
                        to="/attendance"
                        className={`group flex items-center justify-between p-4 rounded-xl border ${theme.muted.border} ${theme.muted.bg} hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-lg`}
                      >
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-tight">View Attendance Records</span>
                        <ChartBarIcon className={`w-5 h-5 ${theme.info.text} group-hover:text-indigo-300 transition-colors duration-300`} />
                      </Link>

                      <Link
                        to="/leave"
                        className={`group flex items-center justify-between p-4 rounded-xl border ${theme.muted.border} ${theme.muted.bg} hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-lg`}
                      >
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-tight">Apply for Leave</span>
                        <CalendarDaysIcon className={`w-5 h-5 transition-colors duration-300 ${theme.info.text} group-hover:text-indigo-300`} />
                      </Link>

                      <Link
                        to="/work-from-home"
                        className={`group flex items-center justify-between p-4 rounded-xl border ${theme.muted.border} ${theme.muted.bg} hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow-lg`}
                      >
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-tight">Work From Home</span>
                        <HomeIcon className={`w-5 h-5 ${theme.info.text} group-hover:text-indigo-300 transition-colors duration-300`} />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </QuickAccessCard>

            {/* Enhanced Recent Activity - Role Based */}
            <QuickAccessCard title="📈 Recent Activity" gradient={true} theme={theme}>
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

      <HolidaysModal
        isOpen={showHolidaysModal}
        onClose={() => setShowHolidaysModal(false)}
        data={allHolidays}
        theme={theme}
      />

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
