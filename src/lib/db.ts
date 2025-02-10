import { v4 as uuidv4 } from 'uuid';
import type { Task } from './types';

const DB_NAME = 'kanban_db';
const STORE_NAME = 'tasks';
const DB_VERSION = 1;

let db: IDBDatabase;

const dbPromise = new Promise<void>((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onerror = () => reject(request.error);
  request.onsuccess = () => {
    db = request.result;
    resolve();
  };

  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('status', 'status', { unique: false });
      store.createIndex('created_at', 'created_at', { unique: false });
    }
  };
});

// Sample data
const sampleTasks: Task[] = [
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

// Initialize with sample data if empty
async function initializeSampleData() {
  const count = await dbService.getTaskCount();
  if (count === 0) {
    for (const task of sampleTasks) {
      await dbService.createTask(task);
    }
  }
}

export const dbService = {
  initialize: async () => {
    await dbPromise;
    await initializeSampleData();
  },

  getTaskCount: (): Promise<number> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const countRequest = store.count();
      
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
  },

  getTasks: (): Promise<Task[]> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> => {
    return new Promise((resolve, reject) => {
      const newTask: Task = {
        ...task,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(newTask);

      request.onsuccess = () => resolve(newTask);
      request.onerror = () => reject(request.error);
    });
  },

  updateTask: (id: string, updates: Partial<Task>): Promise<Task> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const task = getRequest.result;
        if (!task) {
          reject(new Error('Task not found'));
          return;
        }

        const updatedTask = {
          ...task,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        const putRequest = store.put(updatedTask);
        putRequest.onsuccess = () => resolve(updatedTask);
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  },

  deleteTask: (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  generateTicketId: (): string => {
    const prefix = 'TASK';
    const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  },
}; 