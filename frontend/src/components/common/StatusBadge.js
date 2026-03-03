import React from 'react';

const StatusBadge = ({ status, type = 'default' }) => {
  const getStatusColor = () => {
    const colors = {
      // Leave statuses
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',

      // Attendance statuses
      PRESENT: 'bg-green-100 text-green-800',
      ABSENT: 'bg-red-100 text-red-800',
      LATE: 'bg-yellow-100 text-yellow-800',
      HALF_DAY: 'bg-blue-100 text-blue-800',
      WEEK_OFF: 'bg-purple-100 text-purple-800',
      ON_LEAVE: 'bg-teal-100 text-teal-800',

      // Employee statuses
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-yellow-100 text-yellow-800',
      TERMINATED: 'bg-red-100 text-red-800',

      // Onboarding statuses
      COMPLETED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
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