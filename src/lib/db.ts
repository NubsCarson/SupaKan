import { v4 as uuidv4 } from 'uuid';
import type { User, Task, ChatMessage } from './types';

const DB_NAME = 'kanban_db';
const DB_VERSION = 1;

const STORES = {
  USERS: 'users',
  TASKS: 'tasks',
  MESSAGES: 'messages',
} as const;

// Simple wrapper for IDBRequest
function wrapRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

class DbService {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;

    // Check if IndexedDB is available
    if (!window.indexedDB) {
      throw new Error('Your browser does not support IndexedDB. Please use a modern browser.');
    }

    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
          const error = request.error;
          console.error('Failed to open database:', error);
          if (error?.name === 'SecurityError') {
            reject(new Error('Access to IndexedDB was blocked. Please check your browser settings.'));
          } else if (error?.name === 'QuotaExceededError') {
            reject(new Error('Not enough storage space available. Please free up some space.'));
          } else {
            reject(error || new Error('Failed to initialize database'));
          }
        };

        request.onblocked = () => {
          reject(new Error('Database initialization was blocked. Please close other tabs with this app.'));
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Create users store if it doesn't exist
          if (!db.objectStoreNames.contains(STORES.USERS)) {
            const userStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
            userStore.createIndex('email', 'email', { unique: true });
          }

          // Create tasks store if it doesn't exist
          if (!db.objectStoreNames.contains(STORES.TASKS)) {
            const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
            taskStore.createIndex('status', 'status', { unique: false });
            taskStore.createIndex('created_at', 'created_at', { unique: false });
          }

          // Create messages store if it doesn't exist
          if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
            const messageStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
            messageStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };

        request.onsuccess = async () => {
          try {
            this.db = request.result;
            
            // Add error handler for database connection
            this.db.onerror = (event) => {
              console.error('Database error:', (event.target as IDBOpenDBRequest).error);
            };

            await this.initializeSampleData();
            resolve();
          } catch (error) {
            console.error('Error during database initialization:', error);
            reject(error);
          }
        };
      } catch (error) {
        console.error('Critical error during database setup:', error);
        reject(error);
      }
    });
  }

  async signUp(data: { username: string; email: string; password: string }) {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(STORES.USERS, 'readwrite');
    const store = transaction.objectStore(STORES.USERS);
    const emailIndex = store.index('email');

    // Check if email exists
    const existingUser = await wrapRequest(emailIndex.get(data.email));
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Create new user
    const user = {
      id: uuidv4(),
      username: data.username,
      email: data.email,
      password: data.password, // In a real app, this should be hashed
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ticket_id: `USER-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    };

    await wrapRequest(store.add(user));
    
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  async signIn(data: { email: string; password: string }) {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(STORES.USERS, 'readonly');
    const store = transaction.objectStore(STORES.USERS);
    const emailIndex = store.index('email');

    const user = await wrapRequest(emailIndex.get(data.email));
    
    if (!user || user.password !== data.password) {
      throw new Error('Invalid email or password');
    }

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(STORES.TASKS, 'readonly');
    const store = transaction.objectStore(STORES.TASKS);
    return wrapRequest(store.getAll());
  }

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    if (!this.db) throw new Error('Database not initialized');
    
    const newTask: Task = {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...task,
    };

    const transaction = this.db.transaction(STORES.TASKS, 'readwrite');
    const store = transaction.objectStore(STORES.TASKS);
    await wrapRequest(store.add(newTask));
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(STORES.TASKS, 'readwrite');
    const store = transaction.objectStore(STORES.TASKS);
    
    const task = await wrapRequest(store.get(id));
    if (!task) throw new Error('Task not found');

    const updatedTask = {
      ...task,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await wrapRequest(store.put(updatedTask));
  }

  async deleteTask(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(STORES.TASKS, 'readwrite');
    const store = transaction.objectStore(STORES.TASKS);
    await wrapRequest(store.delete(id));
  }

  // Message methods
  async getMessages(): Promise<ChatMessage[]> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(STORES.MESSAGES, 'readonly');
    const store = transaction.objectStore(STORES.MESSAGES);
    return wrapRequest(store.getAll());
  }

  async createMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    if (!this.db) throw new Error('Database not initialized');
    
    const newMessage: ChatMessage = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...message,
    };

    const transaction = this.db.transaction(STORES.MESSAGES, 'readwrite');
    const store = transaction.objectStore(STORES.MESSAGES);
    await wrapRequest(store.add(newMessage));
    return newMessage;
  }

  async updateMessage(id: string, updates: Partial<ChatMessage>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(STORES.MESSAGES, 'readwrite');
    const store = transaction.objectStore(STORES.MESSAGES);
    
    const message = await wrapRequest(store.get(id));
    if (!message) throw new Error('Message not found');

    const updatedMessage = {
      ...message,
      ...updates,
      edited_at: new Date().toISOString(),
    };

    await wrapRequest(store.put(updatedMessage));
  }

  async deleteMessage(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(STORES.MESSAGES, 'readwrite');
    const store = transaction.objectStore(STORES.MESSAGES);
    await wrapRequest(store.delete(id));
  }

  // User methods
  async getUser(id: string): Promise<Omit<User, 'password'> | null> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(STORES.USERS, 'readonly');
    const store = transaction.objectStore(STORES.USERS);
    const user = await wrapRequest(store.get(id));
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Helper methods
  private async initializeSampleData() {
    try {
      // Only initialize if no data exists
      const tasks = await this.getTasks();
      if (tasks.length > 0) return;

      // Sample tasks
      const sampleTasks: Omit<Task, 'id' | 'created_at' | 'updated_at'>[] = [
        {
          title: '👋 Welcome to Kanban Board!',
          description: `
            <h3>Getting Started Guide</h3>
            <p>Welcome to your new Kanban board! Here are some tips to help you get started:</p>
            <ul>
              <li>Drag and drop tasks between columns to update their status</li>
              <li>Click the "New Task" button to create your own tasks</li>
              <li>Use the rich text editor to format task descriptions</li>
              <li>Try the chat panel to collaborate with your team</li>
            </ul>
          `,
          status: 'todo',
          priority: 'high',
          ticket_id: 'TASK-0001',
          created_by: 'system',
          assigned_to: null,
          labels: ['getting-started', 'documentation'],
          estimated_hours: 0.5
        },
        {
          title: '📝 Task Management Features',
          description: `
            <h3>Key Features</h3>
            <ul>
              <li>Set priority levels (low, medium, high)</li>
              <li>Add due dates and time estimates</li>
              <li>Assign tasks to team members</li>
              <li>Add labels for organization</li>
              <li>Track task progress across columns</li>
            </ul>
            <p>Try editing this task to explore these features!</p>
          `,
          status: 'in_progress',
          priority: 'medium',
          ticket_id: 'TASK-0002',
          created_by: 'system',
          assigned_to: null,
          labels: ['features', 'tutorial'],
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          estimated_hours: 2
        },
        {
          title: '💬 Chat System Overview',
          description: `
            <h3>Chat Features</h3>
            <ul>
              <li>Real-time team communication</li>
              <li>Pin important messages</li>
              <li>Like and reply to messages</li>
              <li>Mention team members using @username</li>
              <li>Link messages to specific tasks</li>
            </ul>
            <p>Try using the chat panel on the right to communicate with your team!</p>
          `,
          status: 'backlog',
          priority: 'low',
          ticket_id: 'TASK-0003',
          created_by: 'system',
          assigned_to: null,
          labels: ['chat', 'collaboration'],
          estimated_hours: 1
        },
        {
          title: '📊 Monitor & Database Tools',
          description: `
            <h3>Advanced Features</h3>
            <p>Check out these powerful tools:</p>
            <ul>
              <li><strong>System Monitor:</strong> Real-time metrics and activity logs</li>
              <li><strong>Database Explorer:</strong> View data structure and sample records</li>
            </ul>
            <p>Click the icons in the top navigation to explore these features!</p>
          `,
          status: 'todo',
          priority: 'medium',
          ticket_id: 'TASK-0004',
          created_by: 'system',
          assigned_to: null,
          labels: ['tools', 'advanced'],
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          estimated_hours: 1.5
        },
        {
          title: '✨ Try Creating a New Task',
          description: `
            <h3>Create Your First Task</h3>
            <p>Ready to add your own task? Here's how:</p>
            <ol>
              <li>Click the "New Task" button at the top</li>
              <li>Fill in the task details</li>
              <li>Use the rich text editor for formatting</li>
              <li>Set priority, due date, and time estimate</li>
              <li>Add labels for organization</li>
            </ol>
            <p>Give it a try now!</p>
          `,
          status: 'done',
          priority: 'low',
          ticket_id: 'TASK-0005',
          created_by: 'system',
          assigned_to: null,
          labels: ['example', 'tutorial'],
          estimated_hours: 0.5
        }
      ];

      // Create sample tasks
      for (const task of sampleTasks) {
        await this.createTask(task);
      }

      // Sample messages
      const sampleMessages: ChatMessage[] = [
        {
          id: uuidv4(),
          content: '👋 Welcome to the team chat! This is where you can collaborate with your team members.',
          user_id: 'system',
          timestamp: new Date().toISOString(),
          likes: [],
          is_pinned: true,
          mentions: [],
        },
        {
          id: uuidv4(),
          content: '💡 Tip: You can pin important messages, like announcements or guidelines, by clicking the pin icon.',
          user_id: 'system',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          likes: [],
          is_pinned: true,
          mentions: [],
        },
        {
          id: uuidv4(),
          content: '🔍 Try mentioning team members using @username or linking to tasks using their ticket IDs (e.g., TASK-0001)',
          user_id: 'system',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          likes: [],
          is_pinned: false,
          mentions: [],
        }
      ];

      // Create sample messages
      for (const message of sampleMessages) {
        await this.createMessage(message);
      }

      console.log('Sample data initialized');
    } catch (error) {
      console.error('Failed to initialize sample data:', error);
    }
  }

  generateTicketId(): string {
    return `TASK-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  }
}

export const dbService = new DbService();