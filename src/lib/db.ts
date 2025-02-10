import { v4 as uuidv4 } from 'uuid';
import type { Task, User, AuthResponse, ChatMessage } from './types';

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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    labels: ['getting-started', 'documentation'],
    estimated_hours: 0.5
  },
  {
    id: uuidv4(),
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    labels: ['features', 'tutorial'],
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_hours: 2
  },
  {
    id: uuidv4(),
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    labels: ['chat', 'collaboration'],
    estimated_hours: 1
  },
  {
    id: uuidv4(),
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    labels: ['tools', 'advanced'],
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_hours: 1.5
  },
  {
    id: uuidv4(),
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    labels: ['example', 'tutorial'],
    estimated_hours: 0.5
  }
];

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

// Initialize with sample data if empty
async function initializeSampleData() {
  const taskCount = await dbService.getTaskCount();
  const messages = await dbService.getMessages();
  
  if (taskCount === 0) {
    for (const task of sampleTasks) {
      await dbService.createTask(task);
    }
  }

  if (messages.length === 0) {
    for (const message of sampleMessages) {
      await dbService.createMessage(message);
    }
  }
}

class DbService {
  private tasks: Task[] = [];
  private users: User[] = [];
  private messages: ChatMessage[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    const storedTasks = localStorage.getItem('tasks');
    const storedUsers = localStorage.getItem('users');
    const storedMessages = localStorage.getItem('messages');

    if (storedTasks) {
      this.tasks = JSON.parse(storedTasks);
    } else {
      // Initialize with sample tasks if no tasks exist
      this.tasks = [...sampleTasks];
      this.persistTasks();
    }

    if (storedUsers) {
      this.users = JSON.parse(storedUsers);
    }

    if (storedMessages) {
      this.messages = JSON.parse(storedMessages);
    } else {
      // Initialize with sample messages if no messages exist
      this.messages = [...sampleMessages];
      this.persistMessages();
    }

    // Create a system user if it doesn't exist
    if (!this.users.find(u => u.id === 'system')) {
      const systemUser: User = {
        id: 'system',
        ticket_id: 'USER-0000',
        username: 'System',
        email: 'system@kanban.local',
        password: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.users.push(systemUser);
      this.persistUsers();
    }

    this.initialized = true;
  }

  private persistTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  private persistUsers() {
    localStorage.setItem('users', JSON.stringify(this.users));
  }

  private persistMessages() {
    localStorage.setItem('messages', JSON.stringify(this.messages));
  }

  async getTaskCount(): Promise<number> {
    return this.tasks.length;
  }

  async getTasks(): Promise<Task[]> {
    return [...this.tasks];
  }

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      created_at: now,
      updated_at: now,
    };

    this.tasks.push(newTask);
    this.persistTasks();
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const updatedTask = {
      ...this.tasks[taskIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.tasks[taskIndex] = updatedTask;
    this.persistTasks();
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    this.tasks.splice(taskIndex, 1);
    this.persistTasks();
  }

  generateTicketId(prefix: string = 'TICKET'): string {
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `${prefix}-${randomNum}`;
  }

  // Authentication methods
  async signUp(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const existingUser = this.users.find(
      u => u.email === data.email || u.username === data.username
    );

    if (existingUser) {
      throw new Error('User already exists');
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: uuidv4(),
      ticket_id: this.generateTicketId('USER'),  // Using ticket system for users
      username: data.username,
      email: data.email,
      password: data.password, // In a real app, this would be hashed
      created_at: now,
      updated_at: now,
    };

    this.users.push(newUser);
    this.persistUsers();

    const { password, ...userWithoutPassword } = newUser;
    return {
      user: userWithoutPassword,
      token: uuidv4(), // In a real app, this would be a JWT
    };
  }

  async signIn(data: { email: string; password: string }): Promise<AuthResponse> {
    const user = this.users.find(
      u => u.email === data.email && u.password === data.password
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token: uuidv4(), // In a real app, this would be a JWT
    };
  }

  async getUser(id: string): Promise<Omit<User, 'password'> | null> {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Message methods
  async getMessages(): Promise<ChatMessage[]> {
    return [...this.messages];
  }

  async createMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      ...message,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };

    this.messages.push(newMessage);
    this.persistMessages();
    return newMessage;
  }

  async updateMessage(id: string, updates: Partial<ChatMessage>): Promise<ChatMessage> {
    const messageIndex = this.messages.findIndex(m => m.id === id);
    if (messageIndex === -1) {
      throw new Error('Message not found');
    }

    const updatedMessage = {
      ...this.messages[messageIndex],
      ...updates,
    };

    this.messages[messageIndex] = updatedMessage;
    this.persistMessages();
    return updatedMessage;
  }

  async deleteMessage(id: string): Promise<void> {
    const messageIndex = this.messages.findIndex(m => m.id === id);
    if (messageIndex === -1) {
      throw new Error('Message not found');
    }

    this.messages.splice(messageIndex, 1);
    this.persistMessages();
  }
}

export const dbService = new DbService(); 