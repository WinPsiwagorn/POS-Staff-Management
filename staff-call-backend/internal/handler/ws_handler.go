package handler

import (
	"staff-call-backend/internal/websocket"

	fiberws "github.com/gofiber/websocket/v2"
)

func WebSocketHandler(
	conn *fiberws.Conn,
) {

	client := &websocket.Client{
		Conn: conn,
		Send: make(chan websocket.Event, 32),
	}

	websocket.HubInstance.Register <- client

	defer func() {
		websocket.HubInstance.Unregister <- client
	}()

	client.WritePump()
}