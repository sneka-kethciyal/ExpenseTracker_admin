import { toDate, formatTo24HourTime, getDayOfWeek, DEFAULT_TIMEZONE } from './dateUtils';

/**
 * Standard days of the week abbreviation
 */
export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Checks whether a given timestamp falls within an assigned schedule.
 * Rule: Start time is inclusive, End time is exclusive:
 *       startTime <= time < endTime
 *
 * @param {Date|any} timestamp
 * @param {Object} schedule
 * @param {string} [timeZone]
 * @returns {boolean}
 */
export function isWithinSchedule(timestamp, schedule, timeZone = DEFAULT_TIMEZONE) {
  if (!schedule || !schedule.start_time || !schedule.end_time) {
    // If no schedule configured, default to true or false depending on policy
    return true;
  }

  const d = toDate(timestamp);
  if (!d) return false;

  const tz = schedule.timezone || timeZone || DEFAULT_TIMEZONE;

  // 1. Day of week check
  if (Array.isArray(schedule.active_days) && schedule.active_days.length > 0) {
    const dayName = getDayOfWeek(d, tz);
    if (!schedule.active_days.includes(dayName)) {
      return false;
    }
  }

  // 2. Time comparison (HH:mm)
  const currentHHMM = formatTo24HourTime(d, tz);
  const startHHMM = schedule.start_time; // e.g. '09:00'
  const endHHMM = schedule.end_time;     // e.g. '18:00'

  if (startHHMM <= endHHMM) {
    // Normal same-day shift: start_time <= current < end_time
    return currentHHMM >= startHHMM && currentHHMM < endHHMM;
  } else {
    // Overnight shift (e.g. 22:00 to 06:00):
    // Active if current >= 22:00 OR current < 06:00
    return currentHHMM >= startHHMM || currentHHMM < endHHMM;
  }
}

/**
 * Returns human-readable summary of schedule
 * e.g. "Mon - Fri, 09:00 - 18:00 (Asia/Kolkata)"
 */
export function formatScheduleSummary(schedule) {
  if (!schedule) return 'No schedule assigned';
  const days = Array.isArray(schedule.active_days) && schedule.active_days.length > 0
    ? schedule.active_days.join(', ')
    : 'All days';
  const start = schedule.start_time || '09:00';
  const end = schedule.end_time || '18:00';
  const tz = schedule.timezone || DEFAULT_TIMEZONE;
  return `${days} | ${start} – ${end} (${tz})`;
}

/**
 * Validates schedule fields
 */
export function validateSchedule(schedule) {
  const errors = {};
  if (!schedule.start_time) errors.start_time = 'Start time is required';
  if (!schedule.end_time) errors.end_time = 'End time is required';
  if (schedule.start_time && schedule.end_time && schedule.start_time === schedule.end_time) {
    errors.end_time = 'End time cannot be identical to start time';
  }
  if (!Array.isArray(schedule.active_days) || schedule.active_days.length === 0) {
    errors.active_days = 'At least one active day must be selected';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
