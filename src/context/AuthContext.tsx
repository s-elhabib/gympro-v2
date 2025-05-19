import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User, AuthState, AuthError, UserRole } from '../types/auth';
import { useNotifications } from './NotificationContext';
import { RBACProvider } from './RBACContext';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [isInitializing, setIsInitializing] = React.useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsInitializing(true);
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setAuthState({ user: null, isAuthenticated: false });
          return;
        }

        if (session) {
          // Get role from user metadata or default to 'staff'
          const userRole = (session.user.user_metadata.role as UserRole) || 'staff';
          const userPermissions = session.user.user_metadata.permissions || [];

          setAuthState({
            user: {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata.name || session.user.email!.split('@')[0],
              role: userRole,
              permissions: userPermissions
            },
            isAuthenticated: true
          });

          // If on login/signup page with valid session, redirect to dashboard
          if (['/login', '/signup'].includes(location.pathname)) {
            navigate('/dashboard');
          }
        } else {
          setAuthState({ user: null, isAuthenticated: false });

          // If not on login/signup page without valid session, redirect to login
          if (!['/login', '/signup'].includes(location.pathname)) {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({ user: null, isAuthenticated: false });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Get role from user metadata or default to 'staff'
        const userRole = (session.user.user_metadata.role as UserRole) || 'staff';
        const userPermissions = session.user.user_metadata.permissions || [];

        setAuthState({
          user: {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata.name || session.user.email!.split('@')[0],
            role: userRole,
            permissions: userPermissions
          },
          isAuthenticated: true
        });
        // Only navigate to dashboard if on login or signup page
        if (['/login', '/signup'].includes(location.pathname)) {
          navigate('/dashboard');
        }
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setAuthState({ user: null, isAuthenticated: false });
        navigate('/login');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Get role from user metadata or default to 'staff'
        const userRole = (session.user.user_metadata.role as UserRole) || 'staff';
        const userPermissions = session.user.user_metadata.permissions || [];

        setAuthState({
          user: {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata.name || session.user.email!.split('@')[0],
            role: userRole,
            permissions: userPermissions
          },
          isAuthenticated: true
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const handleAuthError = (error: any) => {
    let message = 'Une erreur est survenue';

    if (error.message) {
      // Handle specific error messages
      switch (error.message) {
        case 'Invalid login credentials':
          message = 'Email ou mot de passe invalide';
          break;
        case 'User already registered':
          message = 'Un compte avec cet email existe déjà';
          break;
        case 'Email rate limit exceeded':
          message = 'Trop de tentatives. Veuillez réessayer plus tard';
          break;
        case 'Invalid Refresh Token: Refresh Token Not Found':
          message = 'Votre session a expiré. Veuillez vous reconnecter.';
          setAuthState({ user: null, isAuthenticated: false });
          navigate('/login');
          break;
        default:
          message = error.message;
      }
    }

    addNotification({
      title: 'Erreur',
      message,
      type: 'error'
    });

    throw new Error(message);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        handleAuthError(error);
      }

      if (data.session) {
        addNotification({
          title: 'Bienvenue !',
          message: 'Vous vous êtes connecté avec succès.',
          type: 'success'
        });
        // Always navigate to dashboard after explicit login
        navigate('/dashboard');
      }
    } catch (error) {
      handleAuthError(error);
    }
  };

  const signUp = async (email: string, password: string, role: UserRole = 'staff') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: email.split('@')[0],
            role: role,
            permissions: [] // Permissions will be determined by role
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        handleAuthError(error);
      }

      if (data.user) {
        addNotification({
          title: 'Account created',
          message: 'Your account has been created successfully. Please check your email for verification.',
          type: 'success'
        });
        navigate('/login');
      }
    } catch (error) {
      handleAuthError(error);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        handleAuthError(error);
      }
      setAuthState({ user: null, isAuthenticated: false });
      navigate('/login');
    } catch (error) {
      handleAuthError(error);
    }
  };

  // Method to update a user's role
  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: { role } }
      );

      if (error) {
        handleAuthError(error);
      }

      // If updating the current user, update the auth state
      if (authState.user && authState.user.id === userId) {
        setAuthState({
          ...authState,
          user: {
            ...authState.user,
            role
          }
        });
      }

      addNotification({
        title: 'Succès',
        message: 'Rôle utilisateur mis à jour avec succès',
        type: 'success'
      });

      return data;
    } catch (error) {
      handleAuthError(error);
    }
  };

  // Show loading state while initializing auth
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const value = {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      <RBACProvider
        userRole={authState.user?.role || null}
        userPermissions={authState.user?.permissions}
      >
        {children}
      </RBACProvider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};