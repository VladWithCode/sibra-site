package db

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/vladwithcode/sibra-site/internal"
)

var (
	ErrInvalidPointValue = errors.New("invalid point value")
)

const (
	OrderDirectionASC    string = "ASC"
	OrderDirectionDESC   string = "DESC"
	OrderByListingDate   string = "listing_date"
	OrderByPrice         string = "price"
	OrderBySqMt          string = "square_mt"
	OrderByLotSize       string = "lot_size"
	NearbyDistanceClose  int    = 1000
	NearbyDistanceNormal int    = 2000
	NearbyDistanceFar    int    = 5000
	DefaultPageSize      int    = 10
)

type PropertyStatus string

const (
	PropertyStatusDraft         PropertyStatus = "borrador"
	PropertyStatusArchived      PropertyStatus = "archivada"
	PropertyStatusPublished     PropertyStatus = "publicada"
	PropertyStatusPendingReview PropertyStatus = "en revisión"
	PropertyStatusSold          PropertyStatus = "vendida"
	PropertyStatusInactive      PropertyStatus = "inactiva"
)

// Point represents a geographic point with latitude and longitude
type Point struct {
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
}

// Scan implements the sql.Scanner interface for Point
func (p *Point) Scan(value any) error {
	if value == nil {
		return nil
	}

	switch v := value.(type) {
	case string:
		// PostgreSQL point format: "(lon,lat)"
		v = strings.Trim(v, "()")
		coords := strings.Split(v, ",")
		if len(coords) != 2 {
			return fmt.Errorf("invalid point format: %s", v)
		}

		lon, err := strconv.ParseFloat(coords[0], 64)
		if err != nil {
			return err
		}

		lat, err := strconv.ParseFloat(coords[1], 64)
		if err != nil {
			return err
		}

		p.Lon = lon
		p.Lat = lat
		return nil
	default:
		return fmt.Errorf("%w: cannot scan %T into Point", ErrInvalidPointValue, value)
	}
}

// Value implements the driver.Valuer interface for Point
func (p Point) Value() (driver.Value, error) {
	if p.Lat == 0 && p.Lon == 0 {
		return nil, nil
	}
	return fmt.Sprintf("(%f,%f)", p.Lon, p.Lat), nil
}

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
	PropertyType      string         `json:"propertyType" db:"property_type"`
	Contract          string         `json:"contract" db:"contract"`
	Beds              int            `json:"beds" db:"beds"`
	Baths             int            `json:"baths" db:"baths"`
	SqMt              float64        `json:"sqMt" db:"square_mt"`
	LotSize           float64        `json:"lotSize" db:"lot_size"`
	ListingDate       time.Time      `json:"listingDate" db:"listing_date"`
	YearBuilt         int            `json:"yearBuilt" db:"year_built"`
	Status            PropertyStatus `json:"status" db:"status"`
	Coords            *Point         `json:"coords" db:"earth_coords"`
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

func (p *Property) SetCoords() {
	p.Coords = &Point{
		Lat: p.Lat,
		Lon: p.Lon,
	}
}

func (p *Property) SyncLatLon() {
	if p.Coords != nil {
		p.Lat = p.Coords.Lat
		p.Lon = p.Coords.Lon
	}
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
	Ids            *[]string       `json:"ids"`
	Beds           *int            `json:"beds"`
	Baths          *int            `json:"baths"`
	MinPrice       *float64        `json:"minPrice"`
	MaxPrice       *float64        `json:"maxPrice"`
	MinSqMt        *float64        `json:"minSqMt"`
	MaxSqMt        *float64        `json:"maxSqMt"`
	MinLotSize     *float64        `json:"minLotSize"`
	MaxLotSize     *float64        `json:"maxLotSize"`
	MinYearBuilt   *int            `json:"minYearBuilt"`
	MaxYearBuilt   *int            `json:"maxYearBuilt"`
	City           *string         `json:"city"`
	State          *string         `json:"state"`
	Contract       *string         `json:"contract"`
	PropType       *string         `json:"propType"`
	Zip            *string         `json:"zip"`
	NbHood         *string         `json:"nbHood"`
	Status         *PropertyStatus `json:"status"`
	Featured       *bool           `json:"featured"`
	OrderBy        *string         `json:"orderBy"`
	OrderDirection *string         `json:"orderDirection"`
	TextSearch     *string         `json:"textSearch"`
	// New fields for location-based searches
	NearLat      *float64 `json:"nearLat"`
	NearLon      *float64 `json:"nearLon"`
	WithinMeters *int     `json:"withinMeters"`
}

