package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/KerlynD/CFA_Member_Profile/backend/handlers"
)

func RegisterRoutes(app *fiber.App) {
	// Auth
	app.Get("/api/auth/google/login", handlers.GoogleLogin)
	app.Get("/api/auth/google/callback", handlers.GoogleCallback)

	// Users
	app.Get("/api/users", handlers.GetUsers)
	app.Put("/api/users/:id", handlers.UpdateUser)

	// Offers
	app.Get("/api/offers", handlers.GetOffers)
	app.Post("/api/offers", handlers.AddOffer)

	// Events
	app.Get("/api/events", handlers.GetEvents)
	app.Post("/api/events", handlers.AddEvent)
}
