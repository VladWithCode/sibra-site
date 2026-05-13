package blogfs_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/vladwithcode/sibra-site/internal/blogfs"
)

// ── ValidateSlug ─────────────────────────────────────────────────────────────

func TestValidateSlug_Valid(t *testing.T) {
	cases := []string{
		"mi-post",
		"hello-world",
		"post123",
		"a",
		"abc",
		"my-post-2026",
		"123",
		strings.Repeat("a", 512),
	}
	for _, slug := range cases {
		if err := blogfs.ValidateSlug(slug); err != nil {
			t.Errorf("ValidateSlug(%q) unexpected error: %v", slug, err)
		}
	}
}

func TestValidateSlug_Invalid(t *testing.T) {
	cases := []struct {
		slug string
		desc string
	}{
		{"", "empty"},
		{strings.Repeat("a", 513), "too long (513 chars)"},
		{"Mi-Post", "uppercase letter"},
		{"mi post", "space"},
		{"mi.post", "dot"},
		{"mi/post", "forward slash"},
		{`mi\post`, "backslash"},
		{"-mi-post", "leading hyphen"},
		{"mi-post-", "trailing hyphen"},
		{"mi--post", "consecutive hyphens"},
		{"mi_post", "underscore"},
		{"mí-post", "non-ASCII character"},
		{"mi@post", "at sign"},
	}
	for _, c := range cases {
		if err := blogfs.ValidateSlug(c.slug); err == nil {
			t.Errorf("ValidateSlug(%q) expected error for %s, got nil", c.slug, c.desc)
		}
	}
}

// ── BuildContentPath ──────────────────────────────────────────────────────────

