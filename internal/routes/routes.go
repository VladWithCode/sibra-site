package routes

import (
	"fmt"
	"html/template"
	"net/http"

	"github.com/vladwithcode/sibra-site/internal"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
)

func NewRouter() http.Handler {
	router := NewCustomServeMux()

	router.HandleFunc("GET /{$}", RenderIndex)
	router.HandleFunc("GET /terminos-servicio", auth.CheckAuthMiddleware(RenderTerms))
	router.HandleFunc("GET /politica-privacidad", auth.CheckAuthMiddleware(RenderPrivacy))

	// Api router
	RegisterPropertyRoutes(router)
	RegisterPriceMapRoutes(router)
	RegisterAdminRoutes(router)
	RegisterUserRoutes(router)
	RegisterRequestsRouter(router)

	// Signup/Signin
	//router.HandleFunc("GET /registrarse", auth.CheckAuthMiddleware(RenderSignin))
	router.HandleFunc("GET /iniciar-sesion", auth.CheckAuthMiddleware(RenderSignin))
	router.HandleFunc("GET /signin", auth.CheckAuthMiddleware(RenderSignin))

	// Serve static
	// *Might change it to serve static files through nginx
	fs := http.FileServer(http.Dir("web/static/"))
	router.Handle("GET /static/", http.StripPrefix("/static/", fs))

	router.NotFoundHandleFunc(auth.CheckAuthMiddleware(render404Page))

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

func RenderPrivacy(w http.ResponseWriter, r *http.Request, auth *auth.Auth) {
	templ, err := template.ParseFiles("web/templates/layout.html", "web/templates/privacy.html")

	if err != nil {
		fmt.Printf("Parse templ err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	err = templ.Execute(w, map[string]any{
		"User": auth,
	})

	if err != nil {
		fmt.Printf("Exec templ err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}
}

func RenderTerms(w http.ResponseWriter, r *http.Request, auth *auth.Auth) {
	templ, err := template.ParseFiles("web/templates/layout.html", "web/templates/terms.html")

	if err != nil {
		fmt.Printf("Parse templ err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	err = templ.Execute(w, map[string]any{
		"User": auth,
	})

	if err != nil {
		fmt.Printf("Exec templ err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}
}

func RenderSignin(w http.ResponseWriter, r *http.Request, auth *auth.Auth) {
	if auth.Id != "" {
		http.Redirect(w, r, "/dashboard", 302)
		return
	}

	templ, err := template.ParseFiles("web/templates/layout.html", "web/templates/sign-in.html")

	if err != nil {
		fmt.Println(err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	data := map[string]any{
		"User": auth,
	}

	templ.Execute(w, data)
}

func render404Page(w http.ResponseWriter, _ *http.Request, auth *auth.Auth) {
	templ, err := template.ParseFiles("web/templates/layout.html", "web/templates/404.html")

	if err != nil {
		fmt.Printf("err: %v\n", err)
		panic(err)
	}

	err = templ.Execute(w, map[string]any{
		"User": auth,
	})

	if err != nil {
		fmt.Printf("err: %v\n", err)
		panic(err)
	}
}

type ErrorParams struct {
	ErrorMessage string
	ElementId    string
	ElementClass string
}

func respondWithError(w http.ResponseWriter, code int, params ErrorParams) {
	w.Header().Set("Content-Type", "text/plain")
	if code == http.StatusInternalServerError {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Ocurrio un error inesperado en el servidor"))
		return
	}

	templ, err := template.ParseFiles("web/templates/responses/error.html")

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Ocurrio un error inesperado en el servidor"))
		return
	}

	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(code)
	err = templ.Execute(w, params)

	if err != nil {
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(params.ErrorMessage))
		return
	}
}
