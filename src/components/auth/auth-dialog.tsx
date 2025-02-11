import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/components/theme-provider';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  // Add password toggle functionality
  useEffect(() => {
    if (open) {
      const interval = setInterval(() => {
        // More specific selector to find the password input
        const passwordInputs = document.querySelectorAll('input[type="password"], input[type="text"].supabase-auth-ui_ui-input');
        
        passwordInputs.forEach((element) => {
          const input = element as HTMLInputElement;
          const inputContainer = input.parentElement;
          if (!inputContainer) return;

          // Only add toggle if it doesn't exist for this input
          if (!inputContainer.querySelector('.password-toggle')) {
            // Set position relative on container
            inputContainer.style.position = 'relative';

            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'password-toggle absolute right-3 top-[60%] -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors duration-200';
            toggleBtn.setAttribute('aria-label', 'Toggle password visibility');
            
            // Set initial icon based on input type
            const isPassword = input.type === 'password';
            toggleBtn.innerHTML = isPassword 
              ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>'
              : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>';

            // Add click handler
            toggleBtn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              
              const newType = input.type === 'password' ? 'text' : 'password';
              input.type = newType;
              
              // Update icon
              toggleBtn.innerHTML = newType === 'password' 
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>';
            };

            // Store ref to button for cleanup
            toggleRef.current = toggleBtn;
            
            // Add button to input container
            inputContainer.appendChild(toggleBtn);
          }
        });

        // If we found and processed all password inputs, clear the interval
        if (passwordInputs.length > 0) {
          clearInterval(interval);
        }
      }, 100);

      return () => {
        clearInterval(interval);
        // Clean up toggle buttons when dialog closes
        const toggles = document.querySelectorAll('.password-toggle');
        toggles.forEach(toggle => toggle.remove());
      };
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Welcome to SupaKan</DialogTitle>
          <DialogDescription>
            Sign in to your account or create a new one to get started.
          </DialogDescription>
        </DialogHeader>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary))',
                },
              },
            },
            className: {
              container: 'w-full',
              button: 'w-full bg-primary text-primary-foreground hover:bg-primary/90',
              input: 'bg-background pr-10', // Added padding for the toggle button
              label: 'text-foreground',
            },
          }}
          theme={theme === 'dark' ? 'dark' : 'default'}
          providers={['github', 'google']}
          redirectTo={`${window.location.origin}/auth/callback`}
          onlyThirdPartyProviders={false}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email address',
                password_label: 'Password',
              },
            },
          }}
        />
      </DialogContent>
    </Dialog>
  );
} 