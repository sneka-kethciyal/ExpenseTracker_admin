import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_TIMEZONE } from '../utils/dateUtils';
import { validateSchedule } from '../utils/scheduleUtils';

/**
 * Gets all schedules
 */
export async function getAllSchedules() {
  const schedRef = collection(db, 'schedules');
  const snapshot = await getDocs(schedRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Gets the active schedule assigned to a specific group
 */
export async function getScheduleByGroupId(groupId) {
  if (!groupId) return null;
  const schedRef = collection(db, 'schedules');
  const q = query(schedRef, where('group_id', '==', groupId));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() };
  }

  return null;
}

/**
 * Updates a group's schedule immediately.
 * Validates fields and saves updated timestamp.
 * Preserves historical GPS data intact.
 */
export async function updateGroupSchedule(scheduleId, scheduleData) {
  const validation = validateSchedule(scheduleData);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(firstError);
  }

  const schedDocRef = doc(db, 'schedules', scheduleId);
  await setDoc(
    schedDocRef,
    {
      group_id: scheduleData.group_id,
      start_time: scheduleData.start_time,
      end_time: scheduleData.end_time,
      active_days: scheduleData.active_days,
      timezone: scheduleData.timezone || DEFAULT_TIMEZONE,
      status: scheduleData.status || 'Active',
      updated_at: serverTimestamp(),
    },
    { merge: true }
  );
}
