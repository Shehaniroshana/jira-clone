package handlers

import (
	"github.com/braviz/jira-clone/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type SubtaskHandler struct {
	issueService *services.IssueService
}

func NewSubtaskHandler(issueService *services.IssueService) *SubtaskHandler {
	return &SubtaskHandler{
		issueService: issueService,
	}
}

// CreateSubtaskInput represents the input for creating a subtask
type CreateSubtaskInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	AssigneeID  string `json:"assigneeId"`
	Priority    string `json:"priority"`
}

// GetSubtasks returns all subtasks for a given issue
func (h *SubtaskHandler) GetSubtasks(c *fiber.Ctx) error {
	issueId, err := uuid.Parse(c.Params("issueId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid issue ID",
		})
	}

	subtasks, err := h.issueService.GetSubtasks(issueId)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch subtasks",
		})
	}

	return c.JSON(subtasks)
}

// CreateSubtask creates a new subtask for an issue
func (h *SubtaskHandler) CreateSubtask(c *fiber.Ctx) error {
	parentIssueId, err := uuid.Parse(c.Params("issueId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid issue ID",
		})
	}

	var input CreateSubtaskInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if input.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Title is required",
		})
	}

	// Get reporter ID from context
	reporterID := c.Locals("userId").(uuid.UUID)

	// Parse assignee ID if provided
	var assigneeID *uuid.UUID
	if input.AssigneeID != "" {
		id, err := uuid.Parse(input.AssigneeID)
		if err == nil {
			assigneeID = &id
		}
	}

	// Set default priority
	priority := input.Priority
	if priority == "" {
		priority = "medium"
	}

	subtask, err := h.issueService.CreateSubtask(parentIssueId, input.Title, input.Description, reporterID, assigneeID, priority)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create subtask: " + err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(subtask)
}

// UpdateSubtaskStatus updates the status of a subtask
func (h *SubtaskHandler) UpdateSubtaskStatus(c *fiber.Ctx) error {
	subtaskId, err := uuid.Parse(c.Params("subtaskId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid subtask ID",
		})
	}

	var input struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate status
	validStatuses := map[string]bool{"todo": true, "in_progress": true, "in_review": true, "done": true}
	if !validStatuses[input.Status] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid status. Must be 'todo', 'in_progress', 'in_review', or 'done'",
		})
	}

	subtask, err := h.issueService.UpdateSubtaskStatus(subtaskId, input.Status)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update subtask status",
		})
	}

	return c.JSON(subtask)
}

// DeleteSubtask deletes a subtask
func (h *SubtaskHandler) DeleteSubtask(c *fiber.Ctx) error {
	subtaskId, err := uuid.Parse(c.Params("subtaskId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid subtask ID",
		})
	}

	if err := h.issueService.DeleteSubtask(subtaskId); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete subtask",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Subtask deleted successfully",
	})
}

// GetSubtaskProgress returns the progress of subtasks for an issue
func (h *SubtaskHandler) GetSubtaskProgress(c *fiber.Ctx) error {
	issueId, err := uuid.Parse(c.Params("issueId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid issue ID",
		})
	}

	progress, err := h.issueService.GetSubtaskProgress(issueId)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get subtask progress",
		})
	}

	return c.JSON(progress)
}
