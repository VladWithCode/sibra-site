package routes

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
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

// Max field sizes accepted from clients. Anything longer is truncated before
// it touches the DB so a malicious external page can't bloat storage.
const (
	maxURLLen      = 2048
	maxPathLen     = 1024
	maxTitleLen    = 512
	maxReferrerLen = 2048
	maxSourceLen   = 128
	maxSiteLen     = 128
	maxSessionLen  = 128
	maxVisitorLen  = 128
)

func RegisterAnalyticsRoutes(router *customServeMux) {
	// Internal SPA tracker (same-origin).
	router.HandleFunc("POST /api/analytics/track", TrackPageView)

	// Generalized public ingestion for external pages (CORS-enabled).
	router.HandleFunc("POST /api/analytics/visit", TrackVisit)
	router.HandleFunc("OPTIONS /api/analytics/visit", analyticsPreflight)

	// Admin dashboard reads.
	router.HandleFunc("GET /api/analytics/stats", auth.WithAuthAccessLevelMiddleware(GetAnalyticsStats, auth.AccessLevelAdmin))
	router.HandleFunc("GET /api/analytics/stats/hourly", auth.WithAuthAccessLevelMiddleware(GetAnalyticsHourly, auth.AccessLevelAdmin))
	router.HandleFunc("GET /api/analytics/visits", auth.WithAuthAccessLevelMiddleware(GetVisits, auth.AccessLevelAdmin))
}

// ---------------------------------------------------------------------------
// CORS for the public ingestion endpoint
// ---------------------------------------------------------------------------

var (
	analyticsOriginsOnce sync.Once
	analyticsOrigins     map[string]bool
)

// allowedAnalyticsOrigins parses ANALYTICS_ALLOWED_ORIGINS once. Comma-separated
// list of exact origins (e.g. "https://landing.com,https://promo.mx"). The single
// value "*" allows any origin (no credentials are ever sent, so this is safe for
// anonymous visit counting). Empty/unset => no cross-origin access.
func allowedAnalyticsOrigins() map[string]bool {
	analyticsOriginsOnce.Do(func() {
		analyticsOrigins = map[string]bool{}
		raw := os.Getenv("ANALYTICS_ALLOWED_ORIGINS")
		for _, o := range strings.Split(raw, ",") {
			if o = strings.TrimSpace(o); o != "" {
				analyticsOrigins[o] = true
			}
		}
	})
	return analyticsOrigins
}

// applyAnalyticsCORS sets CORS headers when the request Origin is allowlisted.
// Never sets Allow-Credentials, so "*" stays safe.
func applyAnalyticsCORS(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return
	}
	allowed := allowedAnalyticsOrigins()
	switch {
	case allowed["*"]:
		w.Header().Set("Access-Control-Allow-Origin", "*")
	case allowed[origin]:
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Add("Vary", "Origin")
	default:
		return
	}
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Max-Age", "86400")
}

func analyticsPreflight(w http.ResponseWriter, r *http.Request) {
	applyAnalyticsCORS(w, r)
	w.WriteHeader(http.StatusNoContent)
}

// ---------------------------------------------------------------------------
// Ingestion
// ---------------------------------------------------------------------------

type trackPayload struct {
	Path      string `json:"path"`
	Referrer  string `json:"referrer"`
	SessionID string `json:"sessionId"`
}

