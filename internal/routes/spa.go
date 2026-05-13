package routes

import (
	"net/http"
	"os"
	"strings"
	"sync"
)

func frontendDistDir() string {
	if d := os.Getenv("FRONTEND_DIST_DIR"); d != "" {
		return d
	}
	return "frontend/dist"
}

// spaCache holds the raw bytes of frontend/dist/index.html after the first
// successful read. The sync.Once ensures concurrent requests never race.
var (
	spaOnce  sync.Once
	spaBytes []byte
	spaErr   error
)

// readSPAHTML returns the cached index.html bytes, loading from disk once.
func readSPAHTML() ([]byte, error) {
	spaOnce.Do(func() {
		spaBytes, spaErr = os.ReadFile(frontendDistDir() + "/index.html")
	})
	return spaBytes, spaErr
}

// serveSPA writes the built React SPA index.html as-is.
// Used as the fallback for all non-API client-side routes.
func serveSPA(w http.ResponseWriter, r *http.Request) {
	data, err := readSPAHTML()
	if err != nil {
		http.Error(w, "Frontend not built. Run: npm run build inside frontend/", http.StatusServiceUnavailable)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(data)
}

// spaFallback serves the SPA index.html for any path that does not start with
// /api/ or /static/ (those have explicit Go handlers). This covers all React
// client-side routes (/, /propiedades, /blog, /contacto, /panel/*, etc.).
func spaFallback(w http.ResponseWriter, r *http.Request) {
	p := r.URL.Path
	if strings.HasPrefix(p, "/api/") || strings.HasPrefix(p, "/static/") {
		respondWith404(w, r)
		return
	}
	serveSPA(w, r)
}
