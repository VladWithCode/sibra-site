package routes

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/uploads"
)

// RegisterFeaturedContentRoutes wires the home page featured section API:
// a public resolved feed plus admin CRUD/ordering/config endpoints.
func RegisterFeaturedContentRoutes(router *customServeMux) {
	router.HandleFunc("GET /api/destacados", GetFeaturedContent)

	router.HandleFunc("GET /api/admin/destacados", auth.WithAuthAccessLevelMiddleware(AdminListFeaturedItems, auth.AccessLevelEditor))
	router.HandleFunc("POST /api/admin/destacados", auth.WithAuthAccessLevelMiddleware(AdminCreateFeaturedItem, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/admin/destacados/orden", auth.WithAuthAccessLevelMiddleware(AdminReorderFeaturedItems, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/admin/destacados/config", auth.WithAuthAccessLevelMiddleware(AdminUpdateFeaturedConfig, auth.AccessLevelEditor))
	router.HandleFunc("POST /api/admin/destacados/imagen", auth.WithAuthAccessLevelMiddleware(AdminUploadFeaturedImage, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/admin/destacados/{id}", auth.WithAuthAccessLevelMiddleware(AdminUpdateFeaturedItem, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/admin/destacados/{id}", auth.WithAuthAccessLevelMiddleware(AdminDeleteFeaturedItem, auth.AccessLevelEditor))
}

// GetFeaturedContent returns the resolved, ordered featured cards along with
// the configured visible count.
func GetFeaturedContent(w http.ResponseWriter, r *http.Request) {
	items, err := db.ListFeaturedItems(r.Context())
	if err != nil {
		fmt.Printf("err: %v\n", err)
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "No se pudo obtener el contenido destacado"})
		return
	}

	resolved, err := db.ResolveFeaturedItems(r.Context(), items)
	if err != nil {
		fmt.Printf("err: %v\n", err)
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "No se pudo obtener el contenido destacado"})
		return
	}

	visibleCount, err := db.GetFeaturedVisibleCount(r.Context())
	if err != nil {
		fmt.Printf("err: %v\n", err)
		visibleCount = 3
	}

	respondWithJSON(w, http.StatusOK, rmap{
		"items":        resolved,
		"visibleCount": visibleCount,
	})
}

// AdminListFeaturedItems returns raw items (for editing) plus their resolved
// preview and the visible count.
func AdminListFeaturedItems(w http.ResponseWriter, r *http.Request) {
	items, err := db.ListFeaturedItems(r.Context())
	if err != nil {
		fmt.Printf("err: %v\n", err)
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "No se pudo obtener el contenido destacado"})
		return
	}

	resolved, err := db.ResolveFeaturedItems(r.Context(), items)
	if err != nil {
		fmt.Printf("err: %v\n", err)
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "No se pudo obtener el contenido destacado"})
		return
	}

	visibleCount, err := db.GetFeaturedVisibleCount(r.Context())
	if err != nil {
		fmt.Printf("err: %v\n", err)
		visibleCount = 3
	}

	respondWithJSON(w, http.StatusOK, rmap{
		"items":        items,
		"resolved":     resolved,
		"visibleCount": visibleCount,
	})
}

type featuredItemPayload struct {
	Kind        string `json:"kind"`
	ResourceID  string `json:"resourceId"`
	ExternalURL string `json:"externalUrl"`
	Title       string `json:"title"`
	Image       string `json:"image"`
	Subtitle    string `json:"subtitle"`
}

func respondFeaturedValidationError(w http.ResponseWriter, err error) bool {
	switch {
	case errors.Is(err, db.ErrFeaturedUnknownKind):
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "El tipo de recurso destacado no es válido"})
	case errors.Is(err, db.ErrFeaturedResourceIDRequired):
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "Debes seleccionar el recurso a destacar"})
	case errors.Is(err, db.ErrFeaturedExternalIncomplete):
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "Los destacados externos requieren enlace, título e imagen"})
	default:
		return false
	}
	return true
}

