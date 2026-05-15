package handler

import (
	"staff-call-backend/internal/handler/dto"
	"staff-call-backend/internal/service"
	appValidator "staff-call-backend/internal/validator"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CallHandler struct {
	callService service.CallService
}

func NewCallHandler(
	callService service.CallService,
) *CallHandler {
	return &CallHandler{
		callService: callService,
	}
}

func (h *CallHandler) CreateCall(
	c *fiber.Ctx,
) error {

	var req dto.CreateCallRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	if err := appValidator.Validate.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	tableID, err := primitive.ObjectIDFromHex(req.TableID)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid table ID",
		})
	}

	call, err := h.callService.CreateCall(
		c.UserContext(),
		tableID,
		req.TableLabel,
		req.Type,
		req.SpecialRequest,
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    call,
	})
}
func (h *CallHandler) GetActiveCalls(
	c *fiber.Ctx,
) error {

	calls, err := h.callService.GetActiveCalls(
		c.UserContext(),
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    calls,
	})
}

func (h *CallHandler) AssignCall(
	c *fiber.Ctx,
) error {

	callIDParam := c.Params("id")

	callID, err := primitive.ObjectIDFromHex(callIDParam)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid call ID",
		})
	}

	var req dto.AssignCallRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	if err := appValidator.Validate.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	staffID, err := primitive.ObjectIDFromHex(req.StaffID)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid staff ID",
		})
	}

	call, err := h.callService.AssignCall(
		c.UserContext(),
		callID,
		staffID,
		req.StaffName,
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	if call == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"success": false,
			"message": "Call already assigned",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    call,
	})
}

func (h *CallHandler) ResolveCall(
	c *fiber.Ctx,
) error {

	callIDParam := c.Params("id")

	callID, err := primitive.ObjectIDFromHex(callIDParam)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid call ID",
		})
	}

	call, err := h.callService.ResolveCall(
		c.UserContext(),
		callID,
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	if call == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"success": false,
			"message": "Call already resolved or cancelled",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    call,
	})
}

func (h *CallHandler) CancelCall(
	c *fiber.Ctx,
) error {

	callIDParam := c.Params("id")

	callID, err := primitive.ObjectIDFromHex(callIDParam)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid call ID",
		})
	}

	call, err := h.callService.CancelCall(
		c.UserContext(),
		callID,
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	if call == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"success": false,
			"message": "Call cannot be cancelled",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    call,
	})
}
