package routes

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/uploads"
)

func RegisterProjectRoutes(router *customServeMux) {
	// Associate CRUD — editor-gated (data mutation on shared associate records).
	router.HandleFunc("POST /api/socios", auth.WithAuthAccessLevelMiddleware(CreateAssociate, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/socios/{id}", auth.WithAuthAccessLevelMiddleware(UpdateAssociate, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/socios/{id}", auth.WithAuthAccessLevelMiddleware(DeleteAssociate, auth.AccessLevelEditor))

	// Project reads — public for the marketing site.
	router.HandleFunc("GET /api/proyectos", auth.PopulateAuthMiddleware(GetProjects))
	router.HandleFunc("GET /api/proyectos/{id}", GetProject)
	// Project mutations — editor-gated. DeleteProject is admin-only (destructive,
	// matches blog hard-delete convention).
	router.HandleFunc("POST /api/proyectos", auth.WithAuthAccessLevelMiddleware(CreateProject, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/proyectos/{id}", auth.WithAuthAccessLevelMiddleware(UpdateProject, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/proyectos/{id}", auth.WithAuthAccessLevelMiddleware(DeleteProject, auth.AccessLevelAdmin))

	// Project media — all editor-gated.
	router.HandleFunc("PUT /api/proyectos/{id}/medios/principal", auth.WithAuthAccessLevelMiddleware(UploadProjectMainImg, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/proyectos/{id}/medios/principal", auth.WithAuthAccessLevelMiddleware(RemoveProjectMainImg, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/proyectos/{id}/medios/galeria", auth.WithAuthAccessLevelMiddleware(UploadProjectGallery, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/proyectos/{id}/medios/galeria/{imgID}", auth.WithAuthAccessLevelMiddleware(RemoveFromProjectGallery, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/proyectos/{id}/medios/amenidades", auth.WithAuthAccessLevelMiddleware(UploadProjectAmenity, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/proyectos/{id}/medios/amenidades/{amenityID}", auth.WithAuthAccessLevelMiddleware(UpdateProjectAmenity, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/proyectos/{id}/medios/amenidades/{amenityID}", auth.WithAuthAccessLevelMiddleware(DeleteProjectAmenity, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/proyectos/{id}/medios/disponibilidad", auth.WithAuthAccessLevelMiddleware(UploadProjectAvailability, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/proyectos/{id}/medios/disponibilidad", auth.WithAuthAccessLevelMiddleware(RemoveProjectAvailability, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/proyectos/{id}/medios/cita", auth.WithAuthAccessLevelMiddleware(UploadProjectQuoteImg, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/proyectos/{id}/medios/cita", auth.WithAuthAccessLevelMiddleware(RemoveProjectQuoteImg, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/proyectos/{id}/medios/secciones/{sectionIdx}", auth.WithAuthAccessLevelMiddleware(UploadProjectSectionImage, auth.AccessLevelEditor))

	router.HandleFunc("GET /api/socios", auth.WithAuthAccessLevelMiddleware(GetAssociates, auth.AccessLevelEditor))

	router.HandleFunc("GET /api/proyectos/{id}/socios", auth.ValidateAuthMiddleware(GetProjectAssociates))
	router.HandleFunc("GET /api/proyectos/{id}/socios/{associateID}", auth.ValidateAuthMiddleware(GetProjectAssociate))
	// Project-associate junction mutations — editor-gated.
	router.HandleFunc("POST /api/proyectos/{id}/socios/{associateID}", auth.WithAuthAccessLevelMiddleware(AddProjectAssociate, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/proyectos/{id}/socios/{associateID}", auth.WithAuthAccessLevelMiddleware(UpdateProjectAssociate, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/proyectos/{id}/socios/{associateID}", auth.WithAuthAccessLevelMiddleware(RemoveProjectAssociate, auth.AccessLevelEditor))

	// Doc reads keep existing scoping. Doc mutations — editor-gated.
	router.HandleFunc("GET /api/proyectos/{id}/documentos", auth.ValidateProjectAccessMiddleware(GetProjectDocs))
	router.HandleFunc("GET /api/proyectos/{id}/documentos/admin", auth.ValidateAuthMiddleware(GetProjectDocs))
	router.HandleFunc("POST /api/proyectos/{id}/documentos", auth.WithAuthAccessLevelMiddleware(CreateProjectDoc, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/proyectos/{id}/documentos/{docID}", auth.WithAuthAccessLevelMiddleware(RemoveProjectDoc, auth.AccessLevelEditor))

	// Project-access login endpoints — must remain public (client/associate self-login).
	router.HandleFunc("GET /api/proyectos/{id}/acceso", CheckProjectAccess)
	router.HandleFunc("POST /api/proyectos/{id}/acceso", ValidateProjectAccess)

	// Appeal items: reads public, mutations editor-gated.
	router.HandleFunc("GET /api/atractivos", GetAppealItems)
	router.HandleFunc("GET /api/atractivos/{id}", GetAppealItem)
	router.HandleFunc("POST /api/atractivos", auth.WithAuthAccessLevelMiddleware(CreateAppealItem, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/atractivos/{id}", auth.WithAuthAccessLevelMiddleware(UpdateAppealItem, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/atractivos/{id}", auth.WithAuthAccessLevelMiddleware(DeleteAppealItem, auth.AccessLevelEditor))
}

// respondProjectMultipartErr returns true if the error from ParseMultipartForm
// was a body-too-large error and has already been answered with 413. Caller
// must return immediately when true.
func respondProjectMultipartErr(w http.ResponseWriter, err error) bool {
	var mbe *http.MaxBytesError
	if errors.As(err, &mbe) {
		respondWithError(w, http.StatusRequestEntityTooLarge, ErrorParams{
			ErrorMessage: "El archivo es demasiado grande.",
		})
		return true
	}
	return false
}

func CheckProjectAccess(w http.ResponseWriter, r *http.Request) {
	tkStr, err := r.Cookie("project_auth")
	if err != nil {
		respondWithJSON(w, http.StatusUnauthorized, map[string]any{
			"authorized": false,
		})
		log.Printf("Error getting project auth token: %v\n", err)
		return
	}
	tk, err := auth.ParseToken(tkStr.Value)
	if err != nil || !tk.Valid {
		respondWithJSON(w, http.StatusUnauthorized, map[string]any{
			"authorized": false,
		})
		log.Printf("Error parsing project auth token: %v\n", err)
		return
	}

	ctx := r.Context()
	projectID := r.PathValue("id")
	accessData, err := auth.ExtractProjectAccessDataFromToken(tk)
	if err != nil {
		respondWithJSON(w, http.StatusUnauthorized, map[string]any{
			"authorized": false,
		})
		log.Printf("Error extracting project access data from token: %v\n", err)
		return
	}

	if accessData.ProjectID != projectID {
		respondWithJSON(w, http.StatusUnauthorized, map[string]any{
			"authorized": false,
		})
		return
	}

	assoc, err := db.FindAssociateWithData(ctx, projectID, accessData.IDCode, accessData.LotNum, accessData.AppleNum)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithJSON(w, http.StatusUnauthorized, map[string]any{
				"authorized": false,
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al buscar el registro del socio",
			Etc: map[string]any{
				"authorized": false,
			},
		})
		log.Printf("Failed to find associate: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"authorized": true,
		"associate":  assoc,
	})
}

func ValidateProjectAccess(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")

	var accessData struct {
		IDcode   string `json:"idcode"`
		LotNum   string `json:"lotNum"`
		AppleNum string `json:"appleNum"`
	}
	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()

	err := decoder.Decode(&accessData)

	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Intenta de nuevo más tarde",
		})
		return
	}

	if accessData.IDcode == "" {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Debes proporcionar un RFC o CURP",
		})
		return
	}

	assoc, err := db.FindAssociateWithData(ctx, projectID, accessData.IDcode, accessData.LotNum, accessData.AppleNum)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, http.StatusUnauthorized, ErrorParams{
				ErrorMessage: "No se encontró el registro del socio",
				Etc: map[string]any{
					"authorized": false,
				},
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al buscar el registro del socio",
		})
		log.Printf("Failed to find associate: %v\n", err)
		return
	}

	expTime := time.Now().Add(24 * time.Hour)
	tkStr, err := auth.CreateProjectToken(&auth.ProjectAccessTokenData{
		ProjectID:   projectID,
		AssociateID: assoc.ID,
		IDCode:      accessData.IDcode,
		LotNum:      accessData.LotNum,
		AppleNum:    accessData.AppleNum,
		ExpiresAt:   jwt.NewNumericDate(expTime),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "project_auth",
		Value:    tkStr,
		Expires:  expTime,
		HttpOnly: true,
		// Secure: true,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
	})

	respondWithJSON(w, http.StatusOK, map[string]any{
		"authorized": true,
		"associate":  assoc,
	})
}

func GetProjects(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projects, err := db.FindProjects(ctx)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al buscar los proyectos",
		})
		log.Printf("Failed to find projects: %v\n", err)
		return
	}

	authData, err := auth.ExtractAuthDataFromCtx(ctx)
	if err != nil || !authData.HasAccess(auth.AccessLevelEditor) {
		for _, project := range projects {
			project.Associates = nil
			project.Docs = nil
		}
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success":  true,
		"projects": projects,
	})
}

func GetProject(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")

	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al buscar el proyecto",
		})
		log.Printf("Failed to find project: %v\n", err)
		return
	}

	project.Associates = nil
	project.Docs = nil

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"project": project,
	})
}

