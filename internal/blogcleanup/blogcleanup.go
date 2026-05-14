package blogcleanup

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

var allowedExts = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
}

// Result holds the outcome of a cleanup run.
type Result struct {
	Scanned       int
	Referenced    int
	Orphaned      int
	SkippedByAge  int
	Deleted       int
	BytesTotal    int64
	BytesOrphaned int64
	BytesDeleted  int64
	Errors        []string
}

// ScanDir returns all image files (by allowed extension) in dir.
// Does not recurse into subdirectories. Skips symlinks.
func ScanDir(dir string) ([]os.FileInfo, error) {
	absDir, err := filepath.Abs(dir)
	if err != nil {
		return nil, fmt.Errorf("blogcleanup: resolving dir: %w", err)
	}
	entries, err := os.ReadDir(absDir)
	if err != nil {
		return nil, fmt.Errorf("blogcleanup: reading dir: %w", err)
	}
	var files []os.FileInfo
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		if e.Type()&os.ModeSymlink != 0 {
			continue
		}
		ext := strings.ToLower(filepath.Ext(e.Name()))
		if !allowedExts[ext] {
			continue
		}
		info, err := e.Info()
		if err != nil {
			continue
		}
		files = append(files, info)
	}
	return files, nil
}

// mdImageRe matches Markdown image syntax: ![alt](url)
var mdImageRe = regexp.MustCompile(`!\[[^\]]*\]\(([^)]+)\)`)

// ExtractMarkdownImages returns all image URLs found in Markdown content
// that reference the blog uploads path.
func ExtractMarkdownImages(md string) []string {
	matches := mdImageRe.FindAllStringSubmatch(md, -1)
	var urls []string
	for _, m := range matches {
		url := strings.TrimSpace(m[1])
		if NormalizeToBlogFilename(url) != "" {
			urls = append(urls, url)
		}
	}
	return urls
}

const blogUploadsPrefix = "/static/uploads/blog/"

// NormalizeToBlogFilename extracts the bare filename from a blog upload URL.
// Accepts:
//   - /static/uploads/blog/file.jpg
//   - https://example.com/static/uploads/blog/file.jpg
//   - file.jpg (bare filename — legacy)
//
// Returns "" if the URL does not reference a blog upload.
func NormalizeToBlogFilename(rawURL string) string {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return ""
	}
	if idx := strings.Index(rawURL, blogUploadsPrefix); idx >= 0 {
		name := rawURL[idx+len(blogUploadsPrefix):]
		name = strings.SplitN(name, "?", 2)[0]
		name = strings.SplitN(name, "#", 2)[0]
		if name == "" || strings.Contains(name, "/") || strings.Contains(name, "..") {
			return ""
		}
		return name
	}
	if !strings.Contains(rawURL, "/") && !strings.Contains(rawURL, "..") {
		ext := strings.ToLower(filepath.Ext(rawURL))
		if allowedExts[ext] {
			return rawURL
		}
	}
	return ""
}

// BuildReferencedSet returns a set of filenames that are actively referenced.
// coverImages: list of cover_image values from DB.
// markdownContents: list of raw Markdown strings from all posts.
func BuildReferencedSet(coverImages []string, markdownContents []string) map[string]bool {
	refs := make(map[string]bool)
	for _, ci := range coverImages {
		if name := NormalizeToBlogFilename(ci); name != "" {
			refs[name] = true
		}
	}
	for _, md := range markdownContents {
		for _, url := range ExtractMarkdownImages(md) {
			if name := NormalizeToBlogFilename(url); name != "" {
				refs[name] = true
			}
		}
	}
	return refs
}

// ClassifyFiles identifies orphaned files given the on-disk files and the set
// of referenced filenames. Files modified within minAge of now are skipped.
func ClassifyFiles(files []os.FileInfo, referenced map[string]bool, now time.Time, minAge time.Duration) (orphans []os.FileInfo, skippedByAge int) {
	for _, f := range files {
		name := f.Name()
		if referenced[name] {
			continue
		}
		if now.Sub(f.ModTime()) < minAge {
			skippedByAge++
			continue
		}
		orphans = append(orphans, f)
	}
	return orphans, skippedByAge
}

// SafeDeleteFile deletes a single file only if it is inside baseDir and is a
// regular file (not a directory, not a symlink).
func SafeDeleteFile(baseDir, filename string) error {
	if strings.Contains(filename, "/") || strings.Contains(filename, "\\") || strings.Contains(filename, "..") {
		return fmt.Errorf("blogcleanup: suspicious filename rejected: %q", filename)
	}
	absBase, err := filepath.Abs(baseDir)
	if err != nil {
		return fmt.Errorf("blogcleanup: resolving base: %w", err)
	}
	target := filepath.Join(absBase, filename)
	rel, err := filepath.Rel(absBase, target)
	if err != nil || rel != filename {
		return fmt.Errorf("blogcleanup: path escapes base directory: %q", filename)
	}

	info, err := os.Lstat(target)
	if err != nil {
		return fmt.Errorf("blogcleanup: stat %q: %w", filename, err)
	}
	if info.IsDir() {
		return fmt.Errorf("blogcleanup: refusing to delete directory: %q", filename)
	}
	if info.Mode()&os.ModeSymlink != 0 {
		return fmt.Errorf("blogcleanup: refusing to delete symlink: %q", filename)
	}

	return os.Remove(target)
}
