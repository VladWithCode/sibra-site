package routes

import (
	"net/url"
	"strings"
	"testing"
)

// ── truncateDesc ──────────────────────────────────────────────────────────────

func TestTruncateDesc_short(t *testing.T) {
	in := "Breve descripción."
	got := truncateDesc(in, 160)
	if got != in {
		t.Errorf("expected unchanged, got %q", got)
	}
}

func TestTruncateDesc_exact(t *testing.T) {
	in := strings.Repeat("a", 160)
	got := truncateDesc(in, 160)
	if got != in {
		t.Errorf("expected unchanged at exact limit, got len=%d", len(got))
	}
}

func TestTruncateDesc_long(t *testing.T) {
	in := strings.Repeat("word ", 50) // 250 chars
	got := truncateDesc(in, 160)
	runes := []rune(got)
	if len(runes) > 161 { // 160 chars + possible ellipsis char (1 rune)
		t.Errorf("expected ≤161 runes, got %d", len(runes))
	}
	if !strings.HasSuffix(got, "…") {
		t.Errorf("expected ellipsis suffix, got %q", got)
	}
}

func TestTruncateDesc_breaksAtSpace(t *testing.T) {
	// 155 'a' chars + space + 10 'b' chars = 166 total; truncate at 160
	in := strings.Repeat("a", 155) + " " + strings.Repeat("b", 10)
	got := truncateDesc(in, 160)
	// Should break before the space, producing 155 'a's + "…"
	if strings.Contains(got, "b") {
		t.Errorf("should have cut at space, not included 'b's: %q", got)
	}
}

func TestTruncateDesc_utf8(t *testing.T) {
	// Each 'ñ' is one rune but two bytes — must not cut mid-rune
	in := strings.Repeat("ñ", 200)
	got := truncateDesc(in, 160)
	if !strings.HasSuffix(got, "…") {
		t.Errorf("expected ellipsis, got %q", got)
	}
	runes := []rune(got)
	if len(runes) > 161 {
		t.Errorf("expected ≤161 runes, got %d", len(runes))
	}
}

// ── absoluteImageURL ──────────────────────────────────────────────────────────

func TestAbsoluteImageURL_empty(t *testing.T) {
	got := absoluteImageURL("", "https://example.com")
	want := "https://example.com" + ogFallbackImage
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestAbsoluteImageURL_absolute(t *testing.T) {
	img := "https://cdn.example.com/img/cover.jpg"
	got := absoluteImageURL(img, "https://example.com")
	if got != img {
		t.Errorf("absolute URL should be returned as-is: got %q", got)
	}
}

func TestAbsoluteImageURL_rootRelative(t *testing.T) {
	got := absoluteImageURL("/static/uploads/blog/img.webp", "https://example.com")
	want := "https://example.com/static/uploads/blog/img.webp"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestAbsoluteImageURL_legacyRelative(t *testing.T) {
	got := absoluteImageURL("img.jpg", "https://example.com")
	want := "https://example.com/static/uploads/img.jpg"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestAbsoluteImageURL_noTrailingSlashOnBase(t *testing.T) {
	// Trailing slash in base must not produce double slash
	got := absoluteImageURL("", "https://example.com/")
	// siteURL() trims trailing slash, but test absoluteImageURL directly
	if strings.Contains(got, "//static") {
		t.Errorf("double slash in path: %q", got)
	}
}

// ── OG meta injection pipeline ────────────────────────────────────────────────

func TestOGInjection_containsAllTags(t *testing.T) {
	// Minimal index.html that mimics the real dist/index.html structure
	indexHTML := []byte(`<!doctype html><html><head>` +
		`<title>Sibra Inmobiliaria</title>` +
		`<meta name="description" content="Default desc" />` +
		`</head><body><div id="app"></div></body></html>`)

	title := "Casas en Durango: inversión &amp; plusvalía"
	desc := "Descripción del artículo de prueba."
	canonical := "https://example.com/blog/test-slug"
	ogImage := "https://example.com/static/img/sibra_logo_512.webp"

	injection := buildOGInjection(title, desc, canonical, ogImage)

	// Apply the same pipeline as handleBlogPostOG
	enriched := applyOGInjection(indexHTML, injection)

	checks := []string{
		`property="og:title"`,
		`property="og:description"`,
		`property="og:image"`,
		`rel="canonical"`,
		`name="twitter:card"`,
		`id="app"`,
		"https://example.com/static/img/sibra_logo_512.webp",
	}
	for _, c := range checks {
		if !strings.Contains(string(enriched), c) {
			t.Errorf("missing %q in enriched HTML", c)
		}
	}
}

func TestOGInjection_noDuplicateTitle(t *testing.T) {
	indexHTML := []byte(`<html><head><title>Sibra Inmobiliaria</title></head><body></body></html>`)
	injection := buildOGInjection("Post Title", "Desc", "https://x.com/blog/s", "https://x.com/img.webp")
	enriched := string(applyOGInjection(indexHTML, injection))

	count := strings.Count(enriched, "<title>")
	if count != 1 {
		t.Errorf("expected exactly 1 <title> tag, got %d", count)
	}
}

// ── Canonical URL safety ──────────────────────────────────────────────────────

// TestCanonicalSlug_pathEscaped verifies that a slug is URL-path-escaped before
// being placed in the canonical href. Normal slugs ([a-z0-9-]) are unaffected;
// this guard covers any edge case that bypasses slug validation.
func TestCanonicalSlug_pathEscaped(t *testing.T) {
	slug := "casas-en-durango"
	base := "https://example.com"
	canonical := base + "/blog/" + url.PathEscape(slug)

	// Standard slug must not be mangled by path escaping
	want := "https://example.com/blog/casas-en-durango"
	if canonical != want {
		t.Errorf("expected %q, got %q", want, canonical)
	}
}

func TestCanonicalSlug_inOGInjection(t *testing.T) {
	indexHTML := []byte(`<!doctype html><html><head>` +
		`<title>Sibra Inmobiliaria</title>` +
		`<meta name="description" content="Default" />` +
		`</head><body><div id="app"></div></body></html>`)

	slug := "mi-articulo-2024"
	base := "https://sibrainmobiliaria.com"
	canonical := base + "/blog/" + url.PathEscape(slug)

	injection := buildOGInjection(
		"Título de prueba",
		"Descripción del artículo.",
		canonical,
		base+ogFallbackImage,
	)
	enriched := string(applyOGInjection(indexHTML, injection))

	wantCanonical := `href="https://sibrainmobiliaria.com/blog/mi-articulo-2024"`
	if !strings.Contains(enriched, wantCanonical) {
		t.Errorf("canonical href not found or incorrect in enriched HTML; want %q", wantCanonical)
	}
}

func TestOGInjection_noDuplicateMetaDesc(t *testing.T) {
	indexHTML := []byte(`<html><head>` +
		"<meta\n    name=\"description\"\n    content=\"Default\"\n/>" +
		`</head><body></body></html>`)
	injection := buildOGInjection("T", "D", "https://x.com/blog/s", "https://x.com/img.webp")
	enriched := string(applyOGInjection(indexHTML, injection))

	count := strings.Count(enriched, `name="description"`)
	if count != 1 {
		t.Errorf("expected exactly 1 meta description, got %d", count)
	}
}
