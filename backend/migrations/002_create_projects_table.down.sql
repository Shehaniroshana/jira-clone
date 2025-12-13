-- Drop project_members table
DROP INDEX IF EXISTS idx_project_members_user_id;
DROP INDEX IF EXISTS idx_project_members_project_id;
DROP TABLE IF EXISTS project_members CASCADE;

-- Drop projects table
DROP INDEX IF EXISTS idx_projects_owner_id;
DROP INDEX IF EXISTS idx_projects_key;
DROP TABLE IF EXISTS projects CASCADE;
