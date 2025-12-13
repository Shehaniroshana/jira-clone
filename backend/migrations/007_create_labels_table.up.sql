-- Create labels table
CREATE TABLE IF NOT EXISTS labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, name)
);

-- Create issue_labels junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS issue_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL,
    label_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE,
    UNIQUE(issue_id, label_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_labels_project_id ON labels(project_id);
CREATE INDEX idx_issue_labels_issue_id ON issue_labels(issue_id);
CREATE INDEX idx_issue_labels_label_id ON issue_labels(label_id);
