package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/vladwithcode/sibra-site/internal/blogcleanup"
	"github.com/vladwithcode/sibra-site/internal/blogfs"
	"github.com/vladwithcode/sibra-site/internal/db"
)

func main() {
	doDelete := flag.Bool("delete", false, "Actually delete orphan files (default: dry-run)")
	minAge := flag.Duration("min-age", 48*time.Hour, "Minimum file age before considering orphan (e.g. 24h, 72h)")
	uploadsDir := flag.String("uploads-dir", "web/static/uploads/blog", "Path to blog uploads directory")
	flag.Parse()

	godotenv.Overload(".env")

	storageDir := os.Getenv("BLOG_STORAGE_DIR")
	if storageDir == "" {
		storageDir = "storage/blog"
	}

	// Connect to DB
	pool, err := db.Connect()
	if err != nil {
		log.Fatalf("DB connection failed: %v", err)
	}
	defer pool.Close()

	ctx := context.Background()

	// 1. Scan upload directory
	files, err := blogcleanup.ScanDir(*uploadsDir)
	if err != nil {
		log.Fatalf("Scan failed: %v", err)
	}

	var totalBytes int64
	for _, f := range files {
		totalBytes += f.Size()
	}

	fmt.Printf("Scanned %d image files in %s (%s)\n", len(files), *uploadsDir, humanBytes(totalBytes))

	if len(files) == 0 {
		fmt.Println("No image files found. Nothing to do.")
		return
	}

	// 2. Query DB for all references
	refs, err := db.ListBlogImageRefs(ctx)
	if err != nil {
		log.Fatalf("DB query failed: %v", err)
	}

	// 3. Build referenced set from cover_image + markdown content
	var coverImages []string
	var markdowns []string
	for _, ref := range refs {
		coverImages = append(coverImages, ref.CoverImage)
		if ref.ContentPath != "" {
			content, err := blogfs.Read(storageDir, ref.ContentPath)
			if err != nil {
				log.Printf("warn: cannot read %s: %v (skipping markdown scan for this post)", ref.ContentPath, err)
				continue
			}
			markdowns = append(markdowns, content)
		}
	}

	referencedSet := blogcleanup.BuildReferencedSet(coverImages, markdowns)
	fmt.Printf("Found %d unique referenced image filenames across %d posts\n", len(referencedSet), len(refs))

	// 4. Classify
	now := time.Now()
	orphans, skippedByAge := blogcleanup.ClassifyFiles(files, referencedSet, now, *minAge)

	var orphanBytes int64
	for _, o := range orphans {
		orphanBytes += o.Size()
	}

	// 5. Report
	fmt.Println()
	fmt.Println("── Results ──────────────────────────────────────────")
	fmt.Printf("  Total files scanned:     %d\n", len(files))
	fmt.Printf("  Referenced (keep):       %d\n", len(files)-len(orphans)-skippedByAge)
	fmt.Printf("  Orphaned:                %d (%s)\n", len(orphans), humanBytes(orphanBytes))
	fmt.Printf("  Skipped (too recent):    %d (min-age: %s)\n", skippedByAge, *minAge)
	fmt.Println()

	if len(orphans) == 0 {
		fmt.Println("No orphan images found. Nothing to clean up.")
		return
	}

	// List orphans
	fmt.Println("Orphan files:")
	for _, o := range orphans {
		age := now.Sub(o.ModTime()).Truncate(time.Minute)
		fmt.Printf("  %-40s  %8s  age: %s\n", o.Name(), humanBytes(o.Size()), age)
	}
	fmt.Println()

	if !*doDelete {
		fmt.Println("DRY RUN — no files were deleted.")
		fmt.Printf("To delete, run again with: --delete\n")
		return
	}

	// 6. Delete
	var deleted int
	var deletedBytes int64
	var errors []string
	for _, o := range orphans {
		if err := blogcleanup.SafeDeleteFile(*uploadsDir, o.Name()); err != nil {
			errors = append(errors, fmt.Sprintf("%s: %v", o.Name(), err))
			continue
		}
		deleted++
		deletedBytes += o.Size()
	}

	fmt.Printf("Deleted %d files (%s)\n", deleted, humanBytes(deletedBytes))
	if len(errors) > 0 {
		fmt.Printf("Errors (%d):\n", len(errors))
		for _, e := range errors {
			fmt.Printf("  %s\n", e)
		}
	}
}

func humanBytes(b int64) string {
	const (
		kb = 1024
		mb = 1024 * kb
	)
	switch {
	case b >= mb:
		return fmt.Sprintf("%.1f MB", float64(b)/float64(mb))
	case b >= kb:
		return fmt.Sprintf("%.1f KB", float64(b)/float64(kb))
	default:
		return fmt.Sprintf("%d B", b)
	}
}
