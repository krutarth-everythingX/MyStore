import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
const ToastContext = createContext();
export const ToastProvider = ({
  children
}) => {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const timeoutDuration = Math.min(duration, 3000);
    setToasts(prev => [...prev, {
      id,
      message,
      type
    }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, timeoutDuration);
  }, []);
  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  return <ToastContext.Provider value={{
    showToast
  }}>
      {children}
      <div>
        {toasts.map(toast => <div key={toast.id}>
            <span />
            <span>
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'warning' && <AlertTriangle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </span>
            <div>{toast.message}</div>
            <button type="button" onClick={() => removeToast(toast.id)}>
              <X size={16} />
            </button>
          </div>)}
      </div>
    </ToastContext.Provider>;
};
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
