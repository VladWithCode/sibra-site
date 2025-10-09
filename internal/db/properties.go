package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/paulmach/orb"
	"github.com/paulmach/orb/encoding/wkb"
	"github.com/vladwithcode/sibra-site/internal"
)

const OrderDirectionASC string = "ASC"
const OrderDirectionDESC string = "DESC"
const OrderByListingDate string = "listing_date"
const OrderByPrice string = "price"
const OrderBySqMt string = "square_mt"
const OrderByLotSize string = "lot_size"
const NearbyDistanceClose int = 1000
const NearbyDistanceNormal int = 2000
const NearbyDistanceFar int = 5000
const DefaultPageSize int = 10

type Property struct {
	Id                string         `json:"id" db:"id"`
	Address           string         `json:"address" db:"address"`
	Description       string         `json:"description" db:"description"`
	City              string         `json:"city" db:"city"`
	State             string         `json:"state" db:"state"`
	Zip               string         `json:"zip" db:"zip"`
	NbHood            string         `json:"nbHood" db:"nb_hood"`
	Country           string         `json:"country" db:"country"`
	Price             float64        `json:"price" db:"price"`
	PropType          string         `json:"propType" db:"property_type"`
	Contract          string         `json:"contract" db:"contract"`
	Beds              int            `json:"beds" db:"beds"`
	Baths             int            `json:"baths" db:"baths"`
	SqMt              float64        `json:"sqMt" db:"square_mt"`
	LotSize           float64        `json:"lotSize" db:"lot_size"`
	ListingDate       time.Time      `json:"listingDate" db:"listing_date"`
	YearBuilt         int            `json:"yearBuilt" db:"year_built"`
	Status            string         `json:"status" db:"status"`
	Coords            *orb.Point     `json:"coords" db:"coords"`
	Features          map[string]any `json:"features" db:"features"`
	Lat               float64        `json:"lat" db:"lat"`
	Lon               float64        `json:"lon" db:"lon"`
	Featured          bool           `json:"featured" db:"featured"`
	FeaturedExpiresAt time.Time      `json:"featuredExpiresAt" db:"featured_expires_at"`
	MainImg           string         `json:"mainImg" db:"main_img"`
	Images            []string       `json:"imgs" db:"imgs"`
	Agent             string         `json:"agent" db:"agent"`
	Slug              string         `json:"slug" db:"slug"`
	AgentData         *AgentData     `json:"agentData" db:"agent_data"`
}

type AgentData struct {
	Name  string `json:"name" db:"name"`
	Phone string `json:"phone" db:"phone"`
	Img   string `json:"img" db:"img"`
}

func (p *Property) SetSlug() {
	p.Slug = internal.Slugify(p.Contract + " " + p.Address + " " + p.NbHood + " " + p.Zip + " " + p.City + " " + p.State + " " + fmt.Sprint(p.YearBuilt))
}

func (p *Property) SetCoordPoint() {
	p.Coords = &orb.Point{p.Lon, p.Lat}
}

func (p *Property) GetWKBCoords() (wkbCoords []byte, err error) {
	if p.Coords != nil {
		wkbCoords, err = wkb.Marshal(*p.Coords)
		if err != nil {
			return
		}
	}

	return
}

func (p *Property) ParseCoords(wkbCoords sql.NullString) error {
	if wkbCoords.Valid {
		bCoords := []byte(wkbCoords.String)
		geo, err := wkb.Unmarshal(bCoords)

		if err != nil {
			p.Coords = nil
			return nil
		}

		point, ok := geo.(orb.Point)

		if !ok {
			return fmt.Errorf("Unexpected %T for coords", geo)
		}

		p.Coords = &point
	} else {
		p.Coords = nil
	}

	return nil
}

func (p *Property) CreateStaticDir() error {
	staticDir := "web/static/properties/" + p.Id
	err := os.Mkdir(staticDir, 0755)

	if err != nil {
		return err
	}

	return nil
}

func (p *Property) ToMap() map[string]any {
	var data map[string]any

	jsonData, _ := json.Marshal(*p)
	json.Unmarshal(jsonData, &data)

	return data
}

type PropertyWithNearby struct {
	Property
	Nearby []Property
}

type PropertyFilter struct {
	Beds           *int     `json:"beds"`
	Baths          *int     `json:"baths"`
	MinPrice       *float64 `json:"minPrice"`
	MaxPrice       *float64 `json:"maxPrice"`
	City           *string  `json:"city"`
	State          *string  `json:"state"`
	Contract       *string  `json:"contract"`
	PropType       *string  `json:"propType"`
	Zip            *string  `json:"zip"`
	NbHood         *string  `json:"nbHood"`
	Featured       *bool    `json:"featured"`
	OrderBy        *string  `json:"orderBy"`
	OrderDirection *string  `json:"orderDirection"`
	TextSearch     *string  `json:"textSearch"`
}

