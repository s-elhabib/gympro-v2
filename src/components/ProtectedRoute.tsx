import React from 'react';
import { useRBAC, Permission } from '../context/RBACContext';
import UnauthorizedAccess from './UnauthorizedAccess';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
}

/**
 * A component that protects routes based on permissions
 *
 * Note: Authentication check is now handled by the RequireAuth component in App.tsx
 *
 * @param children - The components to render if access is granted
 * @param requiredPermission - A single permission required to access the route
 * @param requiredPermissions - Multiple permissions that may be required
 * @param requireAll - If true, all permissions in requiredPermissions must be present
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions = [],
  requireAll = false,
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = useRBAC();

  // Check permissions
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <UnauthorizedAccess />;
  }

  if (requiredPermissions.length > 0) {
    const hasPermissions = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasPermissions) {
      return <UnauthorizedAccess />;
    }
  }

  // User has required permissions
  return <>{children}</>;
};

export default ProtectedRoute;
