import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Support both Vite and Next.js environment variable formats
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
// Don't log the full key for security, just the first few characters
console.log('Supabase Key (first 8 chars):', supabaseAnonKey?.substring(0, 8));

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or NEXT_PUBLIC_ variants)');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-application-name': 'kanban',
    },
  },
});

// Add connection status check
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, 'User:', session?.user?.email);
  if (event === 'SIGNED_IN') {
    console.log('User signed in successfully');
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Session token refreshed');
  } else if (event === 'USER_UPDATED') {
    console.log('User profile updated');
  }
});

// Helper to get current user ID safely
export const getCurrentUserId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.email);
    return user?.id;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Helper to get current session safely
export const getCurrentSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};

// Type-safe database helpers
export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

// Type helpers for better type inference
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update'];

// Realtime channel helpers
export const getTeamRealtimeChannel = (teamId: string) => {
  return supabase.channel(`team:${teamId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public',
      table: 'tasks',
      filter: `team_id=eq.${teamId}`
    }, payload => {
      console.log('Change received!', payload);
    });
};

export const getBoardRealtimeChannel = (boardId: string) => {
  return supabase.channel(`board:${boardId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `board_id=eq.${boardId}`
    }, payload => {
      console.log('Board change received!', payload);
    });
};

// Error handling wrapper
export const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}; 