package media

import (
	"context"
	"encoding/binary"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

// exifJPEG inserts an APP1 EXIF segment with the given orientation right
// after the SOI marker of a JPEG.
func exifJPEG(t *testing.T, jpeg []byte, orientation uint16) []byte {
	t.Helper()
	tiff := make([]byte, 8+2+12+4)
	copy(tiff, "MM")
	binary.BigEndian.PutUint16(tiff[2:], 42)
	binary.BigEndian.PutUint32(tiff[4:], 8)
	binary.BigEndian.PutUint16(tiff[8:], 1)       // one entry
	binary.BigEndian.PutUint16(tiff[10:], 0x0112) // Orientation
	binary.BigEndian.PutUint16(tiff[12:], 3)      // SHORT
	binary.BigEndian.PutUint32(tiff[14:], 1)      // count
	binary.BigEndian.PutUint16(tiff[18:], orientation)
	payload := append([]byte("Exif\x00\x00"), tiff...)
	seg := []byte{0xFF, 0xE1, 0, 0}
	binary.BigEndian.PutUint16(seg[2:], uint16(len(payload)+2))
	seg = append(seg, payload...)
	out := append([]byte{}, jpeg[:2]...)
	out = append(out, seg...)
	return append(out, jpeg[2:]...)
}

func TestParseJPEGOrientation(t *testing.T) {
	base := []byte{0xFF, 0xD8, 0xFF, 0xDA, 0, 2}
	for o := uint16(1); o <= 8; o++ {
		if got := parseJPEGOrientation(exifJPEG(t, base, o)); got != int(o) {
			t.Errorf("orientation %d: got %d", o, got)
		}
	}
	if got := parseJPEGOrientation(base); got != 1 {
		t.Errorf("no exif: got %d", got)
	}
	if got := parseJPEGOrientation([]byte("not a jpeg")); got != 1 {
		t.Errorf("not jpeg: got %d", got)
	}
	// Truncated segment must not panic.
	if got := parseJPEGOrientation(exifJPEG(t, base, 6)[:12]); got != 1 {
		t.Errorf("truncated: got %d", got)
	}
}

func TestImageVariantWidths(t *testing.T) {
	cases := map[int][]int{
		4000: {480, 960, 1600, 2400},
		2400: {480, 960, 1600, 2400},
		1700: {480, 960, 1700},
		1000: {480, 1000},
		500:  {500},
		300:  {300},
	}
	for src, want := range cases {
		if got := imageVariantWidths(src); !slices.Equal(got, want) {
			t.Errorf("width %d: got %v, want %v", src, got, want)
		}
	}
}

func TestVideoRenditionsAndScale(t *testing.T) {
	if got := videoRenditions(2160); !slices.Equal(got, []int{1080, 720}) {
		t.Errorf("4K: %v", got)
	}
	if got := videoRenditions(720); !slices.Equal(got, []int{720}) {
		t.Errorf("720p: %v", got)
	}
	if got := scaleFilter(3840, 2160, 1080); got != "scale=-2:1080" {
		t.Errorf("landscape: %s", got)
	}
	if got := scaleFilter(1080, 1920, 720); got != "scale=720:-2" {
		t.Errorf("portrait: %s", got)
	}
	// Never upscale; odd short side made even.
	if got := scaleFilter(640, 359, 720); got != "scale=-2:358" {
		t.Errorf("small: %s", got)
	}
}

func probeWith(format, brand, duration string, streams ...string) *probeOutput {
	po := &probeOutput{}
	po.Format.FormatName = format
	po.Format.Duration = duration
	po.Format.Tags.MajorBrand = brand
	for i, kind := range streams {
		s := struct {
			Index        int    `json:"index"`
			CodecType    string `json:"codec_type"`
			CodecName    string `json:"codec_name"`
			Width        int    `json:"width"`
			Height       int    `json:"height"`
			AvgFrameRate string `json:"avg_frame_rate"`
			RFrameRate   string `json:"r_frame_rate"`
			SideDataList []struct {
				Rotation float64 `json:"rotation"`
			} `json:"side_data_list"`
			Tags struct {
				Rotate string `json:"rotate"`
			} `json:"tags"`
			Disposition struct {
				AttachedPic int `json:"attached_pic"`
			} `json:"disposition"`
		}{Index: i, CodecType: kind, Width: 1920, Height: 1080, AvgFrameRate: "60/1", CodecName: "h264"}
		po.Streams = append(po.Streams, s)
	}
	return po
}

func TestParseProbe(t *testing.T) {
	p, err := parseProbe(probeWith("mov,mp4,m4a,3gp,3g2,mj2", "isom", "12.5", "video", "audio"))
	if err != nil {
		t.Fatal(err)
	}
	if p.Kind != KindVideo || !p.HasAudio || p.DurationMs != 12500 || p.FPS != 60 || p.AudioStream != 1 {
		t.Errorf("unexpected probe %+v", p)
	}

	rotated := probeWith("mov,mp4,m4a,3gp,3g2,mj2", "qt", "5", "video")
	rotated.Streams[0].SideDataList = append(rotated.Streams[0].SideDataList, struct {
		Rotation float64 `json:"rotation"`
	}{Rotation: -90})
	if p, err := parseProbe(rotated); err != nil || p.Width != 1080 || p.Height != 1920 || p.HasAudio {
		t.Errorf("rotated: %+v %v", p, err)
	}

	rejects := map[string]*probeOutput{
		"too long": probeWith("matroska,webm", "", "181", "video"),
		"playlist": probeWith("hls", "", "10", "video"),
		"concat":   probeWith("concat", "", "10", "video"),
		"heic":     probeWith("mov,mp4,m4a,3gp,3g2,mj2", "heic", "0", "video"),
		"audio":    probeWith("mov,mp4,m4a,3gp,3g2,mj2", "M4A ", "10", "audio"),
		"gif":      probeWith("gif", "", "1", "video"),
	}
	for name, po := range rejects {
		if _, err := parseProbe(po); err == nil {
			t.Errorf("%s: accepted", name)
		} else if _, ok := IsValidation(err); !ok {
			t.Errorf("%s: not a validation error: %v", name, err)
		}
	}
}

// --- integration: real ffmpeg encodes ---

func requireFFmpeg(t *testing.T) {
	t.Helper()
	if testing.Short() {
		t.Skip("short mode")
	}
	if err := CheckTools(); err != nil {
		t.Skipf("ffmpeg unavailable: %v", err)
	}
}

func ffmpegGen(t *testing.T, args ...string) {
	t.Helper()
	cmd := exec.Command("ffmpeg", append([]string{"-hide_banner", "-v", "error", "-y"}, args...)...)
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("ffmpeg %v: %v\n%s", args, err, out)
	}
}

