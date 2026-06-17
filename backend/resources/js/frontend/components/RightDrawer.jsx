import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './RightDrawer.css';

export const RightDrawer = ({ isOpen, onClose, title, children, wide = false }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className={`right-drawer-overlay ${isOpen ? 'is-open' : ''}`} onClick={onClose}>
      <div 
        className={`right-drawer-container ${wide ? 'drawer-wide' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="right-drawer-header">
          <h3 className="right-drawer-title">{title}</h3>
          <button className="right-drawer-close" onClick={onClose} aria-label="Close drawer">
            <X size={20} />
          </button>
        </div>
        <div className="right-drawer-content">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};
