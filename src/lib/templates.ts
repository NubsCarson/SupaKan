import type { Database } from './database.types';

export type TaskTemplate = {
  title: string;
  description: string;
  status: Database['public']['Tables']['tasks']['Row']['status'];
  priority: Database['public']['Tables']['tasks']['Row']['priority'];
  position: number;
  labels: string[];
  estimated_hours?: number;
};

export type BoardTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tasks: TaskTemplate[];
};

export const PROJECT_TEMPLATES: BoardTemplate[] = [
  {
    id: 'software-development',
    name: 'Software Development',
    description: 'Ideal for software development teams using Agile/Scrum methodology',
    icon: '💻',
    tasks: [
      {
        title: 'Set up development environment',
        description: 'Install and configure all necessary development tools and dependencies',
        status: 'todo',
        priority: 'high',
        position: 65536,
        labels: ['setup', 'development'],
        estimated_hours: 4
      },
      {
        title: 'Create database schema',
        description: 'Design and implement the initial database structure',
        status: 'todo',
        priority: 'high',
        position: 131072,
        labels: ['database', 'architecture'],
        estimated_hours: 8
      },
      {
        title: 'Implement user authentication',
        description: 'Set up secure user authentication system with login/signup flows',
        status: 'backlog',
        priority: 'high',
        position: 65536,
        labels: ['security', 'user-management'],
        estimated_hours: 12
      },
      {
        title: 'Write API documentation',
        description: 'Create comprehensive API documentation using OpenAPI/Swagger',
        status: 'backlog',
        priority: 'medium',
        position: 131072,
        labels: ['documentation', 'api'],
        estimated_hours: 6
      }
    ]
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    description: 'Perfect for planning and executing marketing campaigns',
    icon: '📢',
    tasks: [
      {
        title: 'Define target audience',
        description: 'Research and document the primary and secondary target audiences',
        status: 'todo',
        priority: 'high',
        position: 65536,
        labels: ['research', 'planning'],
        estimated_hours: 4
      },
      {
        title: 'Create content calendar',
        description: 'Plan out content topics, formats, and publishing schedule',
        status: 'todo',
        priority: 'high',
        position: 131072,
        labels: ['content', 'planning'],
        estimated_hours: 6
      },
      {
        title: 'Design social media assets',
        description: 'Create visual assets for various social media platforms',
        status: 'backlog',
        priority: 'medium',
        position: 65536,
        labels: ['design', 'social-media'],
        estimated_hours: 8
      },
      {
        title: 'Set up analytics tracking',
        description: 'Implement tracking for campaign metrics and KPIs',
        status: 'backlog',
        priority: 'medium',
        position: 131072,
        labels: ['analytics', 'setup'],
        estimated_hours: 4
      }
    ]
  },
  {
    id: 'product-design',
    name: 'Product Design',
    description: 'Structured workflow for product design and UX teams',
    icon: '🎨',
    tasks: [
      {
        title: 'User Research',
        description: 'Conduct user interviews and analyze user behavior data',
        status: 'todo',
        priority: 'high',
        position: 65536,
        labels: ['research', 'ux'],
        estimated_hours: 12
      },
      {
        title: 'Create wireframes',
        description: 'Design low-fidelity wireframes for key user flows',
        status: 'todo',
        priority: 'high',
        position: 131072,
        labels: ['design', 'wireframes'],
        estimated_hours: 8
      },
      {
        title: 'Design system update',
        description: 'Update design system with new components and patterns',
        status: 'backlog',
        priority: 'medium',
        position: 65536,
        labels: ['design-system', 'documentation'],
        estimated_hours: 16
      },
      {
        title: 'Usability testing',
        description: 'Plan and conduct usability testing sessions',
        status: 'backlog',
        priority: 'medium',
        position: 131072,
        labels: ['testing', 'ux'],
        estimated_hours: 8
      }
    ]
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Comprehensive template for managing product launches',
    icon: '🚀',
    tasks: [
      {
        title: 'Market analysis',
        description: 'Research competitors and market opportunities',
        status: 'todo',
        priority: 'high',
        position: 65536,
        labels: ['research', 'strategy'],
        estimated_hours: 12
      },
      {
        title: 'Create launch timeline',
        description: 'Define key milestones and deadlines for the launch',
        status: 'todo',
        priority: 'high',
        position: 131072,
        labels: ['planning', 'timeline'],
        estimated_hours: 4
      },
      {
        title: 'Prepare press kit',
        description: 'Create press releases and media materials',
        status: 'backlog',
        priority: 'medium',
        position: 65536,
        labels: ['marketing', 'pr'],
        estimated_hours: 8
      },
      {
        title: 'Beta testing program',
        description: 'Set up and manage beta testing program',
        status: 'backlog',
        priority: 'medium',
        position: 131072,
        labels: ['testing', 'feedback'],
        estimated_hours: 16
      }
    ]
  }
]; 