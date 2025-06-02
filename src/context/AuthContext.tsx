import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User, AuthState, AuthError, UserRole } from '../types/auth';
import { ROLE_PERMISSIONS } from '../types/auth';
import { useNotifications } from './NotificationContext';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache for user roles to prevent repeated database calls
const userRoleCache = new Map<string, { data: { role: UserRole; name: string } | null; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (reduced for role changes)

// Function to clear cache for a specific user or all users
const clearUserRoleCache = (email?: string) => {
  if (email) {
    userRoleCache.delete(email);
    console.log('Cleared cache for user:', email);
  } else {
    userRoleCache.clear();
    console.log('Cleared all user role cache');
  }
};

// Export cache management functions
export { clearUserRoleCache };

// Global reference to refreshUserData function
let globalRefreshUserData: (() => Promise<void>) | null = null;

// Export function to refresh current user data
export const refreshCurrentUserData = async () => {
  if (globalRefreshUserData) {
    await globalRefreshUserData();
  }
};

// Helper function to fetch user role from staff table
const fetchUserRole = async (email: string, retryCount = 0, forceRefresh = false): Promise<{ role: UserRole; name: string } | null> => {
  try {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cached = userRoleCache.get(email);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log('Using cached user role for:', email);
        return cached.data;
      }
    } else {
      console.log('Force refreshing user role for:', email);
      clearUserRoleCache(email);
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const { data, error } = await supabase
      .from('staff')
      .select('role, first_name, last_name')
      .eq('email', email)
      .eq('status', 'active')
      .abortSignal(controller.signal)
      .single();

    clearTimeout(timeoutId);

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user not found or inactive
        console.warn('User not found in staff table or inactive:', email);
        userRoleCache.set(email, { data: null, timestamp: Date.now() });
        return null;
      }
      throw error;
    }

    if (!data) {
      console.warn('No data returned for user:', email);
      userRoleCache.set(email, { data: null, timestamp: Date.now() });
      return null;
    }

    const result = {
      role: data.role as UserRole,
      name: `${data.first_name} ${data.last_name}`
    };

    // Cache the result
    userRoleCache.set(email, { data: result, timestamp: Date.now() });

    return result;
  } catch (error: any) {
    console.error('Error fetching user role:', error);

    // Retry logic for network errors (max 2 retries)
    if (retryCount < 2 && (error.name === 'AbortError' || error.message?.includes('network'))) {
      console.log(`Retrying fetchUserRole for ${email}, attempt ${retryCount + 1}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return fetchUserRole(email, retryCount + 1, forceRefresh);
    }

    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [isInitializing, setIsInitializing] = React.useState(true);
  const isExplicitLoginRef = useRef(false); // Use ref to prevent race conditions
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotifications();

  useEffect(() => {
    let isMounted = true;
    let initTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        setIsInitializing(true);

        // Set a maximum timeout for initialization
        initTimeout = setTimeout(() => {
          if (isMounted) {
            console.warn('Auth initialization timeout - proceeding with unauthenticated state');
            setAuthState({ user: null, isAuthenticated: false });
            setIsInitializing(false);
          }
        }, 15000); // 15 second timeout

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) return; // Component unmounted

        if (sessionError) {
          console.error('Session error:', sessionError);
          setAuthState({ user: null, isAuthenticated: false });
          return;
        }

        if (session && session.user?.email) {
          // Fetch user role from staff table with force refresh on initialization
          const userInfo = await fetchUserRole(session.user.email, 0, true);

          if (!isMounted) return; // Component unmounted

          if (userInfo) {
            setAuthState({
              user: {
                id: session.user.id,
                email: session.user.email,
                name: userInfo.name,
                role: userInfo.role,
                permissions: ROLE_PERMISSIONS[userInfo.role] || []
              },
              isAuthenticated: true
            });
          } else {
            // User not found in staff table or inactive, sign them out
            console.warn('User not authorized - not found in active staff');
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error('Error signing out unauthorized user:', signOutError);
            }
            setAuthState({ user: null, isAuthenticated: false });
          }
        } else {
          setAuthState({ user: null, isAuthenticated: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setAuthState({ user: null, isAuthenticated: false });
        }
      } finally {
        if (initTimeout) clearTimeout(initTimeout);
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (initTimeout) clearTimeout(initTimeout);
    };
  }, []); // Run only once on mount

  // Separate effect for auth state changes
  useEffect(() => {
    let isMounted = true;

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);

      try {
        if (event === 'SIGNED_IN' && session?.user?.email) {
          console.log('🔄 Auth state change SIGNED_IN for:', session.user.email);
          console.log('🔍 Current auth state:', { isAuthenticated: authState.isAuthenticated, userEmail: authState.user?.email });
          console.log('🔍 Is explicit login?', isExplicitLoginRef.current);

          // Skip if this is an explicit login (handled by signIn function)
          if (isExplicitLoginRef.current) {
            console.log('⏭️ Explicit login in progress, skipping auth state change handler');
            return;
          }

          // Skip if user is already authenticated (handled by explicit signIn)
          if (authState.isAuthenticated && authState.user?.email === session.user.email) {
            console.log('⏭️ User already authenticated, skipping auth state change handler');
            return;
          }

          console.log('🔄 Fetching user role in auth state change handler...');
          // Fetch user role from staff table with force refresh
          const userInfo = await fetchUserRole(session.user.email, 0, true);
          console.log('🔄 Auth state change - User info fetched:', userInfo);

          if (!isMounted) return; // Component unmounted

          if (userInfo) {
            console.log('🔄 Setting auth state from auth state change handler with role:', userInfo.role);
            setAuthState({
              user: {
                id: session.user.id,
                email: session.user.email,
                name: userInfo.name,
                role: userInfo.role,
                permissions: ROLE_PERMISSIONS[userInfo.role] || []
              },
              isAuthenticated: true
            });
          } else {
            // User not authorized, sign them out
            console.warn('❌ User not authorized during sign in');
            try {
              await supabase.auth.signOut();
            } catch (error) {
              console.error('Error signing out unauthorized user:', error);
            }
            setAuthState({ user: null, isAuthenticated: false });
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setAuthState({ user: null, isAuthenticated: false });
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user?.email) {
          // For token refresh, only fetch user data if we don't have it
          if (!authState.user && isMounted) {
            const userInfo = await fetchUserRole(session.user.email);
            if (userInfo && isMounted) {
              setAuthState({
                user: {
                  id: session.user.id,
                  email: session.user.email,
                  name: userInfo.name,
                  role: userInfo.role,
                  permissions: ROLE_PERMISSIONS[userInfo.role] || []
                },
                isAuthenticated: true
              });
            }
          }
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        if (isMounted) {
          setAuthState({ user: null, isAuthenticated: false });
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [authState.isAuthenticated, authState.user?.email]); // Depend on auth state to prevent conflicts

  // Separate effect for handling navigation redirects
  useEffect(() => {
    if (!isInitializing) {
      if (authState.isAuthenticated && ['/login', '/signup'].includes(location.pathname)) {
        navigate('/dashboard');
      } else if (!authState.isAuthenticated && !['/login', '/signup'].includes(location.pathname)) {
        navigate('/login');
      }
    }
  }, [authState.isAuthenticated, location.pathname, navigate, isInitializing]);

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
      console.log('🔐 Starting signIn for:', email);

      // Set flag to prevent auth state change handler from interfering
      isExplicitLoginRef.current = true;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('❌ Auth error:', error);
        isExplicitLoginRef.current = false; // Reset flag on error
        handleAuthError(error);
        return;
      }

      if (data.session && data.session.user?.email) {
        console.log('✅ Auth successful, fetching user role for:', data.session.user.email);

        // Fetch user role immediately with force refresh to ensure they're authorized
        const userInfo = await fetchUserRole(data.session.user.email, 0, true);
        console.log('👤 User info fetched:', userInfo);
        console.log('🔍 User info details:', {
          userInfo,
          hasUserInfo: !!userInfo,
          role: userInfo?.role,
          name: userInfo?.name
        });

        if (userInfo) {
          console.log('🎯 Setting auth state with role:', userInfo.role);

          // Update auth state immediately
          setAuthState({
            user: {
              id: data.session.user.id,
              email: data.session.user.email,
              name: userInfo.name,
              role: userInfo.role,
              permissions: ROLE_PERMISSIONS[userInfo.role] || []
            },
            isAuthenticated: true
          });

          addNotification({
            title: 'Bienvenue !',
            message: 'Vous vous êtes connecté avec succès.',
            type: 'success'
          });

          console.log('🚀 Navigating to dashboard...');
          // Use setTimeout to ensure state update is processed before navigation
          setTimeout(() => {
            navigate('/dashboard');
            // Reset flag after a longer delay to ensure auth state change handler completes
            setTimeout(() => {
              isExplicitLoginRef.current = false;
              console.log('🏁 Explicit login flag reset');
            }, 200);
          }, 100);
        } else {
          console.log('❌ User not found in staff table');
          isExplicitLoginRef.current = false; // Reset flag on error
          // User not found in staff table, sign them out
          await supabase.auth.signOut();
          throw new Error('Utilisateur non autorisé. Contactez l\'administrateur.');
        }
      }
    } catch (error: any) {
      console.log('💥 SignIn error:', error);
      isExplicitLoginRef.current = false; // Reset flag on error
      // Re-throw the error so the Login component can handle it properly
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: email.split('@')[0]
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

  const refreshUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session && session.user?.email) {
        console.log('🔄 Refreshing user data for:', session.user.email);

        // Force refresh user role from database
        const userInfo = await fetchUserRole(session.user.email, 0, true);

        if (userInfo) {
          console.log('✅ Updated user role to:', userInfo.role);
          setAuthState({
            user: {
              id: session.user.id,
              email: session.user.email,
              name: userInfo.name,
              role: userInfo.role,
              permissions: ROLE_PERMISSIONS[userInfo.role] || []
            },
            isAuthenticated: true
          });
        } else {
          // User no longer authorized, sign them out
          console.warn('❌ User no longer authorized during refresh');
          await signOut();
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Set global reference for external access
  useEffect(() => {
    globalRefreshUserData = refreshUserData;
    return () => {
      globalRefreshUserData = null;
    };
  }, []);

  // Show loading state while initializing auth with fallback
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 text-sm">Chargement...</p>
        <button
          onClick={() => {
            console.log('Force proceeding from loading state');
            setIsInitializing(false);
            setAuthState({ user: null, isAuthenticated: false });
          }}
          className="mt-4 px-4 py-2 text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Continuer sans attendre
        </button>
      </div>
    );
  }

  const value = {
    ...authState,
    signIn,
    signUp,
    signOut,
    refreshUserData
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