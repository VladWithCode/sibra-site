package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/vladwithcode/sibra-site/internal"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/templates"
	"github.com/vladwithcode/sibra-site/internal/templates/components"
)

func RegisterPropertyRoutes(router *customServeMux) {
	router.HandleFunc("GET /api/propiedades/{contract}", FindProperties)
	router.HandleFunc("GET /api/propiedades/{contract}/{id}", FindPropertyWithNearbyProps)
	router.HandleFunc("POST /api/property", auth.WithAuthMiddleware(CreateProperty))
	router.HandleFunc("PUT /api/property/{id}", auth.WithAuthMiddleware(UpdateProperty))
	router.HandleFunc("DELETE /api/property/{id}/delete", auth.WithAuthMiddleware(DeletePropertyById))
	router.HandleFunc("POST /api/property/pictures/{id}", auth.WithAuthMiddleware(UploadPropertyPictures))
	// router.HandleFunc("DELETE /api/property/pictures/{id}", auth.WithAuthMiddleware(UploadPropertyPictures))
}

func CreateProperty(w http.ResponseWriter, r *http.Request, a *auth.Auth) {
	property := db.Property{}
	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close()
	err := decoder.Decode(&property)
	if err != nil {
		respondWithError(w, 400, ErrorParams{
			ErrorMessage: "El formulario contiene información erronea.",
		})
		log.Printf("Malformed json data: %v\n", err)
		return
	}

	id := uuid.Must(uuid.NewV7()).String()
	property.Id = id
	property.SetSlug()
	property.SyncLatLon()

	err = db.CreateProperty(&property)
	if err != nil {
		respondWithError(w, 400, ErrorParams{
			ErrorMessage: "Error al crear la propiedad",
		})
		log.Printf("Create err: %v\n", err)
		return
	}

	resData, err := json.Marshal(map[string]any{
		"property": property,
	})
	if err != nil {
		respondWithError(w, 500, ErrorParams{})
		return
	}
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(200)
	w.Write(resData)

	err = property.CreateStaticDir()

	if err != nil {
		fmt.Printf("Error creating static dir for prop: %v\n", property.Id)
	}
}

func UpdateProperty(w http.ResponseWriter, r *http.Request, a *auth.Auth) {
	defer r.Body.Close()
	newProperty := db.Property{}
	err := json.NewDecoder(r.Body).Decode(&newProperty)

	if err != nil {
		fmt.Printf("parse form err: %v\n", err)
		w.WriteHeader(400)
		w.Write([]byte("No se pudo procesar el formulario"))
		return
	}
	newProperty.Id = r.PathValue("id")

	err = db.UpdateProperty(&newProperty)

	if err != nil {
		fmt.Printf("update err: %v\n", err)
		w.WriteHeader(400)
		w.Write([]byte("No se pudo actualizar la propiedad"))
		return
	}

	err = components.UpdatePropForm(
		&newProperty,
		&templates.InvalidFields{},
		true,
	).Render(context.Background(), w)
	if err != nil {
		panic(err)
	}
}

