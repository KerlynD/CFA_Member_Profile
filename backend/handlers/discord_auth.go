package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/ravener/discord-oauth2"
	"golang.org/x/oauth2"
)

var discordOAuthConfig *oauth2.Config
var discordBotToken string
var discordGuildID string

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

	discordBotToken = os.Getenv("DISCORD_BOT_TOKEN")
	discordGuildID = os.Getenv("DISCORD_GUILD_ID")
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
	token := utils.GetTokenFromRequest(c)
	claims, err := utils.VerifyJWT(token)
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

// Helper function to verify if a Discord user is in the guild
func verifyDiscordMembership(discordID string) bool {
	/*
		Checks if a Discord user is a member of the guild using the bot token
		Returns true if the user is in the server, false otherwise
	*/
	if discordBotToken == "" || discordGuildID == "" {
		fmt.Println("Warning: DISCORD_BOT_TOKEN or DISCORD_GUILD_ID not set")
		return false
	}

	// Discord API endpoint to get guild member
	url := fmt.Sprintf("https://discord.com/api/v10/guilds/%s/members/%s", discordGuildID, discordID)

	request, err := http.NewRequest("GET", url, nil)
	if err != nil {
		fmt.Println("Error creating request:", err)
		return false
	}

	// Use bot token for authentication
	request.Header.Set("Authorization", fmt.Sprintf("Bot %s", discordBotToken))

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		fmt.Println("Error checking guild membership:", err)
		return false
	}
	defer response.Body.Close()

	// 200 = user is in the server, 404 = user is not in the server
	return response.StatusCode == 200
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
	oauthToken, err := discordOAuthConfig.Exchange(context.Background(), code)

	if err != nil {
		return c.Status(500).SendString("Failed to exchange authorization code for token: " + err.Error())
	}

	// GET user info from Discord
	request, _ := http.NewRequest("GET", "https://discord.com/api/v10/users/@me", nil)
	request.Header.Set("Authorization", "Bearer "+oauthToken.AccessToken)

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
	jwtToken := utils.GetTokenFromRequest(c)
	if jwtToken == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized/No JWT found",
		})
	}

	claims, err := utils.VerifyJWT(jwtToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Expired/Invalid JWT",
		})
	}

	// Check if user is in the guild (verify membership)
	isVerified := verifyDiscordMembership(discordID)

	// Save to DB with verification status
	_, err = db.Pool.Exec(context.Background(),
		`INSERT INTO discord_integrations (user_id, discord_id, username, discriminator, avatar_url, verified)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (discord_id) 
		 DO UPDATE SET username=$3, discriminator=$4, avatar_url=$5, verified=$6`,
		claims.UserID, discordID, username, discriminator, avatarURL, isVerified)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save to database: " + err.Error()})
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	return c.Redirect(frontendURL + "/dashboard/profile")
}

// POST /api/integrations/discord/verify
func VerifyDiscordMembership(c *fiber.Ctx) error {
	/*
		Manually triggers verification check for the current user's Discord integration
		Updates the verified status in the database
	*/
	token := utils.GetTokenFromRequest(c)
	claims, err := utils.VerifyJWT(token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized/No JWT found"})
	}

	// Get the user's Discord integration
	var discordID string
	err = db.Pool.QueryRow(context.Background(),
		`SELECT discord_id FROM discord_integrations WHERE user_id=$1`, claims.UserID).Scan(&discordID)

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Discord not linked"})
	}

	// Verify membership
	isVerified := verifyDiscordMembership(discordID)

	// Update verified status in DB
	_, err = db.Pool.Exec(context.Background(),
		`UPDATE discord_integrations SET verified=$1 WHERE user_id=$2`,
		isVerified, claims.UserID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update verification status"})
	}

	return c.JSON(fiber.Map{
		"verified": isVerified,
		"message": func() string {
			if isVerified {
				return "Verified! You are a member of the server."
			}
			return "Not verified. Please join the Discord server and try again."
		}(),
	})
}
