import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission, UserRole } from '../types/auth';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
  fallbackPath?: string;
}

const UnauthorizedAccess: React.FC<{ requiredPermission: string; userRole?: UserRole }> = ({ 
  requiredPermission, 
  userRole 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Accès Non Autorisé
          </h2>
          <p className="text-gray-600">
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
          </p>
          <p className="text-sm text-gray-500">
            Module requis: <span className="font-medium">{requiredPermission}</span>
            {userRole && (
              <>
                <br />
                Votre rôle: <span className="font-medium capitalize">{userRole}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center gap-2"
          >
            Aller au Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission, 
  fallbackPath = '/dashboard' 
}) => {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user doesn't have required permission, show unauthorized message
  if (!hasPermission(user?.role, requiredPermission)) {
    return <UnauthorizedAccess requiredPermission={requiredPermission} userRole={user?.role} />;
  }

  // User has permission, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
