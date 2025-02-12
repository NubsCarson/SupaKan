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
DROP VIEW IF EXISTS messages_with_users;
DROP VIEW IF EXISTS team_members_with_users;

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
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
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

-- Create team members view
CREATE VIEW team_members_with_users AS
SELECT 
    tm.*,
    u.email as user_email
FROM team_members tm
JOIN auth.users u ON tm.user_id = u.id;

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
CREATE OR REPLACE FUNCTION ensure_user_has_team(input_user_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
    _team_id UUID;
    _board_id UUID;
    _position FLOAT;
    _ticket_id TEXT;
BEGIN
    -- Create their first team if they don't have one
    IF NOT EXISTS (
        SELECT 1 
        FROM teams t
        WHERE t.created_by = input_user_id 
        OR EXISTS (
            SELECT 1 FROM team_members tm 
            WHERE tm.team_id = t.id 
            AND tm.user_id = input_user_id
        )
    ) THEN
        -- Create their first team
        INSERT INTO teams (name, created_by)
        VALUES ('My Team', input_user_id)
        RETURNING id INTO _team_id;

        -- Make them an owner of the team
        INSERT INTO team_members (team_id, user_id, role)
        VALUES (_team_id, input_user_id, 'owner');

        -- Create default board
        INSERT INTO boards (name, description, team_id, created_by)
        VALUES ('Project Board', 'Welcome to your first Kanban board!', _team_id, input_user_id)
        RETURNING id INTO _board_id;

        -- Create example tasks with different positions
        -- Backlog
        _position := 65536;
        _ticket_id := 'T-' || substr(md5(random()::text), 1, 8);
        INSERT INTO tasks (
            title, description, status, priority, position,
            ticket_id, board_id, team_id, created_by,
            labels
        ) VALUES (
            '👋 Welcome to Kanban Board!',
            E'<h3>Getting Started Guide</h3>\n' ||
            E'<p>Welcome to your new Kanban board! Here are some tips to help you get started:</p>\n' ||
            E'<ul>\n' ||
            E'  <li>Drag and drop tasks between columns to update their status</li>\n' ||
            E'  <li>Click the "New Task" button to create your own tasks</li>\n' ||
            E'  <li>Use the rich text editor to format task descriptions</li>\n' ||
            E'  <li>Try the chat panel to collaborate with your team</li>\n' ||
            E'</ul>\n' ||
            E'<p>Try editing this task to explore these features!</p>',
            'todo', 'high', _position,
            _ticket_id, _board_id, _team_id, input_user_id,
            ARRAY['getting-started', 'documentation']
        );

        -- Todo
        _position := _position + 65536;
        _ticket_id := 'T-' || substr(md5(random()::text), 1, 8);
        INSERT INTO tasks (
            title, description, status, priority, position,
            ticket_id, board_id, team_id, created_by,
            labels
        ) VALUES (
            '📝 Task Management Features',
            E'<h3>Key Features</h3>\n' ||
            E'<ul>\n' ||
            E'  <li>Set priority levels (low, medium, high)</li>\n' ||
            E'  <li>Add due dates and time estimates</li>\n' ||
            E'  <li>Assign tasks to team members</li>\n' ||
            E'  <li>Add labels for organization</li>\n' ||
            E'  <li>Track task progress across columns</li>\n' ||
            E'</ul>\n' ||
            E'<p>Try editing this task to explore these features!</p>',
            'in_progress', 'medium', _position,
            _ticket_id, _board_id, _team_id, input_user_id,
            ARRAY['features', 'tutorial']
        );

        -- In Progress
        _position := _position + 65536;
        _ticket_id := 'T-' || substr(md5(random()::text), 1, 8);
        INSERT INTO tasks (
            title, description, status, priority, position,
            ticket_id, board_id, team_id, created_by,
            labels
        ) VALUES (
            '💬 Chat System Overview',
            E'<h3>Chat Features</h3>\n' ||
            E'<ul>\n' ||
            E'  <li>Real-time team communication</li>\n' ||
            E'  <li>Pin important messages</li>\n' ||
            E'  <li>Like and reply to messages</li>\n' ||
            E'  <li>Mention team members using @username</li>\n' ||
            E'  <li>Link messages to specific tasks</li>\n' ||
            E'</ul>\n' ||
            E'<p>Try using the chat panel on the right to communicate with your team!</p>',
            'backlog', 'low', _position,
            _ticket_id, _board_id, _team_id, input_user_id,
            ARRAY['chat', 'collaboration']
        );

        -- In Review
        _position := _position + 65536;
        _ticket_id := 'T-' || substr(md5(random()::text), 1, 8);
        INSERT INTO tasks (
            title, description, status, priority, position,
            ticket_id, board_id, team_id, created_by,
            labels
        ) VALUES (
            '📊 Monitor & Database Tools',
            E'<h3>Advanced Features</h3>\n' ||
            E'<p>Check out these powerful tools:</p>\n' ||
            E'<ul>\n' ||
            E'  <li><strong>System Monitor:</strong> Real-time metrics and activity logs</li>\n' ||
            E'  <li><strong>Database Explorer:</strong> View data structure and sample records</li>\n' ||
            E'</ul>\n' ||
            E'<p>Click the icons in the top navigation to explore these features!</p>',
            'todo', 'medium', _position,
            _ticket_id, _board_id, _team_id, input_user_id,
            ARRAY['tools', 'advanced']
        );

        -- Done
        _position := _position + 65536;
        _ticket_id := 'T-' || substr(md5(random()::text), 1, 8);
        INSERT INTO tasks (
            title, description, status, priority, position,
            ticket_id, board_id, team_id, created_by,
            labels
        ) VALUES (
            '✨ Try Creating a New Task',
            E'<h3>Create Your First Task</h3>\n' ||
            E'<p>Ready to add your own task? Here''s how:</p>\n' ||
            E'<ol>\n' ||
            E'  <li>Click the "New Task" button at the top</li>\n' ||
            E'  <li>Fill in the task details</li>\n' ||
            E'  <li>Use the rich text editor for formatting</li>\n' ||
            E'  <li>Set priority, due date, and time estimate</li>\n' ||
            E'  <li>Add labels for organization</li>\n' ||
            E'</ol>\n' ||
            E'<p>Give it a try now!</p>',
            'done', 'low', _position,
            _ticket_id, _board_id, _team_id, input_user_id,
            ARRAY['example', 'tutorial']
        );

        -- Create welcome messages
        INSERT INTO messages (
            content,
            team_id,
            board_id,
            user_id,
            is_pinned
        ) VALUES (
            '👋 Welcome to the team chat! This is where you can collaborate with your team members.',
            _team_id,
            _board_id,
            input_user_id,
            true
        );

        RAISE NOTICE 'Successfully created team % for user %', _team_id, input_user_id;
    END IF;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS ensure_user_has_team_trigger ON auth.users;

CREATE OR REPLACE FUNCTION trigger_ensure_user_has_team()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the trigger execution
    RAISE NOTICE 'Executing trigger for user: %', NEW.id;
    
    BEGIN
        -- Try to ensure user has a team
        PERFORM ensure_user_has_team(NEW.id);
        RAISE NOTICE 'Successfully created team for user: %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't prevent user creation
        RAISE WARNING 'Error in trigger_ensure_user_has_team for user %: % %', NEW.id, SQLERRM, SQLSTATE;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Create the trigger
CREATE TRIGGER ensure_user_has_team_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_ensure_user_has_team();

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
DROP POLICY IF EXISTS "Team members update" ON team_members;
DROP POLICY IF EXISTS "Team members delete" ON team_members;
DROP POLICY IF EXISTS "Board access" ON boards;
DROP POLICY IF EXISTS "Task access" ON tasks;
DROP POLICY IF EXISTS "Message access" ON messages;

-- Team members access policies
CREATE POLICY "Team members select" ON team_members 
    FOR SELECT USING (
        user_id = auth.uid()
    );

CREATE POLICY "Team members insert" ON team_members 
    FOR INSERT WITH CHECK (
        -- Allow users to join any team
        true
    );

CREATE POLICY "Team members update" ON team_members 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_members.team_id
            AND (
                -- Allow team owners to update any member
                t.created_by = auth.uid()
                OR
                -- Allow admins to update non-owners
                EXISTS (
                    SELECT 1 FROM team_members tm
                    WHERE tm.team_id = team_members.team_id
                    AND tm.user_id = auth.uid()
                    AND tm.role = 'admin'
                    AND NOT EXISTS (
                        SELECT 1 FROM team_members tm2
                        WHERE tm2.id = team_members.id
                        AND tm2.role = 'owner'
                    )
                )
            )
        )
    );

