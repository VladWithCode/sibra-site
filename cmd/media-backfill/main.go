// Command media-backfill migrates legacy property images (properties.main_img
// and properties.imgs, files under web/static/properties/{id}/) and selling
// page heroes (selling_pages.hero_media, files under web/static/uploads/) to
// encoded media assets.
//
// It is idempotent: assets remember the legacy file they came from, so a
// re-run only encodes images added since, removes items whose legacy image
// was deleted, and follows main image changes. Items uploaded through the new
// panel are never touched. Legacy files and columns are left in place.
//
// Dry-run by default; pass --apply to write.
package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"slices"

	"github.com/joho/godotenv"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/media"
)

type propertyPlan struct {
	prop      *db.LegacyPropertyMedia
	add       []string // legacy gallery files to encode, in order
	remove    []string // legacy files no longer in the gallery
	setMain   string   // legacy main file to encode ("" = keep)
	clearMain bool     // legacy-backed main image was removed
	missing   []string // referenced files not found on disk
}

func (p *propertyPlan) empty() bool {
	return len(p.add) == 0 && len(p.remove) == 0 && p.setMain == "" && !p.clearMain
}

func main() {
	apply := flag.Bool("apply", false, "Write changes (default: dry-run)")
	propsDir := flag.String("properties-dir", "web/static/properties", "Legacy property images directory")
	uploadsDir := flag.String("uploads-dir", "web/static/uploads", "Legacy selling page uploads directory")
	flag.Parse()

	godotenv.Overload(".env")

	pool, err := db.Connect()
	if err != nil {
		log.Fatalf("DB connection failed: %v", err)
	}
	defer pool.Close()
	if err := media.CheckTools(); err != nil {
		log.Fatalf("Media tools unavailable: %v", err)
	}
	if err := media.Init(); err != nil {
		log.Fatalf("Media storage unavailable: %v", err)
	}

	ctx := context.Background()
	props, err := db.ListLegacyPropertyMedia(ctx)
	if err != nil {
		log.Fatalf("Listing properties failed: %v", err)
	}

	var plans []*propertyPlan
	var totalBytes int64
	var nAdd, nRemove, nMain, nMissing int
	for _, prop := range props {
		plan := planProperty(prop, *propsDir)
		for _, f := range append(slices.Clone(plan.add), plan.setMain) {
			if f == "" {
				continue
			}
			if st, err := os.Stat(legacyPath(*propsDir, prop.ID, f)); err == nil {
				totalBytes += st.Size()
			}
		}
		nAdd += len(plan.add)
		nRemove += len(plan.remove)
		nMissing += len(plan.missing)
		if plan.setMain != "" || plan.clearMain {
			nMain++
		}
		for _, f := range plan.missing {
			fmt.Printf("  warn: %s: file not found: %s\n", prop.ID, f)
		}
		if !plan.empty() {
			plans = append(plans, plan)
			fmt.Printf("  %s: +%d gallery, -%d gallery, main: %s\n", prop.ID, len(plan.add), len(plan.remove), mainAction(plan))
		}
	}

	heroes, err := db.ListLegacySellingPageHeroes(ctx)
	if err != nil {
		log.Fatalf("Listing selling pages failed: %v", err)
	}
	var heroPlans []*db.LegacySellingPageHero
	for _, h := range heroes {
		// Heroes uploaded through the new panel are never overwritten.
		if h.HeroMedia == "" || (h.HasHero && (h.HeroLegacy == "" || h.HeroLegacy == h.HeroMedia)) {
			continue
		}
		path := filepath.Join(*uploadsDir, h.HeroMedia)
		st, err := os.Stat(path)
		if !safeName(h.HeroMedia) || err != nil {
			fmt.Printf("  warn: selling page %s: hero file not found: %s\n", h.ID, h.HeroMedia)
			nMissing++
			continue
		}
		totalBytes += st.Size()
		heroPlans = append(heroPlans, h)
		fmt.Printf("  selling page %s: hero %s (%s)\n", h.ID, h.HeroMedia, h.HeroMediaType)
	}

	fmt.Println("\n── Summary ──────────────────────────────────────────")
	fmt.Printf("  Properties scanned:     %d\n", len(props))
	fmt.Printf("  Properties to update:   %d\n", len(plans))
	fmt.Printf("  Gallery images to add:  %d\n", nAdd)
	fmt.Printf("  Gallery items removed:  %d\n", nRemove)
	fmt.Printf("  Main image changes:     %d\n", nMain)
	fmt.Printf("  Selling page heroes:    %d\n", len(heroPlans))
	fmt.Printf("  Missing legacy files:   %d\n", nMissing)
	fmt.Printf("  Source bytes to encode: %s (WebP output is usually smaller)\n", humanBytes(totalBytes))

	if !media.HasFreeSpace(media.OutputPath, totalBytes) {
		log.Fatalf("Not enough free disk space: need %s plus the %s safety margin", humanBytes(totalBytes), humanBytes(media.MinFreeDisk))
	}
	if !*apply {
		fmt.Println("\nDRY RUN — nothing was written. Run again with --apply.")
		return
	}

	failures := 0
	for i, plan := range plans {
		fmt.Printf("[%d/%d] %s\n", i+1, len(plans), plan.prop.ID)
		failures += applyPlan(ctx, plan, *propsDir)
	}
	for _, h := range heroPlans {
		fmt.Printf("selling page %s\n", h.ID)
		if err := applyHero(ctx, h, *uploadsDir); err != nil {
			fmt.Printf("  error: hero %s: %v\n", h.HeroMedia, err)
			failures++
		}
	}
	fmt.Printf("\nDone. %d file(s) failed.\n", failures)
	if failures > 0 {
		os.Exit(1)
	}
}

