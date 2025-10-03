package routes

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/vladwithcode/sibra-site/internal/db"
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

	router.HandleFunc("POST /api/proyectos/{id}/acceso", CheckProjectAccess)
}

func CheckProjectAccess(w http.ResponseWriter, r *http.Request) {
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

	record, err := db.FindAssociateWithData(ctx, projectID, accessData.IDcode, accessData.LotNum, accessData.AppleNum)
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

	var (
		tk *jwt.Token
		k  = os.Getenv("JWT_SECRET")
	)
	expTime := time.Now().Add(24 * time.Hour)
	tk = jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"idcode":   accessData.IDcode,
		"lotNum":   accessData.LotNum,
		"appleNum": accessData.AppleNum,
		"exp":      expTime,
	})

	tkStr, err := tk.SignedString([]byte(k))
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al generar el token de autorización",
		})
		log.Printf("Failed to generate token: %v\n", err)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "project_auth",
		Value:    tkStr,
		Expires:  expTime,
		HttpOnly: true,
		// Secure: true,
		SameSite: http.SameSiteStrictMode,
	})

	respondWithJSON(w, http.StatusOK, map[string]any{
		"authorized": true,
		"associate":  record,
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
	// TODO: add full implementation for project authentication
	tkStr, err := r.Cookie("project_auth")
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, ErrorParams{
			ErrorMessage: "No estás autorizado para acceder a este contenido",
		})
		log.Printf("Error getting project auth token: %v\n", err)
		return
	}
	tk, err := auth.ParseToken(tkStr.Value)
	if err != nil || !tk.Valid {
		respondWithError(w, http.StatusUnauthorized, ErrorParams{
			ErrorMessage: "No estás autorizado para acceder a este contenido",
		})
		log.Printf("Error parsing project auth token: %v\n", err)
		return
	}

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
