package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
	"github.com/gofiber/fiber/v2"
)

var (
	githubClientID     string
	githubClientSecret string
	githubRedirectURL  string
)

func InitGithubOAuth() {
	/*
		Loads environment variables from .env file
		Initializes GitHub OAuth configuration
	*/
	githubClientID = os.Getenv("GITHUB_CLIENT_ID")
	githubClientSecret = os.Getenv("GITHUB_CLIENT_SECRET")
	githubRedirectURL = os.Getenv("GITHUB_REDIRECT_URL")
}

// GET /api/auth/github/login
func GithubLogin(c *fiber.Ctx) error {
	// Verify user is authenticated
	claims, err := utils.VerifyJWT(c.Cookies("session"))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// Store user ID in session for callback
	state := fmt.Sprintf("%d", claims.UserID)

	redirectURL := fmt.Sprintf(
		"https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=read:user user:email repo&state=%s",
		githubClientID,
		githubRedirectURL,
		state,
	)

	return c.Redirect(redirectURL)
}

// GET /api/auth/github/callback
func GithubCallback(c *fiber.Ctx) error {
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		return c.Redirect("http://localhost:3000/dashboard/profile?error=github_auth_failed")
	}

	// Exchange code for access token
	tokenURL := "https://github.com/login/oauth/access_token"
	reqBody := fmt.Sprintf(
		"client_id=%s&client_secret=%s&code=%s&redirect_uri=%s",
		githubClientID,
		githubClientSecret,
		code,
		githubRedirectURL,
	)

	req, err := http.NewRequest("POST", tokenURL, nil)
	if err != nil {
		return c.Redirect("http://localhost:3000/dashboard/profile?error=github_auth_failed")
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.URL.RawQuery = reqBody

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return c.Redirect("http://localhost:3000/dashboard/profile?error=github_auth_failed")
	}
	defer resp.Body.Close()

	var tokenResponse struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
		Scope       string `json:"scope"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&tokenResponse); err != nil {
		return c.Redirect("http://localhost:3000/dashboard/profile?error=github_auth_failed")
	}

	if tokenResponse.AccessToken == "" {
		return c.Redirect("http://localhost:3000/dashboard/profile?error=github_auth_failed")
	}

	// Fetch GitHub user info
	userReq, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return c.Redirect("http://localhost:3000/dashboard/profile?error=github_auth_failed")
	}
	userReq.Header.Set("Authorization", "Bearer "+tokenResponse.AccessToken)
	userReq.Header.Set("Accept", "application/json")

	userResp, err := client.Do(userReq)
	if err != nil {
		return c.Redirect("http://localhost:3000/dashboard/profile?error=github_auth_failed")
	}
	defer userResp.Body.Close()

	var githubUser struct {
		ID        int    `json:"id"`
		Login     string `json:"login"`
		AvatarURL string `json:"avatar_url"`
		HTMLURL   string `json:"html_url"`
	}

	if err := json.NewDecoder(userResp.Body).Decode(&githubUser); err != nil {
		return c.Redirect("http://localhost:3000/dashboard/profile?error=github_auth_failed")
	}

	// Save to database
	userID := state // from state parameter
	_, err = db.Pool.Exec(context.Background(),
		`INSERT INTO github_integrations (user_id, github_id, username, avatar_url, profile_url, access_token, top_repos, joined_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 ON CONFLICT (user_id) DO UPDATE SET
		   github_id = EXCLUDED.github_id,
		   username = EXCLUDED.username,
		   avatar_url = EXCLUDED.avatar_url,
		   profile_url = EXCLUDED.profile_url,
		   access_token = EXCLUDED.access_token,
		   joined_at = EXCLUDED.joined_at`,
		userID,
		fmt.Sprintf("%d", githubUser.ID),
		githubUser.Login,
		githubUser.AvatarURL,
		githubUser.HTMLURL,
		tokenResponse.AccessToken,
		[]string{}, // Empty array initially
		time.Now(),
	)

	if err != nil {
		fmt.Printf("Error saving GitHub integration: %v\n", err)
		return c.Redirect("http://localhost:3000/dashboard/profile?error=github_save_failed")
	}

	// Redirect to profile with success
	return c.Redirect("http://localhost:3000/dashboard/profile?github_connected=true&tab=integrations")
}

// GET /api/integrations/github
func GetGithubIntegration(c *fiber.Ctx) error {
	claims, err := utils.VerifyJWT(c.Cookies("session"))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var integration models.GithubIntegration
	err = db.Pool.QueryRow(context.Background(),
		`SELECT id, user_id, github_id, username, avatar_url, profile_url, top_repos, joined_at
		 FROM github_integrations WHERE user_id = $1`,
		claims.UserID,
	).Scan(
		&integration.ID,
		&integration.UserID,
		&integration.GithubID,
		&integration.Username,
		&integration.AvatarURL,
		&integration.ProfileURL,
		&integration.TopRepos,
		&integration.JoinedAt,
	)

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "GitHub not connected"})
	}

	return c.JSON(integration)
}

// GET /api/integrations/github/repos
func GetGithubRepos(c *fiber.Ctx) error {
	claims, err := utils.VerifyJWT(c.Cookies("session"))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// Get access token from database
	var accessToken string
	err = db.Pool.QueryRow(context.Background(),
		`SELECT access_token FROM github_integrations WHERE user_id = $1`,
		claims.UserID,
	).Scan(&accessToken)

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "GitHub not connected"})
	}

	// Fetch repositories from GitHub API
	req, err := http.NewRequest("GET", "https://api.github.com/user/repos?sort=updated&per_page=100", nil)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch repos"})
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch repos"})
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "GitHub API error"})
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read response"})
	}

	var repos []models.GithubRepo
	if err := json.Unmarshal(body, &repos); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse repos"})
	}

	return c.JSON(repos)
}

// POST /api/integrations/github/repos
// Body: { "repos": ["owner/repo1", "owner/repo2", "owner/repo3"] }
func SaveTopRepos(c *fiber.Ctx) error {
	claims, err := utils.VerifyJWT(c.Cookies("session"))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var body struct {
		Repos []string `json:"repos"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Validate: max 3 repos
	if len(body.Repos) > 3 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Maximum 3 repositories allowed"})
	}

	// Update database
	_, err = db.Pool.Exec(context.Background(),
		`UPDATE github_integrations SET top_repos = $1 WHERE user_id = $2`,
		body.Repos,
		claims.UserID,
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save repos"})
	}

	return c.JSON(fiber.Map{"success": true, "repos": body.Repos})
}