CREATE POLICY "Team members delete" ON team_members 
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM teams t
            LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = auth.uid()
            WHERE t.id = team_members.team_id
            AND (
                t.created_by = auth.uid()  -- Team owner can remove anyone
                OR (tm.role = 'admin' AND NOT EXISTS (  -- Admin can remove non-owners
                    SELECT 1 FROM team_members tm2
                    WHERE tm2.id = team_members.id
                    AND tm2.role = 'owner'
                ))
                OR team_members.user_id = auth.uid()  -- Members can remove themselves
            )
        )
    );

-- Team access policies
CREATE POLICY "Team select" ON teams 
    FOR SELECT USING (
        -- Allow users to see all teams for joining purposes
        true
    );

CREATE POLICY "Team insert" ON teams 
    FOR INSERT WITH CHECK (
        created_by = auth.uid()
    );

CREATE POLICY "Team update" ON teams 
    FOR UPDATE USING (
        created_by = auth.uid()
    );

CREATE POLICY "Team delete" ON teams 
    FOR DELETE USING (
        created_by = auth.uid()
    );

-- Board access policies
CREATE POLICY "Board select" ON boards 
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = boards.team_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Board insert" ON boards 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = boards.team_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Board update" ON boards 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = boards.team_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Board delete" ON boards 
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = boards.team_id
            AND tm.user_id = auth.uid()
        )
    );

