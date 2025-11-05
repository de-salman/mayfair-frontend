import dayjs from 'dayjs';

// Date formatters
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatTime = (time) => {
  if (!time) return '';
  return dayjs(time, 'HH:mm').format('h:mm A');
};

// Number formatters
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number);
};

// Status formatters
export const formatStatus = (status) => {
  const statusMap = {
    scheduled: { label: 'Scheduled', color: 'blue' },
    delayed: { label: 'Delayed', color: 'yellow' },
    cancelled: { label: 'Cancelled', color: 'red' },
    completed: { label: 'Completed', color: 'green' },
    'in-progress': { label: 'In Progress', color: 'purple' },
    active: { label: 'Active', color: 'green' },
    inactive: { label: 'Inactive', color: 'gray' },
    pending: { label: 'Pending', color: 'yellow' },
    draft: { label: 'Draft', color: 'gray' },
    paused: { label: 'Paused', color: 'orange' },
  };

  return statusMap[status] || { label: status, color: 'gray' };
};

// Role formatters
export const formatRole = (role) => {
  const roleMap = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    user: 'User',
  };
  return roleMap[role] || role;
};

// Text formatters
export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatCurrency,
  formatNumber,
  formatStatus,
  formatRole,
  truncate,
  capitalize,
};


