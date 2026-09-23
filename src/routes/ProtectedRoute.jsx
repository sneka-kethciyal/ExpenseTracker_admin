import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute — guards access by authentication, Super Admin role, or specific permission.
 *
 * Props:
 *   superAdminOnly (bool)  – only super_admin may access
 *   requiredPermission (str) – user must have this permission (super_admin always passes)
 *   children                 – element(s) to render when access granted
 */
export default function ProtectedRoute({
  children,
  superAdminOnly = false,
  // Legacy prop kept for backwards-compat — maps to superAdminOnly
  adminOnly = false,
  requiredPermission = null,
}) {
  const {
    currentUser,
    isSuperAdmin,
    hasPermission,
    loading,
    isFirebaseConfigured,
  } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', borderTopColor: 'var(--primary-600)' }} />
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-500)' }}>
            Authenticating session...
          </p>
        </div>
      </div>
    );
  }

  // Must be authenticated
  if (isFirebaseConfigured && !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── ADMIN-ONLY GATE ────────────────────────────────────────────────────────
  // Every protected route in the Admin Dashboard requires super_admin.
  // This is the second line of defence after AuthContext's signOut enforcement.
  if (isFirebaseConfigured && !isSuperAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // ────────────────────────────────────────────────────────────────────────────

  // superAdminOnly or legacy adminOnly → only super_admin allowed
  const needsSuperAdmin = superAdminOnly || adminOnly;
  if (needsSuperAdmin && isFirebaseConfigured && !isSuperAdmin) {
    return <Navigate to="/access-denied" replace />;
  }

  // Permission-gated route (super_admin bypasses automatically via hasPermission)
  if (requiredPermission && isFirebaseConfigured && !hasPermission(requiredPermission)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}
