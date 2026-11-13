package routes

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestReadSPAHTML_retriesAfterError(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("FRONTEND_DIST_DIR", dir)

	// Reset cached state so this test is hermetic.
	resetSPACache()

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

	// Third call: file unchanged, served from the cache.
	got2, err := readSPAHTML()
	if err != nil {
		t.Fatalf("cached call failed: %v", err)
	}
	if &got[0] != &got2[0] {
		t.Error("expected cached slice to be the same pointer")
	}
}

func TestReadSPAHTML_rereadsChangedFile(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("FRONTEND_DIST_DIR", dir)
	resetSPACache()

	indexPath := filepath.Join(dir, "index.html")
	old := []byte(`<script src="/assets/index-old.js"></script>`)
	if err := os.WriteFile(indexPath, old, 0644); err != nil {
		t.Fatal(err)
	}
	if got, err := readSPAHTML(); err != nil || string(got) != string(old) {
		t.Fatalf("first read: got %q, %v", got, err)
	}

	// A new build: same size, so only the modification time tells it apart.
	updated := []byte(`<script src="/assets/index-new.js"></script>`)
	if err := os.WriteFile(indexPath, updated, 0644); err != nil {
		t.Fatal(err)
	}
	later := time.Now().Add(time.Minute)
	if err := os.Chtimes(indexPath, later, later); err != nil {
		t.Fatal(err)
	}
	got, err := readSPAHTML()
	if err != nil {
		t.Fatalf("read after rebuild: %v", err)
	}
	if string(got) != string(updated) {
		t.Errorf("stale index.html served after rebuild: %q", got)
	}

	// A different size is picked up even with the same modification time.
	bigger := []byte(`<script src="/assets/index-newer-build.js"></script>`)
	if err := os.WriteFile(indexPath, bigger, 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chtimes(indexPath, later, later); err != nil {
		t.Fatal(err)
	}
	if got, err := readSPAHTML(); err != nil || string(got) != string(bigger) {
		t.Errorf("size change not picked up: got %q, %v", got, err)
	}
}

func resetSPACache() {
	spaMu.Lock()
	spaBytes, spaModTime, spaSize = nil, time.Time{}, 0
	spaMu.Unlock()
}
