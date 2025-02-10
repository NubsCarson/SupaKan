import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { dbService } from '@/lib/db';
import type { ChatMessage, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Pin,
  Heart,
  MessageSquare,
  Send,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  UserIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type MessageWithUser = ChatMessage & {
  messageUser: Omit<User, 'password'> | null;
};

export function ChatPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [pinnedMessages, setPinnedMessages] = useState<MessageWithUser[]>([]);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const rawMessages = await dbService.getMessages();
        const messagesWithUsers = await Promise.all(
          rawMessages.map(async message => {
            const messageUser = message.user_id === 'system' 
              ? {
                  id: 'system',
                  username: 'System',
                  email: 'system@kanban.local',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  ticket_id: 'USER-0000'
                }
              : await dbService.getUser(message.user_id);
            return {
              ...message,
              messageUser
            };
          })
        );
        
        // Sort messages by timestamp
        const sortedMessages = messagesWithUsers.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        setMessages(sortedMessages);
        setPinnedMessages(sortedMessages.filter(m => m.is_pinned));
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages.',
          variant: 'destructive',
        });
      }
    };

    loadMessages();
  }, [toast]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const mentions = extractMentions(newMessage);
      const message = await dbService.createMessage({
        content: newMessage,
        user_id: user.id,
        likes: [],
        is_pinned: false,
        mentions,
      });

      const messageWithUser = {
        ...message,
        messageUser: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
          ticket_id: user.ticket_id
        },
      };

      setMessages(prev => [...prev, messageWithUser]);
      setNewMessage('');
      
      toast({
        title: 'Message sent',
        description: mentions.length > 0 ? `Message sent with ${mentions.length} mention(s)` : undefined,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
    }
  };

  const extractMentions = (content: string): string[] => {
    const mentions = content.match(/@[\w-]+/g) || [];
    return mentions.map(mention => mention.substring(1)); // Remove @ symbol
  };

  const togglePin = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      await dbService.updateMessage(messageId, {
        is_pinned: !message.is_pinned,
      });

      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, is_pinned: !m.is_pinned } : m
        )
      );

      toast({
        title: message.is_pinned ? 'Message unpinned' : 'Message pinned',
        description: 'Message has been updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  };

  const handleLike = async (messageId: string) => {
    if (!user) return;

    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const likes = message.likes.includes(user.id)
        ? message.likes.filter(id => id !== user.id)
        : [...message.likes, user.id];

      await dbService.updateMessage(messageId, { likes });

      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, likes } : m))
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await dbService.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast({
        title: 'Message deleted',
        description: 'Message has been removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (message: MessageWithUser) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const handleEdit = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      const mentions = extractMentions(editContent);
      await dbService.updateMessage(messageId, {
        content: editContent,
        mentions,
      });

      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? {
                ...m,
                content: editContent,
                mentions,
                edited_at: new Date().toISOString(),
              }
            : m
        )
      );

      cancelEdit();
      toast({
        title: 'Message updated',
        description: 'Your changes have been saved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  return (
    <div className="flex h-full flex-col bg-card rounded-lg border shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Team Chat</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          {messages.length} messages
        </div>
      </div>

      {pinnedMessages.length > 0 && (
        <div className="border-b bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Pin className="h-3 w-3" />
            <span>Pinned Messages</span>
          </div>
          <div className="space-y-2">
            {pinnedMessages.map(msg => (
              <div
                key={msg.id}
                className="text-xs rounded bg-background/50 p-2"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="h-3 w-3" />
                  <span className="font-medium">
                    {msg.messageUser?.username || (msg.user_id === 'system' ? 'System' : 'Unknown User')}
                  </span>
                  <span>·</span>
                  <span>
                    {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                    {msg.edited_at && (
                      <span
                        className="ml-1 inline-flex items-center text-[10px]"
                        title={`Edited ${format(new Date(msg.edited_at), 'MMM d, h:mm a')}`}
                      >
                        (edited)
                      </span>
                    )}
                  </span>
                </div>
                <p className="mt-1">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(message => (
            <div key={message.id} className={cn(
              "flex gap-3 relative group",
              message.user_id === user?.id && "flex-row-reverse"
            )}>
              <div
                className={cn(
                  "w-8 h-8 rounded-full bg-muted flex items-center justify-center",
                  message.user_id === user?.id && "order-1"
                )}
              >
                <UserIcon className="h-4 w-4" />
              </div>
              <div className={cn(
                "flex flex-col gap-1 max-w-[80%]",
                message.user_id === user?.id && "items-end"
              )}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {message.user_id === 'system' ? 'System' : message.messageUser?.username || 'Unknown User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.timestamp), 'h:mm a')}
                  </span>
                  {message.edited_at && message.user_id !== 'system' && (
                    <span
                      className="text-xs text-muted-foreground"
                      title={`Edited ${format(new Date(message.edited_at), 'MMM d, h:mm a')}`}
                    >
                      (edited)
                    </span>
                  )}
                </div>
                {editingMessage === message.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-w-[200px]"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleEdit(message.id)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className={cn(
                    "rounded-lg p-3",
                    message.user_id === user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}>
                    {message.content}
                  </div>
                )}
                <div className={cn(
                  "flex items-center gap-2 text-xs text-muted-foreground",
                  message.user_id === user?.id && "flex-row-reverse"
                )}>
                  <button
                    onClick={() => handleLike(message.id)}
                    className={cn(
                      "flex items-center gap-1 hover:text-foreground transition-colors",
                      message.likes.includes(user?.id || '') && "text-primary"
                    )}
                  >
                    <Heart className="h-3 w-3" />
                    {message.likes.length > 0 && message.likes.length}
                  </button>
                  {message.user_id === user?.id && !editingMessage && (
                    <>
                      <button
                        onClick={() => startEdit(message)}
                        className="hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => togglePin(message.id)}
                    className={cn(
                      "hover:text-foreground transition-colors",
                      message.is_pinned && "text-primary"
                    )}
                  >
                    <Pin className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
} 