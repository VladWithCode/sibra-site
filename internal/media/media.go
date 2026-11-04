// Package media validates uploaded images and videos and encodes them into
// web-optimized variants with ffmpeg. Encoding runs in a background worker
// (see worker.go); upload handlers only store the original and enqueue it.
//
// Output layout, one immutable directory per asset:
//
//	web/static/media/{id}/w480.webp ...         image widths (Variants.Images)
//	web/static/media/{id}/1080.mp4, 720.mp4     video renditions (Variants.Videos)
//	web/static/media/{id}/poster-w480.webp ...  video poster widths (Variants.Poster)
package media

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
)

const (
	KindImage = "image"
	KindVideo = "video"

	// MaxVideoUploadSize and MaxImageUploadSize bound a single uploaded file.
	MaxVideoUploadSize = 500 << 20
	MaxImageUploadSize = 25 << 20
	// MaxVideoDurationMs rejects videos longer than 3 minutes.
	MaxVideoDurationMs = 180_000
	// MaxImagePixels rejects absurdly large images (decompression bombs).
	MaxImagePixels = 50_000_000
	// MinFreeDisk is the free space that must remain after accepting an upload
	// or producing encoder output.
	MinFreeDisk = 1536 << 20

	// PublicPrefix is the URL prefix encoded files are served under.
	PublicPrefix = "/static/media/"
)

// Storage paths, set by Init from the environment.
var (
	// OutputPath holds the public, encoded variants.
	OutputPath = "web/static/media"
	// IncomingPath holds private originals until they are encoded.
	IncomingPath = "tmp/media-incoming"
	// WorkPath holds in-progress encoder output. It must be on the same
	// filesystem as OutputPath so the final rename is atomic.
	WorkPath = "tmp/media-work"

	ErrLowDisk = errors.New("not enough free disk space")
)

// Image widths produced for every image (never upscaled).
var imageWidths = []int{480, 960, 1600, 2400}

// Video renditions, named after their short side.
const (
	rendition1080 = 1080
	rendition720  = 720
)

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// Init reads the storage paths from the environment (after .env is loaded)
// and creates the directories.
func Init() error {
	OutputPath = envOr("MEDIA_OUTPUT_PATH", OutputPath)
	IncomingPath = envOr("MEDIA_INCOMING_PATH", IncomingPath)
	WorkPath = envOr("MEDIA_WORK_PATH", WorkPath)
	for _, dir := range []string{OutputPath, IncomingPath, WorkPath} {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return err
		}
	}
	return nil
}

// CheckTools verifies ffmpeg/ffprobe are installed with the encoders the
// pipeline needs.
func CheckTools() error {
	if out, err := exec.Command("ffprobe", "-version").CombinedOutput(); err != nil {
		return fmt.Errorf("ffprobe not available: %v: %s", err, firstLine(out))
	}
	out, err := exec.Command("ffmpeg", "-hide_banner", "-encoders").CombinedOutput()
	if err != nil {
		return fmt.Errorf("ffmpeg not available: %v: %s", err, firstLine(out))
	}
	for _, enc := range []string{"libx264", "libwebp", "aac"} {
		if !bytes.Contains(out, []byte(" "+enc+" ")) {
			return fmt.Errorf("ffmpeg encoder %q missing", enc)
		}
	}
	return nil
}

// IncomingFile returns the private path of an asset's original upload.
func IncomingFile(assetID string) string {
	return filepath.Join(IncomingPath, assetID+".src")
}

// OutputDir returns the public directory of an asset's encoded files.
func OutputDir(assetID string) string {
	return filepath.Join(OutputPath, assetID)
}

// RemoveAssetFiles deletes everything stored for an asset (original, work dir
// and encoded output). Missing files are not an error.
func RemoveAssetFiles(assetID string) error {
	if !validID(assetID) {
		return fmt.Errorf("invalid asset id %q", assetID)
	}
	err := os.Remove(IncomingFile(assetID))
	if err != nil && !os.IsNotExist(err) {
		return err
	}
	if err := os.RemoveAll(filepath.Join(WorkPath, assetID)); err != nil {
		return err
	}
	return os.RemoveAll(OutputDir(assetID))
}

// validID guards file operations against path traversal: asset ids are UUIDs.
func validID(id string) bool {
	if len(id) != 36 {
		return false
	}
	for _, r := range id {
		if !(r == '-' || (r >= '0' && r <= '9') || (r >= 'a' && r <= 'f') || (r >= 'A' && r <= 'F')) {
			return false
		}
	}
	return true
}

// HasFreeSpace reports whether dir's filesystem keeps at least MinFreeDisk
// free after writing need more bytes.
func HasFreeSpace(dir string, need int64) bool {
	var st syscall.Statfs_t
	if err := syscall.Statfs(dir, &st); err != nil {
		// Unknown: do not block uploads on a stat failure.
		return true
	}
	free := int64(st.Bavail) * int64(st.Bsize)
	return free-need >= MinFreeDisk
}

func firstLine(b []byte) string {
	s := strings.TrimSpace(string(b))
	if i := strings.IndexByte(s, '\n'); i >= 0 {
		return s[:i]
	}
	return s
}

// run executes an ffmpeg/ffprobe command at the lowest CPU priority and makes
// it the OOM killer's first target, so memory pressure kills the encoder and
// never the web server or Postgres. stdout is returned; stderr is folded into
// the error.
func run(ctx context.Context, name string, args ...string) ([]byte, error) {
	cmdArgs := append([]string{"-n", "19", name}, args...)
	cmd := exec.CommandContext(ctx, "nice", cmdArgs...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Start(); err != nil {
		return nil, err
	}
	// nice execs the tool in place, so the pid is the encoder's.
	_ = os.WriteFile(fmt.Sprintf("/proc/%d/oom_score_adj", cmd.Process.Pid), []byte("1000"), 0)
	if err := cmd.Wait(); err != nil {
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) && !exitErr.Exited() {
			return nil, fmt.Errorf("%w: %s", ErrKilled, lastLines(stderr.String(), 3))
		}
		return nil, fmt.Errorf("%s: %v: %s", name, err, lastLines(stderr.String(), 3))
	}
	return stdout.Bytes(), nil
}

// ErrKilled means the encoder was killed by a signal, almost always the OOM
// killer on the small production VPS.
var ErrKilled = errors.New("encoder killed")

func lastLines(s string, n int) string {
	lines := strings.Split(strings.TrimSpace(s), "\n")
	if len(lines) > n {
		lines = lines[len(lines)-n:]
	}
	return strings.Join(lines, " | ")
}
