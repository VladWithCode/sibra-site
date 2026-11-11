package routes

import (
	"strings"
	"testing"

	"github.com/vladwithcode/sibra-site/internal/db"
)

func publishedProperty() *db.Property {
	return &db.Property{
		Title:        "Casa con jardín en Los Remedios",
		Address:      "Av. Siempre Viva 1",
		City:         "Durango",
		PropertyType: "casa",
		Contract:     "venta",
		Slug:         "venta-av-siempre-viva-1",
		Status:       db.PropertyStatusPublished,
		Description:  "## Amplia\n\nCasa **luminosa** con [jardín](https://example.com).\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n<script>alert(1)</script>",
	}
}

func TestMarkdownToPlainText(t *testing.T) {
	got := markdownToPlainText(publishedProperty().Description)
	want := "Amplia Casa luminosa con jardín. a b 1 2"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestPropertyMetaTitle_fallback(t *testing.T) {
	p := publishedProperty()
	p.Title = "  "
	if got, want := propertyMetaTitle(p), "Casa en venta en Av. Siempre Viva 1, Durango"; got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestPropertyMetaDescription(t *testing.T) {
	p := publishedProperty()
	p.ShortDescription = "Casa de 3 recámaras con jardín."
	if got := propertyMetaDescription(p); got != p.ShortDescription {
		t.Errorf("short description not used: %q", got)
	}

	p.ShortDescription = ""
	p.Description = strings.Repeat("palabra ", 60)
	got := propertyMetaDescription(p)
	if n := len([]rune(got)); n > 156 || !strings.HasSuffix(got, "…") {
		t.Errorf("fallback not truncated: %d runes, %q", n, got)
	}
}

func TestPropertyOGImage(t *testing.T) {
	p := publishedProperty()
	if got := propertyOGImage(p); got != "" {
		t.Errorf("no main image: got %q", got)
	}
	p.MainImage = &db.MediaAsset{
		ID: "abc", Kind: "image", Status: db.MediaStatusReady,
		Variants: db.MediaVariants{Images: []int{480, 960, 1600, 2400}},
	}
	if got, want := propertyOGImage(p), "/static/media/abc/w1600.webp"; got != want {
		t.Errorf("got %q, want %q", got, want)
	}
	p.MainImage.Variants.Images = []int{480, 960}
	if got, want := propertyOGImage(p), "/static/media/abc/w960.webp"; got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestPropertyHeadInjection_published(t *testing.T) {
	p := publishedProperty()
	p.ShortDescription = `Casa "única" & amplia`
	injection, indexable := propertyHeadInjection(p, "https://sibra.mx")
	if !indexable {
		t.Fatal("published property must be indexable")
	}
	for _, want := range []string{
		"<title>Casa con jardín en Los Remedios | Sibra Inmobiliaria</title>",
		`<meta name="description" content="Casa &#34;única&#34; &amp; amplia" />`,
		`<link rel="canonical" href="https://sibra.mx/propiedades/venta/venta-av-siempre-viva-1" />`,
		`<meta property="og:type" content="website" />`,
		`<meta property="og:image" content="https://sibra.mx/static/img/sibra_logo_512.webp" />`,
	} {
		if !strings.Contains(injection, want) {
			t.Errorf("injection missing %q\n%s", want, injection)
		}
	}
	if strings.Contains(injection, "noindex") {
		t.Error("published property must not be noindex")
	}
}

func TestPropertyHeadInjection_notPublic(t *testing.T) {
	draft := publishedProperty()
	draft.Status = db.PropertyStatusDraft
	for name, p := range map[string]*db.Property{"missing": nil, "draft": draft} {
		injection, indexable := propertyHeadInjection(p, "https://sibra.mx")
		if indexable || injection != noindexInjection {
			t.Errorf("%s: want noindex only, got indexable=%v %q", name, indexable, injection)
		}
	}
}

func TestValidShortDescription(t *testing.T) {
	if !validShortDescription(strings.Repeat("ñ", 160)) {
		t.Error("160 characters must be valid")
	}
	if validShortDescription(strings.Repeat("ñ", 161)) {
		t.Error("161 characters must be invalid")
	}
}
