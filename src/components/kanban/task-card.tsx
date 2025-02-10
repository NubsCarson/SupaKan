import { useState } from 'react';
import { Calendar, Link, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaskDialog } from './task-dialog';
import type { Database } from '@/types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

const priorityColors = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">{task.title}</p>
            {task.ticket_id && (
              <div className="flex items-center space-x-1">
                <Link className="h-3 w-3" />
                <span className="text-xs text-muted-foreground">
                  {task.ticket_id}
                </span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {task.description || 'No description'}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={task.profiles?.avatar_url || undefined}
                alt={task.profiles?.username || 'User'}
              />
              <AvatarFallback>
                {task.profiles?.username?.[0].toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span className="text-xs text-muted-foreground">
                {format(new Date(task.created_at), 'MMM d')}
              </span>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={`${priorityColors[task.priority]} text-white`}
          >
            {task.priority}
          </Badge>
        </CardFooter>
      </Card>

      <TaskDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        task={task}
      />
    </>
  );
}