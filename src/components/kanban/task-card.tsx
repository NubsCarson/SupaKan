import { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskDialog } from './task-dialog';
import type { Task } from '@/lib/types';
import { dbService } from '@/lib/db';

interface TaskCardProps {
  task: Task;
  index: number;
  onTaskUpdated: () => void;
}

const priorityColors = {
  low: 'bg-green-500/10 text-green-700 dark:text-green-400',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  high: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

export function TaskCard({ task, index, onTaskUpdated }: TaskCardProps) {
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
        {(provided) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="mb-2"
          >
            <CardHeader className="p-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>{task.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDialogOpen(true)}
                >
                  Edit
                </Button>
              </CardTitle>
            </CardHeader>
            {task.description && (
              <CardContent className="px-3 py-1 text-sm text-muted-foreground">
                {task.description}
              </CardContent>
            )}
            <CardFooter className="flex flex-wrap gap-2 p-3">
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                  priorityColors[task.priority]
                }`}
              >
                {task.priority}
              </span>
              {task.due_date && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.due_date), 'MMM d')}
                </span>
              )}
              {task.estimated_hours && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {task.estimated_hours}h
                </span>
              )}
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