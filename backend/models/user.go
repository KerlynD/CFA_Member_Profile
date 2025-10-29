package models

import "time"

type User struct {
	// User aspects defined by database table
	ID               int        `json:"id"`
	GoogleID         string     `json:"google_id"` // for google OAuth
	Name             string     `json:"name"`
	Email            string     `json:"email"`
	Picture          string     `json:"picture"`
	IsAdmin          bool       `json:"is_admin"` // for admin access
	School           *string    `json:"school"`
	Headline         *string    `json:"headline"`
	Location         *string    `json:"location"`
	Companies        *string    `json:"companies"` // comma-separated companies from work history
	ResumeURL        *string    `json:"resume_url"`
	ResumeUploadedAt *time.Time `json:"resume_uploaded_at"`
}
