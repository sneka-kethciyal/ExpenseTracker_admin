import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

export default function Toast({ type = 'info', message, onClose }) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="toast-icon success" size={18} />;
      case 'error':
        return <AlertCircle className="toast-icon error" size={18} />;
      case 'warning':
        return <AlertTriangle className="toast-icon warning" size={18} />;
      case 'info':
      default:
        return <Info className="toast-icon info" size={18} />;
    }
  };

  return (
    <div className={`toast toast-${type}`} role="alert">
      <div className="toast-content">
        {getIcon()}
        <span className="toast-message">{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          className="toast-close"
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
