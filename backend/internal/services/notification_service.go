package services

import (
	"github.com/braviz/jira-clone/internal/models"
	"github.com/braviz/jira-clone/internal/repository"
	"github.com/braviz/jira-clone/internal/websocket"
	"github.com/google/uuid"
)

type NotificationService struct {
	repo *repository.NotificationRepository
	hub  *websocket.Hub
}

func NewNotificationService(repo *repository.NotificationRepository, hub *websocket.Hub) *NotificationService {
	return &NotificationService{
		repo: repo,
		hub:  hub,
	}
}

func (s *NotificationService) CreateAndSend(notification *models.Notification) error {
	// 1. Save to database
	if err := s.repo.Create(notification); err != nil {
		return err
	}

	// 2. Prepare WebSocket message
	// Send to specific user using TargetUserID
	// We use "notification" as type, and include the whole notification object as Data

	wsMsg := &websocket.Message{
		Type:         "notification",
		TargetUserID: &notification.UserID,
		Data:         notification,
		UserID:       *notification.ActorID, // Triggered by Actor
	}

	s.hub.Broadcast <- wsMsg

	return nil
}

func (s *NotificationService) GetUserNotifications(userID uuid.UUID) ([]models.Notification, error) {
	return s.repo.GetByUserID(userID)
}

func (s *NotificationService) MarkAsRead(id uuid.UUID) error {
	return s.repo.MarkAsRead(id)
}

func (s *NotificationService) MarkAllAsRead(userID uuid.UUID) error {
	return s.repo.MarkAllAsRead(userID)
}

func (s *NotificationService) DeleteNotification(id uuid.UUID) error {
	return s.repo.Delete(id)
}
