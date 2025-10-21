package handlers

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
	"github.com/gofiber/fiber/v2"
)

type CloudinaryResponse struct {
	SecureURL string `json:"secure_url"`
	PublicID  string `json:"public_id"`
	Format    string `json:"format"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
}

// POST /api/users/me/picture
func UploadProfilePicture(c *fiber.Ctx) error {
	/*
		Uploads a profile picture to Cloudinary and updates the user's picture URL
		Requires authentication
		Accepts multipart/form-data with a file field named "file"
	*/

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

	// Get the file from the request
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "No file uploaded"})
	}

	// Make sure image
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}

	contentType := file.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid file type. Only images are allowed."})
	}

	// Validate file size (max 5MB)
	if file.Size > 5*1024*1024 {
		return c.Status(400).JSON(fiber.Map{"error": "File size too large. Maximum 5MB allowed."})
	}

	fileContent, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to open file"})
	}
	defer fileContent.Close()

	// Upload to Cloudinary
	pictureURL, err := uploadToCloudinary(fileContent, file, claims.UserID)
	if err != nil {
		log.Println("Cloudinary upload error:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to upload image: " + err.Error()})
	}

	// Update user's picture in database
	_, err = db.Pool.Exec(context.Background(),
		"UPDATE users SET picture = $1 WHERE id = $2",
		pictureURL, claims.UserID)

	if err != nil {
		log.Println("DB update error:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update profile picture"})
	}

	return c.JSON(fiber.Map{
		"message":     "Profile picture updated successfully",
		"picture_url": pictureURL,
	})
}

func uploadToCloudinary(file multipart.File, fileHeader *multipart.FileHeader, userID int) (string, error) {
	/*
		Uploads a file to Cloudinary
		Returns the secure URL of the uploaded image
	*/

	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")
	uploadFolder := os.Getenv("CLOUDINARY_UPLOAD_FOLDER")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		return "", fmt.Errorf("cloudinary credentials not set in environment variables")
	}

	// Default folder if not set
	if uploadFolder == "" {
		uploadFolder = "CodeForAll-Member-Profile-Photos"
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		return "", err
	}

	// Generate timestamp and public_id
	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	publicID := fmt.Sprintf("user_%d_%d", userID, time.Now().Unix())

	// Generate signature for Cloudinary
	signature := generateCloudinarySignature(map[string]string{
		"folder":    uploadFolder,
		"public_id": publicID,
		"timestamp": timestamp,
	}, apiSecret)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add file field
	part, err := writer.CreateFormFile("file", fileHeader.Filename)
	if err != nil {
		return "", err
	}
	part.Write(fileBytes)

	// Add upload params
	writer.WriteField("folder", uploadFolder)
	writer.WriteField("public_id", publicID)
	writer.WriteField("api_key", apiKey)
	writer.WriteField("timestamp", timestamp)
	writer.WriteField("signature", signature)

	err = writer.Close()
	if err != nil {
		return "", err
	}

	// Create the request
	url := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", cloudName)
	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("cloudinary error: %s", string(responseBody))
	}

	// Parse response
	var cloudinaryResp CloudinaryResponse
	err = json.Unmarshal(responseBody, &cloudinaryResp)
	if err != nil {
		return "", err
	}

	return cloudinaryResp.SecureURL, nil
}

func generateCloudinarySignature(params map[string]string, apiSecret string) string {
	/*
		Generates a signature for Cloudinary upload
		Cloudinary requires parameters to be sorted alphabetically and concatenated
		Then hashed with SHA-1 along with the API secret
	*/

	// Get keys and sort them
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// Build the string to sign
	var parts []string
	for _, k := range keys {
		parts = append(parts, fmt.Sprintf("%s=%s", k, params[k]))
	}
	toSign := strings.Join(parts, "&") + apiSecret

	// Generate SHA-1 hash
	h := sha1.New()
	h.Write([]byte(toSign))
	return hex.EncodeToString(h.Sum(nil))
}
