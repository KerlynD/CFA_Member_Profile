package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type geoDBResponse struct {
	Data []struct {
		City        string  `json:"city"`
		Region      string  `json:"region"`
		RegionCode  string  `json:"regionCode"`
		Country     string  `json:"country"`
		CountryCode string  `json:"countryCode"`
		Latitude    float64 `json:"latitude"`
		Longitude   float64 `json:"longitude"`
	} `json:"data"`
}

// SearchLocations queries the GeoDB Cities API and returns a normalized list of locations.
func SearchLocations(c *fiber.Ctx) error {
	query := strings.TrimSpace(c.Query("q"))
	if len(query) < 2 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Query must be at least 2 characters long",
		})
	}

	apiKey := os.Getenv("GEODB_API_KEY")
	if apiKey == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "GeoDB API key not configured",
		})
	}

	limit := c.Query("limit", "7")

	req, err := http.NewRequest("GET", "https://wft-geo-db.p.rapidapi.com/v1/geo/cities", nil)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to build request"})
	}

	q := req.URL.Query()
	q.Set("namePrefix", query)
	q.Set("limit", limit)
	q.Set("sort", "-population")
	q.Set("types", "CITY")
	req.URL.RawQuery = q.Encode()

	req.Header.Set("X-RapidAPI-Key", apiKey)
	req.Header.Set("X-RapidAPI-Host", "wft-geo-db.p.rapidapi.com")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "Failed to fetch locations"})
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"error": fmt.Sprintf("GeoDB API error (status %d)", resp.StatusCode),
		})
	}

	var geoResp geoDBResponse
	if err := json.NewDecoder(resp.Body).Decode(&geoResp); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse GeoDB response"})
	}

	results := make([]fiber.Map, 0, len(geoResp.Data))
	for _, city := range geoResp.Data {
		fullName := city.City
		if city.Region != "" {
			fullName += ", " + city.Region
		} else if city.RegionCode != "" {
			fullName += ", " + city.RegionCode
		}
		if city.Country != "" {
			fullName += ", " + city.Country
		}

		results = append(results, fiber.Map{
			"city":        city.City,
			"region":      city.Region,
			"regionCode":  city.RegionCode,
			"country":     city.Country,
			"countryCode": city.CountryCode,
			"latitude":    city.Latitude,
			"longitude":   city.Longitude,
			"fullName":    fullName,
		})
	}

	return c.JSON(fiber.Map{
		"results": results,
	})
}
