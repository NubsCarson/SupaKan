CREATE OR REPLACE FUNCTION update_task_positions(task_positions jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    task_record record;
BEGIN
    -- Verify user has access to all tasks
    IF NOT EXISTS (
        SELECT 1 FROM tasks t
        JOIN team_members tm ON tm.team_id = t.team_id
        WHERE t.id = ANY(SELECT jsonb_array_elements_text(task_positions->'id'))
        AND tm.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Update positions
    FOR task_record IN 
        SELECT * FROM jsonb_to_recordset(task_positions) AS x(id text, position float)
    LOOP
        UPDATE tasks
        SET 
            position = task_record.position,
            updated_at = now()
        WHERE id = task_record.id;
    END LOOP;
END;
$$; 