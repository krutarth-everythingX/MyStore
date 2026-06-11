import React from 'react';
import { Link } from '@inertiajs/react';
import './Breadcrumbs.css';

export const Breadcrumbs = ({ items }) => {
  return (
    <nav className="breadcrumbs-nav" aria-label="breadcrumb">
      <ol className="breadcrumbs-list animate-fade-in">
        <li className="breadcrumb-item">
          <Link href="/" className="breadcrumb-link">Home</Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              <li className="breadcrumb-separator" aria-hidden="true">&rsaquo;</li>
              <li className={`breadcrumb-item ${isLast ? 'active' : ''}`}>
                {isLast || !item.url ? (
                  <span className="breadcrumb-current">{item.label}</span>
                ) : (
                  <Link href={item.url} className="breadcrumb-link">{item.label}</Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
