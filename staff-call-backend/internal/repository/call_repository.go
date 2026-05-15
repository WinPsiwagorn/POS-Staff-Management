package repository

import (
	"context"

	"staff-call-backend/internal/models"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CallRepository interface {
	Create(
		ctx context.Context,
		call *models.Call,
	) error

	FindActive(
		ctx context.Context,
	) ([]models.Call, error)

	FindPendingDuplicate(
		ctx context.Context,
		tableID primitive.ObjectID,
		callType string,
	) (*models.Call, error)

	AssignCall(
		ctx context.Context,
		callID primitive.ObjectID,
		staffID primitive.ObjectID,
		staffName string,
	) (*models.Call, error)

	ResolveCall(
		ctx context.Context,
		callID primitive.ObjectID,
	) (*models.Call, error)

	CancelCall(
		ctx context.Context,
		callID primitive.ObjectID,
	) (*models.Call, error)
}
