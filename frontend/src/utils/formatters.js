import { format, parseISO } from 'date-fns';

export const formatDate = (date, formatString = 'MMM dd, yyyy') => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    return '';
  }
};

export const formatDateTime = (datetime, formatString = 'MMM dd, yyyy HH:mm') => {
  if (!datetime) return '';
  try {
    const dateObj = typeof datetime === 'string' ? parseISO(datetime) : datetime;
    return format(dateObj, formatString);
  } catch (error) {
    return '';
  }
};

export const formatTime = (time, formatString = 'hh:mm:ss a') => {
  if (!time) return '';
  try {
    const timeObj = typeof time === 'string' ? parseISO(time) : time;
    if (isNaN(timeObj.getTime())) {
      // Fallback for just time strings like "10:00:00"
      const now = new Date();
      const [h, m, s] = String(time).split(':');
      now.setHours(parseInt(h) || 0, parseInt(m) || 0, parseInt(s) || 0);
      return format(now, formatString);
    }
    return format(timeObj, formatString);
  } catch (error) {
    return '';
  }
};

export const formatCurrency = (amount) => {
  if (!amount) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
