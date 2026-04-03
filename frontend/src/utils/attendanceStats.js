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

export function formatMinutesAsHhMm(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${min}m`;
}