func GetProjectDocs(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")

	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al buscar los documentos del proyecto",
		})
		log.Printf("Failed to find project docs: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"docs":    project.Docs,
	})
}

func CreateProject(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	project := db.Project{}
	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()

	err := decoder.Decode(&project)

	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing project: %v\n", err)
		return
	}

	err = db.CreateProject(ctx, &project)
	if err != nil {
		if errors.Is(err, db.ErrProjectSectionEmpty) {
			respondWithError(w, http.StatusBadRequest, ErrorParams{
				ErrorMessage: "Cada sección debe tener texto o imagen",
			})
			return
		}
		if errors.Is(err, db.ErrProjectSectionInvalidSide) {
			respondWithError(w, http.StatusBadRequest, ErrorParams{
				ErrorMessage: "El lado de la imagen debe ser 'left' o 'right'",
			})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al crear el proyecto",
		})
		log.Printf("Failed to create project: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"project": project,
	})
}

func UpdateProject(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")
	project := db.Project{}
	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()

	err := decoder.Decode(&project)

	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing project: %v\n", err)
		return
	}

	project.ID = projectID

	// Snapshot existing section images so we can clean up orphans after a
	// successful update. A failure to load this is non-fatal — we just skip
	// cleanup rather than block the update.
	var oldSectionImages []string
	if existing, loadErr := db.FindProjectByID(ctx, projectID); loadErr == nil && existing != nil {
		for _, s := range existing.Sections {
			if s.Image != "" {
				oldSectionImages = append(oldSectionImages, s.Image)
			}
		}
	} else if loadErr != nil {
		log.Printf("Warning: could not load existing project for section cleanup: %v\n", loadErr)
	}

	err = db.UpdateProject(ctx, &project)
	if err != nil {
		if errors.Is(err, db.ErrProjectSectionEmpty) {
			respondWithError(w, http.StatusBadRequest, ErrorParams{
				ErrorMessage: "Cada sección debe tener texto o imagen",
			})
			return
		}
		if errors.Is(err, db.ErrProjectSectionInvalidSide) {
			respondWithError(w, http.StatusBadRequest, ErrorParams{
				ErrorMessage: "El lado de la imagen debe ser 'left' o 'right'",
			})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Failed to update project: %v\n", err)
		return
	}

	// Cleanup orphan section images: any filename that was attached to an old
	// section but is not referenced by the new sections (and not referenced
	// elsewhere on the project) should be deleted from disk.
	if len(oldSectionImages) > 0 {
		newRefs := map[string]struct{}{}
		for _, s := range project.Sections {
			if s.Image != "" {
				newRefs[s.Image] = struct{}{}
			}
		}
		// Avoid removing files still used by main image, availability image, or gallery.
		if project.MainImg != "" {
			newRefs[project.MainImg] = struct{}{}
		}
		if project.AvailabilityImg != "" {
			newRefs[project.AvailabilityImg] = struct{}{}
		}
		for _, g := range project.Gallery {
			if g != "" {
				newRefs[g] = struct{}{}
			}
		}

		var orphans []string
		seen := map[string]struct{}{}
		for _, img := range oldSectionImages {
			if _, dup := seen[img]; dup {
				continue
			}
			seen[img] = struct{}{}
			if _, kept := newRefs[img]; !kept {
				orphans = append(orphans, img)
			}
		}

		if len(orphans) > 0 {
			go func(files []string) {
				for _, f := range files {
					if delErr := uploads.Delete(f); delErr != nil && !os.IsNotExist(delErr) {
						log.Printf("Warning: failed to delete orphan section image %q: %v\n", f, delErr)
					}
				}
			}(orphans)
		}
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"project": project,
	})
}

