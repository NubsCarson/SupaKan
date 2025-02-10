import { TaskCard } from './task-card';
import type { Task } from '@/lib/types';

interface ColumnProps {
  tasks: Task[];
  onTaskUpdated: () => void;
}

export function Column({ tasks, onTaskUpdated }: ColumnProps) {
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
        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-4">
          <p className="text-center text-sm text-muted-foreground">
            Drop tasks here
          </p>
        </div>
      )}
    </div>
  );
}