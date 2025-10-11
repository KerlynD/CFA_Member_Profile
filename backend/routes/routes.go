package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/KerlynD/CFA_Member_Profile/backend/handlers"
	"github.com/KerlynD/CFA_Member_Profile/backend/middleware"
)

func RegisterRoutes(app *fiber.App) {
	// --- AUTHENTICATION ---
	app.Get("/api/auth/google/login", handlers.GoogleLogin)
	app.Get("/api/auth/google/callback", handlers.GoogleCallback)

	// LinkedIn Auth
	app.Get("/api/auth/linkedin/login", handlers.LinkedInLogin)
	app.Get("/api/auth/linkedin/callback", handlers.LinkedInCallback)

	// Discord Auth
	app.Get("/api/auth/discord/login", handlers.DiscordLogin)
	app.Get("/api/auth/discord/callback", handlers.DiscordCallback)

	// Logout
	app.Get("/api/logout", handlers.Logout)

	// --- PUBLIC ENDPOINTS ---

	// Users
	app.Get("/api/users", handlers.GetUsers)

	// Offers
	app.Get("/api/offers", handlers.GetOffers)

	// Events
	app.Get("/api/events", handlers.GetEvents)

	// --- PROTECTED ENDPOINTS ---
	auth := app.Group("/api", middleware.RequireAuth)

	// Profile
	auth.Get("/me", handlers.GetCurrentUser)
	auth.Put("/users/:id", handlers.UpdateUser)
	auth.Put("/users/me", handlers.UpdateMyProfile)

	// Integrations
	auth.Get("/integrations", handlers.GetIntegrationsOverview)

	// Offers
	auth.Post("/offers", handlers.AddOffer)

	// Discord Integration
	auth.Get("/integrations/discord", handlers.GetDiscordIntegration)

	// Work History
	auth.Post("/work_history", handlers.AddWorkHistory)
	auth.Get("/work_history", handlers.GetWorkHistory)

	// Education History
	auth.Get("/education_history", handlers.GetEducationHistory)
	auth.Post("/education_history", handlers.AddEducationHistory)


	// --- ADMIN-ONLY ENDPOINTS ---
	admin := app.Group("/api/admin", middleware.RequireAuth, middleware.RequireAdmin)
	admin.Post("/events", handlers.AddEvent)
}
