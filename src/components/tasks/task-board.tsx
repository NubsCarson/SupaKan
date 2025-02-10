import { useState, useEffect } from 'react';
import type {
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableProvided,
  DropResult,
} from '@hello-pangea/dnd';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '@/lib/auth-context';
import { dbService } from '@/lib/db';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  MoreVertical,
  Plus,
  Tag,
  Timer,
  Trash2,
  User2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const COLUMNS = [
  { id: 'backlog', name: 'Backlog' },
  { id: 'todo', name: 'To Do' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'in_review', name: 'In Review' },
  { id: 'done', name: 'Done' },
] as const;

const PRIORITIES = {
  low: { label: 'Low', color: 'bg-blue-500/10 text-blue-500' },
  medium: { label: 'Medium', color: 'bg-yellow-500/10 text-yellow-500' },
  high: { label: 'High', color: 'bg-red-500/10 text-red-500' },
} as const;

export function TaskBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const tasks = await dbService.getTasks();
      setTasks(tasks);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    try {
      const task = tasks.find(t => t.id === draggableId);
      if (!task) return;

      const newStatus = destination.droppableId as Task['status'];
      await dbService.updateTask(draggableId, { status: newStatus });

      setTasks(prev =>
        prev.map(t =>
          t.id === draggableId ? { ...t, status: newStatus } : t
        )
      );

      toast({
        title: 'Task updated',
        description: `Task moved to ${COLUMNS.find(c => c.id === newStatus)?.name}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTask = async () => {
    if (!user) return;

    try {
      const task = await dbService.createTask({
        title: 'New Task',
        description: 'Click to edit this task',
        status: 'todo',
        priority: 'medium',
        ticket_id: dbService.generateTicketId(),
        created_by: user.id,
        assigned_to: null,
        labels: [],
      });

      setTasks(prev => [...prev, task]);
      toast({
        title: 'Task created',
        description: 'New task has been added to To Do',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await dbService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({
        title: 'Task deleted',
        description: 'Task has been removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <Button onClick={handleCreateTask}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="flex-1 px-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid h-full grid-cols-5 gap-4">
            {COLUMNS.map(column => (
              <div
                key={column.id}
                className="flex h-full flex-col rounded-lg border bg-card"
              >
                <div className="border-b p-4">
                  <h3 className="font-semibold">{column.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tasks.filter(t => t.status === column.id).length} tasks
                  </p>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided: DroppableProvided) => (
                    <ScrollArea className="flex-1 p-4">
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-4"
                      >
                        {tasks
                          .filter(task => task.status === column.id)
                          .map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                            >
                              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={cn(
                                    'group relative',
                                    snapshot.isDragging && 'shadow-lg'
                                  )}
                                >
                                  <CardHeader className="p-4">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <CardTitle className="text-sm">
                                          {task.title}
                                        </CardTitle>
                                        <CardDescription className="mt-1 text-xs">
                                          {task.ticket_id}
                                        </CardDescription>
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                          >
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => handleDeleteTask(task.id)}
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="px-4 pb-4">
                                    <p className="text-sm text-muted-foreground">
                                      {task.description}
                                    </p>
                                    {task.labels.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {task.labels.map(label => (
                                          <Badge
                                            key={label}
                                            variant="secondary"
                                            className="gap-1 text-xs"
                                          >
                                            <Tag className="h-3 w-3" />
                                            {label}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </CardContent>
                                  <CardFooter className="grid grid-cols-2 gap-2 px-4 pb-4">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {format(
                                          new Date(task.created_at),
                                          'MMM d'
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs">
                                      {task.estimated_hours && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                          <Timer className="h-3 w-3" />
                                          <span>{task.estimated_hours}h</span>
                                        </div>
                                      )}
                                      {task.assigned_to && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                          <User2 className="h-3 w-3" />
                                          <span>Assigned</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="col-span-2">
                                      <Badge
                                        variant="secondary"
                                        className={cn(
                                          'w-fit',
                                          PRIORITIES[task.priority].color
                                        )}
                                      >
                                        {PRIORITIES[task.priority].label}
                                      </Badge>
                                    </div>
                                  </CardFooter>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    </ScrollArea>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
} 