func DeleteProject(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")

	err := db.DeleteProject(ctx, projectID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al eliminar el proyecto",
		})
		log.Printf("Failed to delete project: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}

func CreateProjectDoc(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")
	r.Body = http.MaxBytesReader(w, r.Body, uploads.MaxImageUploadSize+1<<20)
	err := r.ParseMultipartForm(uploads.MaxImageUploadSize)
	if err != nil {
		if respondProjectMultipartErr(w, err) {
			return
		}
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	files := r.MultipartForm.File["file"]
	if len(files) == 0 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Debes proporcionar un archivo.",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	} else if len(files) > 1 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Solo puedes subir un archivo a la vez.",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	file := files[0]
	filename, err := uploads.Upload(&uploads.FileData{
		Filename: fmt.Sprintf("%s-%s", project.Slug, r.FormValue("filename")),
		File:     file,
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error uploading file: %v\n", err)
		return
	}
	doc := db.ProjectDoc{
		ID:          uuid.Must(uuid.NewV7()).String(),
		Name:        filename,
		Description: r.FormValue("description"),
	}
	project.Docs = append(project.Docs, doc)

	err = db.UpdateProject(ctx, project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Error updating project: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"project": project,
	})
}

func UpdateProjectDoc(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	r.Body = http.MaxBytesReader(w, r.Body, uploads.MaxImageUploadSize+1<<20)
	err := r.ParseMultipartForm(uploads.MaxImageUploadSize)
	if err != nil {
		if respondProjectMultipartErr(w, err) {
			return
		}
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	files := r.MultipartForm.File["file"]
	if len(files) == 0 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Debes proporcionar un archivo.",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	} else if len(files) > 1 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Solo puedes subir un archivo a la vez.",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	projectID := r.PathValue("id")
	docID := r.PathValue("docID")
	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	file := files[0]
	filename, err := uploads.Upload(&uploads.FileData{
		Filename: fmt.Sprintf("%s-%s", project.Slug, r.FormValue("filename")),
		File:     file,
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error uploading file: %v\n", err)
		return
	}

	var foundDoc *db.ProjectDoc
	for _, doc := range project.Docs {
		if doc.ID == docID {
			doc.Name = filename
			doc.Description = r.FormValue("description")
			foundDoc = &doc
			break
		}
	}

	if foundDoc == nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "No se encontró el documento a actualizar",
		})
		// Offload file deletion to a goroutine
		go func() {
			uploads.Delete(filename)
		}()
		return
	}

	err = db.UpdateProject(ctx, project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Error updating project: %v\n", err)
		go func() {
			uploads.Delete(filename)
		}()
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"doc":     foundDoc,
	})
}

