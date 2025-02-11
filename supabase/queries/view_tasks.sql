-- View all tasks ordered by status and position
SELECT 
    id,
    title,
    status,
    position,
    created_at,
    updated_at
FROM tasks
ORDER BY status, position;

-- View task position updates in the last hour
SELECT 
    id,
    title,
    status,
    position,
    updated_at
FROM tasks
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC; 