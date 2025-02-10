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

    // Find the task being dragged
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Create arrays of tasks for the source and destination columns
    const sourceColumnTasks = tasks.filter(t => t.status === source.droppableId);
    const destColumnTasks = tasks.filter(t => t.status === destination.droppableId);

    // Remove from source column
    sourceColumnTasks.splice(source.index, 1);

    // Add to destination column
    if (source.droppableId === destination.droppableId) {
      sourceColumnTasks.splice(destination.index, 0, {
        ...task,
        status: destination.droppableId as Task['status'],
      });
    } else {
      destColumnTasks.splice(destination.index, 0, {
        ...task,
        status: destination.droppableId as Task['status'],
      });
    }

    // Combine all tasks
    const newTasks = tasks.map(t => {
      if (t.status === source.droppableId) {
        return sourceColumnTasks[tasks.filter(task => task.status === source.droppableId).indexOf(t)] || t;
      }
      if (t.status === destination.droppableId) {
        return destColumnTasks[tasks.filter(task => task.status === destination.droppableId).indexOf(t)] || t;
      }
      return t;
    });

    // Update state optimistically
    setTasks(newTasks);

    try {
      // Persist the change
      await dbService.updateTask(task.id, {
        status: destination.droppableId as Task['status'],
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      await loadTasks(); // Reload tasks if update fails
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {columns.map(({ id, title }) => {
            const columnTasks = tasks.filter(task => task.status === id);
            return (
              <div
                key={id}
                className="flex h-full w-80 flex-shrink-0 flex-col rounded-lg bg-muted/50"
              >
                <div className="p-2">
                  <h2 className="px-2 font-semibold">{title}</h2>
                  <div className="mt-1 h-1 w-full rounded-full bg-gradient-to-r from-primary/20 to-primary/5" />
                </div>
                <Droppable droppableId={id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto p-2 ${
                        snapshot.isDraggingOver ? 'bg-muted/80' : ''
                      }`}
                    >
                      <Column
                        tasks={columnTasks}
                        onTaskUpdated={loadTasks}
                      />
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
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