package websocket

import (
	"encoding/json"
	"log"
	"time"
	fiberws "github.com/gofiber/websocket/v2"
)

type Client struct {
	Conn *fiberws.Conn
	Send chan Event
}

func (c *Client) WritePump() {
	defer c.Conn.Close()

	for event := range c.Send {

		message, err := json.Marshal(event)

		if err != nil {
			log.Println(err)
			continue
		}

		c.Conn.SetWriteDeadline(
			time.Now().Add(10 * time.Second),
)

		err = c.Conn.WriteMessage(
		fiberws.TextMessage,
		message,
)

		if err != nil {
			log.Println(err)
			return
		}
	}
}
func (c *Client) ReadPump(
	hub *Hub,
) {

	defer func() {
		hub.Unregister <- c
		c.Conn.Close()
	}()

	for {

		if _, _, err := c.Conn.ReadMessage(); err != nil {
			break
		}
	}
}