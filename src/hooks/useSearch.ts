import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { searchByFullName } from '../lib/utils';

export function useSearch<T extends { first_name: string; last_name: string }>(
  items: T[],
  delay: number = 300
) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  const filteredItems = useCallback(() => {
    return items.filter(item =>
      searchByFullName(debouncedSearchTerm, item.first_name, item.last_name)
    );
  }, [items, debouncedSearchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredItems: filteredItems()
  };
}