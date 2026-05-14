package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port      string
	MongoURI  string
	Database  string
}

func LoadConfig() *Config {
	err := godotenv.Load()

	if err != nil {
		log.Println("No .env file found")
	}

	return &Config{
		Port:     os.Getenv("PORT"),
		MongoURI: os.Getenv("MONGO_URI"),
		Database: os.Getenv("DB_NAME"),
	}
}