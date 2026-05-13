package routes

import (
	"bytes"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// TestLimitJSONBody_under verifies that a body within the 2MB limit is read normally.
func TestLimitJSONBody_under(t *testing.T) {
	body := `{"title":"ok"}`
	r := httptest.NewRequest(http.MethodPost, "/api/admin/blog/posts", strings.NewReader(body))
	w := httptest.NewRecorder()
	limitJSONBody(w, r)

	buf := new(bytes.Buffer)
	if _, err := buf.ReadFrom(r.Body); err != nil {
		t.Fatalf("reading body: %v", err)
	}
	if buf.String() != body {
		t.Errorf("body mismatch: got %q", buf.String())
	}
}

// TestLimitJSONBody_over verifies that a body exceeding 2MB triggers a MaxBytesError.
func TestLimitJSONBody_over(t *testing.T) {
	big := strings.Repeat("x", (2<<20)+1)
	r := httptest.NewRequest(http.MethodPost, "/api/admin/blog/posts", strings.NewReader(big))
	w := httptest.NewRecorder()
	limitJSONBody(w, r)

	buf := new(bytes.Buffer)
	_, err := buf.ReadFrom(r.Body)
	if err == nil {
		t.Fatal("expected an error reading oversized body, got nil")
	}
	var maxErr *http.MaxBytesError
	if !errors.As(err, &maxErr) {
		t.Errorf("expected *http.MaxBytesError, got %T: %v", err, err)
	}
}
