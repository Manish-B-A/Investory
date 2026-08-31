/**
 * Format a number in Indian numbering system with ₹ symbol.
 * Examples: 12000 → ₹12,000 | 125000 → ₹1,25,000 | 1050000 → ₹10,50,000
 */
export function formatINR(value: number | null | undefined): string {
  if (value === null || value === undefined) return '₹0';
  const absValue = Math.abs(Math.round(value));
  const sign = value < 0 ? '-' : '';
  const str = absValue.toString();

  if (str.length <= 3) {
    return `${sign}₹${str}`;
  }

  // Last 3 digits
  const last3 = str.substring(str.length - 3);
  let remaining = str.substring(0, str.length - 3);

  // Group remaining digits in pairs from right
  const groups: string[] = [];
  while (remaining.length > 2) {
    groups.unshift(remaining.substring(remaining.length - 2));
    remaining = remaining.substring(0, remaining.length - 2);
  }
  if (remaining.length > 0) {
    groups.unshift(remaining);
  }

  return `${sign}₹${groups.join(',')},${last3}`;
}

/**
 * Format a month string (YYYY-MM) to readable format.
 * Example: 2026-08 → August 2026
 */
export function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/**
 * Get current month in YYYY-MM format.
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get next month from a given YYYY-MM string.
 */
export function getNextMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m); // m is already 0-indexed +1, so this gives next month
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

/**
 * Get previous month from a given YYYY-MM string.
 */
export function getPreviousMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 2); // m-1 is current 0-indexed, m-2 is previous
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

/**
 * Get short month name. Example: 2026-08 → Aug 2026
 */
export function formatMonthShort(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/**
 * Get time-of-day greeting.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Generate a range of months from start to end (inclusive).
 */
export function generateMonthRange(from: string, to: string): string[] {
  const months: string[] = [];
  let current = from;
  while (current <= to) {
    months.push(current);
    current = getNextMonth(current);
  }
  return months;
}

/**
 * Get months ago from current month.
 */
export function getMonthsAgo(count: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - count);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

/**
 * Get start of year in YYYY-MM format.
 */
export function getStartOfYear(year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `${y}-01`;
}

/**
 * Get end of year in YYYY-MM format.
 */
export function getEndOfYear(year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `${y}-12`;
}
