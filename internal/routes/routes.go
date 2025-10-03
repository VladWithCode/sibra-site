package routes

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/vladwithcode/sibra-site/internal/auth"
)

func NewRouter() http.Handler {
	router := NewCustomServeMux()

	// Api router
	// RegisterAdminRoutes(router)
	RegisterPropertyRoutes(router)
	RegisterPriceMapRoutes(router)
	RegisterUserRoutes(router)
	RegisterRequestsRouter(router)
	RegisterProjectRoutes(router)

	router.HandleFunc("/api/check-project-auth", checkProjectAuth)

	// Serve static
	// *Might change it to serve static files through nginx
	fs := http.FileServer(http.Dir("web/static/"))
	router.Handle("GET /static/", http.StripPrefix("/static/", fs))

	router.NotFoundHandleFunc(auth.CheckAuthMiddleware(respondWith404))

	return router
}

func checkProjectAuth(w http.ResponseWriter, r *http.Request) {
	tkStr, err := r.Cookie("project_auth")
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, ErrorParams{
			ErrorMessage: "No se encontro token",
		})
		log.Printf("Error getting project auth token: %v\n", err)
		return
	}

	tk, err := auth.ParseToken(tkStr.Value)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, ErrorParams{
			ErrorMessage: "Token invalido",
		})
		log.Printf("Error parsing project auth token: %v\n", err)
		return
	}

	if !tk.Valid {
		respondWithError(w, http.StatusUnauthorized, ErrorParams{
			ErrorMessage: "Token invalido",
		})
		log.Printf("Invalid project auth token: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}

func respondWith404(w http.ResponseWriter, r *http.Request, auth *auth.Auth) {
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
