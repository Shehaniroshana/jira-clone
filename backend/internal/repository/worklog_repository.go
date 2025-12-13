package repository

import (
	"time"

	"github.com/braviz/jira-clone/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WorkLogRepository struct {
	db *gorm.DB
}

func NewWorkLogRepository(db *gorm.DB) *WorkLogRepository {
	return &WorkLogRepository{db: db}
}

// CreateWorkLog creates a new work log entry
func (r *WorkLogRepository) CreateWorkLog(workLog *models.WorkLog) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Create the work log
		if err := tx.Create(workLog).Error; err != nil {
			return err
		}

		// Update the issue's total time spent
		return tx.Model(&models.Issue{}).
			Where("id = ?", workLog.IssueID).
			UpdateColumn("time_spent", gorm.Expr("time_spent + ?", workLog.TimeSpent)).
			Error
	})
}

// GetWorkLogByID retrieves a work log by ID
func (r *WorkLogRepository) GetWorkLogByID(id uuid.UUID) (*models.WorkLog, error) {
	var workLog models.WorkLog
	err := r.db.Preload("User").First(&workLog, "id = ?", id).Error
	return &workLog, err
}

// GetWorkLogsByIssue retrieves all work logs for an issue
func (r *WorkLogRepository) GetWorkLogsByIssue(issueID uuid.UUID) ([]models.WorkLog, error) {
	var workLogs []models.WorkLog
	err := r.db.Where("issue_id = ?", issueID).
		Preload("User").
		Order("logged_at DESC").
		Find(&workLogs).Error
	return workLogs, err
}

// GetWorkLogsByUser retrieves all work logs for a user
func (r *WorkLogRepository) GetWorkLogsByUser(userID uuid.UUID) ([]models.WorkLog, error) {
	var workLogs []models.WorkLog
	err := r.db.Where("user_id = ?", userID).
		Preload("User").
		Order("logged_at DESC").
		Find(&workLogs).Error
	return workLogs, err
}

// GetWorkLogsByDateRange retrieves work logs within a date range
func (r *WorkLogRepository) GetWorkLogsByDateRange(issueID uuid.UUID, startDate, endDate time.Time) ([]models.WorkLog, error) {
	var workLogs []models.WorkLog
	err := r.db.Where("issue_id = ? AND logged_at BETWEEN ? AND ?", issueID, startDate, endDate).
		Preload("User").
		Order("logged_at DESC").
		Find(&workLogs).Error
	return workLogs, err
}

// UpdateWorkLog updates a work log
func (r *WorkLogRepository) UpdateWorkLog(workLog *models.WorkLog) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Get the old work log to calculate the difference
		var oldWorkLog models.WorkLog
		if err := tx.First(&oldWorkLog, "id = ?", workLog.ID).Error; err != nil {
			return err
		}

		// Update the work log
		if err := tx.Save(workLog).Error; err != nil {
			return err
		}

		// Adjust the issue's total time spent
		diff := workLog.TimeSpent - oldWorkLog.TimeSpent
		return tx.Model(&models.Issue{}).
			Where("id = ?", workLog.IssueID).
			UpdateColumn("time_spent", gorm.Expr("time_spent + ?", diff)).
			Error
	})
}

// DeleteWorkLog deletes a work log
func (r *WorkLogRepository) DeleteWorkLog(id uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Get the work log to get the time spent
		var workLog models.WorkLog
		if err := tx.First(&workLog, "id = ?", id).Error; err != nil {
			return err
		}

		// Delete the work log
		if err := tx.Delete(&models.WorkLog{}, "id = ?", id).Error; err != nil {
			return err
		}

		// Adjust the issue's total time spent
		return tx.Model(&models.Issue{}).
			Where("id = ?", workLog.IssueID).
			UpdateColumn("time_spent", gorm.Expr("time_spent - ?", workLog.TimeSpent)).
			Error
	})
}

// GetTotalTimeSpentByIssue calculates total time spent on an issue
func (r *WorkLogRepository) GetTotalTimeSpentByIssue(issueID uuid.UUID) (int, error) {
	var total int
	err := r.db.Model(&models.WorkLog{}).
		Where("issue_id = ?", issueID).
		Select("COALESCE(SUM(time_spent), 0)").
		Scan(&total).Error
	return total, err
}

// GetTotalTimeSpentByUser calculates total time spent by a user
func (r *WorkLogRepository) GetTotalTimeSpentByUser(userID uuid.UUID, startDate, endDate time.Time) (int, error) {
	var total int
	err := r.db.Model(&models.WorkLog{}).
		Where("user_id = ? AND logged_at BETWEEN ? AND ?", userID, startDate, endDate).
		Select("COALESCE(SUM(time_spent), 0)").
		Scan(&total).Error
	return total, err
}
