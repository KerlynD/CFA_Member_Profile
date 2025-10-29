package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
	"github.com/gofiber/fiber/v2"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/linkedin"
)

var linkedinOAuthConfig *oauth2.Config

func InitLinkedinOAuth() {
	/*
		Loads environment variables from .env file
		Creates a new OAuth2 configuration for LinkedIn integration
		Sets the RedirectURL, ClientID, ClientSecret, and Endpoint for LinkedIn integration
	*/
	linkedinOAuthConfig = &oauth2.Config{
		RedirectURL:  os.Getenv("LINKEDIN_REDIRECT_URL"),
		ClientID:     os.Getenv("LINKEDIN_CLIENT_ID"),
		ClientSecret: os.Getenv("LINKEDIN_CLIENT_SECRET"),
		Scopes:       []string{"openid", "profile"},
		Endpoint:     linkedin.Endpoint,
	}
}

func getCompanyLogoURL(companyName string) string {
	/*
		Returns a logo.dev logo URL for a given company name
		Uses a lookup map for well-known companies
	*/

	logoDevToken := os.Getenv("LOGO_KEY")
	if logoDevToken == "" {
		log.Println("Warning: LOGO_KEY not set in environment variables")
		logoDevToken = "YOUR_LOGO_KEY"
	}

	// Simple domain inference for well-known companies
	lookup := map[string]string{
		"Google":          "google.com",
		"Datadog":         "datadoghq.com",
		"Capital One":     "capitalone.com",
		"Amazon":          "amazon.com",
		"Microsoft":       "microsoft.com",
		"Meta":            "meta.com",
		"LinkedIn":        "linkedin.com",
		"Apple":           "apple.com",
		"Netflix":         "netflix.com",
		"Tesla":           "tesla.com",
		"Facebook":        "facebook.com",
		"Twitter":         "twitter.com",
		"Uber":            "uber.com",
		"Airbnb":          "airbnb.com",
		"Spotify":         "spotify.com",
		"Salesforce":      "salesforce.com",
		"Adobe":           "adobe.com",
		"Oracle":          "oracle.com",
		"IBM":             "ibm.com",
		"Intel":           "intel.com",
		"Cisco":           "cisco.com",
		"Dell":            "dell.com",
		"HP":              "hp.com",
		"Slack":           "slack.com",
		"Zoom":            "zoom.us",
		"Dropbox":         "dropbox.com",
		"GitHub":          "github.com",
		"Reddit":          "reddit.com",
		"Pinterest":       "pinterest.com",
		"Snapchat":        "snap.com",
		"TikTok":          "tiktok.com",
		"Stripe":          "stripe.com",
		"Square":          "squareup.com",
		"PayPal":          "paypal.com",
		"Venmo":           "venmo.com",
		"Goldman Sachs":   "goldmansachs.com",
		"Morgan Stanley":  "morganstanley.com",
		"JPMorgan":        "jpmorgan.com",
		"Bank of America": "bankofamerica.com",
		"Wells Fargo":     "wellsfargo.com",
		"Deloitte":        "deloitte.com",
		"PwC":             "pwc.com",
		"EY":              "ey.com",
		"KPMG":            "kpmg.com",
		"Accenture":       "accenture.com",
		"McKinsey":        "mckinsey.com",
	}

	if domain, ok := lookup[companyName]; ok {
		return fmt.Sprintf("https://img.logo.dev/%s?token=%s", domain, logoDevToken)
	}

	// Fallback: try lowercase name with .com
	cleanName := strings.ReplaceAll(strings.ToLower(companyName), " ", "")
	return fmt.Sprintf("https://img.logo.dev/%s.com?token=%s", cleanName, logoDevToken)
}

