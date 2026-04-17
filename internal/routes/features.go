package routes

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
)

func RegisterFeatureRoutes(router *customServeMux) {
	router.HandleFunc("GET /api/features", ListFeatures)
	router.HandleFunc("GET /api/features/{id}", FindFeature)
	router.HandleFunc("POST /api/features", auth.WithAuthAccessLevelMiddleware(CreateFeature, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/features/{id}", auth.WithAuthAccessLevelMiddleware(UpdateFeature, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/features/{id}", auth.WithAuthAccessLevelMiddleware(DeleteFeature, auth.AccessLevelEditor))
}

func ListFeatures(w http.ResponseWriter, r *http.Request) {
	items, err := db.ListFeatures(r.Context())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al obtener las características",
		})
		log.Printf("ListFeatures err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"features": items,
	})
}

func FindFeature(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	f, err := db.FindFeatureByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró la característica",
			})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al obtener la característica",
		})
		log.Printf("FindFeature err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"feature": f,
	})
}

func CreateFeature(w http.ResponseWriter, r *http.Request) {
	var f db.PropertyFeature
	if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "El formulario contiene información inválida",
		})
		log.Printf("CreateFeature decode err: %v\n", err)
		return
	}
	defer r.Body.Close()

	if err := db.CreateFeature(r.Context(), &f); err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al crear la característica",
		})
		log.Printf("CreateFeature err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"feature": f,
	})
}

func UpdateFeature(w http.ResponseWriter, r *http.Request) {
	var f db.PropertyFeature
	if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "El formulario contiene información inválida",
		})
		log.Printf("UpdateFeature decode err: %v\n", err)
		return
	}
	defer r.Body.Close()

	f.ID = r.PathValue("id")
	if err := db.UpdateFeature(r.Context(), &f); err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar la característica",
		})
		log.Printf("UpdateFeature err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"feature": f,
	})
}

func DeleteFeature(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := db.DeleteFeature(r.Context(), id); err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al eliminar la característica",
		})
		log.Printf("DeleteFeature err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}
