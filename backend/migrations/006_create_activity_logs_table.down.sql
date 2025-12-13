-- Drop activity_logs table
DROP INDEX IF EXISTS idx_activity_logs_created_at;
DROP INDEX IF EXISTS idx_activity_logs_entity_id;
DROP INDEX IF EXISTS idx_activity_logs_entity_type;
DROP INDEX IF EXISTS idx_activity_logs_issue_id;
DROP INDEX IF EXISTS idx_activity_logs_project_id;
DROP INDEX IF EXISTS idx_activity_logs_user_id;
DROP TABLE IF EXISTS activity_logs CASCADE;
