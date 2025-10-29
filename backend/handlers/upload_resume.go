package handlers

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/KerlynD/CFA_Member_Profile/backend/db"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gofiber/fiber/v2"
)

func UploadResume(c *fiber.Ctx) error {
	/*
		Uploads a resume to Cloudinary and updates the user's resume URL in the database
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

	// Parse uploaded file
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "No file provided"})
	}

	// Validate file size (5MB limit)
	if fileHeader.Size > 5*1024*1024 {
		return c.Status(400).JSON(fiber.Map{"error": "File too large (max 5MB)"})
	}

	// Validate file type - PDF only
	if fileHeader.Header.Get("Content-Type") != "application/pdf" {
		return c.Status(400).JSON(fiber.Map{"error": "Only PDF resumes are allowed"})
	}

	file, err := fileHeader.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to open file"})
	}
	defer file.Close()

	// Initialize Cloudinary
	cld, err := cloudinary.NewFromParams(
		os.Getenv("CLOUDINARY_CLOUD_NAME"),
		os.Getenv("CLOUDINARY_API_KEY"),
		os.Getenv("CLOUDINARY_API_SECRET"),
	)
	if err != nil {
		log.Println("Cloudinary init error:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Cloudinary configuration error"})
	}

	// Upload to Cloudinary (as raw file, not image)
	overwrite := true
	uploadResp, err := cld.Upload.Upload(context.Background(), file, uploader.UploadParams{
		Folder:       "CodeForAll-Member-Profile-Resumes",
		PublicID:     fmt.Sprintf("resume_user_%d", claims.UserID),
		ResourceType: "raw", // Key for non-image files
		Overwrite:    &overwrite,
	})
	if err != nil {
		log.Println("Upload failed:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to upload resume"})
	}

	// Save to database
	_, err = db.Pool.Exec(context.Background(),
		`UPDATE users SET resume_url=$1, resume_uploaded_at=$2 WHERE id=$3`,
		uploadResp.SecureURL, time.Now(), claims.UserID)
	if err != nil {
		log.Println("Database error:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update resume URL"})
	}

	return c.JSON(fiber.Map{
		"message": "Resume uploaded successfully",
		"url":     uploadResp.SecureURL,
	})
}

func DeleteResume(c *fiber.Ctx) error {
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

	// Remove resume URL from database
	_, err = db.Pool.Exec(context.Background(),
		`UPDATE users SET resume_url=NULL, resume_uploaded_at=NULL WHERE id=$1`,
		claims.UserID)
	if err != nil {
		log.Println("Database error:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete resume"})
	}

	// Note: We're not deleting from Cloudinary to avoid issues if user re-uploads
	// The overwrite flag will handle replacing the file

	return c.JSON(fiber.Map{
		"message": "Resume deleted successfully",
	})
}
