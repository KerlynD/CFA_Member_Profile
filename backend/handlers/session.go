package handlers

import (
	"context"
	"github.com/gofiber/fiber/v2"
	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
)

// GET /api/me
func GetCurrentUser(c *fiber.Ctx) error {
	/*
		Gets the current user from the database
		Returns a JSON object of the user
	*/

	// Get & Verify JWT
	token := c.Cookies("session")
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
	
	var user models.User

	err = db.Pool.QueryRow(context.Background(),
		`SELECT id, name, email, picture, school, headline, location, is_admin FROM users WHERE id = $1`,
		claims.UserID,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Picture, 
		&user.School, &user.Headline, &user.Location, &user.IsAdmin)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "User not found",
		})
	}
	
	return c.JSON(user)
}