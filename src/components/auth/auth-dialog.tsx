import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dbService } from '@/lib/db';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth-context';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (isSignUp) {
      if (!formData.username) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords don't match";
      }
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // Initialize database before any operation
      try {
        await dbService.initialize();
      } catch (error) {
        toast({
          title: 'Database Error',
          description: error instanceof Error ? error.message : 'Failed to initialize database. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      if (isSignUp) {
        try {
          const response = await dbService.signUp({
            username: formData.username,
            email: formData.email,
            password: formData.password,
          });
          if (response) {
            setUser(response.user);
            toast({
              title: 'Account created!',
              description: `Welcome! Your account has been created successfully.`,
            });
            onOpenChange(false);
            navigate('/');
          }
        } catch (error) {
          if (error instanceof Error) {
            toast({
              title: 'Account Creation Failed',
              description: error.message || 'Failed to create account. Please try again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Account Creation Failed',
              description: 'An unexpected error occurred. Please try again.',
              variant: 'destructive',
            });
          }
          return;
        }
      } else {
        try {
          const response = await dbService.signIn({
            email: formData.email,
            password: formData.password,
          });
          if (response) {
            setUser(response.user);
            toast({
              title: 'Welcome back!',
              description: 'You have successfully signed in.',
            });
            onOpenChange(false);
            navigate('/');
          }
        } catch (error) {
          toast({
            title: 'Sign In Failed',
            description: error instanceof Error ? error.message : 'Invalid credentials.',
            variant: 'destructive',
          });
          return;
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  const togglePin = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      await dbService.updateMessage(messageId, {
        is_pinned: !message.is_pinned,
      });

      // Update messages state
      const updatedMessages = messages.map(m =>
        m.id === messageId ? { ...m, is_pinned: !m.is_pinned } : m
      );
      setMessages(updatedMessages);

      // Update pinned messages state
      if (!message.is_pinned) {
        setPinnedMessages(prev => [...prev, { ...message, is_pinned: true }]);
      } else {
        setPinnedMessages(prev => prev.filter(m => m.id !== messageId));
      }

      toast({
        title: message.is_pinned ? 'Message unpinned' : 'Message pinned',
        description: 'Message has been updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isSignUp ? 'Create an account' : 'Welcome back'}</DialogTitle>
          <DialogDescription>
            {isSignUp
              ? 'Enter your details to create a new account'
              : 'Enter your credentials to sign in'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="johndoe"
                value={formData.username}
                onChange={handleInputChange}
                autoComplete="username"
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-4 pt-4">
            <Button type="submit" className="w-full">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={toggleMode}
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 