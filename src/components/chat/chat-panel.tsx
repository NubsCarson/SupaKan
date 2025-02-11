import { useState, useEffect, useRef, type FormEvent, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { getUserTeams } from '@/lib/teams';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Pin,
  Heart,
  Send,
  Pencil,
  Trash2,
  X,
  MessageSquare,
  UserIcon,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageWithUser = Message & {
  message_user: {
    id: string;
    email: string;
    created_at: string;
    updated_at: string;
  } | null;
};

// Type guard to check if the payload has an ID
function hasId(obj: any): obj is { id: string } {
  return obj && typeof obj.id === 'string';
}

export function ChatPanel() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<MessageWithUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Function to check if scroll is near bottom
  const checkIfNearBottom = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const threshold = 100; // pixels from bottom
    const position = scrollArea.scrollTop + scrollArea.clientHeight;
    const nearBottom = position >= scrollArea.scrollHeight - threshold;
    setIsNearBottom(nearBottom);
  }, []);

  // Smart scroll to bottom
  const scrollToBottom = useCallback((force = false) => {
    if (force || isNearBottom) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [isNearBottom]);

  // Handle scroll events
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      checkIfNearBottom();
    };

    scrollArea.addEventListener('scroll', handleScroll);
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, [checkIfNearBottom]);

  // Load initial team and messages
  useEffect(() => {
    const loadTeamAndMessages = async () => {
      if (!user) return;

      try {
        // Get user's teams
        const teams = await getUserTeams(user.id);
        if (teams.length > 0) {
          setTeamId(teams[0].id);

          // Load messages for the team
          const { data, error } = await supabase
            .from('messages_with_users')
            .select('*')
            .eq('team_id', teams[0].id)
            .order('created_at', { ascending: true });

          if (error) throw error;
          setMessages(data || []);
          setPinnedMessages(data?.filter(m => m.is_pinned) || []);
          // Force scroll to bottom on initial load
          setTimeout(() => scrollToBottom(true), 100);
        }
      } catch (error) {
        console.error('Error loading team and messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamAndMessages();
  }, [user, scrollToBottom]);

  // Set up real-time subscription
  useEffect(() => {
    if (!teamId) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages_with_users')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
      setPinnedMessages(data?.filter(m => m.is_pinned) || []);
      scrollToBottom();
    };

    // Subscribe to both messages table and messages_with_users view
    const channel = supabase
      .channel(`messages:${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `team_id=eq.${teamId}`,
        },
        async (payload) => {
          console.log('Message change:', payload);
          await loadMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages_with_users',
          filter: `team_id=eq.${teamId}`,
        },
        async (payload) => {
          console.log('Messages with users change:', payload);
          await loadMessages();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        }
      });

    // Load initial messages
    loadMessages();

    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [teamId, scrollToBottom]);

  // Send a new message
  const handleSendMessage = async () => {
    if (!user || !teamId || !newMessage.trim()) return;

    const content = newMessage.trim();
    // Clear input immediately for better UX
    setNewMessage('');

    try {
      // First, insert the message
      const { data: newMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          content,
          user_id: user.id,
          team_id: teamId,
          likes: [],
          is_pinned: false,
          mentions: [],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Then, fetch the complete message with user data
      const { data: messageWithUser, error: fetchError } = await supabase
        .from('messages_with_users')
        .select('*')
        .eq('id', newMessage.id)
        .single();

      if (fetchError) throw fetchError;

      // Update the UI optimistically
      setMessages(prev => [...prev, messageWithUser]);
      scrollToBottom(true);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      // Restore the message content if sending failed
      setNewMessage(content);
    }
  };

  // Toggle pin status
  const handleTogglePin = async (messageId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_pinned: !currentPinned })
        .eq('id', messageId);

      if (error) throw error;

      // Update messages state
      const updatedMessages = messages.map(m =>
        m.id === messageId ? { ...m, is_pinned: !currentPinned } : m
      );
      setMessages(updatedMessages);

      // Update pinned messages state
      if (!currentPinned) {
        const message = messages.find(m => m.id === messageId);
        if (message) {
          setPinnedMessages(prev => [...prev, { ...message, is_pinned: true }]);
        }
      } else {
        setPinnedMessages(prev => prev.filter(m => m.id !== messageId));
      }

      toast({
        title: currentPinned ? 'Message unpinned' : 'Message pinned',
        description: 'Message has been updated',
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  };

  // Toggle like status
  const handleToggleLike = async (messageId: string, currentLikes: string[]) => {
    if (!user) return;

    try {
      const newLikes = currentLikes.includes(user.id)
        ? currentLikes.filter(id => id !== user.id)
        : [...currentLikes, user.id];

      const { error } = await supabase
        .from('messages')
        .update({ likes: newLikes })
        .eq('id', messageId);

      if (error) throw error;

      // Update messages state
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, likes: newLikes } : m))
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      // Update both messages and pinned messages states
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setPinnedMessages(prev => prev.filter(m => m.id !== messageId));

      toast({
        title: 'Message deleted',
        description: 'Message has been removed',
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  // Start editing a message
  const handleStartEdit = (message: MessageWithUser) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  // Save edited message
  const handleSaveEdit = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: editContent.trim(),
          edited_at: new Date().toISOString(),
        })
        .eq('id', editingMessage);

      if (error) throw error;
      setEditingMessage(null);
      setEditContent('');

      toast({
        title: 'Message updated',
        description: 'Your changes have been saved',
      });
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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
                className="text-xs rounded bg-background/50 p-2 group relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserIcon className="h-3 w-3" />
                    <span className="font-medium">
                      {msg.message_user?.email || 'Unknown User'}
                    </span>
                    <span>·</span>
                    <span>
                      {format(new Date(msg.created_at), 'MMM d, h:mm a')}
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
                  <button
                    onClick={() => handleTogglePin(msg.id, msg.is_pinned)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
                    title="Unpin message"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <p className="mt-1">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 p-4"
        onWheel={checkIfNearBottom}
        onTouchMove={checkIfNearBottom}
      >
        <div className="space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 relative group",
                message.user_id === user?.id && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full bg-muted flex items-center justify-center",
                  message.user_id === user?.id && "order-1"
                )}
              >
                <UserIcon className="h-4 w-4" />
              </div>
              <div
                className={cn(
                  "flex flex-col gap-1 max-w-[80%]",
                  message.user_id === user?.id && "items-end"
                )}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {message.message_user?.email || 'Unknown User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.created_at), 'h:mm a')}
                  </span>
                  {message.edited_at && (
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
                    <Button size="sm" onClick={handleSaveEdit}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingMessage(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "rounded-lg p-3",
                      message.user_id === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.content}
                  </div>
                )}

                <div
                  className={cn(
                    "flex items-center gap-2 text-xs text-muted-foreground",
                    message.user_id === user?.id && "flex-row-reverse"
                  )}
                >
                  <button
                    onClick={() => handleToggleLike(message.id, message.likes)}
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
                        onClick={() => handleStartEdit(message)}
                        className="hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleTogglePin(message.id, message.is_pinned)}
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
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
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
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
} 