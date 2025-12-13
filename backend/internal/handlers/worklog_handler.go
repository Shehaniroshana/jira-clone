package handlers

import (
	"time"

	"github.com/braviz/jira-clone/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type WorkLogHandler struct {
	workLogService *services.WorkLogService
}

func NewWorkLogHandler(workLogService *services.WorkLogService) *WorkLogHandler {
	return &WorkLogHandler{workLogService: workLogService}
}

// CreateWorkLog creates a new work log entry
func (h *WorkLogHandler) CreateWorkLog(c *fiber.Ctx) error {
	type Request struct {
		IssueID     string     `json:"issueId"`
		TimeSpent   int        `json:"timeSpent"` // in minutes
		Description string     `json:"description"`
		LoggedAt    *time.Time `json:"loggedAt"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.TimeSpent <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Time spent must be greater than 0"})
	}

	issueID, err := uuid.Parse(req.IssueID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid issue ID"})
	}

	// Get user ID from JWT context
	userID := c.Locals("userId").(uuid.UUID)

	workLog, err := h.workLogService.CreateWorkLog(issueID, userID, req.TimeSpent, req.Description, req.LoggedAt)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(workLog)
}

// GetWorkLogsByIssue retrieves all work logs for an issue
func (h *WorkLogHandler) GetWorkLogsByIssue(c *fiber.Ctx) error {
	issueID, err := uuid.Parse(c.Params("issueId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid issue ID"})
	}

	workLogs, err := h.workLogService.GetWorkLogsByIssue(issueID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(workLogs)
}

// GetWorkLogsByUser retrieves all work logs for the authenticated user
func (h *WorkLogHandler) GetWorkLogsByUser(c *fiber.Ctx) error {
	userID := c.Locals("userId").(uuid.UUID)

	workLogs, err := h.workLogService.GetWorkLogsByUser(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(workLogs)
}

// GetWorkLog retrieves a specific work log
func (h *WorkLogHandler) GetWorkLog(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid work log ID"})
	}

	workLog, err := h.workLogService.GetWorkLogByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Work log not found"})
	}

	return c.JSON(workLog)
}

// UpdateWorkLog updates a work log
func (h *WorkLogHandler) UpdateWorkLog(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid work log ID"})
	}

	type Request struct {
		TimeSpent   int    `json:"timeSpent"`
		Description string `json:"description"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.TimeSpent <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Time spent must be greater than 0"})
	}

	userID := c.Locals("userId").(uuid.UUID)

	workLog, err := h.workLogService.UpdateWorkLog(id, userID, req.TimeSpent, req.Description)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(workLog)
}

// DeleteWorkLog deletes a work log
func (h *WorkLogHandler) DeleteWorkLog(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid work log ID"})
	}

	userID := c.Locals("userId").(uuid.UUID)

	if err := h.workLogService.DeleteWorkLog(id, userID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// UpdateIssueEstimatedTime updates the estimated time for an issue
func (h *WorkLogHandler) UpdateIssueEstimatedTime(c *fiber.Ctx) error {
	issueID, err := uuid.Parse(c.Params("issueId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid issue ID"})
	}

	type Request struct {
		EstimatedTime int `json:"estimatedTime"` // in minutes
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.EstimatedTime < 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Estimated time cannot be negative"})
	}

	if err := h.workLogService.UpdateIssueEstimatedTime(issueID, req.EstimatedTime); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// GetTotalTimeSpent calculates total time spent on an issue
func (h *WorkLogHandler) GetTotalTimeSpent(c *fiber.Ctx) error {
	issueID, err := uuid.Parse(c.Params("issueId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid issue ID"})
	}

	total, err := h.workLogService.GetTotalTimeSpentByIssue(issueID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"issueId":   issueID,
		"timeSpent": total,
	})
}

// GetRemainingTime calculates remaining time for an issue
func (h *WorkLogHandler) GetRemainingTime(c *fiber.Ctx) error {
	issueID, err := uuid.Parse(c.Params("issueId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid issue ID"})
	}

	remaining, err := h.workLogService.GetRemainingTime(issueID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"issueId":       issueID,
		"remainingTime": remaining,
	})
}
