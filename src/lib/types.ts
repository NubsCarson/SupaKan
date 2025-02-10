export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high';
  ticket_id: string;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  due_date?: string;
  estimated_hours?: number;
  labels: string[];
}

export interface User {
  id: string;
  ticket_id: string;
  username: string;
  email: string;
  password: string; // This will be hashed
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  timestamp: string;
  likes: string[]; // Array of user IDs who liked the message
  is_pinned: boolean;
  reply_to?: string;
  task_id?: string;
  mentions?: string[]; // Array of mentioned user IDs
  edited_at?: string; // Timestamp of last edit
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
} 