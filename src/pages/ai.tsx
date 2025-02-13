import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Bot, Send, Key, Loader2, Settings2, Sparkles, Github, Twitter, RefreshCcw, Trash2, Info, Copy, Wand2, Brain, Zap, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import type { Database } from '@/lib/database.types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
};

type Task = Database['public']['Tables']['tasks']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];
type Board = Database['public']['Tables']['boards']['Row'];
type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
  user_email: string;
};

const EXAMPLE_PROMPTS = [
  "Task completion rate?",
  "Show me my high priority tasks",
  "Summarize my team's tasks",
  "What tasks are overdue?",
  "Who is on my team?",
  "What teams do I belong to?",
];

const SYSTEM_PROMPT = `You are SupaKan AI, an advanced, data-driven and friendly assistant for managing tasks, boards, and teams in the SupaKan platform. You have real-time access to data from the database and always strive to be both helpful and approachable.

Instructions:
1. Use ONLY the data provided in the context to answer queries accurately. Do not generate or assume any data that is not present.
2. When a query pertains to a specific board, team, or task, filter the data by matching the provided identifiers.
3. Provide precise, data-driven responses including counts and detailed lists when requested.
4. For team-related queries, always use the userTeams and userTeamMembers data provided in the context.
5. Never ask for the user's email if it's already provided in the context.
6. If the information is not available or the query is ambiguous, explain what data is missing.
7. Format responses cleanly:
   - Don't show HTML tags in task descriptions
   - Use bullet points (•) instead of numbers for lists
   - Bold important information like task titles and dates
   - Don't show raw HTML or markdown in responses
   - Keep responses concise but informative

Remember: This assistant was created by nubs. The creator's Twitter is https://x.com/monerosolana and GitHub is github.com/nubscarson. Always use a friendly and warm tone in your responses.

Be professional, friendly, and helpful.`;

const stripHtml = (html: string) => {
  if (!html) return '';
  
  // First pass: remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Second pass: remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Third pass: remove all remaining HTML tags
  sanitized = sanitized.replace(/<[^>]+>/g, '');
  
  // Fourth pass: remove potentially dangerous HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Finally, normalize whitespace
  return sanitized.trim().replace(/\s+/g, ' ');
};

const formatDate = (date: string | null) => {
  if (!date) return 'No due date';
  return format(new Date(date), 'MMM d, yyyy');
};

