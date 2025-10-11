package models

import "time"

type DiscordIntegration struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	DiscordID    string    `json:"discord_id"`
	Username     string    `json:"username"`
	Discriminator string   `json:"discriminator"`
	AvatarURL    string    `json:"avatar_url"`
	Verified     bool      `json:"verified"`
	JoinedAt     time.Time `json:"joined_at"`
}
