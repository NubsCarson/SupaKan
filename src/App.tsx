import { Board } from '@/components/kanban/board';
import { Toaster } from '@/components/ui/toaster';

export default function App() {
  return (
    <main className="min-h-screen bg-background">
      <Board />
      <Toaster />
    </main>
  );
}