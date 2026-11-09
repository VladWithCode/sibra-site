package routes

import (
	"net/http/httptest"
	"testing"

	"github.com/vladwithcode/sibra-site/internal/db"
)

// Public routes must ignore any client-supplied status and only ever query
// published properties.
func TestPublicPropertyFilterForcesPublished(t *testing.T) {
	for _, q := range []string{"", "?status=borrador", "?status=archivada&city=Durango", "?status="} {
		r := httptest.NewRequest("GET", "/api/propiedades"+q, nil)
		f := publicPropertyFilter(r)
		if f.Status == nil || *f.Status != db.PropertyStatusPublished {
			t.Errorf("%q: status = %v, want %q", q, f.Status, db.PropertyStatusPublished)
		}
	}
}
