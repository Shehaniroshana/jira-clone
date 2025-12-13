package websocket

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

func HandleConnection(hub *Hub, conn *websocket.Conn, token string) {
	client := &Client{
		ID:       uuid.New(),
		Hub:      hub,
		Send:     make(chan []byte, 256),
		Projects: make(map[uuid.UUID]bool),
	}

	client.Hub.Register <- client
	log.Printf("Client %s connected with token", client.ID)

	go client.writePump(conn)
	client.readPump(conn)
}

func (c *Client) readPump(conn *websocket.Conn) {
	defer func() {
		c.Hub.Unregister <- c
		conn.Close()
	}()

	conn.SetReadDeadline(time.Now().Add(pongWait))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		c.handleMessage(message)
	}
}

func (c *Client) writePump(conn *websocket.Conn) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleMessage(message []byte) {
	var msg map[string]interface{}
	if err := json.Unmarshal(message, &msg); err != nil {
		log.Printf("Error unmarshaling message: %v", err)
		return
	}

	msgType, ok := msg["type"].(string)
	if !ok {
		return
	}

	switch msgType {
	case "subscribe":
		if projectIDStr, ok := msg["projectId"].(string); ok {
			if projectID, err := uuid.Parse(projectIDStr); err == nil {
				c.Projects[projectID] = true
				log.Printf("Client %s subscribed to project %s", c.ID, projectID)
			}
		}

	case "unsubscribe":
		if projectIDStr, ok := msg["projectId"].(string); ok {
			if projectID, err := uuid.Parse(projectIDStr); err == nil {
				delete(c.Projects, projectID)
				log.Printf("Client %s unsubscribed from project %s", c.ID, projectID)
			}
		}

	case "auth":
		// Handle authentication
		if userIDStr, ok := msg["userId"].(string); ok {
			if userID, err := uuid.Parse(userIDStr); err == nil {
				c.UserID = userID
				log.Printf("Client %s authenticated as user %s", c.ID, userID)
			}
		}
	}
}