func UploadPropertyPictures(w http.ResponseWriter, r *http.Request, a *auth.Auth) {
	id := r.PathValue("id")

	err := r.ParseMultipartForm(90 << 20)
	if err != nil {
		fmt.Printf("parse form err: %v\n", err)
		w.WriteHeader(400)
		w.Write([]byte("El formulario no pudo ser procesado"))
		return
	}

	property, err := db.FindPropertyById(id)

	if err != nil {
		fmt.Printf("Find err: %v\n", err)
		w.WriteHeader(404)
		w.Write([]byte("No se encontró la propiedad solicitada"))
		return
	}

	filePath := filepath.Join("web/static/properties", property.Id)
	err = os.MkdirAll(filePath, 0644)

	if err != nil && !os.IsExist(err) {
		fmt.Printf("Create dir err: %v\n", err)
		w.WriteHeader(500)
		w.Write([]byte("Error al crear el directorio para la propiedad"))
		return
	}

	pics := r.MultipartForm.File["pics"]
	for _, fileHeader := range pics {
		pic, err := fileHeader.Open()
		fmt.Printf("pic: %v\n", pic)
		if err != nil {
			fmt.Printf("Open file err: %v\n", err)
			w.WriteHeader(500)
			w.Write([]byte("Error al procesar las imagenes"))
			return
		}
		defer pic.Close()

		fileName := time.Now().Format("20060102-150405") + "-" + uuid.NewString() + filepath.Ext(fileHeader.Filename)
		filep := filepath.Join(filePath, fileName)
		outFile, err := os.Create(filep)
		if err != nil {
			fmt.Printf("Create outfile err: %v\n", err)
			w.WriteHeader(500)
			w.Write([]byte("Error al guardar las imagenes"))
			return
		}
		defer outFile.Close()

		_, err = io.Copy(outFile, pic)
		if err != nil {
			fmt.Printf("Write file err: %v\n", err)
			w.WriteHeader(500)
			w.Write([]byte("Error al guardar las imagenes"))
			return
		}

		property.Images = append(property.Images, fileName)
	}

	mainPic, handle, err := r.FormFile("main-pic")
	if err != nil && !strings.Contains(err.Error(), "no such file") {
		fmt.Printf("Parse pic err: %v\n", err)
		w.WriteHeader(500)
		w.Write([]byte("Error al procesar la imagen"))
		return
	}

	if handle != nil {
		defer mainPic.Close()

		mainFileName := "main-pic" + filepath.Ext(handle.Filename)
		file, err := os.Create(filepath.Join(filePath, mainFileName))
		if err != nil {
			fmt.Printf("Create main file err: %v\n", err)
			w.WriteHeader(500)
			w.Write([]byte("Error al guardar la imagen principal"))
			return
		}
		defer file.Close()

		_, err = io.Copy(file, mainPic)
		if err != nil {
			fmt.Printf("Copy err: %v\n", err)
			w.WriteHeader(500)
			w.Write([]byte("Error al guardar la imagen principal"))
			return
		}
		property.MainImg = mainFileName
	}

	delPicIds := r.MultipartForm.Value["delPics"]
	if len(delPicIds) > 0 {
		newPics := [12]string{}
		i := 0
		for _, img := range property.Images {
			if !slices.Contains(delPicIds, img) && img != "" {
				newPics[i] = img
				i++
			}
		}

		property.Images = newPics[:i]
	}

	err = db.UpdatePropertyImages(property.Id, property.Images)
	err = db.UpdatePropertyMainImg(property.Id, property.MainImg)

	if err != nil {
		fmt.Printf("Write file err: %v\n", err)
		w.WriteHeader(500)
		w.Write([]byte("Error al procesar las imagenes"))
		return
	}

	err = components.UpdatePropImagesForm(property, true).Render(context.Background(), w)
	if err != nil {
		panic(err)
	}
}