func TestBuildContentPath_Format(t *testing.T) {
	t1 := time.Date(2026, 5, 13, 0, 0, 0, 0, time.UTC)
	got, err := blogfs.BuildContentPath(t1, "mi-post")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := "2026/05/mi-post.md"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestBuildContentPath_PadsMonth(t *testing.T) {
	t1 := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	got, err := blogfs.BuildContentPath(t1, "test")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.HasPrefix(got, "2026/01/") {
		t.Errorf("expected zero-padded month in %q", got)
	}
}

func TestBuildContentPath_InvalidSlug(t *testing.T) {
	t1 := time.Now()
	if _, err := blogfs.BuildContentPath(t1, "Mi.Post"); err == nil {
		t.Error("expected error for invalid slug, got nil")
	}
}

// ── SafeResolvePath ───────────────────────────────────────────────────────────

func TestSafeResolvePath_Valid(t *testing.T) {
	base := t.TempDir()
	got, err := blogfs.SafeResolvePath(base, "2026/05/post.md")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := filepath.Join(base, "2026", "05", "post.md")
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestSafeResolvePath_RejectsDoubleDot(t *testing.T) {
	base := t.TempDir()
	cases := []string{
		"../outside.md",
		"../../etc/passwd",
		"2026/../../../etc/passwd",
		// "2026/05/../../outside.md" resolves to {base}/outside.md — legitimately inside base, not a traversal
	}
	for _, cp := range cases {
		if _, err := blogfs.SafeResolvePath(base, cp); err == nil {
			t.Errorf("SafeResolvePath(%q) expected traversal error, got nil", cp)
		}
	}
}

func TestSafeResolvePath_RejectsAbsolutePath(t *testing.T) {
	base := t.TempDir()
	cases := []string{
		"/etc/passwd",
		"/storage/blog/2026/05/post.md",
	}
	for _, cp := range cases {
		if _, err := blogfs.SafeResolvePath(base, cp); err == nil {
			t.Errorf("SafeResolvePath(%q) expected error for absolute path, got nil", cp)
		}
	}
}

func TestSafeResolvePath_RejectsBackslash(t *testing.T) {
	base := t.TempDir()
	if _, err := blogfs.SafeResolvePath(base, `2026\05\post.md`); err == nil {
		t.Error("expected error for backslash path, got nil")
	}
}

func TestSafeResolvePath_RejectsEmptyBase(t *testing.T) {
	if _, err := blogfs.SafeResolvePath("", "2026/05/post.md"); err == nil {
		t.Error("expected error for empty basePath, got nil")
	}
}

func TestSafeResolvePath_RejectsEmptyContentPath(t *testing.T) {
	base := t.TempDir()
	if _, err := blogfs.SafeResolvePath(base, ""); err == nil {
		t.Error("expected error for empty contentPath, got nil")
	}
}

// ── Write ─────────────────────────────────────────────────────────────────────

func TestWrite_CreatesFileAndDirs(t *testing.T) {
	base := t.TempDir()
	cp := "2026/05/new-post.md"
	content := "# Hello\n\nSome content."

	if err := blogfs.Write(base, cp, content); err != nil {
		t.Fatalf("Write failed: %v", err)
	}

	got, err := os.ReadFile(filepath.Join(base, "2026", "05", "new-post.md"))
	if err != nil {
		t.Fatalf("reading written file: %v", err)
	}
	if string(got) != content {
		t.Errorf("content mismatch: got %q, want %q", string(got), content)
	}
}

func TestWrite_OverwritesExisting(t *testing.T) {
	base := t.TempDir()
	cp := "2026/05/overwrite.md"

	if err := blogfs.Write(base, cp, "first"); err != nil {
		t.Fatalf("first Write failed: %v", err)
	}
	if err := blogfs.Write(base, cp, "second"); err != nil {
		t.Fatalf("second Write failed: %v", err)
	}

	got, _ := blogfs.Read(base, cp)
	if got != "second" {
		t.Errorf("expected overwritten content %q, got %q", "second", got)
	}
}

func TestWrite_NoTempFileLeft(t *testing.T) {
	base := t.TempDir()
	cp := "2026/05/clean.md"

	if err := blogfs.Write(base, cp, "content"); err != nil {
		t.Fatalf("Write failed: %v", err)
	}

	dir := filepath.Join(base, "2026", "05")
	entries, _ := os.ReadDir(dir)
	for _, e := range entries {
		if strings.HasPrefix(e.Name(), ".tmp-blog-") {
			t.Errorf("temp file left behind: %s", e.Name())
		}
	}
}

func TestWrite_RejectsTraversal(t *testing.T) {
	base := t.TempDir()
	if err := blogfs.Write(base, "../outside.md", "x"); err == nil {
		t.Error("expected error for traversal path, got nil")
	}
}

// ── Read ──────────────────────────────────────────────────────────────────────

func TestRead_ExistingFile(t *testing.T) {
	base := t.TempDir()
	cp := "2026/05/read-test.md"
	want := "# Read test\n\nContent here."

	if err := blogfs.Write(base, cp, want); err != nil {
		t.Fatalf("Write failed: %v", err)
	}

	got, err := blogfs.Read(base, cp)
	if err != nil {
		t.Fatalf("Read failed: %v", err)
	}
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestRead_NonExistentFile(t *testing.T) {
	base := t.TempDir()
	if _, err := blogfs.Read(base, "2026/05/missing.md"); err == nil {
		t.Error("expected error for missing file, got nil")
	}
}

func TestRead_RejectsTraversal(t *testing.T) {
	base := t.TempDir()
	if _, err := blogfs.Read(base, "../../etc/passwd"); err == nil {
		t.Error("expected traversal error, got nil")
	}
}

// ── Delete ────────────────────────────────────────────────────────────────────

func TestDelete_ExistingFile(t *testing.T) {
	base := t.TempDir()
	cp := "2026/05/delete-me.md"

	if err := blogfs.Write(base, cp, "bye"); err != nil {
		t.Fatalf("Write failed: %v", err)
	}
	if err := blogfs.Delete(base, cp); err != nil {
		t.Fatalf("Delete failed: %v", err)
	}

	absPath := filepath.Join(base, "2026", "05", "delete-me.md")
	if _, err := os.Stat(absPath); !os.IsNotExist(err) {
		t.Error("file still exists after Delete")
	}
}

func TestDelete_NonExistentFile(t *testing.T) {
	base := t.TempDir()
	if err := blogfs.Delete(base, "2026/05/ghost.md"); err == nil {
		t.Error("expected error deleting non-existent file, got nil")
	}
}

func TestDelete_RejectsTraversal(t *testing.T) {
	base := t.TempDir()
	if err := blogfs.Delete(base, "../secret.md"); err == nil {
		t.Error("expected traversal error, got nil")
	}
}

// ── Move ──────────────────────────────────────────────────────────────────────

func TestMove_Basic(t *testing.T) {
	base := t.TempDir()
	src := "2026/05/original.md"
	dst := "2026/05/old-1747123456-original.md"
	content := "# Original"

	if err := blogfs.Write(base, src, content); err != nil {
		t.Fatalf("Write failed: %v", err)
	}
	if err := blogfs.Move(base, src, dst); err != nil {
		t.Fatalf("Move failed: %v", err)
	}

	// Source must not exist
	if _, err := os.Stat(filepath.Join(base, "2026", "05", "original.md")); !os.IsNotExist(err) {
		t.Error("source file still exists after Move")
	}

	// Destination must have the content
	got, err := blogfs.Read(base, dst)
	if err != nil {
		t.Fatalf("reading destination: %v", err)
	}
	if got != content {
		t.Errorf("content mismatch after Move: got %q, want %q", got, content)
	}
}

func TestMove_AcrossMonths(t *testing.T) {
	base := t.TempDir()
	src := "2026/05/post.md"
	dst := "2026/06/post.md"

	if err := blogfs.Write(base, src, "content"); err != nil {
		t.Fatalf("Write failed: %v", err)
	}
	if err := blogfs.Move(base, src, dst); err != nil {
		t.Fatalf("Move across months failed: %v", err)
	}

	if _, err := blogfs.Read(base, dst); err != nil {
		t.Errorf("destination not readable after cross-month Move: %v", err)
	}
}

func TestMove_FailsIfDestinationExists(t *testing.T) {
	base := t.TempDir()
	src := "2026/05/post.md"
	dst := "2026/05/existing.md"

	if err := blogfs.Write(base, src, "source content"); err != nil {
		t.Fatalf("Write src failed: %v", err)
	}
	if err := blogfs.Write(base, dst, "destination content"); err != nil {
		t.Fatalf("Write dst failed: %v", err)
	}

	if err := blogfs.Move(base, src, dst); err == nil {
		t.Fatal("expected error when destination exists, got nil")
	}

	// Source must still exist (nothing was moved)
	if _, err := blogfs.Read(base, src); err != nil {
		t.Error("source file was removed even though Move should have failed")
	}

	// Destination content must be unchanged
	got, _ := blogfs.Read(base, dst)
	if got != "destination content" {
		t.Errorf("destination was overwritten: got %q", got)
	}
}

func TestMove_SamePathError(t *testing.T) {
	base := t.TempDir()
	cp := "2026/05/same.md"

	if err := blogfs.Write(base, cp, "x"); err != nil {
		t.Fatalf("Write failed: %v", err)
	}
	if err := blogfs.Move(base, cp, cp); err == nil {
		t.Error("expected error when source == destination, got nil")
	}
}

func TestMove_RejectsTraversalOnSource(t *testing.T) {
	base := t.TempDir()
	if err := blogfs.Move(base, "../outside.md", "2026/05/dest.md"); err == nil {
		t.Error("expected traversal error on source, got nil")
	}
}

func TestMove_RejectsTraversalOnDest(t *testing.T) {
	base := t.TempDir()
	cp := "2026/05/src.md"
	_ = blogfs.Write(base, cp, "x")
	if err := blogfs.Move(base, cp, "../outside.md"); err == nil {
		t.Error("expected traversal error on destination, got nil")
	}
}
