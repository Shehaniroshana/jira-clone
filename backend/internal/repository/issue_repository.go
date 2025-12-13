package repository

import (
	"github.com/braviz/jira-clone/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type IssueRepository struct {
	db *gorm.DB
}

func NewIssueRepository(db *gorm.DB) *IssueRepository {
	return &IssueRepository{db: db}
}

func (r *IssueRepository) Create(issue *models.Issue) error {
	return r.db.Create(issue).Error
}

func (r *IssueRepository) FindByID(id uuid.UUID) (*models.Issue, error) {
	var issue models.Issue
	err := r.db.
		Preload("Assignee").
		Preload("Reporter").
		Preload("Sprint").
		Preload("Project").
		Preload("Comments.User").
		Preload("WorkLogs.User").
		Preload("Attachments").
		Preload("Labels").
		Preload("SubTasks").
		First(&issue, "id = ?", id).Error
	return &issue, err
}

func (r *IssueRepository) GetByProject(projectID uuid.UUID) ([]models.Issue, error) {
	var issues []models.Issue
	err := r.db.
		Preload("Assignee").
		Preload("Reporter").
		Preload("Sprint").
		Preload("SubTasks").
		Preload("Labels").
		Where("project_id = ?", projectID).
		Order("position ASC").
		Find(&issues).Error
	return issues, err
}

func (r *IssueRepository) GetBySprint(sprintID uuid.UUID) ([]models.Issue, error) {
	var issues []models.Issue
	err := r.db.
		Preload("Assignee").
		Preload("Reporter").
		Preload("SubTasks").
		Preload("Labels").
		Where("sprint_id = ?", sprintID).
		Order("position ASC").
		Find(&issues).Error
	return issues, err
}

func (r *IssueRepository) GetBacklog(projectID uuid.UUID) ([]models.Issue, error) {
	var issues []models.Issue
	err := r.db.
		Preload("Assignee").
		Preload("Reporter").
		Where("project_id = ? AND sprint_id IS NULL AND parent_issue_id IS NULL", projectID).
		Order("created_at DESC").
		Find(&issues).Error
	return issues, err
}

func (r *IssueRepository) Update(issue *models.Issue) error {
	return r.db.Save(issue).Error
}

func (r *IssueRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Issue{}, "id = ?", id).Error
}

func (r *IssueRepository) UpdatePosition(id uuid.UUID, position int) error {
	return r.db.Model(&models.Issue{}).Where("id = ?", id).Update("position", position).Error
}

func (r *IssueRepository) GetNextKeyNumber(projectKey string) (int, error) {
	var count int64
	err := r.db.Model(&models.Issue{}).
		Where("key LIKE ?", projectKey+"-%").
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return int(count) + 1, nil
}

func (r *IssueRepository) GetSubtasks(issueID uuid.UUID) ([]models.Issue, error) {
	var subtasks []models.Issue
	err := r.db.
		Preload("Assignee").
		Preload("Reporter").
		Where("parent_issue_id = ?", issueID).
		Order("created_at ASC").
		Find(&subtasks).Error
	return subtasks, err
}
