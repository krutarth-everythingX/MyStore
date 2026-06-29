import React from 'react';
import { cn } from '../utils/cn';
export const DataTable = ({
  columns,
  data,
  keyField = 'id',
  emptyMessage = 'No data available',
  className = '',
  striped = false,
  ...props
}) => {
  return <div {...props}>
      <table>
        <thead>
          <tr>
            {columns.map((col, index) => <th key={index}>
                {col.header}
              </th>)}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? <tr>
              <td colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr> : data.map((row, rowIndex) => <tr key={row[keyField]}>
                {columns.map((col, colIdx) => <td key={colIdx}>
                    {col.render ? col.render(row) : row[col.field]}
                  </td>)}
              </tr>)}
        </tbody>
      </table>
    </div>;
};
