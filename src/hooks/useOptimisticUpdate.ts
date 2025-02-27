import { useState } from 'react';
import { optimisticUpdate } from '../lib/utils';

export function useOptimisticUpdate<T extends { id: string }>(
  initialItems: T[],
  onError?: (error: any) => void
) {
  const [items, setItems] = useState<T[]>(initialItems);

  const update = async (
    updateFn: () => Promise<void>,
    optimisticItem: Partial<T> & { id: string }
  ) => {
    // Store the previous state
    const previousItems = [...items];
    
    // Apply optimistic update
    setItems(current => optimisticUpdate(current, optimisticItem));

    try {
      // Attempt the actual update
      await updateFn();
    } catch (error) {
      // Revert on failure
      setItems(previousItems);
      onError?.(error);
    }
  };

  return { items, setItems, update };
}