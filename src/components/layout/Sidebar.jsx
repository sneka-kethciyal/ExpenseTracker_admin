import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Layers,
  CalendarClock,
  MapPin,
  CreditCard,
  LogOut,
  X,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { logout, userProfile, isSuperAdmin, isInAdminGroup, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Navigation items with access control
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      to: '/users',
      label: 'Users',
      icon: Users,
      visible: isSuperAdmin,
    },
    {
      to: '/groups',
      label: 'Groups',
      icon: Layers,
      visible: isSuperAdmin,
    },
    {
      to: '/geo-location',
      label: 'Geo Location',
      icon: MapPin,
      visible: isSuperAdmin || hasPermission('view_geo'),
    },
    {
      to: '/finance',
      label: 'Expense & Credit',
      icon: CreditCard,
      visible: isSuperAdmin || hasPermission('view_finance'),
    },
  ];

  // Determine display role label
  const getRoleBadge = () => {
    if (isSuperAdmin) return 'Admin';
    if (isInAdminGroup) return 'Admin (Limited)';
    return 'User';
  };

  const displayName = isSuperAdmin
    ? 'Admin'
    : userProfile?.username || userProfile?.email?.split('@')[0] || 'User';

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <Compass size={22} />
            </div>
            <div className="sidebar-brand-text">
              <span className="brand-title">ExpenseTracker</span>
              <span className="brand-subtitle">Geo Admin</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User role summary */}
        <div className="sidebar-user-summary">
          <div className="sidebar-user-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-meta">
            <span className="sidebar-username">{displayName}</span>
            <span className={`sidebar-role-badge ${isSuperAdmin ? 'super-admin' : ''}`}>
              {isSuperAdmin && <ShieldCheck size={10} style={{ marginRight: '3px', display: 'inline' }} />}
              {getRoleBadge()}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-group-title">MAIN NAVIGATION</div>
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-nav-link ${isActive ? 'active' : ''}`
                  }
                  onClick={onClose}
                >
                  <Icon size={18} className="nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
