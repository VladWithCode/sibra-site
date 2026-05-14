package routes

import (
	"os"
	"path/filepath"
	"testing"
)

func TestReadSPAHTML_retriesAfterError(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("FRONTEND_DIST_DIR", dir)

	// Reset cached state so this test is hermetic.
	spaMu.Lock()
	spaBytes = nil
	spaMu.Unlock()

	// First call: index.html does not exist → error, NOT cached.
	_, err := readSPAHTML()
	if err == nil {
		t.Fatal("expected error when index.html missing")
	}

	// Create the file.
	indexPath := filepath.Join(dir, "index.html")
	want := []byte(`<!doctype html><html><head></head><body><div id="app"></div></body></html>`)
	if err := os.WriteFile(indexPath, want, 0644); err != nil {
		t.Fatal(err)
	}

	// Second call: should succeed now (error was not cached).
	got, err := readSPAHTML()
	if err != nil {
		t.Fatalf("expected success after build, got %v", err)
	}
	if string(got) != string(want) {
		t.Errorf("content mismatch: got %q", got)
	}

	// Third call: cached, returns same bytes.
	got2, err := readSPAHTML()
	if err != nil {
		t.Fatalf("cached call failed: %v", err)
	}
	if &got[0] != &got2[0] {
		t.Error("expected cached slice to be the same pointer")
	}
}
