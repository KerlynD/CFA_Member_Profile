package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/KerlynD/CFA_Member_Profile/backend/utils"
)

// Ensure the user is authenticated
func RequireAuth(c *fiber.Ctx) error {
	/*
		Require Authenticated User 
		Returns a 401 Unauthorized if the user is not authenticated
	*/

	// Get the JWT from the cookie
	cookie := c.Cookies("session")

	if cookie == "" {
		authHeader := c.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			cookie = strings.TrimPrefix(authHeader, "Bearer ")
		}
	} else {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized/No JWT found",
		})
	}

	// Verify the JWT
	claims, err := utils.VerifyJWT(cookie)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Expired/Invalid JWT",
		})
	}

	// Attach the claims to the context
	c.Locals("user_id", claims.UserID)
	c.Locals("email", claims.Email)
	c.Locals("is_admin", claims.IsAdmin)

	return c.Next()
}

// Ensure the user is an admin
func RequireAdmin(c *fiber.Ctx) error {
	/*
		Require Admin User 
		Returns a 401 Unauthorized if the user is not an admin
	*/
	isAdmin := c.Locals("is_admin").(bool)
	if !isAdmin {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized/Not Admin",
		})
	}
	return c.Next()
}
