package repository

import (
	"github.com/braviz/jira-clone/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SprintRepository struct {
	db *gorm.DB
}

func NewSprintRepository(db *gorm.DB) *SprintRepository {
	return &SprintRepository{db: db}
}

func (r *SprintRepository) Create(sprint *models.Sprint) error {
	return r.db.Create(sprint).Error
}

func (r *SprintRepository) FindByID(id uuid.UUID) (*models.Sprint, error) {
	var sprint models.Sprint
	err := r.db.
		Preload("Issues.Assignee").
		Preload("Issues.Reporter").
		First(&sprint, "id = ?", id).Error
	return &sprint, err
}

func (r *SprintRepository) GetByProject(projectID uuid.UUID) ([]models.Sprint, error) {
	var sprints []models.Sprint
	err := r.db.
		Where("project_id = ?", projectID).
		Order("created_at DESC").
		Find(&sprints).Error
	return sprints, err
}

func (r *SprintRepository) GetActiveSprint(projectID uuid.UUID) (*models.Sprint, error) {
	var sprint models.Sprint
	err := r.db.
		Preload("Issues").
		Where("project_id = ? AND status = ?", projectID, "active").
		First(&sprint).Error
	return &sprint, err
}

func (r *SprintRepository) Update(sprint *models.Sprint) error {
	return r.db.Save(sprint).Error
}

func (r *SprintRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Sprint{}, "id = ?", id).Error
}
