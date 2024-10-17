package main

import (
	"fmt"
	"os"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/vladwithcode/sibra-site/internal/db"
)

func main() {
	godotenv.Overload(".env")

	dbPool, err := db.Connect()
	if err != nil {
		fmt.Printf("Error while connecting to DB: %v", err)
	}
	defer dbPool.Close()

	id, err := uuid.NewV7()
	if err != nil {
		panic(err)
	}
	admin := db.User{
		Id:            id.String(),
		Name:          "admin",
		Email:         os.Getenv("ADMIN_MAIL"),
		Password:      os.Getenv("ADMIN_PW"),
		Role:          db.RoleAdmin,
		GoldenBoy:     true,
		EmailVerified: true,
	}

	_, err = db.CreateUser(&admin)

	if err != nil {
		panic(err)
	}
}
