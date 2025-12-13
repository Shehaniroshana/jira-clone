package services

import (
	"encoding/json"
	"fmt"

	"github.com/braviz/jira-clone/internal/models"
	"github.com/braviz/jira-clone/internal/repository"
	"github.com/google/uuid"
)

type IssueService struct {
	issueRepo    *repository.IssueRepository
	activityRepo *repository.ActivityRepository
	notifService *NotificationService
}

func NewIssueService(issueRepo *repository.IssueRepository, activityRepo *repository.ActivityRepository, notifService *NotificationService) *IssueService {
	return &IssueService{
		issueRepo:    issueRepo,
		activityRepo: activityRepo,
		notifService: notifService,
	}
}

type CreateIssueInput struct {
	ProjectID   uuid.UUID  `json:"projectId"`
	ProjectKey  string     `json:"projectKey"`
	SprintID    *uuid.UUID `json:"sprintId"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Type        string     `json:"type"`
	Priority    string     `json:"priority"`
	AssigneeID  *uuid.UUID `json:"assigneeId"`
	StoryPoints *int       `json:"storyPoints"`
}

type UpdateIssueInput struct {
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Type        string     `json:"type"`
	Status      string     `json:"status"`
	Priority    string     `json:"priority"`
	AssigneeID  *uuid.UUID `json:"assigneeId"`
	SprintID    *uuid.UUID `json:"sprintId"`
	StoryPoints *int       `json:"storyPoints"`
	Position    int        `json:"position"`
}

func (s *IssueService) Create(input CreateIssueInput, reporterID uuid.UUID) (*models.Issue, error) {
	// Generate issue key
	keyNumber, err := s.issueRepo.GetNextKeyNumber(input.ProjectKey)
	if err != nil {
		return nil, err
	}
	issueKey := fmt.Sprintf("%s-%d", input.ProjectKey, keyNumber)

	issue := &models.Issue{
		ProjectID:   input.ProjectID,
		SprintID:    input.SprintID,
		Key:         issueKey,
		Title:       input.Title,
		Description: input.Description,
		Type:        input.Type,
		Status:      "todo",
		Priority:    input.Priority,
		AssigneeID:  input.AssigneeID,
		ReporterID:  reporterID,
		StoryPoints: input.StoryPoints,
		Position:    0,
	}

	if err := s.issueRepo.Create(issue); err != nil {
		return nil, err
	}

	// Reload with relations
	issue, _ = s.issueRepo.FindByID(issue.ID)

	// Log activity
	s.logActivity(reporterID, &input.ProjectID, &issue.ID, "created", "issue", issue.ID, nil)

	return issue, nil
}

func (s *IssueService) GetByProject(projectID uuid.UUID) ([]models.Issue, error) {
	return s.issueRepo.GetByProject(projectID)
}

func (s *IssueService) GetBySprint(sprintID uuid.UUID) ([]models.Issue, error) {
	return s.issueRepo.GetBySprint(sprintID)
}

func (s *IssueService) GetBacklog(projectID uuid.UUID) ([]models.Issue, error) {
	return s.issueRepo.GetBacklog(projectID)
}

func (s *IssueService) GetByID(id uuid.UUID) (*models.Issue, error) {
	return s.issueRepo.FindByID(id)
}

func (s *IssueService) Update(id uuid.UUID, input UpdateIssueInput, userID uuid.UUID) (*models.Issue, error) {
	issue, err := s.issueRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// Check if assignee is changing
	var oldAssigneeID *uuid.UUID
	if issue.AssigneeID != nil {
		id := *issue.AssigneeID
		oldAssigneeID = &id
	}

	oldData := map[string]interface{}{
		"title":       issue.Title,
		"status":      issue.Status,
		"priority":    issue.Priority,
		"assigneeId":  issue.AssigneeID,
		"sprintId":    issue.SprintID,
		"storyPoints": issue.StoryPoints,
	}

	issue.Title = input.Title
	issue.Description = input.Description
	issue.Type = input.Type
	issue.Status = input.Status
	issue.Priority = input.Priority
	issue.AssigneeID = input.AssigneeID

	// Handle SprintID update
	issue.SprintID = input.SprintID
	// Explicitly clear the Sprint association to ensure GORM updates the FK
	// strictly based on SprintID, resolving potential conflicts with loaded associations.
	issue.Sprint = nil

	issue.StoryPoints = input.StoryPoints

	if input.Position > 0 {
		issue.Position = input.Position
	}

	if err := s.issueRepo.Update(issue); err != nil {
		return nil, err
	}

	newData := map[string]interface{}{
		"title":       issue.Title,
		"status":      issue.Status,
		"priority":    issue.Priority,
		"assigneeId":  issue.AssigneeID,
		"sprintId":    issue.SprintID,
		"storyPoints": issue.StoryPoints,
	}

	changes := map[string]interface{}{
		"old": oldData,
		"new": newData,
	}

	s.logActivity(userID, &issue.ProjectID, &issue.ID, "updated", "issue", issue.ID, changes)

	// Trigger Notification if assignee changed
	if input.AssigneeID != nil && (oldAssigneeID == nil || *oldAssigneeID != *input.AssigneeID) {
		// Don't notify if assigning to self
		if *input.AssigneeID != userID {
			s.notifService.CreateAndSend(&models.Notification{
				UserID:     *input.AssigneeID,
				ActorID:    &userID,
				Title:      "You were assigned to an issue",
				Message:    fmt.Sprintf("You were assigned to issue %s: %s", issue.Key, issue.Title),
				Type:       "assigned",
				EntityID:   &issue.ID,
				EntityType: "issue",
			})
		}
	}

	// Reload with relations
	return s.issueRepo.FindByID(id)
}

func (s *IssueService) Delete(id uuid.UUID, userID uuid.UUID) error {
	issue, err := s.issueRepo.FindByID(id)
	if err != nil {
		return err
	}

	s.logActivity(userID, &issue.ProjectID, &issue.ID, "deleted", "issue", issue.ID, nil)

	return s.issueRepo.Delete(id)
}

func (s *IssueService) UpdatePosition(id uuid.UUID, position int, userID uuid.UUID) error {
	return s.issueRepo.UpdatePosition(id, position)
}

func (s *IssueService) logActivity(userID uuid.UUID, projectID *uuid.UUID, issueID *uuid.UUID, action, entityType string, entityID uuid.UUID, changes map[string]interface{}) {
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

// GetSubtasks returns all subtasks for a given issue
func (s *IssueService) GetSubtasks(issueID uuid.UUID) ([]models.Issue, error) {
	return s.issueRepo.GetSubtasks(issueID)
}

// CreateSubtask creates a new subtask for an issue
func (s *IssueService) CreateSubtask(parentIssueID uuid.UUID, title, description string, reporterID uuid.UUID, assigneeID *uuid.UUID, priority string) (*models.Issue, error) {
	// Get parent issue to get project info
	parentIssue, err := s.issueRepo.FindByID(parentIssueID)
	if err != nil {
		return nil, fmt.Errorf("parent issue not found")
	}

	// Get the project key from parent issue key
	projectKey := ""
	for i, c := range parentIssue.Key {
		if c == '-' {
			projectKey = parentIssue.Key[:i]
			break
		}
	}
	if projectKey == "" {
		return nil, fmt.Errorf("invalid parent issue key format")
	}

	// Generate subtask key
	keyNumber, err := s.issueRepo.GetNextKeyNumber(projectKey)
	if err != nil {
		return nil, err
	}

	subtaskKey := fmt.Sprintf("%s-%d", projectKey, keyNumber)

	subtask := &models.Issue{
		ProjectID:     parentIssue.ProjectID,
		ParentIssueID: &parentIssueID,
		SprintID:      parentIssue.SprintID,
		Key:           subtaskKey,
		Title:         title,
		Description:   description,
		Type:          "subtask",
		Status:        "todo",
		Priority:      priority,
		AssigneeID:    assigneeID,
		ReporterID:    reporterID,
		Position:      0,
	}

	if err := s.issueRepo.Create(subtask); err != nil {
		return nil, err
	}

	// Reload with relations
	subtask, _ = s.issueRepo.FindByID(subtask.ID)

	// Log activity
	s.logActivity(reporterID, &parentIssue.ProjectID, &parentIssueID, "created_subtask", "subtask", subtask.ID, nil)

	return subtask, nil
}

// UpdateSubtaskStatus updates the status of a subtask
func (s *IssueService) UpdateSubtaskStatus(subtaskID uuid.UUID, status string) (*models.Issue, error) {
	subtask, err := s.issueRepo.FindByID(subtaskID)
	if err != nil {
		return nil, err
	}

	if subtask.Type != "subtask" {
		return nil, fmt.Errorf("issue is not a subtask")
	}

	subtask.Status = status

	if err := s.issueRepo.Update(subtask); err != nil {
		return nil, err
	}

	return s.issueRepo.FindByID(subtaskID)
}

// DeleteSubtask deletes a subtask
func (s *IssueService) DeleteSubtask(subtaskID uuid.UUID) error {
	subtask, err := s.issueRepo.FindByID(subtaskID)
	if err != nil {
		return err
	}

	if subtask.Type != "subtask" {
		return fmt.Errorf("issue is not a subtask")
	}

	return s.issueRepo.Delete(subtaskID)
}

// GetSubtaskProgress returns the progress of subtasks for an issue
func (s *IssueService) GetSubtaskProgress(issueID uuid.UUID) (map[string]interface{}, error) {
	subtasks, err := s.issueRepo.GetSubtasks(issueID)
	if err != nil {
		return nil, err
	}

	total := len(subtasks)
	completed := 0
	inProgress := 0
	todo := 0
	inReview := 0

	for _, subtask := range subtasks {
		switch subtask.Status {
		case "done":
			completed++
		case "in_progress":
			inProgress++
		case "in_review":
			inReview++
		default:
			todo++
		}
	}

	percentage := 0
	if total > 0 {
		percentage = (completed * 100) / total
	}

	return map[string]interface{}{
		"total":      total,
		"completed":  completed,
		"inProgress": inProgress,
		"inReview":   inReview,
		"todo":       todo,
		"percentage": percentage,
	}, nil
}
