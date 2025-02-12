import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useToast } from '@/components/ui/use-toast';
import { initializeWorkspace } from './setup';
import type { Database } from './database.types';

type Team = Database['public']['Tables']['teams']['Row'];
type TeamMember = Database['public']['Tables']['team_members']['Row'];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      // If it's not a network error, throw immediately
      if (!error.message?.includes('Failed to fetch') && 
          !error.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
        throw error;
      }
      // Wait with exponential backoff before retrying
      if (i < maxRetries - 1) {
        await sleep(baseDelay * Math.pow(2, i));
      }
    }
  }
  throw lastError;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const initializingRef = useRef(false);
  const { toast } = useToast();
  
  // Memoize the session refresh function
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await retryWithBackoff(
        () => supabase.auth.getSession()
      );
      
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
    // Prevent multiple simultaneous initialization attempts
    if (initialized || initializingRef.current) return;
    
    initializingRef.current = true;
    
    try {
      await refreshSession();
      
      if (!user) {
        initializingRef.current = false;
        return;
      }

      // Add a delay to allow the database trigger to complete
      await sleep(1000);

      // Check for existing team (either as owner or member)
      const { data: ownedTeams, error: ownedTeamsError } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('teams')
          .select('*')
          .eq('created_by', user.id)
          .limit(1)
          .single();
        return result;
      });

      let teamId: string | null = null;

      if (ownedTeamsError && 'code' in ownedTeamsError && ownedTeamsError.code === 'PGRST116') {
        // No team found as owner, try finding team where user is a member
        const { data: memberTeams, error: memberTeamsError } = await retryWithBackoff(async () => {
          const result = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();
          return result;
        });

        if (!memberTeamsError && memberTeams) {
          teamId = memberTeams.team_id;
        }
      } else if (!ownedTeamsError && ownedTeams) {
        teamId = ownedTeams.id;
      }

      // If no team exists, trigger the database function to create one
      if (!teamId) {
        console.warn('No team found, triggering database initialization');
        
        // Call the RPC function to ensure user has a team
        const { error: rpcError } = await retryWithBackoff(async () => {
          const result = await supabase.rpc('ensure_user_has_team', {
            input_user_id: user.id
          });
          return result;
        });

        if (rpcError) {
          console.error('Error initializing workspace:', rpcError);
          toast({
            title: 'Error',
            description: 'Failed to set up your workspace. Please try refreshing the page.',
            variant: 'destructive',
          });
        }

        // Add a delay to allow the database trigger to complete
        await sleep(2000);

        // Refresh the session to get the new team
        await refreshSession();
      }
    } catch (error) {
      console.warn('Auth initialization error:', error);
      toast({
        title: 'Connection Issue',
        description: 'Having trouble connecting. Will retry automatically.',
        variant: 'destructive',
      });
      // Reset initialization state to allow retry
      setInitialized(false);
    } finally {
      setInitialized(true);
      setLoading(false);
      initializingRef.current = false;
    }
  }, [initialized, refreshSession, toast, user]);

  // Handle auth state changes
  useEffect(() => {
    let mounted = true;
    let authListener: any = null;

    const setup = async () => {
      if (!mounted) return;
      
      // Reset initialized state on setup
      setInitialized(false);
      await initializeAuth();
      
      if (!mounted) return;

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          // Reset initialized state on sign in to trigger initialization
          setInitialized(false);
          toast({
            title: 'Welcome!',
            description: 'You have successfully signed in.',
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setInitialized(false);
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