package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/models"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
	"github.com/gofiber/fiber/v2"
)

// structs moved to models/leetcode.go

// GET /api/leetcode/lookup
func GetLeetCodeStats(c *fiber.Ctx) error {
	// Verify current user
	token := utils.GetTokenFromRequest(c)
	claims, err := utils.VerifyJWT(token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(models.LeaderboardCard{
			Available: false,
			Message:   "Please log in",
		})
	}

	// Resolve the user's Discord username from our integrations table
	var discordUsername string
	err = db.Pool.QueryRow(context.Background(),
		`SELECT username FROM discord_integrations WHERE user_id=$1`, claims.UserID).Scan(&discordUsername)
	if err != nil || discordUsername == "" {
		return c.JSON(models.LeaderboardCard{
			Available: false,
			Message:   "Discord not linked. Connect your Discord in the Profile > Integrations tab.",
		})
	}

	// Try to call external leaderboard API using discord username
	serverURL := os.Getenv("LEADERBOARD_SERVER_URL")
	if serverURL == "" {
		serverURL = "https://server.rakibshahid.com"
	}

	card := models.LeaderboardCard{Available: false, Message: "Lookup currently down"}

	// Call discord_lookup endpoint exactly like the public site does
	fullURL := fmt.Sprintf("%s/api/discord_lookup", strings.TrimRight(serverURL, "/"))
	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		fmt.Printf("Error creating request: %v\n", err)
		return c.JSON(card)
	}

	req.Header.Set("discord-username", discordUsername)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return c.JSON(card)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.JSON(card)
	}

	switch resp.StatusCode {
	case 200:
		var apiResp models.LeaderboardAPIResponse
		if err := json.Unmarshal(bodyBytes, &apiResp); err != nil {
			fmt.Printf("Error decoding response: %v\n", err)
			return c.JSON(card)
		}

		// Convert local_ranking (can be string or int)
		localRanking := 0
		switch v := apiResp.LocalRanking.(type) {
		case string:
			fmt.Sscanf(v, "%d", &localRanking)
		case float64:
			localRanking = int(v)
		case int:
			localRanking = v
		}

		// Successfully got data
		card.Available = true
		card.Message = ""
		card.DiscordUsername = apiResp.DiscordUsername
		card.LeetCodeUsername = apiResp.LeetCodeUsername
		card.Points = apiResp.Points
		card.Wins = apiResp.Wins
		card.LocalRanking = localRanking
		card.Avatar = apiResp.Avatar
		card.Problems = apiResp.Problems
	case 404:
		card.Message = fmt.Sprintf("Discord user '%s' not found in leaderboard", discordUsername)
	default:
		card.Message = fmt.Sprintf("Lookup failed (status %d)", resp.StatusCode)
	}

	return c.JSON(card)
}