-- Task access policies
CREATE POLICY "Task select" ON tasks 
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = tasks.team_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Task insert" ON tasks 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = tasks.team_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Task update" ON tasks 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = tasks.team_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Task delete" ON tasks 
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = tasks.team_id
            AND tm.user_id = auth.uid()
        )
    );

-- Message access policies
CREATE POLICY "Message select" ON messages 
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM team_members tm
            JOIN boards b ON b.team_id = tm.team_id
            WHERE tm.team_id = messages.team_id
            AND b.id = messages.board_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Message insert" ON messages 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members tm
            JOIN boards b ON b.team_id = tm.team_id
            WHERE tm.team_id = messages.team_id
            AND b.id = messages.board_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Message update" ON messages 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            JOIN boards b ON b.team_id = tm.team_id
            WHERE tm.team_id = messages.team_id
            AND b.id = messages.board_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Message delete" ON messages 
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            JOIN boards b ON b.team_id = tm.team_id
            WHERE tm.team_id = messages.team_id
            AND b.id = messages.board_id
            AND tm.user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT USAGE ON SCHEMA auth TO postgres, authenticated, anon;
GRANT SELECT ON auth.users TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Ensure the functions have necessary permissions
GRANT EXECUTE ON FUNCTION ensure_user_has_team(UUID) TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION trigger_ensure_user_has_team() TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION update_task_positions(task_position_update[]) TO authenticated;

-- Make sure functions are owned by postgres
ALTER FUNCTION ensure_user_has_team(UUID) OWNER TO postgres;
ALTER FUNCTION trigger_ensure_user_has_team() OWNER TO postgres;
ALTER FUNCTION update_updated_at_column() OWNER TO postgres;
ALTER FUNCTION update_task_positions(task_position_update[]) OWNER TO postgres;

-- Function to remove team member with proper policy checks
CREATE OR REPLACE FUNCTION remove_team_member(p_member_id UUID, p_team_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete the member if policy conditions are met
    DELETE FROM team_members
    WHERE id = p_member_id
    AND team_id = p_team_id
    AND EXISTS (
        SELECT 1 FROM teams t
        LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = auth.uid()
        WHERE t.id = p_team_id
        AND (
            t.created_by = auth.uid()  -- Team owner can remove anyone
            OR (tm.role = 'admin' AND NOT EXISTS (  -- Admin can remove non-owners
                SELECT 1 FROM team_members tm2
                WHERE tm2.id = p_member_id
                AND tm2.role = 'owner'
            ))
            OR team_members.user_id = auth.uid()  -- Members can remove themselves
        )
    );

    -- Verify the deletion happened
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to remove member - insufficient permissions or member not found';
    END IF;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION remove_team_member(UUID, UUID) TO authenticated; 