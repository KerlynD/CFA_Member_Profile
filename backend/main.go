package main

import (
	"log"
	"os"
	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/handlers"
	"github.com/KerlynD/CFA_Member_Profile/backend/routes"
)

func main() {
	/*
	Main function for the backend
	Loads environment variables from .env file
	Connects to the database
	Initializes the OAuth configuration
	Starts the Fiber server
	*/
	godotenv.Load()
	db.Connect()
	handlers.InitOAuth()

	app := fiber.New()

	routes.RegisterRoutes(app)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Fatal(app.Listen(":" + port))
}