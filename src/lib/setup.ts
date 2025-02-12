import { supabase } from './supabase';
import { createTeam } from './teams';
import { createBoard, createTask, type Task } from './boards';

export async function initializeWorkspace(teamId: string, userId: string) {
  try {
    // Create default board
    const board = await createBoard({
      name: 'Project Board',
      description: 'Welcome to your first Kanban board!',
      teamId: teamId,
      createdBy: userId,
    });
    console.log('Created board:', board);

    // Create rich sample tasks
    const tasks = [
      {
        title: '👋 Welcome to Kanban Board!',
        description: `<h3>Getting Started Guide</h3>
<p>Welcome to your new Kanban board! Here are some tips to help you get started:</p>
<ul>
  <li>Drag and drop tasks between columns to update their status</li>
  <li>Click the "New Task" button to create your own tasks</li>
  <li>Use the rich text editor to format task descriptions</li>
  <li>Try the chat panel to collaborate with your team</li>
</ul>`,
        status: 'todo' as Task['status'],
        priority: 'high' as Task['priority'],
        boardId: board.id,
        teamId: teamId,
        createdBy: userId,
        position: 65536,
        labels: ['getting-started', 'documentation'],
      },
      {
        title: '📝 Task Management Features',
        description: `<h3>Key Features</h3>
<ul>
  <li>Set priority levels (low, medium, high)</li>
  <li>Add due dates and time estimates</li>
  <li>Assign tasks to team members</li>
  <li>Add labels for organization</li>
  <li>Track task progress across columns</li>
</ul>
<p>Try editing this task to explore these features!</p>`,
        status: 'in_progress' as Task['status'],
        priority: 'medium' as Task['priority'],
        boardId: board.id,
        teamId: teamId,
        createdBy: userId,
        position: 131072,
        labels: ['features', 'tutorial'],
      },
      {
        title: '💬 Chat System Overview',
        description: `<h3>Chat Features</h3>
<ul>
  <li>Real-time team communication</li>
  <li>Pin important messages</li>
  <li>Like and reply to messages</li>
  <li>Mention team members using @username</li>
  <li>Link messages to specific tasks</li>
</ul>
<p>Try using the chat panel on the right to communicate with your team!</p>`,
        status: 'backlog' as Task['status'],
        priority: 'low' as Task['priority'],
        boardId: board.id,
        teamId: teamId,
        createdBy: userId,
        position: 196608,
        labels: ['chat', 'collaboration'],
      },
      {
        title: '📊 Monitor & Database Tools',
        description: `<h3>Advanced Features</h3>
<p>Check out these powerful tools:</p>
<ul>
  <li><strong>System Monitor:</strong> Real-time metrics and activity logs</li>
  <li><strong>Database Explorer:</strong> View data structure and sample records</li>
</ul>
<p>Click the icons in the top navigation to explore these features!</p>`,
        status: 'todo' as Task['status'],
        priority: 'medium' as Task['priority'],
        boardId: board.id,
        teamId: teamId,
        createdBy: userId,
        position: 262144,
        labels: ['tools', 'advanced'],
      },
      {
        title: '✨ Try Creating a New Task',
        description: `<h3>Create Your First Task</h3>
<p>Ready to add your own task? Here's how:</p>
<ol>
  <li>Click the "New Task" button at the top</li>
  <li>Fill in the task details</li>
  <li>Use the rich text editor for formatting</li>
  <li>Set priority, due date, and time estimate</li>
  <li>Add labels for organization</li>
</ol>
<p>Give it a try now!</p>`,
        status: 'done' as Task['status'],
        priority: 'low' as Task['priority'],
        boardId: board.id,
        teamId: teamId,
        createdBy: userId,
        position: 327680,
        labels: ['example', 'tutorial'],
      },
    ];

    // Create tasks one by one using createTask
    await Promise.all(tasks.map(task => createTask(task)));
    console.log('Created sample tasks');

    // Create welcome message
    await supabase
      .from('messages')
      .insert({
        content: '👋 Welcome to the team chat! This is where you can collaborate with your team members.',
        team_id: teamId,
        user_id: userId,
        is_pinned: true,
      });

    return { board };
  } catch (error) {
    console.error('Error initializing workspace:', error);
    throw error;
  }
} 