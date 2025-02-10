import { Draggable } from 'react-beautiful-dnd';
import { TaskCard } from './task-card';
import type { Task } from '@/lib/storage';

interface ColumnProps {
  tasks: Task[];
  onTaskUpdated: () => void;
}

export function Column({ tasks, onTaskUpdated }: ColumnProps) {
  return (
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <Draggable key={task.id} draggableId={task.id} index={index}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
              <TaskCard task={task} onTaskUpdated={onTaskUpdated} />
            </div>
          )}
        </Draggable>
      ))}
    </div>
  );
}