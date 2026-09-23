import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
      <div className="card" style={{ maxWidth: '440px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-8)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Compass size={36} />
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--neutral-900)', lineHeight: 1 }}>404</h1>
        <h2>Page Not Found</h2>
        <p style={{ color: 'var(--neutral-500)', fontSize: 'var(--font-size-sm)' }}>
          The dashboard route you requested does not exist or has been relocated.
        </p>
        <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
