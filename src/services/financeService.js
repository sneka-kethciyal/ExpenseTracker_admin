import {
  collection,
  getDocs,
  query,
  orderBy,
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
  if (!userId) {
    return {
      credits: [],
      expenses: [],
      totalCredits: 0,
      totalExpenses: 0,
      balance: 0,
      monthlySummary: [],
    };
  }

  const monthsRef = collection(db, 'users', userId, 'months');
  let monthDocs = [];

  try {
    const snap = await getDocs(monthsRef);
    monthDocs = snap.docs;
  } catch (err) {
    console.warn('Error fetching user months:', err.message);
  }

  let allCredits = [];
  let allExpenses = [];

  // If specific month requested, filter or inspect that month doc
  for (const mDoc of monthDocs) {
    const monthKey = mDoc.id; // e.g. "2026-09"
    if (monthFilter && monthKey !== monthFilter) {
      continue;
    }

    // Credits subcollection
    try {
      const credSnap = await getDocs(collection(db, 'users', userId, 'months', monthKey, 'credits'));
      credSnap.forEach((docSnap) => {
        allCredits.push({
          id: docSnap.id,
          month: monthKey,
          type: 'Credit',
          ...docSnap.data(),
        });
      });
    } catch (e) {
      console.warn(`Credits subcollection query failed for ${monthKey}:`, e.message);
    }

    // Expenses subcollection
    try {
      const expSnap = await getDocs(collection(db, 'users', userId, 'months', monthKey, 'expenses'));
      expSnap.forEach((docSnap) => {
        allExpenses.push({
          id: docSnap.id,
          month: monthKey,
          type: 'Expense',
          ...docSnap.data(),
        });
      });
    } catch (e) {
      console.warn(`Expenses subcollection query failed for ${monthKey}:`, e.message);
    }
  }

  // Calculate totals
  const totalCredits = allCredits.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalExpenses = allExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const balance = totalCredits - totalExpenses;

  // Monthly summary for charts
  const monthMap = {};
  allCredits.forEach((c) => {
    const m = c.month || 'Other';
    if (!monthMap[m]) monthMap[m] = { month: m, credits: 0, expenses: 0 };
    monthMap[m].credits += parseFloat(c.amount) || 0;
  });

  allExpenses.forEach((e) => {
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
    ...allCredits.map((c) => ({
      ...c,
      title: c.description || 'Credit Received',
      date: toDate(c.timestamp || c.created_at),
    })),
    ...allExpenses.map((e) => ({
      ...e,
      title: e.item_name || e.description || 'Expense Recorded',
      date: toDate(e.timestamp || e.created_at),
    })),
  ].sort((a, b) => {
    const timeA = a.date ? a.date.getTime() : 0;
    const timeB = b.date ? b.date.getTime() : 0;
    return timeB - timeA;
  });

  return {
    credits: allCredits,
    expenses: allExpenses,
    transactions,
    totalCredits,
    totalExpenses,
    balance,
    monthlySummary,
  };
}
