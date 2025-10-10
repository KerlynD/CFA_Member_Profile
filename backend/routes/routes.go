package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/KerlynD/CFA_Member_Profile/backend/handlers"
	"github.com/KerlynD/CFA_Member_Profile/backend/middleware"
)

func RegisterRoutes(app *fiber.App) {
	// Auth
	app.Get("/api/auth/google/login", handlers.GoogleLogin)
	app.Get("/api/auth/google/callback", handlers.GoogleCallback)
	

	// Public endpoints
	app.Get("/api/users", handlers.GetUsers)
	app.Get("/api/offers", handlers.GetOffers)
	app.Get("/api/events", handlers.GetEvents)
	app.Get("/api/logout", handlers.Logout)

	// Protected endpoints
	auth := app.Group("/api", middleware.RequireAuth)

	auth.Get("/me", handlers.GetCurrentUser)
	auth.Put("/users/:id", handlers.UpdateUser)
	auth.Post("/offers", handlers.AddOffer)

	// Admin-only routes
	admin := app.Group("/api/admin", middleware.RequireAuth, middleware.RequireAdmin)
	admin.Post("/events", handlers.AddEvent)
}
