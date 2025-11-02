// Package handlers provides authentication and authorization functions for the application
package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var googleOAuthConfig *oauth2.Config

func InitOAuth() {
	/*
		Loads environment variables from .env file
		Creates a new OAuth2 configuration for Google authentication
		Sets the RedirectURL, ClientID, ClientSecret, and Endpoint for Google authentication
	*/
	godotenv.Load()
	googleOAuthConfig = &oauth2.Config{
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
	}
}

func GoogleLogin(c *fiber.Ctx) error {
	// Redirect user to Google Login
	url := googleOAuthConfig.AuthCodeURL("randomstate", oauth2.AccessTypeOffline)
	return c.Redirect(url)
}

func GoogleCallback(c *fiber.Ctx) error {
	// Handle the callback from Google

	// Get the authorization code from the query parameters & exchange it for a token
	code := c.Query("code")
	token, err := googleOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		return c.Status(500).SendString("Failed to exchange authorization code for token")
	}

	// Get the user info from the Google API
	response, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		return c.Status(500).SendString("Failed to get user info")
	}
	defer response.Body.Close()

	// Decode the user info from the Google API and store it in a map
	var userData map[string]interface{}
	json.NewDecoder(response.Body).Decode(&userData)

	// Check if the user already exists in the database or find the user
	email := userData["email"].(string)
	googleID := userData["id"].(string)
	name := userData["name"].(string)
	picture := userData["picture"].(string)

	var userID int
	var isAdmin bool

	// Get existing user or insert if not exists
	err = db.Pool.QueryRow(context.Background(),
		`INSERT INTO users (google_id, name, email, picture, school, headline, location)
		 VALUES ($1, $2, $3, $4, '', '', '')
		 ON CONFLICT (email) DO UPDATE SET google_id=$1
		 RETURNING id, is_admin`,
		googleID, name, email, picture,
	).Scan(&userID, &isAdmin)

	if err != nil {
		log.Println("Database error during user creation/update:", err)
		return c.Status(500).SendString("Database error: " + err.Error())
	}

	log.Printf("User logged in: ID=%d, Email=%s, Name=%s, IsAdmin=%v", userID, email, name, isAdmin)

	// Generate JWT
	jwtToken, err := utils.GenerateJWT(userID, email, isAdmin)
	if err != nil {
		return c.Status(500).SendString("Failed to create JWT")
	}

	// Redirect to the frontend with JWT token as URL parameter
	// The frontend will extract the token and store it as a cookie on its domain
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	// Log for debugging
	log.Printf("✅ JWT generated for user %s (ID: %d). Redirecting to %s", email, userID, frontendURL+"/auth/callback")

	// Redirect to frontend callback page with token as query parameter
	return c.Redirect(frontendURL + "/auth/callback?token=" + jwtToken)
}

func Logout(c *fiber.Ctx) error {
	/*
		Logs out the user
		Removes the JWT from the cookie
	*/
	c.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "None",
	})
	return c.JSON(fiber.Map{"message": "Logged out successfully"})
}
