package routes

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
)

func RegisterUserRoutes(router *customServeMux) {
	router.HandleFunc("GET /api/usuarios", auth.WithAuthAccessLevelMiddleware(GetUsers, auth.AccessLevelAdmin))
	router.HandleFunc("GET /api/usuarios/agentes", auth.WithAuthAccessLevelMiddleware(GetAgentListing, auth.AccessLevelAdmin))
	router.HandleFunc("GET /api/usuarios/{id}", auth.WithAuthAccessLevelMiddleware(GetUserByID, auth.AccessLevelAdmin))
	router.HandleFunc("POST /api/usuario", auth.WithAuthAccessLevelMiddleware(CreateUser, auth.AccessLevelAdmin))
	router.HandleFunc("PUT /api/usuarios/{id}", auth.WithAuthAccessLevelMiddleware(UpdateUser, auth.AccessLevelAdmin))
	router.HandleFunc("PUT /api/usuarios/perfil", auth.WithAuthAccessLevelMiddleware(UpdateUserProfile, auth.AccessLevelUser))
	router.HandleFunc("PUT /api/usuarios/password", auth.WithAuthAccessLevelMiddleware(UpdatePassword, auth.AccessLevelUser))
	router.HandleFunc("DELETE /api/usuario/imagen", auth.WithAuthAccessLevelMiddleware(DeleteUserPicture, auth.AccessLevelUser))
	router.HandleFunc("DELETE /api/usuario/{id}", auth.WithAuthAccessLevelMiddleware(DeleteUser, auth.AccessLevelAdmin))
}

func GetUsers(w http.ResponseWriter, r *http.Request) {
	params := r.URL.Query()
	filters := db.NewUserFilters()

	page, err := strconv.Atoi(params.Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}
	limit, err := strconv.Atoi(params.Get("limit"))
	if err != nil || limit <= 0 {
		limit = db.DefaultPageSize
	}

	if params.Get("search") != "" {
		filters.Search = params.Get("search")
	}

	users, err := db.GetUsers(r.Context(), filters, limit, page)
	if err != nil {
		if errors.Is(err, db.ErrUserFilterInvalid) {
			respondWithError(w, http.StatusBadRequest, ErrorParams{
				ErrorMessage: "La información proporcionada es inválida",
			})
			return
		}
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "La información proporcionada es inválida",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado",
		})
		log.Printf("Error finding filtered users: %v\n", err)
		return
	}

	pagination, err := db.GetUserPagination(filters, db.DefaultPageSize, page)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado",
		})
		log.Printf("Error finding filtered users: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, rmap{
		"users":      users,
		"pagination": pagination,
	})
}

func GetAgentListing(w http.ResponseWriter, r *http.Request) {
	users, err := db.FindAgents(r.Context())
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontraron agentes registrados",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado",
		})
		log.Printf("Error finding agents: %v\n", err)
		return
	}

	var publicUsers []db.PublicUser
	for _, u := range users {
		publicUsers = append(publicUsers, u.ToPublicUser())
	}

	respondWithJSON(w, http.StatusOK, rmap{
		"users": publicUsers,
	})

}

func GetUserByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	user, err := db.GetUserById(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró el usuario",
			})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado",
		})
		log.Printf("Error finding user by id: %v\n", err)
		return
	}

	user.Password = ""

	respondWithJSON(w, http.StatusOK, rmap{
		"user": user,
	})
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	data := db.User{}
	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()

	err := decoder.Decode(&data)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "La información proporcionada es inválida",
		})
		log.Printf("failed to parse json data: %v\n", err)
		return
	}

	data.Id = uuid.Must(uuid.NewV7()).String()
	_, err = db.CreateUser(&data)

	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			respondWithError(w, http.StatusBadRequest, ErrorParams{
				ErrorMessage: "No se pudo crear el usuario, el email y/o telefono ya estan registrados",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado",
		})
		log.Printf("Error creating user: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, rmap{
		"success": true,
		"user":    data,
	})
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
	var data db.User
	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()

	err := decoder.Decode(&data)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "La información proporcionada es inválida",
		})
		log.Printf("failed to parse json data: %v\n", err)
		return
	}

	user, err := db.GetUserById(r.Context(), data.Id)
	if err != nil {
		respondWithError(w, http.StatusNotFound, ErrorParams{
			ErrorMessage: "No se encontró el usuario",
		})
		log.Printf("Error finding user: %v\n", err)
		return
	}

	err = db.UpdateUser(r.Context(), &data)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado",
		})
		log.Printf("Error updating user: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, rmap{
		"success": true,
		"user":    user,
	})
}

func UpdateUserProfile(w http.ResponseWriter, r *http.Request) {
	authData, err := auth.ExtractAuthDataFromRequest(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, ErrorParams{
			ErrorMessage: "No se pudo autenticar la sesión actual",
		})
		log.Printf("Error getting project auth token: %v\n", err)
		return
	}

	var data struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Phone string `json:"phone"`
	}
	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()

	err = decoder.Decode(&data)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "La información proporcionada es inválida",
		})
		log.Printf("failed to parse json data: %v\n", err)
		return
	}

	user, err := db.GetUserById(r.Context(), authData.Id)
	if err != nil {
		respondWithError(w, http.StatusNotFound, ErrorParams{
			ErrorMessage: "No se encontró el usuario",
		})
		log.Printf("Error finding user: %v\n", err)
		return
	}

	user.Fullname = data.Name
	user.Email = data.Email
	user.Phone = data.Phone

	err = db.UpdateUser(r.Context(), user)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado",
		})
		log.Printf("Error updating user: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, rmap{
		"success": true,
		"user":    user,
	})
}

func UpdatePassword(w http.ResponseWriter, r *http.Request) {
	authData, err := auth.ExtractAuthDataFromRequest(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, ErrorParams{
			ErrorMessage: "No se pudo autenticar la sesión actual",
		})
		log.Printf("Error getting project auth token: %v\n", err)
		return
	}

	var data struct {
		Password string `json:"password"`
	}
	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()

	err = decoder.Decode(&data)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "La información proporcionada es inválida",
		})
		log.Printf("failed to parse json data: %v\n", err)
		return
	}

	user, err := db.GetUserById(r.Context(), authData.Id)
	if err != nil {
		respondWithError(w, http.StatusNotFound, ErrorParams{
			ErrorMessage: "No se encontró el usuario",
		})
		log.Printf("Error finding user: %v\n", err)
		return
	}

	err = db.UpdateUserPassword(r.Context(), user)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado",
		})
		log.Printf("Error updating user: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, rmap{
		"success": true,
		"user":    user,
	})
}

func UpdateUserPicture(w http.ResponseWriter, r *http.Request) {
	respondWithError(w, http.StatusNotImplemented, ErrorParams{
		ErrorMessage: "Funcionalidad no disponible todavía",
	})
}

func DeleteUserPicture(w http.ResponseWriter, r *http.Request) {
	respondWithError(w, http.StatusNotImplemented, ErrorParams{
		ErrorMessage: "Funcionalidad no disponible todavía",
	})
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	err := db.DeleteUser(r.Context(), id)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado",
		})
		fmt.Printf("Delete user err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, rmap{
		"success": true,
	})
}
