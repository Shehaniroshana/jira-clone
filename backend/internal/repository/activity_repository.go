package repository

import (
	"github.com/braviz/jira-clone/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ActivityRepository struct {
	db *gorm.DB
}

func NewActivityRepository(db *gorm.DB) *ActivityRepository {
	return &ActivityRepository{db: db}
}

func (r *ActivityRepository) Create(activity *models.ActivityLog) error {
	return r.db.Create(activity).Error
}

func (r *ActivityRepository) GetByProject(projectID uuid.UUID, limit int) ([]models.ActivityLog, error) {
	var activities []models.ActivityLog
	query := r.db.Preload("User").Where("project_id = ?", projectID)

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Order("created_at DESC").Find(&activities).Error
	return activities, err
}

func (r *ActivityRepository) GetByIssue(issueID uuid.UUID, limit int) ([]models.ActivityLog, error) {
	var activities []models.ActivityLog
	query := r.db.Preload("User").Where("issue_id = ?", issueID)

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Order("created_at DESC").Find(&activities).Error
	return activities, err
}

func (r *ActivityRepository) GetRecent(limit int) ([]models.ActivityLog, error) {
	var activities []models.ActivityLog
	err := r.db.
		Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Find(&activities).Error
	return activities, err
}
