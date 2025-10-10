package handlers

import (
	"context"
	"time"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
)

// GET /api/events
func GetEvents(c *fiber.Ctx) error {
	/*
		Gets all events from the database
		Returns a JSON array of all events
	*/
	rows, err := db.Pool.Query(context.Background(), 
		"SELECT id, title, description, date, attendees, recording_url FROM events ORDER BY date DESC")
	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database query failed"})
	}
	defer rows.Close()

	events := []models.Event{}
	for rows.Next() {
		var event models.Event
		if err := rows.Scan(&event.ID, &event.Title, &event.Description, &event.Date, &event.Attendees, &event.RecordingURL); err != nil {
			log.Println("Scanner Error: ", err)
			continue
		}
		events = append(events, event)
	}
	return c.JSON(events)
}

// POST /api/events ADMIN ONLY
func AddEvent(c *fiber.Ctx) error {
	/*
		Adds a new event to the database
		Requires the event's title, description, date, attendees, and recording_url to be in the request body
	*/
	var body models.Event
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body/JSON"})
	}
	
	if body.Title == "" || body.Description == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Title and description are required"})
	}
	
	body.Date = time.Now()

	_, err := db.Pool.Exec(context.Background(), 
		`INSERT INTO events (title, description, date, attendees, recording_url) 
		VALUES ($1, $2, $3, $4, $5)`,
		body.Title, body.Description, body.Date, body.Attendees, body.RecordingURL)
	if err != nil {
		log.Println("Internal DB Error: ", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database insert failed"})
	}
	return c.JSON(fiber.Map{"message": "Event added successfully"})
}

// DELETE /api/events/:id // TODO: Implement ADMIN ONLY