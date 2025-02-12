import { TaskCard } from './task-card';
import type { Database } from '@/lib/database.types';
import { PlusCircle } from 'lucide-react';

type Task = Database['public']['Tables']['tasks']['Row'];

interface ColumnProps {
  tasks: Task[];
  onTaskUpdated: () => void;
  onNewTask: () => void;
}

export function Column({ tasks, onTaskUpdated, onNewTask }: ColumnProps) {
  return (
    <div className="min-h-[50px] space-y-3">
      {tasks.map((task, index) => (
        <TaskCard
          key={task.id}
          task={task}
          index={index}
          onTaskUpdated={onTaskUpdated}
        />
      ))}
      {tasks.length === 0 && (
        <button
          onClick={onNewTask}
          className="w-full flex flex-col items-center rounded-lg border border-dashed border-muted-foreground/50 bg-muted/50 p-4 transition-colors hover:border-muted-foreground/75 hover:bg-muted/75 hover:cursor-pointer"
        >
          <PlusCircle className="h-8 w-8 text-muted-foreground hover:text-muted-foreground/75" />
          <p className="mt-2 text-sm text-foreground/80 dark:text-foreground/90">
            Click to add a task
          </p>
        </button>
      )}
    </div>
  );
}