const AI_MODELS = [
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
  { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
  { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', description: 'Latest GPT-4 with better performance' },
] as const;

export default function AIPage() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-3.5-turbo');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [userTeamMembers, setUserTeamMembers] = useState<TeamMember[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    const savedModel = localStorage.getItem('ai_model') || 'gpt-3.5-turbo';
    setSelectedModel(savedModel);
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    loadData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadData = async () => {
    try {
      const [tasksResponse, teamsResponse, boardsResponse] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('teams').select('*'),
        supabase.from('boards').select('*')
      ]);

      if (tasksResponse.error) throw tasksResponse.error;
      if (teamsResponse.error) throw teamsResponse.error;
      if (boardsResponse.error) throw boardsResponse.error;

      setTasks(tasksResponse.data || []);
      setTeams(teamsResponse.data || []);
      setBoards(boardsResponse.data || []);

      if (user) {
        const teamMembersByUserResponse = await supabase
          .from('team_members')
          .select('*')
          .eq('user_id', user.id);
        if (teamMembersByUserResponse.error) throw teamMembersByUserResponse.error;
        const userTeamIds = teamMembersByUserResponse.data?.map((tm: { team_id: string }) => tm.team_id) || [];
        const filteredUserTeams = (teamsResponse.data || []).filter((team: { id: string }) => userTeamIds.includes(team.id));
        setUserTeams(filteredUserTeams);

        const teamMembersWithUsersResponse = await supabase
          .from('team_members_with_users')
          .select('*')
          .in('team_id', userTeamIds);
        if (teamMembersWithUsersResponse.error) throw teamMembersWithUsersResponse.error;
        setUserTeamMembers(teamMembersWithUsersResponse.data ?? []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your data',
        variant: 'destructive',
      });
    }
  };

  const handleSaveApiKey = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('openai_api_key', newApiKey);
    setShowSettings(false);
    toast({
      title: 'Success',
      description: 'API key saved successfully',
    });
  };

  const handleClearChat = () => {
    setMessages([]);
    toast({
      title: 'Chat Cleared',
      description: 'All messages have been cleared',
    });
  };

  const handleRefreshData = async () => {
    await loadData();
    toast({
      title: 'Data Refreshed',
      description: 'Latest task, team, and board data loaded',
    });
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      description: 'Message copied to clipboard',
    });
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('ai_model', model);
    toast({
      title: 'Model Updated',
      description: `Switched to ${AI_MODELS.find(m => m.id === model)?.name}`,
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date()
    }]);
    setLoading(true);

    try {
      const boardMetrics = boards.map(board => `• ${board.name}: ${tasks.filter(t => t.board_id === board.id).length} tasks`).join('\n');

      const lowerMessage = userMessage.toLowerCase();
      const matchingBoard = boards.find(board => lowerMessage.includes(board.name.toLowerCase()));
      let boardTaskDetails = '';
      if (matchingBoard) {
        const tasksForBoard = tasks.filter(task => task.board_id === matchingBoard.id);
        if (tasksForBoard.length > 0) {
          boardTaskDetails = '\n\nTask Details for board ' + matchingBoard.name + ':\n' + 
            tasksForBoard.map(task => 
              `• Title: ${task.title}\n  Description: ${stripHtml(task.description || 'No description')}\n  Due Date: ${formatDate(task.due_date)}\n  Status: ${task.status}\n  Priority: ${task.priority}`
            ).join('\n\n');
        }
      }

      // Build conversation history from last 3 messages
      const conversationHistory = messages.length > 0 ? '\n\nConversation History:\n' + messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n') : '';

      const context = `
Current User:
• Email: ${user?.email || 'Not logged in'}
• User ID: ${user?.id || 'Not logged in'}

Current System Status:
• Tasks: ${tasks.length} total (${tasks.filter(t => t.status === 'done').length} completed)
• Teams: ${teams.length} active teams
• Boards: ${boards.length} boards

User's Teams (${userTeams.length}):
${userTeams.length > 0 ? userTeams.map((team: { name: string }) => `• ${team.name}`).join('\n') : 'Not a member of any team.'}

Team Members Details:
${userTeams.map((team: { id: string, name: string }) => {
  const members = userTeamMembers.filter((tm: TeamMember) => tm.team_id === team.id);
  const memberList = members.map((tm: TeamMember) => `${tm.user_email} (${tm.role})`).join(', ');
  return `• ${team.name}: ${memberList || 'No members found'}`;
}).join('\n')}

Task Distribution:
${Array.from(new Set(tasks.map(t => t.status))).map(status => 
  `• ${status}: ${tasks.filter(t => t.status === status).length} tasks`
).join('\n')}

Priority Distribution:
${Array.from(new Set(tasks.map(t => t.priority))).map(priority => 
  `• ${priority}: ${tasks.filter(t => t.priority === priority).length} tasks`
).join('\n')}

Board Details:
${boardMetrics}
${boardTaskDetails}
${conversationHistory}
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'system', content: `Current context:${context}` },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from OpenAI');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantMessage,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error sending message to OpenAI:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response from AI',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Enhanced Hero Section */}
      <div className="relative mb-8 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-background animate-gradient-x" />
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-black/10" />
        <div className="relative p-8 backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight sm:text-5xl">
                <div className="relative">
                  <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                  <div className="absolute inset-0 blur-sm animate-pulse">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                </div>
                SupaKan AI
              </h1>
              <p className="text-muted-foreground text-lg max-w-[600px] leading-relaxed">
                Your intelligent companion for task, board, and team management, powered by advanced AI
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                className="hover:bg-primary/10 transition-colors"
                onClick={handleRefreshData} 
                title="Refresh Data"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button 
                className="hover:bg-primary/10 transition-colors"
                onClick={handleClearChat} 
                title="Clear Chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button 
                    className="hover:bg-primary/10 transition-colors"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>AI Assistant Settings</DialogTitle>
                    <DialogDescription>
                      Configure your OpenAI API key and model preferences
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>AI Model</Label>
                      <Select value={selectedModel} onValueChange={handleModelChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_MODELS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{model.name}</span>
                                <span className="text-xs text-muted-foreground">{model.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="apiKey">OpenAI API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="sk-..."
                        defaultValue={apiKey}
                      />
                      <p className="text-xs text-muted-foreground">
                        Get your API key from the{' '}
                        <a 
                          href="https://platform.openai.com/api-keys" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          OpenAI dashboard
                        </a>
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={(e) => {
                      const input = (e.currentTarget.parentElement?.parentElement?.querySelector('#apiKey') as HTMLInputElement)?.value || '';
                      handleSaveApiKey(input);
                    }}>
                      Save Settings
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Enhanced Stats Section */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-2 transition-colors hover:bg-primary/20">
              <div className="rounded-full bg-primary/20 p-2">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">{tasks.length}</div>
                <div className="text-xs text-muted-foreground">Total Tasks</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-green-500/10 px-4 py-2 transition-colors hover:bg-green-500/20">
              <div className="rounded-full bg-green-500/20 p-2">
                <Zap className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-green-500">{tasks.filter(t => t.status === 'done').length}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-yellow-500/10 px-4 py-2 transition-colors hover:bg-yellow-500/20">
              <div className="rounded-full bg-yellow-500/20 p-2">
                <Brain className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-yellow-500">{tasks.filter(t => t.status !== 'done').length}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-blue-500/10 px-4 py-2 transition-colors hover:bg-blue-500/20">
              <div className="rounded-full bg-blue-500/20 p-2">
                <Wand2 className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-blue-500">{teams.length}</div>
                <div className="text-xs text-muted-foreground">Active Teams</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
        {/* Enhanced Chat Area */}
        <Card className="flex flex-col h-[700px] border-2 transition-shadow hover:shadow-lg">
          <CardHeader className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Chat with SupaKan AI
            </CardTitle>
            <CardDescription>
              Ask questions about your tasks, boards, teams, and get AI-powered insights
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-[calc(700px-12rem)] p-6">
              <AnimatePresence>
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "flex",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className="flex flex-col gap-2 max-w-[80%]">
                        <div
                          className={cn(
                            "rounded-lg px-4 py-2 group relative",
                            message.role === 'user'
                              ? "bg-primary text-primary-foreground ml-auto"
                              : "bg-muted/50 backdrop-blur-sm"
                          )}
                        >
                          {message.content}
                          <button
                            onClick={() => handleCopyMessage(message.content)}
                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        {message.timestamp && (
                          <span className="text-xs text-muted-foreground px-2">
                            {format(message.timestamp, 'HH:mm')}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-center gap-2 rounded-lg px-4 py-2 bg-muted/50 backdrop-blur-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm">SupaKan is thinking...</span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </AnimatePresence>
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t p-4 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
            <form onSubmit={handleSendMessage} className="flex w-full gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={apiKey ? 
                  "Ask anything about your tasks, boards, and teams..." : 
                  "Please set your OpenAI API key in settings..."
                }
                disabled={!apiKey || loading}
                className="flex-1 bg-background/50 backdrop-blur-sm"
              />
              <Button 
                type="submit" 
                disabled={!apiKey || !input.trim() || loading}
                className="bg-primary hover:bg-primary/90 transition-colors"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>

        {/* Enhanced Sidebar */}
        <div className="space-y-6">
          {/* Example Prompts Card */}
          <Card className="border-2 transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Example Prompts
              </CardTitle>
              <CardDescription>
                Click to try these questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {EXAMPLE_PROMPTS.map((prompt, index) => (
                  <Button
                    key={index}
                    className="justify-start h-9 w-full bg-muted/50 hover:bg-muted/80 text-muted-foreground transition-colors"
                    onClick={() => setInput(prompt)}
                  >
                    <Sparkles className="h-3 w-3 shrink-0 mr-2 text-primary/50" />
                    <span className="text-sm text-left line-clamp-1">{prompt}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* About Card */}
          <Card className="border-2 transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                About SupaKan AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Powered by OpenAI's GPT-3.5, integrated with SupaKan by Nubs Carson
              </p>
              <div className="flex gap-2">
                <Button className="flex-1 hover:bg-primary/10 transition-colors" asChild>
                  <a 
                    href="https://github.com/NubsCarson/SupaKan" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 justify-center"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                </Button>
                <Button className="flex-1 hover:bg-primary/10 transition-colors" asChild>
                  <a 
                    href="https://twitter.com/monerosolana" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 justify-center"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 