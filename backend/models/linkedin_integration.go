package models

import "time"

type LinkedInIntegration struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	LinkedInID  string    `json:"linkedin_id"`
	ProfileURL  string    `json:"profile_url"`
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	Headline    string    `json:"headline"`
	AvatarURL   string    `json:"avatar_url"`
	ConnectedAt time.Time `json:"connected_at"`
}
