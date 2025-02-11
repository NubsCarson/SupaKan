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

-- Create index for user_id to improve join performance
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_team_id ON messages(team_id);

-- Add trigger for updated_at
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Team members can view messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = messages.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Team members can create messages"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = messages.team_id
            AND team_members.user_id = auth.uid()
        )
        AND auth.uid() = user_id
    );

CREATE POLICY "Message owners can update their messages"
    ON messages FOR UPDATE
    USING (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = messages.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Message owners can delete their messages"
    ON messages FOR DELETE
    USING (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = messages.team_id
            AND team_members.user_id = auth.uid()
        )
    );

-- Create a composite type for user info
CREATE TYPE public.user_info AS (
    id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-- Drop existing view if it exists
DROP VIEW IF EXISTS messages_with_users;

-- Create view for messages with user data
CREATE VIEW messages_with_users AS
SELECT 
    m.*,
    ROW(
        u.id,
        u.email,
        u.created_at,
        u.updated_at
    )::public.user_info AS message_user
FROM messages m
LEFT JOIN auth.users u ON m.user_id = u.id
ORDER BY m.created_at DESC;

-- Grant access to the view
GRANT SELECT ON messages_with_users TO authenticated; 