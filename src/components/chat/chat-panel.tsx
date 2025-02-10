import { useState, useEffect, useRef } from 'react';
import { dbService } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, User, Clock, ThumbsUp, Reply, MoreVertical, Pin, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth-context';
import type { ChatMessage, User as UserType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type MessageWithUser = ChatMessage & {
  messageUser: Omit<UserType, 'password'> | null;
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
          rawMessages.map(async message => ({
            ...message,
            messageUser: await dbService.getUser(message.user_id),
          }))
        );
        setMessages(messagesWithUsers);
        setPinnedMessages(messagesWithUsers.filter(m => m.is_pinned));
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const message = await dbService.createMessage({
        content: newMessage,
        user_id: user.id,
        likes: [],
        is_pinned: false,
        mentions: extractMentions(newMessage),
      });

      const messageWithUser = {
        ...message,
        messageUser: user,
      };

      setMessages(prev => [...prev, messageWithUser]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const extractMentions = (content: string): string[] => {
    const mentions = content.match(/@[\w-]+/g) || [];
    return mentions;
  };

  const togglePin = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const updatedMessage = await dbService.updateMessage(messageId, {
        is_pinned: !message.is_pinned,
      });

      const updatedMessageWithUser = {
        ...updatedMessage,
        messageUser: message.messageUser,
      };

      setMessages(prev =>
        prev.map(msg => (msg.id === messageId ? updatedMessageWithUser : msg))
      );

      if (updatedMessageWithUser.is_pinned) {
        setPinnedMessages(pins => [...pins, updatedMessageWithUser]);
      } else {
        setPinnedMessages(pins => pins.filter(p => p.id !== messageId));
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleLike = async (messageId: string) => {
    if (!user) return;

    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const hasLiked = message.likes.includes(user.id);
      const updatedLikes = hasLiked
        ? message.likes.filter(id => id !== user.id)
        : [...message.likes, user.id];

      const updatedMessage = await dbService.updateMessage(messageId, {
        likes: updatedLikes,
      });

      const updatedMessageWithUser = {
        ...updatedMessage,
        messageUser: message.messageUser,
      };

      setMessages(prev =>
        prev.map(msg => (msg.id === messageId ? updatedMessageWithUser : msg))
      );
    } catch (error) {
      console.error('Failed to update like:', error);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await dbService.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setPinnedMessages(prev => prev.filter(m => m.id !== messageId));
      toast({
        title: 'Message deleted',
        description: 'The message has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete message.',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (message: MessageWithUser) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const handleEdit = async (messageId: string) => {
    try {
      const updatedMessage = await dbService.updateMessage(messageId, {
        content: editContent,
        edited_at: new Date().toISOString(),
      });

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, content: editContent, edited_at: new Date().toISOString() }
            : msg
        )
      );

      setPinnedMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, content: editContent, edited_at: new Date().toISOString() }
            : msg
        )
      );

      setEditingMessage(null);
      setEditContent('');
      
      toast({
        title: 'Message updated',
        description: 'Your changes have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update message.',
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
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Team Chat</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          {messages.length} messages
        </div>
      </div>

      {/* Pinned Messages */}
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
                  <User className="h-3 w-3" />
                  <span className="font-medium">{msg.messageUser?.username}</span>
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

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                "group rounded-lg p-3 transition-colors hover:bg-muted/50",
                msg.is_pinned && "bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {msg.messageUser?.avatar_url ? (
                    <img
                      src={msg.messageUser.avatar_url}
                      alt={msg.messageUser.username}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{msg.messageUser?.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                      {msg.edited_at && (
                        <span
                          className="ml-1 inline-flex items-center"
                          title={`Edited ${format(new Date(msg.edited_at), 'MMM d, h:mm a')}`}
                        >
                          (edited)
                        </span>
                      )}
                    </span>
                  </div>
                  {msg.mentions && msg.mentions.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {msg.mentions.map(mention => (
                        <span
                          key={mention}
                          className="text-xs text-primary"
                        >
                          {mention}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleLike(msg.id)}
                  >
                    <ThumbsUp className={cn(
                      "h-4 w-4",
                      user && msg.likes.includes(user.id) && "text-primary fill-primary"
                    )} />
                    {msg.likes.length > 0 && (
                      <span className="ml-1 text-xs">{msg.likes.length}</span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", msg.is_pinned && "text-primary")}
                    onClick={() => togglePin(msg.id)}
                  >
                    <Pin className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Reply className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(msg)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(msg.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {editingMessage === msg.id ? (
                <div className="flex gap-2">
                  <Input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleEdit(msg.id)}
                  />
                  <Button size="sm" onClick={() => handleEdit(msg.id)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 