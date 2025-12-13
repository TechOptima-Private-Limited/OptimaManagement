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

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;