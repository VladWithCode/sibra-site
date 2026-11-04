package media

import (
	"context"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// Result describes the encoded output of one asset.
type Result struct {
	Width      int
	Height     int
	DurationMs int
	HasAudio   bool
	Images     []int // image widths (image assets)
	Videos     []int // rendition names, largest first (video assets)
	Poster     []int // poster widths (video assets)
}

// Encode writes every variant of src into outDir according to the probe.
func Encode(ctx context.Context, src, outDir string, p *Probe) (*Result, error) {
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return nil, err
	}
	if p.Kind == KindImage {
		widths, h, err := encodeImage(ctx, src, outDir, "w", p.Width, p.Height, p.Orientation)
		if err != nil {
			return nil, err
		}
		return &Result{Width: widths[len(widths)-1], Height: h, Images: widths}, nil
	}
	return encodeVideo(ctx, src, outDir, p)
}

// ImageFile and the helpers below define the on-disk names of variants.
func ImageFile(prefix string, width int) string { return fmt.Sprintf("%s%d.webp", prefix, width) }
func VideoFile(rendition int) string            { return fmt.Sprintf("%d.mp4", rendition) }

// imageVariantWidths picks output widths for a source width: the standard
// widths below it plus the source width capped at the largest standard one.
// Widths within 15% of the top one are dropped as near-duplicates.
func imageVariantWidths(srcWidth int) []int {
	top := min(srcWidth, imageWidths[len(imageWidths)-1])
	var out []int
	for _, w := range imageWidths {
		if float64(w) < float64(top)*0.85 {
			out = append(out, w)
		}
	}
	return append(out, top)
}

// encodeImage writes WebP variants named {prefix}{width}.webp from a single
// decode of src. It returns the widths (ascending) and the height of the
// largest variant.
func encodeImage(ctx context.Context, src, outDir, prefix string, width, height, orientation int) ([]int, int, error) {
	widths := imageVariantWidths(width)

	var graph strings.Builder
	graph.WriteString("[0:v]")
	if f, _ := orientationFilter(orientation); f != "" {
		graph.WriteString(f)
		graph.WriteString(",")
	}
	fmt.Fprintf(&graph, "split=%d", len(widths))
	for i := range widths {
		fmt.Fprintf(&graph, "[s%d]", i)
	}
	for i, w := range widths {
		fmt.Fprintf(&graph, ";[s%d]scale=%d:-1:flags=lanczos[o%d]", i, w, i)
	}

	args := []string{
		"-hide_banner", "-nostdin", "-v", "error", "-y",
		"-protocol_whitelist", "file",
		"-noautorotate",
		"-i", src,
		"-filter_complex", graph.String(),
	}
	for i, w := range widths {
		args = append(args,
			"-map", fmt.Sprintf("[o%d]", i),
			"-map_metadata", "-1",
			"-frames:v", "1",
			"-c:v", "libwebp", "-quality", "80", "-compression_level", "4",
			"-f", "webp", filepath.Join(outDir, ImageFile(prefix, w)),
		)
	}
	if _, err := run(ctx, "ffmpeg", args...); err != nil {
		return nil, 0, err
	}
	top := widths[len(widths)-1]
	return widths, int(math.Round(float64(height) * float64(top) / float64(width))), nil
}

// videoRenditions returns the renditions (named after their short side) for
// a source whose short side is shortSide: 1080 only when the source is larger
// than 720, never upscaled.
func videoRenditions(shortSide int) []int {
	if shortSide > rendition720 {
		return []int{rendition1080, rendition720}
	}
	return []int{rendition720}
}

type renditionSettings struct{ crf, maxrate, bufsize string }

var renditionEncoding = map[int]renditionSettings{
	rendition1080: {crf: "23", maxrate: "5M", bufsize: "10M"},
	rendition720:  {crf: "27", maxrate: "1800k", bufsize: "3600k"},
}

// scaleFilter limits the short side to target (made even for yuv420p) while
// keeping orientation and aspect ratio.
func scaleFilter(width, height, target int) string {
	target = min(target, min(width, height))
	target -= target % 2
	if width >= height {
		return fmt.Sprintf("scale=-2:%d", target)
	}
	return fmt.Sprintf("scale=%d:-2", target)
}

func encodeVideo(ctx context.Context, src, outDir string, p *Probe) (*Result, error) {
	renditions := videoRenditions(min(p.Width, p.Height))

	// The largest rendition is encoded from the original; smaller ones from
	// that output, so a 4K phone source is decoded only once.
	input := src
	inW, inH := p.Width, p.Height
	for i, r := range renditions {
		filters := []string{scaleFilter(inW, inH, r)}
		if i == 0 && p.FPS > 30.5 {
			filters = append(filters, "fps=30")
		}
		enc := renditionEncoding[r]
		args := []string{
			"-hide_banner", "-nostdin", "-v", "error", "-y",
			"-protocol_whitelist", "file",
			"-threads", "2",
			"-i", input,
		}
		if i == 0 {
			args = append(args, "-map", "0:"+strconv.Itoa(p.VideoStream))
			if p.HasAudio {
				args = append(args, "-map", "0:"+strconv.Itoa(p.AudioStream))
			}
		} else {
			args = append(args, "-map", "0:v:0", "-map", "0:a:0?")
		}
		args = append(args,
			"-map_metadata", "-1", "-map_chapters", "-1",
			"-vf", strings.Join(filters, ","), "-filter_threads", "1",
			"-c:v", "libx264", "-preset", "medium", "-profile:v", "high", "-pix_fmt", "yuv420p",
			"-crf", enc.crf, "-maxrate", enc.maxrate, "-bufsize", enc.bufsize,
			"-threads", "2",
		)
		if p.HasAudio {
			args = append(args, "-c:a", "aac", "-b:a", "128k", "-ac", "2")
		} else {
			args = append(args, "-an")
		}
		out := filepath.Join(outDir, VideoFile(r))
		args = append(args, "-movflags", "+faststart", "-f", "mp4", out)
		if _, err := run(ctx, "ffmpeg", args...); err != nil {
			return nil, err
		}
		if i == 0 {
			input = out
			op, err := ProbeFile(ctx, out)
			if err != nil {
				return nil, fmt.Errorf("probe encoded rendition: %w", err)
			}
			inW, inH = op.Width, op.Height
		}
	}

	// Poster: one frame from the largest rendition, encoded like any image.
	top := filepath.Join(outDir, VideoFile(renditions[0]))
	posterPNG := filepath.Join(outDir, "poster.png")
	seek := min(1.0, float64(p.DurationMs)/2000)
	if _, err := run(ctx, "ffmpeg",
		"-hide_banner", "-nostdin", "-v", "error", "-y",
		"-protocol_whitelist", "file",
		"-ss", strconv.FormatFloat(seek, 'f', 3, 64),
		"-i", top, "-frames:v", "1", "-c:v", "png", "-f", "image2", posterPNG,
	); err != nil {
		return nil, fmt.Errorf("extract poster: %w", err)
	}
	posterWidths, _, err := encodeImage(ctx, posterPNG, outDir, "poster-w", inW, inH, 1)
	if err != nil {
		return nil, fmt.Errorf("encode poster: %w", err)
	}
	if err := os.Remove(posterPNG); err != nil {
		return nil, err
	}

	return &Result{
		Width:      inW,
		Height:     inH,
		DurationMs: p.DurationMs,
		HasAudio:   p.HasAudio,
		Videos:     renditions,
		Poster:     posterWidths,
	}, nil
}
