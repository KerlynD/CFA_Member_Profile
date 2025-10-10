package handlers

import (
	"context"
	"log"
	"github.com/gofiber/fiber/v2"
	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
)

// PUT /api/users/me
func UpdateMyProfile(c *fiber.Ctx) error {
	/*
		Updates the current user's profile
		Requires the user's school, headline, and location to be in the request body
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
	
	var body models.User
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body/JSON"})
	}

	_, err = db.Pool.Exec(context.Background(), 
		`UPDATE users 
		SET school = $1, headline = $2, location = $3 
		WHERE id = $4`,
		body.School, body.Headline, body.Location, claims.UserID)
	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database update failed: " + err.Error()})
	}
	
	return c.JSON(fiber.Map{"message": "Profile updated successfully"})
}
	