package handlers

import (
	"context"
	"log"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
	"github.com/gofiber/fiber/v2"
)

// GET /api/education_history
func GetEducationHistory(c *fiber.Ctx) error {
	/*
		Gets all education history from the database
		Returns a JSON array of all education history
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

	// Query the database for all education history
	rows, err := db.Pool.Query(context.Background(),
		`SELECT id, user_id, school_name, school_logo_url, degree, field_of_study, start_date, end_date, location, description, created_at 
		FROM education_history WHERE user_id = $1 ORDER BY created_at DESC`, claims.UserID)

	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database query failed: " + err.Error()})
	}
	defer rows.Close()

	educationHistory := []models.EducationHistory{}
	for rows.Next() {
		var education models.EducationHistory
		rows.Scan(&education.ID, &education.UserID, &education.SchoolName, &education.SchoolLogoURL, &education.Degree, &education.FieldOfStudy, &education.StartDate, &education.EndDate, &education.Location, &education.Description, &education.CreatedAt)
		educationHistory = append(educationHistory, education)
	}

	return c.JSON(educationHistory)
}

// POST /api/education_history
func AddEducationHistory(c *fiber.Ctx) error {
	/*
		Adds a new education history to the database
		Requires the education history's school name, school logo url, degree, field of study, start date, end date, location, and description to be in the request body
	*/

	// Get & Verify JWT
	token := c.Cookies("session")
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized/No JWT found"})
	}

	claims, err := utils.VerifyJWT(token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Expired/Invalid JWT"})
	}

	var body models.EducationHistory
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body/JSON"})
	}

	// Auto-generate school logo URL if not provided
	schoolLogo := body.SchoolLogoURL
	if schoolLogo == "" && body.SchoolName != "" {
		schoolLogo = getSchoolLogoURL(body.SchoolName)
	}

	// Insert the education history into the database
	_, err = db.Pool.Exec(context.Background(),
		`INSERT INTO education_history (user_id, school_name, school_logo_url, degree, field_of_study, start_date, end_date, location, description)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		claims.UserID, body.SchoolName, schoolLogo, body.Degree, body.FieldOfStudy,
		body.StartDate, body.EndDate, body.Location, body.Description)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database insert failed: " + err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Education history added successfully"})
}
