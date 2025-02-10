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