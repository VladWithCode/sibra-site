package routes

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/media"
)

// maxGalleryUploadFiles bounds files per gallery upload request.
const maxGalleryUploadFiles = 16

func RegisterPropertyMediaRoutes(router *customServeMux) {
	router.HandleFunc("GET /api/property/{id}/media", auth.ValidateAuthMiddleware(GetPropertyMedia))
	router.HandleFunc("POST /api/property/{id}/media", auth.WithAuthAccessLevelMiddleware(UploadPropertyMedia, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/property/{id}/media/order", auth.WithAuthAccessLevelMiddleware(ReorderPropertyMedia, auth.AccessLevelEditor))
	router.HandleFunc("PATCH /api/property/{id}/media/{mediaId}", auth.WithAuthAccessLevelMiddleware(UpdatePropertyMediaItem, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/property/{id}/media/{mediaId}", auth.WithAuthAccessLevelMiddleware(DeletePropertyMediaItem, auth.AccessLevelEditor))
	router.HandleFunc("POST /api/property/{id}/main-image", auth.WithAuthAccessLevelMiddleware(UploadPropertyMainImage, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/property/{id}/main-image", auth.WithAuthAccessLevelMiddleware(DeletePropertyMainImage, auth.AccessLevelEditor))
}

// propertyIDParam returns the {id} path value when it is a UUID; otherwise it
// answers 404 and returns false.
func propertyIDParam(w http.ResponseWriter, r *http.Request) (string, bool) {
	id := r.PathValue("id")
	if uuid.Validate(id) != nil {
		respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la propiedad"})
		return "", false
	}
	return id, true
}

func respondMediaError(w http.ResponseWriter, err error, action string) {
	switch {
	case errors.Is(err, db.ErrMediaNotFound):
		respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró el elemento"})
	case errors.Is(err, db.ErrMediaCoverKind):
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "Solo un video puede ser la portada"})
	case errors.Is(err, db.ErrMediaOrderSet):
		respondWithError(w, http.StatusConflict, ErrorParams{ErrorMessage: "La galería cambió; recarga e intenta de nuevo"})
	default:
		log.Printf("%s: %v\n", action, err)
		respondWithError(w, http.StatusInternalServerError, ErrorParams{ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde."})
	}
}

// GetPropertyMedia returns the main image and gallery including items still
// encoding or failed (panel view, polled while encoding).
func GetPropertyMedia(w http.ResponseWriter, r *http.Request) {
	id, ok := propertyIDParam(w, r)
	if !ok {
		return
	}
	state, err := db.GetPropertyMediaState(r.Context(), id)
	if err != nil {
		respondMediaError(w, err, "GetPropertyMediaState")
		return
	}
	respondWithJSON(w, http.StatusOK, state)
}

// UploadPropertyMedia appends images and videos to the gallery. Files are
// validated synchronously and encoded in the background.
func UploadPropertyMedia(w http.ResponseWriter, r *http.Request) {
	id, ok := propertyIDParam(w, r)
	if !ok {
		return
	}
	uploads, uerr := receiveMediaUploads(w, r, uploadRules{field: "files", maxFiles: maxGalleryUploadFiles, allowVideo: true})
	if uerr != nil {
		respondWithError(w, uerr.status, ErrorParams{ErrorMessage: uerr.message})
		return
	}

	news := make([]db.NewMediaUpload, len(uploads))
	for i, u := range uploads {
		news[i] = db.NewMediaUpload{AssetID: u.AssetID, Kind: u.Kind}
	}
	items, err := db.AddPropertyMedia(r.Context(), id, news)
	if err != nil {
		discardUploads(uploads)
		respondMediaError(w, err, "AddPropertyMedia")
		return
	}
	for _, u := range uploads {
		media.Notify(u.Kind)
	}
	respondWithJSON(w, http.StatusAccepted, map[string]any{"success": true, "media": items})
}

// UploadPropertyMainImage replaces the property's main image.
func UploadPropertyMainImage(w http.ResponseWriter, r *http.Request) {
	id, ok := propertyIDParam(w, r)
	if !ok {
		return
	}
	uploads, uerr := receiveMediaUploads(w, r, uploadRules{field: "file", maxFiles: 1})
	if uerr != nil {
		respondWithError(w, uerr.status, ErrorParams{ErrorMessage: uerr.message})
		return
	}
	prev, err := db.SetPropertyMainImage(r.Context(), id, uploads[0].AssetID)
	if err != nil {
		discardUploads(uploads)
		respondMediaError(w, err, "SetPropertyMainImage")
		return
	}
	removeAssetFilesLogged(prev)
	media.Notify(media.KindImage)
	respondWithJSON(w, http.StatusAccepted, map[string]any{"success": true, "assetId": uploads[0].AssetID})
}

func DeletePropertyMainImage(w http.ResponseWriter, r *http.Request) {
	id, ok := propertyIDParam(w, r)
	if !ok {
		return
	}
	prev, err := db.ClearPropertyMainImage(r.Context(), id)
	if err != nil {
		respondMediaError(w, err, "ClearPropertyMainImage")
		return
	}
	removeAssetFilesLogged(prev)
	respondWithJSON(w, http.StatusOK, map[string]any{"success": true})
}

func ReorderPropertyMedia(w http.ResponseWriter, r *http.Request) {
	id, ok := propertyIDParam(w, r)
	if !ok {
		return
	}
	var body struct {
		IDs []string `json:"ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "El formulario contiene información inválida"})
		return
	}
	if err := db.ReorderPropertyMedia(r.Context(), id, body.IDs); err != nil {
		respondMediaError(w, err, "ReorderPropertyMedia")
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]any{"success": true})
}

func UpdatePropertyMediaItem(w http.ResponseWriter, r *http.Request) {
	id, ok := propertyIDParam(w, r)
	if !ok {
		return
	}
	mediaID := r.PathValue("mediaId")
	if uuid.Validate(mediaID) != nil {
		respondMediaError(w, db.ErrMediaNotFound, "")
		return
	}
	var body struct {
		IsCover *bool `json:"isCover"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.IsCover == nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "El formulario contiene información inválida"})
		return
	}
	if err := db.SetPropertyCover(r.Context(), id, mediaID, *body.IsCover); err != nil {
		respondMediaError(w, err, "SetPropertyCover")
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]any{"success": true})
}

func DeletePropertyMediaItem(w http.ResponseWriter, r *http.Request) {
	id, ok := propertyIDParam(w, r)
	if !ok {
		return
	}
	mediaID := r.PathValue("mediaId")
	if uuid.Validate(mediaID) != nil {
		respondMediaError(w, db.ErrMediaNotFound, "")
		return
	}
	assetID, err := db.DeletePropertyMedia(r.Context(), id, mediaID)
	if err != nil {
		respondMediaError(w, err, "DeletePropertyMedia")
		return
	}
	removeAssetFilesLogged(assetID)
	respondWithJSON(w, http.StatusOK, map[string]any{"success": true})
}
