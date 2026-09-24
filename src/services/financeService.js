import {
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { toDate } from '../utils/dateUtils';

/**
 * Fetches credits and expenses for a specific user and calculates balance
 * Structure: users/{userId}/months/{month}/credits and expenses
 *
 * @param {string} userId - User UID
 * @param {string} [monthFilter] - Optional 'YYYY-MM'
 */
export async function getUserFinancialData(userId, monthFilter = null) {
  if (!userId || !db) {
    return {
      credits: [],
      expenses: [],
      totalCredits: 0,
      totalExpenses: 0,
      balance: 0,
      monthlySummary: [],
    };
  }

  const isRangeFilter = monthFilter && typeof monthFilter === 'object';
  const rangeStart = isRangeFilter ? monthFilter.startMonth : monthFilter;
  const rangeEnd = isRangeFilter ? monthFilter.endMonth : monthFilter;
  let monthDocs = [];

  if (rangeEnd && /^\d{4}-\d{2}$/.test(rangeEnd)) {
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'months'));
      monthDocs = snap.docs
        .filter((docSnap) => docSnap.id <= rangeEnd)
        .map((docSnap) => ({ id: docSnap.id }));
    } catch (err) {
      console.warn('Error fetching historical user months:', err.message);
    }

    // The selected month may have subcollections without a parent document.
    const [endYear, endMonth] = rangeEnd.split('-').map(Number);
    const [startYear, startMonth] = (rangeStart || rangeEnd).split('-').map(Number);
    const knownMonths = new Set(monthDocs.map((doc) => doc.id));
    const firstPeriodMonth = new Date(Date.UTC(startYear, startMonth - 1, 1));
    const lastPeriodMonth = new Date(Date.UTC(endYear, endMonth - 1, 1));
    for (
      const monthDate = new Date(firstPeriodMonth);
      monthDate <= lastPeriodMonth;
      monthDate.setUTCMonth(monthDate.getUTCMonth() + 1)
    ) {
      const monthKey = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, '0')}`;
      if (!knownMonths.has(monthKey)) {
        monthDocs.push({ id: monthKey });
        knownMonths.add(monthKey);
      }
    }

    for (let offset = 1; offset <= 12; offset += 1) {
      const previousMonthDate = new Date(Date.UTC(startYear, startMonth - 1 - offset, 1));
      const previousMonth = `${previousMonthDate.getUTCFullYear()}-${String(
        previousMonthDate.getUTCMonth() + 1
      ).padStart(2, '0')}`;
      if (!knownMonths.has(previousMonth)) {
        monthDocs.push({ id: previousMonth });
        knownMonths.add(previousMonth);
      }
    }
  } else {
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'months'));
      monthDocs = snap.docs;
    } catch (err) {
      console.warn('Error fetching user months:', err.message);
    }
  }

  let allCredits = [];
  let allExpenses = [];

  // If specific month requested, filter or inspect that month doc
  for (const mDoc of monthDocs) {
    const monthKey = mDoc.id; // e.g. "2026-09"
    // Credits subcollection
    try {
      const credSnap = await getDocs(collection(db, 'users', userId, 'months', monthKey, 'credits'));
      credSnap.forEach((docSnap) => {
        const data = docSnap.data();
        allCredits.push({
          id: docSnap.id,
          month: monthKey,
          type: 'Credit',
          ...data,
          amount: data.amount ?? data.credit_amount ?? data.credit ?? data.value ?? data.monthly_credit ?? 0,
        });
      });
    } catch (e) {
      console.warn(`Credits subcollection query failed for ${monthKey}:`, e.message);
    }

    // Expenses subcollection
    try {
      const expSnap = await getDocs(collection(db, 'users', userId, 'months', monthKey, 'expenses'));
      expSnap.forEach((docSnap) => {
        const data = docSnap.data();
        allExpenses.push({
          id: docSnap.id,
          month: monthKey,
          type: 'Expense',
          ...data,
          // Mobile expense records use expense_amount instead of amount.
          amount: data.expense_amount ?? data.amount ?? 0,
        });
      });
    } catch (e) {
      console.warn(`Expenses subcollection query failed for ${monthKey}:`, e.message);
    }
  }

  const selectedCredits = rangeStart
    ? allCredits.filter((item) => item.month >= rangeStart && item.month <= (rangeEnd || rangeStart))
    : allCredits;
  const selectedExpenses = rangeStart
    ? allExpenses.filter((item) => item.month >= rangeStart && item.month <= (rangeEnd || rangeStart))
    : allExpenses;
  const previousCredits = rangeStart
    ? allCredits.filter((item) => item.month < rangeStart)
    : [];
  const previousExpenses = rangeStart
    ? allExpenses.filter((item) => item.month < rangeStart)
    : [];
  const sumAmounts = (items) => items.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );
  const totalCredits = sumAmounts(selectedCredits);
  const totalExpenses = sumAmounts(selectedExpenses);
  const previousBalance = sumAmounts(previousCredits) - sumAmounts(previousExpenses);
  const balance = previousBalance + sumAmounts(selectedCredits) - totalExpenses;

  // Monthly summary for charts
  const monthMap = {};
  selectedCredits.forEach((c) => {
    const m = c.month || 'Other';
    if (!monthMap[m]) monthMap[m] = { month: m, credits: 0, expenses: 0 };
    monthMap[m].credits += parseFloat(c.amount) || 0;
  });

  selectedExpenses.forEach((e) => {
    const m = e.month || 'Other';
    if (!monthMap[m]) monthMap[m] = { month: m, credits: 0, expenses: 0 };
    monthMap[m].expenses += parseFloat(e.amount) || 0;
  });

  const monthlySummary = Object.values(monthMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item) => ({
      ...item,
      balance: item.credits - item.expenses,
    }));

  // Combine and sort individual transactions by timestamp descending
  const transactions = [
    ...selectedCredits.map((c) => ({
      ...c,
      title: c.description || 'Credit Received',
      date: toDate(
        c.timestamp || c.transaction_date || c.credit_date || c.date || c.created_at || c.createdAt
      ),
    })),
    ...selectedExpenses.map((e) => ({
      ...e,
      title: e.item_name || e.description || 'Expense Recorded',
      date: toDate(
        e.timestamp || e.transaction_date || e.expense_date || e.date || e.created_at || e.createdAt
      ),
    })),
  ].sort((a, b) => {
    const timeA = a.date ? a.date.getTime() : 0;
    const timeB = b.date ? b.date.getTime() : 0;
    return timeB - timeA;
  });

  return {
    credits: selectedCredits,
    expenses: selectedExpenses,
    transactions,
    totalCredits,
    totalExpenses,
    balance,
    monthlySummary,
  };
}
