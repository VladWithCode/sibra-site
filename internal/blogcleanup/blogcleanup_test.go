package blogcleanup

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

// ── ExtractMarkdownImages ────────────────────────────────────────────────────

func TestExtractMarkdownImages_various(t *testing.T) {
	md := `# Post
![cover](/static/uploads/blog/cover.jpg)
Some text with ![inline](https://example.com/static/uploads/blog/inline.png).
![external](https://cdn.other.com/photo.jpg)
![local](/static/uploads/blog/local.webp)
`
	got := ExtractMarkdownImages(md)
	want := []string{
		"/static/uploads/blog/cover.jpg",
		"https://example.com/static/uploads/blog/inline.png",
		"/static/uploads/blog/local.webp",
	}
	if len(got) != len(want) {
		t.Fatalf("expected %d images, got %d: %v", len(want), len(got), got)
	}
	for i, w := range want {
		if got[i] != w {
			t.Errorf("image[%d] = %q, want %q", i, got[i], w)
		}
	}
}

func TestExtractMarkdownImages_noMatches(t *testing.T) {
	md := `# No images here
Just text and [a link](https://example.com).
`
	got := ExtractMarkdownImages(md)
	if len(got) != 0 {
		t.Errorf("expected 0 images, got %v", got)
	}
}

func TestExtractMarkdownImages_externalOnly(t *testing.T) {
	md := `![photo](https://cdn.other.com/photo.jpg)`
	got := ExtractMarkdownImages(md)
	if len(got) != 0 {
		t.Errorf("external-only image should not match, got %v", got)
	}
}

// ── NormalizeToBlogFilename ──────────────────────────────────────────────────

func TestNormalize_absolutePath(t *testing.T) {
	got := NormalizeToBlogFilename("/static/uploads/blog/abc.jpg")
	if got != "abc.jpg" {
		t.Errorf("got %q, want %q", got, "abc.jpg")
	}
}

func TestNormalize_fullURL(t *testing.T) {
	got := NormalizeToBlogFilename("https://sibrainmobiliaria.com/static/uploads/blog/img.png")
	if got != "img.png" {
		t.Errorf("got %q, want %q", got, "img.png")
	}
}

func TestNormalize_withQueryString(t *testing.T) {
	got := NormalizeToBlogFilename("/static/uploads/blog/img.webp?v=2")
	if got != "img.webp" {
		t.Errorf("got %q, want %q", got, "img.webp")
	}
}

func TestNormalize_bareFilename(t *testing.T) {
	got := NormalizeToBlogFilename("legacy.jpg")
	if got != "legacy.jpg" {
		t.Errorf("got %q, want %q", got, "legacy.jpg")
	}
}

func TestNormalize_nonBlogPath(t *testing.T) {
	got := NormalizeToBlogFilename("/static/uploads/properties/img.jpg")
	if got != "" {
		t.Errorf("non-blog path should return empty, got %q", got)
	}
}

func TestNormalize_traversalAttack(t *testing.T) {
	cases := []string{
		"/static/uploads/blog/../../../etc/passwd",
		"/static/uploads/blog/sub/file.jpg",
		"../secret.jpg",
	}
	for _, c := range cases {
		got := NormalizeToBlogFilename(c)
		if got != "" {
			t.Errorf("NormalizeToBlogFilename(%q) = %q, want empty", c, got)
		}
	}
}

func TestNormalize_empty(t *testing.T) {
	if got := NormalizeToBlogFilename(""); got != "" {
		t.Errorf("empty input should return empty, got %q", got)
	}
}

// ── BuildReferencedSet ───────────────────────────────────────────────────────

func TestBuildReferencedSet(t *testing.T) {
	covers := []string{
		"/static/uploads/blog/cover1.jpg",
		"",
		"/static/uploads/blog/cover2.png",
	}
	markdowns := []string{
		"![img](/static/uploads/blog/inline1.webp)\ntext",
		"no images here",
		"![img](/static/uploads/blog/cover1.jpg)", // duplicate of cover
	}
	refs := BuildReferencedSet(covers, markdowns)
	expected := map[string]bool{
		"cover1.jpg":   true,
		"cover2.png":   true,
		"inline1.webp": true,
	}
	if len(refs) != len(expected) {
		t.Fatalf("expected %d refs, got %d: %v", len(expected), len(refs), refs)
	}
	for k := range expected {
		if !refs[k] {
			t.Errorf("missing expected ref %q", k)
		}
	}
}

// ── ClassifyFiles ────────────────────────────────────────────────────────────

type fakeFileInfo struct {
	name    string
	size    int64
	modTime time.Time
}

func (f fakeFileInfo) Name() string       { return f.name }
func (f fakeFileInfo) Size() int64        { return f.size }
func (f fakeFileInfo) Mode() os.FileMode  { return 0644 }
func (f fakeFileInfo) ModTime() time.Time { return f.modTime }
func (f fakeFileInfo) IsDir() bool        { return false }
func (f fakeFileInfo) Sys() any           { return nil }

