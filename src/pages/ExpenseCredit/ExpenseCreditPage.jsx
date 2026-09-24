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
  FileDown,
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
import Modal from '../../components/common/Modal';
import MonthlyFinanceChart from '../../components/finance/MonthlyFinanceChart';
import './ExpenseCreditPage.css';

export default function ExpenseCreditPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUserId = searchParams.get('userId') || '';

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(initialUserId);
  const [fromDate, setFromDate] = useState(() => getLocalDateString());
  const [toDate, setToDate] = useState(() => getLocalDateString());
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);
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
    setFinanceData({
      credits: [],
      expenses: [],
      transactions: [],
      totalCredits: 0,
      totalExpenses: 0,
      balance: 0,
      monthlySummary: [],
    });
    try {
      const data = await getUserFinancialData(selectedUserId, {
        startMonth: fromDate.slice(0, 7),
        endMonth: toDate.slice(0, 7),
      });
      setFinanceData(data);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      showToast('Failed to load user financial records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, fromDate, toDate, showToast]);

  useEffect(() => {
    if (selectedUserId) {
      loadFinancialData();
    }
  }, [loadFinancialData, selectedUserId]);

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const filteredTransactions = financeData.transactions.filter(
    (transaction) => transaction.date
      && getLocalDateString(transaction.date) >= fromDate
      && getLocalDateString(transaction.date) <= toDate
  );

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
          <label htmlFor="finance-from-date">
            <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
            From Date
          </label>
          <input
            id="finance-from-date"
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="finance-to-date">
            <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
            To Date
          </label>
          <input
            id="finance-to-date"
            type="date"
            value={toDate}
            min={fromDate}
            onChange={(e) => setToDate(e.target.value)}
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
        <div className="finance-table-header">
          <h3>Transactions from {fromDate} to {toDate} ({filteredTransactions.length} records)</h3>
          <Button
            variant="outline"
            size="sm"
            icon={FileDown}
            onClick={() => setIsReportPreviewOpen(true)}
            disabled={filteredTransactions.length === 0}
          >
            Download PDF
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={filteredTransactions}
          loading={loading}
          emptyMessage={`No transactions found from ${fromDate} to ${toDate}.`}
          searchPlaceholder="Search item name or description..."
        />
      </div>

      <Modal
        isOpen={isReportPreviewOpen}
        title="Expense Report Preview"
        onClose={() => setIsReportPreviewOpen(false)}
        maxWidth="900px"
      >
        <div className="pdf-report-print-area">
          <div className="pdf-report-heading">
            <div>
              <h2>Expense & Credit Report</h2>
              <p>{selectedUser?.username || 'User'} | {fromDate} to {toDate}</p>
            </div>
            <div className="pdf-report-summary">
              <span>Total records: {filteredTransactions.length}</span>
              <span>Expenses: {formatCurrency(filteredTransactions.filter((row) => row.type === 'Expense').reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0))}</span>
            </div>
          </div>
          <table className="pdf-report-table">
            <thead>
              <tr><th>Type</th><th>Description / Item</th><th>Amount</th><th>Date & Time</th></tr>
            </thead>
            <tbody>
              {filteredTransactions.map((row) => (
                <tr key={`${row.type}-${row.id}`}>
                  <td>{row.type}</td>
                  <td>{row.title}</td>
                  <td>{row.type === 'Credit' ? '+' : '-'} {formatCurrency(row.amount)}</td>
                  <td>{row.date ? formatLocalDateTime(row.date) : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pdf-preview-actions no-print">
          <Button variant="outline" onClick={() => setIsReportPreviewOpen(false)}>Close</Button>
          <Button variant="primary" icon={FileDown} onClick={() => window.print()}>Print / Save as PDF</Button>
        </div>
      </Modal>
    </div>
  );
}
