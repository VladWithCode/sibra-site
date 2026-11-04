package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/media"
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

	// Media encoding requires ffmpeg/ffprobe; fail loudly like the DB.
	if err := media.CheckTools(); err != nil {
		panic(fmt.Sprintf("Media tools are not available: %v", err))
	}
	if err := media.Init(); err != nil {
		panic(fmt.Sprintf("Media storage is not available: %v", err))
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	workers, err := media.StartWorkers(ctx)
	if err != nil {
		panic(fmt.Sprintf("Media workers failed to start: %v", err))
	}

	portStr := os.Getenv("PORT")
	if portStr == "" {
		portStr = "8080"
	}
	addr := fmt.Sprintf(":%v", portStr)
	server := &http.Server{Addr: addr, Handler: routes.NewRouter()}

	go func() {
		fmt.Printf("Server listening on http://localhost%v\n", addr)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Couldn't start server: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("Shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Server shutdown: %v\n", err)
	}
	// ctx is already cancelled: running encodes are killed and requeued.
	workers.Wait()
}
