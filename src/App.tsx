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
import { Github, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import { SystemDashboard } from '@/components/system-dashboard';
import AuthCallback from '@/routes/auth/callback';
import { Logo } from '@/components/logo';

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
  const { isAuthenticated, loading } = useAuth();

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
                  to="/dashboard" 
                  className="transition-colors hover:text-foreground/80"
                  title="System Dashboard"
                >
                  <Gauge className="h-5 w-5" />
                </Link>
              </nav>
            )}
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="flex items-center gap-2">
              <a
                target="_blank"
                rel="noreferrer"
                href="https://github.com/nubs4dayz/kanbann"
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
            </div>
          </div>
        </div>
      </header>
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
      <Route index element={<ProtectedRoute><Board /></ProtectedRoute>} />
      <Route path="dashboard" element={<ProtectedRoute><SystemDashboard /></ProtectedRoute>} />
      <Route path="auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Analytics />
      <SpeedInsights />
      <Toaster />
    </AuthProvider>
  );
}