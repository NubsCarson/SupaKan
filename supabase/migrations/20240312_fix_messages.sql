-- Drop existing view if it exists
DROP VIEW IF EXISTS messages_with_users;

-- Drop existing messages table
DROP TABLE IF EXISTS messages;

-- Recreate messages table with correct schema
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

-- Grant access to the view
GRANT SELECT ON messages_with_users TO authenticated;

-- Add trigger for updated_at
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
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