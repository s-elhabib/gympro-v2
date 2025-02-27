import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function searchByFullName(searchTerm: string, firstName: string, lastName: string): boolean {
  const normalizedSearch = searchTerm.toLowerCase().trim();
  const normalizedFirstName = firstName.toLowerCase();
  const normalizedLastName = lastName.toLowerCase();
  const fullName = `${normalizedFirstName} ${normalizedLastName}`;
  
  // Check if searching for full name
  if (normalizedSearch.includes(' ')) {
    return fullName.includes(normalizedSearch);
  }
  
  // Check individual parts
  return normalizedFirstName.includes(normalizedSearch) || 
         normalizedLastName.includes(normalizedSearch);
}

// Add debounce utility
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Add error handling utility
export function handleApiError(error: any, addNotification: (notification: any) => void) {
  console.error('API Error:', error);
  
  let message = 'An unexpected error occurred';
  
  if (error.message) {
    message = error.message;
  } else if (error.error?.message) {
    message = error.error.message;
  }

  addNotification({
    title: 'Error',
    message,
    type: 'error'
  });

  return message;
}

// Add optimistic update helper
export function optimisticUpdate<T>(
  items: T[],
  updatedItem: Partial<T> & { id: string },
  idKey: keyof T = 'id'
): T[] {
  return items.map(item => 
    (item[idKey] === updatedItem.id) ? { ...item, ...updatedItem } : item
  );
}