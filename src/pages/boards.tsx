import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Plus, Loader2, MoreVertical, Pencil, Trash2, Calendar, Search, Layout, Star, Clock, ArrowUpRight, Filter, SortAsc, LayoutGrid, Clock4, CheckCircle, AlertTriangle, Users } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
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
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/lib/database.types';
import { PROJECT_TEMPLATES, type BoardTemplate } from '@/lib/templates';

interface Board {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  team_id: string;
  team_name: string;
  task_count?: number;
}

type Task = Database['public']['Tables']['tasks']['Row'];

interface Team {
  id: string;
  name: string;
}

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSuccess: () => Promise<void>;
}

function CreateBoardDialog({ open, onOpenChange, onCreateSuccess }: CreateBoardDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('team_members')
        .select(`
          teams (
            id,
            name
          )
        `)
        .eq('user_id', user?.id);

      if (teamsError) throw teamsError;

      const uniqueTeams = teamsData?.reduce<Team[]>((acc, item) => {
        if (item.teams && typeof item.teams === 'object' && 'id' in item.teams && 'name' in item.teams) {
          acc.push({
            id: item.teams.id as string,
            name: item.teams.name as string
          });
        }
        return acc;
      }, []) || [];

      setTeams(uniqueTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teams',
        variant: 'destructive',
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const teamId = formData.get('team_id') as string;

      // Create the board
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
          name,
          description,
          team_id: teamId,
          created_by: user.id
        })
        .select()
        .single();

      if (boardError) throw boardError;

      // If a template was selected, create the template tasks
      if (selectedTemplate && board) {
        const templateTasks = selectedTemplate.tasks.map(task => ({
          ...task,
          board_id: board.id,
          team_id: teamId,
          created_by: user.id,
          ticket_id: `T-${Math.random().toString(36).substr(2, 8)}`,
        }));

        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(templateTasks);

        if (tasksError) throw tasksError;
      }

      await onCreateSuccess();
      onOpenChange(false);
      navigate(`/board/${board.id}`);

      toast({
        title: 'Board Created',
        description: `Successfully created ${name} ${selectedTemplate ? 'with template' : ''}`,
      });
    } catch (error) {
      console.error('Error creating board:', error);
      toast({
        title: 'Error',
        description: 'Failed to create board',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
          <DialogDescription>
            Create a new board to organize your tasks. Choose a template to get started quickly.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Board Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter board name"
                required
                defaultValue={selectedTemplate?.name || ''}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter board description"
                defaultValue={selectedTemplate?.description || ''}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="team_id">Team</Label>
              <Select name="team_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Template (Optional)</Label>
              <div className="grid grid-cols-2 gap-4">
                {PROJECT_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary",
                      selectedTemplate?.id === template.id && "border-primary bg-primary/5"
                    )}
                    onClick={() => setSelectedTemplate(
                      selectedTemplate?.id === template.id ? null : template
                    )}
                  >
                    <CardHeader className="space-y-0 pb-2">
                      <CardTitle className="text-base">
                        {template.icon} {template.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        Includes {template.tasks.length} predefined tasks
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Board'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'tasks'>('recent');
  const [filterTimeframe, setFilterTimeframe] = useState<'all' | 'today' | 'week' | 'month'>('all');

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

      // Get all tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*');

      if (tasksError) throw tasksError;

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
      setTasks(tasksData || []);
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

  // Filter and sort boards
  const filteredBoards = boards
    .filter(board => {
      const matchesSearch = board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        board.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const date = new Date(board.created_at);
      const matchesTimeframe = filterTimeframe === 'all' ||
        (filterTimeframe === 'today' && isToday(date)) ||
        (filterTimeframe === 'week' && isThisWeek(date)) ||
        (filterTimeframe === 'month' && isThisMonth(date));
      
      return matchesSearch && matchesTimeframe;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'tasks':
          return (b.task_count || 0) - (a.task_count || 0);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Calculate stats
  const totalTasks = boards.reduce((sum, board) => sum + (board.task_count || 0), 0);
  const totalBoards = boards.length;
  const recentBoards = boards.filter(board => isThisWeek(new Date(board.created_at))).length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const remainingTasks = totalTasks - completedTasks;
  const completionRate = Math.round((completedTasks / Math.max(totalTasks, 1)) * 100);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div>
            <h3 className="font-semibold">Loading your workspace</h3>
            <p className="text-sm text-muted-foreground">Please wait while we fetch your boards...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Welcome Hero Section */}
      <div className="relative mb-8 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 shadow-sm">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-black/10" />
        <div className="relative">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Welcome Back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! 👋
              </h1>
              <p className="text-muted-foreground max-w-[600px]">
                Your workspace is looking great. Here's what's happening with your projects today.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsCreateDialogOpen(true)} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                New Board
              </Button>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <Star className="mr-1 h-3.5 w-3.5 text-yellow-500" />
              {tasks.filter(t => t.status === 'done').length} tasks completed
            </div>
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <Clock className="mr-1 h-3.5 w-3.5 text-blue-500" />
              {tasks.filter(t => t.status !== 'done').length} unfinished tasks
            </div>
            {tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length > 0 && (
              <div className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-sm font-semibold text-red-500 dark:border-red-900/30 dark:bg-red-900/20">
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                {tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length} overdue tasks
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-primary/5 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Boards
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">{totalBoards}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
                {recentBoards} created this week
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">{totalTasks}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                  {completedTasks} completed
                </Badge>
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                  {remainingTasks} remaining
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 sm:col-span-2 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {boards.filter(b => b.task_count && b.task_count > 0).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <LayoutGrid className="h-3 w-3 mr-1" />
                    Active boards
                  </p>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {boards.filter(b => !b.task_count || b.task_count === 0).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <Clock4 className="h-3 w-3 mr-1" />
                    Empty boards
                  </p>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {completionRate}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Tasks completed
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section with Animation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs value={filterTimeframe} onValueChange={(v) => setFilterTimeframe(v as any)} className="hidden sm:block">
              <TabsList>
                <TabsTrigger value="all">All Time</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              className="h-9 w-9 relative group"
            >
              <Layout className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="sr-only">Toggle view</span>
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover px-2 py-1 text-xs rounded shadow opacity-0 transition-opacity group-hover:opacity-100">
                {view === 'grid' ? 'Switch to list' : 'Switch to grid'}
              </span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortBy(sortBy === 'recent' ? 'name' : 'recent')}
              className="h-9 w-9 relative group"
            >
              <SortAsc className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="sr-only">Sort boards</span>
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover px-2 py-1 text-xs rounded shadow opacity-0 transition-opacity group-hover:opacity-100">
                Sort by {sortBy === 'recent' ? 'name' : 'date'}
              </span>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Boards Grid with Enhanced Animation */}
      <div className={cn(
        "grid gap-4",
        view === 'grid' ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {filteredBoards.map((board, index) => (
          <motion.div
            key={board.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <Card className={cn(
              "group relative overflow-hidden transition-all duration-200 hover:shadow-lg",
              view === 'list' && "flex"
            )}>
              <div className={cn(
                "absolute inset-0 bg-gradient-to-b from-transparent to-black/5 opacity-0 transition-opacity group-hover:opacity-100",
                view === 'list' && "hidden"
              )} />
              <CardHeader className={cn(
                view === 'list' && "flex-1"
              )}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 group-hover:text-primary">
                    {board.name}
                    <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </CardTitle>
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
                    <DropdownMenuContent align="end" className="w-[160px]">
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
                  <span>{board.description || 'No description'}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className={cn(
                view === 'list' && "hidden"
              )}>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {isToday(new Date(board.created_at))
                    ? 'Created today'
                    : isYesterday(new Date(board.created_at))
                    ? 'Created yesterday'
                    : `Created ${format(new Date(board.created_at), 'MMM d, yyyy')}`}
                </div>
              </CardContent>
              <CardFooter className={cn(
                "flex justify-between text-sm text-muted-foreground",
                view === 'list' && "ml-auto"
              )}>
                <div className={cn(view === 'list' && "hidden")}>
                  Team: {board.team_name}
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>{board.task_count} tasks</span>
                </div>
              </CardFooter>
              <motion.div
                className="absolute inset-0 cursor-pointer rounded-lg transition-colors hover:bg-muted/50"
                onClick={() => navigate(`/board/${board.id}`)}
                style={{ zIndex: 10 }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            </Card>
          </motion.div>
        ))}

        {filteredBoards.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center"
          >
            <div className="rounded-full bg-primary/10 p-3">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">No boards found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Create your first board to get started!"}
              </p>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)} 
              variant="outline"
              className="group"
            >
              <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
              Create Board
            </Button>
          </motion.div>
        )}
      </div>

      {/* Existing dialogs */}
      <CreateBoardDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateSuccess={loadBoards}
      />

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