func NewPropertyFilter() *PropertyFilter {
	return &PropertyFilter{}
}

func NewPropertyFilterFromQuery(query *url.Values) *PropertyFilter {
	filter := NewPropertyFilter()
	if query == nil {
		return filter
	}
	if ids := (*query)["ids"]; len(ids) > 0 {
		filter.Ids = &ids
	}
	if contract := query.Get("contract"); contract != "" {
		filter.Contract = &contract
	}
	if city := query.Get("city"); city != "" {
		filter.City = &city
	}
	if state := query.Get("state"); state != "" {
		filter.State = &state
	}
	if beds := query.Get("beds"); beds != "" {
		b, _ := strconv.Atoi(beds)
		filter.Beds = &b
	}
	if baths := query.Get("baths"); baths != "" {
		b, _ := strconv.Atoi(baths)
		filter.Baths = &b
	}
	if maxPrice := query.Get("maxPrice"); maxPrice != "" {
		maxPriceFloat, _ := strconv.ParseFloat(maxPrice, 64)
		filter.MaxPrice = &maxPriceFloat
	}
	if minSqMt := query.Get("minSqMt"); minSqMt != "" {
		minSqMtFloat, _ := strconv.ParseFloat(minSqMt, 64)
		filter.MinSqMt = &minSqMtFloat
	}
	if maxSqMt := query.Get("maxSqMt"); maxSqMt != "" {
		maxSqMtFloat, _ := strconv.ParseFloat(maxSqMt, 64)
		filter.MaxSqMt = &maxSqMtFloat
	}
	if minLotSize := query.Get("minLotSize"); minLotSize != "" {
		minLotSizeFloat, _ := strconv.ParseFloat(minLotSize, 64)
		filter.MinLotSize = &minLotSizeFloat
	}
	if maxLotSize := query.Get("maxLotSize"); maxLotSize != "" {
		maxLotSizeFloat, _ := strconv.ParseFloat(maxLotSize, 64)
		filter.MaxLotSize = &maxLotSizeFloat
	}
	if minYearBuilt := query.Get("minYearBuilt"); minYearBuilt != "" {
		minYearBuiltInt, _ := strconv.Atoi(minYearBuilt)
		filter.MinYearBuilt = &minYearBuiltInt
	}
	if maxYearBuilt := query.Get("maxYearBuilt"); maxYearBuilt != "" {
		maxYearBuiltInt, _ := strconv.Atoi(maxYearBuilt)
		filter.MaxYearBuilt = &maxYearBuiltInt
	}
	return filter
}

type InvalidPropertyFields map[string]bool

