-- Drop indexes
DROP INDEX IF EXISTS idx_work_logs_logged_at;
DROP INDEX IF EXISTS idx_work_logs_user_id;
DROP INDEX IF EXISTS idx_work_logs_issue_id;

-- Drop work_logs table
DROP TABLE IF EXISTS work_logs;

-- Remove time tracking fields from issues
ALTER TABLE issues 
DROP COLUMN IF EXISTS time_spent,
DROP COLUMN IF EXISTS estimated_time;
