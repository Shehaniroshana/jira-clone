package services

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/braviz/jira-clone/internal/models"
	"github.com/braviz/jira-clone/internal/repository"
	"github.com/google/uuid"
)

type SprintService struct {
	sprintRepo   *repository.SprintRepository
	activityRepo *repository.ActivityRepository
	issueRepo    *repository.IssueRepository
}

func NewSprintService(sprintRepo *repository.SprintRepository, activityRepo *repository.ActivityRepository, issueRepo *repository.IssueRepository) *SprintService {
	return &SprintService{
		sprintRepo:   sprintRepo,
		activityRepo: activityRepo,
		issueRepo:    issueRepo,
	}
}

type CreateSprintInput struct {
	ProjectID uuid.UUID  `json:"projectId"`
	Name      string     `json:"name"`
	Goal      string     `json:"goal"`
	StartDate *time.Time `json:"startDate"`
	EndDate   *time.Time `json:"endDate"`
}

type UpdateSprintInput struct {
	Name      string     `json:"name"`
	Goal      string     `json:"goal"`
	StartDate *time.Time `json:"startDate"`
	EndDate   *time.Time `json:"endDate"`
	Status    string     `json:"status"`
}

func (s *SprintService) Create(input CreateSprintInput, userID uuid.UUID) (*models.Sprint, error) {
	sprint := &models.Sprint{
		ProjectID: input.ProjectID,
		Name:      input.Name,
		Goal:      input.Goal,
		StartDate: input.StartDate,
		EndDate:   input.EndDate,
		Status:    "planned",
	}

	if err := s.sprintRepo.Create(sprint); err != nil {
		return nil, err
	}

	s.logActivity(userID, &input.ProjectID, nil, "created", "sprint", sprint.ID, nil)

	return sprint, nil
}

func (s *SprintService) GetByProject(projectID uuid.UUID) ([]models.Sprint, error) {
	return s.sprintRepo.GetByProject(projectID)
}

func (s *SprintService) GetByID(id uuid.UUID) (*models.Sprint, error) {
	return s.sprintRepo.FindByID(id)
}

func (s *SprintService) GetActiveSprint(projectID uuid.UUID) (*models.Sprint, error) {
	return s.sprintRepo.GetActiveSprint(projectID)
}

func (s *SprintService) Update(id uuid.UUID, input UpdateSprintInput, userID uuid.UUID) (*models.Sprint, error) {
	sprint, err := s.sprintRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	oldData := map[string]interface{}{
		"name":   sprint.Name,
		"status": sprint.Status,
	}

	sprint.Name = input.Name
	sprint.Goal = input.Goal
	sprint.StartDate = input.StartDate
	sprint.EndDate = input.EndDate
	if input.Status != "" {
		sprint.Status = input.Status
	}

	if err := s.sprintRepo.Update(sprint); err != nil {
		return nil, err
	}

	newData := map[string]interface{}{
		"name":   sprint.Name,
		"status": sprint.Status,
	}

	changes := map[string]interface{}{
		"old": oldData,
		"new": newData,
	}

	s.logActivity(userID, &sprint.ProjectID, nil, "updated", "sprint", sprint.ID, changes)

	return sprint, nil
}

func (s *SprintService) StartSprint(id uuid.UUID, userID uuid.UUID) (*models.Sprint, error) {
	sprint, err := s.sprintRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if sprint.Status != "planned" {
		return nil, errors.New("only planned sprints can be started")
	}

	now := time.Now()
	sprint.Status = "active"
	if sprint.StartDate == nil {
		sprint.StartDate = &now
	}

	if err := s.sprintRepo.Update(sprint); err != nil {
		return nil, err
	}

	s.logActivity(userID, &sprint.ProjectID, nil, "started", "sprint", sprint.ID, nil)

	return sprint, nil
}

func (s *SprintService) CompleteSprint(id uuid.UUID, userID uuid.UUID) (*models.Sprint, error) {
	sprint, err := s.sprintRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if sprint.Status != "active" {
		return nil, errors.New("only active sprints can be completed")
	}

	// Move incomplete issues to backlog
	issues, err := s.issueRepo.GetBySprint(id)
	if err == nil {
		for _, issue := range issues {
			if issue.Status != "done" {
				// Move to backlog
				issue.SprintID = nil
				if err := s.issueRepo.Update(&issue); err == nil {
					// Optionally log that issue was moved
					s.logActivity(userID, &sprint.ProjectID, &issue.ID, "moved_to_backlog", "issue", issue.ID, nil)
				}
			}
		}
	}

	now := time.Now()
	sprint.Status = "completed"
	if sprint.EndDate == nil {
		sprint.EndDate = &now
	}

	if err := s.sprintRepo.Update(sprint); err != nil {
		return nil, err
	}

	s.logActivity(userID, &sprint.ProjectID, nil, "completed", "sprint", sprint.ID, nil)

	return sprint, nil
}

func (s *SprintService) Delete(id uuid.UUID, userID uuid.UUID) error {
	sprint, err := s.sprintRepo.FindByID(id)
	if err != nil {
		return err
	}

	if sprint.Status == "active" {
		return errors.New("cannot delete an active sprint")
	}

	s.logActivity(userID, &sprint.ProjectID, nil, "deleted", "sprint", sprint.ID, nil)

	return s.sprintRepo.Delete(id)
}

func (s *SprintService) logActivity(userID uuid.UUID, projectID *uuid.UUID, issueID *uuid.UUID, action, entityType string, entityID uuid.UUID, changes map[string]interface{}) {
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
