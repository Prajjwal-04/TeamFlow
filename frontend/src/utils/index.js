import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';

export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  if (!date) return '—';
  try { return format(new Date(date), fmt); } catch { return '—'; }
};

export const formatRelative = (date) => {
  if (!date) return '';
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return ''; }
};

export const formatDueDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isToday(d)) return { label: 'Today', urgent: true };
  if (isTomorrow(d)) return { label: 'Tomorrow', urgent: true };
  if (isPast(d)) return { label: formatDate(date, 'MMM d'), overdue: true };
  return { label: formatDate(date, 'MMM d'), urgent: false };
};

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', dot: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', dot: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', dot: 'bg-yellow-500' },
  low: { label: 'Low', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', dot: 'bg-green-500' }
};

export const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', icon: '○' },
  in_progress: { label: 'In Progress', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: '◐' },
  done: { label: 'Done', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', icon: '●' }
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
