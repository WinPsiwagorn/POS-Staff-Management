package service

import (
	"context"

	"staff-call-backend/internal/models"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CallService interface {
	CreateCall(
		ctx context.Context,
		tableID primitive.ObjectID,
		tableLabel string,
		callType string,
		specialRequest string,
	) (*models.Call, error)

	GetActiveCalls(
		ctx context.Context,
	) ([]models.Call, error)
	AssignCall(
	ctx context.Context,
	callID primitive.ObjectID,
	staffID primitive.ObjectID,
	staffName string,
) 	(*models.Call, error)
	ResolveCall(
	ctx context.Context,
	callID primitive.ObjectID,
) (*models.Call, error)

	CancelCall(
	ctx context.Context,
	callID primitive.ObjectID,
) (*models.Call, error)

}
