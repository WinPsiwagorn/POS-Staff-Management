package routes

import (
	"staff-call-backend/internal/database"
	"staff-call-backend/internal/handler"
	"staff-call-backend/internal/repository"
	"staff-call-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	fiberws "github.com/gofiber/websocket/v2"
)

func SetupRoutes(app *fiber.App) {

	callRepo := repository.NewCallRepository(
		database.DB,
	)

	callService := service.NewCallService(
		callRepo,
	)

	callHandler := handler.NewCallHandler(
		callService,
	)

	app.Get("/ws", fiberws.New(handler.WebSocketHandler))

	api := app.Group("/api")

	calls := api.Group("/calls")

	calls.Post("/", callHandler.CreateCall)

	calls.Get("/active", callHandler.GetActiveCalls)

	calls.Patch("/:id/assign", callHandler.AssignCall)

	calls.Patch("/:id/resolve", callHandler.ResolveCall)
}