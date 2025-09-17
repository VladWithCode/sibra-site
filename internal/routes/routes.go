package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"

	"github.com/vladwithcode/sibra-site/internal"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/templates/pages"
)

func NewRouter() http.Handler {
	router := NewCustomServeMux()

	// Api router
	// RegisterAdminRoutes(router)
	RegisterPropertyRoutes(router)
	RegisterPriceMapRoutes(router)
	RegisterUserRoutes(router)
	RegisterRequestsRouter(router)

	// Signup/Signin
	router.HandleFunc("GET /api/iniciar-sesion", auth.CheckAuthMiddleware(RenderSignin))

	// Serve static
	// *Might change it to serve static files through nginx
	fs := http.FileServer(http.Dir("web/static/"))
	router.Handle("GET /static/", http.StripPrefix("/static/", fs))

	// router.NotFoundHandleFunc(auth.CheckAuthMiddleware(render404Page))

	return router
}

func RenderIndex(w http.ResponseWriter, r *http.Request) {
	getFeatured := true
	orderBy := db.OrderByListingDate
	orderDir := db.OrderDirectionDESC
	propFilter := db.PropertyFilter{
		Featured:       &getFeatured,
		OrderBy:        &orderBy,
		OrderDirection: &orderDir,
	}
	featProps, err := db.GetProperties(&propFilter, 15, 1)
	if err != nil {
		fmt.Printf("Find feat err: %v\n", err)
		featProps = []*db.Property{}
	}

	getFeatured = false
	propFilter.Featured = &getFeatured
	newProps, err := db.GetProperties(&propFilter, 15, 1)

	if err != nil {
		fmt.Printf("Find new err: %v\n", err)
		newProps = []*db.Property{}
	}

	if len(featProps) < 15 {
		featProps = append(featProps, newProps...)
	}

	templ, err := template.New("layout.html").Funcs(template.FuncMap{
		"FormatMoney": internal.FormatMoney,
		"GetRowSpan": func(idx int) string {
			if idx%5 == 0 {
				return "2"
			}
			return "1"
		},
	}).ParseFiles(
		"web/templates/layout.html",
		"web/templates/index.html",
		"web/templates/prop-card.html",
	)

	if err != nil {
		fmt.Printf("err: %v\n", err)
		w.WriteHeader(500)
		w.Write([]byte("Ocurrio un error en el servidor"))
		return
	}

	err = templ.Execute(w, map[string]any{
		"FeatProps":     featProps,
		"NewProps":      newProps,
		"HideSearchBar": true,
	})

	if err != nil {
		fmt.Printf("err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
	}
}

func RenderTerms(w http.ResponseWriter, r *http.Request, user *auth.Auth) {
	component := pages.Legal("terms", user)
	component.Render(context.Background(), w)
}

func RenderPrivacy(w http.ResponseWriter, r *http.Request, user *auth.Auth) {
	component := pages.Legal("privacy", user)
	component.Render(context.Background(), w)
}

func RenderSignin(w http.ResponseWriter, r *http.Request, auth *auth.Auth) {
	if auth.Id != "" {
		http.Redirect(w, r, "/dashboard", 302)
		return
	}

}

type ErrorParams struct {
	ErrorMessage string
	Etc          map[string]any
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
