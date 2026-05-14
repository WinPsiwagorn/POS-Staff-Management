package service

import (
	"context"
	"time"

	"staff-call-backend/internal/models"
	"staff-call-backend/internal/repository"
	"staff-call-backend/internal/websocket"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type callService struct {
	callRepo repository.CallRepository
}

func NewCallService(
	callRepo repository.CallRepository,
) CallService {
	return &callService{
		callRepo: callRepo,
	}
}
func getPriority(callType string) int {
	switch callType {
	case "urgent_help":
		return 1

	case "request_bill":
		return 2

	default:
		return 3
	}
}
func (s *callService) CreateCall(
	ctx context.Context,
	tableID primitive.ObjectID,
	tableLabel string,
	callType string,
	specialRequest string,
) (*models.Call, error) {
	

	// Prevent duplicate pending calls
	existing, err := s.callRepo.FindPendingDuplicate(
		ctx,
		tableID,
		callType,
	)

	if err != nil {
		return nil, err
	}

	if existing != nil {
		return existing, nil
	}

	call := &models.Call{
		ID: primitive.NewObjectID(),

		TableID:    tableID,
		TableLabel: tableLabel,

		Type: callType,
		Status: "pending",

		SpecialRequest: specialRequest,

		Priority: getPriority(callType),

		CreatedAt: time.Now(),
	}

	err = s.callRepo.Create(ctx, call)

if err != nil {
	return nil, err
}

websocket.HubInstance.Broadcast <- websocket.Event{
	Type: "call_created",
	Payload: call,
}

return call, nil
}

func (s *callService) GetActiveCalls(
	ctx context.Context,
) ([]models.Call, error) {

	return s.callRepo.FindActive(ctx)
}

func (s *callService) AssignCall(
	ctx context.Context,
	callID primitive.ObjectID,
	staffID primitive.ObjectID,
	staffName string,
) (*models.Call, error) {

	call, err := s.callRepo.AssignCall(
		ctx,
		callID,
		staffID,
		staffName,
	)

	if err != nil {
		return nil, err
	}

	if call != nil {
	websocket.HubInstance.Broadcast <- websocket.Event{
		Type: "call_assigned",
		Payload: call,
	}
}
	return call, nil
}

func (s *callService) ResolveCall(
	ctx context.Context,
	callID primitive.ObjectID,
) (*models.Call, error) {

	call, err := s.callRepo.ResolveCall(
		ctx,
		callID,
	)

	if err != nil {
		return nil, err
	}

	if call != nil {
		websocket.HubInstance.Broadcast <- websocket.Event{
			Type: "call_resolved",
			Payload: call,
		}
	}

	return call, nil
}

