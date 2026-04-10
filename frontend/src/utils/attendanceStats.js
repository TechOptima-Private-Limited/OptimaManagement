/**
 * Shared attendance metrics so Dashboard and Attendance page stay consistent.
 */

export function recordDurationMinutes(r) {
  if (!r?.check_in_time || !r?.check_out_time) return 0;
  const start = new Date(`2000-01-01T${r.check_in_time}`);
  const end = new Date(`2000-01-01T${r.check_out_time}`);
  return Math.max(0, Math.floor((end - start) / 60000));
}

/** Monday date (YYYY-MM-DD) of the ISO-style week containing dateStr, local calendar. */
export function mondayKey(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysFromMonday);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayNum = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayNum}`;
}

export function filterRecordsForEmployee(records, targetEmployeeId) {
  if (!targetEmployeeId) return [];
  return records.filter((r) => {
    const recordId =
      r.display_id ||
      r.employee_id ||
      (r.employee && (r.employee.employee_id || r.employee.id)) ||
      (r.employee_details && r.employee_details.employee_id);
    return recordId != null && String(recordId) === String(targetEmployeeId);
  });
}

export function getApprovedWorkingRecords(records, targetEmployeeId) {
  const approved = (records || []).filter((r) => !r.is_pending_approval);
  const mine = filterRecordsForEmployee(approved, targetEmployeeId);
  return mine.filter((r) => r.check_in_time && r.check_out_time);
}

/**
 * Average minutes per working day in the current Mon–Sun week, with fallback
 * (same as AttendanceTracker): average of each week’s daily average in the range.
 */
export function getAvgMinutesPerDayInWeek(records, targetEmployeeId) {
  const workingRecords = getApprovedWorkingRecords(records, targetEmployeeId);
  if (workingRecords.length === 0) return 0;

  const pad2 = (n) => String(n).padStart(2, '0');
  const todayLocal = new Date();
  const todayStr = `${todayLocal.getFullYear()}-${pad2(todayLocal.getMonth() + 1)}-${pad2(todayLocal.getDate())}`;
  const thisWeekMonday = mondayKey(todayStr);
  const recordsThisWeek = workingRecords.filter((r) => mondayKey(r.date) === thisWeekMonday);

  if (recordsThisWeek.length > 0) {
    const weekTotal = recordsThisWeek.reduce((sum, r) => sum + recordDurationMinutes(r), 0);
    return Math.round(weekTotal / recordsThisWeek.length);
  }

  const minutesByWeek = {};
  const daysByWeek = {};
  for (const r of workingRecords) {
    const mins = recordDurationMinutes(r);
    const wk = mondayKey(r.date);
    minutesByWeek[wk] = (minutesByWeek[wk] || 0) + mins;
    daysByWeek[wk] = (daysByWeek[wk] || 0) + 1;
  }
  const weekKeys = Object.keys(minutesByWeek);
  return Math.round(
    weekKeys.reduce((sum, wk) => sum + minutesByWeek[wk] / daysByWeek[wk], 0) / weekKeys.length
  );
}

/**
 * Average total minutes per week across the given records.
 * Groups by week (Monday-based) and averages the weekly sums.
 */
export function getAvgMinutesPerWeek(records, targetEmployeeId) {
  const workingRecords = getApprovedWorkingRecords(records, targetEmployeeId);
  if (workingRecords.length === 0) return 0;

  const minutesByWeek = {};
  for (const r of workingRecords) {
    const mins = recordDurationMinutes(r);
    const wk = mondayKey(r.date);
    minutesByWeek[wk] = (minutesByWeek[wk] || 0) + mins;
  }
  const weekTotals = Object.values(minutesByWeek);
  return Math.round(weekTotals.reduce((sum, total) => sum + total, 0) / weekTotals.length);
}

/**
 * Total minutes worked in the current (Monday-based) week so far.
 */
export function getTotalMinutesThisWeek(records, targetEmployeeId) {
  const workingRecords = getApprovedWorkingRecords(records, targetEmployeeId);
  if (workingRecords.length === 0) return 0;

  const pad2 = (n) => String(n).padStart(2, '0');
  const todayLocal = new Date();
  const todayStr = `${todayLocal.getFullYear()}-${pad2(todayLocal.getMonth() + 1)}-${pad2(todayLocal.getDate())}`;
  const thisWeekMonday = mondayKey(todayStr);

  return workingRecords
    .filter((r) => mondayKey(r.date) === thisWeekMonday)
    .reduce((sum, r) => sum + recordDurationMinutes(r), 0);
}

/**
 * Returns { start, end } (YYYY-MM-DD) for the previous (completed) Monday-Sunday week.
 */
export function getLastWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - (day === 0 ? 7 : day));

  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastSunday.getDate() - 6);

  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return { start: fmt(lastMonday), end: fmt(lastSunday) };
}

/**
 * Calculates stats for a given employee and period.
 * Returns { avgMinutes: Number, onTimePercent: Number }
 */
export function getStatsForPeriod(records, employeeId, startDate, endDate) {
  const inPeriod = records.filter(r => r.date >= startDate && r.date <= endDate);
  const employeeRecords = inPeriod.filter(r => {
    const rId = r.display_id || r.employee_id || (r.employee && (r.employee.employee_id || r.employee.id));
    return String(rId) === String(employeeId);
  });

  const working = employeeRecords.filter(r => r.check_in_time && r.check_out_time && !r.is_pending_approval);
  const late = (t) => {
    if (!t) return false;
    const [h, m] = t.split(':').map(Number);
    return h > 10 || (h === 10 && m > 0);
  };

  const presentOnTime = working.filter(r => r.status === 'PRESENT' && !late(r.check_in_time)).length;
  const onTimeBase = working.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;

  const totalMinutes = working.reduce((sum, r) => sum + recordDurationMinutes(r), 0);
  const avgMinutes = working.length > 0 ? Math.round(totalMinutes / working.length) : 0;
  const onTimePercent = onTimeBase > 0 ? Math.round((presentOnTime / onTimeBase) * 100) : 0;

  return { avgMinutes, onTimePercent };
}

export function formatMinutesAsHhMm(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${min}m`;
}
