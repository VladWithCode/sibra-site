package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/vladwithcode/sibra-site/internal/db"
)

type AccessLevel int

const (
	AccessLevelUser AccessLevel = iota
	AccessLevelEditor
	AccessLevelAdmin
)

type Role string

const (
	AdminRole  Role = "admin"
	EditorRole Role = "editor"
	UserRole   Role = "user"
)

var (
	ErrAuthTokenInvalid  = errors.New("invalid auth token")
	ErrAuthTokenExpired  = errors.New("auth token expired")
	ErrAuthTokenNotFound = errors.New("auth token not found")
)

const (
	AuthCtxKey = "auth"

	AuthTokenDuration = time.Hour * 24 // 24 hours | 1 day
)

type Auth struct {
	Id       string
	Username string
	Fullname string
	Role     string
}

func (a *Auth) HasAccess(reqLv AccessLevel) bool {
	var roleLv AccessLevel = 0
	switch db.UserRole(a.Role) {
	case db.RoleUser:
		roleLv = AccessLevelUser
	case db.RoleEditor:
		roleLv = AccessLevelEditor
	case db.RoleAdmin:
		roleLv = AccessLevelAdmin
	default:
		roleLv = AccessLevelUser
	}

	return roleLv >= reqLv
}

func UserHasAccess(user *db.User, reqLv AccessLevel) bool {
	var roleLv AccessLevel = 0
	switch user.Role {
	case db.RoleUser:
		roleLv = AccessLevelUser
	case db.RoleEditor:
		roleLv = AccessLevelEditor
	case db.RoleAdmin:
		roleLv = AccessLevelAdmin
	default:
		roleLv = AccessLevelUser
	}

	return roleLv >= reqLv
}

type AuthClaims struct {
	Id       string
	Username string
	Fullname string
	Role     db.UserRole

	jwt.RegisteredClaims
}

// CreateToken creates a jwt token for the provided user.
//
// It errors if signing the token fails.
func CreateToken(user *db.User) (string, error) {
	var (
		t *jwt.Token
		k = os.Getenv("JWT_SECRET")
	)
	expTime := time.Now().Add(AuthTokenDuration)

	t = jwt.NewWithClaims(jwt.SigningMethodHS256, AuthClaims{
		user.Id,
		user.Username,
		user.Fullname,
		user.Role,

		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expTime),
		},
	})

	return t.SignedString([]byte(k))
}

// ParseToken takes in a jwt token candidate string and returns the parsed token if
// it is valid. It errors with ErrAuthTokenInvalid if the token is invalid.
func ParseToken(tokenStr string) (*jwt.Token, error) {
	var (
		t *jwt.Token
		k = os.Getenv("JWT_SECRET")
	)

	t, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.Join(
				ErrAuthTokenInvalid,
				fmt.Errorf("unexpected signing method %v", t.Header["alg"]),
			)
		}

		return []byte(k), nil
	})

	if err != nil {
		return nil, errors.Join(ErrAuthTokenInvalid, err)
	}

	return t, nil
}

// PopulateAuthMiddleware populates the auth data in the request context if there is
// a valid auth token in the cookie.
//
// It will not reject the request if there is no auth token in the cookie.
func PopulateAuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tkCookie, err := r.Cookie("auth_token")
		if err != nil {
			next(w, r)
			return
		}
		authData, err := GetAuthDataFromCookie(tkCookie)
		if err == nil {
			r = r.WithContext(context.WithValue(r.Context(), AuthCtxKey, authData))
		}

		next(w, r)
	}
}

// ValidateAuthMiddleware checks if the auth token is valid and populates the
// auth data in the request context.
func ValidateAuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tkCookie, err := r.Cookie("auth_token")
		if err != nil {
			RejectUnauthorized(w, r, http.StatusUnauthorized, "No se encontro token")
			return
		}
		authData, err := GetAuthDataFromCookie(tkCookie)
		if err != nil {
			RejectUnauthorized(w, r, http.StatusUnauthorized, "Sesion Token invalido")
			log.Printf("failed to extract auth data from cookie: %v\n", err)
			return
		}

		r = r.WithContext(context.WithValue(r.Context(), AuthCtxKey, authData))
		next(w, r)
	}
}

// WithAuthAccessLevelMiddleware checks if the user has the required access level
// to access the resource. If not, it rejects the request with a 403 Forbidden
// status code.
//
// It automatically calls the validate auth middleware.
func WithAuthAccessLevelMiddleware(next http.HandlerFunc, level AccessLevel) http.HandlerFunc {
	return ValidateAuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		authData, err := ExtractAuthDataFromCtx(r.Context())
		if err != nil {
			RejectUnauthorized(w, r, http.StatusInternalServerError, "Ocurrió un error inesperado")
			log.Printf("failed to extract auth data from context: %v\n", err)
			return
		}

		if !authData.HasAccess(level) {
			RejectUnauthorized(w, r, http.StatusForbidden, "No tienes acceso a este recurso")
			return
		}

		next(w, r)
	})
}

func RejectUnauthorized(w http.ResponseWriter, r *http.Request, code int, reason string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	var e string
	if reason != "" {
		e = reason
	} else {
		e = "Ocurrió un error inesperado"
	}
	json.NewEncoder(w).Encode(map[string]any{
		"error": e,
	})
}

// GetAuthDataFromCookie checks for the auth token cookie. If it exists, it parses it
// and validates it. If the token is valid, it returns the auth data.
// It errors otherwise.
func GetAuthDataFromCookie(tkCookie *http.Cookie) (*Auth, error) {
	t, err := ParseToken(tkCookie.Value)
	if err != nil {
		return nil, err
	}

	if claims, ok := t.Claims.(jwt.MapClaims); ok && t.Valid {
		var (
			id, ok1       = claims["Id"].(string)
			username, ok2 = claims["Username"].(string)
			role, ok3     = claims["Role"].(string)
			fullname, ok4 = claims["Fullname"].(string)
		)

		if !ok1 || !ok2 || !ok3 || !ok4 {
			return nil, ErrAuthTokenInvalid
		}

		return &Auth{
			Id:       id,
			Username: username,
			Role:     role,
			Fullname: fullname,
		}, nil
	}

	return nil, ErrAuthTokenInvalid
}

// ExtractAuthDataFromRequest extracts the auth data from the request context.
// The auth data must be present in the context. I.e. one of the auth middlewares
// must be used in order to populate the context.
func ExtractAuthDataFromRequest(r *http.Request) (*Auth, error) {
	return ExtractAuthDataFromCtx(r.Context())
}

// ExtractAuthDataFromCtx extracts the auth data from the provided context.
// The auth data must be present in the context. I.e. one of the auth middlewares
// must be used in order to populate the context.
func ExtractAuthDataFromCtx(ctx context.Context) (*Auth, error) {
	auth, ok := ctx.Value(AuthCtxKey).(*Auth)
	if !ok {
		return nil, errors.New("No se encontro autenticación en contexto")
	}

	return auth, nil
}
