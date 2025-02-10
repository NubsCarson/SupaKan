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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuth(true);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <AuthDialog open={showAuth} onOpenChange={setShowAuth} />;
  }

  return <>{children}</>;
}

function Layout() {
  const { user, setUser } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link className="mr-6 flex items-center space-x-2" to="/">
              <span className="font-bold sm:inline-block">Kanban</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                to="/"
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  'text-foreground'
                )}
              >
                Board
              </Link>
              <Link
                to="/dashboard"
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  'text-foreground/60'
                )}
              >
                <Gauge className="h-5 w-5" />
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* Add search or other controls here */}
            </div>
            <nav className="flex items-center space-x-2">
              <a
                href="https://github.com/NubsCarson/kanban"
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="ghost" size="icon">
                  <Github className="h-5 w-5" />
                </Button>
              </a>
              <ModeToggle />
              {user ? (
                <Button
                  variant="ghost"
                  onClick={() => setUser(null)}
                >
                  Sign Out
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setShowAuth(true)}
                >
                  Sign In
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
      <Toaster />
    </div>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/*" element={<Layout />}>
      <Route index element={<ProtectedRoute><Board /></ProtectedRoute>} />
      <Route path="dashboard" element={<ProtectedRoute><SystemDashboard /></ProtectedRoute>} />
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