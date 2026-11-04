package routes

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/media"
	"github.com/vladwithcode/sibra-site/internal/uploads"
)

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

	// Page-independent image upload for repeating JSON content (e.g. card images),
	// usable during creation when no page id exists yet.
	router.HandleFunc("POST /api/terrenos/medios/imagen", auth.WithAuthAccessLevelMiddleware(UploadSellingPageImage, auth.AccessLevelEditor))

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

// UploadSellingPageMedia stores one whitelisted media file. The hero goes
// through the media pipeline (image or video, encoded in the background and
// promoted once ready); other fields store the image as uploaded and save the
// bare filename to their column. MIME is sniffed (not trusted from the
// client) and the stored filename never derives from the client filename.
func UploadSellingPageMedia(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := r.PathValue("id")
	field := r.PathValue("field")

	if !db.IsSellingPageMediaField(field) {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "Campo de medios no permitido"})
		return
	}
	if db.IsSellingPageHeroField(field) {
		uploadSellingPageHero(w, r, id)
		return
	}

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

	if ok, msg := validateImageContentType(fileHeader); !ok {
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

// uploadSellingPageHero stores a hero image or video as a pending asset. The
// current hero keeps showing until the new one finishes encoding.
func uploadSellingPageHero(w http.ResponseWriter, r *http.Request, pageID string) {
	if uuid.Validate(pageID) != nil {
		respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la página"})
		return
	}
	received, uerr := receiveMediaUploads(w, r, uploadRules{field: "file", maxFiles: 1, allowVideo: true})
	if uerr != nil {
		respondWithError(w, uerr.status, ErrorParams{ErrorMessage: uerr.message})
		return
	}
	u := received[0]
	superseded, err := db.SetSellingPageHeroPending(r.Context(), pageID, u.AssetID, u.Kind)
	if err != nil {
		discardUploads(received)
		if errors.Is(err, db.ErrMediaNotFound) {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la página"})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error al actualizar la página"})
		log.Printf("Error setting pending hero: %v\n", err)
		return
	}
	removeAssetFilesLogged(superseded)
	media.Notify(u.Kind)
	respondWithJSON(w, http.StatusAccepted, map[string]any{"success": true, "field": "hero_media", "assetId": u.AssetID, "mediaType": u.Kind})
}

// RemoveSellingPageMedia clears a whitelisted media column. For the hero it
// deletes the current and pending assets and the legacy file.
func RemoveSellingPageMedia(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := r.PathValue("id")
	field := r.PathValue("field")

	if !db.IsSellingPageMediaField(field) {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "Campo de medios no permitido"})
		return
	}

	if db.IsSellingPageHeroField(field) {
		if uuid.Validate(id) != nil {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la página"})
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
		removed, err := db.ClearSellingPageHero(ctx, id)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error al actualizar la página"})
			log.Printf("Error clearing hero media: %v\n", err)
			return
		}
		for _, a := range removed {
			removeAssetFilesLogged(a)
		}
		if page.HeroMedia != "" {
			_ = uploads.Delete(page.HeroMedia)
		}
	} else {
		if err := db.UpdateSellingPageMediaField(ctx, id, field, ""); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la página"})
				return
			}
			respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error al actualizar la página"})
			log.Printf("Error clearing media field: %v\n", err)
			return
		}
	}
	respondWithJSON(w, http.StatusOK, map[string]any{"success": true, "field": field})
}

// UploadSellingPageImage stores a single image and returns its bare filename
// without binding it to any page column. Used for repeating JSON content (e.g.
// card images) whose paths live inside the page's own JSON, including during
// page creation when no page id exists yet. MIME is sniffed (not trusted from
// the client); the stored filename is random so it can't be used for traversal.
func UploadSellingPageImage(w http.ResponseWriter, r *http.Request) {
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

	if ok, msg := validateImageContentType(fileHeader); !ok {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: msg})
		return
	}
	if fileHeader.Size > maxSize {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "La imagen excede 8MB"})
		return
	}

	filename, err := uploads.Upload(&uploads.FileData{
		Filename: fmt.Sprintf("tarjeta-%s", uuid.NewString()),
		File:     fileHeader,
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error al guardar el archivo"})
		log.Printf("Error uploading file: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{"success": true, "filename": filename})
}

// validateImageContentType sniffs the file's first bytes and reports whether
// it is an image.
func validateImageContentType(fh *multipart.FileHeader) (bool, string) {
	f, err := fh.Open()
	if err != nil {
		return false, "No se pudo leer el archivo"
	}
	defer f.Close()

	buf := make([]byte, 512)
	n, _ := io.ReadFull(f, buf)
	if strings.HasPrefix(http.DetectContentType(buf[:n]), "image/") {
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