func TestEncodeImageOrientation(t *testing.T) {
	requireFFmpeg(t)
	dir := t.TempDir()
	plain := filepath.Join(dir, "plain.jpg")
	ffmpegGen(t, "-f", "lavfi", "-i", "testsrc2=size=2000x1000", "-frames:v", "1", plain)
	raw, err := os.ReadFile(plain)
	if err != nil {
		t.Fatal(err)
	}
	src := filepath.Join(dir, "x.src") // stored without extension, like uploads
	if err := os.WriteFile(src, exifJPEG(t, raw, 6), 0o644); err != nil {
		t.Fatal(err)
	}

	ctx := context.Background()
	p, err := ProbeFile(ctx, src)
	if err != nil {
		t.Fatal(err)
	}
	if p.Kind != KindImage || p.Orientation != 6 || p.Width != 1000 || p.Height != 2000 {
		t.Fatalf("probe: %+v", p)
	}
	out := filepath.Join(dir, "out")
	res, err := Encode(ctx, src, out, p)
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(res.Images, []int{480, 1000}) || res.Height != 2000 {
		t.Fatalf("result: %+v", res)
	}
	top, err := ProbeFile(ctx, filepath.Join(out, "w1000.webp"))
	if err != nil {
		t.Fatal(err)
	}
	if top.Width != 1000 || top.Height != 2000 {
		t.Errorf("orientation not applied: %dx%d", top.Width, top.Height)
	}
}

func TestEncodeVideo(t *testing.T) {
	requireFFmpeg(t)
	dir := t.TempDir()
	src := filepath.Join(dir, "v.src")
	// Portrait 60 fps clip with audio and GPS-like metadata.
	ffmpegGen(t,
		"-f", "lavfi", "-i", "testsrc2=size=1080x1920:rate=60:duration=3",
		"-f", "lavfi", "-i", "sine=frequency=440:duration=3",
		"-metadata", "location=+19.4326-099.1332/",
		"-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac", "-shortest", "-f", "mp4", src,
	)

	ctx := context.Background()
	p, err := ProbeFile(ctx, src)
	if err != nil {
		t.Fatal(err)
	}
	if p.Kind != KindVideo || !p.HasAudio {
		t.Fatalf("probe: %+v", p)
	}
	out := filepath.Join(dir, "out")
	res, err := Encode(ctx, src, out, p)
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(res.Videos, []int{1080, 720}) || res.Width != 1080 || res.Height != 1920 || !res.HasAudio {
		t.Fatalf("result: %+v", res)
	}
	for _, f := range []string{"1080.mp4", "720.mp4", ImageFile("poster-w", res.Poster[0])} {
		if _, err := os.Stat(filepath.Join(out, f)); err != nil {
			t.Errorf("missing %s: %v", f, err)
		}
	}
	if _, err := os.Stat(filepath.Join(out, "poster.png")); !errors.Is(err, os.ErrNotExist) {
		t.Errorf("poster.png left behind")
	}

	small, err := ProbeFile(ctx, filepath.Join(out, "720.mp4"))
	if err != nil {
		t.Fatal(err)
	}
	if small.Width != 720 || small.Height != 1280 || small.FPS > 30.5 {
		t.Errorf("720 rendition: %dx%d @ %.2f", small.Width, small.Height, small.FPS)
	}
	meta, err := exec.Command("ffprobe", "-v", "error", "-show_entries", "format_tags", "-of", "default=nw=1",
		filepath.Join(out, "1080.mp4")).Output()
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(meta), "location") || strings.Contains(string(meta), "+19.4326") {
		t.Errorf("metadata not stripped: %s", meta)
	}
}

func TestProbeRejectsText(t *testing.T) {
	requireFFmpeg(t)
	src := filepath.Join(t.TempDir(), "x.src")
	if err := os.WriteFile(src, []byte("hello, not media"), 0o644); err != nil {
		t.Fatal(err)
	}
	_, err := ProbeFile(context.Background(), src)
	if _, ok := IsValidation(err); !ok {
		t.Fatalf("expected validation error, got %v", err)
	}
}
