package routes

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/vladwithcode/sibra-site/internal/db"
)

func RegisterRequestsRouter(r *customServeMux) {
	r.HandleFunc("POST /api/citas", CreateRequest)
}

func CreateRequest(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	req := db.Request{}
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Invalid request body",
		})
		return
	}

	var prop *db.Property
	if req.Property != "" {
		prop, err = db.FindPropertyById(ctx, req.Property)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, ErrorParams{
				ErrorMessage: "Ocurrió un error al buscar la propiedad",
			})
			log.Printf("Error finding property: %v\n", err)
			return
		}

		req.Agent = prop.Agent
		req.Property = prop.Id
	}

	err = db.CreateRequest(ctx, &req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al crear la solicitud",
		})
		log.Printf("Failed to create request: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"request": req,
	})
}
