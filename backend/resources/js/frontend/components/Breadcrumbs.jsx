import React from 'react';
import { Link } from '@inertiajs/react';
export const Breadcrumbs = ({
  items
}) => {
  return <nav aria-label="breadcrumb" className="text-sm text-neutral-500">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="transition hover:text-neutral-950">Home</Link>
        </li>
        {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return <React.Fragment key={index}>
              <li aria-hidden="true">/</li>
              <li>
                {isLast || !item.url ? <span className="text-neutral-950">{item.label}</span> : <Link href={item.url} className="transition hover:text-neutral-950">{item.label}</Link>}
              </li>
            </React.Fragment>;
      })}
      </ol>
    </nav>;
};
export default Breadcrumbs;
