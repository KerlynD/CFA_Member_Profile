package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/oauth2"
    "github.com/ravener/discord-oauth2"
	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
)

var discordOAuthConfig *oauth2.Config

func InitDiscordOAuth() {
	/*
		Loads environment variables from .env file
		Creates a new OAuth2 configuration for Discord authentication
		Sets the RedirectURL, ClientID, ClientSecret, and Endpoint for Discord authentication
	*/
	discordOAuthConfig = &oauth2.Config{
		RedirectURL:  os.Getenv("DISCORD_REDIRECT_URL"),
		ClientID:     os.Getenv("DISCORD_CLIENT_ID"),
		ClientSecret: os.Getenv("DISCORD_CLIENT_SECRET"),
		Scopes:       []string{"identify", "email"},
		Endpoint:     discord.Endpoint,
	}
}

func DiscordLogin(c *fiber.Ctx) error {
	// Redirect user to Discord Login
	url := discordOAuthConfig.AuthCodeURL("state", oauth2.AccessTypeOffline)
	return c.Redirect(url)
}

// GET /api/integrations/discord
func GetDiscordIntegration(c *fiber.Ctx) error {
	/*
		Gets the Discord integration for the current user
		Returns a JSON object of the Discord integration
	*/
	claims, err := utils.VerifyJWT(c.Cookies("session"))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized/No JWT found"})
	}

	var integration models.DiscordIntegration
	err = db.Pool.QueryRow(context.Background(),
		`SELECT id, discord_id, username, discriminator, avatar_url, verified, joined_at
		 FROM discord_integrations WHERE user_id=$1`, claims.UserID).
		Scan(&integration.ID, &integration.DiscordID, &integration.Username,
			&integration.Discriminator, &integration.AvatarURL, &integration.Verified, &integration.JoinedAt)

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Discord not linked"})
	}

	return c.JSON(integration)
}


func DiscordCallback(c *fiber.Ctx) error {
	/*
		Handles the callback from Discord
		Exchanges the authorization code for a token
		Gets the user info from Discord
		Creates/updates user in database
		Generates a JWT and sets it as a cookie
		Redirects to the frontend
	*/
	code := c.Query("code")
	token, err := discordOAuthConfig.Exchange(context.Background(), code)

	if err != nil {
		return c.Status(500).SendString("Failed to exchange authorization code for token: " + err.Error())
	}

	// GET user info from Discord
	request, _ := http.NewRequest("GET", "https://discord.com/api/v10/users/@me", nil)
	request.Header.Set("Authorization", "Bearer "+token.AccessToken)

	response, err := http.DefaultClient.Do(request)

	if err != nil {
		return c.Status(500).SendString("Failed to get user info from Discord: " + err.Error())
	}
	defer response.Body.Close()

	var userData map[string]interface{}
	json.NewDecoder(response.Body).Decode(&userData)
	
	// Extract
	discordID := userData["id"].(string)
	username := userData["username"].(string)
	discriminator := userData["discriminator"].(string)
	avatarHash := userData["avatar"].(string)
	avatarURL := fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%s.png", discordID, avatarHash)

	// Get & Verify JWT
	cookie := c.Cookies("session")
	if cookie == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized/No JWT found",
		})
	}

	claims, err := utils.VerifyJWT(cookie)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Expired/Invalid JWT",
		})
	}
	
	// Save to DB
	_, err = db.Pool.Exec(context.Background(),
		`INSERT INTO discord_integrations (user_id, discord_id, username, discriminator, avatar_url, verified)
		 VALUES ($1, $2, $3, $4, $5, TRUE)
		 ON CONFLICT (discord_id) 
		 DO UPDATE SET username=$3, discriminator=$4, avatar_url=$5, verified=TRUE`,
		claims.UserID, discordID, username, discriminator, avatarURL)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save to database: " + err.Error()})
	}

	return c.Redirect("http://localhost:3000/profile?discord=linked")
}