package routes

import (
	"bytes"
	"context"
	"fmt"
	"html"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"sync"

	"github.com/vladwithcode/sibra-site/internal/db"
)

// siteURLVal and siteURLOnce ensure SITE_URL is read from env exactly once.
// The warning is emitted at most once per process startup, not on every request.
var (
	siteURLVal  string
	siteURLOnce sync.Once
)

// siteURL returns the public base URL used for absolute og:url / og:image links.
// Configure via SITE_URL env var (e.g. https://sibrainmobiliaria.com).
// Defaults to http://localhost:8080 so development curl tests work without config.
// In production SITE_URL must be set — the default produces localhost og:image URLs
// that are unreachable by social crawlers.
func siteURL() string {
	siteURLOnce.Do(func() {
		if u := os.Getenv("SITE_URL"); u != "" {
			siteURLVal = strings.TrimRight(u, "/")
		} else {
			log.Println("warn: SITE_URL not set — og:image and og:url will use http://localhost:8080 (set SITE_URL in production)")
			siteURLVal = "http://localhost:8080"
		}
	})
	return siteURLVal
}

// ogFallbackImage is the site-wide Open Graph image used when a post has no cover.
// Uses the Sibra logo already present in web/static/img/ and served at /static/img/.
const ogFallbackImage = "/static/img/sibra_logo_512.webp"

// absoluteImageURL converts a stored cover_image value to a full URL.
//   - "" → SITE_URL + ogFallbackImage
//   - starts with http(s):// → returned as-is
//   - starts with "/" → SITE_URL + path
//   - otherwise → SITE_URL + /static/uploads/ + filename  (legacy relative name)
func absoluteImageURL(coverImage, base string) string {
	base = strings.TrimRight(base, "/")
	if coverImage == "" {
		return base + ogFallbackImage
	}
	if strings.HasPrefix(coverImage, "http://") || strings.HasPrefix(coverImage, "https://") {
		return coverImage
	}
	if strings.HasPrefix(coverImage, "/") {
		return base + coverImage
	}
	return base + "/static/uploads/" + coverImage
}

// truncateDesc cuts s to at most max runes, breaking at the last space before the
// limit and appending an ellipsis. Safe for UTF-8 strings.
func truncateDesc(s string, max int) string {
	s = strings.TrimSpace(s)
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	cut := string(runes[:max])
	if idx := strings.LastIndex(cut, " "); idx > 0 {
		cut = cut[:idx]
	}
	return cut + "…"
}

// metaDescRe matches the default <meta name="description" … /> in index.html so
// we can remove it before injecting the post-specific one. The pattern handles
// multi-line attribute formatting (Vite's index.html has the content on a new line).
var metaDescRe = regexp.MustCompile(`(?s)<meta\s[^>]*name="description"[^>]*/?>`)

// buildOGInjection returns the HTML fragment (already HTML-escaped) to inject
// before </head>. title, desc, canonical, and ogImage must be pre-escaped.
func buildOGInjection(title, desc, canonical, ogImage string) string {
	return fmt.Sprintf(
		"    <title>%s | Sibra Inmobiliaria</title>\n"+
			"    <meta name=\"description\" content=\"%s\" />\n"+
			"    <link rel=\"canonical\" href=\"%s\" />\n"+
			"    <meta property=\"og:type\" content=\"article\" />\n"+
			"    <meta property=\"og:title\" content=\"%s\" />\n"+
			"    <meta property=\"og:description\" content=\"%s\" />\n"+
			"    <meta property=\"og:url\" content=\"%s\" />\n"+
			"    <meta property=\"og:image\" content=\"%s\" />\n"+
			"    <meta property=\"og:site_name\" content=\"Sibra Inmobiliaria\" />\n"+
			"    <meta name=\"twitter:card\" content=\"summary_large_image\" />\n"+
			"    <meta name=\"twitter:title\" content=\"%s\" />\n"+
			"    <meta name=\"twitter:description\" content=\"%s\" />\n"+
			"    <meta name=\"twitter:image\" content=\"%s\" />\n",
		title, desc, canonical,
		title, desc, canonical, ogImage,
		title, desc, ogImage,
	)
}

// applyOGInjection removes the default <title> and <meta name="description">
// from src and injects the OG fragment before </head>. Returns a new slice.
func applyOGInjection(src []byte, injection string) []byte {
	out := bytes.Replace(src, []byte("<title>Sibra Inmobiliaria</title>"), nil, 1)
	out = metaDescRe.ReplaceAll(out, nil)
	out = bytes.Replace(out, []byte("</head>"), append([]byte(injection), []byte("</head>")...), 1)
	return out
}

// handleBlogPostOG serves the React SPA index.html enriched with Open Graph /
// Twitter Card meta tags for a published blog post. Non-published slugs fall
// back to the plain index.html so the React app can render its own 404 state.
func handleBlogPostOG(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	ctx := context.Background()

	post, err := db.GetBlogPostBySlug(ctx, slug)
	if err != nil {
		if isBlogNotFound(err) {
			// Draft, archived, or non-existent — serve plain SPA (React shows 404)
			serveSPA(w, r)
			return
		}
		log.Printf("err fetching blog OG for slug %q: %v\n", slug, err)
		serveSPA(w, r)
		return
	}

	base := siteURL()
	canonical := html.EscapeString(base + "/blog/" + url.PathEscape(post.Slug))
	injection := buildOGInjection(
		html.EscapeString(post.Title),
		html.EscapeString(truncateDesc(post.Snippet, 160)),
		canonical,
		html.EscapeString(absoluteImageURL(post.CoverImage, base)),
	)

	indexHTML, err := readSPAHTML()
	if err != nil {
		http.Error(w, "Frontend not built. Run: npm run build inside frontend/", http.StatusServiceUnavailable)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(applyOGInjection(indexHTML, injection))
}
