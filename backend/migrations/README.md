# Database Migrations

This directory contains SQL migration files for the Jira Clone database schema.

## Migration Files

Migrations are numbered sequentially and have both `.up.sql` and `.down.sql` versions:

1. **001_create_users_table** - User accounts and authentication
2. **002_create_projects_table** - Projects and project membership
3. **003_create_sprints_table** - Sprint management
4. **004_create_issues_table** - Issue tracking
5. **005_create_comments_attachments_table** - Comments and file attachments
6. **006_create_activity_logs_table** - Activity and audit logging

## Running Migrations

### Option 1: Manual Execution

Run migrations in order using `psql`:

```bash
# Connect to your database
psql -U postgres -d jira_clone

# Run each migration
\i backend/migrations/001_create_users_table.up.sql
\i backend/migrations/002_create_projects_table.up.sql
\i backend/migrations/003_create_sprints_table.up.sql
\i backend/migrations/004_create_issues_table.up.sql
\i backend/migrations/005_create_comments_attachments_table.up.sql
\i backend/migrations/006_create_activity_logs_table.up.sql
```

### Option 2: Use golang-migrate

Install golang-migrate:
```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

Run migrations:
```bash
migrate -path backend/migrations -database "postgres://postgres:postgres@localhost:5432/jira_clone?sslmode=disable" up
```

Rollback migrations:
```bash
migrate -path backend/migrations -database "postgres://postgres:postgres@localhost:5432/jira_clone?sslmode=disable" down
```

### Option 3: GORM Auto-Migrate (Current Method)

The application currently uses GORM's AutoMigrate feature in `internal/database/database.go`:

```go
db.AutoMigrate(
    &models.User{},
    &models.Project{},
    &models.ProjectMember{},
    &models.Sprint{},
    &models.Issue{},
    &models.Comment{},
    &models.Attachment{},
    &models.ActivityLog{},
)
```

This automatically creates tables and columns when the application starts.

## Schema Overview

### Users Table
- Stores user accounts, passwords, and profiles
- Indexed on email for fast lookups

### Projects Table
- Project information with unique keys
- Links to project owner (user)

### Project Members Table
- Many-to-many relationship between users and projects
- Includes role information (owner, admin, member)

### Sprints Table
- Sprint planning and tracking
- Belongs to a project
- Has status: planned, active, completed

### Issues Table
- Tasks, bugs, stories, epics
- Belongs to project and optionally to sprint
- Assigned to users with priority and status
- Position field for drag-and-drop ordering

### Comments Table
- User comments on issues
- Tracks creation and update times

### Attachments Table
- File attachments on issues
- Stores file metadata and URLs

### Activity Logs Table
- Audit trail of all changes
- Stores JSON change diffs
- Links to user, project, and issue

## Indexes

All foreign keys are indexed for performance. Additional indexes include:
- User email (unique)
- Project key (unique)
- Issue key (unique)
- Issue status, priority, type
- Activity logs sorted by creation date

## Foreign Key Relationships

```
users (1) ----< (*) projects (owner)
users (*) ----< (*) project_members >---- (*) projects
projects (1) ----< (*) sprints
projects (1) ----< (*) issues
sprints (1) ----< (*) issues
users (1) ----< (*) issues (assignee)
users (1) ----< (*) issues (reporter)
issues (1) ----< (*) comments
issues (1) ----< (*) attachments
users (1) ----< (*) activity_logs
```

## Rollback Procedure

To rollback migrations, run the `.down.sql` files in reverse order:

```bash
psql -U postgres -d jira_clone << EOF
\i backend/migrations/006_create_activity_logs_table.down.sql
\i backend/migrations/005_create_comments_attachments_table.down.sql
\i backend/migrations/004_create_issues_table.down.sql
\i backend/migrations/003_create_sprints_table.down.sql
\i backend/migrations/002_create_projects_table.down.sql
\i backend/migrations/001_create_users_table.down.sql
EOF
```

## Notes

- All primary keys use UUIDs (gen_random_uuid())
- Timestamps use PostgreSQL's CURRENT_TIMESTAMP
- CASCADE deletes are used where appropriate
- ON DELETE SET NULL is used for optional relationships
- All text fields use appropriate VARCHAR or TEXT types
