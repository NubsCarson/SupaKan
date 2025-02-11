export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
      }
      boards: {
        Row: {
          id: string
          title: string
          team_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          team_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          team_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'
          priority: 'low' | 'medium' | 'high'
          ticket_id: string
          created_by: string
          assigned_to: string | null
          board_id: string
          team_id: string
          position: number
          labels: string[]
          estimated_hours: number | null
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'
          priority: 'low' | 'medium' | 'high'
          ticket_id: string
          created_by: string
          assigned_to?: string | null
          board_id: string
          team_id: string
          position: number
          labels?: string[]
          estimated_hours?: number | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'
          priority?: 'low' | 'medium' | 'high'
          ticket_id?: string
          created_by?: string
          assigned_to?: string | null
          board_id?: string
          team_id?: string
          position?: number
          labels?: string[]
          estimated_hours?: number | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          content: string
          user_id: string
          likes: string[]
          is_pinned: boolean
          mentions: string[]
          created_at: string
          updated_at: string
          edited_at: string | null
        }
        Insert: {
          id?: string
          content: string
          user_id: string
          likes?: string[]
          is_pinned?: boolean
          mentions?: string[]
          created_at?: string
          updated_at?: string
          edited_at?: string | null
        }
        Update: {
          id?: string
          content?: string
          user_id?: string
          likes?: string[]
          is_pinned?: boolean
          mentions?: string[]
          created_at?: string
          updated_at?: string
          edited_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 