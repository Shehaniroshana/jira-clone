package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/google/uuid"
)

type Client struct {
	ID       uuid.UUID
	UserID   uuid.UUID
	Hub      *Hub
	Send     chan []byte
	Projects map[uuid.UUID]bool // Projects this client is subscribed to
}

type Hub struct {
	Clients    map[*Client]bool
	Broadcast  chan *Message
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
}

type Message struct {
	Type         string      `json:"type"`
	ProjectID    *uuid.UUID  `json:"projectId,omitempty"`
	IssueID      *uuid.UUID  `json:"issueId,omitempty"`
	TargetUserID *uuid.UUID  `json:"targetUserId,omitempty"`
	Data         interface{} `json:"data"`
	UserID       uuid.UUID   `json:"userId"`
}

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[*Client]bool),
		Broadcast:  make(chan *Message, 256),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client] = true
			h.mu.Unlock()
			log.Printf("Client registered: %s", client.ID)

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				log.Printf("Client unregistered: %s", client.ID)
			}
			h.mu.Unlock()

		case message := <-h.Broadcast:
			h.broadcastMessage(message)
		}
	}
}

func (h *Hub) broadcastMessage(message *Message) {
	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.Clients {
		// If message has a TargetUserID, only send to that specific user
		if message.TargetUserID != nil {
			if client.UserID != *message.TargetUserID {
				continue
			}
		}

		// If message has a projectID, only send to clients subscribed to that project
		// Note: Notifications usually don't have projectID unless we want them to respect subscription,
		// but usually a direct notification (TargetUserID) overrides project subscription.
		if message.ProjectID != nil && message.TargetUserID == nil {
			if !client.Projects[*message.ProjectID] {
				continue
			}
		}

		select {
		case client.Send <- messageBytes:
		default:
			// Client's send buffer is full, remove client
			close(client.Send)
			delete(h.Clients, client)
		}
	}
}

func (h *Hub) BroadcastToProject(projectID uuid.UUID, messageType string, data interface{}, userID uuid.UUID) {
	message := &Message{
		Type:      messageType,
		ProjectID: &projectID,
		Data:      data,
		UserID:    userID,
	}
	h.Broadcast <- message
}

func (h *Hub) BroadcastToIssue(projectID, issueID uuid.UUID, messageType string, data interface{}, userID uuid.UUID) {
	message := &Message{
		Type:      messageType,
		ProjectID: &projectID,
		IssueID:   &issueID,
		Data:      data,
		UserID:    userID,
	}
	h.Broadcast <- message
}
