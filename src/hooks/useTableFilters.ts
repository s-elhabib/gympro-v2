import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export interface TableFilters {
  search: string;
  [key: string]: any;
}

export function useTableFilters<T>(
  items: T[],
  filterFn: (item: T, filters: TableFilters) => boolean,
  initialFilters: TableFilters = { search: '' }
) {
  const [filters, setFilters] = useState<TableFilters>(initialFilters);
  const debouncedFilters = useDebounce(filters, 300);

  const filteredItems = useCallback(() => {
    return items.filter(item => filterFn(item, debouncedFilters));
  }, [items, debouncedFilters, filterFn]);

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return {
    filters,
    debouncedFilters,
    updateFilter,
    filteredItems: filteredItems()
  };
}