package routes

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
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
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/db"
)

func RegisterPropertyRoutes(router *customServeMux) {
	router.HandleFunc("GET /api/propiedades", FindFilteredProperties)
	router.HandleFunc("GET /api/propiedades/destacadas", FindFeaturedProperties)
	router.HandleFunc("GET /api/propiedades/panel/{id}", auth.ValidateAuthMiddleware(FindSingleProperty))
	router.HandleFunc("GET /api/propiedades/{contract}", FindProperties)
	router.HandleFunc("GET /api/propiedades/{contract}/{id}", FindPropertyWithNearbyProps)
	router.HandleFunc("POST /api/property", auth.ValidateAuthMiddleware(CreateProperty))
	router.HandleFunc("PUT /api/property/{id}", auth.ValidateAuthMiddleware(UpdateProperty))
	router.HandleFunc("DELETE /api/property/{id}", auth.ValidateAuthMiddleware(DeletePropertyById))
	router.HandleFunc("POST /api/property/pictures/{id}", auth.ValidateAuthMiddleware(UploadPropertyPictures))
	router.HandleFunc("DELETE /api/property/pictures/{id}", auth.ValidateAuthMiddleware(DeletePropertyPictures))
}

func CreateProperty(w http.ResponseWriter, r *http.Request) {
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

	user, err := auth.ExtractAuthDataFromRequest(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, ErrorParams{
			ErrorMessage: "No se pudo autenticar el usuario",
		})
		log.Printf("Error extracting auth data: %v\n", err)
		return
	}

	id := uuid.Must(uuid.NewV7()).String()
	property.Id = id
	property.Agent = user.Id
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

	respondWithJSON(w, 200, map[string]any{
		"property": property,
		"success":  true,
	})

	err = property.CreateStaticDir()
	if err != nil {
		fmt.Printf("Error creating static dir for prop: %v\n", property.Id)
	}
}

func UpdateProperty(w http.ResponseWriter, r *http.Request) {
	property := db.Property{}
	err := json.NewDecoder(r.Body).Decode(&property)
	defer r.Body.Close()
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "El formulario contiene información inválida",
		})
		log.Printf("Error decoding request body: %v", err)
		return
	}

	property.Id = r.PathValue("id")
	foundProp, err := db.FindPropertyById(r.Context(), property.Id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró la propiedad",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding property: %v\n", err)
		return
	}
	property.Agent = foundProp.Agent
	property.Images = foundProp.Images
	property.MainImg = foundProp.MainImg
	if foundProp.Slug != "" {
		property.Slug = foundProp.Slug
	} else {
		property.SetSlug()
	}

	err = db.UpdateProperty(&property)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar la propiedad",
		})
		log.Printf("Error updating property: %v", err)
		return
	}

	resData, err := json.Marshal(map[string]any{
		"success":  true,
		"property": property,
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar la propiedad",
		})
		log.Printf("Error marshaling response: %v", err)
		return
	}
	respondWithJSON(w, http.StatusCreated, resData)
}

func UploadPropertyPictures(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ctx := r.Context()

	err := r.ParseMultipartForm(90 << 20)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "El formulario no pudo ser procesado. Asegurate de que el archivo no exceda el tamaño máximo permitido (90MB).",
		})
		log.Printf("Error parsing multipart form: %v\n", err)
		return
	}

	property, err := db.FindPropertyById(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró la propiedad",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding property: %v\n", err)
		return
	}

	filePath := filepath.Join("web/static/properties", property.Id)
	err = os.MkdirAll(filePath, 0644)

	if err != nil && !os.IsExist(err) {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error creating directory: %v\n", err)
		return
	}

	uploadDateStr := time.Now().Format("20060102-150405")
	pics := r.MultipartForm.File["pics"]
	for picIdx, fileHeader := range pics {
		pic, err := fileHeader.Open()
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, ErrorParams{
				ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
			})
			log.Printf("Error opening file [pics]: %v\n", err)
			return
		}
		defer pic.Close()

		fileName := fmt.Sprintf("pic-%s-%d%s", uploadDateStr, picIdx, filepath.Ext(fileHeader.Filename))
		filep := filepath.Join(filePath, fileName)
		outFile, err := os.Create(filep)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, ErrorParams{
				ErrorMessage: "Error al guardar las imagenes",
			})
			log.Printf("Error while creating file [pics]: %v", err)
			return
		}
		defer outFile.Close()

		_, err = io.Copy(outFile, pic)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, ErrorParams{
				ErrorMessage: "Error al guardar las imagenes",
			})
			log.Printf("Error while writing file [pics]: %v", err)
			return
		}

		property.Images = append(property.Images, fileName)
	}

	mainPic, handle, err := r.FormFile("main-pic")
	if err != nil && !strings.Contains(err.Error(), "no such file") {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "Error al guardar las imagenes",
		})
		log.Printf("Error while reading main pic [main]: %v\n", err)
		return
	}

	if handle != nil {
		defer mainPic.Close()

		mainFileName := fmt.Sprintf("main-pic-%s%s", uploadDateStr, filepath.Ext(handle.Filename))
		file, err := os.Create(filepath.Join(filePath, mainFileName))
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, ErrorParams{
				ErrorMessage: "Error al guardar la imagen principal",
			})
			log.Printf("Error while creating file [main]: %v\n", err)
			return
		}
		defer file.Close()

		_, err = io.Copy(file, mainPic)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, ErrorParams{
				ErrorMessage: "Error al guardar la imagen principal",
			})
			log.Printf("Error while copying image [main]: %v\n", err)
			return
		}
		property.MainImg = mainFileName
	}

	delPicIds := r.MultipartForm.Value["delPics"]
	if len(delPicIds) > 0 {
		newPics := make([]string, 0, len(property.Images))
		i := 0
		for _, img := range property.Images {
			if !slices.Contains(delPicIds, img) && img != "" {
				newPics[i] = img
				i++
			}
		}

		property.Images = newPics[:i]
	}

	err = db.UpdatePropertyImages(property)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar las imágenes de la propiedad",
		})
		log.Printf("UpdatePropertyImages err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]any{
		"success": true,
	})
}

