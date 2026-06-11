import React from 'react';
import './Card.css';

export const Card = ({ children, title, eyebrow, extra, className = '', ...props }) => {
  return (
    <div className={`card ${className}`} {...props}>
      {(title || extra) && (
        <div className="card-header">
          {title && (
            <div className="card-title-wrap">
              {eyebrow && <span className="card-eyebrow label-md">{eyebrow}</span>}
              <h3 className="card-title title-lg">{title}</h3>
            </div>
          )}
          {extra && <div className="card-extra">{extra}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};
