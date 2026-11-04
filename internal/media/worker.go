package media

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/vladwithcode/sibra-site/internal/db"
)

const (
	pollInterval = 30 * time.Second
	imageTimeout = 3 * time.Minute
	videoTimeout = 20 * time.Minute

	msgTooHeavy = "El video es demasiado pesado para procesarse; súbelo en menor resolución (1080p)"
	msgFailed   = "No se pudo procesar el archivo; intenta subirlo de nuevo"
	msgMissing  = "No se encontró el archivo original; súbelo de nuevo"
)

// One lane per kind: images never wait behind a long video encode. Each lane
// encodes one asset at a time, which is what the 2-core production VPS can
// afford.
var wake = map[string]chan struct{}{
	KindImage: make(chan struct{}, 1),
	KindVideo: make(chan struct{}, 1),
}

// Notify wakes the lane for kind after a new asset was enqueued.
func Notify(kind string) {
	select {
	case wake[kind] <- struct{}{}:
	default:
	}
}

// StartWorkers (after Init) recovers assets interrupted by a crash and starts one encoder
// lane per kind. Cancel ctx to stop them; the returned WaitGroup completes
// when both lanes exited (interrupted jobs return to pending).
func StartWorkers(ctx context.Context) (*sync.WaitGroup, error) {
	n, err := db.ResetProcessingMediaAssets(ctx)
	if err != nil {
		return nil, err
	}
	if n > 0 {
		log.Printf("media: requeued %d interrupted asset(s)\n", n)
	}

	var wg sync.WaitGroup
	for _, kind := range []string{KindImage, KindVideo} {
		wg.Add(1)
		go func() {
			defer wg.Done()
			lane(ctx, kind)
		}()
	}
	return &wg, nil
}

func lane(ctx context.Context, kind string) {
	timer := time.NewTimer(0)
	defer timer.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-wake[kind]:
		case <-timer.C:
		}
		// Drain the queue before sleeping again.
		for ctx.Err() == nil {
			if !HasFreeSpace(WorkPath, 0) {
				log.Println("media: low disk space, encoding paused")
				break
			}
			asset, err := db.ClaimPendingMediaAsset(ctx, kind)
			if err != nil {
				if ctx.Err() == nil {
					log.Printf("media: claim %s: %v\n", kind, err)
				}
				break
			}
			if asset == nil {
				break
			}
			process(ctx, asset)
		}
		if !timer.Stop() {
			select {
			case <-timer.C:
			default:
			}
		}
		timer.Reset(pollInterval)
	}
}

// process encodes one claimed asset and records the outcome.
func process(parent context.Context, asset *db.MediaAsset) {
	timeout := imageTimeout
	if asset.Kind == KindVideo {
		timeout = videoTimeout
	}
	ctx, cancel := context.WithTimeout(parent, timeout)
	defer cancel()

	start := time.Now()
	res, err := EncodeAsset(ctx, asset.ID, asset.Kind)
	// Bookkeeping uses a fresh context so it still runs during shutdown.
	bg, bgCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer bgCancel()

	if err != nil {
		_ = os.RemoveAll(filepath.Join(WorkPath, asset.ID))
		switch {
		case parent.Err() != nil:
			if err := db.ReleaseMediaAsset(bg, asset.ID); err != nil {
				log.Printf("media: release %s: %v\n", asset.ID, err)
			}
		case errors.Is(err, fs.ErrNotExist):
			log.Printf("media: %s original missing\n", asset.ID)
			if err := db.FailMediaAsset(bg, asset.ID, msgMissing); err != nil {
				log.Printf("media: fail %s: %v\n", asset.ID, err)
			}
		default:
			msg := msgFailed
			if errors.Is(err, ErrKilled) {
				msg = msgTooHeavy
			}
			if m, ok := IsValidation(err); ok {
				msg = m
			}
			log.Printf("media: encode %s (%s, attempt %d): %v\n", asset.ID, asset.Kind, asset.Attempts, err)
			final, ferr := db.FailMediaAssetAttempt(bg, asset.ID, msg)
			if ferr != nil {
				log.Printf("media: record failure %s: %v\n", asset.ID, ferr)
			}
			if final {
				_ = os.Remove(IncomingFile(asset.ID))
			}
		}
		return
	}

	ok, err := db.CompleteMediaAsset(bg, asset.ID, res.Width, res.Height, res.DurationMs, res.HasAudio,
		db.MediaVariants{Images: res.Images, Videos: res.Videos, Poster: res.Poster})
	if err != nil {
		// Output stays in place; the asset is requeued on next start.
		log.Printf("media: complete %s: %v\n", asset.ID, err)
		return
	}
	if !ok {
		// Deleted while encoding: drop the output.
		_ = RemoveAssetFiles(asset.ID)
		return
	}
	_ = os.Remove(IncomingFile(asset.ID))
	log.Printf("media: %s %s ready in %s\n", asset.Kind, asset.ID, time.Since(start).Round(time.Second))
}

// EncodeAsset probes the original of assetID (media.IncomingFile), checks it
// is of kind wantKind, encodes it into the work dir and moves the result to
// the public output dir in one rename. The original is left in place.
func EncodeAsset(ctx context.Context, assetID, wantKind string) (*Result, error) {
	if !validID(assetID) {
		return nil, fmt.Errorf("invalid asset id %q", assetID)
	}
	src := IncomingFile(assetID)
	if _, err := os.Stat(src); err != nil {
		return nil, err
	}
	p, err := ProbeFile(ctx, src)
	if err != nil {
		return nil, err
	}
	if p.Kind != wantKind {
		return nil, invalid("El tipo de archivo no coincide con el esperado")
	}

	work := filepath.Join(WorkPath, assetID)
	if err := os.RemoveAll(work); err != nil {
		return nil, err
	}
	res, err := Encode(ctx, src, work, p)
	if err != nil {
		_ = os.RemoveAll(work)
		return nil, err
	}
	if err := publish(work, OutputDir(assetID)); err != nil {
		return nil, err
	}
	return res, nil
}

// publish makes the encoded files world-readable (nginx serves them) and
// moves the directory into place atomically.
func publish(work, out string) error {
	if err := os.Chmod(work, 0o755); err != nil {
		return err
	}
	entries, err := os.ReadDir(work)
	if err != nil {
		return err
	}
	for _, e := range entries {
		if err := os.Chmod(filepath.Join(work, e.Name()), 0o644); err != nil {
			return err
		}
	}
	// A previous attempt may have published before crashing.
	if err := os.RemoveAll(out); err != nil {
		return err
	}
	return os.Rename(work, out)
}
