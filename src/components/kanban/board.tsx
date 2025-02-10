import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskDialog } from './task-dialog';
import { Column } from './column';
import { dbService } from '@/lib/db';
import type { Task } from '@/lib/types';
import { ChatPanel } from '@/components/chat/chat-panel';
import { Badge } from '@/components/ui/badge';

const columns = [
  { id: 'backlog', title: 'Backlog', icon: '📋' },
  { id: 'todo', title: 'To Do', icon: '📝' },
  { id: 'in_progress', title: 'In Progress', icon: '⚡' },
  { id: 'in_review', title: 'In Review', icon: '👀' },
  { id: 'done', title: 'Done', icon: '✅' },
] as const;

export function Board() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const tasks = await dbService.getTasks();
      setTasks(tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

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
  }, [loadTasks]);

  const onDragStart = () => {
    setIsDragging(true);
  };

  const onDragEnd = async (result: DropResult) => {
    setIsDragging(false);
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

      // Create new arrays for source and destination columns
      const sourceColumnTasks = tasks.filter(t => t.status === source.droppableId);
      const destColumnTasks = tasks.filter(t => 
        t.status === destination.droppableId && t.id !== draggableId
      );

      // Remove from source
      sourceColumnTasks.splice(source.index, 1);

      // Add to destination
      const updatedTask = {
        ...taskToMove,
        status: destination.droppableId as Task['status']
      };
      destColumnTasks.splice(destination.index, 0, updatedTask);

      // Combine all tasks
      const newTasks = tasks.map(task => {
        if (task.id === draggableId) {
          return updatedTask;
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

      // Update state immediately
      setTasks(newTasks);

      // Persist the change
      await dbService.updateTask(draggableId, {
        status: destination.droppableId as Task['status']
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      // Revert to original state if update fails
      await loadTasks();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
          <span className="text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todoTasks = tasks.filter(task => task.status === 'todo');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const inReviewTasks = tasks.filter(task => task.status === 'in_review');
  const doneTasks = tasks.filter(task => task.status === 'done');

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Project Board</h1>
          <div className="text-sm text-muted-foreground">
            {completedTasks} of {totalTasks} tasks completed ({completionRate}%)
          </div>
        </div>
        <Button onClick={() => {
          setSelectedTask(null);
          setIsTaskDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex flex-1 gap-4">
            {columns.map(({ id, title, icon }) => {
              const columnTasks = tasks.filter(task => task.status === id);
              const columnCompletion = Math.round((columnTasks.length / Math.max(totalTasks, 1)) * 100);
              
              return (
                <div
                  key={id}
                  className="flex h-full w-[350px] flex-shrink-0 flex-col rounded-lg border bg-card text-card-foreground shadow-sm dark:bg-card/80"
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span role="img" aria-label={title}>{icon}</span>
                        <h2 className="font-semibold text-foreground">{title}</h2>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {columnTasks.length}
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${columnCompletion}%` }}
                      />
                    </div>
                  </div>
                  <Droppable droppableId={id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto p-2 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-muted/50' : ''
                        }`}
                      >
                        <Column
                          tasks={columnTasks}
                          onTaskUpdated={loadTasks}
                          onNewTask={() => {
                            setSelectedTask(null);
                            setIsTaskDialogOpen(true);
                          }}
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

        {/* Chat Panel */}
        <div className="w-[400px]">
          <ChatPanel />
        </div>
      </div>

      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={selectedTask}
        onTaskSaved={() => {
          setIsTaskDialogOpen(false);
          loadTasks();
        }}
      />
    </div>
  );
}