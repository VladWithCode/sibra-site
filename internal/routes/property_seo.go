package routes

import (
	"errors"
	"fmt"
	sthtml "html"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"github.com/vladwithcode/sibra-site/internal/db"
)

// maxShortDescription is the longest short description accepted, in characters.
// Search engines cut meta descriptions around this length.
const maxShortDescription = 160

// validShortDescription reports whether s fits the short description cap.
func validShortDescription(s string) bool {
	return utf8.RuneCountInString(s) <= maxShortDescription
}

var (
	htmlTagRe    = regexp.MustCompile(`<[^>]*>`)
	whitespaceRe = regexp.MustCompile(`\s+`)
)

// markdownToPlainText flattens Markdown to a single line of plain text: it is
// rendered with the sanitizing renderer, then tags are dropped. Block elements
// stay separated by the newlines the renderer writes between them.
func markdownToPlainText(md string) string {
	text := htmlTagRe.ReplaceAllString(string(renderMarkdownToHTML(md)), "")
	text = sthtml.UnescapeString(text)
	return strings.TrimSpace(whitespaceRe.ReplaceAllString(text, " "))
}

// propertyMetaTitle is the property's title, or a generated one for properties
// saved before titles existed: "Casa en venta en Av. Siempre Viva 1, Durango".
func propertyMetaTitle(p *db.Property) string {
	if t := strings.TrimSpace(p.Title); t != "" {
		return t
	}
	kind := p.PropertyType
	if kind == "" {
		kind = "propiedad"
	}
	r, size := utf8.DecodeRuneInString(kind)
	title := strings.ToUpper(string(r)) + kind[size:]
	if p.Contract != "" {
		title += " en " + p.Contract
	}
	place := strings.Trim(strings.TrimSpace(p.Address)+", "+strings.TrimSpace(p.City), ", ")
	if place != "" {
		title += " en " + place
	}
	return title
}

// propertyMetaDescription is the short description, or the start of the
// description (as plain text) when the property has none.
func propertyMetaDescription(p *db.Property) string {
	if d := strings.TrimSpace(p.ShortDescription); d != "" {
		return d
	}
	return truncateDesc(markdownToPlainText(p.Description), 155)
}

// propertyOGImage is the URL path of the property's main image at the smallest
// encoded width that covers a link preview, or "" when it has none ready.
func propertyOGImage(p *db.Property) string {
	a := p.MainImage
	if a == nil || a.Status != db.MediaStatusReady {
		return ""
	}
	widths, prefix := a.Variants.Images, "w"
	if a.Kind != "image" {
		widths, prefix = a.Variants.Poster, "poster-w"
	}
	if len(widths) == 0 {
		return ""
	}
	pick := widths[len(widths)-1]
	for _, w := range widths {
		if w >= 1200 {
			pick = w
			break
		}
	}
	return fmt.Sprintf("/static/media/%s/%s%d.webp", a.ID, prefix, pick)
}

// noindexInjection keeps pages that are not public listings out of search
// results. Like every injected tag it carries data-server-head (see
// buildHeadInjection).
const noindexInjection = "    <meta name=\"robots\" content=\"noindex\" data-server-head />\n"

// propertyHeadInjection returns the <head> fragment of a property page. A nil
// or unpublished property gets noindex and keeps the site's default tags.
func propertyHeadInjection(p *db.Property, base string) (injection string, indexable bool) {
	if p == nil || p.Status != db.PropertyStatusPublished {
		return noindexInjection, false
	}
	return buildHeadInjection(
		"website",
		sthtml.EscapeString(propertyMetaTitle(p)),
		sthtml.EscapeString(propertyMetaDescription(p)),
		sthtml.EscapeString(propertyURL(p, base)),
		sthtml.EscapeString(absoluteImageURL(propertyOGImage(p), base)),
	) + propertyProductTags(p), true
}

// propertyURL is the absolute URL of the property's public page.
func propertyURL(p *db.Property, base string) string {
	return base + "/propiedades/" + url.PathEscape(p.Contract) + "/" + url.PathEscape(p.Slug)
}

// catalogPrice formats a price the way Meta catalogs expect: a plain number
// with two decimals and no symbols or separators ("1500000.00").
func catalogPrice(price float64) string {
	return strconv.FormatFloat(price, 'f', 2, 64)
}

// propertyProductTags returns Meta's product microdata tags (OpenGraph
// product format) for the property page, so the pixel can match it to the
// catalog item whose retailer id is the property id. Empty when the property
// has no price: Meta rejects items without one. Tags carry data-server-head
// (see buildHeadInjection).
func propertyProductTags(p *db.Property) string {
	if p.Price <= 0 {
		return ""
	}
	availability := "in stock"
	if p.Status == db.PropertyStatusSold {
		availability = "out of stock"
	}
	var sb strings.Builder
	for _, tag := range [][2]string{
		{"product:brand", "Sibra Inmobiliaria"},
		{"product:availability", availability},
		{"product:condition", "new"},
		{"product:price:amount", catalogPrice(p.Price)},
		{"product:price:currency", "MXN"},
		{"product:retailer_item_id", p.Id},
	} {
		fmt.Fprintf(&sb, "    <meta property=\"%s\" content=\"%s\" data-server-head />\n", tag[0], sthtml.EscapeString(tag[1]))
	}
	return sb.String()
}

// handlePropertyOG serves the SPA index.html with the property's title,
// description, canonical and Open Graph tags, so search results and link
// previews (WhatsApp, Facebook) describe the property. React renders the page.
func handlePropertyOG(w http.ResponseWriter, r *http.Request) {
	indexHTML, err := readSPAHTML()
	if err != nil {
		http.Error(w, "Frontend not built. Run: npm run build inside frontend/", http.StatusServiceUnavailable)
		return
	}

	prop, err := db.FindPropertyBySlug(r.Context(), r.PathValue("slug"))
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("err fetching property meta for slug %q: %v\n", r.PathValue("slug"), err)
		}
		prop = nil
	}

	injection, indexable := propertyHeadInjection(prop, siteBaseURL(r))
	var out []byte
	if indexable {
		out = applyOGInjection(indexHTML, injection)
	} else {
		out = []byte(strings.Replace(string(indexHTML), "</head>", injection+"</head>", 1))
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(out)
}