func CreateProperty(prop *Property) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Ensure coords are set from lat/lon
	prop.SetCoords()

	args := pgx.NamedArgs{
		"id":            prop.Id,
		"address":       prop.Address,
		"description":   prop.Description,
		"city":          prop.City,
		"state":         prop.State,
		"zip":           prop.Zip,
		"country":       prop.Country,
		"price":         prop.Price,
		"property_type": prop.PropertyType,
		"contract":      prop.Contract,
		"beds":          prop.Beds,
		"baths":         prop.Baths,
		"square_mt":     prop.SqMt,
		"lot_size":      prop.LotSize,
		"year_built":    prop.YearBuilt,
		"listing_date": sql.NullTime{
			Time:  prop.ListingDate,
			Valid: prop.ListingDate.IsZero() == false,
		},
		"status":       prop.Status,
		"earth_coords": prop.Coords,
		"features":     prop.Features,
		"lat":          prop.Lat,
		"lon":          prop.Lon,
		"nb_hood":      prop.NbHood,
		"agent":        prop.Agent,
		"slug":         prop.Slug,
		"main_img":     prop.MainImg,
		"imgs":         prop.Images,
	}
	_, err = conn.Exec(
		ctx,
		`INSERT INTO properties (
			id, address, description, city, state, zip, country, price, property_type,
			contract, beds, baths, square_mt, lot_size, year_built, listing_date,
			status, earth_coords, features, lat, lon, nb_hood, agent, slug, main_img, imgs
		) VALUES (
            @id, @address, @description, @city, @state, @zip, @country, @price, @property_type,
            @contract, @beds, @baths, @square_mt, @lot_size, @year_built, @listing_date,
            @status, @earth_coords, @features, @lat, @lon, @nb_hood, @agent, @slug, @main_img, @imgs
        )`,
		args,
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

	// Ensure coords are set from lat/lon
	property.SetCoords()

	_, err = conn.Exec(
		ctx,
		`UPDATE properties SET
		address = $2,
		description = $3,
		city = $4,
		state = $5,
		zip = $6,
		nb_hood = $7,
		country = $8,
		price = $9,
		property_type = $10,
		contract = $11,
		beds = $12,
		baths = $13,
		square_mt = $14,
		lot_size = $15,
		listing_date = $16,
		year_built = $17,
		status = $18,
		earth_coords = $19,
		features = $20,
		lat = $21,
		lon = $22,
		featured = $23,
		featured_expires_at = $24,
		agent = $25,
		slug = $26
		WHERE id = $1`,
		property.Id,
		property.Address,
		property.Description,
		property.City,
		property.State,
		property.Zip,
		property.NbHood,
		property.Country,
		property.Price,
		property.PropertyType,
		property.Contract,
		property.Beds,
		property.Baths,
		property.SqMt,
		property.LotSize,
		property.ListingDate,
		property.YearBuilt,
		property.Status,
		property.Coords,
		property.Features,
		property.Lat,
		property.Lon,
		property.Featured,
		property.FeaturedExpiresAt,
		property.Agent,
		property.Slug,
	)

	if err != nil {
		return err
	}

	return nil
}