type InvalidPropertyFields struct {
	Price     bool
	LotSize   bool
	Beds      bool
	Baths     bool
	SqMt      bool
	YearBuilt bool
	Lat       bool
	Lon       bool
}

func CreateProperty(prop *Property) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	wkbCoords, err := prop.GetWKBCoords()

	if err != nil {
		return err
	}

	_, err = conn.Exec(
		ctx,
		"INSERT INTO properties (id, address, description, city, state, zip, country, price, property_type, contract, beds, baths, square_mt, lot_size, year_built, listing_date, status, coords, features, lat, lon, nb_hood, agent, slug) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CASE WHEN $18::bytea IS NULL THEN NULL ELSE ST_SetSRID(ST_GeomFromWKB($18), 4326) END, $19, $20, $21, $22, $23, $24)",
		prop.Id,
		prop.Address,
		prop.Description,
		prop.City,
		prop.State,
		prop.Zip,
		prop.Country,
		prop.Price,
		prop.PropType,
		prop.Contract,
		prop.Beds,
		prop.Baths,
		prop.SqMt,
		prop.LotSize,
		prop.YearBuilt,
		prop.ListingDate,
		prop.Status,
		wkbCoords,
		prop.Features,
		prop.Lat,
		prop.Lon,
		prop.NbHood,
		prop.Agent,
		prop.Slug,
	)

	if err != nil {
		return err
	}

	return nil
}

func UpdateProperty(property *Property) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	wkbCoords, err := property.GetWKBCoords()

	if err != nil {
		return err
	}

	args := pgx.NamedArgs{
		"id":                  property.Id,
		"address":             property.Address,
		"description":         property.Description,
		"city":                property.City,
		"state":               property.State,
		"zip":                 property.Zip,
		"nb_hood":             property.NbHood,
		"country":             property.Country,
		"price":               property.Price,
		"property_type":       property.PropType,
		"contract":            property.Contract,
		"beds":                property.Beds,
		"baths":               property.Baths,
		"square_mt":           property.SqMt,
		"lot_size":            property.LotSize,
		"listing_date":        property.ListingDate,
		"year_built":          property.YearBuilt,
		"status":              property.Status,
		"features":            wkbCoords,
		"lat":                 property.Lat,
		"lon":                 property.Lon,
		"featured":            property.Featured,
		"featured_expires_at": property.FeaturedExpiresAt,
		"agent":               property.Agent,
		"slug":                property.Slug,
	}
	_, err = conn.Exec(
		ctx,
		`UPDATE properties SET 
			address = @address,
			description = @description,
			city = @city,
			state = @state,
			zip = @zip,
			nb_hood = @nb_hood,
			country = @country,
			price = @price,
			property_type = @property_type,
			contract = @contract,
			beds = @beds,
			baths = @baths,
			square_mt = @square_mt,
			lot_size = @lot_size,
			listing_date = @listing_date,
			year_built = @year_built,
			status = @status,
			features = @features,
			lat = @lat,
			lon = @lon,
			featured = @featured,
			featured_expires_at = @featured_expires_at,
			agent = @agent,
			slug = @slug
		WHERE id = @id`,
		args,
	)

	if err != nil {
		return err
	}

	return nil
}

func GetPaginationData(filter *PropertyFilter, limit, page int) (paginationData *Pagination, err error) {
	conn, err := GetPool()
	if err != nil {
		return
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	baseQuery := "SELECT count(*) FROM properties WHERE 1=1"
	var queryParams []interface{}
	var queryConditions []string
	var nextParamIdx int = 1

	if filter.Contract != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`contract = $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.Contract)
		nextParamIdx++
	}

	if filter.MinPrice != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`price >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.MinPrice)
		nextParamIdx++
	}

	if filter.MaxPrice != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`price <= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.MaxPrice)
		nextParamIdx++
	}

	if filter.Beds != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`beds >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.Beds)
		nextParamIdx++
	}

	if filter.Baths != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`baths >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.Baths)
		nextParamIdx++
	}

	if filter.State != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`state >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.State)
		nextParamIdx++
	}

	if filter.City != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`city >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.City)
		nextParamIdx++
	}

	if filter.Featured != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`featured >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.Featured)
		nextParamIdx++
	}

	query := baseQuery + " AND " + strings.Join(queryConditions, " AND ")

	rows, err := conn.Query(
		ctx,
		query,
		queryParams...,
	)
	if err != nil {
		return
	}
	defer rows.Close()

	var propCount float64
	for rows.Next() {
		err = rows.Scan(&propCount)

		if err != nil {
			return
		}
	}

	paginationData = &Pagination{}
	paginationData.Current = page
	paginationData.Count = int(math.Ceil(propCount / float64(limit)))
	paginationData.First = 1
	paginationData.Last = paginationData.Count

	if nextPage := page + 1; nextPage > paginationData.Count {
		paginationData.Next = paginationData.Count
	} else {
		paginationData.Next = nextPage
	}

	if prevPage := page - 1; prevPage <= 0 {
		paginationData.Prev = 1
	} else {
		paginationData.Prev = prevPage
	}

	return
}

