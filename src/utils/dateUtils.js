/**
 * Date and Timezone Utilities configured for Asia/Kolkata
 */

export const DEFAULT_TIMEZONE = import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata';

/**
 * Normalizes any timestamp representation (Firestore Timestamp, ISO string, epoch ms, Date) to a JS Date.
 * @param {any} value
 * @returns {Date|null}
 */
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  // Firestore Timestamp with toDate()
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  // Firestore Timestamp object { seconds, nanoseconds }
  if (typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  // Numeric timestamp (seconds or milliseconds)
  if (typeof value === 'number') {
    return new Date(value > 1e11 ? value : value * 1000);
  }
  // ISO string or date string
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/**
 * Returns formatted date in YYYY-MM-DD for the given timezone.
 * Defaults to current date if no date passed.
 * @param {Date|string|number} [date]
 * @param {string} [timeZone]
 * @returns {string} e.g. '2026-09-23'
 */
export function getLocalDateString(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const d = toDate(date) || new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

/**
 * Returns the start of the date (00:00:00.000) and end of the date (23:59:59.999)
 * for a given YYYY-MM-DD string in the target timezone.
 * @param {string} dateString 'YYYY-MM-DD'
 * @param {string} [timeZone]
 * @returns {{ start: Date, end: Date }}
 */
export function getDateBoundaries(dateString, timeZone = DEFAULT_TIMEZONE) {
  // If invalid string, fallback to today
  const targetDateStr = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? dateString
    : getLocalDateString(new Date(), timeZone);

  // Construct start of day in ISO with timezone offset
  // We can calculate offset safely using Intl
  const parts = targetDateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  // Use Asia/Kolkata (+05:30) or dynamic calculation
  const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  // Offset by timezone difference
  const tzOffsetMs = getTimezoneOffsetMs(timeZone, start);
  const localStart = new Date(start.getTime() - tzOffsetMs);
  const localEnd = new Date(localStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  return { start: localStart, end: localEnd };
}

/**
 * Computes timezone offset in milliseconds for a specific date
 */
function getTimezoneOffsetMs(timeZone, date) {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  return tzDate.getTime() - utcDate.getTime();
}

/**
 * Formats a timestamp into human-readable local time (e.g. "09:42:15 AM")
 */
export function formatLocalTime(value, timeZone = DEFAULT_TIMEZONE) {
  const d = toDate(value);
  if (!d) return '--:--';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Formats a timestamp into human-readable full date and time
 */
export function formatLocalDateTime(value, timeZone = DEFAULT_TIMEZONE) {
  const d = toDate(value);
  if (!d) return '--';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Formats a timestamp into time in HH:mm 24-hour format
 */
export function formatTo24HourTime(value, timeZone = DEFAULT_TIMEZONE) {
  const d = toDate(value);
  if (!d) return '00:00';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const hour = parts.find((p) => p.type === 'hour')?.value || '00';
  const minute = parts.find((p) => p.type === 'minute')?.value || '00';
  return `${hour}:${minute}`;
}

/**
 * Returns day of week short name (e.g. 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')
 */
export function getDayOfWeek(value, timeZone = DEFAULT_TIMEZONE) {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(d);
}
