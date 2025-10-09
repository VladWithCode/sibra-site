package routes

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
)

func RegisterAdminRoutes(router *customServeMux) {
	// Signin
	router.HandleFunc("POST /api/auth/login", auth.PopulateAuthMiddleware(AdminSignIn))
	router.HandleFunc("GET /api/auth/logout", auth.PopulateAuthMiddleware(AdminSignOut))

	router.HandleFunc("GET /api/perfil", auth.ValidateAuthMiddleware(GetUserProfile))
}

func AdminSignIn(w http.ResponseWriter, r *http.Request) {
	login := db.User{}
	err := json.NewDecoder(r.Body).Decode(&login)
	defer r.Body.Close()
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Verifica que la información proporcionada sea correcta",
		})
		log.Printf("Malformed json data: %v\n", err)
		return
	}

	user, err := db.GetUserByUsername(login.Username)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "Usuario o contraseña inválidos."})
		log.Printf("Error getting user: %v\n", err)
		return
	}

	err = user.ValidatePass(login.Password)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{ErrorMessage: "Usuario o contraseña inválidos."})
		return
	}

	if !auth.UserHasAccess(user, auth.AccessLevelEditor) {
		respondWithError(w, http.StatusForbidden, ErrorParams{ErrorMessage: "No tienes acceso a esta página"})
		return
	}

	t, err := auth.CreateToken(user)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado",
		})
		log.Printf("failed to create auth token: %v\n", err)
		return
	}

	jwtCookie := &http.Cookie{
		Name:     "auth_token",
		Value:    t,
		Expires:  time.Now().Add(auth.AuthTokenDuration),
		HttpOnly: true,
		//Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
	}

	http.SetCookie(w, jwtCookie)
	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"user":    user,
	})
}

// TODO: add token blacklisting/revoking mechanism
func AdminSignOut(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		// Secure: true,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
	})

	respondWithJSON(w, http.StatusOK, rmap{
		"success": true,
	})
}

func GetUserProfile(w http.ResponseWriter, r *http.Request) {
	authData, err := auth.ExtractAuthDataFromCtx(r.Context())
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, ErrorParams{
			ErrorMessage: "No se encontro token",
		})
		log.Printf("Error getting project auth token: %v\n", err)
		return
	}

	user, err := db.GetUserById(authData.Id)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al obtener el perfil del usuario",
		})
		return
	}

	respondWithJSON(w, http.StatusOK, rmap{
		"success": true,
		"user":    user,
	})
}
