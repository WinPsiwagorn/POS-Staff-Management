package database

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func CreateIndexes(db *mongo.Database) {
	calls := db.Collection("calls")

	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "status", Value: 1},
			},
		},
		{
			Keys: bson.D{
				{Key: "table_id", Value: 1},
			},
		},
		{
			Keys: bson.D{
				{Key: "created_at", Value: 1},
			},
		},
		{
			Keys: bson.D{
				{Key: "type", Value: 1},
			},
		},
	}

	_, err := calls.Indexes().CreateMany(
		context.Background(),
		indexes,
	)

	if err != nil {
		log.Fatal(err)
	}

	log.Println("Indexes created")
}