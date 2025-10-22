package models

import "time"

type GithubIntegration struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	GithubID    string    `json:"github_id"`
	Username    string    `json:"username"`
	AvatarURL   string    `json:"avatar_url"`
	ProfileURL  string    `json:"profile_url"`
	AccessToken string    `json:"-"`         // Never send to frontend
	TopRepos    []string  `json:"top_repos"` // Array of up to 3 repo names (format: "owner/repo")
	JoinedAt    time.Time `json:"joined_at"`
}

type GithubRepo struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	FullName    string `json:"full_name"` // owner/repo format
	Description string `json:"description"`
	Language    string `json:"language"`
	Stars       int    `json:"stargazers_count"`
	Forks       int    `json:"forks_count"`
	HTMLURL     string `json:"html_url"`
	Private     bool   `json:"private"`
}
