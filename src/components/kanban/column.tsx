import { Draggable } from 'react-beautiful-dnd';
import { TaskCard } from './task-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Database } from '@/types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

interface KanbanColumnProps {
  title: string;
  description: string;
  tasks: Task[];
  provided: any;
  isLoading: boolean;
}

export function KanbanColumn({
  title,
  description,
  tasks,
  provided,
  isLoading,
}: KanbanColumnProps) {
  return (
    <div
      className="flex h-[calc(100vh-12rem)] flex-col rounded-lg border bg-card"
      {...provided.droppableProps}
      ref={provided.innerRef}
    >
      <div className="border-b p-4">
        <h2 className="font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[120px]" />
            ))
          ) : (
            tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <TaskCard task={task} />
                  </div>
                )}
              </Draggable>
            ))
          )}
          {provided.placeholder}
        </div>
      </div>
      <div className="border-t p-4">
        <div className="text-sm text-muted-foreground">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </div>
      </div>
    </div>
  );
}