func DeletePropertyById(w http.ResponseWriter, r *http.Request, a *auth.Auth) {
	id := r.PathValue("id")
	err := db.DeletePropertyById(id)

	if err != nil {
		if strings.Contains(err.Error(), "no rows in result set") {
			respondWithError(w, 404, ErrorParams{ErrorMessage: "No se encontró la propiedad"})
			return
		}

		fmt.Printf("Find err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	w.Header().Add("HX-Redirect", "/admin/propiedades")
	w.WriteHeader(200)
	w.Write([]byte("Propiedad eliminada"))
}

func FindSingleProperty(w http.ResponseWriter, r *http.Request) {
	propId := r.PathValue("id")

	prop, err := db.FindPropertyById(propId)

	if err != nil {
		fmt.Printf("Find err: %v\n", err)
		respondWithError(w, 404, ErrorParams{ErrorMessage: "No se encontró la propiedad"})
		return
	}

	templ, err := template.New("layout.html").Funcs(template.FuncMap{
		"FormatMoney": internal.FormatMoney,
		"FormatDate":  internal.FormatDate,
		"CalcPricePerM": func(p, sqM float64) string {
			ppM := p / sqM
			return fmt.Sprintf("%.2f/m²", ppM)
		},
	}).ParseFiles("web/templates/layout.html", "web/templates/property.html")

	if err != nil {
		fmt.Printf("Parse template err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	err = templ.Execute(w, map[string]any{
		"Prop": prop,
	})

	if err != nil {
		fmt.Printf("Execute template err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}
}

func FindPropertyWithNearbyProps(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	nearbyDistance, _ := strconv.Atoi(r.URL.Query().Get("d"))
	if nearbyDistance == 0 {
		nearbyDistance = db.NearbyDistanceNormal // Default distance is 1km
	}

	prop, err := db.FindPropertyById(id)
	if err != nil {
		if strings.Contains(err.Error(), "no rows") {
			respondWithError(w, 404, ErrorParams{ErrorMessage: "No se encontró la propiedad"})
		}
		fmt.Printf("err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	nearbyProps, err := db.FindNearbyProperties(id, nearbyDistance)

	if err != nil && !strings.Contains(err.Error(), "no rows") {
		fmt.Printf("err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	templ, err := template.New("layout.html").Funcs(template.FuncMap{
		"FormatMoney": internal.FormatMoney,
		"FormatDate":  internal.FormatDate,
		"SetField":    internal.SetField,
		"GetImgSpan":  internal.GetImgSpan,
		"CalcPricePerM": func(p, sqM float64) string {
			ppM := p / sqM
			return fmt.Sprintf("%.2f/m²", ppM)
		},
	}).ParseFiles("web/templates/layout.html", "web/templates/property.html", "web/templates/request-form.html")

	if err != nil {
		fmt.Printf("Parse template err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	err = templ.Execute(w, map[string]any{
		"Prop":        prop,
		"NearbyProps": nearbyProps,
	})

	if err != nil {
		fmt.Printf("Execute template err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}
}

func FindProperties(w http.ResponseWriter, r *http.Request) {
	contract := r.PathValue("contract")
	minPrice := r.URL.Query().Get("minPrice")
	maxPrice := r.URL.Query().Get("maxPrice")
	city := r.URL.Query().Get("city")
	state := r.URL.Query().Get("state")
	beds := r.URL.Query().Get("beds")
	baths := r.URL.Query().Get("baths")
	pageStr := r.URL.Query().Get("page")
	orderBy := r.URL.Query().Get("orderBy")
	orderDir := r.URL.Query().Get("orderDir")

	page, err := strconv.Atoi(pageStr)

	if err != nil || page <= 0 {
		page = 1
	}

	if orderBy == "" {
		orderBy = db.OrderByListingDate
	}
	if orderDir == "" {
		orderDir = db.OrderDirectionDESC
	}

	filter := db.PropertyFilter{
		OrderBy: &orderBy,
	}

	if contract != "" {
		filter.Contract = &contract
	}
	if city != "" {
		filter.City = &city
	}
	if state != "" {
		filter.State = &state
	}
	if floatMin, err := strconv.ParseFloat(minPrice, 64); minPrice != "" && err == nil {
		filter.MinPrice = &floatMin
	}
	if floatMax, err := strconv.ParseFloat(maxPrice, 64); maxPrice != "" && err == nil {
		filter.MaxPrice = &floatMax
	}
	if intBeds, err := strconv.Atoi(beds); beds != "" && err == nil {
		filter.Beds = &intBeds
	}
	if intBaths, err := strconv.Atoi(baths); baths != "" && err == nil {
		filter.Baths = &intBaths
	}

	props, err := db.GetProperties(&filter, db.DefaultPageSize, page)

	if err != nil {
		fmt.Printf("Query props err: %v\n", err)
		respondWithError(w, 404, ErrorParams{
			ErrorMessage: "No se encontraron propiedades",
		})
		return
	}

	templ, err := template.New("layout.html").Funcs(template.FuncMap{
		"FormatMoney": internal.FormatMoney,
	}).ParseFiles("web/templates/layout.html", "web/templates/properties.html")

	if err != nil {
		fmt.Printf("Parse template err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	pagination, err := db.GetPaginationData(
		&filter,
		db.DefaultPageSize,
		page,
	)

	if err != nil {
		fmt.Printf("Get pagination err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	err = templ.Execute(w, map[string]any{
		"Contract":   contract,
		"Props":      props,
		"Pagination": pagination,
	})

	if err != nil {
		fmt.Printf("Execute template err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}
}
