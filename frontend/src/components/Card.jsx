import React from 'react';
import './Card.css';

export const Card = ({ children, title, extra, className = '', ...props }) => {
  return (
    <div className={`card ${className}`} {...props}>
      {(title || extra) && (
        <div className="card-header">
          {title && <h3 className="card-title title-lg">{title}</h3>}
          {extra && <div className="card-extra">{extra}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};
