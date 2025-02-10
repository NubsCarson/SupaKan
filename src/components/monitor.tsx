import { useEffect, useState } from 'react';
import { dbService } from '@/lib/db';
import type { Task, ChatMessage } from '@/lib/types';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Database as DatabaseIcon, Users, MessageSquare, CheckCircle, Clock, AlertTriangle, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SystemMetrics {
  total: number;
  completed: number;
  inProgress: number;
  avgCompletionTime: number;
  tasksByPriority: Record<string, number>;
  recentActivity: {
    created: number;
    completed: number;
    updated: number;
  };
  chatMetrics: {
    totalMessages: number;
    pinnedMessages: number;
    totalLikes: number;
    activeUsers: number;
  };
}

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export function Monitor() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  async function loadMetrics() {
    try {
      const [tasks, messages] = await Promise.all([
        dbService.getTasks(),
        dbService.getMessages(),
      ]);

      const now = Date.now();
      const completedTasks = tasks.filter(task => task.status === 'done');
      const inProgressTasks = tasks.filter(task => 
        ['in_progress', 'in_review'].includes(task.status)
      );

      // Calculate average completion time
      const avgTime = completedTasks.reduce((acc, task) => {
        const completionTime = new Date(task.updated_at).getTime() - new Date(task.created_at).getTime();
        return acc + completionTime;
      }, 0) / (completedTasks.length || 1);

      // Get tasks created in the last 24 hours
      const recentTasks = tasks.filter(
        task => now - new Date(task.created_at).getTime() < 24 * 60 * 60 * 1000
      );

      // Calculate task distribution by priority
      const tasksByPriority = tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get unique users from messages
      const uniqueUsers = new Set(messages.map(msg => msg.user_id));
      const pinnedMessages = messages.filter(msg => msg.is_pinned);
      const totalLikes = messages.reduce((acc, msg) => acc + msg.likes.length, 0);

      const newMetrics: SystemMetrics = {
        total: tasks.length,
        completed: completedTasks.length,
        inProgress: inProgressTasks.length,
        avgCompletionTime: avgTime,
        tasksByPriority,
        recentActivity: {
          created: recentTasks.length,
          completed: completedTasks.filter(
            task => now - new Date(task.updated_at).getTime() < 24 * 60 * 60 * 1000
          ).length,
          updated: tasks.filter(
            task => now - new Date(task.updated_at).getTime() < 24 * 60 * 60 * 1000
          ).length,
        },
        chatMetrics: {
          totalMessages: messages.length,
          pinnedMessages: pinnedMessages.length,
          totalLikes,
          activeUsers: uniqueUsers.size,
        },
      };

      setMetrics(newMetrics);
      addLog('success', 'Metrics updated successfully');
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      addLog('error', 'Failed to load metrics', error);
      setIsLoading(false);
    }
  }

  function addLog(type: LogEntry['type'], message: string, details?: any) {
    setLogs(prev => [{
      timestamp: new Date().toISOString(),
      type,
      message,
      details
    }, ...prev].slice(0, 100)); // Keep last 100 logs
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
          <span className="text-lg font-medium">Loading metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-muted"
            asChild
          >
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Board</span>
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-bold">Real-time Database Monitor</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadMetrics}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          Refresh Metrics
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid flex-1 gap-4 overflow-hidden md:grid-cols-2">
        {/* Left Column - Metrics */}
        <div className="space-y-4 overflow-auto">
          {/* Task Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DatabaseIcon className="h-5 w-5 text-primary" />
                Task Metrics
              </CardTitle>
              <CardDescription>Real-time task statistics and distribution</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{metrics?.total}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-500">{metrics?.completed}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-500">{metrics?.inProgress}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Priority Distribution</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(metrics?.tasksByPriority || {}).map(([priority, count]) => (
                    <div
                      key={priority}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <span className="text-sm capitalize">{priority}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Chat Metrics
              </CardTitle>
              <CardDescription>Real-time chat activity and engagement</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold">{metrics?.chatMetrics.totalMessages}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{metrics?.chatMetrics.activeUsers}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Pinned Messages</p>
                  <p className="text-2xl font-bold">{metrics?.chatMetrics.pinnedMessages}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                  <p className="text-2xl font-bold">{metrics?.chatMetrics.totalLikes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                Recent Activity (24h)
              </CardTitle>
              <CardDescription>Task activity in the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-2xl font-bold text-blue-500">
                  {metrics?.recentActivity.created}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-500">
                  {metrics?.recentActivity.completed}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {metrics?.recentActivity.updated}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - System Logs */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              System Logs
            </CardTitle>
            <CardDescription>Real-time database operations and events</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-2 p-4">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 rounded-lg border p-2 text-sm"
                  >
                    {log.type === 'success' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {log.type === 'error' && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    {log.type === 'warning' && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    {log.type === 'info' && (
                      <Activity className="h-4 w-4 text-blue-500" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{log.message}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {log.details && (
                        <pre className="mt-1 text-xs text-muted-foreground">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 