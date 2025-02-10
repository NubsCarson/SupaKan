import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TaskDialog } from './task-dialog';
import type { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  onTaskUpdated: () => void;
}

export function TaskCard({ task, onTaskUpdated }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const priorityColors = {
    low: 'bg-green-500/10 text-green-700',
    medium: 'bg-yellow-500/10 text-yellow-700',
    high: 'bg-red-500/10 text-red-700',
  };

  return (
    <>
      <Card className="group relative">
        <CardHeader className="p-4">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-medium leading-none">
              {task.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge variant="secondary" className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
            {task.labels?.map((label) => (
              <Badge key={label} variant="outline">
                {label}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-2">
          <div
            className="prose prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: task.description || '' }}
          />
        </CardContent>
        <CardFooter className="flex items-center gap-4 px-4 pb-4 text-sm text-muted-foreground">
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(task.due_date), 'MMM d')}</span>
            </div>
          )}
          {task.estimated_hours && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{task.estimated_hours}h</span>
            </div>
          )}
          <div className="ml-auto text-xs">
            {task.ticket_id}
          </div>
        </CardFooter>
      </Card>

      <TaskDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        task={task}
        onTaskCreated={onTaskUpdated}
      />
    </>
  );
}