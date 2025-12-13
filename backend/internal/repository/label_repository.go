package repository

import (
	"github.com/braviz/jira-clone/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LabelRepository struct {
	db *gorm.DB
}

func NewLabelRepository(db *gorm.DB) *LabelRepository {
	return &LabelRepository{db: db}
}

// CreateLabel creates a new label
func (r *LabelRepository) CreateLabel(label *models.Label) error {
	return r.db.Create(label).Error
}

// GetLabelByID retrieves a label by ID
func (r *LabelRepository) GetLabelByID(id uuid.UUID) (*models.Label, error) {
	var label models.Label
	err := r.db.First(&label, "id = ?", id).Error
	return &label, err
}

// GetLabelsByProject retrieves all labels for a project
func (r *LabelRepository) GetLabelsByProject(projectID uuid.UUID) ([]models.Label, error) {
	var labels []models.Label
	err := r.db.Where("project_id = ?", projectID).
		Order("name ASC").
		Find(&labels).Error
	return labels, err
}

// GetLabelByName retrieves a label by name within a project
func (r *LabelRepository) GetLabelByName(projectID uuid.UUID, name string) (*models.Label, error) {
	var label models.Label
	err := r.db.Where("project_id = ? AND name = ?", projectID, name).
		First(&label).Error
	return &label, err
}

// UpdateLabel updates a label
func (r *LabelRepository) UpdateLabel(label *models.Label) error {
	return r.db.Save(label).Error
}

// DeleteLabel deletes a label
func (r *LabelRepository) DeleteLabel(id uuid.UUID) error {
	return r.db.Delete(&models.Label{}, "id = ?", id).Error
}

// GetLabelsByIssue retrieves all labels for an issue
func (r *LabelRepository) GetLabelsByIssue(issueID uuid.UUID) ([]models.Label, error) {
	var issue models.Issue
	err := r.db.Preload("Labels").First(&issue, "id = ?", issueID).Error
	if err != nil {
		return nil, err
	}
	return issue.Labels, nil
}

// AddLabelToIssue adds a label to an issue
func (r *LabelRepository) AddLabelToIssue(issueID, labelID uuid.UUID) error {
	return r.db.Exec(
		"INSERT INTO issue_labels (issue_id, label_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
		issueID, labelID,
	).Error
}

// RemoveLabelFromIssue removes a label from an issue
func (r *LabelRepository) RemoveLabelFromIssue(issueID, labelID uuid.UUID) error {
	return r.db.Exec(
		"DELETE FROM issue_labels WHERE issue_id = ? AND label_id = ?",
		issueID, labelID,
	).Error
}

// GetIssuesByLabel retrieves all issues with a specific label
func (r *LabelRepository) GetIssuesByLabel(labelID uuid.UUID) ([]models.Issue, error) {
	var issues []models.Issue
	err := r.db.Joins("JOIN issue_labels ON issue_labels.issue_id = issues.id").
		Where("issue_labels.label_id = ?", labelID).
		Preload("Assignee").
		Preload("Reporter").
		Find(&issues).Error
	return issues, err
}
