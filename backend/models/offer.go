package models

import "time"

type Offer struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	Company     string    `json:"company"`
	Role        string    `json:"role"`
	HourlyRate  float64   `json:"hourly_rate"`
	MonthlyRate float64   `json:"monthly_rate"`
	Location    string    `json:"location"`
	CreatedAt   time.Time `json:"created_at"`
}