func buildFilterConditions(filter *PropertyFilter) ([]string, []any, int) {
	var queryConditions []string
	var queryParams []any
	nextParamIdx := 1

	if filter.Ids != nil && len(*filter.Ids) > 0 {
		queryConditions = append(queryConditions, fmt.Sprintf(`id = ANY($%d)`, nextParamIdx))
		queryParams = append(queryParams, *filter.Ids)
		nextParamIdx++
	}

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

	if filter.MinSqMt != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`square_mt >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.MinSqMt)
		nextParamIdx++
	}

	if filter.MaxSqMt != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`square_mt <= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.MaxSqMt)
		nextParamIdx++
	}

	if filter.MinLotSize != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`lot_size >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.MinLotSize)
		nextParamIdx++
	}

	if filter.MaxLotSize != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`lot_size <= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.MaxLotSize)
		nextParamIdx++
	}

	if filter.MinYearBuilt != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`year_built >= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.MinYearBuilt)
		nextParamIdx++
	}

	if filter.MaxYearBuilt != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`year_built <= $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.MaxYearBuilt)
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
		queryConditions = append(queryConditions, fmt.Sprintf(`state = $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.State)
		nextParamIdx++
	}

	if filter.City != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`city = $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.City)
		nextParamIdx++
	}

	if filter.PropType != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`property_type = $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.PropType)
		nextParamIdx++
	}

	if filter.Zip != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`zip = $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.Zip)
		nextParamIdx++
	}

	if filter.NbHood != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`nb_hood = $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.NbHood)
		nextParamIdx++
	}

	if filter.Status != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`status = $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.Status)
		nextParamIdx++
	}

	if filter.Featured != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`featured = $%d`, nextParamIdx))
		queryParams = append(queryParams, *filter.Featured)
		nextParamIdx++
	}

	// Location-based filtering using earthdistance
	if filter.NearLat != nil && filter.NearLon != nil && filter.WithinMeters != nil {
		queryConditions = append(queryConditions, fmt.Sprintf(`earth_coords <@> point($%d, $%d) <= $%d`, nextParamIdx, nextParamIdx+1, nextParamIdx+2))
		queryParams = append(queryParams, *filter.NearLon, *filter.NearLat, *filter.WithinMeters)
		nextParamIdx += 3
	}

	// Full-text search
	if filter.TextSearch != nil && *filter.TextSearch != "" {
		queryConditions = append(queryConditions, fmt.Sprintf(`
			to_tsvector('spanish',
				address || ' ' || description || ' ' || city || ' ' || state || ' ' ||
				zip || ' ' || property_type || ' ' || contract || ' ' || nb_hood || ' ' ||
				CAST(year_built AS TEXT) || ' ' || CAST(beds AS TEXT) || ' ' || CAST(baths AS TEXT)
			) @@ plainto_tsquery('spanish', $%d)`, nextParamIdx))
		queryParams = append(queryParams, *filter.TextSearch)
		nextParamIdx++
	}

	return queryConditions, queryParams, nextParamIdx
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
	queryConditions, queryParams, _ := buildFilterConditions(filter)

	var query string
	if len(queryConditions) > 0 {
		query = baseQuery + " AND " + strings.Join(queryConditions, " AND ")
	} else {
		query = baseQuery
	}

	rows, err := conn.Query(ctx, query, queryParams...)
	if err != nil {
		return
	}
	defer rows.Close()

	var propCount int
	for rows.Next() {
		err = rows.Scan(&propCount)
		if err != nil {
			return
		}
	}

	paginationData = NewPagination(propCount, limit, page)

	return
}

func GetProperties(ctx context.Context, filter *PropertyFilter, limit, page int) (properties []*Property, err error) {
	conn, err := GetPool()
	if err != nil {
		return
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	baseQuery := `
		SELECT
			id, address, description, city, state, zip, country, price, property_type,
			beds, baths, square_mt, lot_size, year_built, listing_date, status,
			features, lat, lon, contract, nb_hood, main_img, imgs, agent, slug,
			earth_coords
		FROM properties WHERE 1=1
	`

	queryConditions, queryParams, _ := buildFilterConditions(filter)

	var orderOpts string
	if filter.OrderBy != nil {
		if filter.OrderDirection == nil {
			dir := OrderDirectionDESC
			filter.OrderDirection = &dir
		}
		orderOpts = fmt.Sprintf(" ORDER BY %s %s", *filter.OrderBy, *filter.OrderDirection)
	}

	var paginateOpts string
	if limit > 0 {
		paginateOpts = fmt.Sprintf(" LIMIT %d", limit)
		if page > 0 {
			paginateOpts += fmt.Sprintf(" OFFSET %d", limit*(page-1))
		}
	}

	var query string
	if len(queryConditions) > 0 {
		query = baseQuery + " AND " + strings.Join(queryConditions, " AND ") + orderOpts + paginateOpts
	} else {
		query = baseQuery + orderOpts + paginateOpts
	}

	rows, err := conn.Query(ctx, query, queryParams...)
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
			&prop.PropertyType,
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
			&prop.Coords,
		)

		if err != nil {
			return
		}

		if featsJSON != nil {
			err = json.Unmarshal(featsJSON, &prop.Features)
			if err != nil {
				return
			}
		}

		// Sync lat/lon from coords if needed
		prop.SyncLatLon()

		properties = append(properties, &prop)
	}

	return
}

