package main

import (
	"log"
	"os"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/vladwithcode/sibra-site/internal/db"
)

func main() {
	godotenv.Overload(".env")

	dbPool, err := db.Connect()
	if err != nil {
		log.Fatalf("Error while connecting to DB: %v\n", err)
	}
	defer dbPool.Close()

	id, err := uuid.NewV7()
	if err != nil {
		log.Fatalf("Couldn't create ID: %v\n", err)
	}
	admin := db.User{
		Id:            id.String(),
		Name:          "Administador",
		Username:      "admin",
		Email:         os.Getenv("SBR_ADMIN_MAIL"),
		Password:      os.Getenv("SBR_ADMIN_PW"),
		Role:          db.RoleAdmin,
		GoldenBoy:     true,
		EmailVerified: true,
	}

	_, err = db.CreateUser(&admin)

	if err != nil {
		log.Fatalf("Couldn't create user: %v", err)
	}

	log.Println("Created Successfully")
}
