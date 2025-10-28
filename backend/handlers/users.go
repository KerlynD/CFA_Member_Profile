package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
	"github.com/gofiber/fiber/v2"
)

// GET /api/users
func GetUsers(c *fiber.Ctx) error {
	/*
		Gets all users from the database with their schools from education history
		Returns a JSON array of all users
	*/

	// Query the database for all users with their schools and companies
	rows, err := db.Pool.Query(context.Background(), `
		SELECT DISTINCT u.id, u.google_id, u.name, u.email, u.picture, u.headline, u.location,
			COALESCE(
				NULLIF(u.school, ''), 
				(SELECT STRING_AGG(DISTINCT eh.school_name, ', ' ORDER BY eh.school_name) 
				 FROM education_history eh WHERE eh.user_id = u.id)
			) as schools,
			(SELECT STRING_AGG(DISTINCT wh.company, ', ' ORDER BY wh.company) 
			 FROM work_history wh WHERE wh.user_id = u.id) as companies
		FROM users u
		LEFT JOIN education_history eh ON u.id = eh.user_id
		LEFT JOIN work_history wh ON u.id = wh.user_id
		ORDER BY u.name ASC`)
	if err != nil {
		log.Println("DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database query failed"})
	}
	defer rows.Close()

	// Scan the database rows into a slice of users
	users := []models.User{}
	for rows.Next() {
		var user models.User
		var schools *string
		var companies *string
		if err := rows.Scan(&user.ID, &user.GoogleID, &user.Name, &user.Email, &user.Picture, &user.Headline, &user.Location, &schools, &companies); err != nil {
			log.Println("Scanner Error: ", err)
			continue
		}
		user.School = schools
		user.Companies = companies
		users = append(users, user)
	}
	return c.JSON(users)
}

// GET /api/users/:id
func GetUserProfile(c *fiber.Ctx) error {
	/*
		Gets a specific user's profile by ID
		Returns a JSON object with user details
	*/

	id := c.Params("id")

	// Query the database for the specific user
	row := db.Pool.QueryRow(context.Background(), `
		SELECT u.id, u.google_id, u.name, u.email, u.picture, u.headline, u.location, u.is_admin,
			COALESCE(
				NULLIF(u.school, ''), 
				(SELECT STRING_AGG(DISTINCT eh.school_name, ', ' ORDER BY eh.school_name) 
				 FROM education_history eh WHERE eh.user_id = u.id)
			) as schools,
			(SELECT STRING_AGG(DISTINCT wh.company, ', ' ORDER BY wh.company) 
			 FROM work_history wh WHERE wh.user_id = u.id) as companies
		FROM users u
		WHERE u.id = $1`, id)

	var user models.User
	var schools *string
	var companies *string

	err := row.Scan(&user.ID, &user.GoogleID, &user.Name, &user.Email, &user.Picture,
		&user.Headline, &user.Location, &user.IsAdmin, &schools, &companies)
	if err != nil {
		log.Println("DB Error: ", err)
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	user.School = schools
	user.Companies = companies

	return c.JSON(user)
}

// GET /api/users/:id/education
func GetUserEducation(c *fiber.Ctx) error {
	/*
		Gets education history for a specific user
	*/

	id := c.Params("id")

	rows, err := db.Pool.Query(context.Background(),
		`SELECT id, user_id, school_name, school_logo_url, degree, field_of_study, start_date, end_date, location, description, created_at 
		FROM education_history WHERE user_id = $1 ORDER BY start_date DESC`, id)

	if err != nil {
		log.Println("DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database query failed"})
	}
	defer rows.Close()

	educationHistory := []models.EducationHistory{}
	for rows.Next() {
		var education models.EducationHistory
		rows.Scan(&education.ID, &education.UserID, &education.SchoolName, &education.SchoolLogoURL,
			&education.Degree, &education.FieldOfStudy, &education.StartDate, &education.EndDate,
			&education.Location, &education.Description, &education.CreatedAt)
		educationHistory = append(educationHistory, education)
	}

	return c.JSON(educationHistory)
}

