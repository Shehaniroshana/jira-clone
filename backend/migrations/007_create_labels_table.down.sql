-- Drop indexes
DROP INDEX IF EXISTS idx_issue_labels_label_id;
DROP INDEX IF EXISTS idx_issue_labels_issue_id;
DROP INDEX IF EXISTS idx_labels_project_id;

-- Drop tables
DROP TABLE IF EXISTS issue_labels;
DROP TABLE IF EXISTS labels;
