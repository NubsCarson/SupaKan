import { supabase } from './supabase';
import type { Tables, TableRow, TableInsert } from './supabase';

export type Board = TableRow<'boards'>;
export type Task = TableRow<'tasks'>;

export async function createBoard(data: { title: string; teamId: string; createdBy: string }) {
  const { data: board, error } = await supabase
    .from('boards')
    .insert({
      title: data.title,
      team_id: data.teamId,
      created_by: data.createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return board;
}

export async function getBoard(boardId: string) {
  const { data: board, error } = await supabase
    .from('boards')
    .select(`
      *,
      tasks (
        *,
        assigned_to (
          id,
          email
        )
      )
    `)
    .eq('id', boardId)
    .single();

  if (error) throw error;
  return board;
}

export async function getTeamBoards(teamId: string) {
  const { data: boards, error } = await supabase
    .from('boards')
    .select(`
      *,
      tasks (
        id,
        title,
        status,
        priority
      )
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return boards;
}

export async function updateBoard(boardId: string, updates: Partial<Board>) {
  const { data: board, error } = await supabase
    .from('boards')
    .update(updates)
    .eq('id', boardId)
    .select()
    .single();

  if (error) throw error;
  return board;
}

export async function deleteBoard(boardId: string) {
  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId);

  if (error) throw error;
}

// Task operations
export async function createTask(data: {
  title: string;
  description?: string;
  status: Task['status'];
  priority: Task['priority'];
  boardId: string;
  teamId: string;
  createdBy: string;
  assignedTo?: string;
  position: number;
  labels?: string[];
  estimatedHours?: number;
  dueDate?: string;
}) {
  // Generate ticket ID
  const ticketId = await generateTicketId();

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      ticket_id: ticketId,
      board_id: data.boardId,
      team_id: data.teamId,
      created_by: data.createdBy,
      assigned_to: data.assignedTo,
      position: data.position,
      labels: data.labels,
      estimated_hours: data.estimatedHours,
      due_date: data.dueDate,
    })
    .select()
    .single();

  if (error) throw error;
  return task;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const { data: task, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return task;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

export async function updateTaskPositions(tasks: { id: string; position: number }[]) {
  const { error } = await supabase.rpc('update_task_positions', {
    task_positions: tasks,
  });

  if (error) throw error;
}

// Real-time subscriptions
export function subscribeToBoardChanges(boardId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`board:${boardId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'boards',
      filter: `id=eq.${boardId}`,
    }, callback)
    .subscribe();
}

export function subscribeToTaskChanges(boardId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`tasks:${boardId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `board_id=eq.${boardId}`,
    }, callback)
    .subscribe();
}

// Helper functions
async function generateTicketId(): Promise<string> {
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });

  const nextNumber = (count ?? 0) + 1;
  return `TASK-${nextNumber.toString().padStart(4, '0')}`;
}

// Board statistics
export async function getBoardStatistics(boardId: string) {
  const { data, error } = await supabase.rpc('get_board_statistics', {
    board_id: boardId,
  });

  if (error) throw error;
  return data;
} 