func RemoveProjectDoc(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")
	docID := r.PathValue("docID")
	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	var foundDoc *db.ProjectDoc
	newDocs := make([]db.ProjectDoc, len(project.Docs)-1)
	for _, doc := range project.Docs {
		if doc.ID == docID {
			foundDoc = &doc
			continue
		}

		newDocs = append(newDocs, doc)
	}

	if foundDoc == nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "No se encontró el documento a eliminar",
		})
		return
	}

	project.Docs = newDocs

	err = db.UpdateProject(ctx, project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Error updating project: %v\n", err)
		return
	}

	go func() {
		uploads.Delete(foundDoc.Name)
	}()

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}

func CreateAssociate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	associate := db.ProjectAssociate{}

	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()

	err := decoder.Decode(&associate)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing associate: %v\n", err)
		return
	}

	err = db.CreateAssociate(ctx, &associate)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al crear el registro del socio",
		})
		log.Printf("Failed to create associate: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success":   true,
		"associate": associate,
	})
}

func GetAssociates(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query()
	filter := db.NewProjectAssociateFilter()

	if rfcOrCurp := q.Get("rfcOrCurp"); rfcOrCurp != "" {
		filter.RfcOrCurp = &rfcOrCurp
	}
	if name := q.Get("name"); name != "" {
		filter.Name = &name
	}
	if phone := q.Get("phone"); phone != "" {
		filter.Phone = &phone
	}

	associates, err := db.FindAssociates(ctx, filter)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al buscar los socios",
		})
		log.Printf("Failed to find associates: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success":    true,
		"associates": associates,
	})
}

