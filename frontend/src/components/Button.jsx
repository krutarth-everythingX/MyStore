import React from 'react';
import './Button.css';

export const Button = ({ children, variant = 'primary', type = 'button', onClick, disabled, className = '', ...props }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
