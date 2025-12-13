-- Drop attachments table
DROP INDEX IF EXISTS idx_attachments_user_id;
DROP INDEX IF EXISTS idx_attachments_issue_id;
DROP TABLE IF EXISTS attachments CASCADE;

-- Drop comments table
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_comments_issue_id;
DROP TABLE IF EXISTS comments CASCADE;
