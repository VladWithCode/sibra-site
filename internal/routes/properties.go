package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os"
	"path/filepath"
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
	router.HandleFunc("GET /propiedades/{contract}", FindProperties)
	router.HandleFunc("GET /propiedades/{contract}/{id}", FindPropertyWithNearbyProps)

	router.HandleFunc("POST /api/property", auth.WithAuthMiddleware(CreateProperty))
	router.HandleFunc("PUT /api/property/{id}", auth.WithAuthMiddleware(UpdateProperty))
	router.HandleFunc("DELETE /api/property/{id}/delete", auth.WithAuthMiddleware(DeletePropertyById))
}

func CreateProperty(w http.ResponseWriter, r *http.Request, a *auth.Auth) {
	err := r.ParseForm()

	if err != nil {
		fmt.Printf("Parse form err: %v\n", err)
		respondWithError(w, 400, ErrorParams{
			ErrorMessage: "El formulario contiene información erronea.",
		})
		return
	}

	templ, err := template.ParseFiles("web/templates/admin/prop-form.html", "web/templates/admin/pic-form.html")

	if err != nil {
		fmt.Printf("Parse invalid templ err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	isFormInvalid := false
	invalidFields := db.InvalidPropertyFields{}
	id, err := uuid.NewV7()

	if err != nil {
		fmt.Printf("Create uuid err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	strLat := r.Form.Get("lat")
	if strLat == "" {
		strLat = "0"
	}
	lat, err := strconv.ParseFloat(strLat, 64)
	if err != nil {
		invalidFields.Lat = true
		isFormInvalid = true
	}
	strLon := r.Form.Get("lon")
	if strLon == "" {
		strLon = "0"
	}
	lon, err := strconv.ParseFloat(strLon, 64)
	if err != nil {
		invalidFields.Lon = true
		isFormInvalid = true
	}

	var feats map[string]any
	if r.Form.Get("features") != "" {
		err = json.Unmarshal([]byte(r.Form.Get("features")), &feats)
		if err != nil {
			fmt.Printf("feats Parse form err: %v\n", err)
			respondWithError(w, 400, ErrorParams{
				ErrorMessage: "El formulario contiene información erronea.",
			})
			return
		}
	}

	strPrice := r.Form.Get("price")
	if strPrice == "" {
		strPrice = "0"
	}
	price, err := strconv.ParseFloat(strPrice, 64)
	if err != nil {
		invalidFields.Price = true
		isFormInvalid = true
	}

	strBeds := r.Form.Get("beds")
	if strBeds == "" {
		strBeds = "0"
	}
	beds, err := strconv.Atoi(r.Form.Get("beds"))
	if err != nil {
		invalidFields.Beds = true
		isFormInvalid = true
	}

	strBaths := r.Form.Get("baths")
	if strBaths == "" {
		strBaths = "0"
	}
	baths, err := strconv.Atoi(strBaths)
	if err != nil {
		invalidFields.Baths = true
		isFormInvalid = true
	}

	strSqMt := r.Form.Get("sqMt")
	if strSqMt == "" {
		strSqMt = "0"
	}
	sqMt, err := strconv.ParseFloat(strSqMt, 64)
	if err != nil {
		invalidFields.SqMt = true
		isFormInvalid = true
	}

	strLotSize := r.Form.Get("lotSize")
	if strLotSize == "" {
		strLotSize = "0"
	}
	lotSize, err := strconv.ParseFloat(strLotSize, 64)
	if err != nil {
		invalidFields.LotSize = true
		isFormInvalid = true
	}

	strYearBuilt := r.Form.Get("yearBuilt")
	if strYearBuilt == "" {
		strYearBuilt = "0"
	}
	yearBuilt, err := strconv.Atoi(strYearBuilt)
	if err != nil {
		invalidFields.YearBuilt = true
		isFormInvalid = true
	}

	var listingDate time.Time
	if r.Form.Get("listingDate") != "" {
		listingDate, err = time.Parse("2006-01-02", r.Form.Get("listingDate"))
		if err != nil {
			fmt.Printf("date Parse form err: %v\n", err)
			respondWithError(w, 400, ErrorParams{
				ErrorMessage: "El formulario contiene información erronea.",
			})
			return
		}
	} else {
		listingDate = time.Now()
	}

	data := map[string]string{}
	for k, v := range r.Form {
		data[k] = v[0]
	}

	if isFormInvalid {
		w.WriteHeader(500)
		err = templ.Execute(w, map[string]any{
			"Data":       data,
			"Invalid":    invalidFields,
			"PicSwapOob": true,
		})

		if err != nil {
			fmt.Printf("Execute invalid templ err: %v\n", err)
			respondWithError(w, 500, ErrorParams{})
			return
		}

		return
	}

	property := db.Property{
		Id:          id.String(),
		Address:     r.Form.Get("address"),
		NbHood:      r.Form.Get("nbHood"),
		Description: r.Form.Get("description"),
		City:        r.Form.Get("city"),
		State:       r.Form.Get("state"),
		Zip:         r.Form.Get("zip"),
		Country:     r.Form.Get("country"),
		Status:      r.Form.Get("status"),
		PropType:    r.Form.Get("propType"),
		Contract:    r.Form.Get("contract"),
		Price:       price,
		Beds:        beds,
		Baths:       baths,
		SqMt:        sqMt,
		LotSize:     lotSize,
		YearBuilt:   yearBuilt,
		ListingDate: listingDate,
		Lat:         lat,
		Lon:         lon,
		Features:    feats,
		Agent:       a.Id,
	}

	property.SetCoordPoint()
	property.SetSlug()

	err = db.CreateProperty(&property)

	if err != nil {
		fmt.Printf("Create err: %v\n", err)
		w.WriteHeader(400)
		err = templ.Execute(w, map[string]any{
			"RegisterError": err.Error(),
			"Data":          data,
			"PicSwapOob":    true,
		})
		return
	}

	data["id"] = property.Id

	err = templ.Execute(w, map[string]any{
		"IsEditForm": true,
		"Data":       data,
		"Success":    true,
		"PicSwapOob": true,
	})

	if err != nil {
		fmt.Printf("Parse templ err: %v\n", err)
		respondWithError(w, 500, ErrorParams{})
		return
	}

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
	templ, err := template.ParseFiles("web/templates/admin/pic-form.html")

	if err != nil {
		fmt.Printf("Parse invalid templ err: %v\n", err)
		w.WriteHeader(500)
		respondWithError(w, 500, ErrorParams{})
		return
	}

	id := r.PathValue("id")
	err = r.ParseMultipartForm(90 << 20)

	if err != nil {
		fmt.Printf("Parse form err: %v\n", err)
		w.WriteHeader(500)
		templ.Execute(w, map[string]any{
			"UploadError": "Ocurrio un error al procesar las imagenes",
			"Data":        map[string]any{"id": id},
		})
		return
	}

	prop, err := db.FindPropertyById(id)

	if err != nil {
		fmt.Printf("Find err: %v\n", err)
		w.WriteHeader(500)
		templ.Execute(w, map[string]any{
			"UploadError": "No se encontro la propiedad especificada",
			"Data":        map[string]any{"id": prop.Id},
		})
		return
	}

	filePath := filepath.Join("web/static/properties", prop.Id)

	mainPic, handle, err := r.FormFile("main-pic")
	if err != nil {
		fmt.Printf("Parse pic err: %v\n", err)
		w.WriteHeader(500)
		templ.Execute(w, map[string]any{
			"UploadError": "E,rror al procesar la imagen principal",
			"Data":        map[string]any{"id": prop.Id},
		})
		return
	}
	defer mainPic.Close()

	mainFileName := "main-pic" + filepath.Ext(handle.Filename)
	file, err := os.Create(filepath.Join(filePath, mainFileName))
	if err != nil {
		fmt.Printf("Create main file %v\n", err)
		w.WriteHeader(500)
		templ.Execute(w, map[string]any{
			"UploadError": "Error al procesar la imagen principal",
			"Data":        map[string]any{"id": prop.Id},
		})
		return
	}
	defer file.Close()

	_, err = io.Copy(file, mainPic)
	if err != nil {
		fmt.Printf("Copy err: %v\n", err)
		w.WriteHeader(500)
		templ.Execute(w, map[string]any{
			"UploadError": "Error al procesar la imagen principal",
			"Data":        map[string]any{"id": prop.Id},
		})
		return
	}
	prop.MainImg = mainFileName

	pics := r.MultipartForm.File["pictures"]
	for i, fileHeader := range pics {
		pic, err := fileHeader.Open()
		if err != nil {
			fmt.Printf("Open file err: %v\n", err)
			w.WriteHeader(500)
			templ.Execute(w, map[string]any{
				"UploadError": "Error al procesar las imagenes",
				"Data":        map[string]any{"id": prop.Id},
			})
			return
		}
		defer pic.Close()

		idx := fmt.Sprintf("%v", i)
		fileName := prop.Id + "-" + idx + filepath.Ext(fileHeader.Filename)
		filep := filepath.Join(filePath, fileName)
		outFile, err := os.Create(filep)
		if err != nil {
			fmt.Printf("Create outfile err: %v\n", err)
			w.WriteHeader(500)
			templ.Execute(w, map[string]any{
				"UploadError": "Error al procesar las imagenes",
				"Data":        map[string]any{"id": prop.Id},
			})
			return
		}
		defer outFile.Close()

		_, err = io.Copy(outFile, pic)
		if err != nil {
			fmt.Printf("Write file err: %v\n", err)
			w.WriteHeader(500)
			templ.Execute(w, map[string]any{
				"UploadError": "Error al procesar las imagenes",
				"Data":        map[string]any{"id": prop.Id},
			})
			return
		}

		prop.Images = append(prop.Images, fileName)
	}

	// Save changes
	err = db.UpdatePropertyImages(prop.Id, prop.Images)
	err = db.UpdatePropertyMainImg(prop.Id, prop.MainImg)

	if err != nil {
		fmt.Printf("Write file err: %v\n", err)
		w.WriteHeader(500)
		templ.Execute(w, map[string]any{
			"UploadError": "Error al procesar las imagenes",
			"Data":        map[string]any{"id": prop.Id},
		})
		return
	}

	templ.Execute(w, map[string]any{
		"UploadSuccess": true,
		"ResultMessage": "Las imagenes se subieron con exito",
		"Data":          map[string]any{"id": prop.Id},
	})
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
