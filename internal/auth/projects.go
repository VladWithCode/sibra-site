package auth

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/golang-jwt/jwt/v5"
	"github.com/vladwithcode/sibra-site/internal/db"
)

var (
	ErrMalformedProjectTokenClaims = errors.New("project access token claims are malformed")
	ErrInvalidProjectToken         = errors.New("project access token is invalid")
)

type ProjectAccessClaims struct {
	ProjectID   string
	AssociateID string
	IDCode      string
	LotNum      string
	AppleNum    string

	jwt.RegisteredClaims
}

type ProjectAccessTokenData struct {
	ProjectID   string
	AssociateID string
	IDCode      string
	LotNum      string
	AppleNum    string
	ExpiresAt   *jwt.NumericDate
}

func CreateProjectToken(tkData *ProjectAccessTokenData) (string, error) {
	var (
		t *jwt.Token
		k = os.Getenv("JWT_SECRET")
	)

	t = jwt.NewWithClaims(jwt.SigningMethodHS256, ProjectAccessClaims{
		tkData.ProjectID,
		tkData.AssociateID,
		tkData.IDCode,
		tkData.LotNum,
		tkData.AppleNum,

		jwt.RegisteredClaims{
			ExpiresAt: tkData.ExpiresAt,
		},
	})

	return t.SignedString([]byte(k))
}

func ParseProjectToken(tokenStr string) (*jwt.Token, error) {
	var (
		t *jwt.Token
		k = os.Getenv("JWT_SECRET")
	)

	t, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signing method %v", t.Header["alg"])
		}

		return []byte(k), nil
	})

	if err != nil {
		return nil, err
	}

	return t, nil
}

func ExtractProjectAccessDataFromToken(tk *jwt.Token) (*ProjectAccessTokenData, error) {
	if claims, ok := tk.Claims.(jwt.MapClaims); ok && tk.Valid {
		var (
			projectID, pidOk   = claims["ProjectID"].(string)
			associateID, aidOk = claims["AssociateID"].(string)
			idcode, icOk       = claims["IDCode"].(string)
			lotNum, lnOk       = claims["LotNum"].(string)
			appleNum, anOk     = claims["AppleNum"].(string)
		)

		if !pidOk || !aidOk || !lnOk || !anOk || !icOk {
			return nil, ErrMalformedProjectTokenClaims
		}

		return &ProjectAccessTokenData{
			ProjectID:   projectID,
			AssociateID: associateID,
			IDCode:      idcode,
			LotNum:      lotNum,
			AppleNum:    appleNum,
		}, nil
	}

	return nil, ErrInvalidProjectToken
}

func ValidateProjectAccessMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tkStr, err := r.Cookie("project_auth")
		if err != nil {
			respondWithError(w, http.StatusUnauthorized, ErrorParams{
				ErrorMessage: "No se encontro token",
			})
			log.Printf("Error getting project auth token: %v\n", err)
			return
		}
		tk, err := ParseToken(tkStr.Value)
		if err != nil || !tk.Valid {
			respondWithError(w, http.StatusUnauthorized, ErrorParams{
				ErrorMessage: "No se encontro token",
			})
			log.Printf("Error parsing project auth token: %v\n", err)
			return
		}

		data, err := ExtractProjectAccessDataFromToken(tk)
		if err != nil {
			respondWithError(w, http.StatusUnauthorized, ErrorParams{
				ErrorMessage: "No se encontro token",
			})
			log.Printf("Error extracting project access data from token: %v\n", err)
			return
		}

		assoc, err := db.FindAssociateWithData(r.Context(), data.ProjectID, data.IDCode, data.LotNum, data.AppleNum)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				respondWithError(w, http.StatusUnauthorized, ErrorParams{
					ErrorMessage: "No se encontro el registro del socio",
					Etc: map[string]any{
						"authorized": false,
					},
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

		r = r.WithContext(context.WithValue(r.Context(), "project_access_data", data))
		r = r.WithContext(context.WithValue(r.Context(), "project_associate", assoc))
		next(w, r)
	})
}

func ExtractProjectAccessDataFromCtx(ctx context.Context) (*ProjectAccessTokenData, error) {
	data, ok := ctx.Value("project_access_data").(*ProjectAccessTokenData)
	if !ok {
		return nil, errors.New("no project access data found in context")
	}
	return data, nil
}

func ExtractProjectAssociateFromCtx(ctx context.Context) (*db.ProjectAssociate, error) {
	data, ok := ctx.Value("project_associate").(*db.ProjectAssociate)
	if !ok {
		return nil, errors.New("no project associate found in context")
	}
	return data, nil
}

// TODO: add proper implementation for response handling
type ErrorParams struct {
	ErrorMessage string         `json:"error"`
	Etc          map[string]any `json:"etc"`
}

func respondWithError(w http.ResponseWriter, code int, params ErrorParams) {
	response := map[string]any{
		"error": params.ErrorMessage,
		"etc":   params.Etc,
	}
	if response["error"] == "" {
		response["error"] = "Ocurrio un error inesperado en el servidor"
	}

	respondWithJSON(w, code, response)
}

func respondWithJSON(w http.ResponseWriter, code int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	err := json.NewEncoder(w).Encode(data)
	if err != nil {
		http.Error(w, "Ocurrio un error inesperado en el servidor", http.StatusInternalServerError)
		log.Printf("Error: %v\n", err)
	}
}
