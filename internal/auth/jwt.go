package auth

import (
	"fmt"
	"html/template"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/vladwithcode/sibra-site/internal/db"
)

type Auth struct {
	Id       string
	Username string
	Fullname string
	Role     string
}

type AuthedHandler func(w http.ResponseWriter, r *http.Request, auth *Auth)

type AuthClaims struct {
	Id       string
	Username string
	Fullname string
	Role     string

	jwt.RegisteredClaims
}

func CreateToken(user *db.User) (string, error) {
	var (
		t *jwt.Token
		k = os.Getenv("JWT_SECRET")
	)
	expTime := time.Now().Add(6 * time.Hour)

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

func ParseToken(tokenStr string) (*jwt.Token, error) {
	var (
		t *jwt.Token
		k = os.Getenv("JWT_SECRET")
	)

	t, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
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

func CheckAuthMiddleware(next AuthedHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookieToken, err := r.Cookie("auth_token")
		var auth = &Auth{}
		defer next(w, r, auth)

		if err != nil {
			return
		}

		tokenStr := strings.Split(cookieToken.String(), "=")

		if len(tokenStr) < 2 {
			return
		}

		t, err := ParseToken(tokenStr[1])

		if err != nil {
			return
		}

		if claims, ok := t.Claims.(jwt.MapClaims); ok && t.Valid {
			var (
				id, ok1       = claims["Id"].(string)
				username, ok2 = claims["Username"].(string)
				role, ok3     = claims["Role"].(string)
				fullname, ok4 = claims["Fullname"].(string)
			)

			if !ok1 || !ok2 || !ok3 || !ok4 {
				return
			}

			auth.Id = id
			auth.Role = role
			auth.Username = username
			auth.Fullname = fullname
		}
	}
}

func WithAuthMiddleware(next AuthedHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookieToken, err := r.Cookie("auth_token")

		if err != nil {
			RejectUnauthenticated(w, r, "No se encontro token")
			return
		}

		tokenStr := strings.Split(cookieToken.String(), "=")

		if len(tokenStr) < 2 {
			RejectUnauthenticated(w, r, "Token invalido")
			return
		}

		t, err := ParseToken(tokenStr[1])

		if err != nil {
			fmt.Printf("ParseToken err: %v\n", err)
			RejectUnauthenticated(w, r, "Sesion Token invalido")
			return
		}

		if claims, ok := t.Claims.(jwt.MapClaims); ok && t.Valid {
			var (
				id, ok1       = claims["Id"].(string)
				username, ok2 = claims["Username"].(string)
				role, ok3     = claims["Role"].(string)
				fullname, ok4 = claims["Fullname"].(string)
			)

			if !ok1 || !ok2 || !ok3 || !ok4 {
				return
			}

			next(w, r, &Auth{
				Id:       id,
				Username: username,
				Role:     role,
				Fullname: fullname,
			})
		} else {
			RejectUnauthenticated(w, r, "Sesion Token invalido")
		}
	}
}

func RejectUnauthenticated(w http.ResponseWriter, r *http.Request, reason string) {
	w.Header().Add("Content-Type", "text/html")
	templ, err := template.ParseFiles("web/templates/layout.html", "web/templates/sign-in.html")

	if err != nil {
		fmt.Printf("Reject Unauth err: %v", err)
		w.WriteHeader(500)

		http.SetCookie(w, &http.Cookie{
			Name:     "auth_token",
			Value:    "",
			Expires:  time.Unix(0, 0),
			HttpOnly: true,
			// Secure: true,
			SameSite: http.SameSiteStrictMode,
		})
		w.Write([]byte("<p>Ocurrió un error inesperado</p>"))
		return
	}

	w.Header().Add("HX-Location", "/iniciar-sesion")
	w.WriteHeader(401)
	templ.Execute(w, nil)
}