func legacyPath(dir, propertyID, file string) string {
	return filepath.Join(dir, propertyID, file)
}

// safeName rejects legacy names that are not plain file names.
func safeName(f string) bool {
	return f != "" && f == filepath.Base(f) && f != "." && f != ".."
}

func planProperty(prop *db.LegacyPropertyMedia, dir string) *propertyPlan {
	plan := &propertyPlan{prop: prop}
	exists := func(f string) bool {
		if !safeName(f) {
			plan.missing = append(plan.missing, f)
			return false
		}
		if _, err := os.Stat(legacyPath(dir, prop.ID, f)); err != nil {
			plan.missing = append(plan.missing, f)
			return false
		}
		return true
	}

	wanted := map[string]bool{}
	for _, f := range prop.Imgs {
		if f == "" || wanted[f] {
			continue
		}
		wanted[f] = true
		if _, done := prop.Gallery[f]; !done && exists(f) {
			plan.add = append(plan.add, f)
		}
	}
	for f := range prop.Gallery {
		if !wanted[f] {
			plan.remove = append(plan.remove, f)
		}
	}
	slices.Sort(plan.remove)

	newPanelMain := prop.HasMain && prop.MainLegacy == ""
	switch {
	case newPanelMain:
		// Uploaded through the new panel: never overwrite.
	case prop.MainImg == "" && prop.MainLegacy != "":
		plan.clearMain = true
	case prop.MainImg != "" && prop.MainImg != prop.MainLegacy && exists(prop.MainImg):
		plan.setMain = prop.MainImg
	}
	return plan
}

func mainAction(p *propertyPlan) string {
	switch {
	case p.setMain != "":
		return "set " + p.setMain
	case p.clearMain:
		return "clear"
	}
	return "keep"
}

