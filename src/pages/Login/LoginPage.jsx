import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Lock, User, Eye, EyeOff, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import Button from '../../components/common/Button';
import './LoginPage.css';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, isFirebaseConfigured, unauthorizedAttempt } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      if (!isFirebaseConfigured) {
        // Mock login for preview mode
        showToast('Running in Demo Preview mode. Logged in as Administrator.', 'info');
        navigate('/dashboard');
        return;
      }

      await login(identifier, password);
      showToast('Successfully logged in!', 'success');
      navigate('/dashboard');
    } catch (err) {
      let friendlyMsg = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        friendlyMsg = 'Invalid username or password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMsg = 'Access temporarily locked due to repeated attempts. Please try again later.';
      } else if (err.message) {
        friendlyMsg = err.message;
      }
      setErrorMessage(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setIdentifier('admin@gmail.com');
    setPassword('admin@123');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Compass size={28} />
          </div>
          <h2>ExpenseTracker Admin</h2>
          <p>Sign in to manage users, group schedules, GPS locations & expenses.</p>
        </div>

        {!isFirebaseConfigured && (
          <div className="login-demo-notice">
            <ShieldAlert size={18} className="demo-notice-icon" />
            <div>
              <strong>Firebase Credentials Pending</strong>
              <p>Add your keys to <code>.env</code>. You can test the interface with the button below.</p>
            </div>
          </div>
        )}

        {/* Unauthorized access banner — shown when a non-admin Firebase account is blocked */}
        {unauthorizedAttempt && (
          <div className="login-error-banner" role="alert" id="unauthorized-banner">
            <ShieldAlert size={18} />
            <span>You are not authorized to access the Admin Dashboard.</span>
          </div>
        )}

        {errorMessage && !unauthorizedAttempt && (
          <div className="login-error-banner" role="alert">
            <ShieldAlert size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-identifier">Username or Email</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="login-identifier"
                type="text"
                placeholder=""
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="login-submit-btn"
          >
            Sign In to Dashboard
          </Button>

          {!isFirebaseConfigured && (
            <button
              type="button"
              className="demo-autofill-btn"
              onClick={handleFillDemo}
            >
              Fill Demo Credentials
            </button>
          )}
        </form>

        <div className="login-card-footer">
          <p>Authorized access only. Group permissions are strictly enforced.</p>
        </div>
      </div>
    </div>
  );
}
