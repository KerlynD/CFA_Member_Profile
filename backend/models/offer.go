package models

import "time"

type Offer struct {
	ID             int       `json:"id"`
	UserID         int       `json:"user_id"`
	Company        string    `json:"company"`
	CompanyLogoURL string    `json:"company_logo_url"`
	Role           string    `json:"role"`
	OfferType      string    `json:"offer_type"` // "internship" or "full-time"
	HourlyRate     float64   `json:"hourly_rate"`
	MonthlyRate    float64   `json:"monthly_rate"`
	Location       string    `json:"location"`
	CreatedAt      time.Time `json:"created_at"`
}
