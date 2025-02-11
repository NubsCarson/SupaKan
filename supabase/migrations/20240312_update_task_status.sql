-- Update task status options
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
    CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'done'));

-- Update any existing tasks with old status values
UPDATE tasks SET status = 'todo' WHERE status NOT IN ('backlog', 'todo', 'in_progress', 'in_review', 'done'); 