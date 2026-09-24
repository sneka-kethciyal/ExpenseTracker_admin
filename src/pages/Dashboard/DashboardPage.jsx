import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  MapPin,
  Wallet,
  Calendar,
  RefreshCw,
  Plus,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { getAllUsers } from '../../services/userService';
import { getAllGroups } from '../../services/groupService';
import { SUPER_ADMIN_EMAIL } from '../../services/authService';
import { formatNumber } from '../../utils/formatUtils';
import { getLocalDateString, formatLocalDateTime } from '../../utils/dateUtils';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import './DashboardPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [loading, setLoading] = useState(true);

  // Aggregated state
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
  });
  const [groupStats, setGroupStats] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [users, groups] = await Promise.all([
        getAllUsers(),
        getAllGroups(),
      ]);

      // admin@gmail.com is the system administrator, not a personnel user.
      // Exclude admin from dashboard workforce counts and overview table.
      const workforceUsers = users.filter((u) => {
        const email = u.email?.toLowerCase();
        const username = u.username?.toLowerCase();
        const role = u.role?.toLowerCase();
        return (
          email !== SUPER_ADMIN_EMAIL.toLowerCase() &&
          username !== 'super_admin' &&
          role !== 'super_admin'
        );
      });

      const totalUsers = workforceUsers.length;
      const activeUsers = workforceUsers.filter(
        (u) => u.status !== 'Inactive'
      ).length;
      const groupCounts = workforceUsers.reduce((counts, user) => {
        if (user.group_id) counts[user.group_id] = (counts[user.group_id] || 0) + 1;
        return counts;
      }, {});
      const nextGroupStats = groups.map((group) => ({
        ...group,
        userCount: groupCounts[group.id] || 0,
      }));

      setStats({
        totalUsers,
        activeUsers,
      });
      setAllGroups(groups);
      setGroupStats(nextGroupStats);

      setRecentUsers(workforceUsers.slice(0, 6));
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      showToast('Could not fetch all dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="dashboard-page">
      {/* Top Welcome & Date Filter */}
      <div className="dashboard-header-card card">
        <div className="dashboard-welcome">
          <h2>Admin Control Center</h2>
          <p>Real-time oversight of personnel, operational group schedules, GPS tracks, and expenses.</p>
        </div>

        <div className="dashboard-date-filter">
          <div className="date-input-wrap">
            <Calendar size={16} className="date-icon" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              title="Filter dashboard GPS metrics by date"
            />
          </div>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadDashboardData} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="dashboard-stats-grid">
        <StatCard
          title="Total Users"
          value={formatNumber(stats.totalUsers)}
          subtitle="All registered accounts"
          icon={Users}
          variant="primary"
          loading={loading}
        />

        {groupStats.map((group) => (
          <StatCard
            key={group.id}
            title={group.name}
            value={formatNumber(group.userCount)}
            subtitle="Registered group members"
            icon={Layers}
            variant="info"
            loading={loading}
          />
        ))}

        <StatCard
          title="Active Users"
          value={formatNumber(stats.activeUsers)}
          subtitle="Enabled system accounts"
          icon={UserCheck}
          variant="success"
          loading={loading}
        />
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="dashboard-actions-row">
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/users')}
        >
          Create / Manage Users
        </Button>
        <Button
          variant="outline"
          icon={Layers}
          onClick={() => navigate('/groups')}
        >
          Manage Groups
        </Button>
        <Button
          variant="outline"
          icon={MapPin}
          onClick={() => navigate(`/geo-location?date=${selectedDate}`)}
        >
          Inspect Date GPS Breadcrumbs
        </Button>

      </div>

      {/* Overview Table: Recent Personnel */}
      <div className="card dashboard-recent-users">
        <div className="recent-users-header">
          <div>
            <h3>Active Workforce Overview</h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>
              Quick view of registered team members and current group affiliations.
            </p>
          </div>
          <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/users')}>
            View All Users
          </Button>
        </div>

        <div className="table-container" style={{ marginTop: 'var(--space-3)' }}>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Group</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Logged In</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => {
                const group = allGroups.find((item) => item.id === u.group_id);
                return (
                  <tr key={u.id}>
                    <td>
                      <strong style={{ color: 'var(--neutral-900)' }}>{u.employee_name || u.username}</strong>
                      <span style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>{u.username}</span>
                    </td>
                    <td>
                      <span className={`badge ${group ? 'badge-primary' : 'badge-neutral'}`}>
                        {group?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td>{u.role || '--'}</td>
                    <td>
                      <span className={`badge ${u.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>
                      {formatLocalDateTime(u.created_at)}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>
                      {formatLocalDateTime(
                        u.last_login
                          || u.logged_in_at
                          || u.login_time
                          || u.last_seen
                          || u.last_active_at
                          || u.lastLoginAt
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={MapPin}
                          onClick={() => navigate(`/geo-location?userId=${u.id}`)}
                          title="View Location"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Wallet}
                          onClick={() => navigate(`/finance?userId=${u.id}`)}
                          title="View Finances"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
