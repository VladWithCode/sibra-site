package routes

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
)

func RegisterPropertyRoutes(router *customServeMux) {
	router.HandleFunc("GET /api/propiedades", FindFilteredProperties)
	router.HandleFunc("GET /api/propiedades/panel/{id}", auth.ValidateAuthMiddleware(FindSingleProperty))
	router.HandleFunc("GET /api/propiedades/{contract}", FindProperties)
	router.HandleFunc("GET /api/propiedades/{contract}/{id}", FindPropertyWithNearbyProps)
	router.HandleFunc("POST /api/property", auth.WithAuthAccessLevelMiddleware(CreateProperty, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/property/{id}", auth.WithAuthAccessLevelMiddleware(UpdateProperty, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/property/{id}", auth.WithAuthAccessLevelMiddleware(DeletePropertyById, auth.AccessLevelEditor))
}

func CreateProperty(w http.ResponseWriter, r *http.Request) {
	property := db.Property{}
	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()
	err := decoder.Decode(&property)
	if err != nil {
		respondWithError(w, 400, ErrorParams{
			ErrorMessage: "El formulario contiene información erronea.",
		})
		log.Printf("Malformed json data: %v\n", err)
		return
	}

	user, err := auth.ExtractAuthDataFromRequest(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, ErrorParams{
			ErrorMessage: "No se pudo autenticar el usuario",
		})
		log.Printf("Error extracting auth data: %v\n", err)
		return
	}

	property.Id = uuid.Must(uuid.NewV7()).String()
	property.Agent = user.Id
	property.SetSlug()
	property.SyncLatLon()

	err = db.CreateProperty(&property)
	if err != nil {
		respondWithError(w, 400, ErrorParams{
			ErrorMessage: "Error al crear la propiedad",
		})
		log.Printf("Create err: %v\n", err)
		return
	}

	respondWithJSON(w, 200, map[string]any{
		"property": property,
		"success":  true,
	})
}

func UpdateProperty(w http.ResponseWriter, r *http.Request) {
	property := db.Property{}
	err := json.NewDecoder(r.Body).Decode(&property)
	defer r.Body.Close()
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "El formulario contiene información inválida",
		})
		log.Printf("Error decoding request body: %v", err)
		return
	}

	property.Id = r.PathValue("id")
	foundProp, err := db.FindPropertyById(r.Context(), property.Id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró la propiedad",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding property: %v\n", err)
		return
	}
	property.Agent = foundProp.Agent
	if foundProp.Slug == "" {
		property.SetSlug()
	}

	err = db.UpdateProperty(&property)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar la propiedad",
		})
		log.Printf("Error updating property: %v", err)
		return
	}

	resData, err := json.Marshal(map[string]any{
		"success":  true,
		"property": property,
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar la propiedad",
		})
		log.Printf("Error marshaling response: %v", err)
		return
	}
	respondWithJSON(w, http.StatusCreated, resData)
}

func DeletePropertyById(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	err := db.DeletePropertyById(id)
	if err != nil {
		log.Printf("Error deleting property: %v\n", err)
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al eliminar la propiedad",
		})
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}

func FindFilteredProperties(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	params := r.URL.Query()
	filter := db.NewPropertyFilterFromQuery(&params)
	pageStr := r.URL.Query().Get("page")
	page, err := strconv.Atoi(pageStr)
	if err != nil || page <= 0 {
		page = 1
	}
	perPageStr := r.URL.Query().Get("perPage")
	perPage, err := strconv.Atoi(perPageStr)
	if err != nil || perPage <= 0 {
		perPage = db.DefaultPageSize
	}

	props, err := db.GetProperties(ctx, filter, perPage, page)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontraron propiedades para la búsqueda ingresada.",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding filtered properties: %v\n", err)
		return
	}

	pagination, err := db.GetPaginationData(filter, perPage, page)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding pagination data: %v\n", err)
		return
	}

	time.Sleep(time.Second * 1)

	respondWithJSON(w, http.StatusOK, map[string]any{
		"properties": props,
		"pagination": pagination,
	})
}

func FindSingleProperty(w http.ResponseWriter, r *http.Request) {
	propId := r.PathValue("id")
	ctx := r.Context()

	prop, err := db.FindPropertyById(ctx, propId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la propiedad"})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{})
		log.Printf("Error while finding property: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"property": prop,
	})
}

func FindPropertyWithNearbyProps(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := r.PathValue("id")
	nearbyDistance, _ := strconv.Atoi(r.URL.Query().Get("d"))
	if nearbyDistance == 0 {
		nearbyDistance = db.NearbyDistanceNormal // Default distance is 1km
	}

	var findFn func(context.Context, string) (*db.Property, error)
	if _, err := uuid.Parse(id); err == nil {
		findFn = db.FindPropertyById
	} else {
		findFn = db.FindPropertyBySlug
	}

	prop, err := findFn(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la propiedad"})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{})
		log.Printf("Error finding property: %v\n", err)
		return
	}

	nearbyProps, err := db.FindNearbyProperties(id, nearbyDistance)
	if err != nil {
		log.Printf("Error finding nearby properties: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"property":         prop,
		"nearbyProperties": nearbyProps,
	})
}

func FindProperties(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	contract := r.PathValue("contract")

	params := r.URL.Query()
	filter := db.NewPropertyFilterFromQuery(&params)

	// Contract comes from path param, override whatever query might say
	if contract != "" {
		filter.Contract = &contract
	}

	// Default ordering if not provided
	if filter.OrderBy == nil {
		orderBy := db.OrderByListingDate
		filter.OrderBy = &orderBy
	}
	if filter.OrderDirection == nil {
		orderDir := db.OrderDirectionDESC
		filter.OrderDirection = &orderDir
	}

	pageStr := r.URL.Query().Get("page")
	page, err := strconv.Atoi(pageStr)
	if err != nil || page <= 0 {
		page = 1
	}

	perPageStr := r.URL.Query().Get("perPage")
	perPage, err := strconv.Atoi(perPageStr)
	if err != nil || perPage <= 0 {
		perPage = db.DefaultPageSize
	}

	props, err := db.GetProperties(ctx, filter, perPage, page)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontraron propiedades",
			})
		} else {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
			})
		}
		log.Printf("Error finding properties: %v\n", err)
		return
	} else if len(props) == 0 {
		respondWithError(w, http.StatusNotFound, ErrorParams{
			ErrorMessage: "No se encontraron propiedades",
		})
		return
	}

	pagination, err := db.GetPaginationData(
		filter,
		perPage,
		page,
	)
	if err != nil {
		respondWithError(w, http.StatusNotFound, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding pagination data: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"properties": props,
		"pagination": pagination,
	})
}
