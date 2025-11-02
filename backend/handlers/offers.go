package handlers

import (
	"context"
	"log"
	"time"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
	"github.com/gofiber/fiber/v2"
)

// GET /api/offers
func GetOffers(c *fiber.Ctx) error {
	/*
		Gets all offers from the database
		Returns a JSON array of all offers
	*/

	// Query the database for all offers
	rows, err := db.Pool.Query(context.Background(),
		"SELECT id, user_id, company, company_logo_url, role, offer_type, hourly_rate, monthly_rate, location, created_at FROM offers ORDER BY created_at DESC")
	if err != nil {
		log.Println("DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database query failed"})
	}
	defer rows.Close()

	// Scan the database rows into a slice of offers
	offers := []models.Offer{}
	for rows.Next() {
		var offer models.Offer

		err := rows.Scan(&offer.ID, &offer.UserID, &offer.Company, &offer.CompanyLogoURL, &offer.Role, &offer.OfferType, &offer.HourlyRate, &offer.MonthlyRate, &offer.Location, &offer.CreatedAt)

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
		Requires the offer's company, role, offer_type, hourly rate, monthly rate, and location to be in the request body
	*/

	// Get & Verify JWT to get the authenticated user's ID
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

	var body models.Offer
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body/JSON"})
	}

	// Generate company logo URL using logo.dev
	companyLogo := getCompanyLogoURL(body.Company)

	// Set created_at to the current time server-side
	body.CreatedAt = time.Now()

	// Insert the offer into the database using the authenticated user's ID
	_, err = db.Pool.Exec(context.Background(),
		`INSERT INTO offers (user_id, company, company_logo_url, role, offer_type, hourly_rate, monthly_rate, location, created_at) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		claims.UserID, body.Company, companyLogo, body.Role, body.OfferType, body.HourlyRate, body.MonthlyRate, body.Location, body.CreatedAt)
	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database insert failed"})
	}
	return c.JSON(fiber.Map{"message": "Offer added successfully"})
}

// DELETE /api/offers/:id // TODO: Implement ADMIN ONLY