func GetProperties(filter *PropertyFilter, limit, page int) (properties []*Property, err error) {
	conn, err := GetPool()
	if err != nil {
		return
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	baseQuery := `
		SELECT
			id,
			address,
			description,
			city,
			state,
			zip,
			country,
			price,
			property_type,
			beds,
			baths,
			square_mt,
			lot_size,
			year_built,
			listing_date,
			status,
			features,
			lat,
			lon,
			contract,
			nb_hood,
			main_img,
			imgs,
			agent,
			slug
		FROM properties WHERE 1=1
		`
	var queryParams []interface{}
	var queryConditions []string
	var nextParamIdx int = 1

	if filter.Contract != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`contract = $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.Contract)
		nextParamIdx++
	}

	if filter.MinPrice != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`price >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.MinPrice)
		nextParamIdx++
	}

	if filter.MaxPrice != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`price <= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.MaxPrice)
		nextParamIdx++
	}

	if filter.Beds != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`beds >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.Beds)
		nextParamIdx++
	}

	if filter.Baths != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`baths >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.Baths)
		nextParamIdx++
	}

	if filter.State != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`state >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.State)
		nextParamIdx++
	}

	if filter.City != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`city >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.City)
		nextParamIdx++
	}

	if filter.Featured != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`featured >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.Featured)
		nextParamIdx++
	}

	var paginateOpts string
	if limit > 0 {
		paginateOpts = fmt.Sprintf(" LIMIT %d", limit)

		if page > 0 {
			paginateOpts = fmt.Sprintf(" OFFSET %d", limit*(page-1))
		}
	}

	var orderOpts string
	if filter.OrderBy != nil {
		if filter.OrderDirection == nil {
			dir := OrderDirectionDESC
			filter.OrderDirection = &dir
		}

		orderOpts = fmt.Sprintf(" ORDER BY %v %v", *filter.OrderBy, *filter.OrderDirection)
	}
	var query string
	if len(queryParams) > 0 {
		query = baseQuery + " AND " + strings.Join(queryConditions, " AND ") + orderOpts + paginateOpts
	} else {
		query = baseQuery + orderOpts + paginateOpts
	}

	rows, err := conn.Query(
		ctx,
		query,
		queryParams...,
	)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var prop Property
		var featsJSON []byte
		err = rows.Scan(
			&prop.Id,
			&prop.Address,
			&prop.Description,
			&prop.City,
			&prop.State,
			&prop.Zip,
			&prop.Country,
			&prop.Price,
			&prop.PropType,
			&prop.Beds,
			&prop.Baths,
			&prop.SqMt,
			&prop.LotSize,
			&prop.YearBuilt,
			&prop.ListingDate,
			&prop.Status,
			&featsJSON,
			&prop.Lat,
			&prop.Lon,
			&prop.Contract,
			&prop.NbHood,
			&prop.MainImg,
			&prop.Images,
			&prop.Agent,
			&prop.Slug,
		)

		if featsJSON != nil {
			err = json.Unmarshal(featsJSON, &prop.Features)
			if err != nil {
				return
			}
		}

		properties = append(properties, &prop)
	}

	return
}

