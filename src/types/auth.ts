export type UserRole = 'admin' | 'manager' | 'trainer' | 'receptionist' | 'maintenance';

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

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['dashboard', 'members', 'payments', 'attendance', 'classes', 'staff', 'reports', 'settings'],
  manager: ['dashboard', 'members', 'payments', 'attendance', 'classes', 'staff', 'reports'],
  trainer: ['dashboard', 'members', 'attendance', 'classes'],
  receptionist: ['dashboard', 'members', 'payments', 'attendance'],
  maintenance: ['dashboard', 'attendance']
};

// Helper function to check if user has permission for a module
export const hasPermission = (userRole: UserRole | undefined, module: string): boolean => {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole]?.includes(module) || false;
};