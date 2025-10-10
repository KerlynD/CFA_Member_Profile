package models

import "time"

type WorkHistory struct {
	ID              int       `json:"id"`
	UserID          int       `json:"user_id"`
	Company         string    `json:"company"`
	CompanyLogoURL  string    `json:"company_logo_url"`
	Title           string    `json:"title"`
	StartDate       string    `json:"start_date"`
	EndDate         string    `json:"end_date"`
	Location        string    `json:"location"`
	Description     string    `json:"description"`
	CreatedAt       time.Time `json:"created_at"`
}

