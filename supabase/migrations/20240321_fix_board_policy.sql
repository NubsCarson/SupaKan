-- Drop existing board policy
DROP POLICY IF EXISTS "Board access" ON boards;

-- Create new board access policy that includes team membership
CREATE POLICY "Board access" ON boards FOR ALL USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = boards.team_id
        AND tm.user_id = auth.uid()
    )
); 