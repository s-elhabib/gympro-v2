import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User, AuthState, AuthError } from '../types/auth';
import { useNotifications } from './NotificationContext';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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
          setAuthState({
            user: {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata.name || session.user.email!.split('@')[0],
              role: 'admin',
              permissions: ['all']
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
        setAuthState({
          user: {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata.name || session.user.email!.split('@')[0],
            role: 'admin',
            permissions: ['all']
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
        setAuthState({
          user: {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata.name || session.user.email!.split('@')[0],
            role: 'admin',
            permissions: ['all']
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
    let message = 'An error occurred';
    
    if (error.message) {
      // Handle specific error messages
      switch (error.message) {
        case 'Invalid login credentials':
          message = 'Invalid email or password';
          break;
        case 'User already registered':
          message = 'An account with this email already exists';
          break;
        case 'Email rate limit exceeded':
          message = 'Too many attempts. Please try again later';
          break;
        case 'Invalid Refresh Token: Refresh Token Not Found':
          message = 'Your session has expired. Please sign in again.';
          setAuthState({ user: null, isAuthenticated: false });
          navigate('/login');
          break;
        default:
          message = error.message;
      }
    }

    addNotification({
      title: 'Error',
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
          title: 'Welcome back!',
          message: 'You have successfully signed in.',
          type: 'success'
        });
        // Always navigate to dashboard after explicit login
        navigate('/dashboard');
      }
    } catch (error) {
      handleAuthError(error);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: email.split('@')[0],
            role: 'admin',
            permissions: ['all']
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
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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