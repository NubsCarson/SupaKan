import { useState, memo } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Calendar, Clock, GripVertical, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskDialog } from './task-dialog';
import type { Task } from '@/lib/types';
import { dbService } from '@/lib/db';

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

  async function handleDelete() {
    try {
      await dbService.deleteTask(task.id);
      onTaskUpdated();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`group mb-3 select-none transition-shadow hover:shadow-md ${
              snapshot.isDragging ? 'shadow-lg' : ''
            }`}
          >
            <CardHeader className="p-3">
              <div 
                className="flex items-start gap-2"
                {...provided.dragHandleProps}
              >
                <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium">
                      {task.title}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => setDialogOpen(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge
                      variant="secondary"
                      className={priorityColors[task.priority]}
                    >
                      {task.priority}
                    </Badge>
                    {task.labels?.map((label) => (
                      <Badge key={label} variant="outline">
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
                  className="prose prose-sm max-w-none text-sm text-muted-foreground"
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
              <div className="ml-auto font-mono text-[10px] opacity-50">
                {task.ticket_id}
              </div>
            </CardFooter>
          </Card>
        )}
      </Draggable>

      <TaskDialog
        task={task}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onTaskUpdated={onTaskUpdated}
      />
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const TaskCard = memo(TaskCardComponent);