// src/app/shared/utils/date-utils.ts

/**
 * Formats a date string or Date object to a human-readable string (e.g., 'Sep 20, 2025')
 * @param date - ISO string or Date object
 * @returns formatted date string
 */
export function formatDateHuman(date: string | Date): string {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return typeof date === 'string' ? date : date.toString();
  }
}
