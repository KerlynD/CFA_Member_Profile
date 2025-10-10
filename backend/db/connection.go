package db

import (
	"context"
	"os"
	"log"
	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func Connect() {
	dbUrl := os.Getenv("DATABASE_URL")
	var err error
	Pool, err = pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v\n", err)
	}
	log.Println("Connected to database")
}