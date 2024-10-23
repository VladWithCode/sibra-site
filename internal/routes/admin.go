package routes

import (
	"fmt"
	"html/template"
	"net/http"
	"strings"
	"time"

	"github.com/vladwithcode/sibra-site/internal"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
)

func RegisterAdminRoutes(router *http.ServeMux) {
	// Signin
	router.HandleFunc("GET /admin/iniciar-sesion", auth.CheckAuthMiddleware(RenderAdminSignIn))
	router.HandleFunc("POST /admin/sign-in", auth.CheckAuthMiddleware(AdminSignIn))

	router.HandleFunc("GET /admin", auth.WithAuthMiddleware(RenderDashboard))
	router.HandleFunc("GET /admin/propiedades", auth.WithAuthMiddleware(RenderAdminProperties))
	router.HandleFunc("GET /admin/propiedades/nueva", auth.WithAuthMiddleware(RenderNewProperty))
	router.HandleFunc("GET /admin/propiedades/eliminar/{id}", auth.WithAuthMiddleware(RenderDeleteProperty))

	router.HandleFunc("GET /admin/mi-usuario", auth.WithAuthMiddleware(RenderUserProfile))
}

func RenderDashboard(w http.ResponseWriter, r *http.Request, a *auth.Auth) {
	templ, err := template.ParseFiles("web/templates/admin/layout.html", "web/templates/admin/dashboard.html")

	if err != nil {
		fmt.Printf("Parse err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	err = templ.Execute(w, map[string]any{
		"User": a,
	})

	if err != nil {
		fmt.Printf("Execute err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}
}

func RenderAdminProperties(w http.ResponseWriter, r *http.Request, a *auth.Auth) {
	properties, findErr := db.GetProperties(&db.PropertyFilter{}, 900, 1)

	if findErr != nil {
		fmt.Printf("findErr: %v\n", findErr)
		properties = []*db.Property{}
	}

	templ, err := template.New("layout.html").Funcs(template.FuncMap{
		"FormatMoney": internal.FormatMoney,
	}).ParseFiles(
		"web/templates/admin/layout.html",
		"web/templates/admin/properties.html",
		"web/templates/admin/property-card.html",
	)

	if err != nil {
		fmt.Printf("Parse err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	err = templ.Execute(w, map[string]any{
		"User":       a,
		"FindErr":    findErr,
		"Properties": properties,
	})

	if err != nil {
		fmt.Printf("Execute err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}
}

func RenderNewProperty(w http.ResponseWriter, r *http.Request, a *auth.Auth) {
	templ, err := template.ParseFiles(
		"web/templates/admin/layout.html",
		"web/templates/admin/new-property.html",
		"web/templates/admin/prop-form.html",
		"web/templates/admin/pic-form.html",
	)

	if err != nil {
		fmt.Printf("Parse err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	err = templ.Execute(w, map[string]any{
		"User": a,
	})

	if err != nil {
		fmt.Printf("Execute err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}
}

	id := r.PathValue("id")

	if err != nil {



	if err != nil {
	}
}

func RenderDeleteProperty(w http.ResponseWriter, r *http.Request, a *auth.Auth) {
	id := r.PathValue("id")
	prop, err := db.FindPropertyById(id)
	if err != nil {
		if strings.Contains(err.Error(), "no rows in result set") {
			respondWithError(w, 404, ErrorParams{ErrorMessage: "No se encontró la propiedad"})
			return
		}

		fmt.Printf("Find prop err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	templ, err := template.ParseFiles(
		"web/templates/admin/layout.html",
		"web/templates/admin/delete-prop.html",
	)

	if err != nil {
		fmt.Printf("Parse err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	err = templ.Execute(w, map[string]any{
		"User": a,
		"Data": map[string]any{
			"id":    id,
			"title": prop.Address + ", " + prop.NbHood + " " + prop.Zip,
		},
	})

	if err != nil {
		fmt.Printf("Execute err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}
}

func RenderAdminSignIn(w http.ResponseWriter, r *http.Request, a *auth.Auth) {
	if a.Id != "" {
		http.Redirect(w, r, "/admin", 302)
		return
	}

	templ, err := template.ParseFiles("web/templates/layout.html", "web/templates/sign-in.html")

	if err != nil {
		fmt.Printf("Parse templ err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	err = templ.Execute(w, map[string]any{
		"IsUserSignIn": false,
	})

	if err != nil {
		fmt.Printf("Execute templ err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}
}

func AdminSignIn(w http.ResponseWriter, r *http.Request, a *auth.Auth) {
	err := r.ParseForm()

	if err != nil {
		fmt.Printf("Parse Form err: %v\n", err)
		respondWithError(
			w,
			400,
			ErrorParams{ErrorMessage: "El formulario contiene información invalida"},
		)
		return
	}
	data := struct {
		Username string
		Password string
	}{
		Username: r.Form.Get("username"),
		Password: r.Form.Get("password"),
	}

	user, err := db.GetUserByUsername(data.Username)

	if err != nil {
		fmt.Printf("Get Error: %v\n", err)
		respondWithError(w, 400, ErrorParams{ErrorMessage: "No se encontro usuario."})
		return
	}

	err = user.ValidatePass(data.Password)

	if err != nil {
		respondWithError(w, 400, ErrorParams{ErrorMessage: "Contraseña inválida"})
		return
	}

	t, err := auth.CreateToken(user)

	if err != nil {
		fmt.Printf("CreateToken err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	jwtCookie := &http.Cookie{
		Name:     "auth_token",
		Value:    t,
		Expires:  time.Now().Add(6 * time.Hour),
		HttpOnly: true,
		//Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
	}

	http.SetCookie(w, jwtCookie)
	w.Header().Add("HX-Location", "/admin")
	w.Header().Add("Content-Type", "text/html")
	w.Write([]byte("<p>Inicio exitoso</p>"))
}

func RenderUserProfile(w http.ResponseWriter, r *http.Request, a *auth.Auth) {
	templ, err := template.New("layout.html").Funcs(template.FuncMap{
		"PrintRole": internal.PrintRole,
	}).ParseFiles(
		"web/templates/admin/layout.html",
		"web/templates/admin/user.html",
	)

	if err != nil {
		fmt.Printf("Get user err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	id := a.Id
	user, err := db.GetUserById(id)

	if err != nil {
		fmt.Printf("Get user err: %v\n", err)
		err = templ.Execute(w, map[string]any{
			"Error": "No se encontró el usuario",
		})
		if err != nil {
			fmt.Printf("Exec error templ err: %v\n", err)
			respondWithError(w, 500, ErrorParams{})
			return
		}

		return
	}

	err = templ.Execute(w, map[string]any{
		"User": user,
	})

	if err != nil {
		fmt.Printf("Exec err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
	}
}
