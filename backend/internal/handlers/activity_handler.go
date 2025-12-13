package handlers

import (
	"github.com/braviz/jira-clone/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ActivityHandler struct {
	db *gorm.DB
}

func NewActivityHandler(db *gorm.DB) *ActivityHandler {
	return &ActivityHandler{db: db}
}

// GetIssueActivity returns the activity log for a specific issue
func (h *ActivityHandler) GetIssueActivity(c *fiber.Ctx) error {
	issueID, err := uuid.Parse(c.Params("issueId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid issue ID",
		})
	}

	var activities []models.ActivityLog
	err = h.db.Preload("User").
		Where("issue_id = ?", issueID).
		Order("created_at DESC").
		Find(&activities).Error

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch activity log",
		})
	}

	return c.JSON(activities)
}

// GetProjectActivity returns the activity log for a specific project
func (h *ActivityHandler) GetProjectActivity(c *fiber.Ctx) error {
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid project ID",
		})
	}

	var activities []models.ActivityLog
	err = h.db.Preload("User").
		Where("project_id = ?", projectID).
		Order("created_at DESC").
		Find(&activities).Error

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch activity log",
		})
	}

	return c.JSON(activities)
}
