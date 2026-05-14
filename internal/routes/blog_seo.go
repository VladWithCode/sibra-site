package routes

import (
	"bytes"
	"context"
	"fmt"
	sthtml "html"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"sync"

	"github.com/vladwithcode/sibra-site/internal/blogfs"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
)

// ── SITE_URL resolution ───────────────────────────────────────────────────────

var siteURLWarnOnce sync.Once

// siteURL returns the cached public base URL for non-request contexts (e.g. tests).
// Reads SITE_URL once; falls back to http://localhost:8080.
var (
	siteURLVal  string
	siteURLOnce sync.Once
)

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

// siteBaseURL returns the public base URL, derived from the request when SITE_URL
// is not set. This is request-aware so it works correctly in dev with any host.
// In production SITE_URL must be set — relying on r.Host for og:image produces
// URLs that may not be reachable by social crawlers behind a proxy.
func siteBaseURL(r *http.Request) string {
	if u := os.Getenv("SITE_URL"); u != "" {
		return strings.TrimRight(u, "/")
	}
	siteURLWarnOnce.Do(func() {
		log.Println("warn: SITE_URL not set — og:image / og:url will use request headers (set SITE_URL in production)")
	})
	scheme := "http"
	if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	host := r.Header.Get("X-Forwarded-Host")
	if host == "" {
		host = r.Host
	}
	if host == "" {
		host = "localhost:8080"
	}
	return scheme + "://" + host
}

// ── OG image URL ──────────────────────────────────────────────────────────────

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

// ── Description truncation ────────────────────────────────────────────────────

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

// ── OG meta injection pipeline ────────────────────────────────────────────────

// metaDescRe matches the default <meta name="description" … /> in index.html so
// we can remove it before injecting the post-specific one.
var metaDescRe = regexp.MustCompile(`(?s)<meta\s[^>]*name="description"[^>]*/?>`)

// buildOGInjection returns the HTML fragment (already HTML-escaped) to inject
// before </head>. All arguments must be pre-escaped before calling.
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
// from src and injects the OG fragment before </head>.
func applyOGInjection(src []byte, injection string) []byte {
	out := bytes.Replace(src, []byte("<title>Sibra Inmobiliaria</title>"), nil, 1)
	out = metaDescRe.ReplaceAll(out, nil)
	out = bytes.Replace(out, []byte("</head>"), append([]byte(injection), []byte("</head>")...), 1)
	return out
}

// ── Markdown → HTML (safe) ────────────────────────────────────────────────────

// safeGoldmark renders Markdown to HTML with raw HTML blocks stripped.
// GFM extensions (tables, strikethrough, autolinks) match the React renderer.
var safeGoldmark = goldmark.New(
	goldmark.WithExtensions(extension.GFM),
	goldmark.WithParserOptions(parser.WithAutoHeadingID()),
	// No renderer options needed: default is HTML5, no hard-wraps, unsafe=false.
	// WithUnsafe is intentionally NOT set: raw HTML in source → <!-- raw HTML omitted -->.
)

// renderMarkdownToHTML converts Markdown to sanitized HTML.
// Falls back to HTML-escaped plain text on error (should not occur in practice).
func renderMarkdownToHTML(md string) []byte {
	var buf bytes.Buffer
	if err := safeGoldmark.Convert([]byte(md), &buf); err != nil {
		return []byte(sthtml.EscapeString(md))
	}
	return buf.Bytes()
}

// ── Article fallback HTML ─────────────────────────────────────────────────────

