import {
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db, getSecondaryAuth } from './firebase';

const DOMAIN_SUFFIX = '@expensetracker.com';
export const SUPER_ADMIN_EMAIL = 'admin@gmail.com';

/**
 * Normalizes input identifier (username or email) into an email string.
 */
export function formatAuthEmail(identifier) {
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  return `${trimmed}${DOMAIN_SUFFIX}`;
}

/**
 * Signs in user with either their username or email and password.
 * Special testing account handling for Super Admin (admin@gmail.com / admin@123).
 */
export async function loginWithUsernameOrEmail(identifier, password) {
  const email = formatAuthEmail(identifier);
  let userCredential;

  try {
    userCredential = await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    // If testing Super Admin account does not exist yet in Firebase Auth, provision it
    if (
      email === SUPER_ADMIN_EMAIL &&
      password === 'admin@123' &&
      (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')
    ) {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    } else {
      throw err;
    }
  }

  const user = userCredential.user;
  const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;

  if (isSuperAdmin) {
    return {
      user,
      profile: {
        uid: user.uid,
        email: user.email,
        permissions: ['*'],
        role: 'super_admin',
        status: 'Active',
      },
    };
  }

  // Retrieve user document from Firestore to get assigned group, role, and permissions
  const userDocRef = doc(db, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);

  let profile;

  if (userDocSnap.exists()) {
    profile = { uid: user.uid, ...userDocSnap.data() };
    await updateDoc(userDocRef, { last_login: serverTimestamp() });
    // Guarantee Super Admin role for admin@gmail.com
    if (isSuperAdmin && profile.role !== 'super_admin') {
      profile.role = 'super_admin';
      profile.group_id = 'admin';
      profile.permissions = ['*'];
      await setDoc(userDocRef, { role: 'super_admin', group_id: 'admin', permissions: ['*'] }, { merge: true });
    }
  } else {
    // Create new profile doc
    profile = {
      user_id: user.uid,
      username: isSuperAdmin ? 'super_admin' : identifier.replace(DOMAIN_SUFFIX, ''),
      email: user.email,
      group_id: 'admin',
      role: isSuperAdmin ? 'super_admin' : 'user',
      permissions: isSuperAdmin ? ['*'] : [],
      status: 'Active',
      created_at: serverTimestamp(),
      last_login: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    await setDoc(userDocRef, profile);
  }

  return { user, profile };
}

/**
 * Signs out current user
 */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * Changes password for currently authenticated user
 */
export async function changeUserPassword(currentPassword, newPassword) {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) {
    throw new Error('No authenticated user found.');
  }

  // Re-authenticate first
  const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
  await reauthenticateWithCredential(currentUser, credential);

  // Update to new password
  await updatePassword(currentUser, newPassword);
}

/**
 * Super Admin function to create a new user without signing out the current admin.
 * Uses a secondary Firebase Auth instance.
 *
 * Rules:
 * - Group is a category (Admin or Field Worker).
 * - Admin group members get role: 'user' and only assigned permissions.
 * - Field workers get role: 'field_worker'.
 * - Cannot create another Super Admin account.
 */
export async function createUserSecurely({
  employeeName,
  username,
  role,
  password,
  groupId,
  status = 'Active',
}) {
  if (!auth?.currentUser || auth.currentUser.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
    throw new Error('Only the administrator can create users.');
  }

  if (!groupId) {
    throw new Error('A group is required when creating a user.');
  }

  if (!employeeName?.trim()) {
    throw new Error('Employee name is required.');
  }

  const cleanUsername = username.trim().toLowerCase();
  const email = `${cleanUsername}${DOMAIN_SUFFIX}`;

  if (email === SUPER_ADMIN_EMAIL) {
    throw new Error('Cannot create an additional Super Admin account.');
  }

  // 1. Check for duplicate username in Firestore
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', cleanUsername));
  const querySnap = await getDocs(q);

  if (!querySnap.empty) {
    throw new Error(`The username "${cleanUsername}" is already taken. Please choose another.`);
  }

  // 2. Create user with secondary Auth instance to preserve Super Admin session
  const secondaryAuth = getSecondaryAuth();
  let newUid;

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    newUid = userCredential.user.uid;
    // Sign out from secondary auth immediately
    await signOut(secondaryAuth);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      throw new Error(`An account with username "${cleanUsername}" already exists in Authentication.`);
    }
    throw err;
  }

  // 3. Create user profile in Firestore
  const userDocRef = doc(db, 'users', newUid);
  const userData = {
    user_id: newUid,
    employee_name: employeeName.trim(),
    username: cleanUsername,
    email: email,
    group_id: groupId,
    role: role?.trim() || '',
    status: status,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  await setDoc(userDocRef, userData);

  return userData;
}

/**
 * Fetches user profile from Firestore by UID
 */
export async function getUserProfile(uid) {
  if (!uid) return null;
  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  // Ensure super_admin role for admin@gmail.com
  if (data.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
    return { ...data, role: 'super_admin' };
  }
  return data;
}
