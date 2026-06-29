const normalizeSortableValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const stringValue = String(value).trim();
  if (!stringValue) return '';

  const numericValue = Number(stringValue.replace(/[^0-9.-]/g, ''));
  if (Number.isFinite(numericValue) && /[0-9]/.test(stringValue)) {
    return numericValue;
  }

  const timestamp = Date.parse(stringValue);
  if (Number.isFinite(timestamp) && /\d{4}|\d{2}[-/]\d{2}/.test(stringValue)) {
    return timestamp;
  }

  return stringValue.toLowerCase();
};

export const getNextSort = (currentSort, key) => ({
  key,
  direction: currentSort?.key === key && currentSort.direction === 'asc' ? 'desc' : 'asc',
});

export const sortRows = (rows, sort, accessors = {}) => {
  if (!sort?.key) return rows;

  const accessor = accessors[sort.key] || ((row) => row?.[sort.key]);
  const direction = sort.direction === 'desc' ? -1 : 1;

  return [...rows].sort((first, second) => {
    const firstValue = normalizeSortableValue(accessor(first));
    const secondValue = normalizeSortableValue(accessor(second));

    if (firstValue === secondValue) return 0;
    if (firstValue === '') return 1;
    if (secondValue === '') return -1;

    return firstValue > secondValue ? direction : -direction;
  });
};

export const sortButtonClass = (sort, key, baseClass = 'seller-sort-header') => (
  `${baseClass}${sort?.key === key ? ` is-active is-${sort.direction}` : ''}`
);

export const sortAriaSort = (sort, key) => {
  if (sort?.key !== key) return 'none';
  return sort.direction === 'desc' ? 'descending' : 'ascending';
};
