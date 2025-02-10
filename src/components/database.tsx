import { useEffect, useState } from 'react';
import { dbService } from '@/lib/db';
import type { Task, ChatMessage } from '@/lib/types';
import { 
  ArrowLeft, Database as DatabaseIcon, Table, KeyRound, Calendar, 
  Clock, Tag, User2, FileText, AlertTriangle, MessageSquare, Search, 
  Filter, LayoutGrid, List, RefreshCcw, ChevronDown, Eye, Code, 
  BarChart2, Activity, Layers, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TableSchema {
  name: string;
  description: string;
  fields: {
    name: string;
    type: string;
    required: boolean;
    description: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [showJSON, setShowJSON] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced schema definitions
  const schemas: TableSchema[] = [
    {
      name: 'tasks',
      description: 'Core task management data including status, priority, and assignments',
      fields: [
        { name: 'id', type: 'string (UUID)', required: true, description: 'Unique identifier for the task' },
        { name: 'title', type: 'string', required: true, description: 'Task title' },
        { name: 'description', type: 'string | null', required: false, description: 'Rich text description with formatting and mentions' },
        { name: 'status', type: 'enum', required: true, description: 'Task workflow status (backlog → done)' },
        { name: 'priority', type: 'enum', required: true, description: 'Task importance level' },
        { name: 'ticket_id', type: 'string', required: true, description: 'Human-readable reference ID' },
        { name: 'created_by', type: 'string', required: true, description: 'Task creator reference' },
        { name: 'assigned_to', type: 'string | null', required: false, description: 'Assigned team member' },
        { name: 'created_at', type: 'timestamp', required: true, description: 'Creation timestamp' },
        { name: 'updated_at', type: 'timestamp', required: true, description: 'Last modification time' },
        { name: 'due_date', type: 'timestamp', required: false, description: 'Task deadline' },
        { name: 'estimated_hours', type: 'number', required: false, description: 'Time estimate' },
        { name: 'labels', type: 'string[]', required: true, description: 'Categorization tags' },
      ],
    },
    {
      name: 'messages',
      description: 'Real-time chat system with rich features like mentions, reactions, and threading',
      fields: [
        { name: 'id', type: 'string (UUID)', required: true, description: 'Message identifier' },
        { name: 'content', type: 'string', required: true, description: 'Message text content' },
        { name: 'user_id', type: 'string', required: true, description: 'Sender reference' },
        { name: 'timestamp', type: 'timestamp', required: true, description: 'Send time' },
        { name: 'likes', type: 'string[]', required: true, description: 'User reactions' },
        { name: 'is_pinned', type: 'boolean', required: true, description: 'Pinned status' },
        { name: 'reply_to', type: 'string | null', required: false, description: 'Parent message' },
        { name: 'task_id', type: 'string | null', required: false, description: 'Related task' },
        { name: 'mentions', type: 'string[]', required: false, description: '@mentioned users' },
        { name: 'edited_at', type: 'timestamp', required: false, description: 'Last edit time' },
      ],
    },
    {
      name: 'users',
      description: 'User accounts and authentication data',
      fields: [
        { name: 'id', type: 'string (UUID)', required: true, description: 'User identifier' },
        { name: 'username', type: 'string', required: true, description: 'Display name' },
        { name: 'email', type: 'string', required: true, description: 'Email address' },
        { name: 'created_at', type: 'timestamp', required: true, description: 'Account creation' },
        { name: 'updated_at', type: 'timestamp', required: true, description: 'Profile updates' },
        { name: 'last_seen', type: 'timestamp', required: false, description: 'Activity tracking' },
        { name: 'preferences', type: 'json', required: false, description: 'User settings' },
      ],
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }

  const filteredSchemas = schemas.filter(schema =>
    schema.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schema.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schema.fields.some(field => 
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
          <span className="text-lg font-medium">Loading database...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-4 p-4">
      {/* Enhanced Header */}
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
            <DatabaseIcon className="h-4 w-4 text-primary" />
            <span className="font-bold">Database Explorer</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
            <Activity className="h-4 w-4 text-primary" />
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{stats.totalRecords}</span>
              <span className="text-muted-foreground">records</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-medium">{stats.storageUsed}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <LayoutGrid className="h-4 w-4" />
            ) : (
              <List className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tables, fields, and explore data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Database Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords}</div>
            <p className="text-xs text-muted-foreground">
              Across {schemas.length} tables
            </p>
            <Progress 
              value={70} 
              className="mt-3"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.storageUsed}</div>
            <p className="text-xs text-muted-foreground">
              Last updated {new Date(stats.lastUpdated).toLocaleString()}
            </p>
            <Progress 
              value={40} 
              className="mt-3"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Indices</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.indices.length}</div>
            <div className="mt-3 flex flex-wrap gap-1">
              {stats.indices.map(index => (
                <Badge 
                  key={index}
                  variant="secondary" 
                  className="text-xs"
                >
                  {index}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="schema" className="flex-1">
        <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="schema" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
            <Table className="mr-2 h-4 w-4" />
            Schema Browser
          </TabsTrigger>
          <TabsTrigger value="data" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
            <Eye className="mr-2 h-4 w-4" />
            Data Explorer
          </TabsTrigger>
          <TabsTrigger value="raw" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
            <Code className="mr-2 h-4 w-4" />
            Raw View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schema" className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-25rem)]">
            <div className={cn(
              "grid gap-4",
              viewMode === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'
            )}>
              {filteredSchemas.map(schema => (
                <Card key={schema.name} className="relative overflow-hidden">
                  <div className="absolute right-2 top-2 flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {schema.fields.length} fields
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Table className="h-5 w-5 text-primary" />
                      {schema.name}
                    </CardTitle>
                    <CardDescription>{schema.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {schema.fields.map((field) => (
                      <div
                        key={field.name}
                        className="flex flex-col gap-1 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {field.name === 'id' && <KeyRound className="h-4 w-4 text-yellow-500" />}
                            {field.name.includes('date') && <Calendar className="h-4 w-4 text-blue-500" />}
                            {field.name.includes('time') && <Clock className="h-4 w-4 text-purple-500" />}
                            {field.name === 'labels' && <Tag className="h-4 w-4 text-pink-500" />}
                            {(field.name.includes('user') || field.name.includes('by')) && <User2 className="h-4 w-4 text-orange-500" />}
                            {(field.name === 'description' || field.name === 'content') && <FileText className="h-4 w-4 text-green-500" />}
                            <span className="font-medium">{field.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {field.type}
                            </Badge>
                            {!field.required && (
                              <Badge variant="secondary" className="gap-1 border-yellow-500/20 bg-yellow-500/10 text-yellow-500">
                                <AlertTriangle className="h-3 w-3" />
                                Optional
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{field.description}</p>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="justify-between border-t bg-muted/50 px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Indexed on primary key</span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      View Data
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="data" className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-25rem)]">
            <div className="space-y-4">
              {/* Tasks Sample */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Table className="h-5 w-5 text-primary" />
                      Tasks
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {tasks.length} records
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => setShowJSON(!showJSON)}>
                        {showJSON ? 'Table View' : 'JSON View'}
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Recent task records with their current status and metadata
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                      >
                        {showJSON ? (
                          <pre className="overflow-auto text-xs">
                            {JSON.stringify(task, null, 2)}
                          </pre>
                        ) : (
                          <>
                            <div className="mb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                  {task.ticket_id}
                                </Badge>
                                <span className="font-medium">{task.title}</span>
                              </div>
                              <Badge 
                                variant="secondary"
                                className={cn(
                                  task.priority === 'high' && 'border-red-500/20 bg-red-500/10 text-red-500',
                                  task.priority === 'medium' && 'border-yellow-500/20 bg-yellow-500/10 text-yellow-500',
                                  task.priority === 'low' && 'border-green-500/20 bg-green-500/10 text-green-500'
                                )}
                              >
                                {task.priority}
                              </Badge>
                            </div>
                            <div className="grid gap-4 text-sm md:grid-cols-2">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Status</span>
                                  <Badge variant="outline">
                                    {task.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Created</span>
                                  <span className="font-medium">
                                    {new Date(task.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Assigned</span>
                                  <span className="font-medium">
                                    {task.assigned_to || 'Unassigned'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Labels</span>
                                  <div className="flex gap-1">
                                    {task.labels.map((label) => (
                                      <Badge
                                        key={label}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {label}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Messages Sample */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Messages
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {messages.length} records
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => setShowJSON(!showJSON)}>
                        {showJSON ? 'Table View' : 'JSON View'}
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Recent chat messages with their metadata and reactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {messages.slice(0, 5).map((message) => (
                      <div
                        key={message.id}
                        className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                      >
                        {showJSON ? (
                          <pre className="overflow-auto text-xs">
                            {JSON.stringify(message, null, 2)}
                          </pre>
                        ) : (
                          <>
                            <div className="mb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{message.user_id}</span>
                                {message.is_pinned && (
                                  <Badge variant="secondary" className="gap-1">
                                    <Tag className="h-3 w-3" />
                                    Pinned
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(message.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="mb-2 text-sm">{message.content}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <span>Likes:</span>
                                <Badge variant="secondary">
                                  {message.likes.length}
                                </Badge>
                              </div>
                              {message.mentions && message.mentions.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <span>Mentions:</span>
                                  <Badge variant="secondary">
                                    {message.mentions.length}
                                  </Badge>
                                </div>
                              )}
                              {message.reply_to && (
                                <div className="flex items-center gap-1">
                                  <span>Reply to:</span>
                                  <Badge variant="outline" className="font-mono">
                                    {message.reply_to.slice(0, 8)}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="raw" className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-25rem)]">
            <Card>
              <CardHeader>
                <CardTitle>Raw Database View</CardTitle>
                <CardDescription>
                  View and explore the raw JSON data structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded-lg bg-muted p-4 text-xs">
                  {JSON.stringify(
                    {
                      tasks: tasks.slice(0, 3),
                      messages: messages.slice(0, 3),
                      stats,
                    },
                    null,
                    2
                  )}
                </pre>
              </CardContent>
            </Card>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
} 