import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import {
  loginWithUsernameOrEmail,
  logoutUser,
  changeUserPassword,
  getUserProfile,
  SUPER_ADMIN_EMAIL,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  // Set to true when a non-super-admin successfully authenticates but is denied dashboard access
  const [unauthorizedAttempt, setUnauthorizedAttempt] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // In development mode without Firebase credentials, allow developer preview as super_admin
      setCurrentUser({ email: SUPER_ADMIN_EMAIL, uid: 'dev-super-admin' });
      setUserProfile({
        uid: 'dev-super-admin',
        email: SUPER_ADMIN_EMAIL,
        username: 'super_admin',
        group_id: 'admin',
        role: 'super_admin',
        permissions: ['*'],
        status: 'Active',
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const isSuper = firebaseUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL;

          // ── ADMIN-ONLY ENFORCEMENT ──────────────────────────────────────────
          // If the authenticated user is NOT the authorized super admin,
          // immediately sign them out and block dashboard access.
          if (!isSuper) {
            await signOut(auth);
            setCurrentUser(null);
            setUserProfile(null);
            setUnauthorizedAttempt(true);
            return;
          }
          // ────────────────────────────────────────────────────────────────────

          setCurrentUser(firebaseUser);
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile || {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: 'super_admin',
            group_id: 'admin',
            role: 'super_admin',
            permissions: ['*'],
            status: 'Active',
          });
          // Clear any previous unauthorized attempt flag for this successful admin login
          setUnauthorizedAttempt(false);
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Error in onAuthStateChanged:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (identifier, password) => {
    setAuthError(null);
    setUnauthorizedAttempt(false);
    try {
      const { user, profile } = await loginWithUsernameOrEmail(identifier, password);
      setCurrentUser(user);
      setUserProfile(profile);
      return { user, profile };
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setUserProfile(null);
      setUnauthorizedAttempt(false);
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    await changeUserPassword(currentPassword, newPassword);
  };

  // Role evaluations
  const isSuperAdmin = Boolean(
    currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL ||
    userProfile?.role === 'super_admin'
  );

  // Group is an organizational category
  const isInAdminGroup = userProfile?.group_id?.toLowerCase() === 'admin';
  const isFieldWorker = userProfile?.group_id?.toLowerCase() === 'field_worker' || userProfile?.role === 'field_worker';

  // Only Super Admin has administrator privileges across dashboard
  const isAdmin = isSuperAdmin;
  const userRole = isSuperAdmin ? 'super_admin' : (userProfile?.role || (isInAdminGroup ? 'user' : 'field_worker'));
  const permissions = Array.isArray(userProfile?.permissions) ? userProfile.permissions : [];

  const hasPermission = (perm) => {
    if (isSuperAdmin) return true;
    return permissions.includes(perm) || permissions.includes('*');
  };

  const value = {
    currentUser,
    userProfile,
    isSuperAdmin,
    isAdmin,
    isInAdminGroup,
    isFieldWorker,
    userRole,
    permissions,
    hasPermission,
    loading,
    authError,
    unauthorizedAttempt,
    login,
    logout,
    changePassword,
    isFirebaseConfigured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
