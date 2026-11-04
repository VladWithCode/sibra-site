package media

import (
	"bytes"
	"encoding/binary"
	"io"
	"os"
)

// jpegOrientation returns the EXIF orientation (1-8) of a JPEG file, or 1 when
// the file is not a JPEG or carries no orientation tag.
//
// ffmpeg only applies EXIF orientation to still images since 7.x, and the
// production server may run an older build. The pipeline therefore always
// decodes images with -noautorotate and applies this orientation itself, so
// output is identical on every ffmpeg version.
func jpegOrientation(path string) int {
	f, err := os.Open(path)
	if err != nil {
		return 1
	}
	defer f.Close()
	// EXIF lives in APP1 near the start of the file; 128 KiB covers it.
	buf := make([]byte, 128<<10)
	n, _ := io.ReadFull(f, buf)
	return parseJPEGOrientation(buf[:n])
}

func parseJPEGOrientation(b []byte) int {
	if len(b) < 4 || b[0] != 0xFF || b[1] != 0xD8 {
		return 1
	}
	i := 2
	for i+4 <= len(b) {
		if b[i] != 0xFF {
			return 1
		}
		marker := b[i+1]
		if marker == 0xD8 || (marker >= 0xD0 && marker <= 0xD7) || marker == 0x01 {
			i += 2
			continue
		}
		if marker == 0xDA || marker == 0xD9 { // start of scan / end: no EXIF before image data
			return 1
		}
		size := int(binary.BigEndian.Uint16(b[i+2:]))
		if size < 2 || i+2+size > len(b) {
			return 1
		}
		seg := b[i+4 : i+2+size]
		if marker == 0xE1 && bytes.HasPrefix(seg, []byte("Exif\x00\x00")) {
			return parseTIFFOrientation(seg[6:])
		}
		i += 2 + size
	}
	return 1
}

func parseTIFFOrientation(t []byte) int {
	if len(t) < 8 {
		return 1
	}
	var order binary.ByteOrder
	switch string(t[:2]) {
	case "II":
		order = binary.LittleEndian
	case "MM":
		order = binary.BigEndian
	default:
		return 1
	}
	ifd := int(order.Uint32(t[4:]))
	if ifd < 8 || ifd+2 > len(t) {
		return 1
	}
	count := int(order.Uint16(t[ifd:]))
	for e := 0; e < count; e++ {
		off := ifd + 2 + e*12
		if off+12 > len(t) {
			return 1
		}
		if order.Uint16(t[off:]) != 0x0112 { // Orientation
			continue
		}
		if order.Uint16(t[off+2:]) != 3 { // SHORT
			return 1
		}
		v := int(order.Uint16(t[off+8:]))
		if v < 1 || v > 8 {
			return 1
		}
		return v
	}
	return 1
}

// orientationFilter maps an EXIF orientation to the ffmpeg filter that
// produces the upright image. The second result reports whether width and
// height swap.
func orientationFilter(o int) (string, bool) {
	switch o {
	case 2:
		return "hflip", false
	case 3:
		return "hflip,vflip", false
	case 4:
		return "vflip", false
	case 5:
		return "transpose=0", true
	case 6:
		return "transpose=1", true
	case 7:
		return "transpose=3", true
	case 8:
		return "transpose=2", true
	}
	return "", false
}
