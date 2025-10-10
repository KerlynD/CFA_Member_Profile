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
		Creates a new OAuth2 configuration for LinkedIn authentication
		Sets the RedirectURL, ClientID, ClientSecret, and Endpoint for LinkedIn authentication
	*/
	linkedinOAuthConfig = &oauth2.Config{
		RedirectURL:  os.Getenv("LINKEDIN_REDIRECT_URL"),
		ClientID:     os.Getenv("LINKEDIN_CLIENT_ID"),
		ClientSecret: os.Getenv("LINKEDIN_CLIENT_SECRET"),
		Scopes:       []string{"r_emailaddress", "r_liteprofile", "r_organization_social"},
		Endpoint:     linkedin.Endpoint,
	}
}

func getCompanyLogoURL(companyName string) string {
	/*
		Returns a Clearbit logo URL for a given company name
		Uses a lookup map for well-known companies
		Fallback: tries lowercase name with .com
	*/

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
		return fmt.Sprintf("https://logo.clearbit.com/%s", domain)
	}

	// Fallback: try lowercase name with .com
	cleanName := strings.ReplaceAll(strings.ToLower(companyName), " ", "")
	return fmt.Sprintf("https://logo.clearbit.com/%s.com", cleanName)
}

func LinkedInLogin(c *fiber.Ctx) error {
	// Redirect user to LinkedIn Login
	url := linkedinOAuthConfig.AuthCodeURL("randomstate", oauth2.AccessTypeOffline)
	return c.Redirect(url)
}

func LinkedInCallback(c *fiber.Ctx) error {
	/*
		Handles the callback from LinkedIn
		Exchanges the authorization code for a token
		Gets the user info from LinkedIn
		Creates/updates user in database
		Generates a JWT and sets it as a cookie
		Syncs work history from LinkedIn profile
		Redirects to the frontend
	*/

	code := c.Query("code")
	token, err := linkedinOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		log.Println("Failed to exchange authorization code for token: ", err)
		return c.Status(500).SendString("Failed to exchange authorization code for token")
	}

	// Get the user profile from LinkedIn
	request, _ := http.NewRequest("GET", "https://api.linkedin.com/v2/me", nil)
	request.Header.Set("Authorization", "Bearer "+token.AccessToken)
	response, err := http.DefaultClient.Do(request)

	if err != nil {
		log.Println("Failed to get user info from LinkedIn: ", err)
		return c.Status(500).SendString("Failed to get user info from LinkedIn")
	}
	defer response.Body.Close()

	var profile map[string]interface{}
	json.NewDecoder(response.Body).Decode(&profile)

	// Get the user's email (separate endpoint)
	emailReq, _ := http.NewRequest("GET", "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))", nil)
	emailReq.Header.Set("Authorization", "Bearer "+token.AccessToken)
	emailResp, err := http.DefaultClient.Do(emailReq)
	if err != nil {
		log.Println("Failed to get email from LinkedIn: ", err)
		return c.Status(500).SendString("Failed to get email from LinkedIn")
	}
	defer emailResp.Body.Close()

	var emailData map[string]interface{}
	json.NewDecoder(emailResp.Body).Decode(&emailData)

	// Extract user data
	linkedinID := profile["id"].(string)
	firstName := profile["localizedFirstName"].(string)
	lastName := profile["localizedLastName"].(string)
	name := firstName + " " + lastName

	// Extract email from nested structure
	var email string
	if elements, ok := emailData["elements"].([]interface{}); ok && len(elements) > 0 {
		if elem, ok := elements[0].(map[string]interface{}); ok {
			if handle, ok := elem["handle~"].(map[string]interface{}); ok {
				email = handle["emailAddress"].(string)
			}
		}
	}

	if email == "" {
		log.Println("Failed to extract email from LinkedIn")
		return c.Status(500).SendString("Failed to get user email")
	}

	// Find or insert user and get their ID and admin status
	var userID int
	var isAdmin bool

	err = db.Pool.QueryRow(context.Background(),
		`INSERT INTO users (google_id, name, email)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (email) DO UPDATE SET google_id=$1
		 RETURNING id, is_admin`,
		linkedinID, name, email,
	).Scan(&userID, &isAdmin)

	if err != nil {
		log.Println("Database error: ", err)
		return c.Status(500).SendString("Database error: " + err.Error())
	}

	// Generate JWT and set it as a cookie
	jwtToken, err := utils.GenerateJWT(userID, email, isAdmin)
	if err != nil {
		log.Println("Failed to create JWT: ", err)
		return c.Status(500).SendString("Failed to create JWT")
	}

	c.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    jwtToken,
		Expires:  time.Now().Add(24 * time.Hour),
		HTTPOnly: true,
		Secure:   false,
	})

	// Fetch LinkedIn positions (work history)
	posReq, _ := http.NewRequest("GET", "https://api.linkedin.com/v2/positions", nil)
	posReq.Header.Set("Authorization", "Bearer "+token.AccessToken)
	posResp, err := http.DefaultClient.Do(posReq)

	if err != nil {
		log.Println("Failed to get positions from LinkedIn: ", err)
		// Don't fail the whole auth gotta just continue without syncing work history
	} else {
		defer posResp.Body.Close()

		var positionsData map[string]interface{}
		json.NewDecoder(posResp.Body).Decode(&positionsData)

		// Loop through positions and insert into work_history
		if positions, ok := positionsData["values"].([]interface{}); ok {
			for _, p := range positions {
				job, ok := p.(map[string]interface{})
				if !ok {
					continue
				}

				var company, title, location string

				if companyData, ok := job["company"].(map[string]interface{}); ok {
					if companyName, ok := companyData["name"].(string); ok {
						company = companyName
					}
				}

				if jobTitle, ok := job["title"].(string); ok {
					title = jobTitle
				}

				if jobLocation, ok := job["locationName"].(string); ok {
					location = jobLocation
				}

				// Get company logo URL from Clearbit
				companyLogo := getCompanyLogoURL(company)

				// Insert job into database with logo
				_, err := db.Pool.Exec(context.Background(),
					`INSERT INTO work_history (user_id, company, company_logo_url, title, location)
					 VALUES ($1, $2, $3, $4, $5)
					 ON CONFLICT DO NOTHING`,
					userID, company, companyLogo, title, location)

				if err != nil {
					fmt.Println("Failed to insert work history:", err)
				}
			}
		}
	}

	return c.Redirect("http://localhost:3000") // Redirect to the frontend
}
