-- Drop issues table
DROP INDEX IF EXISTS idx_issues_key;
DROP INDEX IF EXISTS idx_issues_type;
DROP INDEX IF EXISTS idx_issues_priority;
DROP INDEX IF EXISTS idx_issues_status;
DROP INDEX IF EXISTS idx_issues_reporter_id;
DROP INDEX IF EXISTS idx_issues_assignee_id;
DROP INDEX IF EXISTS idx_issues_sprint_id;
DROP INDEX IF EXISTS idx_issues_project_id;
DROP TABLE IF EXISTS issues CASCADE;
