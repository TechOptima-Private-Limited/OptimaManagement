import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

import {
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { attendanceAPI } from '../../services/api';

/* ─────────────────────────────────────────────
   Custom Tooltip for Attendance % chart
───────────────────────────────────────────── */
const AttendanceTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/5/95 dark:bg-slate-900/95 border border-indigo-500/30 rounded-xl p-3 shadow-2xl backdrop-blur-xl">
      <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-slate-300">{entry.name}:</span>
          <span className="text-xs text-white">
            {entry.name === 'Attendance %' ? `${entry.value}%` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Summary KPI Card
───────────────────────────────────────────── */
const KpiCard = ({ label, value, suffix = '', icon: Icon, color, trend }) => (
  <div className={`relative bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-5 overflow-hidden group hover:border-${color}-500/40 transition-all duration-300`}>
    <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-white">
          {value}{suffix}
        </p>
        {trend && (
          <p className="text-xs text-slate-400 mt-1">{trend}</p>
        )}
      </div>
      <div className={`p-2.5 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}>
        <Icon className={`h-5 w-5 text-${color}-400`} />
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main AttendanceTrends Component
───────────────────────────────────────────── */
const AttendanceTrends = ({ theme, attendanceRecords = [], isManagementRole = false }) => {
  const [period, setPeriod] = useState('weekly');
  const [activeChart, setActiveChart] = useState('attendance');
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  // Fetch from backend
  const fetchTrends = async (selectedPeriod) => {
    setLoading(true);
    try {
      const days = selectedPeriod === 'weekly' ? 56 : 180; // 8 weeks or 6 months
      const res = await attendanceAPI.getAttendanceTrends({ period: selectedPeriod, days });
      setApiData(res.data);
      setLastFetched(selectedPeriod);
    } catch (err) {
      console.error('Failed to fetch attendance trends:', err);
      setApiData(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount or period change if not already fetched
  React.useEffect(() => {
    if (lastFetched !== period) {
      fetchTrends(period);
    }
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback: compute trends from local records if API fails or is loading
  const localTrend = useMemo(() => {
    if (!attendanceRecords.length) return [];

    const isLate = (t) => {
      if (!t) return false;
      const [h, m] = t.split(':').map(Number);
      return h > 10 || (h === 10 && m > 0);
    };

    const getWeekKey = (dateStr) => {
      const d = new Date(`${dateStr}T12:00:00`);
      const day = d.getDay();
      const daysFromMon = day === 0 ? 6 : day - 1;
      const mon = new Date(d);
      mon.setDate(d.getDate() - daysFromMon);
      return mon.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    };

    const getMonthKey = (dateStr) => {
      const d = new Date(`${dateStr}T12:00:00`);
      return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    };

    const getBucketKey = period === 'weekly' ? getWeekKey : getMonthKey;

    // Deduplicate: one entry per (empId, date) — prefer PRESENT > LATE > ABSENT
    const STATUS_PRIORITY = { PRESENT: 3, LATE: 2, HALF_DAY: 1, ABSENT: 0 };
    const seen = {};

    attendanceRecords.forEach((r) => {
      if (!r.date || r.is_pending_approval) return;
      const empId =
        r.display_id ||
        (r.employee && (r.employee.employee_id || r.employee.id)) ||
        r.employee_id ||
        'self';
      const key = `${empId}__${r.date}`;
      const newP = STATUS_PRIORITY[r.status] ?? -1;
      const oldP = STATUS_PRIORITY[seen[key]?.status] ?? -1;
      if (!seen[key] || newP > oldP) {
        seen[key] = { empId, date: r.date, status: r.status, check_in_time: r.check_in_time };
      }
    });

    // Bucket the deduplicated records
    const buckets = {};
    Object.values(seen).forEach((rec) => {
      const bucketKey = getBucketKey(rec.date);
      if (!buckets[bucketKey]) buckets[bucketKey] = { totalKeys: new Set(), presentKeys: new Set(), lateKeys: new Set() };
      const empDay = `${rec.empId}__${rec.date}`;
      buckets[bucketKey].totalKeys.add(empDay);
      if (rec.status === 'PRESENT' || rec.status === 'LATE') buckets[bucketKey].presentKeys.add(empDay);
      if (isLate(rec.check_in_time)) buckets[bucketKey].lateKeys.add(empDay);
    });

    // Helper: count Mon–Fri working days in a range
    const countWorkingDays = (startDate, endDate) => {
      let count = 0;
      const d = new Date(startDate);
      while (d <= endDate) {
        if (d.getDay() !== 0 && d.getDay() !== 6) count++;
        d.setDate(d.getDate() + 1);
      }
      return count;
    };

    // Total unique employees seen in data
    const allEmpIds = new Set(Object.values(seen).map((r) => r.empId));
    const totalEmps = allEmpIds.size || 1;

    // Build bucket date ranges
    const bucketRanges = {};
    const sortedDates = Object.values(seen).map((r) => r.date).sort();
    const periodStart = new Date(`${sortedDates[0]}T12:00:00`);
    const periodEnd = new Date(`${sortedDates[sortedDates.length - 1]}T12:00:00`);
    const cur = new Date(periodStart);
    while (cur <= periodEnd) {
      const dateStr = cur.toISOString().split('T')[0];
      const key = getBucketKey(dateStr);
      if (!bucketRanges[key]) {
        if (period === 'weekly') {
          const dayOfWeek = cur.getDay();
          const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const mon = new Date(cur);
          mon.setDate(cur.getDate() - daysFromMon);
          const sun = new Date(mon);
          sun.setDate(mon.getDate() + 6);
          bucketRanges[key] = { start: new Date(Math.max(mon, periodStart)), end: new Date(Math.min(sun, periodEnd)) };
        } else {
          const firstDay = new Date(cur.getFullYear(), cur.getMonth(), 1);
          const lastDay = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
          bucketRanges[key] = { start: new Date(Math.max(firstDay, periodStart)), end: new Date(Math.min(lastDay, periodEnd)) };
        }
      }
      cur.setDate(cur.getDate() + 1);
    }

    const maxBuckets = period === 'weekly' ? 8 : 6;
    return Object.entries(buckets)
      .slice(-maxBuckets)
      .map(([label, s]) => {
        const range = bucketRanges[label];
        const workingDays = range ? countWorkingDays(range.start, range.end) : 5;
        const expected = totalEmps * workingDays;
        const pct = expected > 0
          ? Math.min(100, Math.round((s.presentKeys.size / expected) * 100))
          : 0;
        return { label, attendance_pct: pct, late_count: s.lateKeys.size };
      });
  }, [attendanceRecords, period]);




  const chartDataRaw = apiData?.trend?.length ? apiData.trend : localTrend;
  const maxItems = period === 'weekly' ? 8 : 6;
  const chartData = chartDataRaw.slice(-maxItems);
  
  const summary = apiData?.summary || null;

  // Compute local summary fallback if needed
  const avgPct = summary?.avg_attendance_pct ??
    (chartData.length ? Math.round(chartData.reduce((s, d) => s + d.attendance_pct, 0) / chartData.length) : 0);
  
  // Use backend summary metrics if available for more accuracy
  const totalLate = summary?.total_late_arrivals ??
    chartData.reduce((s, d) => s + d.late_count, 0);
  
  const totalPresent = summary?.total_present_person_days ?? 
    chartData.reduce((s, d) => s + (d.present_employee_days || 0), 0);
  const bestPct = summary?.best_attendance_pct ??
    (chartData.length ? Math.max(...chartData.map(d => d.attendance_pct)) : 0);
  const worstPct = summary?.worst_attendance_pct ??
    (chartData.length ? Math.min(...chartData.map(d => d.attendance_pct)) : 0);

  const trend = chartData.length >= 2
    ? chartData[chartData.length - 1].attendance_pct - chartData[0].attendance_pct
    : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
            <ChartBarIcon className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Attendance Analytics</h3>
            <p className="text-xs text-slate-400">
              {period === 'weekly' ? 'Last 8 weeks' : 'Last 6 months'} trend
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Period Toggle */}
          <div className="flex bg-white/5 border border-white/10 dark:border-white/10 rounded-xl p-1">
            {['weekly', 'monthly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                  period === p
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'weekly' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchTrends(period)}
            disabled={loading}
            className="p-2 rounded-xl bg-white/5 border border-white/10 dark:border-white/10 text-slate-400 hover:text-white hover:border-indigo-500/40 transition-all"
            title="Refresh data"
          >
            <SparklesIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Avg Attendance"
          value={avgPct}
          suffix="%"
          icon={UserGroupIcon}
          color="indigo"
          trend={trend >= 0 ? `↑ ${Math.abs(trend).toFixed(1)}% over period` : `↓ ${Math.abs(trend).toFixed(1)}% over period`}
        />
        <KpiCard
          label="Late Arrivals"
          value={totalLate}
          icon={ClockIcon}
          color="amber"
          trend={`Total across ${chartData.length} ${period === 'weekly' ? 'weeks' : 'months'}`}
        />
        <KpiCard
          label="Best Period"
          value={bestPct}
          suffix="%"
          icon={CheckCircleIcon}
          color="emerald"
          trend="Highest attendance %"
        />
        <KpiCard
          label="Lowest Period"
          value={worstPct}
          suffix="%"
          icon={ExclamationTriangleIcon}
          color="rose"
          trend="Lowest attendance %"
        />
      </div>

      {/* ── Chart Type Selector ── */}
      <div className="flex bg-white/5 border border-white/10 dark:border-white/10 rounded-xl p-1 w-fit">
        {[
          { id: 'attendance', label: 'Attendance %', icon: ArrowTrendingUpIcon },
          { id: 'late', label: 'Late Arrivals', icon: ExclamationTriangleIcon },
          { id: 'combined', label: 'Combined', icon: ChartBarIcon },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveChart(id)}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeChart === id
                ? 'bg-black/10 dark:bg-white/5/10 text-white border border-black/20 dark:border-white/20 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className={`bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm ${loading ? 'opacity-60' : ''}`}>
        {loading && (
          <div className="flex items-center justify-center py-4 mb-4">
            <div className="text-xs text-indigo-400 animate-pulse font-semibold tracking-widest uppercase">Loading trend data…</div>
          </div>
        )}

        {chartData.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ChartBarIcon className="h-12 w-12 text-slate-600 mb-4" />
            <p className="text-slate-500 font-semibold">No attendance data for this period</p>
            <p className="text-slate-600 text-sm mt-1">Attendance records will appear here once available</p>
          </div>
        ) : (
          <>
            {/* Attendance % Area Chart */}
            {(activeChart === 'attendance' || activeChart === 'combined') && (
              <div className="mb-6">
                {activeChart === 'combined' && (
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">Attendance Rate</p>
                )}
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<AttendanceTooltip />} />
                    <ReferenceLine y={80} stroke="rgba(99,102,241,0.3)" strokeDasharray="4 4" label={{ value: '80%', fill: '#6366f1', fontSize: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="attendance_pct"
                      name="Attendance %"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#attendanceGradient)"
                      dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#818cf8', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Late Arrivals Bar Chart */}
            {(activeChart === 'late' || activeChart === 'combined') && (
              <div>
                {activeChart === 'combined' && (
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">Late Arrivals</p>
                )}
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={period === 'weekly' ? 18 : 24}>
                    <defs>
                      <linearGradient id="lateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<AttendanceTooltip />} />
                    <Bar
                      dataKey="late_count"
                      name="Late Arrivals"
                      fill="url(#lateGradient)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Insights row ── */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-5">
            <div className="flex items-center space-x-2 mb-3">
              <ArrowTrendingUpIcon className="h-4 w-4 text-indigo-400" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attendance Trend</p>
            </div>
            <div className="flex items-baseline space-x-2">
              {trend >= 0 ? (
                <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <ArrowTrendingDownIcon className="h-5 w-5 text-rose-400 flex-shrink-0" />
              )}
              <p className={`text-base font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% from first to last period
              </p>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {trend >= 0 ? 'Attendance is improving over time ✓' : 'Attendance needs attention this period'}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-5">
            <div className="flex items-center space-x-2 mb-3">
              <ClockIcon className="h-4 w-4 text-amber-400" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Punctuality Insight</p>
            </div>
            {(() => {
              const maxLate = chartData.reduce((max, d) => d.late_count > max.late_count ? d : max, chartData[0]);
              const minLate = chartData.reduce((min, d) => d.late_count < min.late_count ? d : min, chartData[0]);
              return (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Most late:</span>
                    <span className="text-xs font-bold text-amber-400">{maxLate?.label} — {maxLate?.late_count} late</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Best punctuality:</span>
                    <span className="text-xs font-bold text-emerald-400">{minLate?.label} — {minLate?.late_count} late</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Late arrival rate:</span>
                    <span className="text-xs font-bold text-white">
                      {totalPresent > 0 ? `${Math.round((totalLate / totalPresent) * 100)}%` : '—'} of check-ins
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTrends;
