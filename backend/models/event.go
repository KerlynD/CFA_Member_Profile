package models

import "time"

type Event struct {
	ID           int       `json:"id"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Date         time.Time `json:"date"`
	Attendees    int       `json:"attendees"`
	RecordingURL string    `json:"recording_url"`
}
