-- Add new columns to tasks table
ALTER TABLE tasks
ADD COLUMN due_date timestamptz,
ADD COLUMN estimated_hours numeric(10, 2),
ADD COLUMN labels text[] DEFAULT '{}',
ADD COLUMN attachments jsonb DEFAULT '[]',
ADD COLUMN mentions text[] DEFAULT '{}';

-- Update status enum
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE tasks
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'done'));

-- Create task attachments table
CREATE TABLE task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  url text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create task labels table for reusable labels
CREATE TABLE task_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

-- Add policies for task attachments
CREATE POLICY "Attachments are viewable by authenticated users" ON task_attachments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload attachments" ON task_attachments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only uploaders can delete attachments" ON task_attachments
  FOR DELETE USING (auth.uid() = uploaded_by);

-- Add policies for task labels
CREATE POLICY "Labels are viewable by authenticated users" ON task_labels
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create labels" ON task_labels
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only creators can update labels" ON task_labels
  FOR UPDATE USING (auth.uid() = created_by);

-- Create function to automatically generate ticket IDs
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.ticket_id IS NULL THEN
    NEW.ticket_id := 'TASK-' || 
                     to_char(current_timestamp, 'YYMMDD') || '-' ||
                     lpad(nextval('task_id_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for ticket IDs
CREATE SEQUENCE IF NOT EXISTS task_id_seq;

-- Create trigger to auto-generate ticket IDs
CREATE TRIGGER set_ticket_id
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_id();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_ticket_id ON tasks(ticket_id); 