func getSchoolLogoURL(schoolName string) string {
	/*
		Returns a logo.dev logo URL for a given school name
		Uses a lookup map for well-known schools
		Fallback: tries lowercase name with .edu
	*/

	logoDevToken := os.Getenv("LOGO_KEY")
	if logoDevToken == "" {
		log.Println("Warning: LOGO_KEY not set in environment variables")
		logoDevToken = "YOUR_LOGO_KEY"
	}

	// Simple domain inference for well-known schools
	lookup := map[string]string{
		"Queens College":                        "qc.cuny.edu",
		"Columbia University":                   "columbia.edu",
		"Harvard University":                    "harvard.edu",
		"MIT":                                   "mit.edu",
		"Massachusetts Institute of Technology": "mit.edu",
		"Stanford University":                   "stanford.edu",
		"Yale University":                       "yale.edu",
		"Princeton University":                  "princeton.edu",
		"University of Pennsylvania":            "upenn.edu",
		"Cornell University":                    "cornell.edu",
		"Brown University":                      "brown.edu",
		"Dartmouth College":                     "dartmouth.edu",
		"Duke University":                       "duke.edu",
		"Northwestern University":               "northwestern.edu",
		"University of Chicago":                 "uchicago.edu",
		"Caltech":                               "caltech.edu",
		"California Institute of Technology":    "caltech.edu",
		"UC Berkeley":                           "berkeley.edu",
		"University of California, Berkeley":    "berkeley.edu",
		"UCLA":                                  "ucla.edu",
		"University of California, Los Angeles": "ucla.edu",
		"NYU":                                   "nyu.edu",
		"New York University":                   "nyu.edu",
		"University of Michigan":                "umich.edu",
		"Georgia Tech":                          "gatech.edu",
		"Carnegie Mellon University":            "cmu.edu",
		"University of Texas at Austin":         "utexas.edu",
		"University of Virginia":                "virginia.edu",
		"Boston University":                     "bu.edu",
		"Georgetown University":                 "georgetown.edu",
		"Emory University":                      "emory.edu",
		"Vanderbilt University":                 "vanderbilt.edu",
		"Rice University":                       "rice.edu",
		"University of Southern California":     "usc.edu",
		"USC":                                   "usc.edu",
	}

	if domain, ok := lookup[schoolName]; ok {
		return fmt.Sprintf("https://img.logo.dev/%s?token=%s", domain, logoDevToken)
	}

	// Fallback: try lowercase name with .edu
	cleanName := strings.ReplaceAll(strings.ToLower(schoolName), " ", "")
	return fmt.Sprintf("https://img.logo.dev/%s.edu?token=%s", cleanName, logoDevToken)
}

func safeString(data map[string]interface{}, keys ...string) string {
	/*
		Safely extracts nested string values from a map
		Returns empty string if key doesn't exist or value is not a string
	*/

	current := data
	for i, key := range keys {
		if i == len(keys)-1 {
			// Last key - extract string value
			if val, ok := current[key].(string); ok {
				return val
			}
			// Try numeric conversion for year fields
			if val, ok := current[key].(float64); ok {
				return fmt.Sprintf("%.0f", val)
			}
			return ""
		}
		// Navigate deeper into nested map
		if next, ok := current[key].(map[string]interface{}); ok {
			current = next
		} else {
			return ""
		}
	}
	return ""
}

func LinkedInIntegrationLogin(c *fiber.Ctx) error {
	// Redirect user to LinkedIn for integration (not login)
	url := linkedinOAuthConfig.AuthCodeURL("randomstate", oauth2.AccessTypeOffline)
	return c.Redirect(url)
}

func LinkedInIntegrationCallback(c *fiber.Ctx) error {
	/*
		Handles the callback from LinkedIn integration
		Exchanges the authorization code for a token
		Gets the user info from LinkedIn
		Stores LinkedIn integration data for the current authenticated user
		Redirects to the frontend profile page with success message
	*/

	// Check for error parameter first
	if errorParam := c.Query("error"); errorParam != "" {
		errorDesc := c.Query("error_description")
		return c.Status(400).SendString(fmt.Sprintf("LinkedIn OAuth error: %s", errorDesc))
	}

	code := c.Query("code")
	if code == "" {
		return c.Status(400).SendString("No authorization code received from LinkedIn")
	}

	// Get & Verify JWT first (user must be logged in to integrate)
	token := c.Cookies("session")
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).SendString("Must be logged in to connect LinkedIn")
	}

	claims, err := utils.VerifyJWT(token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).SendString("Invalid session")
	}

	userID := claims.UserID

	oauthToken, err := linkedinOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		log.Println("Failed to exchange authorization code for token: ", err)
		return c.Status(500).SendString("Failed to exchange authorization code for token")
	}

	// Get the user profile from LinkedIn using OpenID Connect
	request, _ := http.NewRequest("GET", "https://api.linkedin.com/v2/userinfo", nil)
	request.Header.Set("Authorization", "Bearer "+oauthToken.AccessToken)
	response, err := http.DefaultClient.Do(request)

	if err != nil {
		log.Println("Failed to get user info from LinkedIn: ", err)
		return c.Status(500).SendString("Failed to get user info from LinkedIn")
	}
	defer response.Body.Close()

	var profile map[string]interface{}
	json.NewDecoder(response.Body).Decode(&profile)

	// Extract user data from OpenID Connect response
	linkedinID, _ := profile["sub"].(string)
	firstName, _ := profile["given_name"].(string)
	lastName, _ := profile["family_name"].(string)

	// Get profile picture
	var avatarURL string
	if picture, ok := profile["picture"].(string); ok {
		avatarURL = picture
	}

	// Get headline - not available in OpenID Connect, will be empty
	var headline string
	if name, ok := profile["name"].(string); ok {
		headline = name // Use full name as fallback
	}

	// Create LinkedIn profile URL - OpenID Connect doesn't provide vanity URL
	// Store a placeholder that users can update later
	profileURL := "https://www.linkedin.com/in/profile-not-set"

	// Insert or update LinkedIn integration
	_, err = db.Pool.Exec(context.Background(),
		`INSERT INTO linkedin_integrations (user_id, linkedin_id, profile_url, first_name, last_name, headline, avatar_url, connected_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		 ON CONFLICT (user_id) DO UPDATE SET 
		 	linkedin_id = $2,
		 	profile_url = $3,
		 	first_name = $4,
		 	last_name = $5,
		 	headline = $6,
		 	avatar_url = $7,
		 	connected_at = NOW()`,
		userID, linkedinID, profileURL, firstName, lastName, headline, avatarURL)

	if err != nil {
		log.Println("Database error: ", err)
		return c.Status(500).SendString("Database error: " + err.Error())
	}

	// Redirect to profile page with success message
	return c.Redirect("http://localhost:3000/dashboard/profile?tab=integrations&linkedin_connected=true")
}

