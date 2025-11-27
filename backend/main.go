package main

import (
	"log"
	"os"
	"strings"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/handlers"
	"github.com/KerlynD/CFA_Member_Profile/backend/routes"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
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
	handlers.InitDiscordOAuth()
	handlers.InitLinkedinOAuth()
	handlers.InitGithubOAuth()

	app := fiber.New()

	// CORS - Allow frontend origins
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	// Note: CORS AllowOrigins should be comma-separated without spaces
	allowedOrigins := strings.Join([]string{
		frontendURL,
		"https://cfa-member-profile.vercel.app",
	}, ",")

	app.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowCredentials: true,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		ExposeHeaders:    "Set-Cookie",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
	}))

	routes.RegisterRoutes(app)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Fatal(app.Listen(":" + port))
}
