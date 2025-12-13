package handlers

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/braviz/jira-clone/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AttachmentHandler struct {
	service   *services.AttachmentService
	uploadDir string
}

func NewAttachmentHandler(service *services.AttachmentService, uploadDir string) *AttachmentHandler {
	return &AttachmentHandler{
		service:   service,
		uploadDir: uploadDir,
	}
}

func (h *AttachmentHandler) Upload(c *fiber.Ctx) error {
	// Parse Issue ID
	issueID, err := uuid.Parse(c.Params("issueId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid issue ID"})
	}

	// Get User ID from context
	userIDStr := c.Locals("userId").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	// Get file from request
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No file uploaded"})
	}

	// Validate file size (e.g., max 10MB)
	if file.Size > 10*1024*1024 {
		return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{"error": "File size exceeds 10MB limit"})
	}

	// Create uploads directory if it doesn't exist
	if _, err := os.Stat(h.uploadDir); os.IsNotExist(err) {
		os.MkdirAll(h.uploadDir, 0755)
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	uniqueName := fmt.Sprintf("%s-%d%s", uuid.New().String(), time.Now().Unix(), ext)
	savePath := filepath.Join(h.uploadDir, uniqueName)

	// Save file to disk
	if err := c.SaveFile(file, savePath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save file"})
	}

	// Create database record
	attachment, err := h.service.CreateAttachmentRecord(issueID, userID, file.Filename, uniqueName, file.Size, file.Header.Get("Content-Type"))
	if err != nil {
		// Cleanup file if DB insert fails
		os.Remove(savePath)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save attachment info"})
	}

	return c.Status(fiber.StatusCreated).JSON(attachment)
}

func (h *AttachmentHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid attachment ID"})
	}

	userIDStr := c.Locals("userId").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	if err := h.service.DeleteAttachment(id, userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete attachment"})
	}

	return c.JSON(fiber.Map{"message": "Attachment deleted successfully"})
}
