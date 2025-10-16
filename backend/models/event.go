package models

import "time"

type Event struct {
	ID           int       `json:"id"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Date         time.Time `json:"date"`
	EndDate      time.Time `json:"end_date"`
	Room         string    `json:"room"`
	ExternalLink string    `json:"external_link"`
	Attendees    int       `json:"attendees"`
	RecordingURL string    `json:"recording_url"`
	IsRegistered bool      `json:"is_registered"` // Will be set per user
}

type EventRegistration struct {
	ID      int `json:"id"`
	EventID int `json:"event_id"`
	UserID  int `json:"user_id"`
}
