package db

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var (
	ErrFeaturedUnknownKind        = errors.New("unknown featured item kind")
	ErrFeaturedResourceIDRequired = errors.New("featured item resource id is required")
	ErrFeaturedExternalIncomplete = errors.New("external featured items require url, title and image")
)

// FeaturedItem is the persistence model for a card in the home page featured
// section. Internal kinds (property, project, ...) link a resource by id and
// resolve their display data live; Title/Image/Subtitle act as optional
// overrides. External items carry all display data themselves.
type FeaturedItem struct {
	ID          string    `json:"id"`
	Kind        string    `json:"kind"`
	ResourceID  string    `json:"resourceId"`
	ExternalURL string    `json:"externalUrl"`
	Title       string    `json:"title"`
	Image       string    `json:"image"`
	Subtitle    string    `json:"subtitle"`
	Position    int       `json:"position"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// ResolvedFeaturedItem is the public-facing card, ready to render: the linked
// resource's data merged with any per-item overrides.
type ResolvedFeaturedItem struct {
	ID       string `json:"id"`
	Kind     string `json:"kind"`
	Position int    `json:"position"`
	Title    string `json:"title"`
	Subtitle string `json:"subtitle"`
	// Image is a browser-servable path (/static/...) or absolute URL.
	Image string `json:"image"`
	// Href is an SPA path for internal kinds or an absolute URL for external.
	Href     string `json:"href"`
	External bool   `json:"external"`
	// Meta carries kind-specific extras (e.g. property price/beds/baths).
	Meta map[string]any `json:"meta,omitempty"`
}

// featuredResource is what a resolver reports for one linked resource.
type featuredResource struct {
	Title    string
	Subtitle string
	Image    string
	Href     string
	Meta     map[string]any
}

// featuredResolvers maps a kind to a batch resolver. Adding a new linkable
// resource kind only requires registering a resolver here (and exposing the
// kind in the frontend registry); no schema change is needed. Resources the
// resolver does not return (deleted/unpublished) are dropped from the public
// section instead of erroring.
var featuredResolvers = map[string]func(ctx context.Context, ids []string) (map[string]featuredResource, error){
	FeaturedKindProperty:    resolveFeaturedProperties,
	FeaturedKindProject:     resolveFeaturedProjects,
	FeaturedKindSellingPage: resolveFeaturedSellingPages,
	FeaturedKindBlogPost:    resolveFeaturedBlogPosts,
}

const (
	FeaturedKindProperty    = "property"
	FeaturedKindProject     = "project"
	FeaturedKindSellingPage = "selling_page"
	FeaturedKindBlogPost    = "blog_post"
	FeaturedKindExternal    = "external"
)

// ValidFeaturedKind reports whether kind is external or has a registered resolver.
func ValidFeaturedKind(kind string) bool {
	if kind == FeaturedKindExternal {
		return true
	}
	_, ok := featuredResolvers[kind]
	return ok
}

// NewFeaturedItem builds a FeaturedItem with a generated id after validating
// kind-specific required fields.
func NewFeaturedItem(kind, resourceID, externalURL, title, image, subtitle string) (*FeaturedItem, error) {
	kind = strings.TrimSpace(kind)
	if !ValidFeaturedKind(kind) {
		return nil, ErrFeaturedUnknownKind
	}
	if kind == FeaturedKindExternal {
		if strings.TrimSpace(externalURL) == "" || strings.TrimSpace(title) == "" || strings.TrimSpace(image) == "" {
			return nil, ErrFeaturedExternalIncomplete
		}
		resourceID = ""
	} else {
		if strings.TrimSpace(resourceID) == "" {
			return nil, ErrFeaturedResourceIDRequired
		}
		externalURL = ""
	}

	return &FeaturedItem{
		ID:          uuid.Must(uuid.NewV7()).String(),
		Kind:        kind,
		ResourceID:  strings.TrimSpace(resourceID),
		ExternalURL: strings.TrimSpace(externalURL),
		Title:       strings.TrimSpace(title),
		Image:       strings.TrimSpace(image),
		Subtitle:    strings.TrimSpace(subtitle),
	}, nil
}

// ListFeaturedItems returns every featured item ordered by position.
func ListFeaturedItems(ctx context.Context) ([]*FeaturedItem, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := conn.Query(ctx, `
        SELECT id, kind, resource_id, external_url, title, image, subtitle, position, created_at, updated_at
        FROM featured_items
        ORDER BY position ASC, created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]*FeaturedItem, 0)
	for rows.Next() {
		var item FeaturedItem
		err := rows.Scan(
			&item.ID, &item.Kind, &item.ResourceID, &item.ExternalURL,
			&item.Title, &item.Image, &item.Subtitle, &item.Position,
			&item.CreatedAt, &item.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

// CreateFeaturedItem inserts the item at the end of the current order.
func CreateFeaturedItem(ctx context.Context, item *FeaturedItem) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	return conn.QueryRow(ctx, `
        INSERT INTO featured_items (id, kind, resource_id, external_url, title, image, subtitle, position)
        VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT COALESCE(MAX(position) + 1, 0) FROM featured_items))
        RETURNING position`,
		item.ID, item.Kind, item.ResourceID, item.ExternalURL,
		item.Title, item.Image, item.Subtitle,
	).Scan(&item.Position)
}

// UpdateFeaturedItem updates the mutable fields (kind/resource/url/overrides).
func UpdateFeaturedItem(ctx context.Context, item *FeaturedItem) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	tag, err := conn.Exec(ctx, `
        UPDATE featured_items
        SET kind = $2, resource_id = $3, external_url = $4, title = $5, image = $6, subtitle = $7, updated_at = now()
        WHERE id = $1`,
		item.ID, item.Kind, item.ResourceID, item.ExternalURL,
		item.Title, item.Image, item.Subtitle,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// DeleteFeaturedItem removes the item and returns it (so callers can clean up
// uploaded images for external items).
func DeleteFeaturedItem(ctx context.Context, id string) (*FeaturedItem, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var item FeaturedItem
	err = conn.QueryRow(ctx, `
        DELETE FROM featured_items
        WHERE id = $1
        RETURNING id, kind, resource_id, external_url, title, image, subtitle, position, created_at, updated_at`,
		id,
	).Scan(
		&item.ID, &item.Kind, &item.ResourceID, &item.ExternalURL,
		&item.Title, &item.Image, &item.Subtitle, &item.Position,
		&item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// ReorderFeaturedItems assigns positions following the order of ids. Items not
// present in ids keep their relative order after the reordered ones.
func ReorderFeaturedItems(ctx context.Context, ids []string) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	tx, err := conn.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for i, id := range ids {
		if _, err := tx.Exec(ctx, `UPDATE featured_items SET position = $2, updated_at = now() WHERE id = $1`, id, i); err != nil {
			return fmt.Errorf("error reordering featured item %s: %w", id, err)
		}
	}

	return tx.Commit(ctx)
}

// GetFeaturedVisibleCount returns how many cards show before the collapsed rest.
func GetFeaturedVisibleCount(ctx context.Context) (int, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return 0, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var count int
	err = conn.QueryRow(ctx, `SELECT visible_count FROM featured_settings WHERE id = true`).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

// SetFeaturedVisibleCount updates the visible card count setting.
func SetFeaturedVisibleCount(ctx context.Context, count int) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	_, err = conn.Exec(ctx, `
        INSERT INTO featured_settings (id, visible_count) VALUES (true, $1)
        ON CONFLICT (id) DO UPDATE SET visible_count = EXCLUDED.visible_count`,
		count,
	)
	return err
}

// ResolveFeaturedItems turns stored items into render-ready cards. Internal
// items whose resource no longer resolves (deleted, unpublished) are skipped.
func ResolveFeaturedItems(ctx context.Context, items []*FeaturedItem) ([]*ResolvedFeaturedItem, error) {
	// Collect ids per kind for batch resolution.
	idsByKind := map[string][]string{}
	for _, item := range items {
		if item.Kind == FeaturedKindExternal {
			continue
		}
		idsByKind[item.Kind] = append(idsByKind[item.Kind], item.ResourceID)
	}

	resolvedByKind := map[string]map[string]featuredResource{}
	for kind, ids := range idsByKind {
		resolver, ok := featuredResolvers[kind]
		if !ok {
			continue
		}
		resources, err := resolver(ctx, ids)
		if err != nil {
			return nil, fmt.Errorf("error resolving featured %s items: %w", kind, err)
		}
		resolvedByKind[kind] = resources
	}

	resolved := make([]*ResolvedFeaturedItem, 0, len(items))
	for _, item := range items {
		card := &ResolvedFeaturedItem{
			ID:       item.ID,
			Kind:     item.Kind,
			Position: item.Position,
			Title:    item.Title,
			Subtitle: item.Subtitle,
			Image:    item.Image,
		}

		if item.Kind == FeaturedKindExternal {
			card.Href = item.ExternalURL
			card.External = true
			resolved = append(resolved, card)
			continue
		}

		resource, ok := resolvedByKind[item.Kind][item.ResourceID]
		if !ok {
			// Linked resource is gone or not publicly visible; drop the card.
			continue
		}
		card.Href = resource.Href
		card.Meta = resource.Meta
		if card.Title == "" {
			card.Title = resource.Title
		}
		if card.Subtitle == "" {
			card.Subtitle = resource.Subtitle
		}
		if card.Image == "" {
			card.Image = resource.Image
		}
		resolved = append(resolved, card)
	}

	return resolved, nil
}

func resolveFeaturedProperties(ctx context.Context, ids []string) (map[string]featuredResource, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := conn.Query(ctx, `
        SELECT id, title, address, COALESCE(zip, ''), price, contract, beds, baths, square_mt, COALESCE(main_img, '')
        FROM properties
        WHERE id::text = ANY($1) AND deleted_at IS NULL`,
		ids,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resources := map[string]featuredResource{}
	for rows.Next() {
		var (
			id, title, address, zip, contract, mainImg string
			price, squareMt                            float64
			beds, baths                                int
		)
		if err := rows.Scan(&id, &title, &address, &zip, &price, &contract, &beds, &baths, &squareMt, &mainImg); err != nil {
			return nil, err
		}

		image := ""
		if mainImg != "" {
			image = fmt.Sprintf("/static/properties/%s/%s", id, mainImg)
		}
		if title == "" {
			title = address
		}
		resources[id] = featuredResource{
			Title:    title,
			Subtitle: fmt.Sprintf("%s. C.P. %s", address, zip),
			Image:    image,
			Href:     fmt.Sprintf("/propiedades/%s/%s", contract, id),
			Meta: map[string]any{
				"price":    price,
				"contract": contract,
				"beds":     beds,
				"baths":    baths,
				"sqMt":     squareMt,
			},
		}
	}
	return resources, rows.Err()
}

func resolveFeaturedProjects(ctx context.Context, ids []string) (map[string]featuredResource, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := conn.Query(ctx, `
        SELECT id, slug, name, COALESCE(location, ''), COALESCE(main_img, '')
        FROM projects
        WHERE id::text = ANY($1)`,
		ids,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resources := map[string]featuredResource{}
	for rows.Next() {
		var id, slug, name, location, mainImg string
		if err := rows.Scan(&id, &slug, &name, &location, &mainImg); err != nil {
			return nil, err
		}

		image := ""
		if mainImg != "" {
			image = "/static/uploads/" + mainImg
		}
		resources[id] = featuredResource{
			Title:    name,
			Subtitle: location,
			Image:    image,
			Href:     "/proyectos/" + slug,
		}
	}
	return resources, rows.Err()
}

func resolveFeaturedSellingPages(ctx context.Context, ids []string) (map[string]featuredResource, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := conn.Query(ctx, `
        SELECT id, slug, name, hero_title, hero_subtitle,
            CASE WHEN hero_media_type = 'image' THEN hero_media ELSE offer_land_img END
        FROM selling_pages
        WHERE id::text = ANY($1) AND published = true`,
		ids,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resources := map[string]featuredResource{}
	for rows.Next() {
		var id, slug, name, heroTitle, heroSubtitle, img string
		if err := rows.Scan(&id, &slug, &name, &heroTitle, &heroSubtitle, &img); err != nil {
			return nil, err
		}

		title := heroTitle
		if title == "" {
			title = name
		}
		image := ""
		if img != "" {
			image = "/static/uploads/" + img
		}
		resources[id] = featuredResource{
			Title:    title,
			Subtitle: heroSubtitle,
			Image:    image,
			Href:     "/terrenos/" + slug,
		}
	}
	return resources, rows.Err()
}

func resolveFeaturedBlogPosts(ctx context.Context, ids []string) (map[string]featuredResource, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := conn.Query(ctx, `
        SELECT id, slug, title, COALESCE(snippet, ''), COALESCE(cover_image, '')
        FROM blog_posts
        WHERE id::text = ANY($1) AND status = 'published'`,
		ids,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resources := map[string]featuredResource{}
	for rows.Next() {
		var id, slug, title, snippet, coverImage string
		if err := rows.Scan(&id, &slug, &title, &snippet, &coverImage); err != nil {
			return nil, err
		}

		image := coverImage
		if image != "" && !strings.HasPrefix(image, "/") {
			image = "/static/uploads/" + image
		}
		resources[id] = featuredResource{
			Title:    title,
			Subtitle: snippet,
			Image:    image,
			Href:     "/blog/" + slug,
		}
	}
	return resources, rows.Err()
}
