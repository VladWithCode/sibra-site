package routes

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/uploads"
)

const maxSellingPageVideoSize = 50 << 20 // 50MB

// RegisterSellingPageRoutes wires the Selling Pages (terrenos) API.
//
// Public: GET /api/terrenos/public/{slug} (published only).
// Admin (editor+): list/read/create/update/publish + media upload/delete.
// Delete: admin only.
func RegisterSellingPageRoutes(router *customServeMux) {
	router.HandleFunc("GET /api/terrenos/public/{slug}", GetPublicSellingPage)

	router.HandleFunc("GET /api/terrenos", auth.WithAuthAccessLevelMiddleware(ListSellingPagesHandler, auth.AccessLevelEditor))
	router.HandleFunc("GET /api/terrenos/{id}", auth.WithAuthAccessLevelMiddleware(GetSellingPageHandler, auth.AccessLevelEditor))
	router.HandleFunc("POST /api/terrenos", auth.WithAuthAccessLevelMiddleware(CreateSellingPageHandler, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/terrenos/{id}", auth.WithAuthAccessLevelMiddleware(UpdateSellingPageHandler, auth.AccessLevelEditor))
	router.HandleFunc("PATCH /api/terrenos/{id}/published", auth.WithAuthAccessLevelMiddleware(SetSellingPagePublishedHandler, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/terrenos/{id}", auth.WithAuthAccessLevelMiddleware(DeleteSellingPageHandler, auth.AccessLevelAdmin))

	router.HandleFunc("PUT /api/terrenos/{id}/medios/{field}", auth.WithAuthAccessLevelMiddleware(UploadSellingPageMedia, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/terrenos/{id}/medios/{field}", auth.WithAuthAccessLevelMiddleware(RemoveSellingPageMedia, auth.AccessLevelEditor))
}

func GetPublicSellingPage(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	page, err := db.GetSellingPageBySlug(r.Context(), slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la página"})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error inesperado."})
		log.Printf("Error getting selling page by slug: %v\n", err)
		return
	}
	// Anonymous public endpoint only exposes published pages.
	if !page.Published {
		respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la página"})
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]any{"page": page})
}

func ListSellingPagesHandler(w http.ResponseWriter, r *http.Request) {
	pages, err := db.ListSellingPages(r.Context())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error al obtener las páginas"})
		log.Printf("Error listing selling pages: %v\n", err)
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]any{"pages": pages})
}

func GetSellingPageHandler(w http.ResponseWriter, r *http.Request) {
	page, err := db.GetSellingPageByID(r.Context(), r.PathValue("id"))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la página"})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error inesperado."})
		log.Printf("Error getting selling page: %v\n", err)
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]any{"page": page})
}

func CreateSellingPageHandler(w http.ResponseWriter, r *http.Request) {
	var page db.SellingPage
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&page); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "La información proporcionada es inválida"})
		log.Printf("Error decoding selling page: %v\n", err)
		return
	}

	if err := db.CreateSellingPage(r.Context(), &page); err != nil {
		if msg, ok := sellingPageValidationMessage(err); ok {
			respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: msg})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error al crear la página"})
		log.Printf("Error creating selling page: %v\n", err)
		return
	}
	respondWithJSON(w, http.StatusCreated, map[string]any{"success": true, "page": page})
}

func UpdateSellingPageHandler(w http.ResponseWriter, r *http.Request) {
	var page db.SellingPage
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&page); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "La información proporcionada es inválida"})
		log.Printf("Error decoding selling page: %v\n", err)
		return
	}
	page.ID = r.PathValue("id")

	if err := db.UpdateSellingPage(r.Context(), &page); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la página"})
			return
		}
		if msg, ok := sellingPageValidationMessage(err); ok {
			respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: msg})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error al actualizar la página"})
		log.Printf("Error updating selling page: %v\n", err)
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]any{"success": true, "page": page})
}

func SetSellingPagePublishedHandler(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Published bool `json:"published"`
	}
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "La información proporcionada es inválida"})
		return
	}

	if err := db.SetSellingPagePublished(r.Context(), r.PathValue("id"), body.Published); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la página"})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error al actualizar la página"})
		log.Printf("Error setting published: %v\n", err)
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]any{"success": true})
}

func DeleteSellingPageHandler(w http.ResponseWriter, r *http.Request) {
	if err := db.DeleteSellingPage(r.Context(), r.PathValue("id")); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la página"})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error al eliminar la página"})
		log.Printf("Error deleting selling page: %v\n", err)
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]any{"success": true})
}

// UploadSellingPageMedia stores one whitelisted media file and saves the bare
// filename to its column. MIME is sniffed (not trusted from the client). The
// stored filename is deterministic from page slug + field; the client filename
// is never used for the path, so traversal via filename is impossible.
func UploadSellingPageMedia(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := r.PathValue("id")
	field := r.PathValue("field")

	if !db.IsSellingPageMediaField(field) {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "Campo de medios no permitido"})
		return
	}
	isVideo := db.IsSellingPageVideoField(field)

	maxSize := int64(uploads.MaxImageUploadSize)
	if isVideo {
		maxSize = maxSellingPageVideoSize
	}
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

	if ok, msg := validateMediaContentType(fileHeader, isVideo); !ok {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: msg})
		return
	}

	page, err := db.GetSellingPageByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la página"})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error inesperado."})
		log.Printf("Error finding selling page: %v\n", err)
		return
	}

	filename, err := uploads.Upload(&uploads.FileData{
		Filename: fmt.Sprintf("%s-%s", page.Slug, field),
		File:     fileHeader,
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error al guardar el archivo"})
		log.Printf("Error uploading file: %v\n", err)
		return
	}

	if err := db.UpdateSellingPageMediaField(ctx, id, field, filename); err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error al actualizar la página"})
		log.Printf("Error updating media field: %v\n", err)
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]any{"success": true, "field": field, "filename": filename})
}

// RemoveSellingPageMedia clears a whitelisted media column (best-effort file
// delete). The stored value, not raw input, drives the file removal.
func RemoveSellingPageMedia(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := r.PathValue("id")
	field := r.PathValue("field")

	if !db.IsSellingPageMediaField(field) {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "Campo de medios no permitido"})
		return
	}

	if err := db.UpdateSellingPageMediaField(ctx, id, field, ""); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la página"})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error al actualizar la página"})
		log.Printf("Error clearing media field: %v\n", err)
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]any{"success": true, "field": field})
}

// validateMediaContentType sniffs the file's first bytes to confirm its real
// type, independent of the client-declared content type / filename.
func validateMediaContentType(fh *multipart.FileHeader, isVideo bool) (bool, string) {
	f, err := fh.Open()
	if err != nil {
		return false, "No se pudo leer el archivo"
	}
	defer f.Close()

	buf := make([]byte, 512)
	n, _ := io.ReadFull(f, buf)
	ct := http.DetectContentType(buf[:n])

	if isVideo {
		if ct == "video/mp4" || ct == "video/webm" {
			return true, ""
		}
		return false, "El video debe ser mp4 o webm"
	}
	if len(ct) >= 6 && ct[:6] == "image/" {
		return true, ""
	}
	return false, "El archivo debe ser una imagen"
}

func sellingPageValidationMessage(err error) (string, bool) {
	switch {
	case errors.Is(err, db.ErrSellingPageSlugRequired):
		return "El slug es obligatorio", true
	case errors.Is(err, db.ErrSellingPageNameRequired):
		return "El nombre es obligatorio", true
	case errors.Is(err, db.ErrSellingPageInvalidVariant):
		return "La variante debe ser 'left', 'center' o 'right'", true
	default:
		return "", false
	}
}
