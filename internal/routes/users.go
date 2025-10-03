package routes

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/vladwithcode/sibra-site/internal"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
)

func RegisterUserRoutes(router *customServeMux) {
	router.HandleFunc("POST /api/user", auth.WithAuthAccessLevelMiddleware(CreateUser, auth.AccessLevelAdmin))
	router.HandleFunc("PUT /api/users/{id}", auth.WithAuthAccessLevelMiddleware(UpdateUser, auth.AccessLevelAdmin))
	router.HandleFunc("PUT /api/users/{id}/password", auth.WithAuthAccessLevelMiddleware(UpdatePassword, auth.AccessLevelAdmin))
	router.HandleFunc("DELETE /api/users/{id}/pic", auth.WithAuthAccessLevelMiddleware(DeleteUserPicture, auth.AccessLevelAdmin))
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	data := db.User{}
	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()

	err := decoder.Decode(&data)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "La información proporcionada es inválida",
		})
		log.Printf("failed to parse json data: %v\n", err)
		return
	}

	data.Id = uuid.Must(uuid.NewV7()).String()
	_, err = db.CreateUser(&data)

	if err != nil {
		fmt.Printf("Create err: %v\n", err)

		if strings.Contains(err.Error(), "duplicate key") {
			respondWithError(w, http.StatusBadRequest, ErrorParams{
				ErrorMessage: "No se pudo crear el usuario, el email y/o telefono ya estan registrados",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado",
		})
		return
	}

	respondWithJSON(w, http.StatusCreated, rmap{
		"success": true,
		"user":    data,
	})
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
	templ, err := template.New("user.html").Funcs(template.FuncMap{
		"PrintRole": internal.PrintRole,
	}).ParseFiles(
		"web/templates/admin/user.html",
	)

	if err != nil {
		fmt.Printf("Parse templ err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	id := r.PathValue("id")
	user, err := db.GetUserById(id)

	fullname := r.FormValue("fullname")
	phone := r.FormValue("phone")
	email := r.FormValue("email")

	if err != nil {
		fmt.Printf("Get err: %v\n", err)
		w.WriteHeader(404)
		err = templ.ExecuteTemplate(w, "edit-user-form", map[string]any{
			"Error":        true,
			"ErrorMessage": "No se encontró al usuario con id " + id,
			"User": map[string]any{
				"Id": id,
			},
			"Data": map[string]any{
				"fullname": fullname,
				"email":    email,
				"phone":    phone,
			},
		})

		if err != nil {
			fmt.Printf("Exec error templ err: %v\n", err)
			respondWithError(w, 500, ErrorParams{})
			return
		}
		return
	}

	isFormInvalid := false
	invalid := db.InvalidFields{}

	if isFormInvalid {
		w.WriteHeader(400)
		templ.ExecuteTemplate(w, "edit-user-form", map[string]any{
			"Invalid": invalid,
			"User":    user,
			"Data": map[string]any{
				"fullname": fullname,
				"email":    email,
				"phone":    phone,
			},
		})
		return
	}

	user.Fullname = fullname
	user.Phone.String = phone
	user.Phone.Valid = phone != ""
	user.Email = email

	err = db.UpdateUser(user)

	if err != nil {
		fmt.Printf("Update user err: %v\n", err)
		w.WriteHeader(500)
		templ.ExecuteTemplate(w, "edit-user-form", map[string]any{
			"Error":        true,
			"ErrorMessage": "Ocurrió un error al actualizar al usuario",
			"User": map[string]any{
				"Id": id,
			},
			"Data": map[string]any{
				"fullname": fullname,
				"email":    email,
				"phone":    phone,
			},
		})
		return
	}

	templ.ExecuteTemplate(w, "edit-user-form", map[string]any{
		"Success": true,
		"User":    user,
	})
}

func UpdatePassword(w http.ResponseWriter, r *http.Request) {
	templ, err := template.New("user.html").Funcs(template.FuncMap{
		"PrintRole": internal.PrintRole,
	}).ParseFiles(
		"web/templates/admin/user.html",
	)

	if err != nil {
		fmt.Printf("Parse templ err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	id := r.PathValue("id")

	var (
		currentPass   string           = r.FormValue("pass")
		newPass       string           = r.FormValue("new-pass")
		confirmPass   string           = r.FormValue("confirm-pass")
		isFormInvalid bool             = false
		invalid       db.InvalidFields = db.InvalidFields{}
	)

	if currentPass == "" {
		invalid["pass"] = true
		isFormInvalid = true
	}
	if newPass == "" {
		invalid["newPass"] = true
		isFormInvalid = true
	}
	if confirmPass == "" {
		invalid["confirmPass"] = true
		isFormInvalid = true
	}

	if isFormInvalid {
		w.WriteHeader(400)
		templ.ExecuteTemplate(w, "change-pass", map[string]any{
			"Invalid": invalid,
			"User": map[string]any{
				"Id": id,
			},
		})
		return
	}

	user, err := db.GetUserById(id)

	if err != nil {
		fmt.Printf("Get err: %v\n", err)
		w.WriteHeader(404)
		err = templ.ExecuteTemplate(w, "change-pass", map[string]any{
			"Error":        true,
			"ErrorMessage": "No se encontró al usuario con id " + id,
			"User": map[string]any{
				"Id": id,
			},
		})

		if err != nil {
			fmt.Printf("Exec error templ err: %v\n", err)
			respondWithError(w, 500, ErrorParams{})
			return
		}
		return
	}

	err = user.ValidatePass(currentPass)

	if err != nil {
		w.WriteHeader(404)
		templ.ExecuteTemplate(w, "change-pass", map[string]any{
			"Error":        true,
			"ErrorMessage": "La contraseña actual es incorrecta",
			"User": map[string]any{
				"Id": id,
			},
		})
		return
	}

	if newPass != confirmPass {
		w.WriteHeader(404)
		templ.ExecuteTemplate(w, "change-pass", map[string]any{
			"Error":        true,
			"ErrorMessage": "Las contraseñas no coinciden",
			"User": map[string]any{
				"Id": id,
			},
		})
		return
	}

	err = user.HashPass(newPass)

	if err != nil {
		w.WriteHeader(500)
		templ.ExecuteTemplate(w, "change-pass", map[string]any{
			"Error":        true,
			"ErrorMessage": "Ocurrio un error al cambiar la contraseña",
			"User": map[string]any{
				"Id": id,
			},
		})
		return
	}

	err = db.UpdateUser(user)

	if err != nil {
		w.WriteHeader(500)
		templ.ExecuteTemplate(w, "change-pass", map[string]any{
			"Error":        true,
			"ErrorMessage": "Ocurrio un error al cambiar la contraseña",
			"User": map[string]any{
				"Id": id,
			},
		})
		return
	}

	templ.ExecuteTemplate(w, "change-pass", map[string]any{
		"Success": true,
		"User":    user,
	})
}

func UpdateUserPicture(w http.ResponseWriter, r *http.Request) {
	templ, err := template.New("user.html").Funcs(template.FuncMap{
		"PrintRole": internal.PrintRole,
	}).ParseFiles(
		"web/templates/admin/user.html",
	)

	if err != nil {
		fmt.Printf("Parse templ err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	id := r.PathValue("id")
	user, err := db.GetUserById(id)

	if err != nil {
		fmt.Printf("Get err: %v\n", err)
		w.WriteHeader(404)
		err = templ.ExecuteTemplate(w, "edit-pic-form", map[string]any{
			"Error":        true,
			"ErrorMessage": "No se encontró al usuario con id " + id,
			"User": map[string]any{
				"Id": id,
			},
		})

		if err != nil {
			fmt.Printf("Exec error templ err: %v\n", err)
			respondWithError(w, 500, ErrorParams{})
			return
		}
		return
	}

	mainPic, handle, err := r.FormFile("picture")
	if err != nil {
		fmt.Printf("Parse pic err: %v\n", err)
		w.WriteHeader(500)
		templ.ExecuteTemplate(w, "edit-pic-form", map[string]any{
			"Error":        true,
			"ErrorMessage": "Error al procesar la imagen",
			"User": map[string]any{
				"Id": id,
			},
		})
		return
	}
	defer mainPic.Close()

	filePath := "web/static/users"
	mainFileName := user.Id + filepath.Ext(handle.Filename)
	file, err := os.Create(filepath.Join(filePath, mainFileName))
	if err != nil {
		fmt.Printf("Create main file %v\n", err)
		w.WriteHeader(500)
		templ.ExecuteTemplate(w, "edit-pic-form", map[string]any{
			"Error":        true,
			"ErrorMessage": "Error al procesar la imagen",
			"User": map[string]any{
				"Id": id,
			},
		})
		return
	}
	defer file.Close()

	_, err = io.Copy(file, mainPic)
	if err != nil {
		fmt.Printf("Copy err: %v\n", err)
		w.WriteHeader(500)
		templ.ExecuteTemplate(w, "edit-pic-form", map[string]any{
			"Error":        true,
			"ErrorMessage": "Error al procesar la imagen",
			"User": map[string]any{
				"Id": id,
			},
		})
		return
	}
	user.Img = mainFileName

	err = db.UpdateUser(user)

	if err != nil {
		fmt.Printf("Update user err: %v\n", err)
		w.WriteHeader(500)
		templ.ExecuteTemplate(w, "edit-pic-form", map[string]any{
			"Error":        true,
			"ErrorMessage": "Error al procesar la imagen",
			"User": map[string]any{
				"Id": id,
			},
		})
		return
	}

	w.WriteHeader(201)
	templ.ExecuteTemplate(w, "edit-pic-form", map[string]any{
		"Success": true,
		"User":    user,
	})
}

func DeleteUserPicture(w http.ResponseWriter, r *http.Request) {
	templ, err := template.New("user.html").Funcs(template.FuncMap{
		"PrintRole": internal.PrintRole,
	}).ParseFiles(
		"web/templates/admin/user.html",
	)

	if err != nil {
		fmt.Printf("Parse templ err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	id := r.PathValue("id")
	user, err := db.GetUserById(id)

	if err != nil {
		fmt.Printf("Get err: %v\n", err)
		w.WriteHeader(404)
		err = templ.ExecuteTemplate(w, "del-pic-form", map[string]any{
			"Error":        true,
			"ErrorMessage": "No se encontró al usuario con id " + id,
		})

		if err != nil {
			fmt.Printf("Exec error templ err: %v\n", err)
			respondWithError(w, 500, ErrorParams{})
			return
		}
		return
	}

	fileName := filepath.Join("web/static/users", user.Img)
	err = os.Remove(fileName)

	if err != nil {
		w.WriteHeader(500)
		templ.ExecuteTemplate(w, "del-pic-form", map[string]any{
			"Error":        true,
			"ErrorMessage": "Error al eliminar la imagen",
		})
		log.Printf("Error deleting user picture: %v\n", err)
		return
	}
	user.Img = ""

	err = db.UpdateUser(user)

	if err != nil {
		fmt.Printf("Update user err: %v\n", err)
		w.WriteHeader(500)
		templ.ExecuteTemplate(w, "del-pic-form", map[string]any{
			"Error":        true,
			"ErrorMessage": "Error al eliminar la imagen",
		})
		return
	}

	w.WriteHeader(201)
	err = templ.ExecuteTemplate(w, "del-pic-form", map[string]any{
		"Success": true,
		"User":    user,
	})

	if err != nil {
		fmt.Printf("Exec error templ err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}
}
