-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";

-- Drop existing objects to start fresh
DROP FUNCTION IF EXISTS update_task_positions(task_position_update[]);
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS boards CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TYPE IF EXISTS task_position_update;

-- Create teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'guest')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(team_id, user_id)
);

-- Create boards table
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'done')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    position FLOAT NOT NULL DEFAULT 0,
    ticket_id TEXT NOT NULL UNIQUE,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    estimated_hours FLOAT,
    labels TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    likes UUID[] DEFAULT '{}',
    mentions UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at TIMESTAMPTZ
);

-- Create messages view
CREATE VIEW messages_with_users AS
SELECT 
    m.*,
    json_build_object(
        'id', u.id,
        'email', u.email,
        'created_at', u.created_at,
        'updated_at', u.updated_at
    ) as message_user
FROM messages m
LEFT JOIN auth.users u ON m.user_id = u.id;

-- Create indexes
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_boards_team_id ON boards(team_id);
CREATE INDEX idx_tasks_board_id ON tasks(board_id);
CREATE INDEX idx_tasks_team_id ON tasks(team_id);
CREATE INDEX idx_messages_team_id ON messages(team_id);

-- Create task position update type
CREATE TYPE task_position_update AS (
    id UUID,
    position FLOAT
);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at
    BEFORE UPDATE ON boards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update task positions
CREATE OR REPLACE FUNCTION update_task_positions(task_positions task_position_update[])
RETURNS void AS $$
BEGIN
    -- Verify user has access to all tasks
    IF NOT EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.id = ANY(SELECT (tp).id FROM unnest(task_positions) tp)
        AND EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = t.team_id
            AND tm.user_id = auth.uid()
        )
    ) THEN
        RAISE EXCEPTION 'Access denied to one or more tasks';
    END IF;

    -- Update task positions
    UPDATE tasks t
    SET position = tp.position
    FROM (
        SELECT (tp).id, (tp).position
        FROM unnest(task_positions) tp
    ) tp
    WHERE t.id = tp.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure new user has a team
CREATE OR REPLACE FUNCTION ensure_user_has_team()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    _team_id UUID;
    _board_id UUID;
    _position FLOAT;
BEGIN
    -- Only proceed if this is a new user
    IF TG_OP = 'INSERT' THEN
        -- Create their first team
        INSERT INTO teams (name, created_by)
        VALUES ('My Team', NEW.id)
        RETURNING id INTO _team_id;

        -- Make them an owner of the team
        INSERT INTO team_members (team_id, user_id, role)
        VALUES (_team_id, NEW.id, 'owner');

        -- Create default board
        INSERT INTO boards (name, description, team_id, created_by)
        VALUES ('My First Board', 'Welcome to your first Kanban board!', _team_id, NEW.id)
        RETURNING id INTO _board_id;

        -- Create example tasks with different positions
        -- Backlog
        _position := 65536;
        INSERT INTO tasks (
            title, description, status, priority, position,
            ticket_id, board_id, team_id, created_by
        ) VALUES (
            'Welcome to Kanban!',
            'This is an example task in your backlog. Feel free to edit or delete it.',
            'backlog', 'medium', _position,
            'TASK-001', _board_id, _team_id, NEW.id
        );

        -- Todo
        _position := _position + 65536;
        INSERT INTO tasks (
            title, description, status, priority, position,
            ticket_id, board_id, team_id, created_by
        ) VALUES (
            'Create your first task',
            'Click the "New Task" button to create your own task.',
            'todo', 'high', _position,
            'TASK-002', _board_id, _team_id, NEW.id
        );

        -- In Progress
        _position := _position + 65536;
        INSERT INTO tasks (
            title, description, status, priority, position,
            ticket_id, board_id, team_id, created_by,
            labels
        ) VALUES (
            'Try dragging tasks',
            'You can drag and drop tasks between columns to update their status.',
            'in_progress', 'medium', _position,
            'TASK-003', _board_id, _team_id, NEW.id,
            ARRAY['example', 'tutorial']
        );

        -- In Review
        _position := _position + 65536;
        INSERT INTO tasks (
            title, description, status, priority, position,
            ticket_id, board_id, team_id, created_by,
            due_date
        ) VALUES (
            'Set due dates',
            'Tasks can have due dates, labels, and priority levels.',
            'in_review', 'low', _position,
            'TASK-004', _board_id, _team_id, NEW.id,
            NOW() + INTERVAL '7 days'
        );

        -- Done
        _position := _position + 65536;
        INSERT INTO tasks (
            title, description, status, priority, position,
            ticket_id, board_id, team_id, created_by
        ) VALUES (
            'Complete setup',
            'Congratulations! Your board is ready to use.',
            'done', 'medium', _position,
            'TASK-005', _board_id, _team_id, NEW.id
        );

        -- Create welcome message
        INSERT INTO messages (
            content,
            team_id,
            user_id,
            is_pinned
        ) VALUES (
            'Welcome to your team workspace! 👋 Here you can chat with your team members, share updates, and collaborate on tasks. Need help? Check out the example tasks on your board.',
            _team_id,
            NEW.id,
            true
        );
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in ensure_user_has_team: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS ensure_user_has_team_trigger ON auth.users;
CREATE TRIGGER ensure_user_has_team_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION ensure_user_has_team();

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Team access" ON teams;
DROP POLICY IF EXISTS "Team members select" ON team_members;
DROP POLICY IF EXISTS "Team members insert" ON team_members;
DROP POLICY IF EXISTS "Team members delete" ON team_members;
DROP POLICY IF EXISTS "Board access" ON boards;
DROP POLICY IF EXISTS "Task access" ON tasks;
DROP POLICY IF EXISTS "Message access" ON messages;

-- Team access - you can see teams you created or are a member of
CREATE POLICY "Team access" ON teams FOR ALL USING (
    created_by = auth.uid()
);

-- Team members access - you can see members of teams you created or are a member of
CREATE POLICY "Team members access" ON team_members FOR ALL USING (
    user_id = auth.uid()
);

-- Board access - you can see boards of teams you created or are a member of
CREATE POLICY "Board access" ON boards FOR ALL USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = boards.team_id 
        AND team_members.user_id = auth.uid()
    )
);

-- Task access - you can see tasks of teams you created or are a member of
CREATE POLICY "Task access" ON tasks FOR ALL USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = tasks.team_id 
        AND team_members.user_id = auth.uid()
    )
);

-- Message access - you can see messages of teams you created or are a member of
CREATE POLICY "Message access" ON messages FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = messages.team_id 
        AND team_members.user_id = auth.uid()
    )
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Ensure the functions have necessary permissions
GRANT EXECUTE ON FUNCTION ensure_user_has_team() TO postgres;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO postgres;
GRANT EXECUTE ON FUNCTION update_task_positions(task_position_update[]) TO authenticated; 