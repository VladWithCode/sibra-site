package routes

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
)

var botPatterns = []string{
	"googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider",
	"yandexbot", "sogou", "exabot", "facebot", "ia_archiver",
	"semrushbot", "ahrefsbot", "mj12bot", "dotbot", "petalbot",
	"bytespider", "gptbot", "claudebot",
}

func RegisterAnalyticsRoutes(router *customServeMux) {
	router.HandleFunc("POST /api/analytics/track", TrackPageView)
	router.HandleFunc("GET /api/analytics/stats", auth.WithAuthAccessLevelMiddleware(GetAnalyticsStats, auth.AccessLevelAdmin))
	router.HandleFunc("GET /api/analytics/stats/hourly", auth.WithAuthAccessLevelMiddleware(GetAnalyticsHourly, auth.AccessLevelAdmin))
}

type trackPayload struct {
	Path      string `json:"path"`
	Referrer  string `json:"referrer"`
	SessionID string `json:"sessionId"`
}

func TrackPageView(w http.ResponseWriter, r *http.Request) {
	ua := strings.ToLower(r.UserAgent())
	for _, bot := range botPatterns {
		if strings.Contains(ua, bot) {
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	var payload trackPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	defer r.Body.Close()

	if payload.Path == "" {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	ip := extractIP(r)
	ipHash := fmt.Sprintf("%x", sha256.Sum256([]byte(ip)))

	userAgent := r.UserAgent()
	go func() {
		if err := db.RecordPageView(context.Background(), payload.Path, payload.Referrer, userAgent, ipHash, payload.SessionID); err != nil {
			log.Printf("err recording page view: %v\n", err)
		}
	}()

	w.WriteHeader(http.StatusNoContent)
}

func extractIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.SplitN(xff, ",", 2)
		return strings.TrimSpace(parts[0])
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func GetAnalyticsStats(w http.ResponseWriter, r *http.Request) {
	from, to, err := parseDateRange(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Parámetros de fecha inválidos. Usa formato YYYY-MM-DD.",
		})
		return
	}

	stats, err := db.GetAnalyticsStats(r.Context(), from, to)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Error al obtener estadísticas",
		})
		log.Printf("err getting analytics stats: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, rmap{
		"success": true,
		"stats":   stats,
	})
}

func GetAnalyticsHourly(w http.ResponseWriter, r *http.Request) {
	dateStr := r.URL.Query().Get("date")
	if dateStr == "" {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Parámetro 'date' requerido (YYYY-MM-DD)",
		})
		return
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Formato de fecha inválido. Usa YYYY-MM-DD.",
		})
		return
	}

	hourly, err := db.GetAnalyticsHourly(r.Context(), date)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Error al obtener estadísticas por hora",
		})
		log.Printf("err getting hourly analytics: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, rmap{
		"success":      true,
		"viewsPerHour": hourly,
	})
}

func parseDateRange(r *http.Request) (time.Time, time.Time, error) {
	fromStr := r.URL.Query().Get("from")
	toStr := r.URL.Query().Get("to")

	if fromStr == "" || toStr == "" {
		to := time.Now()
		from := to.AddDate(0, 0, -30)
		return from, to, nil
	}

	from, err := time.Parse("2006-01-02", fromStr)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}

	to, err := time.Parse("2006-01-02", toStr)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	// Include the full "to" day
	to = to.Add(24 * time.Hour)

	return from, to, nil
}
