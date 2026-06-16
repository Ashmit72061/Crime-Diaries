import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Format an ISO date string or Date object.
 * @param {string|Date} date
 * @param {string} [fmt='MMM d, yyyy']
 */
export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, fmt) : 'Invalid date';
};

/**
 * Relative time — "3 hours ago", "2 days ago".
 * @param {string|Date} date
 */
export const timeAgo = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : 'Unknown';
};

/**
 * Format a number with commas — 1000 → "1,000".
 */
export const formatNumber = (n) => new Intl.NumberFormat().format(n);

/**
 * Truncate text to a max length with ellipsis.
 */
export const truncate = (text, maxLength = 100) =>
  text?.length > maxLength ? `${text.slice(0, maxLength)}…` : text;

/**
 * Capitalize first letter of each word.
 */
export const titleCase = (str) =>
  str?.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) ?? '';

/**
 * Extract initials from a name (e.g., "John Doe" → "JD").
 */
export const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
