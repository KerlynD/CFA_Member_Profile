package handlers

import (
	"context"
	"log"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
	"github.com/gofiber/fiber/v2"
)

// GET /api/events
func GetEvents(c *fiber.Ctx) error {
	/*
		Gets all events from the database
		Returns a JSON array of all events with registration status for the current user
	*/

	// Try to get the current user (optional, as this endpoint might be public)
	var currentUserID int
	token := c.Cookies("session")
	if token != "" {
		claims, err := utils.VerifyJWT(token)
		if err == nil {
			currentUserID = claims.UserID
		}
	}

	rows, err := db.Pool.Query(context.Background(),
		"SELECT id, title, description, date, end_date, room, external_link, recording_url FROM events ORDER BY date DESC")
	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database query failed"})
	}
	defer rows.Close()

	events := []models.Event{}
	for rows.Next() {
		var event models.Event
		if err := rows.Scan(&event.ID, &event.Title, &event.Description, &event.Date, &event.EndDate, &event.Room, &event.ExternalLink, &event.RecordingURL); err != nil {
			log.Println("Scanner Error: ", err)
			continue
		}

		// Count attendees for this event
		var attendees int
		err := db.Pool.QueryRow(context.Background(),
			"SELECT COUNT(*) FROM event_registrations WHERE event_id = $1", event.ID).Scan(&attendees)
		if err != nil {
			attendees = 0
		}
		event.Attendees = attendees

		// Check if current user is registered
		if currentUserID > 0 {
			var count int
			err := db.Pool.QueryRow(context.Background(),
				"SELECT COUNT(*) FROM event_registrations WHERE event_id = $1 AND user_id = $2",
				event.ID, currentUserID).Scan(&count)
			if err == nil && count > 0 {
				event.IsRegistered = true
			}
		}

		events = append(events, event)
	}
	return c.JSON(events)
}

// POST /api/events ADMIN ONLY
func AddEvent(c *fiber.Ctx) error {
	/*
		Adds a new event to the database
		Requires the event's title, description, date, end_date, room, external_link, and recording_url to be in the request body
	*/
	var body models.Event
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body/JSON"})
	}

	if body.Title == "" || body.Description == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Title and description are required"})
	}

	_, err := db.Pool.Exec(context.Background(),
		`INSERT INTO events (title, description, date, end_date, room, external_link, recording_url) 
		VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		body.Title, body.Description, body.Date, body.EndDate, body.Room, body.ExternalLink, body.RecordingURL)
	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database insert failed"})
	}
	return c.JSON(fiber.Map{"message": "Event added successfully"})
}

// POST /api/events/:id/register
func RegisterForEvent(c *fiber.Ctx) error {
	/*
		Registers the current user for an event
	*/
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

	eventID := c.Params("id")

	// Check if already registered
	var count int
	err = db.Pool.QueryRow(context.Background(),
		"SELECT COUNT(*) FROM event_registrations WHERE event_id = $1 AND user_id = $2",
		eventID, claims.UserID).Scan(&count)

	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database query failed"})
	}

	if count > 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Already registered for this event"})
	}

	// Register the user
	_, err = db.Pool.Exec(context.Background(),
		"INSERT INTO event_registrations (event_id, user_id) VALUES ($1, $2)",
		eventID, claims.UserID)

	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Registration failed"})
	}

	return c.JSON(fiber.Map{"message": "Successfully registered for event"})
}

// DELETE /api/events/:id/register
func UnregisterFromEvent(c *fiber.Ctx) error {
	/*
		Unregisters the current user from an event
	*/
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

	eventID := c.Params("id")

	result, err := db.Pool.Exec(context.Background(),
		"DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2",
		eventID, claims.UserID)

	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Unregistration failed"})
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Not registered for this event"})
	}

	return c.JSON(fiber.Map{"message": "Successfully unregistered from event"})
}

// PUT /api/events/:id (ADMIN ONLY)
func UpdateEvent(c *fiber.Ctx) error {
	/*
		Updates an event in the database
		Admin only
	*/
	eventID := c.Params("id")

	var body models.Event
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body/JSON"})
	}

	if body.Title == "" || body.Description == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Title and description are required"})
	}

	result, err := db.Pool.Exec(context.Background(),
		`UPDATE events SET title=$1, description=$2, date=$3, end_date=$4, room=$5, external_link=$6, recording_url=$7 
		WHERE id=$8`,
		body.Title, body.Description, body.Date, body.EndDate, body.Room, body.ExternalLink, body.RecordingURL, eventID)

	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database update failed"})
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Event not found"})
	}

	return c.JSON(fiber.Map{"message": "Event updated successfully"})
}

// DELETE /api/events/:id (ADMIN ONLY)
func DeleteEvent(c *fiber.Ctx) error {
	/*
		Deletes an event from the database
		Admin only
	*/
	eventID := c.Params("id")

	result, err := db.Pool.Exec(context.Background(),
		"DELETE FROM events WHERE id = $1", eventID)

	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database delete failed"})
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Event not found"})
	}

	return c.JSON(fiber.Map{"message": "Event deleted successfully"})
}

// GET /api/events/:id/attendees
func GetEventAttendees(c *fiber.Ctx) error {
	/*
		Gets attendees for a specific event with their profile photos
		Returns a JSON array of attendee objects with id, name, and picture
	*/
	eventID := c.Params("id")

	rows, err := db.Pool.Query(context.Background(), `
		SELECT u.id, u.name, u.picture 
		FROM users u
		JOIN event_registrations er ON u.id = er.user_id
		WHERE er.event_id = $1
		ORDER BY u.name`, eventID)

	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database query failed"})
	}
	defer rows.Close()

	type Attendee struct {
		ID      int    `json:"id"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}

	attendees := []Attendee{}
	for rows.Next() {
		var attendee Attendee
		if err := rows.Scan(&attendee.ID, &attendee.Name, &attendee.Picture); err != nil {
			log.Println("Scanner Error: ", err)
			continue
		}
		attendees = append(attendees, attendee)
	}

	return c.JSON(attendees)
}
