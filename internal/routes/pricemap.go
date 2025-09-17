package routes

import (
	"fmt"
	"html/template"
	"net/http"
)

func RegisterPriceMapRoutes(router *customServeMux) {
	router.HandleFunc("GET /api/mapa", RenderMap)
}

func RenderMap(w http.ResponseWriter, r *http.Request) {
	templ, err := template.ParseFiles("web/templates/layout.html", "web/templates/price-map.html")

	if err != nil {
		fmt.Printf("Parse template err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	err = templ.Execute(w, map[string]any{})

	if err != nil {
		fmt.Printf("Execute template err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}
}
