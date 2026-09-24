import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { getDateBoundaries, toDate, DEFAULT_TIMEZONE } from '../utils/dateUtils';
import { isWithinSchedule } from '../utils/scheduleUtils';
import { isValidCoordinate } from '../utils/validationUtils';

/**
 * Fetches and filters GPS location records for a selected user, strictly for the selected date,
 * filtered by the user's assigned group schedule.
 *
 * @param {string} userId - User UID
 * @param {string} selectedDate - 'YYYY-MM-DD'
 * @param {Object} groupSchedule - Active schedule for the user's group
 * @param {string} [sortOrder='desc'] - 'asc' or 'desc'
 * @returns {Promise<{ records: Array, totalFetched: number, withinScheduleCount: number }>}
 */
export async function getUserGeoLocations(userId, selectedDate, groupSchedule, sortOrder = 'desc') {
  if (!userId) {
    return { records: [], totalFetched: 0, withinScheduleCount: 0 };
  }

  const tz = groupSchedule?.timezone || DEFAULT_TIMEZONE;
  const { start, end } = getDateBoundaries(selectedDate, tz);

  const startTimestamp = Timestamp.fromDate(start);
  const endTimestamp = Timestamp.fromDate(end);

  const locationsRef = collection(db, 'users', userId, 'geo_locations');

  let rawDocs = [];

  try {
    // Standard Firestore timestamp range query
    const q = query(
      locationsRef,
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<=', endTimestamp),
      orderBy('timestamp', sortOrder)
    );
    const snap = await getDocs(q);
    rawDocs = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    // A type/field mismatch can produce an empty snapshot without an error.
    // Read the collection so string timestamps and alternate Flutter fields are handled.
    if (rawDocs.length === 0) {
      const fallbackSnap = await getDocs(locationsRef);
      rawDocs = fallbackSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    }
  } catch (err) {
    // If composite index is building or timestamps are stored as ISO strings / numbers,
    // fetch user's locations and perform robust in-memory date boundary filtering
    console.warn('Falling back to client-side date boundary filter:', err.message);
    const snap = await getDocs(locationsRef);
    rawDocs = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  }

  // 1. Strict Date Filter: Ensure each record strictly falls between start and end of selected date
  const getRecordDate = (record) => toDate(
    record.timestamp
      || record.created_at
      || record.recorded_at
      || record.location_time
      || record.date
      || record.createdAt
  );

  const dateFiltered = rawDocs.map((record) => ({
    ...record,
    timestamp: record.timestamp || record.created_at || record.recorded_at || record.location_time || record.date || record.createdAt,
    latitude: record.latitude ?? record.lat,
    longitude: record.longitude ?? record.lng ?? record.lon,
  })).filter((record) => {
    const d = getRecordDate(record);
    if (!d) return false;
    return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
  });

  // 2. Validate coordinates
  const validCoordinates = dateFiltered.filter((record) =>
    isValidCoordinate(record.latitude, record.longitude)
  );

  // 3. Schedule Filter: Only records falling within the group schedule
  const scheduleFiltered = validCoordinates.filter((record) => {
    const d = getRecordDate(record);
    return isWithinSchedule(d, groupSchedule, tz);
  });

  // Sort records
  scheduleFiltered.sort((a, b) => {
    const timeA = getRecordDate(a)?.getTime() || 0;
    const timeB = getRecordDate(b)?.getTime() || 0;
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  return {
    records: scheduleFiltered,
    totalFetched: rawDocs.length,
    withinScheduleCount: scheduleFiltered.length,
  };
}

/**
 * Utility to calculate first and last recorded times for a collection of records
 */
export function calculateLocationExtremes(records) {
  if (!records || records.length === 0) {
    return { firstRecordTime: null, lastRecordTime: null };
  }

  const times = records
    .map((r) => toDate(
      r.timestamp
        || r.created_at
        || r.recorded_at
        || r.location_time
        || r.date
        || r.createdAt
    )?.getTime())
    .filter(Boolean)
    .sort((a, b) => a - b);

  if (times.length === 0) {
    return { firstRecordTime: null, lastRecordTime: null };
  }

  return {
    firstRecordTime: new Date(times[0]),
    lastRecordTime: new Date(times[times.length - 1]),
  };
}
