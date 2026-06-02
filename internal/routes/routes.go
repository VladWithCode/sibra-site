package routes

import (
	"encoding/json"
	"log"
	"net/http"
)

type rmap map[string]any

func NewRouter() http.Handler {
	router := NewCustomServeMux()

	// Api router
	RegisterAdminRoutes(router)
	RegisterPropertyRoutes(router)
	RegisterPriceMapRoutes(router)
	RegisterUserRoutes(router)
	RegisterRequestsRouter(router)
	RegisterProjectRoutes(router)
	RegisterSellingPageRoutes(router)
	RegisterFeatureRoutes(router)
	RegisterAmenityRoutes(router)
	RegisterBlogRoutes(router)
	RegisterTeamRoutes(router)
	RegisterAnalyticsRoutes(router)

	// Serve static assets from Go templates/legacy web dir
	// *Might change it to serve static files through nginx
	fs := http.FileServer(http.Dir("web/static/"))
	router.Handle("GET /static/", http.StripPrefix("/static/", fs))

	// Serve built React SPA assets (JS/CSS chunks produced by `npm run build`)
	distFS := http.FileServer(http.Dir(frontendDistDir()))
	router.Handle("GET /assets/", distFS)
	// Root-level dist files that must not be caught by the SPA fallback
	router.Handle("GET /favicon.ico", distFS)
	router.Handle("GET /manifest.json", distFS)
	router.Handle("GET /robots.txt", distFS)
	router.Handle("GET /sibra_logo_256.webp", distFS)

	// Blog post page with Open Graph / Twitter Card meta injection for bots.
	// Must be registered before the SPA fallback so it takes priority.
	router.HandleFunc("GET /blog/{slug}", handleBlogPostOG)

	// SPA fallback: all other non-API paths get the React index.html so
	// client-side routing (/, /blog, /propiedades, /panel/*, etc.) works.
	router.NotFoundHandleFunc(spaFallback)

	return router
}

func respondWith404(w http.ResponseWriter, r *http.Request) {
	respondWithError(w, 404, ErrorParams{
		ErrorMessage: "La página que estás buscando no existe",
		Etc: map[string]any{
			"url":           r.URL.Path,
			"routeNotFound": true,
		},
	})
}

type ErrorParams struct {
	ErrorMessage string         `json:"error"`
	Etc          map[string]any `json:"etc"`
}

func respondWithError(w http.ResponseWriter, code int, params ErrorParams) {
	response := map[string]any{
		"error": params.ErrorMessage,
		"etc":   params.Etc,
	}
	if response["error"] == "" {
		response["error"] = "Ocurrio un error inesperado en el servidor"
	}

	respondWithJSON(w, code, response)
}

func respondWithJSON(w http.ResponseWriter, code int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	err := json.NewEncoder(w).Encode(data)
	if err != nil {
		http.Error(w, "Ocurrio un error inesperado en el servidor", http.StatusInternalServerError)
		log.Printf("Error: %v\n", err)
	}
}
