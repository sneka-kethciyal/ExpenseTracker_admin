import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './AdminLayout.css';

export default function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard Overview';
    if (pathname.startsWith('/users/')) return 'User Details';
    if (pathname.startsWith('/users')) return 'User Management';
    if (pathname.startsWith('/groups')) return 'Group Management';
    if (pathname.startsWith('/schedules')) return 'Schedule Management';
    if (pathname.startsWith('/geo-location')) return 'Geo Location History';
    if (pathname.startsWith('/finance')) return 'Expense & Credit Records';
    if (pathname.startsWith('/profile')) return 'Admin Account & Security';
    return 'ExpenseTracker Admin';
  };

  return (
    <div className="admin-layout">
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="main-wrapper">
        <Topbar
          onMenuClick={() => setMobileSidebarOpen(true)}
          title={getPageTitle(location.pathname)}
        />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
