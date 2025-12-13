package services

import (
	"encoding/json"
	"errors"

	"github.com/braviz/jira-clone/internal/models"
	"github.com/braviz/jira-clone/internal/repository"
	"github.com/google/uuid"
)

type ProjectService struct {
	projectRepo  *repository.ProjectRepository
	activityRepo *repository.ActivityRepository
}

func NewProjectService(projectRepo *repository.ProjectRepository, activityRepo *repository.ActivityRepository) *ProjectService {
	return &ProjectService{
		projectRepo:  projectRepo,
		activityRepo: activityRepo,
	}
}

type CreateProjectInput struct {
	Key         string `json:"key"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
}

type UpdateProjectInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
}

func (s *ProjectService) Create(input CreateProjectInput, ownerID uuid.UUID) (*models.Project, error) {
	// Check if project key already exists
	existingProject, err := s.projectRepo.FindByKey(input.Key)
	if err == nil && existingProject != nil {
		return nil, errors.New("project with this key already exists")
	}

	project := &models.Project{
		Key:         input.Key,
		Name:        input.Name,
		Description: input.Description,
		Icon:        input.Icon,
		Color:       input.Color,
		OwnerID:     ownerID,
	}

	if err := s.projectRepo.Create(project); err != nil {
		return nil, err
	}

	// Add owner as admin member
	member := &models.ProjectMember{
		ProjectID: project.ID,
		UserID:    ownerID,
		Role:      "owner",
	}
	_ = s.projectRepo.AddMember(member)

	// Log activity
	s.logActivity(ownerID, &project.ID, nil, "created", "project", project.ID, nil)

	return project, nil
}

func (s *ProjectService) GetAll(userID uuid.UUID) ([]models.Project, error) {
	return s.projectRepo.GetAll(userID)
}

func (s *ProjectService) GetByID(id uuid.UUID) (*models.Project, error) {
	return s.projectRepo.FindByID(id)
}

func (s *ProjectService) Update(id uuid.UUID, input UpdateProjectInput, userID uuid.UUID) (*models.Project, error) {
	project, err := s.projectRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	oldData := map[string]interface{}{
		"name":        project.Name,
		"description": project.Description,
	}

	project.Name = input.Name
	project.Description = input.Description
	project.Icon = input.Icon
	project.Color = input.Color

	if err := s.projectRepo.Update(project); err != nil {
		return nil, err
	}

	newData := map[string]interface{}{
		"name":        project.Name,
		"description": project.Description,
	}

	changes := map[string]interface{}{
		"old": oldData,
		"new": newData,
	}

	s.logActivity(userID, &project.ID, nil, "updated", "project", project.ID, changes)

	return project, nil
}

func (s *ProjectService) Delete(id uuid.UUID, userID uuid.UUID) error {
	project, err := s.projectRepo.FindByID(id)
	if err != nil {
		return err
	}

	// Check if user is owner
	if project.OwnerID != userID {
		return errors.New("only project owner can delete the project")
	}

	s.logActivity(userID, &project.ID, nil, "deleted", "project", project.ID, nil)

	return s.projectRepo.Delete(id)
}

func (s *ProjectService) AddMember(projectID, userID uuid.UUID, role string, addedBy uuid.UUID) error {
	member := &models.ProjectMember{
		ProjectID: projectID,
		UserID:    userID,
		Role:      role,
	}

	if err := s.projectRepo.AddMember(member); err != nil {
		return err
	}

	changes := map[string]interface{}{
		"userId": userID,
		"role":   role,
	}

	s.logActivity(addedBy, &projectID, nil, "added_member", "project", projectID, changes)

	return nil
}

func (s *ProjectService) RemoveMember(projectID, userID, removedBy uuid.UUID) error {
	if err := s.projectRepo.RemoveMember(projectID, userID); err != nil {
		return err
	}

	changes := map[string]interface{}{
		"userId": userID,
	}

	s.logActivity(removedBy, &projectID, nil, "removed_member", "project", projectID, changes)

	return nil
}

func (s *ProjectService) logActivity(userID uuid.UUID, projectID *uuid.UUID, issueID *uuid.UUID, action, entityType string, entityID uuid.UUID, changes map[string]interface{}) {
	changesJSON := ""
	if changes != nil {
		bytes, _ := json.Marshal(changes)
		changesJSON = string(bytes)
	}

	activity := &models.ActivityLog{
		UserID:     userID,
		ProjectID:  projectID,
		IssueID:    issueID,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		Changes:    changesJSON,
	}

	_ = s.activityRepo.Create(activity)
}
