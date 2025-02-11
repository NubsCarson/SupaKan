import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useToast } from '@/components/ui/use-toast';
import { initializeWorkspace } from './setup';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();
  
  // Memoize the session refresh function
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }

      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setUser(null);
    }
  }, []);

  // Initialize auth and data
  const initializeAuth = useCallback(async () => {
    if (initialized) return;
    
    try {
      await refreshSession();
      
      if (!user) return;

      // Simple workspace check
      const { data: workspace } = await supabase
        .from('teams')
        .select('id')
        .eq('created_by', user.id)
        .limit(1)
        .single();
        
      if (!workspace) {
        await initializeWorkspace(user.id);
      }
    } catch (error) {
      console.warn('Auth initialization error:', error);
      toast({
        title: 'Connection Issue',
        description: 'Having trouble connecting. Some features may be limited.',
        variant: 'destructive',
      });
    } finally {
      setInitialized(true);
      setLoading(false);
    }
  }, [initialized, refreshSession, toast, user]);

  // Handle auth state changes
  useEffect(() => {
    let mounted = true;
    let authListener: any = null;

    const setup = async () => {
      if (!mounted) return;
      
      await initializeAuth();
      
      if (!mounted) return;

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          toast({
            title: 'Welcome!',
            description: 'You have successfully signed in.',
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          toast({
            title: 'Signed out',
            description: 'You have been signed out successfully.',
          });
        }
      });

      authListener = subscription;
    };

    setup();

    return () => {
      mounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, [initializeAuth, toast]);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 