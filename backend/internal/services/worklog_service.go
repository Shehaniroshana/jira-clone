package services

import (
	"errors"
	"time"

	"github.com/braviz/jira-clone/internal/models"
	"github.com/braviz/jira-clone/internal/repository"
	"github.com/google/uuid"
)

type WorkLogService struct {
	workLogRepo *repository.WorkLogRepository
	issueRepo   *repository.IssueRepository
}

func NewWorkLogService(workLogRepo *repository.WorkLogRepository, issueRepo *repository.IssueRepository) *WorkLogService {
	return &WorkLogService{
		workLogRepo: workLogRepo,
		issueRepo:   issueRepo,
	}
}

// CreateWorkLog creates a new work log entry
func (s *WorkLogService) CreateWorkLog(issueID, userID uuid.UUID, timeSpent int, description string, loggedAt *time.Time) (*models.WorkLog, error) {
	// Verify issue exists
	_, err := s.issueRepo.FindByID(issueID)
	if err != nil {
		return nil, errors.New("issue not found")
	}

	if timeSpent <= 0 {
		return nil, errors.New("time spent must be greater than 0")
	}

	workLog := &models.WorkLog{
		IssueID:     issueID,
		UserID:      userID,
		TimeSpent:   timeSpent,
		Description: description,
	}

	if loggedAt != nil {
		workLog.LoggedAt = *loggedAt
	} else {
		workLog.LoggedAt = time.Now()
	}

	if err := s.workLogRepo.CreateWorkLog(workLog); err != nil {
		return nil, err
	}

	// Fetch the created work log with user details
	return s.workLogRepo.GetWorkLogByID(workLog.ID)
}

// GetWorkLogByID retrieves a work log by ID
func (s *WorkLogService) GetWorkLogByID(id uuid.UUID) (*models.WorkLog, error) {
	return s.workLogRepo.GetWorkLogByID(id)
}

// GetWorkLogsByIssue retrieves all work logs for an issue
func (s *WorkLogService) GetWorkLogsByIssue(issueID uuid.UUID) ([]models.WorkLog, error) {
	return s.workLogRepo.GetWorkLogsByIssue(issueID)
}

// GetWorkLogsByUser retrieves all work logs for a user
func (s *WorkLogService) GetWorkLogsByUser(userID uuid.UUID) ([]models.WorkLog, error) {
	return s.workLogRepo.GetWorkLogsByUser(userID)
}

// UpdateWorkLog updates a work log
func (s *WorkLogService) UpdateWorkLog(id, userID uuid.UUID, timeSpent int, description string) (*models.WorkLog, error) {
	workLog, err := s.workLogRepo.GetWorkLogByID(id)
	if err != nil {
		return nil, errors.New("work log not found")
	}

	// Only the user who created the log can update it
	if workLog.UserID != userID {
		return nil, errors.New("you can only update your own work logs")
	}

	if timeSpent <= 0 {
		return nil, errors.New("time spent must be greater than 0")
	}

	workLog.TimeSpent = timeSpent
	workLog.Description = description

	if err := s.workLogRepo.UpdateWorkLog(workLog); err != nil {
		return nil, err
	}

	return s.workLogRepo.GetWorkLogByID(id)
}

// DeleteWorkLog deletes a work log
func (s *WorkLogService) DeleteWorkLog(id, userID uuid.UUID) error {
	workLog, err := s.workLogRepo.GetWorkLogByID(id)
	if err != nil {
		return errors.New("work log not found")
	}

	// Only the user who created the log can delete it
	if workLog.UserID != userID {
		return errors.New("you can only delete your own work logs")
	}

	return s.workLogRepo.DeleteWorkLog(id)
}

// GetTotalTimeSpentByIssue calculates total time spent on an issue
func (s *WorkLogService) GetTotalTimeSpentByIssue(issueID uuid.UUID) (int, error) {
	return s.workLogRepo.GetTotalTimeSpentByIssue(issueID)
}

// GetTimeReport generates a time report for a user within a date range
func (s *WorkLogService) GetTimeReport(userID uuid.UUID, startDate, endDate time.Time) (int, error) {
	return s.workLogRepo.GetTotalTimeSpentByUser(userID, startDate, endDate)
}

// UpdateIssueEstimatedTime updates the estimated time for an issue
func (s *WorkLogService) UpdateIssueEstimatedTime(issueID uuid.UUID, estimatedTime int) error {
	issue, err := s.issueRepo.FindByID(issueID)
	if err != nil {
		return errors.New("issue not found")
	}

	if estimatedTime < 0 {
		return errors.New("estimated time cannot be negative")
	}

	issue.EstimatedTime = estimatedTime
	return s.issueRepo.Update(issue)
}

// GetRemainingTime calculates remaining time for an issue
func (s *WorkLogService) GetRemainingTime(issueID uuid.UUID) (int, error) {
	issue, err := s.issueRepo.FindByID(issueID)
	if err != nil {
		return 0, errors.New("issue not found")
	}

	remaining := issue.EstimatedTime - issue.TimeSpent
	if remaining < 0 {
		remaining = 0
	}

	return remaining, nil
}
