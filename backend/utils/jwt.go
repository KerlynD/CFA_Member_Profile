package utils

import (
	"os"
	"time"
	"github.com/golang-jwt/jwt/v5"
)

// Claims Struct (gonna be encoded into a JWT)
type Claims struct {
	UserID int `json:"user_id"`
	Email string `json:"email"`
	IsAdmin bool `json:"is_admin"`
	jwt.RegisteredClaims
}

// Generate a new JWT
func GenerateJWT(userID int, email string, isAdmin bool) (string, error) {
	/*
		Generates a new JWT for the user
		Returns the JWT and an error if it fails
	*/
	claims := &Claims{
		UserID: userID,
		Email: email,
		IsAdmin: isAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)), // Always expires in 24 hours
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := []byte(os.Getenv("JWT_SECRET"))
	return token.SignedString(secret)
}

// Verify a JWT
func VerifyJWT(tokenString string) (*Claims, error) {
	/*
		Verifies a JWT
		Returns the claims and an error if it fails
	*/

	// Parse the JWT with the secret key
	secret := []byte(os.Getenv("JWT_SECRET"))
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return secret, nil
	})

	if err != nil {
		return nil, err
	}

	// Check if the token is valid
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, err
}