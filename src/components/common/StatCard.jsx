import React from 'react';
import './StatCard.css';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'info'
  loading = false,
  error = null,
}) {
  return (
    <div className={`stat-card stat-${variant}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className="stat-card-icon-wrapper">
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="stat-card-body">
        {loading ? (
          <div className="skeleton" style={{ height: '32px', width: '120px', margin: '4px 0' }} />
        ) : error ? (
          <span className="stat-card-error">Unavailable</span>
        ) : (
          <h3 className="stat-card-value">{value}</h3>
        )}

        {subtitle && !loading && (
          <span className="stat-card-subtitle">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
