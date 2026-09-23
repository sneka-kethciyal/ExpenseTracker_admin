import React from 'react';
import './Button.css';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="spinner" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="btn-icon" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="btn-icon" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
        </>
      )}
    </button>
  );
}
