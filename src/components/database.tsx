import { useEffect, useState } from 'react';
import { dbService } from '@/lib/db';
import type { Task, ChatMessage } from '@/lib/types';
import { ArrowLeft, Database as DatabaseIcon, Table, KeyRound, Calendar, Clock, Tag, User, FileText, AlertTriangle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface TableSchema {
  name: string;
  fields: {
    name: string;
    type: string;
    required: boolean;
  }[];
}

interface DBStats {
  totalRecords: number;
  lastUpdated: string;
  storageUsed: string;
  indices: string[];
}

export function Database() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<DBStats>({
    totalRecords: 0,
    lastUpdated: '',
    storageUsed: '0 KB',
    indices: ['status', 'created_at', 'user_id', 'timestamp'],
  });

  // Schema definitions for visualization
  const schemas: TableSchema[] = [
    {
      name: 'tasks',
      fields: [
        { name: 'id', type: 'string (UUID)', required: true },
        { name: 'title', type: 'string', required: true },
        { name: 'description', type: 'string | null', required: false },
        { name: 'status', type: 'enum', required: true },
        { name: 'priority', type: 'enum', required: true },
        { name: 'ticket_id', type: 'string', required: true },
        { name: 'created_by', type: 'string', required: true },
        { name: 'assigned_to', type: 'string | null', required: false },
        { name: 'created_at', type: 'timestamp', required: true },
        { name: 'updated_at', type: 'timestamp', required: true },
        { name: 'due_date', type: 'timestamp', required: false },
        { name: 'estimated_hours', type: 'number', required: false },
        { name: 'labels', type: 'string[]', required: true },
      ],
    },
    {
      name: 'messages',
      fields: [
        { name: 'id', type: 'string (UUID)', required: true },
        { name: 'content', type: 'string', required: true },
        { name: 'user_id', type: 'string', required: true },
        { name: 'timestamp', type: 'timestamp', required: true },
        { name: 'likes', type: 'string[]', required: true },
        { name: 'is_pinned', type: 'boolean', required: true },
        { name: 'reply_to', type: 'string | null', required: false },
        { name: 'task_id', type: 'string | null', required: false },
        { name: 'mentions', type: 'string[]', required: false },
      ],
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [tasks, messages] = await Promise.all([
        dbService.getTasks(),
        dbService.getMessages(),
      ]);
      
      setTasks(tasks);
      setMessages(messages);
      
      // Calculate stats
      const lastTaskUpdate = tasks.reduce((latest, task) => {
        const updated = new Date(task.updated_at);
        return updated > latest ? updated : latest;
      }, new Date(0));

      const lastMessageUpdate = messages.reduce((latest, msg) => {
        const timestamp = new Date(msg.timestamp);
        return timestamp > latest ? timestamp : latest;
      }, new Date(0));

      const lastUpdated = new Date(Math.max(
        lastTaskUpdate.getTime(),
        lastMessageUpdate.getTime()
      ));

      // Estimate storage (rough calculation)
      const storageBytes = JSON.stringify(tasks).length + JSON.stringify(messages).length;
      const storageMB = (storageBytes / (1024 * 1024)).toFixed(2);

      setStats({
        totalRecords: tasks.length + messages.length,
        lastUpdated: lastUpdated.toISOString(),
        storageUsed: `${storageMB} MB`,
        indices: ['status', 'created_at', 'user_id', 'timestamp'],
      });
    } catch (error) {
      console.error('Failed to load database data:', error);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-4 bg-black p-4 font-mono text-sm text-green-400 overflow-hidden">
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
            <DatabaseIcon className="h-4 w-4 text-green-600" />
            <span className="font-bold">Database Explorer</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-[2fr_1fr] gap-4 min-h-0 flex-1 overflow-hidden">
        {/* Left Column */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2">
          {/* Schema Visualization */}
          {schemas.map(schema => (
            <div key={schema.name} className="rounded border border-green-900/50 bg-black/50 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Table className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-bold">Schema: {schema.name}</h2>
              </div>
              <div className="space-y-2">
                {schema.fields.map((field) => (
                  <div
                    key={field.name}
                    className="flex items-center gap-4 p-2 rounded border border-green-900/20 hover:border-green-900/40 transition-colors"
                  >
                    <div className="w-32 flex items-center gap-2">
                      {field.name === 'id' && <KeyRound className="h-4 w-4 text-yellow-500" />}
                      {field.name.includes('date') && <Calendar className="h-4 w-4 text-blue-400" />}
                      {field.name.includes('time') && <Clock className="h-4 w-4 text-purple-400" />}
                      {field.name === 'labels' && <Tag className="h-4 w-4 text-pink-400" />}
                      {(field.name.includes('user') || field.name.includes('by')) && <User className="h-4 w-4 text-orange-400" />}
                      {field.name === 'description' || field.name === 'content' && <FileText className="h-4 w-4 text-green-400" />}
                      <span className="font-semibold">{field.name}</span>
                    </div>
                    <div className="text-green-600/80 flex-1">{field.type}</div>
                    {!field.required && (
                      <div className="flex items-center gap-1 text-yellow-500/80">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Optional</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Sample Data */}
          <div className="rounded border border-green-900/50 bg-black/50 p-4">
            <h2 className="text-lg font-bold mb-4">Sample Records</h2>
            
            {/* Tasks */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2 text-green-600">Tasks</h3>
              <div className="space-y-2">
                {tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded border border-green-900/20 hover:border-green-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/20 text-green-400">
                        {task.ticket_id}
                      </span>
                      <span className="font-semibold">{task.title}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-green-600/80">
                      <div className="space-y-1">
                        <div>Status: <span className="text-green-400">{task.status}</span></div>
                        <div>Priority: <span className="text-green-400">{task.priority}</span></div>
                        <div>Created: <span className="text-green-400">{new Date(task.created_at).toLocaleString()}</span></div>
                      </div>
                      <div className="space-y-1">
                        <div>Assigned: <span className="text-green-400">{task.assigned_to || 'Unassigned'}</span></div>
                        <div>Due: <span className="text-green-400">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}</span></div>
                        <div>Labels: <span className="text-green-400">{task.labels.join(', ') || 'None'}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-green-600">Messages</h3>
              <div className="space-y-2">
                {messages.slice(0, 3).map((message) => (
                  <div
                    key={message.id}
                    className="p-3 rounded border border-green-900/20 hover:border-green-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">Message ID: {message.id.slice(0, 8)}</span>
                      {message.is_pinned && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/20 text-green-400">
                          Pinned
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-green-600/80">
                      <div className="space-y-1">
                        <div>User ID: <span className="text-green-400">{message.user_id}</span></div>
                        <div>Timestamp: <span className="text-green-400">{new Date(message.timestamp).toLocaleString()}</span></div>
                        <div>Likes: <span className="text-green-400">{message.likes.length}</span></div>
                      </div>
                      <div className="space-y-1">
                        <div>Content: <span className="text-green-400">{message.content.slice(0, 30)}...</span></div>
                        {message.mentions && message.mentions.length > 0 && (
                          <div>Mentions: <span className="text-green-400">{message.mentions.join(', ')}</span></div>
                        )}
                        {message.reply_to && (
                          <div>Reply to: <span className="text-green-400">{message.reply_to}</span></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 overflow-y-auto pr-2">
          {/* Database Stats */}
          <div className="rounded border border-green-900/50 bg-black/50 p-4">
            <h2 className="text-lg font-bold mb-4">Database Stats</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-green-600">Total Records</div>
                <div className="text-2xl">{stats.totalRecords}</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-green-600">Last Updated</div>
                <div>{new Date(stats.lastUpdated).toLocaleString()}</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-green-600">Storage Used</div>
                <div>{stats.storageUsed}</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-green-600">Indices</div>
                <div className="flex flex-wrap gap-2">
                  {stats.indices.map((index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded-full bg-green-900/20 text-green-400 text-xs"
                    >
                      {index}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="rounded border border-green-900/50 bg-black/50 p-4">
            <h2 className="text-lg font-bold mb-4">Query Performance</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded bg-green-900/10">
                <span>Read Operations</span>
                <span className="text-green-400">~2ms</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-green-900/10">
                <span>Write Operations</span>
                <span className="text-green-400">~5ms</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-green-900/10">
                <span>Index Lookups</span>
                <span className="text-green-400">~1ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 