func UpdateAssociate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	associateID := r.PathValue("id")
	associate := db.ProjectAssociate{}

	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()

	err := decoder.Decode(&associate)

	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing associate: %v\n", err)
		return
	}

	associate.ID = associateID

	err = db.UpdateAssociate(ctx, &associate)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el registro del socio",
		})
		log.Printf("Failed to update associate: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success":   true,
		"associate": associate,
	})
}

func DeleteAssociate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	associateID := r.PathValue("id")

	err := db.DeleteAssociate(ctx, associateID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al eliminar el registro del socio",
		})
		log.Printf("Failed to delete associate: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}

func GetProjectAssociates(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")

	query := r.URL.Query()
	filter := db.NewProjectAssociateFilter()

	if pendingPayment := query.Get("pendingPayment"); pendingPayment != "" {
		b, _ := strconv.ParseBool(pendingPayment)
		filter.PendingPayment = &b
	}
	if lotNum := query.Get("lotNum"); lotNum != "" {
		filter.LotNum = &lotNum
	}
	if appleNum := query.Get("appleNum"); appleNum != "" {
		filter.AppleNum = &appleNum
	}
	if rfcOrCurp := query.Get("rfcOrCurp"); rfcOrCurp != "" {
		filter.RfcOrCurp = &rfcOrCurp
	}
	if name := query.Get("name"); name != "" {
		filter.Name = &name
	}
	if phone := query.Get("phone"); phone != "" {
		filter.Phone = &phone
	}

	associates, err := db.FindProjectAssociates(ctx, projectID, filter)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al buscar los socios del proyecto",
		})
		log.Printf("Failed to find associates: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success":    true,
		"associates": associates,
	})
}

func GetProjectAssociate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")
	associateID := r.PathValue("associateID")

	associate, err := db.FindProjectAssociateByID(ctx, projectID, associateID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el socio",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al buscar el socio",
		})
		log.Printf("Failed to find associate: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success":   true,
		"associate": associate,
	})
}

func AddProjectAssociate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")
	associateID := r.PathValue("associateID")
	var relData db.ProjectAssociate

	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()
	err := decoder.Decode(&relData)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing associate: %v\n", err)
		return
	}

	err = db.AddProjectAssociate(ctx, projectID, associateID, &relData)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al crear la relación de proyecto-asociado",
		})
		log.Printf("Failed to create project associate: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
	})
}

func UpdateProjectAssociate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")
	associateID := r.PathValue("associateID")
	associate := db.ProjectAssociate{}

	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()

	err := decoder.Decode(&associate)

	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing associate: %v\n", err)
		return
	}

	err = db.UpdateProjectAssociate(ctx, projectID, associateID, &associate)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar la relación de proyecto-asociado",
		})
		log.Printf("Failed to update project associate: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success":   true,
		"associate": associate,
	})
}

