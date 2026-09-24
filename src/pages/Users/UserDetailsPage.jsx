import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, User, MapPin, CreditCard, Save, CalendarClock } from 'lucide-react';
import { getUserById, updateUserGroup } from '../../services/userService';
import { getAllGroups } from '../../services/groupService';
import { getScheduleByGroupId } from '../../services/scheduleService';
import { formatLocalDateTime } from '../../utils/dateUtils';
import { formatScheduleSummary } from '../../utils/scheduleUtils';
import { useNotification } from '../../hooks/useNotification';
import Button from '../../components/common/Button';

export default function UserDetailsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [user, setUser] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      try {
        const [u, groupList] = await Promise.all([
          getUserById(userId),
          getAllGroups(),
        ]);
        setGroups(groupList);
        if (u) {
          setUser(u);
          setSelectedGroup(u.group_id || '');
          const sched = await getScheduleByGroupId(u.group_id || '');
          setSchedule(sched);
        }
      } catch (err) {
        showToast('Failed to load user details.', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [userId, showToast]);

  const handleGroupChange = async (e) => {
    const newGroup = e.target.value;
    setSelectedGroup(newGroup);
    const updatedSched = await getScheduleByGroupId(newGroup);
    setSchedule(updatedSched);
  };

  const handleSaveGroup = async () => {
    if (selectedGroup === user?.group_id) return;
    setSaving(true);
    try {
      await updateUserGroup(userId, selectedGroup);
      setUser((prev) => ({ ...prev, group_id: selectedGroup }));
      const group = groups.find((item) => item.id === selectedGroup);
      showToast(`User group updated to ${group?.name || selectedGroup}. Changes apply immediately.`, 'success');
    } catch (err) {
      showToast(`Failed to update group: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)' }}>
        <div className="skeleton" style={{ height: '30px', width: '200px', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: '20px', width: '350px' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <h3>User not found</h3>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>The requested user does not exist in Firestore.</p>
        <Button variant="secondary" onClick={() => navigate('/users')}>
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/users')}>
          Back to Users
        </Button>
        <div>
          <h2>User Profile: {user.username}</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-500)' }}>
            User ID: <code>{user.id}</code>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Core Profile Card */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <User size={18} />
            Account Overview
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <label>Username (Immutable)</label>
              <input type="text" value={user.username} disabled />
            </div>
            <div>
              <label>Authentication Email</label>
              <input type="text" value={user.email || `${user.username}@expensetracker.com`} disabled />
            </div>
            <div>
              <label>Account Status</label>
              <div>
                <span className={`badge ${user.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                  {user.status || 'Active'}
                </span>
              </div>
            </div>
            <div>
              <label>Created Timestamp</label>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-700)' }}>
                {formatLocalDateTime(user.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Group & Schedule Assignment */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Shield size={18} />
            Group & Tracking Schedule
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label htmlFor="user-group-select">Assigned Group</label>
              <select
                id="user-group-select"
                value={selectedGroup}
                onChange={handleGroupChange}
              >
                <option value="" disabled>Select a group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', marginTop: '4px', display: 'block' }}>
                Changing group immediately re-configures their working schedule and tracking rules.
              </span>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                <CalendarClock size={16} color="var(--primary-600)" />
                <strong style={{ fontSize: 'var(--font-size-sm)' }}>Active Working Schedule:</strong>
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-600)' }}>
                {formatScheduleSummary(schedule)}
              </p>
            </div>

            <Button
              variant="primary"
              icon={Save}
              onClick={handleSaveGroup}
              loading={saving}
              disabled={selectedGroup === user.group_id}
            >
              Save Group Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions to Tracking and Expenses */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>User Activity Quick Access</h3>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            icon={MapPin}
            onClick={() => navigate(`/geo-location?userId=${user.id}`)}
          >
            View GPS Tracking History
          </Button>
          <Button
            variant="outline"
            icon={CreditCard}
            onClick={() => navigate(`/finance?userId=${user.id}`)}
          >
            View Expenses & Credits
          </Button>
        </div>
      </div>
    </div>
  );
}
