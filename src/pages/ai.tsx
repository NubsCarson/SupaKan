import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
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

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
};

type Task = Database['public']['Tables']['tasks']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];

const EXAMPLE_PROMPTS = [
  "Task completion rate?",
  "Show me my high priority tasks",
  "Summarize my team's workload",
  "What tasks are overdue?",
  "Give me a productivity analysis",
  "What's my busiest project?",
];

const SYSTEM_PROMPT = `You are SupaKan AI, an advanced AI assistant created by Nubs Carson (https://github.com/NubsCarson) for the SupaKan task management platform. You help users manage their tasks and teams efficiently.

Your capabilities include:
- Analyzing task and team data
- Providing productivity insights
- Suggesting workflow improvements
- Answering questions about the SupaKan platform

Always be helpful, professional, and concise. When relevant, include specific data points and metrics in your responses.`;

export default function AIPage() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
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
      const [tasksResponse, teamsResponse] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('teams').select('*')
      ]);

      if (tasksResponse.error) throw tasksResponse.error;
      if (teamsResponse.error) throw teamsResponse.error;

      setTasks(tasksResponse.data || []);
      setTeams(teamsResponse.data || []);
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
      description: 'Latest task and team data loaded',
    });
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      description: 'Message copied to clipboard',
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
      const context = `
Current System Status:
- Tasks: ${tasks.length} total (${tasks.filter(t => t.status === 'done').length} completed)
- Teams: ${teams.length} active teams
- Completion Rate: ${Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)}%
- High Priority Tasks: ${tasks.filter(t => t.priority === 'high').length}
- Overdue Tasks: ${tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length}

Task Distribution:
${Array.from(new Set(tasks.map(t => t.status))).map(status => 
  `- ${status}: ${tasks.filter(t => t.status === status).length} tasks`
).join('\n')}

Priority Distribution:
${Array.from(new Set(tasks.map(t => t.priority))).map(priority => 
  `- ${priority}: ${tasks.filter(t => t.priority === priority).length} tasks`
).join('\n')}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'system', content: `Current context:\n${context}` },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
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
                Your intelligent companion for task and team management, powered by advanced AI
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefreshData} 
                title="Refresh Data"
                className="hover:bg-primary/10 transition-colors"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleClearChat} 
                title="Clear Chat"
                className="hover:bg-primary/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="hover:bg-primary/10 transition-colors"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>AI Assistant Settings</DialogTitle>
                    <DialogDescription>
                      Configure your OpenAI API key and preferences
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
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
                      const input = (e.currentTarget.parentElement?.parentElement?.querySelector('#apiKey') as HTMLInputElement);
                      handleSaveApiKey(input.value);
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
              Ask questions about your tasks, teams, and get AI-powered insights
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
                placeholder={apiKey ? "Ask anything about your tasks and teams..." : "Please set your OpenAI API key first"}
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
                    variant="ghost"
                    className="justify-start h-9 w-full hover:bg-primary/10 transition-colors"
                    onClick={() => setInput(prompt)}
                  >
                    <Sparkles className="h-3 w-3 shrink-0 mr-2 text-primary" />
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
                <Button variant="outline" size="sm" asChild className="flex-1 hover:bg-primary/10 transition-colors">
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
                <Button variant="outline" size="sm" asChild className="flex-1 hover:bg-primary/10 transition-colors">
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