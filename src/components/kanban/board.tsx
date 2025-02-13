import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { Plus, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskDialog } from './task-dialog';
import { Column } from './column';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { ChatPanel } from '@/components/chat/chat-panel';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { getTasks, updateTask, updateTaskPositions, getBoard } from '@/lib/boards';
import { useParams, useNavigate } from 'react-router-dom';

type Task = Database['public']['Tables']['tasks']['Row'];
type Board = Database['public']['Tables']['boards']['Row'];

// Transform database task to our Task type
function transformTask(task: Database['public']['Tables']['tasks']['Row']): Task {
  return task;
}

const columns = [
  { id: 'backlog', title: 'Backlog', icon: '📋' },
  { id: 'todo', title: 'To Do', icon: '📝' },
  { id: 'in_progress', title: 'In Progress', icon: '⚡' },
  { id: 'in_review', title: 'In Review', icon: '👀' },
  { id: 'done', title: 'Done', icon: '✅' },
] as const;

export function Board() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user } = useAuth();
  const { id: boardId } = useParams();
  const navigate = useNavigate();

  const loadTasks = useCallback(async () => {
    if (!boardId) {
      navigate('/boards');
      return;
    }

    try {
      const [boardData, tasksData] = await Promise.all([
        getBoard(boardId),
        getTasks(boardId)
      ]);
      
      if (!boardData) {
        toast({
          title: 'Error',
          description: 'Board not found',
          variant: 'destructive',
        });
        navigate('/boards');
        return;
      }

      setBoard(boardData);
      setTasks(tasksData.map(transformTask));
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load board data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load board data. Please try refreshing the page.',
        variant: 'destructive',
      });
      navigate('/boards');
    }
  }, [boardId, navigate]);

  useEffect(() => {
    loadTasks();

    // Subscribe to task changes
    const channel = supabase
      .channel(`board_tasks:${boardId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `board_id=eq.${boardId}`
        }, 
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [loadTasks, boardId]);

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

      // Get tasks in source and destination columns
      const sourceColumnTasks = tasks
        .filter(t => t.status === source.droppableId)
        .sort((a, b) => a.position - b.position);
      
      const destColumnTasks = tasks
        .filter(t => t.status === destination.droppableId && t.id !== draggableId)
        .sort((a, b) => a.position - b.position);

      // Calculate new positions
      const positionStep = 65536; // Large step to allow for future insertions
      let updatedTasks = [...tasks];

      // Same column reordering
      if (source.droppableId === destination.droppableId) {
        const columnTasks = sourceColumnTasks.filter(t => t.id !== draggableId);
        const newPositions = new Array(columnTasks.length + 1).fill(0)
          .map((_, index) => index * positionStep);
        
        // Insert task at new position
        columnTasks.splice(destination.index, 0, taskToMove);
        
        // Update positions for all tasks in the column
        updatedTasks = tasks.map(task => {
          if (task.status === source.droppableId) {
            const index = columnTasks.findIndex(t => t.id === task.id);
            if (index !== -1) {
              return {
                ...task,
                position: newPositions[index]
              };
            }
          }
          return task;
        });
      }
      // Moving between columns
      else {
        // Remove from source column
        const newSourceTasks = sourceColumnTasks.filter(t => t.id !== draggableId);
        const sourcePositions = new Array(newSourceTasks.length).fill(0)
          .map((_, index) => index * positionStep);

        // Insert into destination column
        const newDestTasks = [...destColumnTasks];
        newDestTasks.splice(destination.index, 0, taskToMove);
        const destPositions = new Array(newDestTasks.length).fill(0)
          .map((_, index) => index * positionStep);

        // Update all affected tasks
        updatedTasks = tasks.map(task => {
          // Update moved task
          if (task.id === draggableId) {
            return {
              ...task,
              status: destination.droppableId as Task['status'],
              position: destPositions[destination.index]
            };
          }
          // Update source column tasks
          if (task.status === source.droppableId) {
            const index = newSourceTasks.findIndex(t => t.id === task.id);
            if (index !== -1) {
              return {
                ...task,
                position: sourcePositions[index]
              };
            }
          }
          // Update destination column tasks
          if (task.status === destination.droppableId) {
            const index = newDestTasks.findIndex(t => t.id === task.id);
            if (index !== -1) {
              return {
                ...task,
                position: destPositions[index]
              };
            }
          }
          return task;
        });
      }

      // Update state immediately for smooth animation
      setTasks(updatedTasks);

      // First update the status if it changed
      if (source.droppableId !== destination.droppableId) {
        await updateTask(draggableId, { 
          status: destination.droppableId as Task['status'] 
        });
      }

      // Then update all positions atomically
      const taskPositions = updatedTasks
        .filter(t => 
          t.id === draggableId || 
          t.status === source.droppableId || 
          t.status === destination.droppableId
        )
        .map(({ id, position }) => ({
          id,
          position
        }));

      await updateTaskPositions(taskPositions);

      // Show success toast
      toast({
        title: 'Task updated',
        description: source.droppableId === destination.droppableId
          ? 'Task reordered successfully'
          : `Task moved to ${columns.find(c => c.id === destination.droppableId)?.title}`,
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task position',
        variant: 'destructive',
      });
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
  const overdueTasks = tasks.filter(task => 
    task.due_date && 
    new Date(task.due_date) < new Date() && 
    task.status !== 'done'
  ).length;

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)]">
      {/* Enhanced Header Section */}
      <div className="relative px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-background/5 to-background/5 opacity-50" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {board?.name || 'Loading...'}
              </h1>
              <Badge variant="secondary" className="bg-secondary/30 text-secondary-foreground">
                {tasks.length} Tasks
              </Badge>
              {overdueTasks > 0 && (
                <Badge variant="destructive" className="bg-destructive/90">
                  {overdueTasks} Overdue
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500/70" />
                <span>{completedTasks} Completed</span>
              </div>
              <span className="text-muted-foreground/40">•</span>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-yellow-500/70" />
                <span>{tasks.length - completedTasks} Remaining</span>
              </div>
              <span className="text-muted-foreground/40">•</span>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-primary/70" />
                <span>{completionRate}% Progress</span>
              </div>
              {overdueTasks > 0 && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-destructive/70" />
                    <span className="text-destructive-foreground/90">{overdueTasks} Past Due</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => {
                setSelectedTask(null);
                setIsTaskDialogOpen(true);
              }}
              className="gap-2 bg-primary/90 hover:bg-primary transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 gap-4 overflow-x-auto p-4">
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex flex-1 gap-4">
            {columns.map(({ id, title, icon }) => {
              const columnTasks = tasks
                .filter(task => task.status === id)
                .sort((a, b) => a.position - b.position);
              const columnCompletion = Math.round((columnTasks.length / Math.max(totalTasks, 1)) * 100);
              
              return (
                <div
                  key={id}
                  className="flex h-full w-[280px] flex-shrink-0 flex-col rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md dark:bg-card/80 sm:w-[300px] md:w-[350px]"
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span role="img" aria-label={title} className="text-lg">{icon}</span>
                        <h2 className="font-semibold text-foreground">{title}</h2>
                      </div>
                      <Badge variant="outline" className="bg-muted">
                        {columnTasks.length}
                      </Badge>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          id === 'backlog' && "bg-primary/70",
                          id === 'todo' && "bg-blue-500/70",
                          id === 'in_progress' && "bg-yellow-500/70",
                          id === 'in_review' && "bg-orange-500/70",
                          id === 'done' && "bg-green-500/70"
                        )}
                        style={{ width: `${columnCompletion}%` }}
                      />
                    </div>
                  </div>
                  <Droppable droppableId={id} mode="standard" type="DEFAULT">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "flex-1 p-2 transition-colors duration-200",
                          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted",
                          "hover:scrollbar-thumb-muted-foreground/50",
                          snapshot.isDraggingOver && "bg-muted/50 ring-2 ring-primary/20"
                        )}
                        style={{
                          minHeight: "100px",
                          maxHeight: "calc(100vh - 12rem)",
                          overflowY: "auto"
                        }}
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

        {/* Desktop Chat Panel */}
        <div className="hidden w-[350px] xl:block">
          {board?.id && <ChatPanel boardId={board.id} />}
        </div>

        {/* Mobile Chat Panel */}
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 xl:hidden",
            "transition-transform duration-300 ease-in-out",
            isChatOpen ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="relative h-[70vh] rounded-t-xl border-t bg-background shadow-lg">
            <div className="sticky top-0 flex items-center justify-between border-b bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <h2 className="text-lg font-semibold">Chat</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="h-[calc(70vh-3rem)]">
              {board?.id && <ChatPanel boardId={board.id} />}
            </div>
          </div>
        </div>

        {/* Mobile Chat Toggle */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg xl:hidden",
            isChatOpen && "translate-y-[-70vh]"
          )}
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>

      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={selectedTask}
        onTaskSaved={loadTasks}
        boardId={board?.id}
        teamId={board?.team_id}
      />
    </div>
  );
}