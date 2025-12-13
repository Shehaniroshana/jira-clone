package handlers

import (
	"github.com/braviz/jira-clone/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type LabelHandler struct {
	labelService *services.LabelService
}

func NewLabelHandler(labelService *services.LabelService) *LabelHandler {
	return &LabelHandler{labelService: labelService}
}

// CreateLabel creates a new label
func (h *LabelHandler) CreateLabel(c *fiber.Ctx) error {
	type Request struct {
		ProjectID string `json:"projectId"`
		Name      string `json:"name"`
		Color     string `json:"color"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.Name == "" || req.Color == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Name and color are required"})
	}

	projectID, err := uuid.Parse(req.ProjectID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	label, err := h.labelService.CreateLabel(projectID, req.Name, req.Color)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(label)
}

// GetLabelsByProject retrieves all labels for a project
func (h *LabelHandler) GetLabelsByProject(c *fiber.Ctx) error {
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	labels, err := h.labelService.GetLabelsByProject(projectID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(labels)
}

// GetLabel retrieves a specific label
func (h *LabelHandler) GetLabel(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid label ID"})
	}

	label, err := h.labelService.GetLabelByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Label not found"})
	}

	return c.JSON(label)
}

// UpdateLabel updates a label
func (h *LabelHandler) UpdateLabel(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid label ID"})
	}

	type Request struct {
		Name  string `json:"name"`
		Color string `json:"color"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.Name == "" || req.Color == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Name and color are required"})
	}

	label, err := h.labelService.UpdateLabel(id, req.Name, req.Color)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(label)
}

// DeleteLabel deletes a label
func (h *LabelHandler) DeleteLabel(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid label ID"})
	}

	if err := h.labelService.DeleteLabel(id); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// AddLabelToIssue adds a label to an issue
func (h *LabelHandler) AddLabelToIssue(c *fiber.Ctx) error {
	issueID, err := uuid.Parse(c.Params("issueId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid issue ID"})
	}

	type Request struct {
		LabelID string `json:"labelId"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	labelID, err := uuid.Parse(req.LabelID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid label ID"})
	}

	if err := h.labelService.AddLabelToIssue(issueID, labelID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// RemoveLabelFromIssue removes a label from an issue
func (h *LabelHandler) RemoveLabelFromIssue(c *fiber.Ctx) error {
	issueID, err := uuid.Parse(c.Params("issueId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid issue ID"})
	}

	labelID, err := uuid.Parse(c.Params("labelId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid label ID"})
	}

	if err := h.labelService.RemoveLabelFromIssue(issueID, labelID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// GetLabelsByIssue retrieves all labels for an issue
func (h *LabelHandler) GetLabelsByIssue(c *fiber.Ctx) error {
	issueID, err := uuid.Parse(c.Params("issueId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid issue ID"})
	}

	labels, err := h.labelService.GetLabelsByIssue(issueID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(labels)
}
