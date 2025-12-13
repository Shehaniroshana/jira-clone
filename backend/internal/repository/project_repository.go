package repository

import (
	"github.com/braviz/jira-clone/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProjectRepository struct {
	db *gorm.DB
}

func NewProjectRepository(db *gorm.DB) *ProjectRepository {
	return &ProjectRepository{db: db}
}

func (r *ProjectRepository) Create(project *models.Project) error {
	return r.db.Create(project).Error
}

func (r *ProjectRepository) FindByID(id uuid.UUID) (*models.Project, error) {
	var project models.Project
	err := r.db.
		Preload("Owner").
		Preload("Members.User").
		First(&project, "id = ?", id).Error
	return &project, err
}

func (r *ProjectRepository) FindByKey(key string) (*models.Project, error) {
	var project models.Project
	err := r.db.Where("key = ?", key).First(&project).Error
	return &project, err
}

func (r *ProjectRepository) GetAll(userID uuid.UUID) ([]models.Project, error) {
	var projects []models.Project
	err := r.db.
		Preload("Owner").
		Preload("Members").
		Where("owner_id = ? OR id IN (?)",
			userID,
			r.db.Table("project_members").Select("project_id").Where("user_id = ?", userID),
		).
		Find(&projects).Error
	return projects, err
}

func (r *ProjectRepository) FindAll() ([]models.Project, error) {
	var projects []models.Project
	err := r.db.
		Preload("Owner").
		Preload("Members.User").
		Find(&projects).Error
	return projects, err
}

func (r *ProjectRepository) Update(project *models.Project) error {
	return r.db.Save(project).Error
}

func (r *ProjectRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Project{}, "id = ?", id).Error
}

func (r *ProjectRepository) AddMember(member *models.ProjectMember) error {
	return r.db.Create(member).Error
}

func (r *ProjectRepository) RemoveMember(projectID, userID uuid.UUID) error {
	return r.db.Delete(&models.ProjectMember{}, "project_id = ? AND user_id = ?", projectID, userID).Error
}

func (r *ProjectRepository) GetMembers(projectID uuid.UUID) ([]models.ProjectMember, error) {
	var members []models.ProjectMember
	err := r.db.Preload("User").Where("project_id = ?", projectID).Find(&members).Error
	return members, err
}
