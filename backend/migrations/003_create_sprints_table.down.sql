-- Drop sprints table
DROP INDEX IF EXISTS idx_sprints_status;
DROP INDEX IF EXISTS idx_sprints_project_id;
DROP TABLE IF EXISTS sprints CASCADE;
