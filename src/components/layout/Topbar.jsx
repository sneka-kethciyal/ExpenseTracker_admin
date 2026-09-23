import React, { useState, useEffect } from 'react';
import { Menu, Clock, ShieldCheck, Globe } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatLocalTime, DEFAULT_TIMEZONE } from '../../utils/dateUtils';
import './Topbar.css';

export default function Topbar({ onMenuClick, title }) {
  const { userProfile, isFirebaseConfigured, isSuperAdmin } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-toggle"
          onClick={onMenuClick}
          aria-label="Open mobile navigation"
        >
          <Menu size={20} />
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-right">
        {/* Timezone Clock */}
        <div className="topbar-pill topbar-clock" title={`System Timezone: ${DEFAULT_TIMEZONE}`}>
          <Clock size={14} className="topbar-pill-icon" />
          <span className="clock-time">{formatLocalTime(currentTime)}</span>
          <span className="clock-tz">IST ({DEFAULT_TIMEZONE.split('/')[1] || 'Kolkata'})</span>
        </div>

        {/* Database Status indicator */}
        {!isFirebaseConfigured ? (
          <div className="topbar-pill topbar-status-demo" title="Configure .env with Firebase credentials for production">
            <span className="status-dot demo" />
            <span>Demo Mode</span>
          </div>
        ) : (
          <div className="topbar-pill topbar-status-connected" title="Connected to Firebase Cloud Firestore">
            <span className="status-dot connected" />
            <span>Live Firestore</span>
          </div>
        )}

        {/* User Role */}
        <div className="topbar-user-badge">
          <ShieldCheck size={16} className="role-icon" />
          <span>
            {isSuperAdmin
              ? 'ADMIN'
              : (userProfile?.group_id?.toUpperCase() || 'USER')}
          </span>
        </div>
      </div>
    </header>
  );
}
