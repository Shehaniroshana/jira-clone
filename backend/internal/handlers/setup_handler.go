package handlers

import (
	"errors"

	"github.com/braviz/jira-clone/internal/setup"
	"github.com/gofiber/fiber/v2"
)

type SetupHandler struct {
	store         *setup.DBConfigStore
	preconfigured bool
}

func NewSetupHandler(store *setup.DBConfigStore, preconfigured bool) *SetupHandler {
	return &SetupHandler{store: store, preconfigured: preconfigured}
}

func (h *SetupHandler) GetStatus(c *fiber.Ctx) error {
	configured := h.preconfigured || h.store.IsConfigured()

	return c.JSON(fiber.Map{
		"configured": configured,
	})
}

type saveDatabaseURLRequest struct {
	DatabaseURL string `json:"databaseUrl"`
}

func (h *SetupHandler) SaveDatabaseURL(c *fiber.Ctx) error {
	var req saveDatabaseURLRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := setup.ValidateConnection(req.DatabaseURL); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.store.Save(req.DatabaseURL); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":         "Database URL saved securely",
		"restartRequired": true,
	})
}

func (h *SetupHandler) LoadDatabaseURL() (string, error) {
	databaseURL, err := h.store.Load()
	if err != nil {
		if errors.Is(err, setup.ErrNotConfigured) {
			return "", nil
		}
		return "", err
	}

	return databaseURL, nil
}