// encodeLegacy copies a legacy file into private storage under a new asset
// id and encodes it with the same pipeline as uploads.
func encodeLegacy(ctx context.Context, path, kind string) (*db.BackfillAsset, error) {
	id := db.NewMediaID()
	if err := copyFile(path, media.IncomingFile(id)); err != nil {
		return nil, err
	}
	defer os.Remove(media.IncomingFile(id))

	res, err := media.EncodeAsset(ctx, id, kind)
	if err != nil {
		_ = media.RemoveAssetFiles(id)
		return nil, err
	}
	return &db.BackfillAsset{
		ID: id, Kind: kind, LegacyFile: filepath.Base(path),
		Width: res.Width, Height: res.Height, DurationMs: res.DurationMs, HasAudio: res.HasAudio,
		Variants: db.MediaVariants{Images: res.Images, Videos: res.Videos, Poster: res.Poster},
	}, nil
}

// applyHero encodes a selling page's legacy hero and sets it as the hero asset.
func applyHero(ctx context.Context, h *db.LegacySellingPageHero, dir string) error {
	kind := media.KindImage
	if h.HeroMediaType == "video" {
		kind = media.KindVideo
	}
	a, err := encodeLegacy(ctx, filepath.Join(dir, h.HeroMedia), kind)
	if err != nil {
		return err
	}
	prev, err := db.BackfillSetSellingPageHero(ctx, h.ID, *a)
	if err != nil {
		_ = media.RemoveAssetFiles(a.ID)
		return err
	}
	if prev != "" {
		_ = media.RemoveAssetFiles(prev)
	}
	fmt.Printf("  hero set from %s\n", h.HeroMedia)
	return nil
}

// applyPlan writes one property's changes and returns the number of files
// that failed to encode.
func applyPlan(ctx context.Context, plan *propertyPlan, dir string) int {
	id := plan.prop.ID
	failures := 0

	var added []db.BackfillAsset
	for _, f := range plan.add {
		a, err := encodeLegacy(ctx, legacyPath(dir, id, f), media.KindImage)
		if err != nil {
			fmt.Printf("  error: %s: %v\n", f, err)
			failures++
			continue
		}
		added = append(added, *a)
	}
	if len(added) > 0 {
		if err := db.BackfillAppendPropertyMedia(ctx, id, added); err != nil {
			fmt.Printf("  error: saving gallery: %v\n", err)
			for _, a := range added {
				_ = media.RemoveAssetFiles(a.ID)
			}
			failures += len(added)
		} else {
			fmt.Printf("  added %d gallery image(s)\n", len(added))
		}
	}

	for _, f := range plan.remove {
		assetID, err := db.DeletePropertyMedia(ctx, id, plan.prop.Gallery[f].MediaID)
		if err != nil {
			fmt.Printf("  error: removing %s: %v\n", f, err)
			continue
		}
		_ = media.RemoveAssetFiles(assetID)
		fmt.Printf("  removed %s\n", f)
	}

	switch {
	case plan.setMain != "":
		a, err := encodeLegacy(ctx, legacyPath(dir, id, plan.setMain), media.KindImage)
		if err != nil {
			fmt.Printf("  error: main %s: %v\n", plan.setMain, err)
			failures++
			break
		}
		prev, err := db.BackfillSetPropertyMain(ctx, id, *a)
		if err != nil {
			fmt.Printf("  error: saving main image: %v\n", err)
			_ = media.RemoveAssetFiles(a.ID)
			failures++
			break
		}
		if prev != "" {
			_ = media.RemoveAssetFiles(prev)
		}
		fmt.Printf("  main image set from %s\n", plan.setMain)
	case plan.clearMain:
		prev, err := db.ClearPropertyMainImage(ctx, id)
		if err != nil {
			fmt.Printf("  error: clearing main image: %v\n", err)
			break
		}
		_ = media.RemoveAssetFiles(prev)
		fmt.Println("  main image cleared")
	}
	return failures
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.OpenFile(dst, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		return err
	}
	if _, err := io.Copy(out, in); err != nil {
		out.Close()
		return err
	}
	return out.Close()
}

func humanBytes(b int64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}
