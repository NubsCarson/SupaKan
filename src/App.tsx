import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, Outlet } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Board } from '@/components/kanban/board';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { ModeToggle } from '@/components/mode-toggle';
import { Footer } from '@/components/footer';
import { Github, Gauge, LogOut, Settings, User, ChevronDown, Home, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { createBrowserRouter, createRoutesFromElements, RouterProvider, type RouterOptions } from 'react-router-dom';
import { SystemDashboard } from '@/components/system-dashboard';
import AuthCallback from '@/routes/auth/callback';
import { Logo } from '@/components/logo';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BoardsPage from '@/pages/boards';
import TeamsPage from '@/pages/teams';
import BoardPage from '@/pages/board';
import AIPage from '@/pages/ai';

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm text-muted-foreground">Loading your workspace...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setShowAuth(true);
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <AuthDialog open={showAuth} onOpenChange={setShowAuth} />;
  }

  return <>{children}</>;
}

function Layout() {
  const { user, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "Come back soon!",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-3">
              <Logo className="h-8 w-8" />
              <span className="hidden text-lg font-bold sm:inline-block">SupaKan</span>
            </Link>
            {isAuthenticated && (
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <Link 
                  to="/boards" 
                  className="transition-colors hover:text-foreground/80 flex items-center gap-2"
                  title="Home"
                >
                  <Home className="h-5 w-5" />
                  <span className="hidden sm:inline-block">Home</span>
                </Link>
                <Link 
                  to="/teams" 
                  className="transition-colors hover:text-foreground/80 flex items-center gap-2"
                  title="Teams"
                >
                  <Users className="h-5 w-5" />
                  <span className="hidden sm:inline-block">Teams</span>
                </Link>
                <Link 
                  to="/dashboard" 
                  className="transition-colors hover:text-foreground/80 flex items-center gap-2"
                  title="System Dashboard"
                >
                  <Gauge className="h-5 w-5" />
                  <span className="hidden sm:inline-block">Dashboard</span>
                </Link>
                <Link 
                  to="/ai" 
                  className="transition-colors hover:text-foreground/80 flex items-center gap-2"
                  title="AI Assistant"
                >
                  <Sparkles className="h-5 w-5" />
                  <span className="hidden sm:inline-block">AI Assistant</span>
                </Link>
              </nav>
            )}
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="flex items-center gap-2">
              <a
                target="_blank"
                rel="noreferrer"
                href="https://github.com/NubsCarson/SupaKan"
                className={cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:pointer-events-none disabled:opacity-50",
                  "hover:bg-accent hover:text-accent-foreground",
                  "h-9 px-3"
                )}
              >
                <Github className="h-4 w-4" />
              </a>
              <ModeToggle />
              {isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || ''} />
                        <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Account</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "Profile settings will be available in a future update!",
                      });
                    }}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "Settings will be available in a future update!",
                      });
                    }}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowSignOutConfirm(true)}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>
      <AlertDialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your boards and tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSignOutConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSignOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/*" element={<Layout />}>
      <Route index element={<Navigate to="/boards" replace />} />
      <Route path="boards" element={<ProtectedRoute><BoardsPage /></ProtectedRoute>} />
      <Route path="board/:id" element={<ProtectedRoute><Board /></ProtectedRoute>} />
      <Route path="teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
      <Route path="dashboard" element={<ProtectedRoute><SystemDashboard /></ProtectedRoute>} />
      <Route path="ai" element={<ProtectedRoute><AIPage /></ProtectedRoute>} />
      <Route path="auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<Navigate to="/boards" replace />} />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    } satisfies RouterOptions['future']
  }
);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Analytics debug={true} />
      <SpeedInsights debug={true} />
      <Toaster />
    </AuthProvider>
  );
}