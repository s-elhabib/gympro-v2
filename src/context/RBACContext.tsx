import React, { createContext, useContext } from 'react';
import { UserRole } from '../types/auth';

// Define permission types
export type Permission = 
  | 'dashboard:view'
  | 'members:view' 
  | 'members:create' 
  | 'members:edit' 
  | 'members:delete'
  | 'payments:view' 
  | 'payments:create' 
  | 'payments:edit'
  | 'attendance:view' 
  | 'attendance:manage'
  | 'classes:view' 
  | 'classes:create' 
  | 'classes:edit' 
  | 'classes:delete'
  | 'staff:view' 
  | 'staff:create' 
  | 'staff:edit' 
  | 'staff:delete'
  | 'reports:view'
  | 'settings:view' 
  | 'settings:edit';

// Define role-based permissions
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'dashboard:view',
    'members:view', 'members:create', 'members:edit', 'members:delete',
    'payments:view', 'payments:create', 'payments:edit',
    'attendance:view', 'attendance:manage',
    'classes:view', 'classes:create', 'classes:edit', 'classes:delete',
    'staff:view', 'staff:create', 'staff:edit', 'staff:delete',
    'reports:view',
    'settings:view', 'settings:edit'
  ],
  manager: [
    'dashboard:view',
    'members:view', 'members:create', 'members:edit',
    'payments:view', 'payments:create', 'payments:edit',
    'attendance:view', 'attendance:manage',
    'classes:view', 'classes:create', 'classes:edit',
    'staff:view',
    'reports:view'
  ],
  trainer: [
    'dashboard:view',
    'members:view',
    'attendance:view', 'attendance:manage',
    'classes:view', 'classes:create', 'classes:edit'
  ],
  receptionist: [
    'dashboard:view',
    'members:view', 'members:create',
    'payments:view', 'payments:create',
    'attendance:view', 'attendance:manage'
  ],
  staff: [
    'dashboard:view',
    'members:view',
    'attendance:view'
  ]
};

// Define route permissions
export const routePermissions: Record<string, Permission> = {
  '/dashboard': 'dashboard:view',
  '/members': 'members:view',
  '/payments': 'payments:view',
  '/attendance': 'attendance:view',
  '/qr-attendance': 'attendance:view',
  '/classes': 'classes:view',
  '/staff': 'staff:view',
  '/reports': 'reports:view',
  '/settings': 'settings:view'
};

interface RBACContextType {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccessRoute: (route: string) => boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const RBACProvider: React.FC<{
  children: React.ReactNode;
  userRole: UserRole | null;
  userPermissions?: string[];
}> = ({ children, userRole, userPermissions = [] }) => {
  // Get permissions for the user's role
  const roleBasedPermissions = userRole ? rolePermissions[userRole] : [];
  
  // Combine role-based permissions with any custom permissions
  const allPermissions = [...roleBasedPermissions, ...userPermissions];

  const hasPermission = (permission: Permission): boolean => {
    if (!userRole) return false;
    return allPermissions.includes(permission) || allPermissions.includes('all');
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canAccessRoute = (route: string): boolean => {
    // Extract the base route (e.g., '/members/123' -> '/members')
    const baseRoute = '/' + route.split('/')[1];
    const requiredPermission = routePermissions[baseRoute];
    
    if (!requiredPermission) return true; // No permission required
    return hasPermission(requiredPermission);
  };

  return (
    <RBACContext.Provider value={{ 
      hasPermission, 
      hasAnyPermission, 
      hasAllPermissions,
      canAccessRoute
    }}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
};
