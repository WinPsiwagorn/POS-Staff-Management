package database

import (
	"context"
	"log"
	"time"

	"staff-call-backend/internal/config"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database

func ConnectMongo(cfg *config.Config) {
	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)

	defer cancel()

	client, err := mongo.Connect(
		ctx,
		options.Client().ApplyURI(cfg.MongoURI),
	)

	if err != nil {
		log.Fatal("Mongo connection failed: ", err)
	}

	err = client.Ping(ctx, nil)

	if err != nil {
		log.Fatal("Mongo ping failed: ", err)
	}

	DB = client.Database(cfg.Database)

	log.Println("MongoDB connected")
}