package handlers

import (
	"context"
	"log"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
	"github.com/gofiber/fiber/v2"
)

// PUT /api/users/me
func UpdateMyProfile(c *fiber.Ctx) error {
	/*
		Updates the current user's profile
		Requires the user's name, school, headline, and location to be in the request body
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

	var body models.User
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body/JSON"})
	}

	// Handle nil pointers; use empty string if nil
	school := ""
	if body.School != nil {
		school = *body.School
	}
	headline := ""
	if body.Headline != nil {
		headline = *body.Headline
	}
	location := ""
	if body.Location != nil {
		location = *body.Location
	}

	_, err = db.Pool.Exec(context.Background(),
		`UPDATE users 
		SET name = $1, school = $2, headline = $3, location = $4 
		WHERE id = $5`,
		body.Name, school, headline, location, claims.UserID)
	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database update failed: " + err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Profile updated successfully"})
}
