import { useEffect, useState, useRef } from 'react';
import { dbService } from '@/lib/db';
import type { Task } from '@/lib/types';
import { ArrowLeft, LayoutDashboard, Activity, Clock, CheckCircle2, AlertCircle, Timer, BarChart3, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

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
}

export function Monitor() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    total: 0,
    completed: 0,
    inProgress: 0,
    avgCompletionTime: 0,
    tasksByPriority: {},
    recentActivity: {
      created: 0,
      completed: 0,
      updated: 0,
    },
  });
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial system check
    addLog('info', 'Initializing system monitor...');
    checkSystem();
    loadMetrics();

    // Set up periodic checks
    const interval = setInterval(() => {
      checkSystem();
      loadMetrics();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto scroll to bottom of logs
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  async function checkSystem() {
    try {
      const tasks = await dbService.getTasks();
      addLog('success', 'Database connection successful', {
        taskCount: tasks.length,
      });
      analyzeTaskDistribution(tasks);
    } catch (error) {
      addLog('error', 'Database connection failed', { error });
    }
  }

  async function loadMetrics() {
    try {
      const tasks = await dbService.getTasks();
      const completed = tasks.filter(t => t.status === 'done').length;
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
      
      // Calculate average completion time for completed tasks
      const completedTasks = tasks.filter(t => t.status === 'done');
      const avgTime = completedTasks.reduce((acc, task) => {
        const created = new Date(task.created_at);
        const updated = new Date(task.updated_at);
        return acc + (updated.getTime() - created.getTime());
      }, 0) / (completedTasks.length || 1);

      // Calculate tasks by priority
      const tasksByPriority = tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate recent activity (last 24 hours)
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentActivity = {
        created: tasks.filter(t => new Date(t.created_at) > yesterday).length,
        completed: completedTasks.filter(t => new Date(t.updated_at) > yesterday).length,
        updated: tasks.filter(t => new Date(t.updated_at) > yesterday).length,
      };

      setMetrics({
        total: tasks.length,
        completed,
        inProgress,
        avgCompletionTime: avgTime / (1000 * 60 * 60), // Convert to hours
        tasksByPriority,
        recentActivity,
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  }

  function analyzeTaskDistribution(tasks: Task[]) {
    const distribution = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    addLog('info', 'Task distribution analysis', { distribution });
  }

  function addLog(type: LogEntry['type'], message: string, details?: any) {
    setLogs(prev => [
      {
        timestamp: new Date().toISOString(),
        type,
        message,
        details,
      },
      ...prev.slice(0, 99), // Keep last 100 logs
    ]);
  }

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-[1fr_350px] gap-4 bg-black p-4 font-mono text-sm text-green-400">
      {/* Main Content */}
      <div className="flex flex-col gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-green-900/20 hover:text-green-400"
              asChild
            >
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Board</span>
              </Link>
            </Button>
            <div className="h-4 w-px bg-green-900/50" />
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-green-600" />
              <span className="font-bold">System Monitor</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-green-600">
            <RefreshCcw className="h-3 w-3 animate-spin" />
            <span>Live Updates</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-4 shrink-0">
          <div className="rounded border border-green-900/50 bg-black/50 p-4">
            <div className="flex items-center gap-2 text-xs text-green-600">
              <BarChart3 className="h-4 w-4" />
              <span>Total Tasks</span>
            </div>
            <div className="mt-1 text-2xl">{metrics.total}</div>
          </div>
          <div className="rounded border border-green-900/50 bg-black/50 p-4">
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Completed</span>
            </div>
            <div className="mt-1 text-2xl">{metrics.completed}</div>
          </div>
          <div className="rounded border border-green-900/50 bg-black/50 p-4">
            <div className="flex items-center gap-2 text-xs text-green-600">
              <Activity className="h-4 w-4" />
              <span>In Progress</span>
            </div>
            <div className="mt-1 text-2xl">{metrics.inProgress}</div>
          </div>
          <div className="rounded border border-green-900/50 bg-black/50 p-4">
            <div className="flex items-center gap-2 text-xs text-green-600">
              <Timer className="h-4 w-4" />
              <span>Avg. Time (hours)</span>
            </div>
            <div className="mt-1 text-2xl">
              {metrics.avgCompletionTime.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded border border-green-900/50 bg-black/50 p-4 shrink-0">
          <h3 className="mb-3 font-bold">Last 24 Hours Activity</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-xs text-green-600">New Tasks</div>
              <div className="text-xl">{metrics.recentActivity.created}</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xs text-green-600">Completed</div>
              <div className="text-xl">{metrics.recentActivity.completed}</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xs text-green-600">Updates</div>
              <div className="text-xl">{metrics.recentActivity.updated}</div>
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="rounded border border-green-900/50 bg-black/50 p-4 shrink-0">
          <h3 className="mb-3 font-bold">Tasks by Priority</h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(metrics.tasksByPriority).map(([priority, count]) => (
              <div key={priority} className="flex flex-col gap-1">
                <div className="text-xs text-green-600">{priority}</div>
                <div className="text-xl">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="flex h-full flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <h3 className="font-bold">System Logs</h3>
          <Clock className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1 min-h-0 rounded border border-green-900/50 bg-black/50">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-green-900/50 scrollbar-track-transparent">
            <div className="space-y-2 p-4">
              {logs.map((log, i) => (
                <div key={i} className="font-mono text-xs break-words whitespace-pre-wrap">
                  <span className="text-green-600">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>{' '}
                  <span className={cn(
                    log.type === 'error' && 'text-red-400',
                    log.type === 'warning' && 'text-yellow-400',
                    log.type === 'success' && 'text-green-400',
                    log.type === 'info' && 'text-green-300'
                  )}>
                    {log.message}
                  </span>
                  {log.details && (
                    <pre className="mt-1 overflow-x-auto text-green-600 break-words whitespace-pre-wrap">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Command Input */}
        <div className="flex items-center gap-2 rounded border border-green-900/50 bg-black/50 p-2 shrink-0">
          <span className="text-green-600">$</span>
          <input
            type="text"
            className="flex-1 bg-transparent text-green-400 outline-none placeholder:text-green-900"
            placeholder="Type a command (coming soon...)"
          />
        </div>
      </div>
    </div>
  );
} 