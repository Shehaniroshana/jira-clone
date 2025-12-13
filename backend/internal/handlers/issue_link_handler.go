package handlers

import (
	"github.com/braviz/jira-clone/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type IssueLinkHandler struct {
	service *services.IssueLinkService
}

func NewIssueLinkHandler(service *services.IssueLinkService) *IssueLinkHandler {
	return &IssueLinkHandler{service: service}
}

func (h *IssueLinkHandler) CreateLink(c *fiber.Ctx) error {
	var req struct {
		SourceID string `json:"sourceId"`
		TargetID string `json:"targetId"`
		Type     string `json:"type"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	sourceUUID, err := uuid.Parse(req.SourceID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid source ID"})
	}

	targetUUID, err := uuid.Parse(req.TargetID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid target ID"})
	}

	link, err := h.service.CreateLink(sourceUUID, targetUUID, req.Type)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(link)
}

func (h *IssueLinkHandler) DeleteLink(c *fiber.Ctx) error {
	linkID := c.Params("id")
	linkUUID, err := uuid.Parse(linkID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid link ID"})
	}

	if err := h.service.DeleteLink(linkUUID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *IssueLinkHandler) GetIssueLinks(c *fiber.Ctx) error {
	issueID := c.Params("issueId")
	issueUUID, err := uuid.Parse(issueID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid issue ID"})
	}

	links, err := h.service.GetIssueLinks(issueUUID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(links)
}
