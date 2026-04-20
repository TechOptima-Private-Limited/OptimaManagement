import React from 'react';

const StatusBadge = ({ status, type = 'default' }) => {
  const getStatusColor = () => {
    const colors = {
      // Leave statuses
      PENDING: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      APPROVED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      REJECTED: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      CANCELLED: 'bg-slate-900/20 text-slate-400 border border-slate-500/30',

      // Attendance statuses
      PRESENT: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      ABSENT: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      LATE: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      HALF_DAY: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      WEEK_OFF: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
      ON_LEAVE: 'bg-teal-500/20 text-teal-400 border border-teal-500/30',

      // Employee statuses
      ACTIVE: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      INACTIVE: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      TERMINATED: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',

      // Onboarding statuses
      COMPLETED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      IN_PROGRESS: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    };

    return colors[status] || 'bg-slate-900/20 text-slate-400 border border-slate-500/30';
  };

  const formatStatus = (s) => {
    if (!s) return '';
    return s.replace(/_/g, ' ');
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;