// GetLinkedInIntegration gets the current user's LinkedIn integration
func GetLinkedInIntegration(c *fiber.Ctx) error {
	// Get & Verify JWT
	token := c.Cookies("session")
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized/No JWT found",
		})
	}

	claims, err := utils.VerifyJWT(token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Expired/Invalid JWT",
		})
	}

	userID := claims.UserID

	// Get LinkedIn integration
	var integration struct {
		ID          int       `json:"id"`
		LinkedInID  string    `json:"linkedin_id"`
		ProfileURL  string    `json:"profile_url"`
		FirstName   string    `json:"first_name"`
		LastName    string    `json:"last_name"`
		Headline    string    `json:"headline"`
		AvatarURL   string    `json:"avatar_url"`
		ConnectedAt time.Time `json:"connected_at"`
	}

	err = db.Pool.QueryRow(context.Background(),
		`SELECT id, linkedin_id, profile_url, first_name, last_name, headline, avatar_url, connected_at
		 FROM linkedin_integrations 
		 WHERE user_id = $1`,
		userID,
	).Scan(&integration.ID, &integration.LinkedInID, &integration.ProfileURL,
		&integration.FirstName, &integration.LastName, &integration.Headline,
		&integration.AvatarURL, &integration.ConnectedAt)

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "LinkedIn not connected",
		})
	}

	return c.JSON(integration)
}

// DisconnectLinkedIn removes the LinkedIn integration for the current user
func DisconnectLinkedIn(c *fiber.Ctx) error {
	// Get & Verify JWT
	token := c.Cookies("session")
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized/No JWT found",
		})
	}

	claims, err := utils.VerifyJWT(token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Expired/Invalid JWT",
		})
	}

	userID := claims.UserID

	// Delete LinkedIn integration
	_, err = db.Pool.Exec(context.Background(),
		`DELETE FROM linkedin_integrations WHERE user_id = $1`,
		userID)

	if err != nil {
		log.Println("Database error: ", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to disconnect LinkedIn",
		})
	}

	return c.JSON(fiber.Map{
		"message": "LinkedIn disconnected successfully",
	})
}

// UpdateLinkedInProfileURL allows users to update their LinkedIn profile URL
func UpdateLinkedInProfileURL(c *fiber.Ctx) error {
	// Get & Verify JWT
	token := c.Cookies("session")
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized/No JWT found",
		})
	}

	claims, err := utils.VerifyJWT(token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Expired/Invalid JWT",
		})
	}

	userID := claims.UserID

	// Parse request body
	var requestBody struct {
		ProfileURL string `json:"profile_url"`
	}

	if err := c.BodyParser(&requestBody); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate LinkedIn URL format
	profileURL := strings.TrimSpace(requestBody.ProfileURL)
	if profileURL == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Profile URL cannot be empty",
		})
	}

	// Basic LinkedIn URL validation
	if !strings.Contains(profileURL, "linkedin.com") {
		return c.Status(400).JSON(fiber.Map{
			"error": "Please provide a valid LinkedIn profile URL",
		})
	}

	// Update LinkedIn profile URL
	_, err = db.Pool.Exec(context.Background(),
		`UPDATE linkedin_integrations 
		 SET profile_url = $1 
		 WHERE user_id = $2`,
		profileURL, userID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update LinkedIn profile URL",
		})
	}

	return c.JSON(fiber.Map{
		"message": "LinkedIn profile URL updated successfully",
	})
}
