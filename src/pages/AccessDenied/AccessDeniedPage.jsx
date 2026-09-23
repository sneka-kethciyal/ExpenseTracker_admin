import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const { logout, userProfile } = useAuth();

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
      <div className="card" style={{ maxWidth: '480px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-8)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldAlert size={36} />
        </div>
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-size-sm)' }}>
          Your account (<strong>{userProfile?.username || 'user'}</strong>) is assigned to group{' '}
          <code>{userProfile?.group_id || 'Unassigned'}</code>, which does not have administrator privileges to view this section.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/geo-location')}>
            Go to My GPS History
          </Button>
          <Button variant="outline" icon={LogOut} onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
