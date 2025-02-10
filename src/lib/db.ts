import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { Task } from './types';

const db = new Database('kanban.db');

// Initialize database with tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK(status IN ('backlog', 'todo', 'in_progress', 'in_review', 'done')),
    priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high')),
    ticket_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    assigned_to TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    due_date TEXT,
    estimated_hours REAL,
    labels TEXT
  )
`);

// Initialize with sample data if empty
const count = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
if (count.count === 0) {
  const sampleTasks = [
    {
      id: uuidv4(),
      title: 'Welcome to Kanban Board',
      description: 'This is a sample task to help you get started. Try dragging it to different columns!',
      status: 'todo',
      priority: 'medium',
      ticket_id: 'TASK-001',
      created_by: 'demo-user',
      assigned_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      labels: ['sample'],
    },
    {
      id: uuidv4(),
      title: 'Try Creating a New Task',
      description: 'Click the "New Task" button to create your own task with a rich text description.',
      status: 'backlog',
      priority: 'low',
      ticket_id: 'TASK-002',
      created_by: 'demo-user',
      assigned_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      estimated_hours: 2,
      labels: ['getting-started'],
    },
  ];

  const insert = db.prepare(`
    INSERT INTO tasks (
      id, title, description, status, priority, ticket_id, created_by, assigned_to,
      created_at, updated_at, due_date, estimated_hours, labels
    ) VALUES (
      @id, @title, @description, @status, @priority, @ticket_id, @created_by, @assigned_to,
      @created_at, @updated_at, @due_date, @estimated_hours, @labels
    )
  `);

  for (const task of sampleTasks) {
    insert.run({
      ...task,
      labels: JSON.stringify(task.labels),
    });
  }
}

export const dbService = {
  getTasks: (): Task[] => {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as Task[];
    return tasks.map(task => ({
      ...task,
      labels: JSON.parse(task.labels as string),
    }));
  },

  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task => {
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const insert = db.prepare(`
      INSERT INTO tasks (
        id, title, description, status, priority, ticket_id, created_by, assigned_to,
        created_at, updated_at, due_date, estimated_hours, labels
      ) VALUES (
        @id, @title, @description, @status, @priority, @ticket_id, @created_by, @assigned_to,
        @created_at, @updated_at, @due_date, @estimated_hours, @labels
      )
    `);

    insert.run({
      ...newTask,
      labels: JSON.stringify(newTask.labels),
    });

    return newTask;
  },

  updateTask: (id: string, updates: Partial<Task>): Task => {
    const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
    if (!current) {
      throw new Error('Task not found');
    }

    const updatedTask = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
      labels: updates.labels ? JSON.stringify(updates.labels) : current.labels,
    };

    const update = db.prepare(`
      UPDATE tasks SET
        title = @title,
        description = @description,
        status = @status,
        priority = @priority,
        assigned_to = @assigned_to,
        updated_at = @updated_at,
        due_date = @due_date,
        estimated_hours = @estimated_hours,
        labels = @labels
      WHERE id = @id
    `);

    update.run(updatedTask);

    return {
      ...updatedTask,
      labels: JSON.parse(updatedTask.labels as string),
    };
  },

  deleteTask: (id: string): void => {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  },

  generateTicketId: (): string => {
    const prefix = 'TASK';
    const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  },
}; 