import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  User,
  RefreshCw,
  Clock,
  ExternalLink,
  ShieldCheck,
  Compass,
  ArrowUpDown,
  ArrowLeft,
} from 'lucide-react';
import { getAllUsers } from '../../services/userService';
import { getAllGroups } from '../../services/groupService';
import { getScheduleByGroupId } from '../../services/scheduleService';
import { SUPER_ADMIN_EMAIL } from '../../services/authService';
import {
  getUserGeoLocations,
  calculateLocationExtremes,
} from '../../services/geoLocationService';
import {
  getLocalDateString,
  formatLocalTime,
  formatLocalDateTime,
  DEFAULT_TIMEZONE,
} from '../../utils/dateUtils';
import { formatCoordinates } from '../../utils/formatUtils';
import { formatScheduleSummary, isWithinSchedule } from '../../utils/scheduleUtils';
import { useNotification } from '../../hooks/useNotification';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import './GeoLocationPage.css';

export default function GeoLocationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUserId = searchParams.get('userId') || '';

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(initialUserId);
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [selectedMonth, setSelectedMonth] = useState(() => getLocalDateString().slice(0, 7));
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  const [groupSchedule, setGroupSchedule] = useState(null);
  const [locations, setLocations] = useState([]);
  const [metrics, setMetrics] = useState({ firstRecordTime: null, lastRecordTime: null, totalPoints: 0 });
  const [loading, setLoading] = useState(false);

  const { showToast } = useNotification();

  // 1. Fetch user list on mount
  useEffect(() => {
    async function loadUsers() {
      try {
        const [userList, groupList] = await Promise.all([
          getAllUsers(),
          getAllGroups(),
        ]);
        const workforce = userList.filter((u) => {
          const email = u.email?.toLowerCase();
          const username = u.username?.toLowerCase();
          return email !== SUPER_ADMIN_EMAIL.toLowerCase() && username !== 'super_admin' && u.role !== 'super_admin';
        });
        setUsers(workforce);
        setGroups(groupList);
        if (!selectedUserId && workforce.length > 0) {
          setSelectedUserId(workforce[0].id);
        }
      } catch (err) {
        console.error('Error fetching users for geo-tracking:', err);
      }
    }
    loadUsers();
  }, [selectedUserId]);

  // 2. Fetch active schedule whenever selected user changes
  useEffect(() => {
    async function loadSchedule() {
      if (!selectedUserId) return;
      const currentUser = users.find((u) => u.id === selectedUserId);
      const groupId = currentUser?.group_id;
      try {
        const sched = await getScheduleByGroupId(groupId);
        setGroupSchedule(sched);
      } catch (err) {
        console.error('Error fetching schedule for user:', err);
      }
    }
    if (users.length > 0) {
      loadSchedule();
    }
  }, [selectedUserId, users]);

  // 3. Fetch location records when user, date, schedule or sort changes
  const fetchLocations = useCallback(async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const { records } = await getUserGeoLocations(
        selectedUserId,
        selectedDate,
        groupSchedule,
        sortOrder
      );
      setLocations(records);
      const extremes = calculateLocationExtremes(records);
      setMetrics({
        totalPoints: records.length,
        firstRecordTime: extremes.firstRecordTime,
        lastRecordTime: extremes.lastRecordTime,
      });
    } catch (err) {
      console.error('Error fetching GPS locations:', err);
      showToast('Failed to load GPS coordinates from Firestore.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, selectedDate, groupSchedule, sortOrder, showToast]);

  useEffect(() => {
    if (selectedUserId && groupSchedule) {
      fetchLocations();
    }
  }, [fetchLocations, selectedUserId, groupSchedule]);

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const selectedGroup = groups.find((group) => group.id === selectedUser?.group_id);
  const firstDayOfMonth = `${selectedMonth}-01`;
  const lastDayOfMonth = `${selectedMonth}-${new Date(
    Number(selectedMonth.slice(0, 4)),
    Number(selectedMonth.slice(5, 7)),
    0
  ).getDate().toString().padStart(2, '0')}`;
  const now = new Date();
  const isCurrentlyInSchedule = isWithinSchedule(now, groupSchedule, DEFAULT_TIMEZONE);

  const columns = [
    {
      header: 'Recorded Time (IST)',
      accessor: 'timestamp',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)' }}>
            {formatLocalTime(row.timestamp || row.created_at)}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--neutral-400)' }}>
            {formatLocalDateTime(row.timestamp || row.created_at)}
          </span>
        </div>
      ),
    },
    {
      header: 'Coordinates (Lat, Lng)',
      key: 'coords',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}>
          {formatCoordinates(row.latitude, row.longitude)}
        </span>
      ),
    },
    {
      header: 'Device / Platform',
      accessor: 'device_platform',
      render: (row) => (
        <span className="badge badge-neutral">
          {row.device_platform || row.local_id || 'Android/Flutter'}
        </span>
      ),
    },
    {
      header: 'Map Inspection',
      key: 'map',
      render: (row) => (
        <a
          href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-outline"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <span>Open Pin</span>
          <ExternalLink size={12} />
        </a>
      ),
    },
  ];

  return (
    <div className="geo-location-page">
      <div className="page-header">
        <div>
          <h2>GPS Geo Tracking History</h2>
          <p>Inspect location tracks strictly filtered by the selected date and assigned group working schedule.</p>
        </div>
        <div className="page-header-actions">
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
            title="Back"
            aria-label="Back"
          />
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={fetchLocations}
            loading={loading}
          >
            Refresh Points
          </Button>
        </div>
      </div>

      {/* Control Filters Card */}
      <div className="card geo-controls-card">
        <div className="geo-control-item">
          <label htmlFor="geo-user-select">
            <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Select User
          </label>
          <select
            id="geo-user-select"
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(e.target.value);
              setSearchParams({ userId: e.target.value });
            }}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({groups.find((group) => group.id === u.group_id)?.name || u.group_name || 'Unassigned'})
              </option>
            ))}
          </select>
        </div>

        <div className="geo-control-item">
          <label htmlFor="geo-month-picker">
            <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Select Month
          </label>
          <input
            id="geo-month-picker"
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              const month = e.target.value;
              setSelectedMonth(month);
              if (!selectedDate.startsWith(`${month}-`)) {
                setSelectedDate(`${month}-01`);
              }
            }}
          />
        </div>

        <div className="geo-control-item">
          <label htmlFor="geo-date-picker">
            <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Select Date (IST)
          </label>
          <input
            id="geo-date-picker"
            type="date"
            value={selectedDate}
            min={firstDayOfMonth}
            max={lastDayOfMonth}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="geo-control-item">
          <label htmlFor="geo-sort-order">
            <ArrowUpDown size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Timestamp Order
          </label>
          <select
            id="geo-sort-order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Schedule Banner */}
      <div className="card geo-schedule-status-banner">
        <div className="banner-left">
          <Compass size={22} className="banner-icon" />
          <div>
            <div className="banner-title-row">
              <strong>{selectedUser?.username || 'User'}</strong>
              <span className="badge badge-neutral">Group: {selectedGroup?.name || selectedUser?.group_name || 'Unassigned'}</span>
              <span className={`badge ${isCurrentlyInSchedule ? 'badge-success' : 'badge-warning'}`}>
                {isCurrentlyInSchedule ? 'Currently Within Shift' : 'Outside Shift'}
              </span>
            </div>
            <p className="banner-sched-text">
              Active Schedule: {formatScheduleSummary(groupSchedule)}
            </p>
          </div>
        </div>

        <div className="banner-rule-pill">
          <span>Filtering: {selectedDate} 00:00:00 &ndash; 23:59:59 (IST) strictly inside schedule</span>
        </div>
      </div>

      {/* Summary KPI Metrics */}
      <div className="geo-metrics-row">
        <div className="card geo-metric-tile">
          <span className="tile-label">TOTAL GPS POINTS</span>
          <h3 className="tile-val">{metrics.totalPoints}</h3>
          <span className="tile-sub">Within permitted working schedule</span>
        </div>

        <div className="card geo-metric-tile">
          <span className="tile-label">FIRST RECORDED POINT</span>
          <h3 className="tile-val">
            {metrics.firstRecordTime ? formatLocalTime(metrics.firstRecordTime) : '--:--'}
          </h3>
          <span className="tile-sub">
            {metrics.firstRecordTime ? formatLocalDateTime(metrics.firstRecordTime) : 'No points today'}
          </span>
        </div>

        <div className="card geo-metric-tile">
          <span className="tile-label">LAST RECORDED POINT</span>
          <h3 className="tile-val">
            {metrics.lastRecordTime ? formatLocalTime(metrics.lastRecordTime) : '--:--'}
          </h3>
          <span className="tile-sub">
            {metrics.lastRecordTime ? formatLocalDateTime(metrics.lastRecordTime) : 'No points today'}
          </span>
        </div>
      </div>

      {/* GPS Location Data Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h3>Location Breadcrumbs ({selectedDate})</h3>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>
            Captured ~15 min intervals
          </span>
        </div>

        <DataTable
          columns={columns}
          data={locations}
          loading={loading}
          emptyMessage={`No GPS records found for ${selectedUser?.username || 'this user'} on ${selectedDate} within permitted working hours.`}
          searchPlaceholder="Filter coordinates..."
          pageSize={15}
        />
      </div>
    </div>
  );
}
