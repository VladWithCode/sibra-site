package routes

import (
	"encoding/xml"
	"strings"
	"testing"

	"github.com/vladwithcode/sibra-site/internal/db"
)

func TestBuildHomeListingFeed(t *testing.T) {
	house := publishedProperty()
	house.Id = "0190-house"
	house.Title = `Casa "A" & B`
	house.Price = 1500000
	house.Beds, house.Baths = 3, 2
	house.State, house.Country, house.Zip = "Durango", "México", "34000"
	house.Lat, house.Lon = 24.0277, -104.6532
	house.YearBuilt = 2015
	house.MainImage = &db.MediaAsset{
		ID: "img1", Kind: "image", Status: db.MediaStatusReady,
		Variants: db.MediaVariants{Images: []int{960, 1600}},
	}

	land := &db.Property{
		Id: "0190-land", Title: "Terreno", PropertyType: "terreno", Contract: "renta",
		Slug: "renta-terreno", City: "Gómez Palacio", Price: 9000.5, Status: db.PropertyStatusPublished,
	}
	noPrice := &db.Property{Id: "0190-free", Title: "Sin precio", Contract: "venta", Slug: "x"}

	out, err := buildHomeListingFeed([]*db.Property{house, land, noPrice}, "https://sibra.mx")
	if err != nil {
		t.Fatal(err)
	}
	got := string(out)

	if !strings.HasPrefix(got, xml.Header) {
		t.Errorf("missing XML header:\n%s", got)
	}
	for _, want := range []string{
		`<link rel="self" href="https://sibra.mx"></link>`,
		`<home_listing_id>0190-house</home_listing_id>`,
		`<name>Casa &#34;A&#34; &amp; B</name>`,
		`<availability>for_sale</availability>`,
		`<description>Amplia Casa luminosa con jardín. a b 1 2</description>`,
		`<address format="simple">`,
		`<component name="addr1">Av. Siempre Viva 1</component>`,
		`<component name="region">Durango</component>`,
		`<component name="country">México</component>`,
		`<component name="postal_code">34000</component>`,
		`<latitude>24.0277</latitude>`,
		`<longitude>-104.6532</longitude>`,
		`<neighborhood>Durango</neighborhood>`,
		`<image>`,
		`<url>https://sibra.mx/static/media/img1/w1600.webp</url>`,
		`<listing_type>for_sale_by_agent</listing_type>`,
		`<num_baths>2</num_baths>`,
		`<num_beds>3</num_beds>`,
		`<price>1500000.00 MXN</price>`,
		`<property_type>house</property_type>`,
		`<url>https://sibra.mx/propiedades/venta/venta-av-siempre-viva-1</url>`,
		`<year_built>2015</year_built>`,
		`<home_listing_id>0190-land</home_listing_id>`,
		`<availability>for_rent</availability>`,
		`<listing_type>for_rent_by_agent</listing_type>`,
		`<property_type>land</property_type>`,
		`<price>9000.50 MXN</price>`,
		`<description>Terreno</description>`,
	} {
		if !strings.Contains(got, want) {
			t.Errorf("feed missing %q\n%s", want, got)
		}
	}
	if strings.Contains(got, "0190-free") {
		t.Error("listing without price must be skipped")
	}

	// The land listing has no beds/baths, coordinates, image, year or empty
	// address components.
	land0 := got[strings.Index(got, "<home_listing_id>0190-land"):]
	for _, absent := range []string{"num_beds", "num_baths", "latitude", "<image>", "year_built", `name="region"`} {
		if strings.Contains(land0, absent) {
			t.Errorf("land listing must omit %s\n%s", absent, land0)
		}
	}

	var parsed homeListingFeed
	if err := xml.Unmarshal(out, &parsed); err != nil {
		t.Fatalf("feed is not valid XML: %v", err)
	}
	if len(parsed.Listings) != 2 {
		t.Errorf("want 2 listings, got %d", len(parsed.Listings))
	}
}

func TestHomePropertyType(t *testing.T) {
	for in, want := range map[string]string{"casa": "house", "apartamento": "apartment", "terreno": "land", "local": "other"} {
		if got := homePropertyType(in); got != want {
			t.Errorf("homePropertyType(%q) = %q, want %q", in, got, want)
		}
	}
}
