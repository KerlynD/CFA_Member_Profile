package routes

import (
	"github.com/KerlynD/CFA_Member_Profile/backend/handlers"
	"github.com/KerlynD/CFA_Member_Profile/backend/middleware"
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app *fiber.App) {
	// --- AUTHENTICATION ---
	app.Get("/api/auth/google/login", handlers.GoogleLogin)
	app.Get("/api/auth/google/callback", handlers.GoogleCallback)

	// LinkedIn Integration (not auth)
	app.Get("/api/integrations/linkedin/connect", handlers.LinkedInIntegrationLogin)
	app.Get("/api/integrations/linkedin/callback", handlers.LinkedInIntegrationCallback)

	// Discord Auth
	app.Get("/api/auth/discord/login", handlers.DiscordLogin)
	app.Get("/api/auth/discord/callback", handlers.DiscordCallback)

	// GitHub Auth
	app.Get("/api/auth/github/login", handlers.GithubLogin)
	app.Get("/api/auth/github/callback", handlers.GithubCallback)

	// Logout
	app.Get("/api/logout", handlers.Logout)

	// --- PUBLIC ENDPOINTS ---

	// Users
	app.Get("/api/users", handlers.GetUsers)
	app.Get("/api/users/:id", handlers.GetUserProfile)
	app.Get("/api/users/:id/education", handlers.GetUserEducation)
	app.Get("/api/users/:id/work", handlers.GetUserWork)
	app.Get("/api/users/:id/events", handlers.GetUserEvents)
	app.Get("/api/users/:id/github", handlers.GetUserGithub)
	app.Get("/api/users/:id/linkedin", handlers.GetUserLinkedIn)

	// Offers
	app.Get("/api/offers", handlers.GetOffers)

	// Events
	app.Get("/api/events", handlers.GetEvents)
	app.Get("/api/events/:id/attendees", handlers.GetEventAttendees)

	// --- PROTECTED ENDPOINTS ---
	auth := app.Group("/api", middleware.RequireAuth)

	// Event Registration
	auth.Post("/events/:id/register", handlers.RegisterForEvent)
	auth.Delete("/events/:id/register", handlers.UnregisterFromEvent)

	// Profile - IMPORTANT: Specific routes must come before parameterized routes
	auth.Get("/me", handlers.GetCurrentUser)
	auth.Put("/users/me", handlers.UpdateMyProfile)
	auth.Post("/users/me/picture", handlers.UploadProfilePicture)
	auth.Put("/users/:id", handlers.UpdateUser)

	// Integrations
	auth.Get("/integrations", handlers.GetIntegrationsOverview)
	auth.Post("/integrations/discord/verify", handlers.VerifyDiscordMembership)

	// LeetCode Leaderboard lookup (read-only)
	auth.Get("/leetcode/lookup", handlers.GetLeetCodeStats)

	// Offers
	auth.Post("/offers", handlers.AddOffer)

	// Discord Integration
	auth.Get("/integrations/discord", handlers.GetDiscordIntegration)

	// GitHub Integration
	auth.Get("/integrations/github", handlers.GetGithubIntegration)
	auth.Get("/integrations/github/repos", handlers.GetGithubRepos)
	auth.Post("/integrations/github/repos", handlers.SaveTopRepos)

	// LinkedIn Integration
	auth.Get("/integrations/linkedin", handlers.GetLinkedInIntegration)
	auth.Delete("/integrations/linkedin", handlers.DisconnectLinkedIn)
	auth.Put("/integrations/linkedin/url", handlers.UpdateLinkedInProfileURL)

	// Work History
	auth.Post("/work_history", handlers.AddWorkHistory)
	auth.Get("/work_history", handlers.GetWorkHistory)
	auth.Put("/work_history/:id", handlers.UpdateWorkHistory)
	auth.Delete("/work_history/:id", handlers.DeleteWorkHistory)

	// Education History
	auth.Get("/education_history", handlers.GetEducationHistory)
	auth.Post("/education_history", handlers.AddEducationHistory)
	auth.Put("/education_history/:id", handlers.UpdateEducationHistory)
	auth.Delete("/education_history/:id", handlers.DeleteEducationHistory)

	// --- ADMIN-ONLY ENDPOINTS ---
	admin := app.Group("/api/admin", middleware.RequireAuth, middleware.RequireAdmin)
	admin.Post("/events", handlers.AddEvent)
	admin.Put("/events/:id", handlers.UpdateEvent)
	admin.Delete("/events/:id", handlers.DeleteEvent)
}
