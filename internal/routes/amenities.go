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

func RegisterAmenityRoutes(router *customServeMux) {
	router.HandleFunc("GET /api/amenities", ListAmenities)
	router.HandleFunc("GET /api/amenities/{id}", FindAmenity)
	router.HandleFunc("POST /api/amenities", auth.WithAuthAccessLevelMiddleware(CreateAmenity, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/amenities/{id}", auth.WithAuthAccessLevelMiddleware(UpdateAmenity, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/amenities/{id}", auth.WithAuthAccessLevelMiddleware(DeleteAmenity, auth.AccessLevelEditor))
}

func ListAmenities(w http.ResponseWriter, r *http.Request) {
	items, err := db.ListAmenities(r.Context())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al obtener las amenidades",
		})
		log.Printf("ListAmenities err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"amenities": items,
	})
}

func FindAmenity(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	a, err := db.FindAmenityByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró la amenidad",
			})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al obtener la amenidad",
		})
		log.Printf("FindAmenity err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"amenity": a,
	})
}

func CreateAmenity(w http.ResponseWriter, r *http.Request) {
	var a db.PropertyAmenity
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "El formulario contiene información inválida",
		})
		log.Printf("CreateAmenity decode err: %v\n", err)
		return
	}
	defer r.Body.Close()

	if err := db.CreateAmenity(r.Context(), &a); err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al crear la amenidad",
		})
		log.Printf("CreateAmenity err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"amenity": a,
	})
}

func UpdateAmenity(w http.ResponseWriter, r *http.Request) {
	var a db.PropertyAmenity
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "El formulario contiene información inválida",
		})
		log.Printf("UpdateAmenity decode err: %v\n", err)
		return
	}
	defer r.Body.Close()

	a.ID = r.PathValue("id")
	if err := db.UpdateAmenity(r.Context(), &a); err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar la amenidad",
		})
		log.Printf("UpdateAmenity err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"amenity": a,
	})
}

func DeleteAmenity(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := db.DeleteAmenity(r.Context(), id); err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al eliminar la amenidad",
		})
		log.Printf("DeleteAmenity err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}
