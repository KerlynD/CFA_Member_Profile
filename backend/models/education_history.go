package models

import "time"

type EducationHistory struct {
	ID            int       `json:"id"`
	UserID        int       `json:"user_id"`
	SchoolName    string    `json:"school_name"`
	SchoolLogoURL string    `json:"school_logo_url"`
	Degree        string    `json:"degree"`
	FieldOfStudy  string    `json:"field_of_study"`
	StartDate     string    `json:"start_date"`
	EndDate       string    `json:"end_date"`
	Location      string    `json:"location"`
	Description   string    `json:"description"`
	CreatedAt     time.Time `json:"created_at"`
}
