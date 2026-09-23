import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { DAYS_OF_WEEK, validateSchedule } from '../../utils/scheduleUtils';
import { updateGroupSchedule } from '../../services/scheduleService';
import { DEFAULT_TIMEZONE } from '../../utils/dateUtils';
import { useNotification } from '../../hooks/useNotification';

export default function ScheduleFormModal({
  isOpen,
  onClose,
  schedule,
  groupName,
  onScheduleUpdated,
}) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [activeDays, setActiveDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { showToast } = useNotification();

  useEffect(() => {
    if (schedule) {
      setStartTime(schedule.start_time || '09:00');
      setEndTime(schedule.end_time || '18:00');
      setActiveDays(schedule.active_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
      setErrors({});
    }
  }, [schedule]);

  const toggleDay = (day) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const scheduleData = {
      group_id: schedule?.group_id || '',
      start_time: startTime,
      end_time: endTime,
      active_days: activeDays,
      timezone: schedule?.timezone || DEFAULT_TIMEZONE,
      status: 'Active',
    };

    const validation = validateSchedule(scheduleData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await updateGroupSchedule(schedule.id, scheduleData);
      showToast(`Schedule for "${groupName}" updated successfully. Changes apply immediately!`, 'success');
      if (onScheduleUpdated) onScheduleUpdated();
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to update schedule.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={`Configure Working Schedule - ${groupName}`}
      onClose={onClose}
      maxWidth="540px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {errors.form && (
          <div className="badge-danger" style={{ padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)' }}>
            {errors.form}
          </div>
        )}

        <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', color: 'var(--info-text)' }}>
          <strong>Immediate Application:</strong> Any update made here immediately takes effect for all users assigned to this group.
          Historical GPS records are preserved intact.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label htmlFor="schedule-start-time">Start Time (Inclusive) *</label>
            <input
              id="schedule-start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={loading}
              required
            />
            {errors.start_time && (
              <span style={{ color: 'var(--danger-main)', fontSize: 'var(--font-size-xs)' }}>
                {errors.start_time}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="schedule-end-time">End Time (Exclusive) *</label>
            <input
              id="schedule-end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={loading}
              required
            />
            {errors.end_time && (
              <span style={{ color: 'var(--danger-main)', fontSize: 'var(--font-size-xs)' }}>
                {errors.end_time}
              </span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Active Working Days *</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-1)' }}>
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = activeDays.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  disabled={loading}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isSelected ? 'var(--primary-600)' : 'var(--border-subtle)'}`,
                    backgroundColor: isSelected ? 'var(--primary-600)' : 'var(--neutral-white)',
                    color: isSelected ? 'var(--neutral-white)' : 'var(--neutral-700)',
                    fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                    fontSize: 'var(--font-size-xs)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {errors.active_days && (
            <span style={{ color: 'var(--danger-main)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
              {errors.active_days}
            </span>
          )}
        </div>

        <div className="form-group">
          <label>Configured Timezone</label>
          <input
            type="text"
            value={`${schedule?.timezone || DEFAULT_TIMEZONE} (Standard)`}
            disabled
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Save & Apply Immediately
          </Button>
        </div>
      </form>
    </Modal>
  );
}
