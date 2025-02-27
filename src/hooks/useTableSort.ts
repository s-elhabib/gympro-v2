import { useState, useMemo } from 'react';
import { SortConfig } from '../components/DataTable';

export function useTableSort<T>(
  items: T[],
  config: {
    defaultSort?: SortConfig;
    customSortFns?: Record<string, (a: T, b: T) => number>;
  } = {}
) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(config.defaultSort || null);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;

    return [...items].sort((a, b) => {
      // Use custom sort function if provided
      if (config.customSortFns?.[sortConfig.key]) {
        return sortConfig.direction === 'asc'
          ? config.customSortFns[sortConfig.key](a, b)
          : config.customSortFns[sortConfig.key](b, a);
      }

      // Default sorting logic
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortConfig, config.customSortFns]);

  return { sortedItems, sortConfig, requestSort };
}