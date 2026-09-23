import React, { useState } from 'react';
import { UserCheck, Shield, KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { validatePassword } from '../../utils/validationUtils';
import Button from '../../components/common/Button';
import './ProfilePage.css';

export default function ProfilePage() {
  const { userProfile, currentUser, changePassword, isFirebaseConfigured } = useAuth();
  const { showToast } = useNotification();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Enter current password.';
    }

    const passErr = validatePassword(newPassword);
    if (passErr) newErrors.newPassword = passErr;

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'New passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (!isFirebaseConfigured) {
        showToast('Password updated in Demo Mode.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        return;
      }

      await changePassword(currentPassword, newPassword);
      showToast('Your password was successfully updated!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change error:', err);
      let msg = 'Failed to update password.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Current password entered is incorrect.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h2>Account & Security</h2>
          <p>Manage administrator credentials and review active security policies.</p>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Account Details Card */}
        <div className="card">
          <h3 className="section-title">
            <UserCheck size={18} />
            Administrator Profile
          </h3>

          <div className="profile-info-list">
            <div className="info-row">
              <span className="info-label">Username (Immutable)</span>
              <strong className="info-value">{userProfile?.username || 'admin'}</strong>
            </div>

            <div className="info-row">
              <span className="info-label">Authentication Email</span>
              <span className="info-value">{userProfile?.email || currentUser?.email || 'admin@expensetracker.local'}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Assigned Role Group</span>
              <span className="badge badge-primary">
                <Shield size={12} />
                {userProfile?.group_id?.toUpperCase() || 'ADMIN'}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Account Status</span>
              <span className="badge badge-success">
                <CheckCircle2 size={12} />
                {userProfile?.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <h3 className="section-title">
            <KeyRound size={18} />
            Update Password
          </h3>

          {errors.form && (
            <div className="badge-danger" style={{ padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
              {errors.form}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="password-change-form">
            <div className="form-group">
              <label htmlFor="current-pass">Current Password</label>
              <input
                id="current-pass"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
                required
              />
              {errors.currentPassword && (
                <span className="field-error">{errors.currentPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="new-pass">New Password</label>
              <input
                id="new-pass"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
              />
              {errors.newPassword && (
                <span className="field-error">{errors.newPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirm-pass">Confirm New Password</label>
              <input
                id="confirm-pass"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
              {errors.confirmPassword && (
                <span className="field-error">{errors.confirmPassword}</span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              icon={Lock}
              loading={loading}
            >
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
