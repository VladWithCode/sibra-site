package routes

import (
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

func frontendDistDir() string {
	if d := os.Getenv("FRONTEND_DIST_DIR"); d != "" {
		return d
	}
	return "frontend/dist"
}

// spaCache holds the bytes of frontend/dist/index.html together with the
// modification time and size the file had when it was read. A new frontend
// build replaces the file, so the next call sees a different stat and re-reads
// it without restarting the server. Errors are NOT cached so the server
// recovers automatically once the frontend build becomes available (e.g. after
// a delayed npm run build).
var (
	spaMu      sync.Mutex
	spaBytes   []byte
	spaModTime time.Time
	spaSize    int64
)

// readSPAHTML returns the index.html bytes, re-reading the file whenever its
// modification time or size differs from the cached copy. If the stat or read
// fails (e.g. frontend/dist not built yet), the error is returned but NOT
// cached — the next call will retry. Callers must not modify the result.
func readSPAHTML() ([]byte, error) {
	path := frontendDistDir() + "/index.html"
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}

	spaMu.Lock()
	defer spaMu.Unlock()
	if spaBytes != nil && info.ModTime().Equal(spaModTime) && info.Size() == spaSize {
		return spaBytes, nil
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	spaBytes, spaModTime, spaSize = data, info.ModTime(), info.Size()
	return spaBytes, nil
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
