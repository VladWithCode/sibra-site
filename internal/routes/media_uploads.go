package routes

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"time"

	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/media"
)

// maxMediaRequestSize bounds a whole media upload request: one maximum-size
// video plus multipart overhead (nginx allows 510m on these routes).
const maxMediaRequestSize = media.MaxVideoUploadSize + 10<<20

// receivedUpload is an original stored under media.IncomingFile(AssetID)
// and validated with ffprobe.
type receivedUpload struct {
	AssetID string
	Kind    string
}

type uploadRules struct {
	field      string // multipart file field name
	maxFiles   int
	allowVideo bool
}

// uploadError carries the HTTP status and Spanish message for the client.
type uploadError struct {
	status  int
	message string
}

// receiveMediaUploads streams the file parts of a multipart request straight
// to private storage (no ParseMultipartForm buffering), validating each file.
// On error every file stored by this call is removed.
func receiveMediaUploads(w http.ResponseWriter, r *http.Request, rules uploadRules) (uploads []receivedUpload, uerr *uploadError) {
	if r.ContentLength > maxMediaRequestSize {
		return nil, &uploadError{http.StatusRequestEntityTooLarge, "El archivo excede el tamaño máximo permitido (500MB)"}
	}
	if !media.HasFreeSpace(media.IncomingPath, max(r.ContentLength, 0)) {
		log.Println("media: upload rejected, low disk space")
		return nil, &uploadError{http.StatusInsufficientStorage, "El servidor no tiene espacio suficiente en este momento; intenta más tarde"}
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxMediaRequestSize)
	mr, err := r.MultipartReader()
	if err != nil {
		return nil, &uploadError{http.StatusBadRequest, "El formulario no pudo ser procesado"}
	}

	defer func() {
		if uerr != nil {
			for _, u := range uploads {
				_ = os.Remove(media.IncomingFile(u.AssetID))
			}
			uploads = nil
		}
	}()

	for {
		part, err := mr.NextPart()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			var tooBig *http.MaxBytesError
			if errors.As(err, &tooBig) {
				return uploads, &uploadError{http.StatusRequestEntityTooLarge, "El archivo excede el tamaño máximo permitido (500MB)"}
			}
			return uploads, &uploadError{http.StatusBadRequest, "La subida se interrumpió; intenta de nuevo"}
		}
		if part.FormName() != rules.field || part.FileName() == "" {
			part.Close()
			continue
		}
		if len(uploads) >= rules.maxFiles {
			part.Close()
			return uploads, &uploadError{http.StatusBadRequest, fmt.Sprintf("Puedes subir máximo %d archivos a la vez", rules.maxFiles)}
		}

		u, uerr := storeUpload(r.Context(), part, rules)
		part.Close()
		if u != nil {
			uploads = append(uploads, *u)
		}
		if uerr != nil {
			return uploads, uerr
		}
	}

	if len(uploads) == 0 {
		return nil, &uploadError{http.StatusBadRequest, "No se recibió ningún archivo"}
	}
	return uploads, nil
}

// storeUpload writes one part to private storage and validates it. A
// non-nil upload is returned whenever a file was written, so the caller can
// clean it up on error.
func storeUpload(ctx context.Context, part *multipart.Part, rules uploadRules) (*receivedUpload, *uploadError) {
	u := &receivedUpload{AssetID: db.NewMediaID()}
	path := media.IncomingFile(u.AssetID)
	f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		log.Printf("media: create %s: %v\n", path, err)
		return nil, &uploadError{http.StatusInternalServerError, "Error al guardar el archivo"}
	}
	n, err := io.Copy(f, io.LimitReader(part, media.MaxVideoUploadSize+1))
	if cerr := f.Close(); err == nil {
		err = cerr
	}
	if err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			return u, &uploadError{http.StatusRequestEntityTooLarge, "El archivo excede el tamaño máximo permitido (500MB)"}
		}
		log.Printf("media: write %s: %v\n", path, err)
		return u, &uploadError{http.StatusBadRequest, "La subida se interrumpió; intenta de nuevo"}
	}
	if n > media.MaxVideoUploadSize {
		return u, &uploadError{http.StatusRequestEntityTooLarge, "El archivo excede el tamaño máximo permitido (500MB)"}
	}

	probeCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	p, err := media.ProbeFile(probeCtx, path)
	if err != nil {
		if msg, ok := media.IsValidation(err); ok {
			return u, &uploadError{http.StatusBadRequest, fmt.Sprintf("%s: %s", part.FileName(), msg)}
		}
		log.Printf("media: probe %s: %v\n", path, err)
		return u, &uploadError{http.StatusInternalServerError, "No se pudo analizar el archivo"}
	}
	u.Kind = p.Kind
	if p.Kind == media.KindVideo && !rules.allowVideo {
		return u, &uploadError{http.StatusBadRequest, fmt.Sprintf("%s: solo se permiten imágenes", part.FileName())}
	}
	if p.Kind == media.KindImage && n > media.MaxImageUploadSize {
		return u, &uploadError{http.StatusRequestEntityTooLarge, fmt.Sprintf("%s: la imagen excede 25MB", part.FileName())}
	}
	return u, nil
}

// discardUploads removes stored originals that were not persisted.
func discardUploads(uploads []receivedUpload) {
	for _, u := range uploads {
		_ = os.Remove(media.IncomingFile(u.AssetID))
	}
}

// removeAssetFilesLogged deletes an asset's files after its row was deleted.
func removeAssetFilesLogged(assetID string) {
	if assetID == "" {
		return
	}
	if err := media.RemoveAssetFiles(assetID); err != nil {
		log.Printf("media: remove files of %s: %v\n", assetID, err)
	}
}
