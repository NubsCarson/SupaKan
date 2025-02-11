-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";

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
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(team_id, user_id)
);

-- Create boards table
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
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
    status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    ticket_id TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    position FLOAT NOT NULL,
    labels TEXT[] DEFAULT '{}',
    estimated_hours FLOAT,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    likes TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT false,
    mentions TEXT[] DEFAULT '{}',
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create view for messages with user data
CREATE OR REPLACE VIEW messages_with_users AS
SELECT 
    m.*,
    u.email as user_email,
    u.created_at as user_created_at,
    u.updated_at as user_updated_at
FROM messages m
LEFT JOIN auth.users u ON m.user_id = u.id;

-- Create indexes
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_boards_team_id ON boards(team_id);
CREATE INDEX idx_tasks_board_id ON tasks(board_id);
CREATE INDEX idx_tasks_team_id ON tasks(team_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_position ON tasks(position);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Update RLS policies with more specific rules
DROP POLICY IF EXISTS "Allow all for authenticated users" ON teams;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON team_members;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON boards;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON messages;

-- Teams policies
CREATE POLICY "Enable read access for team members" ON teams
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM team_members WHERE team_id = id
        )
    );

CREATE POLICY "Enable insert for authenticated users" ON teams
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update for team admins" ON teams
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM team_members 
            WHERE team_id = id AND role IN ('owner', 'admin')
        )
    );

-- Team members policies
CREATE POLICY "Enable read access for team members" ON team_members
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM team_members WHERE team_id = team_id
        )
    );

CREATE POLICY "Enable insert for team admins" ON team_members
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM team_members 
            WHERE team_id = team_id AND role IN ('owner', 'admin')
        )
    );

-- Boards policies
CREATE POLICY "Enable read access for team members" ON boards
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM team_members WHERE team_id = boards.team_id
        )
    );

CREATE POLICY "Enable insert for team members" ON boards
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM team_members WHERE team_id = boards.team_id
        )
    );

CREATE POLICY "Enable update for team members" ON boards
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM team_members WHERE team_id = boards.team_id
        )
    );

-- Tasks policies
CREATE POLICY "Enable read access for team members" ON tasks
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM team_members WHERE team_id = tasks.team_id
        )
    );

CREATE POLICY "Enable insert for team members" ON tasks
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM team_members WHERE team_id = tasks.team_id
        )
    );

CREATE POLICY "Enable update for team members" ON tasks
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM team_members WHERE team_id = tasks.team_id
        )
    );

-- Messages policies
CREATE POLICY "Enable read access for team members" ON messages
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM team_members WHERE team_id = messages.team_id
        )
    );

CREATE POLICY "Enable insert for team members" ON messages
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM team_members WHERE team_id = messages.team_id
        )
    );

CREATE POLICY "Enable update for message owners" ON messages
    FOR UPDATE
    USING (
        auth.uid() = user_id AND
        auth.uid() IN (
            SELECT user_id FROM team_members WHERE team_id = messages.team_id
        )
    );

CREATE POLICY "Enable delete for message owners" ON messages
    FOR DELETE
    USING (
        auth.uid() = user_id AND
        auth.uid() IN (
            SELECT user_id FROM team_members WHERE team_id = messages.team_id
        )
    );

-- Grant access to the view
GRANT SELECT ON messages_with_users TO authenticated; 