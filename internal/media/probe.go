package media

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
)

// ValidationError is a user-facing (Spanish) rejection of an uploaded file.
type ValidationError struct{ Message string }

func (e *ValidationError) Error() string { return e.Message }

func invalid(msg string) error { return &ValidationError{Message: msg} }

// Probe describes a validated upload. Width and Height are display
// dimensions (rotation and EXIF orientation already applied).
type Probe struct {
	Kind        string
	Width       int
	Height      int
	DurationMs  int
	HasAudio    bool
	FPS         float64
	VideoStream int // ffprobe stream index of the main video stream
	AudioStream int // -1 when the file has no audio
	Orientation int // EXIF orientation for images (1 = upright)
}

// Container formats accepted from ffprobe's format_name. ffprobe probes by
// content (originals are stored without an extension), so anything else, in
// particular playlist/concat formats that make ffmpeg open other files or
// URLs, is rejected.
var (
	videoFormats = map[string]bool{"mov,mp4,m4a,3gp,3g2,mj2": true, "matroska,webm": true}
	imageFormats = map[string]bool{"jpeg_pipe": true, "png_pipe": true, "webp_pipe": true, "image2": true}
	imageCodecs  = map[string]bool{"mjpeg": true, "png": true, "webp": true}
)

type probeOutput struct {
	Streams []struct {
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
	} `json:"streams"`
	Format struct {
		FormatName string `json:"format_name"`
		Duration   string `json:"duration"`
		Tags       struct {
			MajorBrand string `json:"major_brand"`
		} `json:"tags"`
	} `json:"format"`
}

// ProbeFile inspects path with ffprobe and validates it against the upload
// rules. A *ValidationError is returned for files users must fix.
func ProbeFile(ctx context.Context, path string) (*Probe, error) {
	out, err := run(ctx, "ffprobe",
		"-v", "error",
		"-protocol_whitelist", "file",
		"-print_format", "json",
		"-show_format", "-show_streams",
		path,
	)
	if err != nil {
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
		return nil, invalid("El archivo no es una imagen o video válido")
	}
	var po probeOutput
	if err := json.Unmarshal(out, &po); err != nil {
		return nil, fmt.Errorf("parse ffprobe output: %w", err)
	}
	p, err := parseProbe(&po)
	if err != nil {
		return nil, err
	}
	if p.Kind == KindImage {
		p.Orientation = jpegOrientation(path)
		if _, swap := orientationFilter(p.Orientation); swap {
			p.Width, p.Height = p.Height, p.Width
		}
	}
	return p, nil
}

func parseProbe(po *probeOutput) (*Probe, error) {
	format := po.Format.FormatName
	p := &Probe{VideoStream: -1, AudioStream: -1, Orientation: 1}

	// HEIF/AVIF stills share the MP4 container; reject them explicitly instead
	// of treating them as zero-length videos.
	switch strings.TrimSpace(po.Format.Tags.MajorBrand) {
	case "heic", "heix", "heim", "heis", "mif1", "msf1", "avif", "avis":
		return nil, invalid("Las imágenes HEIC/AVIF no son compatibles; expórtala como JPG")
	}

	for _, s := range po.Streams {
		switch s.CodecType {
		case "video":
			if s.Disposition.AttachedPic == 1 || p.VideoStream >= 0 {
				continue
			}
			p.VideoStream = s.Index
			p.Width, p.Height = s.Width, s.Height
			p.FPS = parseRate(s.AvgFrameRate)
			if p.FPS == 0 {
				p.FPS = parseRate(s.RFrameRate)
			}
			rot := 0.0
			for _, sd := range s.SideDataList {
				if sd.Rotation != 0 {
					rot = sd.Rotation
				}
			}
			if rot == 0 && s.Tags.Rotate != "" {
				rot, _ = strconv.ParseFloat(s.Tags.Rotate, 64)
			}
			if int(math.Abs(rot))%180 == 90 {
				p.Width, p.Height = p.Height, p.Width
			}
			if imageFormats[format] && !imageCodecs[s.CodecName] {
				return nil, invalid("Formato de imagen no soportado (usa JPG, PNG o WebP)")
			}
		case "audio":
			if p.AudioStream < 0 {
				p.AudioStream = s.Index
			}
		}
	}

	if p.VideoStream < 0 || p.Width <= 0 || p.Height <= 0 {
		return nil, invalid("El archivo no contiene imagen ni video")
	}

	switch {
	case imageFormats[format]:
		p.Kind = KindImage
		p.AudioStream = -1
		if p.Width*p.Height > MaxImagePixels {
			return nil, invalid("La imagen es demasiado grande (máximo 50 megapíxeles)")
		}
	case videoFormats[format]:
		p.Kind = KindVideo
		p.HasAudio = p.AudioStream >= 0
		dur, _ := strconv.ParseFloat(po.Format.Duration, 64)
		p.DurationMs = int(dur * 1000)
		if p.DurationMs <= 0 {
			return nil, invalid("No se pudo leer la duración del video")
		}
		if p.DurationMs > MaxVideoDurationMs {
			return nil, invalid("El video excede la duración máxima de 3 minutos")
		}
		if p.Width > 8192 || p.Height > 8192 {
			return nil, invalid("La resolución del video es demasiado alta")
		}
	default:
		return nil, invalid("Formato no soportado (usa JPG, PNG, WebP, MP4, MOV o WebM)")
	}
	return p, nil
}

// parseRate parses ffprobe rationals such as "30000/1001".
func parseRate(r string) float64 {
	num, den, ok := strings.Cut(r, "/")
	if !ok {
		v, _ := strconv.ParseFloat(r, 64)
		return v
	}
	n, err1 := strconv.ParseFloat(num, 64)
	d, err2 := strconv.ParseFloat(den, 64)
	if err1 != nil || err2 != nil || d == 0 {
		return 0
	}
	return n / d
}

// IsValidation reports whether err is a user-facing validation error and
// returns its message.
func IsValidation(err error) (string, bool) {
	var ve *ValidationError
	if errors.As(err, &ve) {
		return ve.Message, true
	}
	return "", false
}
