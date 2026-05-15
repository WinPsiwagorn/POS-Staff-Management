package repository

import (
	"context"
	"time"

	"staff-call-backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type callRepositoryMongo struct {
	collection *mongo.Collection
}

func NewCallRepository(
	db *mongo.Database,
) CallRepository {
	return &callRepositoryMongo{
		collection: db.Collection("calls"),
	}
}
func (r *callRepositoryMongo) Create(
	ctx context.Context,
	call *models.Call,
) error {

	_, err := r.collection.InsertOne(ctx, call)

	return err
}
func (r *callRepositoryMongo) FindActive(
	ctx context.Context,
) ([]models.Call, error) {

	filter := bson.M{
		"status": bson.M{
			"$nin": bson.A{"resolved", "cancelled", "no_longer_needed"},
		},
	}

	cursor, err := r.collection.Find(
		ctx,
		filter,
	)

	if err != nil {
		return nil, err
	}

	defer cursor.Close(ctx)

	var calls []models.Call

	err = cursor.All(ctx, &calls)

	if err != nil {
		return nil, err
	}

	return calls, nil
}
func (r *callRepositoryMongo) FindPendingDuplicate(
	ctx context.Context,
	tableID primitive.ObjectID,
	callType string,
) (*models.Call, error) {

	filter := bson.M{
		"table_id": tableID,
		"type":     callType,
		"status":   "pending",
	}

	var call models.Call

	err := r.collection.FindOne(
		ctx,
		filter,
	).Decode(&call)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}

		return nil, err
	}

	return &call, nil
}

func (r *callRepositoryMongo) AssignCall(
	ctx context.Context,
	callID primitive.ObjectID,
	staffID primitive.ObjectID,
	staffName string,
) (*models.Call, error) {

	now := time.Now()

	filter := bson.M{
		"_id":   callID,
		"status": "pending",
	}

	update := bson.M{
		"$set": bson.M{
			"status":             "assigned",
			"assigned_staff_id": staffID,
			"assigned_staff":    staffName,
			"assigned_at":       now,
		},
	}

	opts := options.FindOneAndUpdate().
		SetReturnDocument(options.After)

	var updatedCall models.Call

	err := r.collection.FindOneAndUpdate(
		ctx,
		filter,
		update,
		opts,
	).Decode(&updatedCall)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}

		return nil, err
	}

	return &updatedCall, nil
}
func (r *callRepositoryMongo) ResolveCall(
	ctx context.Context,
	callID primitive.ObjectID,
) (*models.Call, error) {

	now := time.Now()

	filter := bson.M{
		"_id": callID,
		"status": bson.M{
			"$nin": bson.A{"resolved", "cancelled", "no_longer_needed"},
		},
	}

	update := bson.M{
		"$set": bson.M{
			"status":      "resolved",
			"resolved_at": now,
		},
	}

	opts := options.FindOneAndUpdate().
		SetReturnDocument(options.After)

	var updatedCall models.Call

	err := r.collection.FindOneAndUpdate(
		ctx,
		filter,
		update,
		opts,
	).Decode(&updatedCall)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}

		return nil, err
	}

	return &updatedCall, nil
}

func (r *callRepositoryMongo) CancelCall(
	ctx context.Context,
	callID primitive.ObjectID,
) (*models.Call, error) {

	now := time.Now()

	opts := options.FindOneAndUpdate().
		SetReturnDocument(options.After)

	var updatedCall models.Call

	err := r.collection.FindOneAndUpdate(
		ctx,
		bson.M{
			"_id":    callID,
			"status": "pending",
		},
		bson.M{
			"$set": bson.M{
				"status":       "cancelled",
				"cancelled_at": now,
			},
		},
		opts,
	).Decode(&updatedCall)

	if err == nil {
		return &updatedCall, nil
	}

	if err != mongo.ErrNoDocuments {
		return nil, err
	}

	err = r.collection.FindOneAndUpdate(
		ctx,
		bson.M{
			"_id":    callID,
			"status": "assigned",
		},
		bson.M{
			"$set": bson.M{
				"status":              "no_longer_needed",
				"no_longer_needed_at": now,
			},
		},
		opts,
	).Decode(&updatedCall)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}

		return nil, err
	}

	return &updatedCall, nil
}
