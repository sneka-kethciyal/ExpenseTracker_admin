import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/common/Toast';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'primary',
    onConfirm: () => {},
  });

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const confirmModal = useCallback(({
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    onConfirm,
  }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      variant,
      onConfirm: async () => {
        if (onConfirm) await onConfirm();
        setModalState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <NotificationContext.Provider value={{ showToast, confirmModal }}>
      {children}

      {/* Render Toast container */}
      <div className="toast-container" style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Render Confirmation Modal */}
      {modalState.isOpen && (
        <Modal
          isOpen={modalState.isOpen}
          title={modalState.title}
          onClose={closeModal}
        >
          <div style={{ marginBottom: '1.5rem', color: 'var(--neutral-600)', fontSize: 'var(--font-size-sm)' }}>
            {modalState.message}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="secondary" onClick={closeModal}>
              {modalState.cancelText}
            </Button>
            <Button
              variant={modalState.variant}
              onClick={modalState.onConfirm}
            >
              {modalState.confirmText}
            </Button>
          </div>
        </Modal>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
