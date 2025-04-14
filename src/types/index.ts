// Payment related types
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other';
export type DisplayPaymentStatus = PaymentStatus | 'near_overdue';

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  birth_date: string;
  membership_type: string;
  start_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  payment_date: string;
  due_date: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
  updated_at: string;
  member?: {
    first_name: string;
    last_name: string;
  };
}

export interface PaymentWithDisplayStatus extends Payment {
  displayStatus: DisplayPaymentStatus;
}

// Pagination types
export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  itemsPerPage: number;
}

// API response types
export interface SupabaseResponse<T> {
  data: T[] | null;
  error: Error | null;
  count?: number;
}
