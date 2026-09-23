import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../../utils/formatUtils';

export default function MonthlyFinanceChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-400)', fontSize: 'var(--font-size-sm)' }}>
        No financial transaction history available for the selected range.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'var(--neutral-900)', color: 'var(--neutral-white)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>Month: {label}</p>
          {payload.map((entry, index) => (
            <p key={`tooltip-${index}`} style={{ color: entry.color, margin: '2px 0' }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
          <XAxis dataKey="month" stroke="var(--neutral-500)" fontSize={12} tickLine={false} />
          <YAxis
            stroke="var(--neutral-500)"
            fontSize={12}
            tickLine={false}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="credits" name="Total Credits" fill="var(--success-main)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="expenses" name="Total Expenses" fill="var(--danger-main)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
