import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { createBoard } from '@/lib/boards';
import { toast } from '@/components/ui/use-toast';

const boardSchema = z.object({
  title: z.string().min(1, 'Board title is required'),
});

type BoardFormData = z.infer<typeof boardSchema>;

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onBoardCreated?: () => void;
}

export function CreateBoardDialog({
  open,
  onOpenChange,
  teamId,
  onBoardCreated,
}: CreateBoardDialogProps) {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
  });

  const onSubmit = async (data: BoardFormData) => {
    if (!user) return;

    try {
      setIsCreating(true);
      await createBoard({
        title: data.title,
        teamId,
        createdBy: user.id,
      });
      
      toast({
        title: 'Board created',
        description: 'Your new board has been created successfully.',
      });

      onOpenChange(false);
      onBoardCreated?.();
      reset();
    } catch (error) {
      console.error('Failed to create board:', error);
      toast({
        title: 'Error',
        description: 'Failed to create board. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Board</DialogTitle>
          <DialogDescription>
            Create a new board to organize your tasks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Board Title</Label>
              <Input
                id="title"
                {...register('title')}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Board'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 