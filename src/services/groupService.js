import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Fetches all groups with their current user counts.
 * Read-only from Firestore — no seeding, no defaults, no fallbacks.
 * If Firestore has no groups, returns an empty array.
 */
export async function getAllGroups() {
  const groupsRef = collection(db, 'groups');
  const snapshot = await getDocs(groupsRef);

  if (snapshot.empty) return [];

  const groups = snapshot.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, name: data.name || d.id };
  });

  // Attach live user counts per group
  const usersRef = collection(db, 'users');
  const usersSnap = await getDocs(usersRef);
  const countMap = {};
  usersSnap.docs.forEach((docSnap) => {
    const gId = docSnap.data().group_id;
    if (gId) countMap[gId] = (countMap[gId] || 0) + 1;
  });

  return groups.map((g) => ({
    ...g,
    userCount: countMap[g.id] || 0,
  }));
}

/**
 * Gets a group by its document ID
 */
export async function getGroupById(groupId) {
  if (!groupId) return null;
  const groupRef = doc(db, 'groups', groupId);
  const snap = await getDoc(groupRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Updates group properties (name, description, status)
 */
export async function updateGroup(groupId, updates) {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    ...updates,
    updated_at: serverTimestamp(),
  });
}

/**
 * Verifies if any active users belong to the group before deletion/disabling
 */
export async function countUsersInGroup(groupId) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('group_id', '==', groupId));
  const snap = await getDocs(q);
  return snap.size;
}

/**
 * Creates a new group in Firestore.
 * - Generates a slug-based document ID from the group name.
 * - Prevents duplicate group names (case-insensitive).
 *
 * @param {object} params
 * @param {string} params.name         Required — group display name
 * @param {string} [params.description] Optional description
 * @param {string} [params.startTime]  Optional start time (e.g. '09:00')
 * @param {string} [params.endTime]    Optional end time (e.g. '18:00')
 * @param {string} [params.status]     'Active' | 'Inactive' (defaults to 'Active')
 * @returns {Promise<object>} The created group data including its id
 */
export async function createGroup({
  name,
  description = '',
  startTime = '09:00',
  endTime = '18:00',
  activeDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  status = 'Active',
}) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Group name is required.');
  }

  // Generate a slug ID: lowercase, spaces → underscores, strip special chars
  const slug = trimmedName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  if (!slug) {
    throw new Error('Group name must contain at least one alphanumeric character.');
  }

  // Check for duplicate name (case-insensitive) across all existing groups
  const groupsRef = collection(db, 'groups');
  const existingSnap = await getDocs(groupsRef);
  const nameLower = trimmedName.toLowerCase();
  const duplicate = existingSnap.docs.find(
    (d) => d.data().name?.toLowerCase() === nameLower
  );
  if (duplicate) {
    throw new Error(`A group named "${trimmedName}" already exists.`);
  }

  // Check the slug-based doc ID isn't already taken (safety net for slug collisions)
  const groupDocRef = doc(db, 'groups', slug);
  const slugSnap = await getDoc(groupDocRef);
  if (slugSnap.exists()) {
    throw new Error(`A group with the ID "${slug}" already exists. Please choose a different name.`);
  }

  const scheduleId = `sched_${slug}_default`;

  const groupData = {
    name: trimmedName,
    description,
    default_schedule_id: scheduleId,
    start_time: startTime || '09:00',
    end_time: endTime || '18:00',
    status,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  await setDoc(groupDocRef, groupData);

  // Also create corresponding schedule doc in schedules collection
  const schedDocRef = doc(db, 'schedules', scheduleId);
  await setDoc(schedDocRef, {
    group_id: slug,
    start_time: startTime || '09:00',
    end_time: endTime || '18:00',
    active_days: activeDays && activeDays.length > 0 ? activeDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    timezone: 'Asia/Kolkata',
    status,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return { id: slug, ...groupData };
}

/**
 * Deletes a group and its associated schedule.
 * Blocks deletion if users are currently assigned to the group.
 *
 * @param {string} groupId
 */
export async function deleteGroup(groupId) {
  if (!groupId) {
    throw new Error('Group ID is required.');
  }

  // Check if users belong to this group
  const userCount = await countUsersInGroup(groupId);
  if (userCount > 0) {
    throw new Error(
      `Cannot delete group "${groupId}": ${userCount} user(s) are currently assigned to it. Please reassign those users first.`
    );
  }

  // Delete from groups collection
  await deleteDoc(doc(db, 'groups', groupId));

  // Delete matching schedule(s) from schedules collection
  const schedRef = collection(db, 'schedules');
  const q = query(schedRef, where('group_id', '==', groupId));
  const snap = await getDocs(q);
  for (const sDoc of snap.docs) {
    await deleteDoc(doc(db, 'schedules', sDoc.id));
  }
}