func GetPropertiesForSearch(filter *PropertyFilter, limit, page int) ([]*Property, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	baseQuery := `
	SELECT
		id,
		address,
		city,
		state,
		zip,
		price,
		beds,
		baths,
		square_mt,
		contract,
		nb_hood,
		main_img,
		slug,
		to_tsvector(
			'spanish',
			address || ' ' || description || ' ' || city || ' ' || state || ' ' || zip || ' ' || property_type || ' ' || contract || ' ' || nb_hood
		) @@ to_tsquery('spanish', 'venta') AS rank
	FROM properties
	WHERE to_tsvector(
			'spanish',
			address || ' ' || description || ' ' || city || ' ' || state || ' ' || zip || ' ' || property_type || ' ' || contract || ' ' || nb_hood
		) @@ to_tsquery('spanish', 'venta')
	ORDER BY rank DESC`

	rows, err := conn.Query(
		ctx,
		baseQuery,
		nil,
	)

	if err != nil {
		return nil, err
	}

	var props = []*Property{}

	for rows.Next() {
		var prop Property
		err = rows.Scan(
			&prop.Id,
			&prop.Address,
			&prop.City,
			&prop.State,
			&prop.Zip,
			&prop.Price,
			&prop.Beds,
			&prop.Baths,
			&prop.SqMt,
			&prop.Contract,
			&prop.NbHood,
			&prop.MainImg,
			&prop.Slug,
		)

	}

	return props, nil
}

func FindNearbyProperties(id string, nearbyDistance int) ([]*Property, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	rows, err := conn.Query(
		ctx,
		"SELECT id, address, city, state, zip, price, beds, baths, square_mt, main_img, contract, nb_hood FROM properties WHERE ST_DWithin(coords, (SELECT coords FROM properties WHERE id = $1 AND contract = properties.contract), $2) AND id != $1 AND contract = (SELECT contract FROM properties WHERE id = $1)",
		id,
		nearbyDistance,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var props []*Property
	for rows.Next() {
		var prop Property

		err := rows.Scan(
			&prop.Id,
			&prop.Address,
			&prop.City,
			&prop.State,
			&prop.Zip,
			&prop.Price,
			&prop.Beds,
			&prop.Baths,
			&prop.SqMt,
			&prop.MainImg,
			&prop.Contract,
			&prop.NbHood,
		)

		if err != nil {
			return nil, err
		}

		props = append(props, &prop)
	}

	return props, nil
}

func FindPropertyById(propId string) (property *Property, err error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	row := conn.QueryRow(ctx, `
		SELECT 
			p.id, p.address, p.description, p.city, p.state, p.zip, p.country, p.price, p.property_type,
			p.beds, p.baths, p.square_mt, p.lot_size, p.year_built, p.listing_date, p.status, p.earth_coords, p.features,
			p.lat, p.lon, p.contract, p.featured, p.featured_expires_at, p.nb_hood, p.main_img, p.imgs, p.agent, p.slug,
			u.fullname AS agent_name,
			u.phone AS agent_number,
			u.img AS agent_img
		FROM properties p  
		LEFT JOIN users u ON p.agent = u.id 
		WHERE p.id = $1
	`, propId)

	var wkbCoords sql.NullString
	var featsJSON sql.NullString
	var phone sql.NullString
	var img sql.NullString
	var d sql.NullTime
	property = &Property{}
	property.AgentData = &AgentData{}
	err = row.Scan(
		&property.Id,
		&property.Address,
		&property.Description,
		&property.City,
		&property.State,
		&property.Zip,
		&property.Country,
		&property.Price,
		&property.PropType,
		&property.Beds,
		&property.Baths,
		&property.SqMt,
		&property.LotSize,
		&property.YearBuilt,
		&property.ListingDate,
		&property.Status,
		&wkbCoords,
		&featsJSON,
		&property.Lat,
		&property.Lon,
		&property.Contract,
		&property.Featured,
		&d,
		&property.NbHood,
		&property.MainImg,
		&property.Images,
		&property.Agent,
		&property.Slug,
		&property.AgentData.Name,
		&phone,
		&img,
	)
	property.AgentData.Phone = phone.String
	property.AgentData.Img = img.String

	if err != nil {
		return nil, err
	}

	if featsJSON.Valid {
		_ = json.Unmarshal([]byte(featsJSON.String), &property.Features)
	}

	err = property.ParseCoords(wkbCoords)

	if err != nil {
		return nil, err
	}

	if d.Valid {
		property.FeaturedExpiresAt = d.Time
	}

	return
}

func UpdatePropertyImages(id string, images []string) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	_, err = conn.Exec(ctx, "UPDATE properties SET imgs = $1 WHERE id = $2", images, id)

	if err != nil {
		return err
	}

	return nil
}

func UpdatePropertyMainImg(id, img string) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	_, err = conn.Exec(ctx, "UPDATE properties SET main_img = $1 WHERE id = $2", img, id)

	if err != nil {
		return err
	}

	return nil
}

func DeletePropertyById(id string) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	_, err = conn.Exec(ctx, "DELETE FROM properties WHERE id = $1", id)

	if err != nil {
		return err
	}

	return nil
}