func RemoveProjectAssociate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")
	associateID := r.PathValue("associateID")

	err := db.RemoveProjectAssociate(ctx, projectID, associateID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al eliminar la relación de proyecto-asociado",
		})
		log.Printf("Failed to delete project associate: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}

func UploadProjectMainImg(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")

	r.Body = http.MaxBytesReader(w, r.Body, uploads.MaxImageUploadSize+1<<20)
	err := r.ParseMultipartForm(uploads.MaxImageUploadSize)
	if err != nil {
		if respondProjectMultipartErr(w, err) {
			return
		}
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	files := r.MultipartForm.File["file"]
	if len(files) == 0 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Debes proporcionar un archivo.",
		})
		return
	} else if len(files) > 1 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Solo puede haber una imagen principal.",
		})
		return
	}

	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	file := files[0]
	filename, err := uploads.Upload(&uploads.FileData{
		Filename: fmt.Sprintf("%s-%s", project.Slug, "main-img"),
		File:     file,
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error uploading file: %v\n", err)
		return
	}
	project.MainImg = filename

	err = db.UpdateProject(ctx, project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Error updating project: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"project": project,
	})
}

func RemoveProjectMainImg(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")
	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	err = uploads.Delete(project.MainImg)
	if err != nil && !os.IsNotExist(err) {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al eliminar la imagen principal",
		})
		log.Printf("Error deleting main image: %v\n", err)
		return
	}

	project.MainImg = ""

	err = db.UpdateProject(ctx, project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Error updating project: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}

func UploadProjectGallery(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")

	r.Body = http.MaxBytesReader(w, r.Body, uploads.MaxImageUploadSize*uploads.MaxMultiUploadCount+1<<20)
	err := r.ParseMultipartForm(uploads.MaxImageUploadSize * uploads.MaxMultiUploadCount)
	if err != nil {
		if respondProjectMultipartErr(w, err) {
			return
		}
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	files := r.MultipartForm.File["file"]
	if len(files) == 0 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Debes proporcionar almenos un archivo.",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	written, err := uploads.UploadMultiple(fmt.Sprintf("%s-%s", project.Slug, "galeria"), files)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error uploading file: %v\n", err)
		return
	}

	for _, file := range written {
		project.Gallery = append(project.Gallery, file.Filename)
	}

	err = db.UpdateProject(ctx, project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Error updating project: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"project": project,
	})
}

func RemoveFromProjectGallery(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")
	imgID := r.PathValue("imgID")
	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	var foundImg string
	newImgs := []string{}
	for _, img := range project.Gallery {
		if img == imgID {
			foundImg = img
			continue
		}

		newImgs = append(newImgs, img)
	}

	if foundImg == "" {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "No se encontró la imagen a eliminar",
		})
		return
	}

	project.Gallery = newImgs

	err = db.UpdateProject(ctx, project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Error updating project: %v\n", err)
		return
	}

	err = uploads.Delete(foundImg)
	if err != nil && !os.IsNotExist(err) {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al eliminar la imagen",
		})
		log.Printf("Error deleting image: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}

func UploadProjectAmenity(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")

	r.Body = http.MaxBytesReader(w, r.Body, uploads.MaxImageUploadSize+1<<20)
	err := r.ParseMultipartForm(uploads.MaxImageUploadSize)
	if err != nil {
		if respondProjectMultipartErr(w, err) {
			return
		}
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	files := r.MultipartForm.File["file"]
	if len(files) > 1 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Solo puedes subir un archivo a la vez.",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	amenity := db.ProjectAmenity{
		ID:   uuid.Must(uuid.NewV7()).String(),
		Name: r.FormValue("name"),
		Icon: r.FormValue("icon"),
		Img:  "",
	}

	if len(files) > 0 {
		date := time.Now().Format("2006-01-02T15:04:05")
		fData := uploads.FileData{
			Filename: fmt.Sprintf("%s-%s-%s", project.Slug, "amenity", date),
			File:     files[0],
		}
		filename, err := uploads.Upload(&fData)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, ErrorParams{
				ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
			})
			log.Printf("Error uploading file: %v\n", err)
			return
		}

		amenity.Img = filename
	}

	project.Amenities = append(project.Amenities, amenity)

	err = db.UpdateProject(ctx, project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Error updating project: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"project": project,
	})

	go func() {
		uploads.Delete(amenity.Img)
	}()
}

