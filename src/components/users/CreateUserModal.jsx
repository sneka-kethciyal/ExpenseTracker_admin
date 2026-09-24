import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, ShieldCheck, UserPlus } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { validateUsername, validatePassword } from '../../utils/validationUtils';
import { createUserSecurely } from '../../services/authService';
import { useNotification } from '../../hooks/useNotification';

export default function CreateUserModal({ isOpen, onClose, onUserCreated, groups = [] }) {
  const [employeeName, setEmployeeName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [groupId, setGroupId] = useState('');
  const [status, setStatus] = useState('Active');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const { showToast } = useNotification();
  const availableGroups = groups;

  useEffect(() => {
    if (isOpen && !availableGroups.some((group) => group.id === groupId)) {
      setGroupId(availableGroups[0]?.id || '');
    }
  }, [isOpen, availableGroups, groupId]);

  const resetForm = () => {
    setEmployeeName('');
    setUsername('');
    setRole('');
    setPassword('');
    setConfirmPassword('');
    setGroupId('');
    setStatus('Active');
    setFormErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!employeeName.trim()) {
      errors.employeeName = 'Employee name is required.';
    }

    const usernameErr = validateUsername(username);
    if (usernameErr) errors.username = usernameErr;

    const passwordErr = validatePassword(password);
    if (passwordErr) errors.password = passwordErr;

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!groupId) {
      errors.group = 'Select a group for this user.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    setFormErrors({});

    try {
      const newUser = await createUserSecurely({
        employeeName,
        username,
        role,
        password,
        groupId,
        status,
      });

      showToast(`User "${username}" was successfully created!`, 'success');
      if (onUserCreated) onUserCreated(newUser);
      handleClose();
    } catch (err) {
      console.error('Error creating user:', err);
      setFormErrors({ submit: err.message || 'Failed to create user.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Create New User"
      onClose={handleClose}
      maxWidth="520px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {formErrors.submit && (
          <div className="badge-danger" style={{ padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)' }}>
            {formErrors.submit}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="create-employee-name">Employee Name *</label>
          <input
            id="create-employee-name"
            type="text"
            placeholder="e.g. John Doe"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            disabled={loading}
          />
          {formErrors.employeeName && (
            <span style={{ color: 'var(--danger-main)', fontSize: 'var(--font-size-xs)' }}>
              {formErrors.employeeName}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="create-username">Username *</label>
          <input
            id="create-username"
            type="text"
            placeholder="e.g. john_doe (letters, numbers, _, -)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          {formErrors.username && (
            <span style={{ color: 'var(--danger-main)', fontSize: 'var(--font-size-xs)' }}>
              {formErrors.username}
            </span>
          )}
          <span style={{ fontSize: '0.72rem', color: 'var(--neutral-400)' }}>
            Note: Usernames are immutable and cannot be changed by the user.
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="create-group">Assign Group *</label>
          <select
            id="create-group"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            disabled={loading}
          >
            <option value="" disabled>
              {availableGroups.length ? 'Select a group' : 'No groups available'}
            </option>
            {availableGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {formErrors.group && (
            <span style={{ color: 'var(--danger-main)', fontSize: 'var(--font-size-xs)' }}>
              {formErrors.group}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="create-role">Role</label>
          <input
            id="create-role"
            type="text"
            placeholder="e.g. Field Executive"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
          />
          {formErrors.role && (
            <span style={{ color: 'var(--danger-main)', fontSize: 'var(--font-size-xs)' }}>
              {formErrors.role}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="create-password">Initial Password *</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="create-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)' }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {formErrors.password && (
            <span style={{ color: 'var(--danger-main)', fontSize: 'var(--font-size-xs)' }}>
              {formErrors.password}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="create-confirm-password">Confirm Password *</label>
          <input
            id="create-confirm-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-enter initial password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
          {formErrors.confirmPassword && (
            <span style={{ color: 'var(--danger-main)', fontSize: 'var(--font-size-xs)' }}>
              {formErrors.confirmPassword}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="create-status">Account Status</label>
          <select
            id="create-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={loading}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={availableGroups.length === 0}
            icon={UserPlus}
          >
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  );
}
