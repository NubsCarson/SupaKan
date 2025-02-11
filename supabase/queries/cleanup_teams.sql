-- First, delete all team_members (this will cascade delete due to foreign key constraints)
DELETE FROM team_members;

-- Then delete all teams
DELETE FROM teams;

-- Reset the sequence if you have any
ALTER SEQUENCE IF EXISTS teams_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS team_members_id_seq RESTART WITH 1;

-- Verify the cleanup
SELECT COUNT(*) FROM teams;
SELECT COUNT(*) FROM team_members; 