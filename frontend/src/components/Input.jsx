import React from 'react';
import './Input.css';

export const Input = ({ label, error, type = 'text', className = '', ...props }) => {
  return (
    <div className={`input-container ${className}`}>
      {label && <label className="input-label label-md">{label}</label>}
      <input
        type={type}
        className={`input-field ${error ? 'input-field-error' : ''}`}
        {...props}
      />
      {error && <span className="input-error-msg body-md">{error}</span>}
    </div>
  );
};
