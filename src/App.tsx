import { useEffect, useState } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { KanbanBoard } from '@/components/kanban/board';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabase';

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {!session ? (
        <div className="container flex min-h-screen items-center">
          <AuthForm />
        </div>
      ) : (
        <KanbanBoard />
      )}
      <Toaster />
    </div>
  );
}

export default App;