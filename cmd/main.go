package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/routes"
)

func main() {
	godotenv.Overload(".env")

	dbPool, err := db.Connect()
	if err != nil {
		panic(fmt.Sprintf("Error while connecting to DB: %v", err))
	}
	defer dbPool.Close()

	// Ensure DB connection is working
	if err = dbPool.Ping(context.Background()); err != nil {
		panic(fmt.Sprintf("DB is not available: %v", err))
	}

	portStr := os.Getenv("PORT")
	if portStr == "" {
		portStr = "8080"
	}
	addr := fmt.Sprintf(":%v", portStr)
	fmt.Printf("Server listening on http://localhost%v\n", addr)

	router := routes.NewRouter()

	err = http.ListenAndServe(addr, router)

	if err != nil {
		log.Fatalf("Couldn't start server: %v", err)
	}
}
