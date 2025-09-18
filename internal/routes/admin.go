package routes

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
)

func RegisterAdminRoutes(router *customServeMux) {
	// Signin
	router.HandleFunc("POST /api/admin/sign-in", auth.CheckAuthMiddleware(AdminSignIn))

	router.HandleFunc("GET /api/perfil", auth.WithAuthMiddleware(GetUserProfile))
}

func AdminSignIn(w http.ResponseWriter, r *http.Request, a *auth.Auth) {
	login := db.User{}
	err := json.NewDecoder(r.Body).Decode(&login)
	defer r.Body.Close()
	if err != nil {
		respondWithError(w, 400, ErrorParams{
			ErrorMessage: "La información proporcionada es inválida",
		})
		log.Printf("Malformed json data: %v\n", err)
		return
	}

	user, err := db.GetUserByUsername(login.Username)
	if err != nil {
		respondWithError(w, 400, ErrorParams{ErrorMessage: "Usuario o contraseña inválidos."})
		log.Printf("Error getting user: %v\n", err)
		return
	}

	err = user.ValidatePass(login.Password)
	if err != nil {
		respondWithError(w, 400, ErrorParams{ErrorMessage: "Usuario o contraseña inválidos."})
		return
	}

	if a.HasAccess(auth.AccessLevelEditor) {
		respondWithError(w, 403, ErrorParams{ErrorMessage: "No tienes acceso a esta página"})
	}

	t, err := auth.CreateToken(user)
	if err != nil {
		respondWithError(w, 500, ErrorParams{})
		fmt.Printf("Error while creating token: %v\n", err)
		return
	}

	jwtCookie := &http.Cookie{
		Name:     "auth_token",
		Value:    t,
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		//Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
	}

	http.SetCookie(w, jwtCookie)
	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
	})
}

func GetUserProfile(w http.ResponseWriter, r *http.Request, auth *auth.Auth) {
	userId := auth.Id
	user, err := db.GetUserById(userId)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al obtener el perfil del usuario",
		})
		return
	}

	respondWithJSON(w, http.StatusOK, user)
}
