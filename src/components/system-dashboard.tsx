import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { Link } from 'react-router-dom';
import { 
  Activity, ArrowLeft, BarChart3, CheckCircle2, Clock, ListTodo, 
  MessageSquare, Users, AlertTriangle, Loader2, Database as DatabaseIcon, Table, 
  Shield, LayoutGrid, List, RefreshCcw, Eye, Code, Gauge, Server,
  Calendar, CheckCircle, XCircle, Clock4, Settings, LineChart,
  PieChart, Timer, Zap, Bell, Filter, Search, FileJson, Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Task = Database['public']['Tables']['tasks']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

interface SystemMetrics {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  messageCount: number;
  lastActivity: Date | null;
}

interface DBStats {
  taskCount: number;
  messageCount: number;
  completionRate: number;
  avgTaskAge: number;
}

interface PerformanceMetrics {
  avgCompletionTime: number;
  tasksByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  tasksByStatus: {
    [key: string]: number;
  };
}

export function SystemDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'messages' | 'analytics' | 'raw' | 'developer' | 'settings'>('overview');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [dbStats, setDbStats] = useState<DBStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    avgCompletionTime: 0,
    tasksByPriority: { high: 0, medium: 0, low: 0 },
    tasksByStatus: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(30000);

  const calculatePerformanceMetrics = (tasks: Task[]) => {
    const completedTasks = tasks.filter(t => t.status === 'done');
    const avgTime = completedTasks.length > 0
      ? completedTasks.reduce((acc, task) => {
          const completionTime = new Date(task.updated_at).getTime() - new Date(task.created_at).getTime();
          return acc + completionTime;
        }, 0) / completedTasks.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    const statusCount = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setPerformanceMetrics({
      avgCompletionTime: avgTime,
      tasksByPriority: {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      tasksByStatus: statusCount
    });
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'PPpp');
  };

  const formatSimpleDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'yyyy-MM-dd');
  };

  const exportData = async (format: 'json' | 'csv' | 'markdown' | 'html') => {
    try {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at');

      if (messagesError) throw messagesError;

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at');

      if (tasksError) throw tasksError;

      let exportContent: string;
      let mimeType: string;
      let fileExtension: string;

      const data = {
        tasks,
        messages,
        exportedAt: new Date().toISOString(),
        metadata: {
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'done').length,
          totalMessages: messages.length,
          exportFormat: format,
          version: '1.0.0'
        }
      };

      switch (format) {
        case 'json':
          exportContent = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;

        case 'csv':
          // Convert tasks to CSV
          const tasksCsv = [
            // CSV Headers
            ['ID', 'Title', 'Description', 'Status', 'Priority', 'Created At', 'Updated At', 'Due Date', 'Assigned To', 'Labels'].join(','),
            // CSV Data
            ...tasks.map(task => [
              task.id,
              `"${task.title.replace(/"/g, '""')}"`,
              `"${(task.description || '').replace(/"/g, '""')}"`,
              task.status,
              task.priority,
              task.created_at,
              task.updated_at,
              task.due_date || '',
              task.assigned_to || '',
              `"${task.labels?.join(';') || ''}"`,
            ].join(','))
          ].join('\n');

          exportContent = tasksCsv;
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;

        case 'markdown':
          exportContent = `# SupaKan Export - ${formatSimpleDate(new Date())}

## Summary
- Total Tasks: ${tasks.length}
- Completed Tasks: ${tasks.filter(t => t.status === 'done').length}
- Total Messages: ${messages.length}
- Export Date: ${formatDate(new Date())}

## Tasks

${tasks.map(task => `### ${task.title}
- Status: ${task.status}
- Priority: ${task.priority}
- Created: ${formatDate(task.created_at)}
${task.description ? `- Description: ${task.description}` : ''}
${task.due_date ? `- Due Date: ${formatDate(task.due_date)}` : ''}
${task.labels?.length ? `- Labels: ${task.labels.join(', ')}` : ''}
`).join('\n')}

## Messages

${messages.map(msg => `- ${formatDate(msg.created_at)}: ${msg.content}`).join('\n')}`;
          mimeType = 'text/markdown';
          fileExtension = 'md';
          break;

        case 'html':
          exportContent = `<!DOCTYPE html>
<html>
<head>
  <title>SupaKan Export - ${formatSimpleDate(new Date())}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { text-align: left; padding: 0.5rem; border: 1px solid #ddd; }
    th { background: #f4f4f4; }
    .task { margin-bottom: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 4px; }
    .message { padding: 0.5rem; border-bottom: 1px solid #eee; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0; }
    .stat { padding: 1rem; background: #f4f4f4; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>SupaKan Export - ${formatDate(new Date())}</h1>
  
  <div class="stats">
    <div class="stat">
      <h3>Total Tasks</h3>
      <p>${tasks.length}</p>
    </div>
    <div class="stat">
      <h3>Completed Tasks</h3>
      <p>${tasks.filter(t => t.status === 'done').length}</p>
    </div>
    <div class="stat">
      <h3>Total Messages</h3>
      <p>${messages.length}</p>
    </div>
  </div>

  <h2>Tasks</h2>
  <div class="tasks">
    ${tasks.map(task => `
      <div class="task">
        <h3>${task.title}</h3>
        <p><strong>Status:</strong> ${task.status}</p>
        <p><strong>Priority:</strong> ${task.priority}</p>
        <p><strong>Created:</strong> ${formatDate(task.created_at)}</p>
        ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
        ${task.due_date ? `<p><strong>Due Date:</strong> ${formatDate(task.due_date)}</p>` : ''}
        ${task.labels?.length ? `<p><strong>Labels:</strong> ${task.labels.join(', ')}</p>` : ''}
      </div>
    `).join('')}
  </div>

  <h2>Messages</h2>
  <div class="messages">
    ${messages.map(msg => `
      <div class="message">
        <strong>${formatDate(msg.created_at)}:</strong> ${msg.content}
      </div>
    `).join('')}
  </div>
</body>
</html>`;
          mimeType = 'text/html';
          fileExtension = 'html';
          break;

        default:
          throw new Error('Unsupported export format');
      }

      const blob = new Blob([exportContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kanban-export-${formatSimpleDate(new Date())}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: `Your data has been exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Failed to export data:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = (format: 'json' | 'csv' | 'markdown' | 'html') => (e: React.MouseEvent) => {
    e.preventDefault();
    exportData(format);
  };

  async function loadAllData() {
    try {
      setRefreshing(true);
      const [{ data: fetchedTasks, error: tasksError }, { data: fetchedMessages, error: messagesError }] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at'),
        supabase.from('messages').select('*').order('created_at'),
      ]);

      if (tasksError) throw tasksError;
      if (messagesError) throw messagesError;
      if (!fetchedTasks || !fetchedMessages) throw new Error('Failed to fetch data');

      setTasks(fetchedTasks);
      setMessages(fetchedMessages);

      // Calculate metrics
      const newMetrics: SystemMetrics = {
        total: fetchedTasks.length,
        completed: fetchedTasks.filter(t => t.status === 'done').length,
        inProgress: fetchedTasks.filter(t => t.status === 'in_progress').length,
        pending: fetchedTasks.filter(t => t.status === 'todo').length,
        messageCount: fetchedMessages.length,
        lastActivity: fetchedTasks.length > 0 
          ? new Date(Math.max(...fetchedTasks.map(t => new Date(t.updated_at).getTime())))
          : null
      };
      setMetrics(newMetrics);

      // Calculate DB stats
      const totalTasks = fetchedTasks.length;
      const completedTasks = fetchedTasks.filter(t => t.status === 'done').length;
      const avgAge = totalTasks > 0
        ? fetchedTasks.reduce((acc, task) => {
            const age = new Date().getTime() - new Date(task.created_at).getTime();
            return acc + age;
          }, 0) / totalTasks
        : 0;

      setDbStats({
        taskCount: totalTasks,
        messageCount: fetchedMessages.length,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        avgTaskAge: avgAge / (1000 * 60 * 60 * 24) // Convert to days
      });

      // Calculate performance metrics
      calculatePerformanceMetrics(fetchedTasks);

      setIsLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try refreshing the page.',
        variant: 'destructive',
      });
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  const sortMessages = (messages: Message[]) => {
    return [...messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  };

  useEffect(() => {
    loadAllData();

    // Subscribe to changes
    const tasksChannel = supabase
      .channel('tasks')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks' 
        }, 
        () => {
          loadAllData();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages' 
        }, 
        () => {
          loadAllData();
        }
      )
      .subscribe();

    const interval = setInterval(loadAllData, refreshInterval);

    return () => {
      clearInterval(interval);
      tasksChannel.unsubscribe();
      messagesChannel.unsubscribe();
    };
  }, [refreshInterval]);

  useEffect(() => {
    if (tasks.length > 0) {
      calculatePerformanceMetrics(tasks);
    }
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
          <span className="text-lg font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Hero Section */}
      <div className="relative mb-8 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-black/10" />
        <div className="relative">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight sm:text-4xl">
                <Gauge className="h-8 w-8 text-primary" />
                Dashboard
              </h1>
              <p className="text-muted-foreground max-w-[600px]">
                Monitor your system performance and task management metrics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => loadAllData()} variant="outline" className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Refresh Data
              </Button>
              <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Auto-refresh interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5000">Every 5 seconds</SelectItem>
                  <SelectItem value="10000">Every 10 seconds</SelectItem>
                  <SelectItem value="30000">Every 30 seconds</SelectItem>
                  <SelectItem value="60000">Every minute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Badge variant="outline" className="bg-primary/10 inline-flex items-center">
              <span className="truncate">{metrics?.total || 0} Total Tasks</span>
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 inline-flex items-center">
              <span className="truncate">{metrics?.completed || 0} Completed</span>
            </Badge>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 inline-flex items-center">
              <span className="truncate">{metrics?.inProgress || 0} In Progress</span>
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 inline-flex items-center">
              <span className="truncate">{metrics?.messageCount || 0} Messages</span>
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="overview" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Gauge className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ListTodo className="mr-2 h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="messages" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="analytics" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <LineChart className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="raw" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileJson className="mr-2 h-4 w-4" />
            Raw Data
          </TabsTrigger>
          <TabsTrigger value="developer" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Terminal className="mr-2 h-4 w-4" />
            Developer
          </TabsTrigger>
          <TabsTrigger value="settings" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Task Stats */}
            <Card className="bg-primary/5 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <ListTodo className="absolute right-4 top-4 h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{metrics?.total || 0}</div>
                <Progress 
                  value={dbStats?.completionRate || 0} 
                  className="mt-2"
                />
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                    {metrics?.completed || 0} completed
                  </Badge>
                  <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                    {metrics?.pending || 0} remaining
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Activity Stats */}
            <Card className="bg-primary/5 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Activity</CardTitle>
                <Activity className="absolute right-4 top-4 h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">
                  {dbStats?.completionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Overall Completion Rate
                </p>
                <Progress 
                  value={dbStats?.completionRate || 0} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* Task Distribution */}
            <Card className="bg-primary/5 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Task Distribution</CardTitle>
                <PieChart className="absolute right-4 top-4 h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">
                      {tasks.filter(t => t.priority === 'high').length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      High Priority
                    </p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {tasks.filter(t => t.assigned_to).length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Assigned Tasks
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messages Stats */}
            <Card className="bg-primary/5 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="absolute right-4 top-4 h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{messages.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Messages
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                    {messages.filter(m => new Date(m.created_at) > subDays(new Date(), 7)).length} this week
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats Card */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
              <CardDescription>Comprehensive view of system metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <ListTodo className="h-4 w-4" />
                    Task Status
                  </h4>
                  <div className="grid gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Backlog</span>
                      <span>{tasks.filter(t => t.status === 'backlog').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">In Progress</span>
                      <span>{tasks.filter(t => t.status === 'in_progress').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">In Review</span>
                      <span>{tasks.filter(t => t.status === 'in_review').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completed</span>
                      <span>{tasks.filter(t => t.status === 'done').length}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Priority Distribution
                  </h4>
                  <div className="grid gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">High Priority</span>
                      <span>{tasks.filter(t => t.priority === 'high').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Medium Priority</span>
                      <span>{tasks.filter(t => t.priority === 'medium').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Low Priority</span>
                      <span>{tasks.filter(t => t.priority === 'low').length}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Task Assignment
                  </h4>
                  <div className="grid gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Assigned Tasks</span>
                      <span>{tasks.filter(t => t.assigned_to).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Unassigned Tasks</span>
                      <span>{tasks.filter(t => !t.assigned_to).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Due Tasks</span>
                      <span>{tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Tasks</CardTitle>
                  <CardDescription>Latest tasks in the system</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-[200px]"
                  />
                  <Select value={filterStatus || 'all'} onValueChange={(value) => setFilterStatus(value === 'all' ? null : value)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="todo">Todo</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {tasks
                    .filter(task => 
                      task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                      (!filterStatus || task.status === filterStatus)
                    )
                    .slice(0, 10)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">{task.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            Created {format(new Date(task.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.priority === 'high' && (
                            <Badge variant="secondary" className="bg-red-500/10 text-red-500">
                              High Priority
                            </Badge>
                          )}
                          <Badge variant={
                            task.status === 'done' ? 'default' :
                            task.status === 'in_progress' ? 'secondary' : 'outline'
                          }>
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Latest messages in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {sortMessages(messages).slice(0, 10).map((message) => (
                    <div
                      key={message.id}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">{message.content}</h4>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Task Completion Rate</CardTitle>
                <CardDescription>
                  Percentage of tasks completed over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {/* Add chart here */}
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="mx-auto h-12 w-12 opacity-50" />
                      <p className="mt-2">Chart coming soon</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Task Distribution</CardTitle>
                <CardDescription>
                  Distribution of tasks by status and priority
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">By Status</h4>
                    <div className="grid gap-2">
                      {Object.entries(performanceMetrics.tasksByStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center gap-2">
                          <div className="w-48">
                            <div className="text-sm">{status}</div>
                            <Progress value={(count / tasks.length) * 100} />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {count} tasks ({Math.round((count / tasks.length) * 100)}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium">By Priority</h4>
                    <div className="grid gap-2">
                      {Object.entries(performanceMetrics.tasksByPriority).map(([priority, count]) => (
                        <div key={priority} className="flex items-center gap-2">
                          <div className="w-48">
                            <div className="text-sm">{priority}</div>
                            <Progress value={(count / tasks.length) * 100} />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {count} tasks ({Math.round((count / tasks.length) * 100)}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Raw Data Tab */}
        <TabsContent value="raw" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>
                    Raw task data from the database
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleExport('json')}
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                >
                  <FileJson className="h-4 w-4" />
                  Export Data
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <pre className="text-xs">
                    {JSON.stringify(tasks, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>
                  Raw message data from the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <pre className="text-xs">
                    {JSON.stringify(messages, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Developer Tab */}
        <TabsContent value="developer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                Technical details about the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium">Database Statistics</h4>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Tasks</span>
                      <span className="font-mono text-sm">{dbStats?.taskCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Messages</span>
                      <span className="font-mono text-sm">{dbStats?.messageCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Completion Rate</span>
                      <span className="font-mono text-sm">
                        {dbStats?.completionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Task Age</span>
                      <span className="font-mono text-sm">
                        {dbStats?.avgTaskAge.toFixed(1)} days
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium">Export Options</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline" 
                      className="w-full"
                      onClick={handleExport('json')}
                    >
                      <FileJson className="mr-2 h-4 w-4" />
                      Export as JSON
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleExport('csv')}
                    >
                      <Table className="mr-2 h-4 w-4" />
                      Export as CSV
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleExport('markdown')}
                    >
                      <Code className="mr-2 h-4 w-4" />
                      Export as Markdown
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleExport('html')}
                    >
                      <Code className="mr-2 h-4 w-4" />
                      Export as HTML
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium">System Actions</h4>
                  <div className="grid gap-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setRefreshInterval(prev => prev === 5000 ? 30000 : 5000)}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      {refreshInterval === 5000 ? 'Slow Refresh (30s)' : 'Fast Refresh (5s)'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Settings</CardTitle>
              <CardDescription>Customize your dashboard experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Auto-refresh Interval</Label>
                <Select
                  value={refreshInterval.toString()}
                  onValueChange={(value) => setRefreshInterval(Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select refresh interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5000">Every 5 seconds</SelectItem>
                    <SelectItem value="15000">Every 15 seconds</SelectItem>
                    <SelectItem value="30000">Every 30 seconds</SelectItem>
                    <SelectItem value="60000">Every minute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 