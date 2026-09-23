import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Fetches all registered users from Firestore
 */
export async function getAllUsers() {
  const usersRef = collection(db, 'users');
  let q;
  try {
    q = query(usersRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    // Fallback if index on created_at is missing
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

/**
 * Fetches single user by ID
 */
export async function getUserById(userId) {
  if (!userId) return null;
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Updates a user's assigned group
 */
export async function updateUserGroup(userId, groupId) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    group_id: groupId,
    updated_at: serverTimestamp(),
  });
}

/**
 * Updates a user's active status ('Active' | 'Inactive')
 */
export async function updateUserStatus(userId, status) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    status: status,
    updated_at: serverTimestamp(),
  });
}
