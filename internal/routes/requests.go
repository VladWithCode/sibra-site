package routes

import (
	"database/sql"
	"fmt"
	"net/http"
	"text/template"
	"time"

	"github.com/google/uuid"
	"github.com/vladwithcode/sibra-site/internal/db"
)

func RegisterRequestsRouter(r *customServeMux) {
	r.HandleFunc("POST /api/requests", CreateRequest)
}

func CreateRequest(w http.ResponseWriter, r *http.Request) {
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

	scheduledDate := r.FormValue("scheduled_date")
	var schTime time.Time
	if scheduledDate != "" {
		schTime, err = time.Parse("2006-01-02", scheduledDate)
		if err != nil {
			invalidFields["scheduledDate"] = true
			formIsInvalid = true
		}
	}
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
		date, err = time.Parse("2006-01-02", dateStr)

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
		reqType = db.RequestTypeQuote
	}
	status := r.FormValue("status")
	if status == "" {
		status = db.RequestStatusPending
	}

	id, _ := uuid.NewV7()
	req := db.Request{
		Id:            id.String(),
		Type:          reqType,
		Phone:         phone,
		Name:          name,
		Date:          date,
		Status:        status,
		Agent:         agent,
		Property:      sql.NullString{String: propId, Valid: propId != ""},
		ScheduledDate: sql.NullTime{Time: schTime, Valid: scheduledDate != ""},
	}

	if req.ScheduledDate.Valid {
		req.Status = db.RequestStatusScheduled
	}

	err = db.CreateRequest(&req)

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
}
