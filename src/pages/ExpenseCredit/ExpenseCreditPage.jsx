import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  User,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeft,
} from 'lucide-react';
import { getAllUsers } from '../../services/userService';
import { getAllGroups } from '../../services/groupService';
import { getUserFinancialData } from '../../services/financeService';
import { SUPER_ADMIN_EMAIL } from '../../services/authService';
import { formatCurrency } from '../../utils/formatUtils';
import { formatLocalDateTime, getLocalDateString } from '../../utils/dateUtils';
import { useNotification } from '../../hooks/useNotification';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import MonthlyFinanceChart from '../../components/finance/MonthlyFinanceChart';
import './ExpenseCreditPage.css';

export default function ExpenseCreditPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUserId = searchParams.get('userId') || '';

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(initialUserId);
  const [selectedMonth, setSelectedMonth] = useState(() => getLocalDateString().slice(0, 7)); // 'YYYY-MM'
  const [financeData, setFinanceData] = useState({
    credits: [],
    expenses: [],
    transactions: [],
    totalCredits: 0,
    totalExpenses: 0,
    balance: 0,
    monthlySummary: [],
  });
  const [loading, setLoading] = useState(false);

  const { showToast } = useNotification();

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
        console.error('Error fetching users:', err);
      }
    }
    loadUsers();
  }, [selectedUserId]);

  const loadFinancialData = useCallback(async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const data = await getUserFinancialData(selectedUserId, selectedMonth === 'ALL' ? null : selectedMonth);
      setFinanceData(data);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      showToast('Failed to load user financial records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, selectedMonth, showToast]);

  useEffect(() => {
    if (selectedUserId) {
      loadFinancialData();
    }
  }, [loadFinancialData, selectedUserId]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const columns = [
    {
      header: 'Type',
      accessor: 'type',
      render: (row) => {
        const isCredit = row.type === 'Credit';
        return (
          <span className={`badge ${isCredit ? 'badge-success' : 'badge-danger'}`}>
            {isCredit ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
            {row.type}
          </span>
        );
      },
    },
    {
      header: 'Description / Item Name',
      accessor: 'title',
      render: (row) => (
        <div>
          <strong style={{ color: 'var(--neutral-900)' }}>{row.title}</strong>
          {row.month && (
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--neutral-400)' }}>
              Month: {row.month}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (row) => {
        const isCredit = row.type === 'Credit';
        return (
          <span
            style={{
              fontWeight: 'var(--font-weight-semibold)',
              color: isCredit ? 'var(--success-text)' : 'var(--danger-text)',
            }}
          >
            {isCredit ? '+' : '-'} {formatCurrency(row.amount)}
          </span>
        );
      },
    },
    {
      header: 'Date & Time',
      accessor: 'date',
      render: (row) => (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-600)' }}>
          {row.date ? formatLocalDateTime(row.date) : '--'}
        </span>
      ),
    },
  ];

  return (
    <div className="expense-credit-page">
      <div className="page-header">
        <div>
          <h2>Expense & Credit Management</h2>
          <p>Review credits, expenses, and remaining balances collected through the Flutter application.</p>
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
            onClick={loadFinancialData}
            loading={loading}
          >
            Refresh Records
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="card finance-controls-card">
        <div className="control-group">
          <label htmlFor="finance-user-select">
            <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Select User
          </label>
          <select
            id="finance-user-select"
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

        <div className="control-group">
          <label htmlFor="finance-month-select">
            <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Filter Month
          </label>
          <input
            id="finance-month-select"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="finance-kpi-grid">
        <StatCard
          title="Total Credits"
          value={formatCurrency(financeData.totalCredits)}
          subtitle={`Deposits credited to ${selectedUser?.username || 'user'}`}
          icon={TrendingUp}
          variant="success"
          loading={loading}
        />

        <StatCard
          title="Total Expenses"
          value={formatCurrency(financeData.totalExpenses)}
          subtitle={`Expenses submitted by ${selectedUser?.username || 'user'}`}
          icon={TrendingDown}
          variant="danger"
          loading={loading}
        />

        <StatCard
          title="Remaining Balance"
          value={formatCurrency(financeData.balance)}
          subtitle={financeData.balance < 0 ? 'Negative balance: Expenses exceed credits' : 'Credits - Expenses'}
          icon={Wallet}
          variant={financeData.balance < 0 ? 'danger' : 'primary'}
          loading={loading}
        />
      </div>

      {/* Monthly Chart Section */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-2)' }}>Monthly Comparison: Credits vs Expenses</h3>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)', marginBottom: 'var(--space-4)' }}>
          Historical trends of credits received and expenses submitted.
        </p>
        <MonthlyFinanceChart data={financeData.monthlySummary} />
      </div>

      {/* Transactions Data Table */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Transaction Breakdown ({financeData.transactions.length} records)</h3>
        <DataTable
          columns={columns}
          data={financeData.transactions}
          loading={loading}
          emptyMessage={`No financial transactions found for ${selectedUser?.username || 'this user'}.`}
          searchPlaceholder="Search item name or description..."
        />
      </div>
    </div>
  );
}
