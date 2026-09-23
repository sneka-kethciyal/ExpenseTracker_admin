import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Users,
  CalendarClock,
  Edit3,
  Trash2,
  Plus,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from '../../services/groupService';
import { getAllSchedules } from '../../services/scheduleService';
import { DAYS_OF_WEEK } from '../../utils/scheduleUtils';
import { formatLocalDateTime, DEFAULT_TIMEZONE } from '../../utils/dateUtils';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ScheduleFormModal from '../../components/schedules/ScheduleFormModal';
import './GroupsPage.css';

const INITIAL_ADD_FORM = {
  name: '',
  description: '',
  startTime: '09:00',
  endTime: '18:00',
  activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  status: 'Active',
};

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(INITIAL_ADD_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [editingGroup, setEditingGroup] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', status: 'Active' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [editingScheduleGroup, setEditingScheduleGroup] = useState(null);

  const [deletingGroup, setDeletingGroup] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const { showToast } = useNotification();
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedGroups, fetchedSchedules] = await Promise.all([
        getAllGroups(),
        getAllSchedules(),
      ]);
      setGroups(fetchedGroups.filter((group) => group.id !== 'admin' && group.id !== 'field_worker'));
      setSchedules(fetchedSchedules);
    } catch (err) {
      console.error('Error loading groups:', err);
      showToast('Failed to load groups data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper to match schedule for a group
  const getScheduleForGroup = (groupId) => {
    return schedules.find((s) => s.group_id === groupId);
  };

  // Day toggle in Add form
  const toggleAddDay = (day) => {
    setAddForm((prev) => {
      const exists = prev.activeDays.includes(day);
      const nextDays = exists
        ? prev.activeDays.filter((d) => d !== day)
        : [...prev.activeDays, day];
      return { ...prev, activeDays: nextDays };
    });
  };

  // Create Group handler
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!addForm.name.trim()) {
      setAddError('Group name is required.');
      return;
    }
    if (addForm.activeDays.length === 0) {
      setAddError('Please select at least one active working day.');
      return;
    }
    setAddLoading(true);
    try {
      await createGroup(addForm);
      showToast(`Group "${addForm.name.trim()}" created successfully.`, 'success');
      setShowAddModal(false);
      setAddForm(INITIAL_ADD_FORM);
      loadData();
    } catch (err) {
      setAddError(err.message || 'Failed to create group.');
    } finally {
      setAddLoading(false);
    }
  };

  // Edit Group handler
  const handleEditClick = (group) => {
    setEditingGroup(group);
    setEditError('');
    setEditFormData({
      name: group.name,
      description: group.description || '',
      status: group.status || 'Active',
    });
  };

  const handleSaveEditGroup = async (e) => {
    e.preventDefault();
    if (!editingGroup) return;

    if (editFormData.status === 'Inactive' && editingGroup.userCount > 0) {
      setEditError(
        `Cannot deactivate "${editingGroup.name}" because ${editingGroup.userCount} assigned user(s) currently belong to it.`
      );
      return;
    }

    setEditLoading(true);
    setEditError('');
    try {
      await updateGroup(editingGroup.id, editFormData);
      showToast(`Group "${editFormData.name}" updated successfully.`, 'success');
      setEditingGroup(null);
      loadData();
    } catch (err) {
      setEditError(err.message || 'Error updating group.');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Group handler
  const handleDeleteClick = (group) => {
    setDeletingGroup(group);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!deletingGroup) return;

    if (deletingGroup.userCount > 0) {
      setDeleteError(
        `Cannot delete "${deletingGroup.name}": ${deletingGroup.userCount} user(s) are assigned to this group. Reassign them first.`
      );
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteGroup(deletingGroup.id);
      showToast(`Group "${deletingGroup.name}" deleted successfully.`, 'success');
      setDeletingGroup(null);
      loadData();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete group.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="groups-page">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            className="group-header-icon"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--primary-200)',
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <h2>Group Management</h2>
            <p>Configure workforce groups, assigned members, operational schedules, and working hours.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button variant="outline" icon={RefreshCw} onClick={loadData} loading={loading}>
            Refresh
          </Button>
          {isSuperAdmin && (
            <Button
              id="create-group-header-btn"
              variant="primary"
              icon={Plus}
              onClick={() => {
                setAddForm(INITIAL_ADD_FORM);
                setAddError('');
                setShowAddModal(true);
              }}
            >
              Add Group
            </Button>
          )}
        </div>
      </div>

      {/* Policy Card */}
      <div className="card schedule-policy-card">
        <div className="policy-header">
          <Clock size={18} className="policy-icon" />
          <h4 style={{ fontWeight: 600 }}>Enforcement Policy & Rule Semantics</h4>
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

      {/* Groups Grid */}
      {loading ? (
        <div className="groups-grid">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card" style={{ height: '320px' }}>
              <div className="skeleton" style={{ height: '28px', width: '150px', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ height: '80px', width: '100%', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ height: '24px', width: '60%' }} />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          gap: '1rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            backgroundColor: 'var(--neutral-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--neutral-400)',
          }}>
            <Layers size={30} />
          </div>
          <div>
            <h3 style={{ color: 'var(--neutral-700)', marginBottom: '0.375rem' }}>No Groups Found</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-400)', maxWidth: '320px' }}>
              No groups exist in Firestore. Create your first group to start assigning users and schedules.
            </p>
          </div>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => {
            const sched = getScheduleForGroup(group.id);
            return (
              <div key={group.id} className="card group-card">
                {/* Header */}
                <div className="group-card-header">
                  <div className="group-card-title-row">
                    <div
                      className="group-icon-circle custom"
                    >
                      <Layers size={20} />
                    </div>
                    <div>
                      <h3 className="group-title">{group.name}</h3>
                      <span className="group-id-badge">ID: {group.id}</span>
                    </div>
                  </div>
                  <span
                    className={`badge ${group.status === 'Active' ? 'badge-success' : 'badge-danger'
                      }`}
                  >
                    <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    {group.status || 'Active'}
                  </span>
                </div>

                {/* Description */}
                <p className="group-description">
                  {group.description || 'No description provided for this group.'}
                </p>

                {/* Schedule Working Hours Box */}
                <div className="schedule-time-box">
                  <div className="time-endpoint">
                    <span className="time-label">START TIME (INCLUSIVE)</span>
                    <span className="time-val">{sched?.start_time || 'Not configured'}</span>
                  </div>
                  <div className="time-divider">&rarr;</div>
                  <div className="time-endpoint">
                    <span className="time-label">END TIME (EXCLUSIVE)</span>
                    <span className="time-val">{sched?.end_time || 'Not configured'}</span>
                  </div>
                </div>

                {/* Meta stats list */}
                <div className="group-meta-stats">
                  <div className="group-meta-item">
                    <CalendarClock size={15} className="meta-icon" />
                    <span style={{ fontWeight: 600, marginRight: '4px' }}>Active Days:</span>
                    <div className="day-badges">
                      {sched?.active_days && sched.active_days.length > 0 ? (
                        sched.active_days.map((day) => (
                          <span key={day} className="day-pill">
                            {day}
                          </span>
                        ))
                      ) : (
                        <span className="day-pill">Not configured</span>
                      )}
                    </div>
                  </div>

                  <div className="group-meta-item">
                    <Users size={15} className="meta-icon" />
                    <span>
                      <strong>{group.userCount || 0}</strong> assigned user
                      {group.userCount === 1 ? '' : 's'}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/users?group=${group.id}`)}
                      style={{
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-600)',
                        fontSize: 'var(--font-size-xs)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                      }}
                    >
                      View users
                    </button>
                  </div>

                  <div className="group-meta-item">
                    <Globe size={15} className="meta-icon" />
                    <span>
                      Timezone:{' '}
                      <strong>{sched?.timezone || DEFAULT_TIMEZONE}</strong>
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="group-card-actions">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CalendarClock}
                    onClick={() =>
                      setEditingScheduleGroup({
                        group,
                        schedule: sched || {
                          id: group.default_schedule_id || `sched_${group.id}_default`,
                          group_id: group.id,
                          start_time: group.start_time || '09:00',
                          end_time: group.end_time || '18:00',
                          active_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                        },
                      })
                    }
                  >
                    Adjust Working Hours
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Edit3}
                    onClick={() => handleEditClick(group)}
                  >
                    Edit Info
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDeleteClick(group)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ────────────────── CRUD MODALS ────────────────── */}

      {/* 1. Add Group Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          title="Add New Group"
          onClose={() => {
            setShowAddModal(false);
            setAddError('');
          }}
          maxWidth="520px"
        >
          <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {addError && (
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  alignItems: 'center',
                  color: 'var(--danger-text, #b91c1c)',
                  backgroundColor: 'var(--danger-bg, #fee2e2)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <AlertTriangle size={16} />
                <span>{addError}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="add-group-name">
                Group Name <span style={{ color: 'var(--danger-text, #b91c1c)' }}>*</span>
              </label>
              <input
                id="add-group-name"
                type="text"
                placeholder="e.g. Supervisor, Regional Manager"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="add-group-desc">Description</label>
              <textarea
                id="add-group-desc"
                rows={2}
                placeholder="Brief description of responsibilities or operational scope"
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label htmlFor="add-group-start">Start Time (Inclusive)</label>
                <input
                  id="add-group-start"
                  type="time"
                  value={addForm.startTime}
                  onChange={(e) => setAddForm({ ...addForm, startTime: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="add-group-end">End Time (Exclusive)</label>
                <input
                  id="add-group-end"
                  type="time"
                  value={addForm.endTime}
                  onChange={(e) => setAddForm({ ...addForm, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Active Days</label>
              <div className="days-toggle-row">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = addForm.activeDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`day-toggle-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleAddDay(day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="add-group-status">Status</label>
              <select
                id="add-group-status"
                value={addForm.status}
                onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setAddError('');
                }}
                disabled={addLoading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={addLoading}>
                Create Group
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. Edit Group Info Modal */}
      {editingGroup && (
        <Modal
          isOpen={Boolean(editingGroup)}
          title={`Edit Group: ${editingGroup.name}`}
          onClose={() => {
            setEditingGroup(null);
            setEditError('');
          }}
          maxWidth="500px"
        >
          <form onSubmit={handleSaveEditGroup} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {editError && (
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  alignItems: 'center',
                  color: 'var(--danger-text, #b91c1c)',
                  backgroundColor: 'var(--danger-bg, #fee2e2)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <AlertTriangle size={16} />
                <span>{editError}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="edit-group-name">Group Name</label>
              <input
                id="edit-group-name"
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                disabled={editingGroup.id === 'admin' || editingGroup.id === 'field_worker'}
                required
              />
              {(editingGroup.id === 'admin' || editingGroup.id === 'field_worker') && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)', marginTop: '2px' }}>
                  Default system group names cannot be renamed.
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="edit-group-desc">Description</label>
              <textarea
                id="edit-group-desc"
                rows={3}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-group-status">Status</label>
              <select
                id="edit-group-status"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {editingGroup.userCount > 0 && editFormData.status === 'Inactive' && (
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  color: 'var(--warning-text)',
                  backgroundColor: 'var(--warning-bg)',
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                <AlertTriangle size={16} />
                <span>Warning: Disabling this group impacts {editingGroup.userCount} active assigned user(s).</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingGroup(null);
                  setEditError('');
                }}
                disabled={editLoading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={editLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Schedule Edit Modal */}
      {editingScheduleGroup && (
        <ScheduleFormModal
          isOpen={Boolean(editingScheduleGroup)}
          onClose={() => setEditingScheduleGroup(null)}
          groupName={editingScheduleGroup.group.name}
          schedule={editingScheduleGroup.schedule}
          onScheduleUpdated={loadData}
        />
      )}

      {/* 4. Delete Group Confirmation Modal */}
      {deletingGroup && (
        <Modal
          isOpen={Boolean(deletingGroup)}
          title={`Delete Group: ${deletingGroup.name}`}
          onClose={() => {
            setDeletingGroup(null);
            setDeleteError('');
          }}
          maxWidth="460px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {deleteError ? (
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  alignItems: 'center',
                  color: 'var(--danger-text, #b91c1c)',
                  backgroundColor: 'var(--danger-bg, #fee2e2)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <AlertTriangle size={16} />
                <span>{deleteError}</span>
              </div>
            ) : deletingGroup.userCount > 0 ? (
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  color: 'var(--danger-text, #b91c1c)',
                  backgroundColor: 'var(--danger-bg, #fee2e2)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Cannot delete group:</strong> {deletingGroup.userCount} assigned user(s) currently belong
                  to <strong>{deletingGroup.name}</strong>. Please reassign those members to another group before deleting.
                </span>
              </div>
            ) : (
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-700)', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete the group <strong>"{deletingGroup.name}"</strong>?
                This will also remove its associated working hours schedule. This action cannot be undone.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setDeletingGroup(null);
                  setDeleteError('');
                }}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={deleteLoading}
                disabled={deletingGroup.userCount > 0}
                onClick={handleConfirmDelete}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
