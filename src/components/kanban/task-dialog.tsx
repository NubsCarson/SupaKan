import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { dbService } from '@/lib/db';
import type { Task } from '@/lib/types';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onTaskSaved: () => void;
}

export function TaskDialog({ open, onOpenChange, task, onTaskSaved }: TaskDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        status: formData.get('status') as Task['status'],
        priority: formData.get('priority') as Task['priority'],
        due_date: formData.get('due_date') as string || undefined,
        position: task?.position || 0, // Keep existing position or default to 0 for new tasks
        created_by: 'user', // TODO: Get from auth context
        assigned_to: null,
        ticket_id: task?.ticket_id || crypto.randomUUID(),
        labels: task?.labels || [],
        estimated_hours: task?.estimated_hours
      };

      if (task) {
        await dbService.updateTask(task.id, data);
      } else {
        await dbService.createTask(data);
      }

      onTaskSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {task ? 'Edit Task' : 'Create Task'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {task ? 'Make changes to your task here.' : 'Add a new task to your board.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter task title"
                className="w-full"
                defaultValue={task?.title}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter task description"
                className="min-h-[100px] w-full resize-y"
                defaultValue={task?.description || ''}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <Select name="status" defaultValue={task?.status || 'todo'}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </Label>
                <Select name="priority" defaultValue={task?.priority || 'low'}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due_date" className="text-sm font-medium">
                Due Date
              </Label>
              <Input
                type="date"
                id="due_date"
                name="due_date"
                className="w-full"
                defaultValue={task?.due_date}
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}