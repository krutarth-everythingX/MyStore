import React from 'react';
import { X } from 'lucide-react';
export const SellerMobileDetailSheet = ({
  open,
  title,
  subtitle = '',
  items = [],
  actions = null,
  onClose
}) => {
  if (!open) return null;
  return <div onMouseDown={onClose}>
      <div onMouseDown={event => event.stopPropagation()}>
        <div>
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Close details">
            <X size={18} />
          </button>
        </div>

        <div>
          <div>
            {items.map(item => <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                {item.hint ? <small>{item.hint}</small> : null}
              </div>)}
          </div>
        </div>

        {actions ? <div>{actions}</div> : null}
      </div>
    </div>;
};
export default SellerMobileDetailSheet;
