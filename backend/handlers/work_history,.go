package handlers

import (
	"context"
	"log"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
	"github.com/gofiber/fiber/v2"
)

// GET /api/work_history
func GetWorkHistory(c *fiber.Ctx) error {
	/*
		Gets all work history from the database
		Returns a JSON array of all work history
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

	// Query the database for all work history
	rows, err := db.Pool.Query(context.Background(),
		`SELECT id, user_id, company, company_logo_url, title, start_date, end_date, location, description, created_at 
		FROM work_history WHERE user_id = $1 
		ORDER BY created_at DESC`,
		claims.UserID)

	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database query failed"})
	}
	defer rows.Close()

	// Scan the database rows into a slice of work history
	history := []models.WorkHistory{}
	for rows.Next() {
		var workHistory models.WorkHistory
		rows.Scan(&workHistory.ID, &workHistory.UserID, &workHistory.Company,
			&workHistory.CompanyLogoURL, &workHistory.Title, &workHistory.StartDate,
			&workHistory.EndDate, &workHistory.Location, &workHistory.Description,
			&workHistory.CreatedAt)
		history = append(history, workHistory)
	}
	return c.JSON(history)
}

// POST /api/work_history
func AddWorkHistory(c *fiber.Ctx) error {
	/*
		Adds a new work history to the database
		Requires the work history's company, title, start_date, end_date, location, and description to be in the request body
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

	var body models.WorkHistory
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body/JSON"})
	}

	// Generate company logo URL using Clearbit
	companyLogo := getCompanyLogoURL(body.Company)

	// Insert the work history into the database
	_, err = db.Pool.Exec(context.Background(),
		`INSERT INTO work_history (user_id, company, company_logo_url, title, start_date, end_date, location, description)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		claims.UserID, body.Company, companyLogo, body.Title, body.StartDate, body.EndDate,
		body.Location, body.Description)

	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database insert failed"})
	}

	return c.JSON(fiber.Map{"message": "Work history added successfully"})
}
