package handlers

import (
	"context"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
	"github.com/gofiber/fiber/v2"
)

// GET /api/integrations
func GetIntegrationsOverview(c *fiber.Ctx) error {
	/*
		Gets the overview of all integrations for the current user
		Returns a JSON object of the integrations overview
	*/

	// Get & Verify JWT
	token := utils.GetTokenFromRequest(c)
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized/No JWT found",
		})
	}

	claims, err := utils.VerifyJWT(token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Expired/Invalid JWT",
		})
	}

	userID := claims.UserID

	// Create container for integrations overview
	integrationsOverview := fiber.Map{
		"google":   fiber.Map{"linked": false},
		"linkedin": fiber.Map{"linked": false},
		"discord":  fiber.Map{"linked": false},
	}

	// Check if Google is linked
	var googleEmail string
	err = db.Pool.QueryRow(context.Background(),
		`SELECT email FROM users WHERE id = $1`,
		userID,
	).Scan(&googleEmail)

	if err == nil && googleEmail != "" {
		integrationsOverview["google"] = fiber.Map{
			"linked": true,
			"email":  googleEmail,
		}
	}

	// Check if LinkedIn is linked
	var linkedinCount int
	err = db.Pool.QueryRow(context.Background(),
		`SELECT COUNT(*) FROM work_history WHERE user_id = $1`,
		userID,
	).Scan(&linkedinCount)

	if err == nil && linkedinCount > 0 {
		var name string
		db.Pool.QueryRow(context.Background(),
			`SELECT name FROM users WHERE id = $1`,
			userID,
		).Scan(&name)
		integrationsOverview["linkedin"] = fiber.Map{
			"linked": true,
			"name":   name,
		}
	}

	// Check if Discord is linked
	var discordUsername, discordAvatar string
	err = db.Pool.QueryRow(context.Background(),
		`SELECT username, avatar_url FROM discord_integrations WHERE user_id = $1`,
		userID,
	).Scan(&discordUsername, &discordAvatar)

	if err == nil && discordUsername != "" {
		integrationsOverview["discord"] = fiber.Map{
			"linked":   true,
			"username": discordUsername,
			"avatar":   discordAvatar,
		}
	}

	return c.JSON(integrationsOverview)
}