// GET /api/users/:id/work
func GetUserWork(c *fiber.Ctx) error {
	/*
		Gets work history for a specific user
	*/

	id := c.Params("id")

	rows, err := db.Pool.Query(context.Background(),
		`SELECT id, user_id, company, company_logo_url, title, start_date, end_date, location, description, created_at 
		FROM work_history WHERE user_id = $1 ORDER BY start_date DESC NULLS LAST`, id)

	if err != nil {
		log.Println("DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database query failed"})
	}
	defer rows.Close()

	workHistory := []models.WorkHistory{}
	for rows.Next() {
		var work models.WorkHistory
		rows.Scan(&work.ID, &work.UserID, &work.Company, &work.CompanyLogoURL,
			&work.Title, &work.StartDate, &work.EndDate,
			&work.Location, &work.Description, &work.CreatedAt)
		workHistory = append(workHistory, work)
	}

	return c.JSON(workHistory)
}

// GET /api/users/:id/events
func GetUserEvents(c *fiber.Ctx) error {
	/*
		Gets events attended by a specific user
	*/

	id := c.Params("id")

	// Get count of events attended
	var eventsCount int
	err := db.Pool.QueryRow(context.Background(),
		`SELECT COUNT(*) FROM event_registrations WHERE user_id = $1`, id).Scan(&eventsCount)

	if err != nil {
		log.Println("DB Error: ", err)
		eventsCount = 0
	}

	// Get list of events attended
	rows, err := db.Pool.Query(context.Background(),
		`SELECT e.id, e.title, e.description, e.date, e.end_date, e.room, e.external_link, e.recording_url
		FROM events e
		JOIN event_registrations er ON e.id = er.event_id
		WHERE er.user_id = $1
		ORDER BY e.date DESC`, id)

	if err != nil {
		log.Println("DB Error: ", err)
		return c.JSON(fiber.Map{"count": eventsCount, "events": []models.Event{}})
	}
	defer rows.Close()

	events := []models.Event{}
	for rows.Next() {
		var event models.Event
		rows.Scan(&event.ID, &event.Title, &event.Description, &event.Date,
			&event.EndDate, &event.Room, &event.ExternalLink, &event.RecordingURL)
		events = append(events, event)
	}

	return c.JSON(fiber.Map{"count": eventsCount, "events": events})
}

// GET /api/users/:id/github
func GetUserGithub(c *fiber.Ctx) error {
	/*
		Gets GitHub integration data for a specific user
	*/

	id := c.Params("id")

	var integration models.GithubIntegration
	var accessToken string
	err := db.Pool.QueryRow(context.Background(),
		`SELECT id, user_id, github_id, username, avatar_url, profile_url, top_repos, access_token, joined_at
		 FROM github_integrations WHERE user_id = $1`,
		id,
	).Scan(
		&integration.ID,
		&integration.UserID,
		&integration.GithubID,
		&integration.Username,
		&integration.AvatarURL,
		&integration.ProfileURL,
		&integration.TopRepos,
		&accessToken,
		&integration.JoinedAt,
	)

	if err != nil {
		return c.JSON(fiber.Map{"connected": false})
	}

	// If we have top repos and access token, fetch detailed repo info
	var detailedRepos []models.GithubRepo
	if len(integration.TopRepos) > 0 && accessToken != "" {
		detailedRepos = fetchDetailedRepoInfo(integration.TopRepos, accessToken)
	}

	return c.JSON(fiber.Map{
		"connected":      true,
		"username":       integration.Username,
		"profile_url":    integration.ProfileURL,
		"top_repos":      integration.TopRepos,
		"detailed_repos": detailedRepos,
	})
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

	// Handle nil pointers - use empty string if nil
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

	_, err := db.Pool.Exec(context.Background(),
		"UPDATE users SET school = $1, headline = $2, location = $3 WHERE id = $4",
		school, headline, location, id)

	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database update failed"})
	}

	return c.JSON(fiber.Map{"message": "User updated successfully"})
}

// Helper function to fetch detailed repository information
func fetchDetailedRepoInfo(repoNames []string, accessToken string) []models.GithubRepo {
	var detailedRepos []models.GithubRepo

	for _, repoName := range repoNames {
		// Fetch repo details from GitHub API
		req, err := http.NewRequest("GET", "https://api.github.com/repos/"+repoName, nil)
		if err != nil {
			continue
		}

		req.Header.Set("Authorization", "Bearer "+accessToken)
		req.Header.Set("Accept", "application/vnd.github.v3+json")

		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			continue
		}

		var repo models.GithubRepo
		if err := json.NewDecoder(resp.Body).Decode(&repo); err != nil {
			continue
		}

		detailedRepos = append(detailedRepos, repo)
	}

	return detailedRepos
}

// DELETE /api/users/:id // TODO: Implement
