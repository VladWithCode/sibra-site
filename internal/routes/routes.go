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
	// RegisterAdminRoutes(router)
	RegisterPropertyRoutes(router)
	RegisterPriceMapRoutes(router)
	RegisterUserRoutes(router)
	RegisterRequestsRouter(router)
	RegisterProjectRoutes(router)

	// Serve static
	// *Might change it to serve static files through nginx
	fs := http.FileServer(http.Dir("web/static/"))
	router.Handle("GET /static/", http.StripPrefix("/static/", fs))

	router.NotFoundHandleFunc(respondWith404)

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