func AdminCreateFeaturedItem(w http.ResponseWriter, r *http.Request) {
	var payload featuredItemPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "Los datos enviados son inválidos"})
		return
	}

	item, err := db.NewFeaturedItem(payload.Kind, payload.ResourceID, payload.ExternalURL, payload.Title, payload.Image, payload.Subtitle)
	if err != nil {
		if !respondFeaturedValidationError(w, err) {
			fmt.Printf("err: %v\n", err)
			respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "No se pudo crear el destacado"})
		}
		return
	}

	if err := db.CreateFeaturedItem(r.Context(), item); err != nil {
		fmt.Printf("err: %v\n", err)
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "No se pudo crear el destacado"})
		return
	}

	respondWithJSON(w, http.StatusCreated, rmap{"success": true, "item": item})
}

func AdminUpdateFeaturedItem(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if _, err := uuid.Parse(id); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "El destacado solicitado no existe"})
		return
	}

	var payload featuredItemPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "Los datos enviados son inválidos"})
		return
	}

	item, err := db.NewFeaturedItem(payload.Kind, payload.ResourceID, payload.ExternalURL, payload.Title, payload.Image, payload.Subtitle)
	if err != nil {
		if !respondFeaturedValidationError(w, err) {
			fmt.Printf("err: %v\n", err)
			respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "No se pudo actualizar el destacado"})
		}
		return
	}
	item.ID = id

	if err := db.UpdateFeaturedItem(r.Context(), item); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "El destacado solicitado no existe"})
			return
		}
		fmt.Printf("err: %v\n", err)
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "No se pudo actualizar el destacado"})
		return
	}

	respondWithJSON(w, http.StatusOK, rmap{"success": true, "item": item})
}

func AdminDeleteFeaturedItem(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	item, err := db.DeleteFeaturedItem(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "El destacado solicitado no existe"})
			return
		}
		fmt.Printf("err: %v\n", err)
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "No se pudo eliminar el destacado"})
		return
	}

	// External card images are uploads owned by the featured item; remove the
	// file with the row. Internal kinds only reference their resource's image.
	if item.Kind == db.FeaturedKindExternal && item.Image != "" && !strings.Contains(item.Image, "/") {
		if err := uploads.Delete(item.Image); err != nil {
			log.Printf("Error deleting featured image %q: %v\n", item.Image, err)
		}
	}

	respondWithJSON(w, http.StatusOK, rmap{"success": true})
}

func AdminReorderFeaturedItems(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		IDs []string `json:"ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || len(payload.IDs) == 0 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "Los datos enviados son inválidos"})
		return
	}

	if err := db.ReorderFeaturedItems(r.Context(), payload.IDs); err != nil {
		fmt.Printf("err: %v\n", err)
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "No se pudo reordenar el contenido destacado"})
		return
	}

	respondWithJSON(w, http.StatusOK, rmap{"success": true})
}

func AdminUpdateFeaturedConfig(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		VisibleCount int `json:"visibleCount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "Los datos enviados son inválidos"})
		return
	}
	if payload.VisibleCount < 1 || payload.VisibleCount > 24 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "La cantidad de destacados visibles debe estar entre 1 y 24"})
		return
	}

	if err := db.SetFeaturedVisibleCount(r.Context(), payload.VisibleCount); err != nil {
		fmt.Printf("err: %v\n", err)
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "No se pudo actualizar la configuración"})
		return
	}

	respondWithJSON(w, http.StatusOK, rmap{"success": true, "visibleCount": payload.VisibleCount})
}

// AdminUploadFeaturedImage stores an image for an external featured card and
// returns its bare filename (served from /static/uploads/).
func AdminUploadFeaturedImage(w http.ResponseWriter, r *http.Request) {
	maxSize := int64(uploads.MaxImageUploadSize)
	r.Body = http.MaxBytesReader(w, r.Body, maxSize+1<<20)
	if err := r.ParseMultipartForm(maxSize); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "El archivo excede el tamaño permitido o es inválido"})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	files := r.MultipartForm.File["file"]
	if len(files) != 1 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "Debes proporcionar exactamente un archivo"})
		return
	}
	fileHeader := files[0]

	if _, ok, msg := validateMediaContentType(fileHeader, false); !ok {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: msg})
		return
	}
	if fileHeader.Size > maxSize {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "La imagen excede 8MB"})
		return
	}

	filename, err := uploads.Upload(&uploads.FileData{
		Filename: fmt.Sprintf("destacado-%s", uuid.NewString()),
		File:     fileHeader,
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error al guardar el archivo"})
		log.Printf("Error uploading file: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, rmap{"success": true, "filename": filename})
}
