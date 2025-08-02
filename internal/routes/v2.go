package routes

import (
	"context"
	"net/http"

	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/templates/pages"
)

func RegisterV2Routes(router *customServeMux) {
	// Public routes
	router.HandleFunc("GET /v2/{$}", RenderIndexV2)
	router.HandleFunc("GET /v2/terminos-servicio", auth.CheckAuthMiddleware(RenderTermsV2))
	router.HandleFunc("GET /v2/politica-privacidad", auth.CheckAuthMiddleware(RenderPrivacyV2))
	router.HandleFunc("GET /v2/iniciar-sesion", auth.CheckAuthMiddleware(RenderSigninV2))
	router.HandleFunc("GET /v2/mapa", RenderMapV2)
	router.HandleFunc("GET /v2/propiedades/{contract}", RenderPropertiesV2)
	router.HandleFunc("GET /v2/propiedades/{contract}/{id}", RenderPropertyV2)

	// Admin routes
	router.HandleFunc("GET /v2/admin/{$}", auth.WithAuthMiddleware(RenderDashboardV2))
	router.HandleFunc("GET /v2/admin/propiedades", auth.WithAuthMiddleware(RenderAdminPropertiesV2))
	router.HandleFunc("GET /v2/admin/propiedades/nueva", auth.WithAuthMiddleware(RenderNewPropertyV2))
	router.HandleFunc("GET /v2/admin/propiedades/editar/{id}", auth.WithAuthMiddleware(RenderUpdatePropertyV2))
	router.HandleFunc("GET /v2/admin/mi-usuario", auth.WithAuthMiddleware(RenderUserProfileV2))
}

func RenderIndexV2(w http.ResponseWriter, r *http.Request) {
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
		featProps = []*db.Property{}
	}

	getFeatured = false
	propFilter.Featured = &getFeatured
	newProps, err := db.GetProperties(&propFilter, 15, 1)
	if err != nil {
		newProps = []*db.Property{}
	}

	if len(featProps) < 15 {
		featProps = append(featProps, newProps...)
	}

	component := pages.Index(featProps, newProps, nil)
	component.Render(context.Background(), w)
}

func RenderTermsV2(w http.ResponseWriter, r *http.Request, user *auth.Auth) {
	component := pages.Legal("terms", user)
	component.Render(context.Background(), w)
}

func RenderPrivacyV2(w http.ResponseWriter, r *http.Request, user *auth.Auth) {
	component := pages.Legal("privacy", user)
	component.Render(context.Background(), w)
}

func RenderSigninV2(w http.ResponseWriter, r *http.Request, user *auth.Auth) {
	if user.Id != "" {
		http.Redirect(w, r, "/v2/admin", 302)
		return
	}
	component := pages.Auth(user)
	component.Render(context.Background(), w)
}

func RenderMapV2(w http.ResponseWriter, r *http.Request) {
	component := pages.PriceMap(nil)
	component.Render(context.Background(), w)
}

func RenderPropertiesV2(w http.ResponseWriter, r *http.Request) {
	contract := r.PathValue("contract")
	// TODO: Implement property filtering logic from original handler
	component := pages.Properties(contract, []*db.Property{}, nil)
	component.Render(context.Background(), w)
}

func RenderPropertyV2(w http.ResponseWriter, r *http.Request) {
	contract := r.PathValue("contract")
	id := r.PathValue("id")
	// TODO: Implement property fetching logic from original handler
	component := pages.Property(contract, id, nil, []*db.Property{}, nil)
	component.Render(context.Background(), w)
}

func RenderDashboardV2(w http.ResponseWriter, r *http.Request, user *auth.Auth) {
	component := pages.AdminDashboard(user)
	component.Render(context.Background(), w)
}

func RenderAdminPropertiesV2(w http.ResponseWriter, r *http.Request, user *auth.Auth) {
	// TODO: Implement property fetching logic from original handler
	component := pages.AdminProperties([]*db.Property{}, user)
	component.Render(context.Background(), w)
}

func RenderNewPropertyV2(w http.ResponseWriter, r *http.Request, user *auth.Auth) {
	component := pages.AdminPropertyForm(nil, user)
	component.Render(context.Background(), w)
}

func RenderUpdatePropertyV2(w http.ResponseWriter, r *http.Request, user *auth.Auth) {
	id := r.PathValue("id")
	// TODO: Implement property fetching logic from original handler
	_ = id
	component := pages.AdminPropertyForm(nil, user)
	component.Render(context.Background(), w)
}

func RenderUserProfileV2(w http.ResponseWriter, r *http.Request, user *auth.Auth) {
	component := pages.AdminUserProfile(user)
	component.Render(context.Background(), w)
}
