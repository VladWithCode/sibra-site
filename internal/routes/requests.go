package routes

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"text/template"
	"time"

	"github.com/google/uuid"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/wsp"
)

func RegisterRequestsRouter(r *customServeMux) {
	r.HandleFunc("POST /api/requests", CreateRequest)
}

func CreateRequest(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	templ, err := template.ParseFiles("web/templates/request-form.html")
	if err != nil {
		fmt.Printf("Parse templ err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	err = r.ParseForm()
	if err != nil {
		fmt.Printf("Parse Form err: %v\n", err)
		templ.ExecuteTemplate(w, "request-form", map[string]any{
			"Error": "El formulario contiene información inválida",
		})
		return
	}

	invalidFields := db.InvalidFields{}
	formIsInvalid := false

	propId := r.FormValue("property")
	phone := r.FormValue("phone")
	if phone == "" {
		invalidFields["phone"] = true
		formIsInvalid = true
	}
	name := r.FormValue("name")
	if name == "" {
		invalidFields["name"] = true
		formIsInvalid = true
	}
	agent := r.FormValue("agent")
	if agent == "" {
		invalidFields["agent"] = true
		formIsInvalid = true
	}
	date := time.Now()
	dateStr := r.FormValue("date")
	if dateStr != "" {
		date, err = time.Parse("2006-01-02 15:04", dateStr)

		if err != nil {
			invalidFields["date"] = true
			formIsInvalid = true
		}
	}

	data := map[string]any{}
	for k, v := range r.Form {
		data[k] = v[0]
	}
	if formIsInvalid {
		w.WriteHeader(400)
		templ.ExecuteTemplate(w, "request-form", map[string]any{
			"Invalid": invalidFields,
			"Error":   true,
			"Data":    data,
		})
		return
	}

	reqType := r.FormValue("type")
	if reqType == "" {
		reqType = string(db.RequestTypeQuote)
	}
	status := r.FormValue("status")
	if status == "" {
		status = string(db.RequestStatusPending)
	}

	id, _ := uuid.NewV7()
	req := db.Request{
		Id:            id.String(),
		Type:          db.RequestType(reqType),
		Phone:         phone,
		Name:          name,
		ScheduledDate: date,
		Status:        db.RequestStatus(status),
		Agent:         agent,
		Property:      propId,
	}

	if req.ScheduledDate.IsZero() == false {
		req.Status = db.RequestStatusPending
	}

	err = db.CreateRequest(ctx, &req)

	if err != nil {
		fmt.Printf("Create req err: %v\n", err)
		w.WriteHeader(500)
		templ.ExecuteTemplate(w, "request-form", map[string]any{
			"Data":  data,
			"Error": "Ocurrió un error al procesar la solicitud",
		})
		return
	}

	err = templ.ExecuteTemplate(w, "request-form", map[string]any{
		"Data":    data,
		"Success": true,
	})

	go func() {
		wspData := wsp.TemplateData{
			TemplateName: "info_request",
			BodyVars: []wsp.TemplateVar{
				{
					"type": "text",
					"text": req.Name,
				},
				{
					"type": "text",
					"text": req.ScheduledDate.Format("02/01/2006 15:04"),
				},
				{
					"type": "text",
					"text": req.Phone,
				},
			},
		}
		notifPhone := os.Getenv(wsp.EnvVarNotificationPhone)
		if notifPhone == "" {
			log.Printf("Could not send whatsapp message. Notification phone envvar is not set %v", notifPhone)
			return
		}

		err = wsp.SendTemplateMessage(notifPhone, wspData)
		if err != nil {
			log.Printf("Could not send whatsapp message: %v", err)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		req.WspSent = true
		err = db.UpdateRequest(ctx, &req)
		if err != nil {
			log.Printf("Failed to mark request (%s) as sent: %v", req.Id, err)
			return
		}
	}()
}
