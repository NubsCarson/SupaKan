import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Plus, Loader2, MoreVertical, Pencil, Trash2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Board {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  team_id: string;
  team_name: string;
  task_count?: number;
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadBoards();
  }, []);

  async function loadBoards() {
    try {
      // First get the boards with team info
      const { data: boardsData, error: boardsError } = await supabase
        .from('boards')
        .select(`
          *,
          teams (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (boardsError) throw boardsError;

      // Then get task counts for each board
      const boardsWithCounts = await Promise.all(
        boardsData.map(async (board) => {
          const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('board_id', board.id);

          return {
            ...board,
            team_name: board.teams.name,
            task_count: count || 0
          };
        })
      );

      setBoards(boardsWithCounts);
    } catch (error) {
      console.error('Error loading boards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load boards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBoard() {
    try {
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('created_by', user?.id)
        .single();

      if (!team) {
        toast({
          title: 'Error',
          description: 'You need to create a team first',
          variant: 'destructive',
        });
        return;
      }

      const { data: board, error } = await supabase
        .from('boards')
        .insert({
          name: 'New Board',
          description: 'Click to edit this board',
          team_id: team.id,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      await loadBoards();
      navigate(`/board/${board.id}`);
    } catch (error) {
      console.error('Error creating board:', error);
      toast({
        title: 'Error',
        description: 'Failed to create board',
        variant: 'destructive',
      });
    }
  }

  async function handleUpdateBoard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingBoard) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const updates = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
      };

      const { error } = await supabase
        .from('boards')
        .update(updates)
        .eq('id', editingBoard.id);

      if (error) throw error;

      await loadBoards();
      setIsEditDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Board updated successfully',
      });
    } catch (error) {
      console.error('Error updating board:', error);
      toast({
        title: 'Error',
        description: 'Failed to update board',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteBoard() {
    if (!editingBoard) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', editingBoard.id);

      if (error) throw error;

      await loadBoards();
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Board deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting board:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete board',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Boards</h1>
        <Button onClick={handleCreateBoard}>
          <Plus className="mr-2 h-4 w-4" />
          New Board
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => (
          <Card key={board.id} className="group relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{board.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 relative z-20"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-30">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBoard(board);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBoard(board);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>
                <div>{board.description}</div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Created {format(new Date(board.created_at), 'MMM d, yyyy')}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between text-sm text-muted-foreground">
              <div>Team: {board.team_name}</div>
              <div>{board.task_count} tasks</div>
            </CardFooter>
            <div
              className="absolute inset-0 cursor-pointer rounded-lg transition-colors hover:bg-muted/50"
              onClick={() => navigate(`/board/${board.id}`)}
              style={{ zIndex: 10 }}
            />
          </Card>
        ))}

        {boards.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground">
            No boards found. Create your first board to get started!
          </div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Board</DialogTitle>
            <DialogDescription>
              Make changes to your board here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBoard}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingBoard?.name}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingBoard?.description || ''}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the board
              and all its tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBoard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Board'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 