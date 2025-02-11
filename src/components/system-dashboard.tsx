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
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'messages' | 'analytics' | 'raw' | 'developer'>('overview');
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

  const exportData = async () => {
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

      const data = {
        tasks,
        messages,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kanban-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: 'Your data has been exported successfully.',
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

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">System Dashboard</h1>
        </div>
        <Button onClick={loadAllData} disabled={refreshing}>
          <RefreshCcw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Enhanced Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="overview" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Gauge className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ListTodo className="mr-2 h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="messages" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="analytics" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <LineChart className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="raw" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileJson className="mr-2 h-4 w-4" />
            Raw Data
          </TabsTrigger>
          <TabsTrigger value="developer" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Terminal className="mr-2 h-4 w-4" />
            Developer
          </TabsTrigger>
          <TabsTrigger value="settings" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Task Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.total || 0}</div>
                <Progress 
                  value={dbStats?.completionRate || 0} 
                  className="mt-2"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {dbStats?.completionRate.toFixed(1)}% completion rate
                </p>
              </CardContent>
            </Card>

            {/* Task Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Task Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xl font-bold text-green-500">{metrics?.completed || 0}</div>
                    <div className="text-xs text-muted-foreground">Done</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-yellow-500">{metrics?.inProgress || 0}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-500">{metrics?.pending || 0}</div>
                    <div className="text-xs text-muted-foreground">Todo</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.messageCount || 0}</div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Total messages in system
                </p>
              </CardContent>
            </Card>

            {/* Last Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium">
                  {metrics?.lastActivity 
                    ? format(new Date(metrics.lastActivity), 'MMM dd, HH:mm')
                    : 'No activity'}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Last task update
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Database and system performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Task Age</span>
                  <span className="text-sm font-medium">
                    {dbStats?.avgTaskAge.toFixed(1)} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Size</span>
                  <span className="text-sm font-medium">
                    {(dbStats?.taskCount || 0) + (dbStats?.messageCount || 0)} records
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Refresh</span>
                  <span className="text-sm font-medium">
                    {format(new Date(), 'HH:mm:ss')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Latest tasks in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {tasks.slice(0, 10).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">{task.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          Created {format(new Date(task.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <Badge variant={
                        task.status === 'done' ? 'default' :
                        task.status === 'in_progress' ? 'secondary' : 'outline'
                      }>
                        {task.status}
                      </Badge>
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
                  {messages.slice(0, 10).map((message) => (
                    <div
                      key={message.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs text-muted-foreground">
                          Sent {format(new Date(message.created_at), 'MMM dd, HH:mm')}
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
            <Card>
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
            <Card>
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
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>
                  Raw task data from the database
                </CardDescription>
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
                  <h4 className="mb-2 text-sm font-medium">Actions</h4>
                  <div className="grid gap-2">
                    <Button
                      variant="outline" 
                      className="w-full"
                      onClick={exportData}
                    >
                      <DatabaseIcon className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
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
                <label className="text-sm font-medium">Auto-refresh Interval</label>
                <select 
                  className="w-full rounded-md border p-2"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                >
                  <option value={15000}>15 seconds</option>
                  <option value={30000}>30 seconds</option>
                  <option value={60000}>1 minute</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage your dashboard data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={exportData}
              >
                <DatabaseIcon className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 