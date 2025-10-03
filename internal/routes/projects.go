package routes

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/uploads"
)

func RegisterProjectRoutes(router *customServeMux) {
	router.HandleFunc("POST /api/socios", CreateAssociate)
	router.HandleFunc("PUT /api/socios/{id}", UpdateAssociate)
	router.HandleFunc("DELETE /api/socios/{id}", DeleteAssociate)

	router.HandleFunc("GET /api/proyectos", GetProjects)
	router.HandleFunc("GET /api/proyectos/{id}", GetProject)
	router.HandleFunc("POST /api/proyectos", CreateProject)
	router.HandleFunc("PUT /api/proyectos/{id}", UpdateProject)
	router.HandleFunc("DELETE /api/proyectos/{id}", DeleteProject)

	router.HandleFunc("POST /api/proyectos/{id}/socios/{associateID}", AddProjectAssociate)
	router.HandleFunc("PUT /api/proyectos/{id}/socios/{associateID}", UpdateProjectAssociate)
	router.HandleFunc("DELETE /api/proyectos/{id}/socios/{associateID}", RemoveProjectAssociate)

	router.HandleFunc("GET /api/proyectos/{id}/documentos", auth.ValidateProjectAccessMiddleware(GetProjectDocs))
	router.HandleFunc("POST /api/proyectos/{id}/documentos", CreateProjectDoc)
	router.HandleFunc("DELETE /api/proyectos/{id}/documentos/{docID}", RemoveProjectDoc)

	router.HandleFunc("GET /api/proyectos/{id}/acceso", CheckProjectAccess)
	router.HandleFunc("POST /api/proyectos/{id}/acceso", ValidateProjectAccess)
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

	for _, project := range projects {
		project.Associates = nil
		project.Docs = nil
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

	err = db.UpdateProject(ctx, &project)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el proyecto",
		})
		log.Printf("Failed to update project: %v\n", err)
		return
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
	err := r.ParseMultipartForm(uploads.MaxImageUploadSize)
	if err != nil {
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
	err := r.ParseMultipartForm(uploads.MaxImageUploadSize)
	if err != nil {
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

	associate, err := db.FindAssociateByID(ctx, associateID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al buscar el socio",
		})
		log.Printf("Failed to find associate: %v\n", err)
		return
	}

	associate.PendingPayment = relData.PendingPayment
	associate.LotNum = relData.LotNum
	associate.AppleNum = relData.AppleNum

	err = db.AddProjectAssociate(ctx, projectID, associate)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al crear la relación de proyecto-asociado",
		})
		log.Printf("Failed to create project associate: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success":   true,
		"associate": associate,
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

	err = db.UpdateProjectAssociate(ctx, projectID, associateID, associate.PendingPayment)
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