// buildArticleFallback returns a semantic HTML fragment for the article that is
// injected into <div id="app"> before React mounts. This gives crawlers and
// slow-connection users real content without full SSR.
//
// Inline styles are required because Go-generated HTML is not scanned by
// the Vite/Tailwind compiler, so design-token classes are not emitted for it.
//
// React replaces #app contents when it boots — normal users see the styled
// React render. The fallback is tolerable during the brief pre-React window.
func buildArticleFallback(post *db.BlogPost, mdHTML []byte, base string) string {
	var sb strings.Builder

	sb.WriteString(`<article data-blog-ssr style="max-width:800px;margin:0 auto;padding:5rem 1.25rem 3rem;font-family:sans-serif;color:#1a1c1c;line-height:1.6">`)

	// Back link
	sb.WriteString(fmt.Sprintf(
		`<a href="%s/blog" style="color:#2c47a0;font-size:0.875rem;text-decoration:none">← Volver al blog</a>`,
		sthtml.EscapeString(base),
	))

	// Title
	sb.WriteString(fmt.Sprintf(
		`<h1 style="font-size:clamp(1.75rem,5vw,2.5rem);font-weight:700;margin:1rem 0 0.5rem;line-height:1.2">%s</h1>`,
		sthtml.EscapeString(post.Title),
	))

	// Cover image (uses full absolute URL)
	if post.CoverImage != "" {
		sb.WriteString(fmt.Sprintf(
			`<img src="%s" alt="%s" style="width:100%%;border-radius:0.75rem;margin:1.25rem 0;max-height:420px;object-fit:cover" loading="eager" />`,
			sthtml.EscapeString(absoluteImageURL(post.CoverImage, base)),
			sthtml.EscapeString(post.Title),
		))
	}

	// Snippet / lead paragraph
	if post.Snippet != "" {
		sb.WriteString(fmt.Sprintf(
			`<p style="font-size:1.125rem;color:#414754;border-left:4px solid #3f5fc9;padding-left:1rem;margin:1rem 0 1.5rem;font-style:italic">%s</p>`,
			sthtml.EscapeString(post.Snippet),
		))
	}

	// Published date + reading time
	if !post.PublishedAt.IsZero() || post.ReadingTime > 0 {
		sb.WriteString(`<p style="font-size:0.875rem;color:#414754;margin:0 0 1.5rem;display:flex;flex-wrap:wrap;gap:1rem">`)
		if !post.PublishedAt.IsZero() {
			sb.WriteString(fmt.Sprintf(`<span>📅 %s</span>`, post.PublishedAt.Format("2 Jan 2006")))
		}
		if post.ReadingTime > 0 {
			sb.WriteString(fmt.Sprintf(`<span>📖 %d min de lectura</span>`, post.ReadingTime))
		}
		sb.WriteString(`</p>`)
	}

	// Rendered Markdown — output is goldmark-sanitized (no raw HTML)
	if len(mdHTML) > 0 {
		sb.WriteString(`<div style="line-height:1.75;font-size:1rem">`)
		sb.Write(mdHTML)
		sb.WriteString(`</div>`)
	}

	sb.WriteString(`</article>`)
	return sb.String()
}

// appDivRe matches the React mount point as emitted by Vite.
var appDivRe = regexp.MustCompile(`<div\s+id="app"\s*></div>`)

// injectFallbackIntoApp replaces <div id="app"></div> with the article fallback.
// Uses ReplaceAllLiteralBytes so goldmark-generated $ characters are not
// misinterpreted as regex back-references.
func injectFallbackIntoApp(src []byte, fallback string) []byte {
	replacement := []byte(`<div id="app">` + fallback + `</div>`)
	return appDivRe.ReplaceAllLiteral(src, replacement)
}

// ── Main OG handler ───────────────────────────────────────────────────────────

// handleBlogPostOG serves the React SPA index.html enriched with:
//  1. Open Graph / Twitter Card meta tags in <head>.
//  2. A pre-rendered article fallback inside <div id="app"> for crawlers and
//     users before React boots.
//
// Non-published slugs fall back to the plain SPA so React renders its own 404.
func handleBlogPostOG(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	ctx := context.Background()

	post, err := db.GetBlogPostBySlug(ctx, slug)
	if err != nil {
		if isBlogNotFound(err) {
			serveSPA(w, r)
			return
		}
		log.Printf("err fetching blog OG for slug %q: %v\n", slug, err)
		serveSPA(w, r)
		return
	}

	base := siteBaseURL(r)
	canonical := sthtml.EscapeString(base + "/blog/" + url.PathEscape(post.Slug))
	injection := buildOGInjection(
		sthtml.EscapeString(post.Title),
		sthtml.EscapeString(truncateDesc(post.Snippet, 160)),
		canonical,
		sthtml.EscapeString(absoluteImageURL(post.CoverImage, base)),
	)

	indexHTML, err := readSPAHTML()
	if err != nil {
		http.Error(w, "Frontend not built. Run: npm run build inside frontend/", http.StatusServiceUnavailable)
		return
	}

	// Read Markdown for the SEO fallback. Non-fatal: page is served with OG tags
	// even if the file cannot be read (e.g. storage not mounted yet).
	var mdHTML []byte
	if content, fsErr := blogfs.Read(blogStorageDir(), post.ContentPath); fsErr != nil {
		log.Printf("warn: reading blog markdown for fallback slug=%q: %v\n", slug, fsErr)
	} else {
		mdHTML = renderMarkdownToHTML(content)
	}

	fallback := buildArticleFallback(post, mdHTML, base)

	enriched := applyOGInjection(indexHTML, injection)
	enriched = injectFallbackIntoApp(enriched, fallback)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(enriched)
}
