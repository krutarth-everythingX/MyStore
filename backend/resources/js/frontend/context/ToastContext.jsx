import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import './Toast.css';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-global-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type} shadow-md animate-fade-in`}>
            <span className="toast-icon">
              {toast.type === 'success' && <CheckCircle2 size={18} style={{ color: '#10b981' }} />}
              {toast.type === 'error' && <AlertCircle size={18} style={{ color: 'var(--color-error)' }} />}
              {toast.type === 'warning' && <AlertTriangle size={18} style={{ color: 'var(--color-secondary)' }} />}
              {toast.type === 'info' && <Info size={18} style={{ color: 'var(--color-primary)' }} />}
            </span>
            <div className="toast-content body-md">{toast.message}</div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
