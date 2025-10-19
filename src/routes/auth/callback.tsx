import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error during auth callback:', error);
        navigate('/');
        return;
      }

      // Check for stored redirect URL (e.g., from team invite links)
      const redirectUrl = sessionStorage.getItem('post_auth_redirect');
      if (redirectUrl) {
        sessionStorage.removeItem('post_auth_redirect');
        navigate(redirectUrl);
      } else {
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span>Redirecting...</span>
      </div>
    </div>
  );
} 