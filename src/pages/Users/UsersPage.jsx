import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Shield, User, RefreshCw, Eye, Power } from 'lucide-react';
import { getAllUsers, updateUserStatus } from '../../services/userService';
import { getAllGroups } from '../../services/groupService';
import { SUPER_ADMIN_EMAIL } from '../../services/authService';
import { formatLocalDateTime } from '../../utils/dateUtils';
import { useNotification } from '../../hooks/useNotification';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import CreateUserModal from '../../components/users/CreateUserModal';
import './UsersPage.css';

export default function UsersPage() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState(
    () => searchParams.get('group') || 'ALL'
  );
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  const { showToast, confirmModal } = useNotification();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedGroups] = await Promise.all([
        getAllUsers(),
        getAllGroups(),
      ]);
      // Exclude system administrator account from workforce management list
      const workforce = fetchedUsers.filter((u) => {
        const email = u.email?.toLowerCase();
        const username = u.username?.toLowerCase();
        const role = u.role?.toLowerCase();
        return (
          email !== SUPER_ADMIN_EMAIL.toLowerCase() &&
          username !== 'super_admin' &&
          role !== 'super_admin'
        );
      });
      setUsers(workforce);
      setGroups(
        fetchedGroups.filter((group) => {
          const groupName = group.name?.trim().toLowerCase();
          return group.id !== 'admin'
            && group.id !== 'field_worker'
            && groupName !== 'supervisor'
            && groupName !== 'field worker';
        })
      );
    } catch (err) {
      console.error('Error fetching users:', err);
      showToast('Failed to load user list from Firestore.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleStatus = (user) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    confirmModal({
      title: `${nextStatus === 'Active' ? 'Activate' : 'Deactivate'} User`,
      message: `Are you sure you want to change status of "${user.username}" to ${nextStatus}?`,
      variant: nextStatus === 'Active' ? 'primary' : 'danger',
      confirmText: nextStatus === 'Active' ? 'Activate' : 'Deactivate',
      onConfirm: async () => {
        try {
          await updateUserStatus(user.id, nextStatus);
          showToast(`User "${user.username}" is now ${nextStatus}.`, 'success');
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
          );
        } catch (err) {
          showToast(`Error updating status: ${err.message}`, 'error');
        }
      },
    });
  };

  // Filter users based on group and status dropdowns
  const filteredUsers = users.filter((u) => {
    const groupMatch =
      selectedGroupFilter === 'ALL' ||
      u.group_id === selectedGroupFilter;
    const statusMatch =
      selectedStatusFilter === 'ALL' || u.status === selectedStatusFilter;
    return groupMatch && statusMatch;
  });

  const columns = [
    {
      header: 'User',
      accessor: 'username',
      render: (row) => (
        <div className="user-table-profile">
          <div className={`user-avatar-circle ${row.group_id === 'admin' || row.group_id === 'supervisor' ? 'supervisor' : 'worker'}`}>
            {(row.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="user-profile-details">
            <span className="user-username-label">{row.username}</span>
            <span className="user-email-label">{row.email || `${row.username}@expensetracker.com`}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Group',
      accessor: 'group_id',
      render: (row) => {
        const groupObj = groups.find((g) => g.id === row.group_id);
        const isSupervisor = row.group_id === 'admin' || row.group_id === 'supervisor';
        const groupName = groupObj?.name || 'Unassigned';
        return (
          <span className={`badge ${isSupervisor ? 'badge-primary' : 'badge-neutral'}`}>
            {isSupervisor ? <Shield size={12} /> : <User size={12} />}
            {groupName}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span
          className={`badge ${
            row.status === 'Active' ? 'badge-success' : 'badge-danger'
          }`}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'currentColor',
              display: 'inline-block',
            }}
          />
          {row.status || 'Active'}
        </span>
      ),
    },
    {
      header: 'Created On',
      accessor: 'created_at',
      render: (row) => (
        <span className="user-created-date">
          {formatLocalDateTime(row.created_at)}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="user-action-buttons">
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => navigate(`/users/${row.id}`)}
            title="View Details"
          >
            Details
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Power}
            onClick={() => handleToggleStatus(row)}
            title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
            className={row.status === 'Active' ? 'action-deactivate' : 'action-activate'}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h2>User Management</h2>
          <p>Create and manage administrator accounts and mobile field workers.</p>
        </div>
        <div className="page-header-actions">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={loadData}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => setIsModalOpen(true)}
          >
            Create New User
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="users-filter-bar card">
        <div className="filter-group">
          <label htmlFor="filter-group">Filter by Group</label>
          <select
            id="filter-group"
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
          >
            <option value="ALL">All Groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-status">Filter by Status</label>
          <select
            id="filter-status"
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={filteredUsers}
          loading={loading}
          emptyMessage="No users matching the selected filters found."
          searchPlaceholder="Search by username or email..."
        />
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserCreated={loadData}
        groups={groups}
      />
    </div>
  );
}
