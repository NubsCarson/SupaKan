import { useState, memo } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Calendar, Clock, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TaskDialog } from './task-dialog';
import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskCardProps {
  task: Task;
  index: number;
  onTaskUpdated: () => void;
}

const priorityColors = {
  low: 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20',
  high: 'bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20',
};

function TaskCardComponent({ task, index, onTaskUpdated }: TaskCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: 'Task deleted',
        description: 'The task has been deleted successfully.',
      });

      onTaskUpdated();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete task',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{
              ...provided.draggableProps.style,
              transition: snapshot.isDragging
                ? undefined
                : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            className="mb-3"
          >
            <Card className={cn(
              "group relative select-none transition-all",
              snapshot.isDragging && "rotate-2 scale-105 shadow-lg ring-2 ring-primary",
              !snapshot.isDragging && "hover:shadow-md hover:-translate-y-0.5"
            )}>
              <CardHeader className="p-3">
                <div className="flex items-start gap-2">
                  <div
                    {...provided.dragHandleProps}
                    className={cn(
                      "mt-1 cursor-grab active:cursor-grabbing",
                      snapshot.isDragging && "cursor-grabbing"
                    )}
                  >
                    <GripVertical className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground/50",
                      snapshot.isDragging && "text-primary"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium leading-none text-foreground">
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 shrink-0 opacity-0 transition-opacity",
                            "group-hover:opacity-100",
                            snapshot.isDragging && "opacity-0"
                          )}
                          onClick={() => setDialogOpen(true)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 shrink-0 opacity-0 transition-opacity hover:text-destructive",
                            "group-hover:opacity-100",
                            snapshot.isDragging && "opacity-0"
                          )}
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge
                        variant="secondary"
                        className={cn(
                          priorityColors[task.priority],
                          snapshot.isDragging && "ring-1 ring-primary"
                        )}
                      >
                        {task.priority}
                      </Badge>
                      {task.labels?.map((label) => (
                        <Badge 
                          key={label} 
                          variant="outline" 
                          className={cn(
                            "text-foreground",
                            snapshot.isDragging && "ring-1 ring-primary"
                          )}
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              {task.description && (
                <CardContent className="px-3 py-2">
                  <div
                    className="prose prose-sm max-w-none text-sm text-foreground dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                    dangerouslySetInnerHTML={{ __html: task.description }}
                  />
                </CardContent>
              )}
              <CardFooter className="flex flex-wrap items-center gap-3 px-3 py-2 text-xs text-muted-foreground">
                {task.due_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(task.due_date), 'MMM d')}</span>
                  </div>
                )}
                {task.estimated_hours && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{task.estimated_hours}h</span>
                  </div>
                )}
                <div className="ml-auto font-mono text-[10px] text-muted-foreground/70">
                  {task.ticket_id}
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
      </Draggable>

      <TaskDialog
        task={task}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onTaskSaved={onTaskUpdated}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              and remove it from the board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const TaskCard = memo(TaskCardComponent);