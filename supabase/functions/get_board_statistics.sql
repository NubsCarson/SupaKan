CREATE OR REPLACE FUNCTION get_board_statistics(board_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Verify user has access to the board
    IF NOT EXISTS (
        SELECT 1 FROM boards b
        JOIN team_members tm ON tm.team_id = b.team_id
        WHERE b.id = board_id
        AND tm.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT jsonb_build_object(
        'total_tasks', COUNT(*),
        'tasks_by_status', jsonb_build_object(
            'todo', COUNT(*) FILTER (WHERE status = 'todo'),
            'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
            'done', COUNT(*) FILTER (WHERE status = 'done')
        ),
        'tasks_by_priority', jsonb_build_object(
            'low', COUNT(*) FILTER (WHERE priority = 'low'),
            'medium', COUNT(*) FILTER (WHERE priority = 'medium'),
            'high', COUNT(*) FILTER (WHERE priority = 'high')
        ),
        'overdue_tasks', COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'done'),
        'completed_tasks_last_7_days', COUNT(*) FILTER (
            WHERE status = 'done' 
            AND updated_at >= CURRENT_DATE - INTERVAL '7 days'
        ),
        'avg_completion_time_hours', 
            EXTRACT(EPOCH FROM AVG(updated_at - created_at)) / 3600 
            FILTER (WHERE status = 'done'),
        'assigned_tasks', COUNT(*) FILTER (WHERE assigned_to IS NOT NULL),
        'unassigned_tasks', COUNT(*) FILTER (WHERE assigned_to IS NULL),
        'estimated_vs_actual', jsonb_build_object(
            'total_estimated_hours', SUM(estimated_hours),
            'total_actual_hours', 
                EXTRACT(EPOCH FROM SUM(
                    CASE 
                        WHEN status = 'done' THEN updated_at - created_at
                        ELSE CURRENT_TIMESTAMP - created_at
                    END
                )) / 3600
        )
    ) INTO result
    FROM tasks
    WHERE board_id = $1;

    RETURN result;
END;
$$; 