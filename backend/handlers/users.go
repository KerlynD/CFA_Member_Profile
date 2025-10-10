package handlers

import (
	"context"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
)

// GET /api/users
func GetUsers(c *fiber.Ctx) error {
	/*
		Gets all users from the database
		Returns a JSON array of all users
	*/

	// Query the database for all users
	rows, err := db.Pool.Query(context.Background(), 
		"SELECT id, google_id, name, email, picture, school, headline, location FROM users ORDER BY name ASC")
	if err != nil {
		log.Println("DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database query failed"})
	}
	defer rows.Close()

	// Scan the database rows into a slice of users
	users := []models.User{}
	for rows.Next() {
		var user models.User
		if err := rows.Scan(&user.ID, &user.GoogleID, &user.Name, &user.Email, &user.Picture, &user.School, &user.Headline, &user.Location); err != nil {
			log.Println("Scanner Error: ", err)
			continue
	}
		users = append(users, user)
	}
	return c.JSON(users)
}

// PUT /api/users/:id
func UpdateUser(c *fiber.Ctx) error {
	/*
		Updates a user in the database
		Requires the user's ID to be in the URL parameters
		Requires the user's school, headline, and location to be in the request body
	*/
	id := c.Params("id")
	var body models.User

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body/JSON"})
	}

	_, err := db.Pool.Exec(context.Background(), 
		"UPDATE users SET school = $1, headline = $2, location = $3 WHERE id = $4",
		body.School, body.Headline, body.Location, id)

	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database update failed"})
	}

	return c.JSON(fiber.Map{"message": "User updated successfully"})
}

// DELETE /api/users/:id // TODO: Implement