func DeletePropertyPictures(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ctx := r.Context()

	var imgData struct {
		ImgName string `json:"imgName"`
		Type    string `json:"type"`
	}
	err := json.NewDecoder(r.Body).Decode(&imgData)
	defer r.Body.Close()
	if err != nil {
		respondWithError(w, http.StatusBadRequest, ErrorParams{
			ErrorMessage: "El formulario contiene información inválida",
		})
		log.Printf("Error decoding request body: %v", err)
		return
	}

	property, err := db.FindPropertyById(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontró la propiedad",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding property: %v\n", err)
		return
	}

	err = os.Remove(filepath.Join("web/static/properties", property.Id, imgData.ImgName))
	if err != nil && !os.IsNotExist(err) {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error deleting picture: %v\n", err)
		return
	}

	if imgData.Type == "main" {
		property.MainImg = ""
	} else {
		newImgs := make([]string, 0, len(property.Images))
		i := 0
		for _, img := range property.Images {
			if imgData.ImgName != img {
				newImgs = append(newImgs, img)
				i++
			}
		}

		property.Images = newImgs[:i]
	}

	// Update property
	err = db.UpdatePropertyImages(property)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al actualizar las imágenes de la propiedad",
		})
		log.Printf("UpdatePropertyImages err: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}

func DeletePropertyById(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	err := db.DeletePropertyById(id)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error al eliminar la propiedad",
		})
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"success": true,
	})
}

func FindFilteredProperties(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	params := r.URL.Query()
	filter := db.NewPropertyFilterFromQuery(&params)
	pageStr := r.URL.Query().Get("page")
	page, err := strconv.Atoi(pageStr)
	if err != nil || page <= 0 {
		page = 1
	}
	perPageStr := r.URL.Query().Get("perPage")
	perPage, err := strconv.Atoi(perPageStr)
	if err != nil || perPage <= 0 {
		perPage = db.DefaultPageSize
	}

	props, err := db.GetProperties(ctx, filter, perPage, page)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontraron propiedades para la búsqueda ingresada.",
			})
			return
		}

		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding filtered properties: %v\n", err)
		return
	}

	pagination, err := db.GetPaginationData(filter, perPage, page)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding pagination data: %v\n", err)
		return
	}

	time.Sleep(time.Second * 1)

	respondWithJSON(w, http.StatusOK, map[string]any{
		"properties": props,
		"pagination": pagination,
	})
}

func FindFeaturedProperties(w http.ResponseWriter, r *http.Request) {
	props, err := db.FindFeaturedProperties()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{})
		log.Printf("Error finding featured properties: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"properties": props,
	})
}

func FindSingleProperty(w http.ResponseWriter, r *http.Request) {
	propId := r.PathValue("id")
	ctx := r.Context()

	prop, err := db.FindPropertyById(ctx, propId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la propiedad"})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{})
		log.Printf("Error while finding property: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"property": prop,
	})
}

func FindPropertyWithNearbyProps(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := r.PathValue("id")
	nearbyDistance, _ := strconv.Atoi(r.URL.Query().Get("d"))
	if nearbyDistance == 0 {
		nearbyDistance = db.NearbyDistanceNormal // Default distance is 1km
	}

	var findFn func(context.Context, string) (*db.Property, error)
	if _, err := uuid.Parse(id); err == nil {
		findFn = db.FindPropertyById
	} else {
		findFn = db.FindPropertyBySlug
	}

	prop, err := findFn(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{ErrorMessage: "No se encontró la propiedad"})
			return
		}
		respondWithError(w, http.StatusInternalServerError, ErrorParams{})
		log.Printf("Error finding property: %v\n", err)
		return
	}

	nearbyProps, err := db.FindNearbyProperties(id, nearbyDistance)
	if err != nil {
		log.Printf("Error finding nearby properties: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"property":         prop,
		"nearbyProperties": nearbyProps,
	})
}

func FindProperties(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

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

	props, err := db.GetProperties(ctx, &filter, db.DefaultPageSize, page)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "No se encontraron propiedades",
			})
		} else {
			respondWithError(w, http.StatusNotFound, ErrorParams{
				ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
			})
		}
		log.Printf("Error finding properties: %v\n", err)
		return
	}

	pagination, err := db.GetPaginationData(
		&filter,
		db.DefaultPageSize,
		page,
	)
	if err != nil {
		respondWithError(w, http.StatusNotFound, ErrorParams{
			ErrorMessage: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
		})
		log.Printf("Error finding pagination data: %v\n", err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]any{
		"properties": props,
		"pagination": pagination,
	})
}
