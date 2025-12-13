-- Add time tracking fields to issues table
ALTER TABLE issues 
ADD COLUMN estimated_time INTEGER DEFAULT 0,  -- in minutes
ADD COLUMN time_spent INTEGER DEFAULT 0;       -- in minutes

-- Create work_logs table for detailed time tracking
CREATE TABLE IF NOT EXISTS work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL,
    user_id UUID NOT NULL,
    time_spent INTEGER NOT NULL,  -- in minutes
    description TEXT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_work_logs_issue_id ON work_logs(issue_id);
CREATE INDEX idx_work_logs_user_id ON work_logs(user_id);
CREATE INDEX idx_work_logs_logged_at ON work_logs(logged_at);
