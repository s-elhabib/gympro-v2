import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./supabase"

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

/**
 * Check if a member has a valid payment
 * @param memberId The member ID to check
 * @returns An object containing the member status and payment validity
 */
export async function checkMemberPaymentStatus(memberId: string) {
  try {
    // Get member status and membership type
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("status, membership_type")
      .eq("id", memberId)
      .single();

    if (memberError || !member) {
      throw new Error("Membre non trouvé");
    }

    // Check for valid payments
    const { data: payments, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("member_id", memberId)
      .eq("status", "paid")
      .order("due_date", { ascending: false })
      .limit(1);

    if (paymentError) {
      throw new Error("Erreur lors de la vérification des paiements");
    }

    const hasValidPayment =
      payments &&
      payments.length > 0 &&
      new Date(payments[0].due_date) > new Date();

    return {
      isActive: member.status === "active",
      hasValidPayment: hasValidPayment,
      membershipType: member.membership_type
    };
  } catch (error) {
    console.error("Error checking member payment status:", error);
    throw error;
  }
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