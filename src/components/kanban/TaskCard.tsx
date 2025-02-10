import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Task } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  return (
    <Card
      className={cn(
        "group relative mb-2 overflow-hidden transition-all duration-200",
        "hover:ring-2 hover:ring-primary/20",
        "active:ring-2 active:ring-primary/30",
        isDragging && "rotate-2 scale-105 ring-2 ring-primary/30 shadow-lg",
        !isDragging && "hover:-translate-y-0.5"
      )}
    >
      <CardHeader className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1.5">
            <CardTitle className="line-clamp-2 text-sm font-semibold sm:text-base">
              {task.title}
            </CardTitle>
            {task.description && (
              <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                {task.description}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-shrink-0 flex-col items-end gap-2">
            <Badge 
              variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
              className="text-[10px] sm:text-xs"
            >
              {task.priority}
            </Badge>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 sm:h-8 sm:w-8"
              >
                <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <div
                className={cn(
                  "h-6 w-1.5 cursor-grab rounded-full bg-muted transition-colors",
                  "hover:bg-muted-foreground/50",
                  "active:cursor-grabbing",
                  isDragging && "bg-primary"
                )}
              />
            </div>
          </div>
        </div>
        {task.due_date && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground sm:text-xs">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Due {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
          </div>
        )}
      </CardHeader>
    </Card>
  );
} 