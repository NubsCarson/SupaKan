import { supabase } from './supabase';
import { createTeam } from './teams';
import { createBoard } from './boards';

export async function initializeWorkspace(userId: string) {
  try {
    // Create default team
    const team = await createTeam('My Workspace', userId);
    console.log('Created team:', team);

    // Create default board
    const board = await createBoard({
      title: 'My First Board',
      teamId: team.id,
      createdBy: userId,
    });
    console.log('Created board:', board);

    // Create sample tasks
    const tasks = [
      {
        title: 'Welcome to Kanban!',
        description: 'This is your first task. Try dragging it to another column!',
        status: 'todo',
        priority: 'medium',
        ticket_id: 'TASK-1',
        team_id: team.id,
        board_id: board.id,
        created_by: userId,
        position: 65536,
      },
      {
        title: 'Create your first task',
        description: 'Click the "New Task" button above to create your own task.',
        status: 'todo',
        priority: 'low',
        ticket_id: 'TASK-2',
        team_id: team.id,
        board_id: board.id,
        created_by: userId,
        position: 131072,
      },
    ];

    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(tasks);

    if (tasksError) throw tasksError;
    console.log('Created sample tasks');

    return { team, board };
  } catch (error) {
    console.error('Error initializing workspace:', error);
    throw error;
  }
} 