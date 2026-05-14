package websocket

import "log"

type Hub struct {
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan Event

	Clients map[*Client]bool
}

func NewHub() *Hub {
	return &Hub{
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan Event),

		Clients: make(map[*Client]bool),
	}
}
func (h *Hub) Run() {
	for {
		select {

	case client := <-h.Register:
		h.Clients[client] = true
		log.Println("Client connected")

	case client := <-h.Unregister:

		if _, ok := h.Clients[client]; ok {
		delete(h.Clients, client)
		close(client.Send)
		log.Println("Client disconnected")
	}

	case event := <-h.Broadcast:

			for client := range h.Clients {

				select {

				case client.Send <- event:

				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
		}
	}
}