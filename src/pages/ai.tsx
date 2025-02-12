import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Bot, Send, Key, Loader2, Settings2, Sparkles, Github, Twitter, RefreshCcw, Trash2, Info, Copy } from 'lucide-react';
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

  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    loadData();
  }, []);

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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Hero Section */}
      <div className="relative mb-8 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-black/10" />
        <div className="relative">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight sm:text-4xl">
                <Sparkles className="h-8 w-8 text-primary" />
                SupaKan AI Assistant
              </h1>
              <p className="text-muted-foreground max-w-[600px]">
                Your intelligent companion for task and team management, powered by OpenAI
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleRefreshData} title="Refresh Data">
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleClearChat} title="Clear Chat">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
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

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Badge variant="outline" className="bg-primary/10 inline-flex items-center">
              <span className="truncate">{tasks.length} Total Tasks</span>
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 inline-flex items-center">
              <span className="truncate">{tasks.filter(t => t.status === 'done').length} Completed</span>
            </Badge>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 inline-flex items-center">
              <span className="truncate">{tasks.filter(t => t.status !== 'done').length} In Progress</span>
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 inline-flex items-center">
              <span className="truncate">{teams.length} Active Teams</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,300px]">
        {/* Main Chat Area */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Chat with SupaKan AI
            </CardTitle>
            <CardDescription>
              Ask questions about your tasks, teams, and get AI-powered insights
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-[calc(600px-10rem)] p-4">
              <AnimatePresence>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div className="flex flex-col gap-1 max-w-[80%]">
                        <div
                          className={`rounded-lg px-4 py-2 group relative ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted'
                          }`}
                        >
                          {message.content}
                          <button
                            onClick={() => handleCopyMessage(message.content)}
                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        {message.timestamp && (
                          <span className="text-xs text-muted-foreground">
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
                      <div className="flex items-center gap-2 rounded-lg px-4 py-2 bg-muted">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">SupaKan is thinking...</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </AnimatePresence>
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex w-full gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={apiKey ? "Ask anything about your tasks and teams..." : "Please set your OpenAI API key first"}
                disabled={!apiKey || loading}
                className="flex-1"
              />
              <Button type="submit" disabled={!apiKey || !input.trim() || loading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Example Prompts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Example Prompts</CardTitle>
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
                    className="justify-start h-8 py-1 px-2 w-full hover:bg-muted/50"
                    onClick={() => setInput(prompt)}
                  >
                    <Sparkles className="h-3 w-3 shrink-0 mr-1.5 text-primary" />
                    <span className="text-sm text-left line-clamp-1">{prompt}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">About SupaKan AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Powered by OpenAI's GPT-3.5, integrated with SupaKan by Nubs Carson
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href="https://github.com/NubsCarson/SupaKan" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href="https://twitter.com/monerosolana" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
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