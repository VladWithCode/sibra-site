package db

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var (
	ErrSellingPageSlugRequired    = errors.New("selling page slug is required")
	ErrSellingPageNameRequired    = errors.New("selling page name is required")
	ErrSellingPageInvalidVariant  = errors.New("selling page variant must be 'left', 'center' or 'right'")
	ErrSellingPageMediaFieldUnkwn = errors.New("unknown selling page media field")
)

// SellingPage is the persistence model for an admin-managed landing page served
// at /terrenos/<slug>. Repeating content (offer_features, cards, steps,
// location_chips) is stored as jsonb and carried as raw JSON (pass-through to
// the React frontend, which owns the shape).
type SellingPage struct {
	ID        string `json:"id"`
	Slug      string `json:"slug"`
	Name      string `json:"name"`
	Variant   string `json:"variant"`
	Published bool   `json:"published"`

	SEOTitle        string `json:"seoTitle"`
	SEODescription  string `json:"seoDescription"`
	PixelID         string `json:"pixelId"`
	WhatsAppNumber  string `json:"whatsappNumber"`
	WhatsAppMessage string `json:"whatsappMessage"`

	HeroVideo     string `json:"heroVideo"`
	HeroPoster    string `json:"heroPoster"`
	HeroImage     string `json:"heroImage"`
	HeroTitle     string `json:"heroTitle"`
	HeroSubtitle  string `json:"heroSubtitle"`
	HeroCTALabel  string `json:"heroCtaLabel"`
	HeroCTATarget string `json:"heroCtaTarget"`

	AvailabilityImg    string `json:"availabilityImg"`
	AvailabilityCTAURL string `json:"availabilityCtaUrl"`

	ContactBgImg   string `json:"contactBgImg"`
	ContactHeading string `json:"contactHeading"`

	FinancingHeading string `json:"financingHeading"`
	FinancingBody    string `json:"financingBody"`
	FinancingImg     string `json:"financingImg"`

	OfferPrice      string          `json:"offerPrice"`
	OfferPeriod     string          `json:"offerPeriod"`
	OfferDimensions string          `json:"offerDimensions"`
	OfferFinePrint  string          `json:"offerFinePrint"`
	OfferLandImg    string          `json:"offerLandImg"`
	OfferFeatures   json.RawMessage `json:"offerFeatures"`

	Cards json.RawMessage `json:"cards"`
	Steps json.RawMessage `json:"steps"`

	LocationImg      string          `json:"locationImg"`
	LocationMapEmbed string          `json:"locationMapEmbed"`
	LocationCaption  string          `json:"locationCaption"`
	LocationChips    json.RawMessage `json:"locationChips"`

	ContactAddress string `json:"contactAddress"`
	ContactHours   string `json:"contactHours"`
	ContactPhone   string `json:"contactPhone"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

const sellingPageColumns = `
	id, slug, name, variant, published,
	seo_title, seo_description, pixel_id, whatsapp_number, whatsapp_message,
	hero_video, hero_poster, hero_image, hero_title, hero_subtitle, hero_cta_label, hero_cta_target,
	availability_img, availability_cta_url,
	contact_bg_img, contact_heading,
	financing_heading, financing_body, financing_img,
	offer_price, offer_period, offer_dimensions, offer_fine_print, offer_land_img, offer_features,
	cards, steps,
	location_img, location_map_embed, location_caption, location_chips,
	contact_address, contact_hours, contact_phone,
	created_at, updated_at`

// sellingPageMediaColumns whitelists the columns updatable via the media upload
// endpoint. Maps an allowed field name -> its SQL column (identical here).
// Prevents arbitrary column updates from user input.
var sellingPageMediaColumns = map[string]string{
	"hero_video":       "hero_video",
	"hero_poster":      "hero_poster",
	"hero_image":       "hero_image",
	"availability_img": "availability_img",
	"contact_bg_img":   "contact_bg_img",
	"financing_img":    "financing_img",
	"offer_land_img":   "offer_land_img",
	"location_img":     "location_img",
}

// IsSellingPageMediaField reports whether field is an uploadable media column.
func IsSellingPageMediaField(field string) bool {
	_, ok := sellingPageMediaColumns[field]
	return ok
}

// IsSellingPageVideoField reports whether the field expects a video (vs image).
func IsSellingPageVideoField(field string) bool {
	return field == "hero_video"
}

func validateSellingPage(p *SellingPage) error {
	if p.Slug == "" {
		return ErrSellingPageSlugRequired
	}
	if p.Name == "" {
		return ErrSellingPageNameRequired
	}
	switch p.Variant {
	case "left", "center", "right":
	case "":
		p.Variant = "right"
	default:
		return ErrSellingPageInvalidVariant
	}
	return nil
}

func scanSellingPage(row pgx.Row) (*SellingPage, error) {
	var p SellingPage
	err := row.Scan(
		&p.ID, &p.Slug, &p.Name, &p.Variant, &p.Published,
		&p.SEOTitle, &p.SEODescription, &p.PixelID, &p.WhatsAppNumber, &p.WhatsAppMessage,
		&p.HeroVideo, &p.HeroPoster, &p.HeroImage, &p.HeroTitle, &p.HeroSubtitle, &p.HeroCTALabel, &p.HeroCTATarget,
		&p.AvailabilityImg, &p.AvailabilityCTAURL,
		&p.ContactBgImg, &p.ContactHeading,
		&p.FinancingHeading, &p.FinancingBody, &p.FinancingImg,
		&p.OfferPrice, &p.OfferPeriod, &p.OfferDimensions, &p.OfferFinePrint, &p.OfferLandImg, &p.OfferFeatures,
		&p.Cards, &p.Steps,
		&p.LocationImg, &p.LocationMapEmbed, &p.LocationCaption, &p.LocationChips,
		&p.ContactAddress, &p.ContactHours, &p.ContactPhone,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func sellingPageArgs(p *SellingPage) pgx.NamedArgs {
	return pgx.NamedArgs{
		"id":                   p.ID,
		"slug":                 p.Slug,
		"name":                 p.Name,
		"variant":              p.Variant,
		"published":            p.Published,
		"seo_title":            p.SEOTitle,
		"seo_description":      p.SEODescription,
		"pixel_id":             p.PixelID,
		"whatsapp_number":      p.WhatsAppNumber,
		"whatsapp_message":     p.WhatsAppMessage,
		"hero_video":           p.HeroVideo,
		"hero_poster":          p.HeroPoster,
		"hero_image":           p.HeroImage,
		"hero_title":           p.HeroTitle,
		"hero_subtitle":        p.HeroSubtitle,
		"hero_cta_label":       p.HeroCTALabel,
		"hero_cta_target":      p.HeroCTATarget,
		"availability_img":     p.AvailabilityImg,
		"availability_cta_url": p.AvailabilityCTAURL,
		"contact_bg_img":       p.ContactBgImg,
		"contact_heading":      p.ContactHeading,
		"financing_heading":    p.FinancingHeading,
		"financing_body":       p.FinancingBody,
		"financing_img":        p.FinancingImg,
		"offer_price":          p.OfferPrice,
		"offer_period":         p.OfferPeriod,
		"offer_dimensions":     p.OfferDimensions,
		"offer_fine_print":     p.OfferFinePrint,
		"offer_land_img":       p.OfferLandImg,
		"offer_features":       jsonbOrNil(p.OfferFeatures),
		"cards":                jsonbOrNil(p.Cards),
		"steps":                jsonbOrNil(p.Steps),
		"location_img":         p.LocationImg,
		"location_map_embed":   p.LocationMapEmbed,
		"location_caption":     p.LocationCaption,
		"location_chips":       jsonbOrNil(p.LocationChips),
		"contact_address":      p.ContactAddress,
		"contact_hours":        p.ContactHours,
		"contact_phone":        p.ContactPhone,
	}
}

// jsonbOrNil keeps empty/invalid raw JSON as a NULL jsonb instead of failing.
func jsonbOrNil(raw json.RawMessage) any {
	if len(raw) == 0 || !json.Valid(raw) {
		return nil
	}
	return []byte(raw)
}

func CreateSellingPage(ctx context.Context, p *SellingPage) error {
	if err := validateSellingPage(p); err != nil {
		return err
	}

	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if p.ID == "" {
		p.ID = uuid.Must(uuid.NewV7()).String()
	}

	_, err = conn.Exec(
		ctx,
		`INSERT INTO selling_pages (`+sellingPageColumns+`)
		VALUES (@id, @slug, @name, @variant, @published,
			@seo_title, @seo_description, @pixel_id, @whatsapp_number, @whatsapp_message,
			@hero_video, @hero_poster, @hero_image, @hero_title, @hero_subtitle, @hero_cta_label, @hero_cta_target,
			@availability_img, @availability_cta_url,
			@contact_bg_img, @contact_heading,
			@financing_heading, @financing_body, @financing_img,
			@offer_price, @offer_period, @offer_dimensions, @offer_fine_print, @offer_land_img, @offer_features,
			@cards, @steps,
			@location_img, @location_map_embed, @location_caption, @location_chips,
			@contact_address, @contact_hours, @contact_phone,
			NOW(), NOW())`,
		sellingPageArgs(p),
	)
	return err
}

func GetSellingPageByID(ctx context.Context, id string) (*SellingPage, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	row := conn.QueryRow(ctx, `SELECT `+sellingPageColumns+` FROM selling_pages WHERE id = $1`, id)
	return scanSellingPage(row)
}

func GetSellingPageBySlug(ctx context.Context, slug string) (*SellingPage, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	row := conn.QueryRow(ctx, `SELECT `+sellingPageColumns+` FROM selling_pages WHERE slug = $1`, slug)
	return scanSellingPage(row)
}

func ListSellingPages(ctx context.Context) ([]*SellingPage, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := conn.Query(ctx, `SELECT `+sellingPageColumns+` FROM selling_pages ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	pages := []*SellingPage{}
	for rows.Next() {
		p, err := scanSellingPage(rows)
		if err != nil {
			return nil, err
		}
		pages = append(pages, p)
	}
	return pages, rows.Err()
}