func FindFeaturedProperties() ([]*Property, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	var properties []*Property

	rows, err := conn.Query(
		ctx,
		`SELECT
            id, address, city, state, zip, nb_hood, price, property_type, contract,
            beds, baths, square_mt, lot_size, listing_date, main_img, imgs, slug,
            lat, lon
        FROM properties
        WHERE featured = true
        ORDER BY listing_date DESC
        LIMIT 10`,
	)
	if err != nil {
		return nil, err
	}

	for rows.Next() {
		var property Property
		err = rows.Scan(
			&property.Id,
			&property.Address,
			&property.City,
			&property.State,
			&property.Zip,
			&property.NbHood,
			&property.Price,
			&property.PropertyType,
			&property.Contract,
			&property.Beds,
			&property.Baths,
			&property.SqMt,
			&property.LotSize,
			&property.ListingDate,
			&property.MainImg,
			&property.Images,
			&property.Slug,
			&property.Lat,
			&property.Lon,
		)
		if err != nil {
			return nil, err
		}
		properties = append(properties, &property)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return properties, nil
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
		`SELECT
			p2.id, p2.address, p2.city, p2.state, p2.zip, p2.price,
			p2.beds, p2.baths, p2.square_mt, p2.main_img, p2.contract, p2.nb_hood,
			(p1.earth_coords <@> p2.earth_coords) as distance
		FROM properties p1
		CROSS JOIN properties p2
		WHERE p1.id = $1
		    AND p2.id != $1
		    AND p2.contract = p1.contract
            AND p1.earth_coords IS NOT NULL
		    AND p2.earth_coords IS NOT NULL
            AND (p1.earth_coords <@> p2.earth_coords) <= $2
		ORDER BY distance
        LIMIT 10`,
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
		var distance float64

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
			&distance,
		)

		if err != nil {
			return nil, err
		}

		props = append(props, &prop)
	}

	return props, nil
}

func FindPropertyById(ctx context.Context, propId string) (property *Property, err error) {
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

	var featsJSON sql.NullString
	var phone sql.NullString
	var img sql.NullString
	var featuredExpiresAt sql.NullTime
	var listingDate sql.NullTime
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
		&property.PropertyType,
		&property.Beds,
		&property.Baths,
		&property.SqMt,
		&property.LotSize,
		&property.YearBuilt,
		&listingDate,
		&property.Status,
		&property.Coords,
		&featsJSON,
		&property.Lat,
		&property.Lon,
		&property.Contract,
		&property.Featured,
		&featuredExpiresAt,
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

	if listingDate.Valid {
		property.ListingDate = listingDate.Time
	}

	if featuredExpiresAt.Valid {
		property.FeaturedExpiresAt = featuredExpiresAt.Time
	}

	// Sync lat/lon from coords
	property.SyncLatLon()

	return
}

func FindPropertyBySlug(ctx context.Context, slug string) (property *Property, err error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
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
		WHERE p.slug = $1
	`, slug)

	var featsJSON sql.NullString
	var phone sql.NullString
	var img sql.NullString
	var featuredExpiresAt sql.NullTime
	var listingDate sql.NullTime
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
		&property.PropertyType,
		&property.Beds,
		&property.Baths,
		&property.SqMt,
		&property.LotSize,
		&property.YearBuilt,
		&listingDate,
		&property.Status,
		&property.Coords,
		&featsJSON,
		&property.Lat,
		&property.Lon,
		&property.Contract,
		&property.Featured,
		&featuredExpiresAt,
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

	if listingDate.Valid {
		property.ListingDate = listingDate.Time
	}

	if featuredExpiresAt.Valid {
		property.FeaturedExpiresAt = featuredExpiresAt.Time
	}

	// Sync lat/lon from coords
	property.SyncLatLon()

	return
}

func UpdatePropertyImages(property *Property) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	tx, err := conn.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	args := pgx.NamedArgs{
		"images":   property.Images,
		"main_img": property.MainImg,
		"id":       property.Id,
	}

	_, err = tx.Exec(
		ctx,
		"UPDATE properties SET images = @images, main_img = @main_img WHERE id = @id",
		args,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func UpdatePropertyImgs(id string, images []string) error {
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
