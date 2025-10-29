package routes

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/google/uuid"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/wsp"
)

func RegisterRequestsRouter(r *customServeMux) {
	r.HandleFunc("POST /api/citas", CreateRequest)

	r.HandleFunc("POST /api/citas/conquistadores", CreateConquistadoresRequest)
	r.HandleFunc("POST /api/citas/demo", auth.ValidateAuthMiddleware(CreateDemoQuote))
}

func CreateRequest(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	req := db.Request{}
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Invalid request body",
		})
		return
	}

	var prop *db.Property
	if req.Property != "" {
		prop, err = db.FindPropertyById(ctx, req.Property)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, ErrorParams{
				ErrorMessage: "Ocurrió un error al buscar la propiedad",
			})
			log.Printf("Error finding property: %v\n", err)
			return
		}

		req.Agent = prop.Agent
		req.Property = prop.Id
	}

	err = db.CreateRequest(ctx, &req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al crear la solicitud",
		})
		log.Printf("Failed to create request: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"request": req,
	})
}

func CreateConquistadoresRequest(w http.ResponseWriter, r *http.Request) {
	var req db.ConqsRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Intenta de nuevo más tarde.",
		})
		log.Printf("Error parsing request body: %v\n", err)
		return
	}

	tplData := wsp.TemplateData{
		TemplateName: "conqs_quote_request",
		BodyVars: []wsp.TemplateVar{
			{
				"type": "text",
				"text": req.Name,
			},
			{
				"type": "text",
				"text": req.Phone,
			},
		},
		Language: "es",
	}

	if req.Schedule != "" {
		tplData.BodyVars = append(tplData.BodyVars, wsp.TemplateVar{
			"type": "text",
			"text": req.Schedule,
		})
	} else {
		tplData.BodyVars = append(tplData.BodyVars, wsp.TemplateVar{
			"type": "text",
			"text": "sin especificar",
		})
	}

	notifPhone := os.Getenv(wsp.EnvVarNotificationPhone)
	if notifPhone == "" {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "No es posible procesar tu solicitud por el momento. Por favor, intenta de nuevo más tarde.",
		})
		log.Printf("Notification phone not set.\n")
		return
	}

	err = wsp.SendTemplateMessage(notifPhone, tplData)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al enviar la solicitud. Intenta de nuevo más tarde.",
		})
		log.Printf("Error sending request: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
	})

	go func() {
		ctx := context.Background()
		err := db.CreateRequest(ctx, &db.Request{
			Id:    uuid.Must(uuid.NewV7()).String(),
			Type:  db.RequestTypeQuote,
			Phone: req.Phone,
			Name:  req.Name,
		})

		if err != nil {
			log.Printf("Error creating request: %v\n", err)
			return
		}
	}()
}

func CreateDemoQuote(w http.ResponseWriter, r *http.Request) {
	var req db.ConqsRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Ocurrió un error al procesar la solicitud. Intenta de nuevo más tarde.",
		})
		log.Printf("Error parsing request body: %v\n", err)
		return
	}

	invalidFields := make(map[string]bool)
	if req.Name == "" {
		invalidFields["name"] = true
	}

	if req.Phone == "" {
		invalidFields["phone"] = true
	}

	if len(invalidFields) > 0 {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "No se pudo procesar la solicitud porque faltan datos obligatorios.",
			Etc: rmap{
				"formInvalid":   true,
				"invalidFields": invalidFields,
			},
		})
		log.Printf("Error parsing request body: %v\n", err)
		return
	}

	tplData := wsp.TemplateData{
		TemplateName: "info_request",
		BodyVars: []wsp.TemplateVar{
			{
				"type": "text",
				"text": req.Name,
			},
			{
				"type": "text",
				"text": req.Phone,
			},
		},
	}

	if req.Schedule != "" {
		tplData.BodyVars = append(tplData.BodyVars, wsp.TemplateVar{
			"type": "text",
			"text": req.Schedule,
		})
	} else {
		tplData.BodyVars = append(tplData.BodyVars, wsp.TemplateVar{
			"type": "text",
			"text": "sin especificar",
		})
	}

	notifPhone := os.Getenv(wsp.EnvVarNotificationPhone)
	if notifPhone == "" {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "No es posible procesar tu solicitud por el momento. Por favor, intenta de nuevo más tarde.",
		})
		log.Printf("Notification phone not set.\n")
		return
	}

	u, _ := auth.ExtractAuthDataFromRequest(r)
	log.Printf("Sending demo quote request for user: %s\n", u.Username)

	err = wsp.SendTemplateMessage(notifPhone, tplData)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al enviar la solicitud. Intenta de nuevo más tarde.",
		})
		log.Printf("Error sending request: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
	})

	go func() {
		ctx := context.Background()
		err := db.CreateRequest(ctx, &db.Request{
			Id:    uuid.Must(uuid.NewV7()).String(),
			Type:  db.RequestTypeQuote,
			Phone: req.Phone,
			Name:  req.Name,
		})

		if err != nil {
			log.Printf("Error creating request: %v\n", err)
			return
		}
	}()
}
