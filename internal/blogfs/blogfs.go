package blogfs

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// slugRegex allows only lowercase letters, digits, and single hyphens between segments.
// Leading/trailing hyphens and consecutive hyphens are not allowed.
var slugRegex = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)

// ValidateSlug returns an error if slug contains characters outside [a-z0-9-]
// or violates structural rules (empty, too long, leading/trailing/consecutive hyphens).
func ValidateSlug(slug string) error {
	if slug == "" {
		return errors.New("slug must not be empty")
	}
	if len(slug) > 512 {
		return fmt.Errorf("slug exceeds maximum length of 512 characters (got %d)", len(slug))
	}
	if !slugRegex.MatchString(slug) {
		return errors.New("slug must contain only lowercase letters, digits, and hyphens; no leading, trailing, or consecutive hyphens")
	}
	return nil
}

// BuildContentPath returns the relative content path for a post given a timestamp and slug.
// Format: "2006/01/my-slug.md"
func BuildContentPath(t time.Time, slug string) (string, error) {
	if err := ValidateSlug(slug); err != nil {
		return "", fmt.Errorf("blogfs.BuildContentPath: %w", err)
	}
	return fmt.Sprintf("%04d/%02d/%s.md", t.Year(), int(t.Month()), slug), nil
}

// SafeResolvePath resolves basePath+contentPath and verifies the result stays within basePath.
//
// Rejects:
//   - empty inputs
//   - backslashes in contentPath
//   - absolute contentPath
//   - ".." components that escape basePath
//   - any resolved path outside basePath
func SafeResolvePath(basePath, contentPath string) (string, error) {
	if basePath == "" {
		return "", errors.New("blogfs: base path must not be empty")
	}
	if contentPath == "" {
		return "", errors.New("blogfs: content path must not be empty")
	}
	if strings.Contains(contentPath, `\`) {
		return "", errors.New("blogfs: content path must not contain backslashes")
	}
	// filepath.IsAbs misses Unix-style "/..." paths on Windows, so check both.
	if filepath.IsAbs(contentPath) || strings.HasPrefix(contentPath, "/") {
		return "", errors.New("blogfs: content path must be relative, not absolute")
	}

	absBase, err := filepath.Abs(basePath)
	if err != nil {
		return "", fmt.Errorf("blogfs: resolving base path: %w", err)
	}

	// filepath.Join calls filepath.Clean internally, normalising ".." segments
	absTarget := filepath.Join(absBase, contentPath)

	rel, err := filepath.Rel(absBase, absTarget)
	if err != nil {
		return "", fmt.Errorf("blogfs: computing relative path: %w", err)
	}

	// If rel is ".." or starts with "../", the target is outside basePath
	if rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return "", errors.New("blogfs: content path escapes the base directory")
	}

	return absTarget, nil
}

// Write atomically writes content to basePath/contentPath.
//
// It creates a temporary file in the same directory, writes, syncs, then renames
// to the final path. On any failure the temporary file is removed.
// Intermediate directories are created with mode 0755.
func Write(basePath, contentPath, content string) error {
	absPath, err := SafeResolvePath(basePath, contentPath)
	if err != nil {
		return fmt.Errorf("blogfs.Write: %w", err)
	}

	dir := filepath.Dir(absPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("blogfs.Write: creating directories: %w", err)
	}

	tmp, err := os.CreateTemp(dir, ".tmp-blog-*")
	if err != nil {
		return fmt.Errorf("blogfs.Write: creating temp file: %w", err)
	}
	tmpName := tmp.Name()

	committed := false
	defer func() {
		if !committed {
			os.Remove(tmpName)
		}
	}()

	if err := tmp.Chmod(0644); err != nil {
		tmp.Close()
		return fmt.Errorf("blogfs.Write: setting permissions: %w", err)
	}
	if _, err := tmp.WriteString(content); err != nil {
		tmp.Close()
		return fmt.Errorf("blogfs.Write: writing content: %w", err)
	}
	if err := tmp.Sync(); err != nil {
		tmp.Close()
		return fmt.Errorf("blogfs.Write: syncing temp file: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("blogfs.Write: closing temp file: %w", err)
	}
	if err := os.Rename(tmpName, absPath); err != nil {
		return fmt.Errorf("blogfs.Write: renaming temp to final path: %w", err)
	}

	committed = true
	return nil
}

// Read returns the UTF-8 content of basePath/contentPath.
func Read(basePath, contentPath string) (string, error) {
	absPath, err := SafeResolvePath(basePath, contentPath)
	if err != nil {
		return "", fmt.Errorf("blogfs.Read: %w", err)
	}

	data, err := os.ReadFile(absPath)
	if err != nil {
		return "", fmt.Errorf("blogfs.Read: %w", err)
	}

	return string(data), nil
}

// Delete removes basePath/contentPath from disk.
// Returns an error if the file does not exist.
func Delete(basePath, contentPath string) error {
	absPath, err := SafeResolvePath(basePath, contentPath)
	if err != nil {
		return fmt.Errorf("blogfs.Delete: %w", err)
	}

	if err := os.Remove(absPath); err != nil {
		return fmt.Errorf("blogfs.Delete: %w", err)
	}

	return nil
}

// WriteStaged writes content to a temporary file in the same directory as
// basePath/contentPath without renaming to the final path. Returns commit and
// discard functions. The caller must call exactly one of them:
//   - commit() renames the temp file to the final path (atomic)
//   - discard() removes the temp file
//
// Use this instead of Write when you need to confirm a side effect (e.g. a DB
// update) before making the file change visible on disk.
func WriteStaged(basePath, contentPath, content string) (commit func() error, discard func(), err error) {
	absPath, err := SafeResolvePath(basePath, contentPath)
	if err != nil {
		return nil, nil, fmt.Errorf("blogfs.WriteStaged: %w", err)
	}

	dir := filepath.Dir(absPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, nil, fmt.Errorf("blogfs.WriteStaged: creating directories: %w", err)
	}

	tmp, err := os.CreateTemp(dir, ".tmp-blog-*")
	if err != nil {
		return nil, nil, fmt.Errorf("blogfs.WriteStaged: creating temp file: %w", err)
	}
	tmpName := tmp.Name()

	cleanup := func() { os.Remove(tmpName) }

	if err := tmp.Chmod(0644); err != nil {
		tmp.Close()
		cleanup()
		return nil, nil, fmt.Errorf("blogfs.WriteStaged: setting permissions: %w", err)
	}
	if _, err := tmp.WriteString(content); err != nil {
		tmp.Close()
		cleanup()
		return nil, nil, fmt.Errorf("blogfs.WriteStaged: writing content: %w", err)
	}
	if err := tmp.Sync(); err != nil {
		tmp.Close()
		cleanup()
		return nil, nil, fmt.Errorf("blogfs.WriteStaged: syncing: %w", err)
	}
	if err := tmp.Close(); err != nil {
		cleanup()
		return nil, nil, fmt.Errorf("blogfs.WriteStaged: closing: %w", err)
	}

	commit = func() error {
		if err := os.Rename(tmpName, absPath); err != nil {
			return fmt.Errorf("blogfs.WriteStaged commit: %w", err)
		}
		return nil
	}
	return commit, cleanup, nil
}

// Move renames oldContentPath to newContentPath within basePath.
// Returns an error without moving anything if newContentPath already exists.
// Intermediate directories for newContentPath are created with mode 0755.
func Move(basePath, oldContentPath, newContentPath string) error {
	absOld, err := SafeResolvePath(basePath, oldContentPath)
	if err != nil {
		return fmt.Errorf("blogfs.Move: source path: %w", err)
	}
	absNew, err := SafeResolvePath(basePath, newContentPath)
	if err != nil {
		return fmt.Errorf("blogfs.Move: destination path: %w", err)
	}

	if absOld == absNew {
		return errors.New("blogfs.Move: source and destination are the same path")
	}

	if _, err := os.Stat(absNew); err == nil {
		return fmt.Errorf("blogfs.Move: destination already exists: %s", newContentPath)
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("blogfs.Move: checking destination: %w", err)
	}

	if err := os.MkdirAll(filepath.Dir(absNew), 0755); err != nil {
		return fmt.Errorf("blogfs.Move: creating destination directories: %w", err)
	}

	if err := os.Rename(absOld, absNew); err != nil {
		return fmt.Errorf("blogfs.Move: %w", err)
	}

	return nil
}
