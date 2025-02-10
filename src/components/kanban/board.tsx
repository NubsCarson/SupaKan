import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskDialog } from './task-dialog';
import { Column } from './column';
import { dbService } from '@/lib/db';
import type { Task } from '@/lib/types';

const columns = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
] as const;

export function Board() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeDb = async () => {
      try {
        await dbService.initialize();
        await loadTasks();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDb();
  }, []);

  async function loadTasks() {
    try {
      const tasks = await dbService.getTasks();
      setTasks(tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }

  async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const newTasks = Array.from(tasks);
    newTasks.splice(source.index, 1);
    newTasks.splice(destination.index, 0, {
      ...task,
      status: destination.droppableId as Task['status'],
    });

    setTasks(newTasks);
    try {
      await dbService.updateTask(task.id, { status: destination.droppableId as Task['status'] });
    } catch (error) {
      console.error('Failed to update task:', error);
      await loadTasks(); // Reload tasks if update fails
    }
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading...</div>;
  }

  return (
    <div className="h-full p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {columns.map(({ id, title }) => (
            <div key={id} className="flex flex-col rounded-lg bg-muted/50 p-2">
              <h2 className="mb-2 px-2 font-semibold">{title}</h2>
              <Droppable droppableId={id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1"
                  >
                    <Column
                      tasks={tasks.filter((task) => task.status === id)}
                      onTaskUpdated={loadTasks}
                    />
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onTaskCreated={loadTasks}
      />
    </div>
  );
}