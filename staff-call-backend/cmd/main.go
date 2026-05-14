package main

import (
	"log"

	"staff-call-backend/internal/config"
	"staff-call-backend/internal/database"
	"staff-call-backend/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"staff-call-backend/internal/websocket"
)

func main() {
	cfg := config.LoadConfig()

	database.ConnectMongo(cfg)

	database.CreateIndexes(database.DB)

	go websocket.HubInstance.Run()

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	routes.SetupRoutes(app)

	log.Fatal(app.Listen(":" + cfg.Port))
}