func UpdateProjectAmenity(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")
	amenityID := r.PathValue("amenityID")

	r.Body = http.MaxBytesReader(w, r.Body, uploads.MaxImageUploadSize+1<<20)
	err := r.ParseMultipartForm(uploads.MaxImageUploadSize)
	if err != nil {
		if respondProjectMultipartErr(w, err) {
			return
		}
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	files := r.MultipartForm.File["file"]
	if len(files) > 1 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Solo puedes subir un archivo a la vez.",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	var foundAmenity *db.ProjectAmenity
	for _, amenity := range project.Amenities {
		if amenity.ID == amenityID {
			foundAmenity = &amenity
			break
		}
	}

	if foundAmenity == nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "No se encontró la amenidad a actualizar",
		})
		return
	}

	if len(files) > 0 {
		if foundAmenity.Img != "" {
			err = uploads.Delete(foundAmenity.Img)
			if err != nil && !os.IsNotExist(err) {
				respondWithError(w, http.StatusInternalServerError, ErrorParams{
					ErrorMessage: "Ocurrió un error al eliminar la imagen actual",
				})
				log.Printf("Error deleting image: %v\n", err)
				return
			}
		}

		date := time.Now().Format("2006-01-02T15:04:05")
		fData := uploads.FileData{
			Filename: fmt.Sprintf("%s-%s-%s", project.Slug, "amenity", date),
			File:     files[0],
		}
		filename, err := uploads.Upload(&fData)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, ErrorParams{
				ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
			})
			log.Printf("Error uploading file: %v\n", err)
			return
		}

		foundAmenity.Img = filename
	}

	foundAmenity.Name = r.FormValue("name")
	foundAmenity.Icon = r.FormValue("icon")

	newAmenities := []db.ProjectAmenity{}
	for _, amenity := range project.Amenities {
		if amenity.ID == amenityID {
			continue
		}

		newAmenities = append(newAmenities, amenity)
	}
	newAmenities = append(newAmenities, *foundAmenity)
	project.Amenities = newAmenities

	err = db.UpdateProject(ctx, project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Error updating project: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"project": project,
	})
}

func DeleteProjectAmenity(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")
	amenityID := r.PathValue("amenityID")

	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	var foundAmenity *db.ProjectAmenity
	newAmenities := []db.ProjectAmenity{}
	for _, amenity := range project.Amenities {
		if amenity.ID == amenityID {
			foundAmenity = &amenity
			continue
		}

		newAmenities = append(newAmenities, amenity)
	}

	if foundAmenity == nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "No se encontró la imagen a eliminar",
		})
		return
	}

	project.Amenities = newAmenities

	err = db.UpdateProject(ctx, project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Error updating project: %v\n", err)
		return
	}

	err = uploads.Delete(foundAmenity.Img)
	if err != nil && !os.IsNotExist(err) {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al eliminar la imagen",
		})
		log.Printf("Error deleting image: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}

func UploadProjectAvailability(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")

	r.Body = http.MaxBytesReader(w, r.Body, uploads.MaxImageUploadSize+1<<20)
	err := r.ParseMultipartForm(uploads.MaxImageUploadSize)
	if err != nil {
		if respondProjectMultipartErr(w, err) {
			return
		}
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	files := r.MultipartForm.File["file"]
	if len(files) == 0 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Debes proporcionar un archivo.",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	} else if len(files) > 1 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Solo puedes subir un archivo a la vez.",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	fData := uploads.FileData{
		Filename: fmt.Sprintf("%s-%s", project.Slug, "availability"),
		File:     files[0],
	}
	filename, err := uploads.Upload(&fData)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error uploading file: %v\n", err)
		return
	}

	project.AvailabilityImg = filename

	err = db.UpdateProject(ctx, project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Error updating project: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"project": project,
	})
}

