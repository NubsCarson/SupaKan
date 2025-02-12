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
          role: 'owner' | 'admin' | 'member' | 'guest'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'guest'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member' | 'guest'
          created_at?: string
          updated_at?: string
        }
      }
      boards: {
        Row: {
          id: string
          name: string
          description: string | null
          team_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          team_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
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
          position: number
          ticket_id: string
          board_id: string
          team_id: string
          created_by: string
          assigned_to: string | null
          due_date: string | null
          estimated_hours: number | null
          labels: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'
          priority: 'low' | 'medium' | 'high'
          position?: number
          ticket_id: string
          board_id: string
          team_id: string
          created_by: string
          assigned_to?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          labels?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'
          priority?: 'low' | 'medium' | 'high'
          position?: number
          ticket_id?: string
          board_id?: string
          team_id?: string
          created_by?: string
          assigned_to?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          labels?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          content: string
          team_id: string
          user_id: string
          is_pinned: boolean
          likes: string[]
          mentions: string[]
          created_at: string
          updated_at: string
          edited_at: string | null
        }
        Insert: {
          id?: string
          content: string
          team_id: string
          user_id: string
          is_pinned?: boolean
          likes?: string[]
          mentions?: string[]
          created_at?: string
          updated_at?: string
          edited_at?: string | null
        }
        Update: {
          id?: string
          content?: string
          team_id?: string
          user_id?: string
          is_pinned?: boolean
          likes?: string[]
          mentions?: string[]
          created_at?: string
          updated_at?: string
          edited_at?: string | null
        }
      }
    }
    Views: {
      messages_with_users: {
        Row: {
          id: string
          content: string
          team_id: string
          user_id: string
          is_pinned: boolean
          likes: string[]
          mentions: string[]
          created_at: string
          updated_at: string
          edited_at: string | null
          message_user: Json
        }
      }
      team_members_with_users: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'guest'
          created_at: string
          updated_at: string
          user_email: string
        }
      }
    }
    Functions: {
      ensure_user_has_team: {
        Args: {
          input_user_id: string
        }
        Returns: void
      }
      update_task_positions: {
        Args: {
          task_positions: {
            id: string
            position: number
          }[]
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 