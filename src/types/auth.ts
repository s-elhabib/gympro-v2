export type UserRole = 'admin' | 'staff' | 'trainer' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface AuthError {
  message: string;
  status?: number;
}