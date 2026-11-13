package routes

import (
	"encoding/xml"
	"log"
	"net/http"
	"strconv"

	"github.com/vladwithcode/sibra-site/internal/db"
)

// Meta home listing catalog feed (real estate):
// https://developers.facebook.com/docs/marketing-api/real-estate-ads/get-started

type homeListingFeed struct {
	XMLName  xml.Name      `xml:"listings"`
	Title    string        `xml:"title"`
	Link     feedLink      `xml:"link"`
	Listings []homeListing `xml:"listing"`
}

type feedLink struct {
	Rel  string `xml:"rel,attr"`
	Href string `xml:"href,attr"`
}

type homeListing struct {
	ID           string      `xml:"home_listing_id"`
	Name         string      `xml:"name"`
	Availability string      `xml:"availability"`
	Description  string      `xml:"description"`
	Address      feedAddress `xml:"address"`
	Latitude     string      `xml:"latitude,omitempty"`
	Longitude    string      `xml:"longitude,omitempty"`
	Neighborhood string      `xml:"neighborhood,omitempty"`
	Images       []feedImage `xml:"image"`
	ListingType  string      `xml:"listing_type"`
	NumBaths     *int        `xml:"num_baths,omitempty"`
	NumBeds      *int        `xml:"num_beds,omitempty"`
	Price        string      `xml:"price"`
	PropertyType string      `xml:"property_type"`
	URL          string      `xml:"url"`
	YearBuilt    int         `xml:"year_built,omitempty"`
}

type feedAddress struct {
	Format     string          `xml:"format,attr"`
	Components []addrComponent `xml:"component"`
}

type addrComponent struct {
	Name  string `xml:"name,attr"`
	Value string `xml:",chardata"`
}

type feedImage struct {
	URL string `xml:"url"`
}

// homeListingAvailability maps the contract to Meta's availability enum.
func homeListingAvailability(contract string) string {
	if contract == "renta" {
		return "for_rent"
	}
	return "for_sale"
}

// homeListingType maps the contract to Meta's listing_type enum.
func homeListingType(contract string) string {
	if contract == "renta" {
		return "for_rent_by_agent"
	}
	return "for_sale_by_agent"
}

// homePropertyType maps the property type to Meta's property_type enum.
func homePropertyType(propertyType string) string {
	switch propertyType {
	case "casa":
		return "house"
	case "apartamento":
		return "apartment"
	case "terreno":
		return "land"
	}
	return "other"
}

// buildHomeListingFeed renders the properties as a Meta home listing XML
// feed. Properties without a positive price are skipped (Meta rejects them);
// a property without a ready main image is still listed, without <image>.
func buildHomeListingFeed(props []*db.Property, base string) ([]byte, error) {
	feed := homeListingFeed{
		Title: "Sibra Inmobiliaria",
		Link:  feedLink{Rel: "self", Href: base},
	}
	for _, p := range props {
		if p.Price <= 0 {
			continue
		}
		l := homeListing{
			ID:           p.Id,
			Name:         propertyMetaTitle(p),
			Availability: homeListingAvailability(p.Contract),
			Description:  truncateDesc(markdownToPlainText(p.Description), 4999),
			Address:      feedAddress{Format: "simple"},
			// Properties have no neighborhood field (nb_hood was merged into
			// the address) and are not linked to hoods, so the city stands in.
			Neighborhood: p.City,
			ListingType:  homeListingType(p.Contract),
			Price:        catalogPrice(p.Price) + " MXN",
			PropertyType: homePropertyType(p.PropertyType),
			URL:          propertyURL(p, base),
			YearBuilt:    p.YearBuilt,
		}
		if l.Description == "" {
			l.Description = l.Name
		}
		for _, c := range [][2]string{
			{"addr1", p.Address},
			{"city", p.City},
			{"region", p.State},
			{"country", p.Country},
			{"postal_code", p.Zip},
		} {
			if c[1] != "" {
				l.Address.Components = append(l.Address.Components, addrComponent{Name: c[0], Value: c[1]})
			}
		}
		if p.Lat != 0 || p.Lon != 0 {
			l.Latitude = strconv.FormatFloat(p.Lat, 'f', -1, 64)
			l.Longitude = strconv.FormatFloat(p.Lon, 'f', -1, 64)
		}
		if img := propertyOGImage(p); img != "" {
			l.Images = []feedImage{{URL: absoluteImageURL(img, base)}}
		}
		if p.PropertyType != "terreno" {
			beds, baths := p.Beds, p.Baths
			l.NumBeds, l.NumBaths = &beds, &baths
		}
		feed.Listings = append(feed.Listings, l)
	}

	out, err := xml.MarshalIndent(feed, "", "    ")
	if err != nil {
		return nil, err
	}
	return append([]byte(xml.Header), out...), nil
}

// HomeListingFeed serves every published property as a Meta home listing feed.
func HomeListingFeed(w http.ResponseWriter, r *http.Request) {
	published := db.PropertyStatusPublished
	orderBy := db.OrderByListingDate
	filter := &db.PropertyFilter{Status: &published, OrderBy: &orderBy}

	// limit 0: no LIMIT clause, the feed lists every published property.
	props, err := db.GetProperties(r.Context(), filter, 0, 0)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{})
		log.Printf("Error finding properties for home listing feed: %v\n", err)
		return
	}

	out, err := buildHomeListingFeed(props, siteBaseURL(r))
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, ErrorParams{})
		log.Printf("Error building home listing feed: %v\n", err)
		return
	}

	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	w.Write(out)
}
