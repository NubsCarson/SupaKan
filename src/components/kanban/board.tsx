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

    try {
      // Find the task being dragged
      const taskToMove = tasks.find(t => t.id === draggableId);
      if (!taskToMove) return;

      // Create a new array with the updated task status
      const updatedTasks = tasks.map(task => {
        if (task.id === draggableId) {
          return {
            ...task,
            status: destination.droppableId as Task['status']
          };
        }
        return task;
      });

      // Sort tasks by their new positions
      const reorderedTasks = reorderTasks(
        updatedTasks,
        source,
        destination,
        taskToMove
      );

      // Update state immediately
      setTasks(reorderedTasks);

      // Persist the change
      await dbService.updateTask(draggableId, {
        status: destination.droppableId as Task['status']
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      // Revert to original state if update fails
      await loadTasks();
    }
  }

  function reorderTasks(
    tasks: Task[],
    source: { index: number; droppableId: string },
    destination: { index: number; droppableId: string },
    movedTask: Task
  ) {
    const result = [...tasks];

    // Remove task from source column
    const sourceColumnTasks = result.filter(t => t.status === source.droppableId);
    sourceColumnTasks.splice(source.index, 1);

    // Add task to destination column
    const destColumnTasks = result.filter(t => 
      t.status === destination.droppableId && t.id !== movedTask.id
    );
    destColumnTasks.splice(destination.index, 0, {
      ...movedTask,
      status: destination.droppableId as Task['status']
    });

    // Combine all tasks, preserving order
    return result.map(task => {
      if (task.id === movedTask.id) {
        return {
          ...task,
          status: destination.droppableId as Task['status']
        };
      }
      if (task.status === source.droppableId) {
        const index = sourceColumnTasks.findIndex(t => t.id === task.id);
        return index !== -1 ? sourceColumnTasks[index] : task;
      }
      if (task.status === destination.droppableId) {
        const index = destColumnTasks.findIndex(t => t.id === task.id);
        return index !== -1 ? destColumnTasks[index] : task;
      }
      return task;
    });
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