func RemoveProjectAvailability(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")

	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	availabilityImg := project.AvailabilityImg
	project.AvailabilityImg = ""

	err = db.UpdateProject(ctx, project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Error updating project: %v\n", err)
		return
	}

	err = uploads.Delete(availabilityImg)
	if err != nil && !os.IsNotExist(err) {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al eliminar la imagen",
		})
		log.Printf("Error deleting image: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}

// UploadProjectSectionImage uploads a single image file for a project section
// identified by its array index (sectionIdx). The handler stores the file under
// uploads with a deterministic, slug-scoped name and returns the resulting
// filename so the frontend can persist it inside sections[idx].image via the
// normal PUT /api/proyectos/{id} JSON update.
//
// This endpoint never mutates the project DB row — it only writes to disk.
func UploadProjectSectionImage(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")
	sectionIdxStr := r.PathValue("sectionIdx")

	sectionIdx, err := strconv.Atoi(sectionIdxStr)
	if err != nil || sectionIdx < 0 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "El índice de la sección debe ser un entero positivo",
		})
		return
	}

	// Hard cap request body to image upload size + 1MB slack for multipart overhead.
	// ParseMultipartForm's argument controls in-memory buffer only, not total size.
	r.Body = http.MaxBytesReader(w, r.Body, uploads.MaxImageUploadSize+1<<20)

	err = r.ParseMultipartForm(uploads.MaxImageUploadSize)
	if err != nil {
		if respondProjectMultipartErr(w, err) {
			return
		}
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	files := r.MultipartForm.File["file"]
	if len(files) == 0 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Debes proporcionar un archivo.",
		})
		return
	} else if len(files) > 1 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Solo puedes subir un archivo a la vez.",
		})
		return
	}

	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	date := time.Now().Format("2006-01-02T15-04-05")
	filename, err := uploads.Upload(&uploads.FileData{
		Filename: fmt.Sprintf("%s-section-%d-%s", project.Slug, sectionIdx, date),
		File:     files[0],
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error uploading section image: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success":  true,
		"filename": filename,
	})
}

func UploadProjectQuoteImg(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")

	r.Body = http.MaxBytesReader(w, r.Body, uploads.MaxImageUploadSize+1<<20)
	err := r.ParseMultipartForm(uploads.MaxImageUploadSize)
	if err != nil {
		if respondProjectMultipartErr(w, err) {
			return
		}
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	files := r.MultipartForm.File["file"]
	if len(files) == 0 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Debes proporcionar un archivo.",
		})
		return
	} else if len(files) > 1 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Solo puede haber una imagen de cita.",
		})
		return
	}

	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	file := files[0]
	filename, err := uploads.Upload(&uploads.FileData{
		Filename: fmt.Sprintf("%s-%s", project.Slug, "quote-img"),
		File:     file,
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error uploading file: %v\n", err)
		return
	}
	project.QuoteImg = filename

	err = db.UpdateProject(ctx, project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Error updating project: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"project": project,
	})
}

func RemoveProjectQuoteImg(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := r.PathValue("id")
	project, err := db.FindProject(ctx, projectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el proyecto",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding project: %v\n", err)
		return
	}

	err = uploads.Delete(project.QuoteImg)
	if err != nil && !os.IsNotExist(err) {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al eliminar la imagen de cita",
		})
		log.Printf("Error deleting quote image: %v\n", err)
		return
	}

	project.QuoteImg = ""

	err = db.UpdateProject(ctx, project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Error updating project: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}

func GetAppealItems(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	items, err := db.FindAppealItems(ctx)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al buscar los atractivos",
		})
		log.Printf("Failed to find appeal items: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"items":   items,
	})
}

func GetAppealItem(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := r.PathValue("id")

	item, err := db.FindAppealItemByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el atractivo",
			})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al buscar el atractivo",
		})
		log.Printf("Failed to find appeal item: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"item":    item,
	})
}

func CreateAppealItem(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	item := db.ProjectAppealItem{}

	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()

	if err := decoder.Decode(&item); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing appeal item: %v\n", err)
		return
	}

	if err := db.CreateAppealItem(ctx, &item); err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al crear el atractivo",
		})
		log.Printf("Failed to create appeal item: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"item":    item,
	})
}

func UpdateAppealItem(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := r.PathValue("id")
	item := db.ProjectAppealItem{}

	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()

	if err := decoder.Decode(&item); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Error parsing appeal item: %v\n", err)
		return
	}

	item.ID = id

	if err := db.UpdateAppealItem(ctx, &item); err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el atractivo",
		})
		log.Printf("Failed to update appeal item: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"item":    item,
	})
}

func DeleteAppealItem(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := r.PathValue("id")

	if err := db.DeleteAppealItem(ctx, id); err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al eliminar el atractivo",
		})
		log.Printf("Failed to delete appeal item: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}