// TrackPageView is the internal same-origin tracker kept for the SPA beacon.
func TrackPageView(w http.ResponseWriter, r *http.Request) {
	if isBot(r) {
		w.WriteHeader(http.StatusNoContent)
		return
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

	in := db.VisitInput{
		Path:      truncate(payload.Path, maxPathLen),
		Referrer:  truncate(payload.Referrer, maxReferrerLen),
		SessionID: truncate(payload.SessionID, maxSessionLen),
		UserAgent: r.UserAgent(),
		IpHash:    hashIP(extractIP(r)),
	}
	recordAsync(in)

	w.WriteHeader(http.StatusNoContent)
}

type visitPayload struct {
	URL       string `json:"url"`
	Path      string `json:"path"`
	Title     string `json:"title"`
	Referrer  string `json:"referrer"`
	Source    string `json:"source"`
	Site      string `json:"site"`
	SessionID string `json:"sessionId"`
	VisitorID string `json:"visitorId"`
}

// TrackVisit is the generalized public endpoint for external pages. It accepts a
// richer payload, complements it with server-derived metadata, and responds with
// a simple {"ok": true}. CORS is applied for allowlisted origins.
func TrackVisit(w http.ResponseWriter, r *http.Request) {
	applyAnalyticsCORS(w, r)

	if isBot(r) {
		respondOK(w)
		return
	}

	var payload visitPayload
	// Cap body size to avoid abuse.
	if err := json.NewDecoder(io.LimitReader(r.Body, 16*1024)).Decode(&payload); err != nil {
		respondWithJSON(w, http.StatusBadRequest, rmap{"ok": false, "error": "payload inválido"})
		return
	}
	defer r.Body.Close()

	path := strings.TrimSpace(payload.Path)
	urlStr := strings.TrimSpace(payload.URL)
	if path == "" && urlStr == "" {
		respondWithJSON(w, http.StatusBadRequest, rmap{"ok": false, "error": "url o path requerido"})
		return
	}
	// Derive path from url when only url is provided.
	if path == "" {
		if u, err := url.Parse(urlStr); err == nil && u.Path != "" {
			path = u.Path
		}
	}

	referrer := payload.Referrer
	if referrer == "" {
		referrer = r.Referer()
	}

	in := db.VisitInput{
		Path:      truncate(path, maxPathLen),
		Url:       truncate(urlStr, maxURLLen),
		Title:     truncate(payload.Title, maxTitleLen),
		Referrer:  truncate(referrer, maxReferrerLen),
		Source:    truncate(payload.Source, maxSourceLen),
		Site:      truncate(payload.Site, maxSiteLen),
		SessionID: truncate(payload.SessionID, maxSessionLen),
		VisitorID: truncate(payload.VisitorID, maxVisitorLen),
		UserAgent: r.UserAgent(),
		IpHash:    hashIP(extractIP(r)),
		Origin:    truncate(r.Header.Get("Origin"), maxURLLen),
	}
	recordAsync(in)

	respondOK(w)
}

func respondOK(w http.ResponseWriter) {
	respondWithJSON(w, http.StatusOK, rmap{"ok": true})
}

func recordAsync(in db.VisitInput) {
	go func() {
		if err := db.RecordVisit(context.Background(), in); err != nil {
			log.Printf("err recording visit: %v\n", err)
		}
	}()
}

func isBot(r *http.Request) bool {
	ua := strings.ToLower(r.UserAgent())
	for _, bot := range botPatterns {
		if strings.Contains(ua, bot) {
			return true
		}
	}
	return false
}

func hashIP(ip string) string {
	return fmt.Sprintf("%x", sha256.Sum256([]byte(ip)))
}

func truncate(s string, max int) string {
	if len(s) > max {
		return s[:max]
	}
	return s
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

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

func GetAnalyticsStats(w http.ResponseWriter, r *http.Request) {
	filter, err := parseAnalyticsFilter(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Parámetros de fecha inválidos. Usa formato YYYY-MM-DD.",
		})
		return
	}

	stats, err := db.GetAnalyticsStats(r.Context(), filter)
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

func GetVisits(w http.ResponseWriter, r *http.Request) {
	filter, err := parseAnalyticsFilter(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Parámetros de fecha inválidos. Usa formato YYYY-MM-DD.",
		})
		return
	}

	limit := parseIntQuery(r, "limit", 50, 1, 200)
	offset := parseIntQuery(r, "offset", 0, 0, 1_000_000)

	visits, err := db.ListVisits(r.Context(), filter, limit, offset)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Error al obtener visitas",
		})
		log.Printf("err getting visits: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, rmap{
		"success": true,
		"visits":  visits,
		"limit":   limit,
		"offset":  offset,
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

// parseAnalyticsFilter reads the shared filter (dates + url/urls/q/source/site).
func parseAnalyticsFilter(r *http.Request) (db.AnalyticsFilter, error) {
	from, to, err := parseDateRange(r)
	if err != nil {
		return db.AnalyticsFilter{}, err
	}

	q := r.URL.Query()
	filter := db.AnalyticsFilter{
		From:   from,
		To:     to,
		URL:    strings.TrimSpace(q.Get("url")),
		Q:      strings.TrimSpace(q.Get("q")),
		Source: strings.TrimSpace(q.Get("source")),
		Site:   strings.TrimSpace(q.Get("site")),
	}

	if raw := q.Get("urls"); raw != "" {
		for _, u := range strings.Split(raw, ",") {
			if u = strings.TrimSpace(u); u != "" {
				filter.URLs = append(filter.URLs, u)
			}
		}
	}

	return filter, nil
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

func parseIntQuery(r *http.Request, key string, def, min, max int) int {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return def
	}
	v, err := strconv.Atoi(raw)
	if err != nil {
		return def
	}
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}