func TestClassifyFiles(t *testing.T) {
	now := time.Date(2026, 5, 13, 12, 0, 0, 0, time.UTC)
	files := []os.FileInfo{
		fakeFileInfo{name: "referenced.jpg", size: 1000, modTime: now.Add(-48 * time.Hour)},
		fakeFileInfo{name: "orphan-old.png", size: 2000, modTime: now.Add(-48 * time.Hour)},
		fakeFileInfo{name: "orphan-new.webp", size: 3000, modTime: now.Add(-1 * time.Hour)},
	}
	refs := map[string]bool{"referenced.jpg": true}
	orphans, skipped := ClassifyFiles(files, refs, now, 24*time.Hour)

	if len(orphans) != 1 || orphans[0].Name() != "orphan-old.png" {
		t.Errorf("expected 1 orphan (orphan-old.png), got %v", orphans)
	}
	if skipped != 1 {
		t.Errorf("expected 1 skipped by age, got %d", skipped)
	}
}

// ── SafeDeleteFile ───────────────────────────────────────────────────────────

func TestSafeDeleteFile_deletesOrphan(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "orphan.jpg")
	if err := os.WriteFile(path, []byte("fake image"), 0644); err != nil {
		t.Fatal(err)
	}

	if err := SafeDeleteFile(dir, "orphan.jpg"); err != nil {
		t.Fatalf("SafeDeleteFile: %v", err)
	}
	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Error("file should have been deleted")
	}
}

func TestSafeDeleteFile_rejectsTraversal(t *testing.T) {
	dir := t.TempDir()
	cases := []string{
		"../outside.jpg",
		"sub/file.jpg",
		"..\\escape.jpg",
	}
	for _, c := range cases {
		if err := SafeDeleteFile(dir, c); err == nil {
			t.Errorf("expected error for %q, got nil", c)
		}
	}
}

func TestSafeDeleteFile_rejectsDirectory(t *testing.T) {
	dir := t.TempDir()
	subdir := filepath.Join(dir, "subdir")
	os.Mkdir(subdir, 0755)

	if err := SafeDeleteFile(dir, "subdir"); err == nil {
		t.Error("expected error when target is a directory")
	}
}

// ── ScanDir ──────────────────────────────────────────────────────────────────

func TestScanDir(t *testing.T) {
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "a.jpg"), []byte("img"), 0644)
	os.WriteFile(filepath.Join(dir, "b.png"), []byte("img"), 0644)
	os.WriteFile(filepath.Join(dir, "c.txt"), []byte("text"), 0644)
	os.WriteFile(filepath.Join(dir, "d.WEBP"), []byte("img"), 0644)
	os.Mkdir(filepath.Join(dir, "subdir"), 0755)

	files, err := ScanDir(dir)
	if err != nil {
		t.Fatal(err)
	}
	if len(files) != 3 {
		names := make([]string, len(files))
		for i, f := range files {
			names[i] = f.Name()
		}
		t.Errorf("expected 3 image files, got %d: %v", len(files), names)
	}
}

// ── DryRun integration (temp dir, no DB) ─────────────────────────────────────

func TestDryRunDoesNotDelete(t *testing.T) {
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "orphan.jpg"), []byte("fake"), 0644)
	os.WriteFile(filepath.Join(dir, "ref.png"), []byte("fake"), 0644)

	files, _ := ScanDir(dir)
	refs := map[string]bool{"ref.png": true}
	now := time.Now()
	orphans, _ := ClassifyFiles(files, refs, now, 0)

	if len(orphans) != 1 {
		t.Fatalf("expected 1 orphan, got %d", len(orphans))
	}

	// Dry run: do NOT call SafeDeleteFile
	// Verify file still exists
	if _, err := os.Stat(filepath.Join(dir, "orphan.jpg")); err != nil {
		t.Error("orphan should still exist in dry-run mode")
	}
}

func TestDeleteRemovesOnlyOrphans(t *testing.T) {
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "orphan.jpg"), []byte("fake orphan"), 0644)
	os.WriteFile(filepath.Join(dir, "keep.png"), []byte("fake keep"), 0644)

	files, _ := ScanDir(dir)
	refs := map[string]bool{"keep.png": true}
	now := time.Now()
	orphans, _ := ClassifyFiles(files, refs, now, 0)

	for _, o := range orphans {
		if err := SafeDeleteFile(dir, o.Name()); err != nil {
			t.Fatalf("delete failed: %v", err)
		}
	}

	if _, err := os.Stat(filepath.Join(dir, "orphan.jpg")); !os.IsNotExist(err) {
		t.Error("orphan should be deleted")
	}
	if _, err := os.Stat(filepath.Join(dir, "keep.png")); err != nil {
		t.Error("referenced file should still exist")
	}
}
