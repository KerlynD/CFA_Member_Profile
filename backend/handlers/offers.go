package handlers

import (
	"context"
	"log"
	"time"
	"github.com/gofiber/fiber/v2"
	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
)

// GET /api/offers
func GetOffers(c *fiber.Ctx) error {
	/*
		Gets all offers from the database
		Returns a JSON array of all offers
	*/

	// Query the database for all offers
	rows, err := db.Pool.Query(context.Background(), 
		"SELECT id, user_id, company, role, hourly_rate, monthly_rate, location, created_at FROM offers ORDER BY created_at DESC")
	if err != nil {
		log.Println("DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database query failed"})
	}
	defer rows.Close()

	// Scan the database rows into a slice of offers
	offers := []models.Offer{}
	for rows.Next() {
		var offer models.Offer

		err := rows.Scan(&offer.ID, &offer.UserID, &offer.Company, &offer.Role, &offer.HourlyRate, &offer.MonthlyRate, &offer.Location, &offer.CreatedAt)
		
		if err != nil {
			log.Println("Scanner Error: ", err)
			continue
		}
		offers = append(offers, offer)
	}
	return c.JSON(offers)
}

// POST /api/offers
func AddOffer(c *fiber.Ctx) error {
	/*
		Adds a new offer to the database
		Requires the offer's company, role, hourly rate, monthly rate, and location to be in the request body
	*/
	var body models.Offer
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body/JSON"})
	}

	// Set created_at to the current time server-side
	body.CreatedAt = time.Now()

	// Insert the offer into the database
	_, err := db.Pool.Exec(context.Background(), 
		`INSERT INTO offers (user_id, company, role, hourly_rate, monthly_rate, location, created_at) 
		VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		body.UserID, body.Company, body.Role, body.HourlyRate, body.MonthlyRate, body.Location, body.CreatedAt)
	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database insert failed"})
	}
	return c.JSON(fiber.Map{"message": "Offer added successfully"})
}


// DELETE /api/offers/:id // TODO: Implement ADMIN ONLY