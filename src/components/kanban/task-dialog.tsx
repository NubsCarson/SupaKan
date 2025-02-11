import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@/components/ui/editor';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { useAuth } from '@/lib/auth-context';
import { toast } from '@/components/ui/use-toast';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onTaskSaved: () => void;
}

export function TaskDialog({ open, onOpenChange, task, onTaskSaved }: TaskDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const editor = useEditor({
    extensions: [StarterKit],
    content: task?.description || '',
    editorProps: {
      attributes: {
        class: 'min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground',
      },
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const dueDateValue = formData.get('due_date');
      
      const data = {
        title: formData.get('title') as string,
        description: editor?.getHTML() || '',
        status: formData.get('status') as Task['status'],
        priority: formData.get('priority') as Task['priority'],
        due_date: dueDateValue ? dueDateValue.toString() : null,
        position: task?.position || 0,
        created_by: user.id,
        assigned_to: null,
        board_id: task?.board_id || '', // You'll need to pass this from parent
        team_id: task?.team_id || '', // You'll need to pass this from parent
        labels: task?.labels || [],
        estimated_hours: task?.estimated_hours || null,
      };

      if (task) {
        const { error } = await supabase
          .from('tasks')
          .update(data)
          .eq('id', task.id);

        if (error) throw error;
      } else {
        // Generate ticket ID (you might want to move this to a backend function)
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true });

        const nextNumber = (count ?? 0) + 1;
        const ticket_id = `TASK-${nextNumber.toString().padStart(4, '0')}`;

        const { error } = await supabase
          .from('tasks')
          .insert({ ...data, ticket_id });

        if (error) throw error;
      }

      toast({
        title: task ? 'Task updated' : 'Task created',
        description: task ? 'Your task has been updated.' : 'Your new task has been created.',
      });

      onTaskSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save task',
        variant: 'destructive',
      });
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
              <Label className="text-sm font-medium">
                Description
              </Label>
              <Editor editor={editor} />
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
                defaultValue={task?.due_date?.split('T')[0]}
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