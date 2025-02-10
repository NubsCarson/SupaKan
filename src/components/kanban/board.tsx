import { useEffect, useState } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Plus, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { KanbanColumn } from './column';
import { TaskDialog } from './task-dialog';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    const subscription = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchTasks() {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, profiles!tasks_assigned_to_fkey(username, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId as Task['status'];
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', draggableId);

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === draggableId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your tasks and track progress
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsNewTaskOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
        
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Droppable droppableId="todo">
              {(provided) => (
                <KanbanColumn
                  title="To Do"
                  description="Tasks to be started"
                  tasks={tasks.filter((task) => task.status === 'todo')}
                  provided={provided}
                  isLoading={isLoading}
                />
              )}
            </Droppable>
            <Droppable droppableId="doing">
              {(provided) => (
                <KanbanColumn
                  title="In Progress"
                  description="Tasks currently being worked on"
                  tasks={tasks.filter((task) => task.status === 'doing')}
                  provided={provided}
                  isLoading={isLoading}
                />
              )}
            </Droppable>
            <Droppable droppableId="done">
              {(provided) => (
                <KanbanColumn
                  title="Done"
                  description="Completed tasks"
                  tasks={tasks.filter((task) => task.status === 'done')}
                  provided={provided}
                  isLoading={isLoading}
                />
              )}
            </Droppable>
          </div>
        </DragDropContext>

        <TaskDialog
          open={isNewTaskOpen}
          onOpenChange={setIsNewTaskOpen}
          onTaskCreated={fetchTasks}
        />
      </div>
    </div>
  );
}