func UpdateSellingPage(ctx context.Context, p *SellingPage) error {
	if err := validateSellingPage(p); err != nil {
		return err
	}

	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	tag, err := conn.Exec(
		ctx,
		`UPDATE selling_pages SET
			slug = @slug, name = @name, variant = @variant, published = @published,
			seo_title = @seo_title, seo_description = @seo_description, pixel_id = @pixel_id,
			whatsapp_number = @whatsapp_number, whatsapp_message = @whatsapp_message,
			hero_video = @hero_video, hero_poster = @hero_poster, hero_image = @hero_image,
			hero_title = @hero_title, hero_subtitle = @hero_subtitle, hero_cta_label = @hero_cta_label, hero_cta_target = @hero_cta_target,
			availability_img = @availability_img, availability_cta_url = @availability_cta_url,
			contact_bg_img = @contact_bg_img, contact_heading = @contact_heading,
			financing_heading = @financing_heading, financing_body = @financing_body, financing_img = @financing_img,
			offer_price = @offer_price, offer_period = @offer_period, offer_dimensions = @offer_dimensions,
			offer_fine_print = @offer_fine_print, offer_land_img = @offer_land_img, offer_features = @offer_features,
			cards = @cards, steps = @steps,
			location_img = @location_img, location_map_embed = @location_map_embed,
			location_caption = @location_caption, location_chips = @location_chips,
			contact_address = @contact_address, contact_hours = @contact_hours, contact_phone = @contact_phone,
			updated_at = NOW()
		WHERE id = @id`,
		sellingPageArgs(p),
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func DeleteSellingPage(ctx context.Context, id string) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	tag, err := conn.Exec(ctx, `DELETE FROM selling_pages WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func SetSellingPagePublished(ctx context.Context, id string, published bool) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	tag, err := conn.Exec(ctx, `UPDATE selling_pages SET published = $2, updated_at = NOW() WHERE id = $1`, id, published)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// UpdateSellingPageMediaField sets a single whitelisted media column. The column
// name comes only from the whitelist map, never raw user input.
func UpdateSellingPageMediaField(ctx context.Context, id, field, value string) error {
	col, ok := sellingPageMediaColumns[field]
	if !ok {
		return ErrSellingPageMediaFieldUnkwn
	}

	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	query := fmt.Sprintf("UPDATE selling_pages SET %s = $2, updated_at = NOW() WHERE id = $1", col)
	tag, err := conn.Exec(ctx, query, id, value)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}
