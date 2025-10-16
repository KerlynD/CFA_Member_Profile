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

// PUT /api/work_history/:id
func UpdateWorkHistory(c *fiber.Ctx) error {
	/*
		Updates an existing work history entry
		Requires the work history ID in the URL
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

	// Get the work history ID from the URL
	id := c.Params("id")

	var body models.WorkHistory
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body/JSON"})
	}

	// Generate company logo URL using logo.dev
	companyLogo := getCompanyLogoURL(body.Company)

	// Update the work history in the database
	result, err := db.Pool.Exec(context.Background(),
		`UPDATE work_history 
		SET company=$1, company_logo_url=$2, title=$3, start_date=$4, end_date=$5, location=$6, description=$7
		WHERE id=$8 AND user_id=$9`,
		body.Company, companyLogo, body.Title, body.StartDate, body.EndDate,
		body.Location, body.Description, id, claims.UserID)

	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database update failed"})
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Work history not found or unauthorized"})
	}

	return c.JSON(fiber.Map{"message": "Work history updated successfully"})
}

// DELETE /api/work_history/:id
func DeleteWorkHistory(c *fiber.Ctx) error {
	/*
		Deletes a work history entry
		Requires the work history ID in the URL
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

	// Get the work history ID from the URL
	id := c.Params("id")

	// Delete the work history from the database
	result, err := db.Pool.Exec(context.Background(),
		`DELETE FROM work_history WHERE id=$1 AND user_id=$2`,
		id, claims.UserID)

	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database delete failed"})
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Work history not found or unauthorized"})
	}

	return c.JSON(fiber.Map{"message": "Work history deleted successfully"})
}
