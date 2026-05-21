package routes

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
)

func RegisterTeamRoutes(router *customServeMux) {
	router.HandleFunc("GET /api/team-members", ListTeamMembers)
	router.HandleFunc("GET /api/team-members/{id}", FindTeamMember)
	router.HandleFunc("GET /api/team-members/next-position", GetNextTeamMemberPosition)
	router.HandleFunc("POST /api/team-members", auth.WithAuthAccessLevelMiddleware(CreateTeamMember, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/team-members/{id}", auth.WithAuthAccessLevelMiddleware(UpdateTeamMember, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/team-members/{id}", auth.WithAuthAccessLevelMiddleware(DeleteTeamMember, auth.AccessLevelEditor))
	router.HandleFunc("POST /api/team-members/photo/{id}", auth.WithAuthAccessLevelMiddleware(UploadTeamMemberPhoto, auth.AccessLevelEditor))
}

func ListTeamMembers(w http.ResponseWriter, r *http.Request) {
	members, err := db.ListTeamMembers(r.Context())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al obtener los miembros del equipo",
		})
		log.Printf("ListTeamMembers err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"teamMembers": members,
	})
}

func FindTeamMember(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	m, err := db.FindTeamMemberByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el miembro del equipo",
			})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al obtener el miembro del equipo",
		})
		log.Printf("FindTeamMember err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"teamMember": m,
	})
}

func GetNextTeamMemberPosition(w http.ResponseWriter, r *http.Request) {
	pos, err := db.GetNextTeamMemberPosition(r.Context())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al obtener la siguiente posición",
		})
		log.Printf("GetNextTeamMemberPosition err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"position": pos,
	})
}

func CreateTeamMember(w http.ResponseWriter, r *http.Request) {
	var m db.TeamMember
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "El formulario contiene información inválida",
		})
		log.Printf("CreateTeamMember decode err: %v\n", err)
		return
	}
	defer r.Body.Close()

	if err := db.CreateTeamMember(r.Context(), &m); err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al crear el miembro del equipo",
		})
		log.Printf("CreateTeamMember err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success":    true,
		"teamMember": m,
	})
}

func UpdateTeamMember(w http.ResponseWriter, r *http.Request) {
	var m db.TeamMember
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "El formulario contiene información inválida",
		})
		log.Printf("UpdateTeamMember decode err: %v\n", err)
		return
	}
	defer r.Body.Close()

	m.ID = r.PathValue("id")
	if err := db.UpdateTeamMember(r.Context(), &m); err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar el miembro del equipo",
		})
		log.Printf("UpdateTeamMember err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success":    true,
		"teamMember": m,
	})
}

func DeleteTeamMember(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := db.DeleteTeamMember(r.Context(), id); err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al eliminar el miembro del equipo",
		})
		log.Printf("DeleteTeamMember err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}

func UploadTeamMemberPhoto(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ctx := r.Context()

	member, err := db.FindTeamMemberByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el miembro del equipo",
			})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding team member: %v\n", err)
		return
	}

	err = r.ParseMultipartForm(10 << 20)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "El formulario no pudo ser procesado. Asegurate de que el archivo no exceda el tamaño máximo permitido (10MB).",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	filePath := filepath.Join("web/static/team", member.ID)
	err = os.MkdirAll(filePath, 0755)
	if err != nil && !os.IsExist(err) {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error creating directory: %v\n", err)
		return
	}

	files := r.MultipartForm.File["photo"]
	if len(files) == 0 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "No se recibió ninguna imagen",
		})
		return
	}

	fileHeader := files[0]
	file, err := fileHeader.Open()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error opening file: %v\n", err)
		return
	}
	defer file.Close()

	ext := filepath.Ext(fileHeader.Filename)
	if ext == "" {
		ext = ".jpg"
	}
	uploadDateStr := time.Now().Format("20060102-150405")
	fileName := fmt.Sprintf("photo-%s%s", uploadDateStr, ext)
	filePath = filepath.Join(filePath, fileName)

	outFile, err := os.Create(filePath)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Error al guardar la imagen",
		})
		log.Printf("Error while creating file: %v", err)
		return
	}
	defer outFile.Close()

	_, err = io.Copy(outFile, file)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Error al guardar la imagen",
		})
		log.Printf("Error copying file: %v", err)
		return
	}

	photoURL := fmt.Sprintf("/static/team/%s/%s", member.ID, fileName)
	member.PhotoURL = photoURL
	if err := db.UpdateTeamMember(ctx, member); err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Error al actualizar la URL de la imagen",
		})
		log.Printf("Error updating team member photo URL: %v", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success":    true,
		"photoUrl":   photoURL,
		"teamMember": member,
	})
}
