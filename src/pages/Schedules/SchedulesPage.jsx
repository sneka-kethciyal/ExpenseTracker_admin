import React, { useState, useEffect, useCallback } from 'react';
import { CalendarClock, Shield, Users, RefreshCw, CheckCircle2, Clock, Globe } from 'lucide-react';
import { getAllSchedules } from '../../services/scheduleService';
import { getAllGroups } from '../../services/groupService';
import { formatLocalDateTime, DEFAULT_TIMEZONE } from '../../utils/dateUtils';
import { useNotification } from '../../hooks/useNotification';
import Button from '../../components/common/Button';
import ScheduleFormModal from '../../components/schedules/ScheduleFormModal';
import './SchedulesPage.css';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalSchedule, setActiveModalSchedule] = useState(null);

  const { showToast } = useNotification();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedList, groupList] = await Promise.all([
        getAllSchedules(),
        getAllGroups(),
      ]);
      setSchedules(schedList);
      setGroups(groupList);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      showToast('Failed to load schedule configurations.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getGroupName = (groupId) => {
    const found = groups.find((g) => g.id === groupId);
    return found ? found.name : groupId;
  };

  return (
    <div className="schedules-page">
      <div className="page-header">
        <div>
          <h2>Schedule Management</h2>
          <p>Configure working hours and tracking rules that apply immediately to assigned group users.</p>
        </div>
        <Button variant="outline" icon={RefreshCw} onClick={loadData} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Policy Card */}
      <div className="card schedule-policy-card">
        <div className="policy-header">
          <Clock size={20} className="policy-icon" />
          <h4>Enforcement Policy & Rule Semantics</h4>
        </div>
        <div className="policy-content">
          <p>
            <strong>Inclusive / Exclusive Rule:</strong> Tracking is strictly enforced such that{' '}
            <code>Start Time &le; Current Time &lt; End Time</code>.
          </p>
          <p>
            <strong>Instant Sync:</strong> Updates saved here immediately take effect for all assigned users in the Flutter app & Web Dashboard.
          </p>
          <p>
            <strong>Historical Integrity:</strong> Adjusting group schedules never rewrites or deletes past GPS records.
          </p>
        </div>
      </div>

      {/* Schedules List */}
      <div className="schedules-grid">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card" style={{ height: '240px' }}>
              <div className="skeleton" style={{ height: '24px', width: '120px', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ height: '60px', width: '100%', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ height: '20px', width: '50%' }} />
            </div>
          ))
        ) : (
          schedules.map((sched) => {
            const groupName = getGroupName(sched.group_id);
            const isAdmin = sched.group_id === 'admin';

            return (
              <div key={sched.id} className="card schedule-card">
                <div className="schedule-card-header">
                  <div className="schedule-group-title">
                    <div className={`schedule-icon-wrapper ${isAdmin ? 'admin' : 'worker'}`}>
                      {isAdmin ? <Shield size={18} /> : <Users size={18} />}
                    </div>
                    <div>
                      <h3>{groupName} Schedule</h3>
                      <span className="schedule-id-sub">Schedule ID: {sched.id}</span>
                    </div>
                  </div>
                  <span className="badge badge-success">
                    <CheckCircle2 size={12} />
                    Active
                  </span>
                </div>

                <div className="schedule-time-box">
                  <div className="time-endpoint">
                    <span className="time-label">START TIME (INCLUSIVE)</span>
                    <span className="time-val">{sched.start_time}</span>
                  </div>
                  <div className="time-divider">&rarr;</div>
                  <div className="time-endpoint">
                    <span className="time-label">END TIME (EXCLUSIVE)</span>
                    <span className="time-val">{sched.end_time}</span>
                  </div>
                </div>

                <div className="schedule-details-list">
                  <div className="schedule-detail-row">
                    <span className="detail-key">Active Days:</span>
                    <div className="day-badges">
                      {sched.active_days && sched.active_days.length > 0 ? (
                        sched.active_days.map((day) => (
                          <span key={day} className="day-pill">{day}</span>
                        ))
                      ) : (
                        <span className="day-pill">All days</span>
                      )}
                    </div>
                  </div>

                  <div className="schedule-detail-row">
                    <span className="detail-key">Target Timezone:</span>
                    <span className="detail-val">
                      <Globe size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      {sched.timezone || DEFAULT_TIMEZONE}
                    </span>
                  </div>

                  <div className="schedule-detail-row">
                    <span className="detail-key">Last Updated:</span>
                    <span className="detail-val">
                      {sched.updated_at ? formatLocalDateTime(sched.updated_at) : 'Default Seed'}
                    </span>
                  </div>
                </div>

                <div className="schedule-card-footer">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CalendarClock}
                    onClick={() => setActiveModalSchedule({ schedule: sched, groupName })}
                  >
                    Adjust Working Hours
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {activeModalSchedule && (
        <ScheduleFormModal
          isOpen={Boolean(activeModalSchedule)}
          onClose={() => setActiveModalSchedule(null)}
          groupName={activeModalSchedule.groupName}
          schedule={activeModalSchedule.schedule}
          onScheduleUpdated={loadData}
        />
      )}
    </div>
  );
}
