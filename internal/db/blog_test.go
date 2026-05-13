package db_test

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/vladwithcode/sibra-site/internal/db"
)

// ── Unit tests (no DB required) ───────────────────────────────────────────────

func TestBlogPostStatus_Values(t *testing.T) {
	if string(db.BlogStatusDraft) != "draft" {
		t.Errorf("BlogStatusDraft = %q, want %q", db.BlogStatusDraft, "draft")
	}
	if string(db.BlogStatusPublished) != "published" {
		t.Errorf("BlogStatusPublished = %q, want %q", db.BlogStatusPublished, "published")
	}
	if string(db.BlogStatusArchived) != "archived" {
		t.Errorf("BlogStatusArchived = %q, want %q", db.BlogStatusArchived, "archived")
	}
}

func TestNewBlogPost_GeneratesID(t *testing.T) {
	p := db.NewBlogPost("Mi Post", "mi-post", "author-uuid", "2026/05/mi-post.md")
	if p.ID == "" {
		t.Error("NewBlogPost: ID must not be empty")
	}
	if p.Status != db.BlogStatusDraft {
		t.Errorf("NewBlogPost: default status = %q, want %q", p.Status, db.BlogStatusDraft)
	}
	if p.Slug != "mi-post" {
		t.Errorf("NewBlogPost: slug = %q, want %q", p.Slug, "mi-post")
	}
	if p.ContentPath != "2026/05/mi-post.md" {
		t.Errorf("NewBlogPost: content_path = %q, want %q", p.ContentPath, "2026/05/mi-post.md")
	}
	if p.CreatedAt.IsZero() {
		t.Error("NewBlogPost: CreatedAt must be set")
	}
}

func TestNewBlogPost_UniqueIDs(t *testing.T) {
	a := db.NewBlogPost("A", "a", "u1", "2026/05/a.md")
	b := db.NewBlogPost("B", "b", "u1", "2026/05/b.md")
	if a.ID == b.ID {
		t.Error("NewBlogPost: two posts must not share the same ID")
	}
}

func TestNewBlogTag_GeneratesID(t *testing.T) {
	tag := db.NewBlogTag("Go", "go")
	if tag.ID == "" {
		t.Error("NewBlogTag: ID must not be empty")
	}
	if tag.Name != "Go" || tag.Slug != "go" {
		t.Errorf("NewBlogTag: name/slug mismatch: got %q/%q", tag.Name, tag.Slug)
	}
}

// ── Filter condition builder tests (no DB required) ───────────────────────────

func TestBuildBlogPostFilterConditions_Empty(t *testing.T) {
	filter := &db.BlogPostFilter{}
	args := pgx.NamedArgs{}
	conditions, err := db.BuildBlogPostFilterConditionsForTest(filter, &args)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(conditions) != 0 {
		t.Errorf("empty filter: expected 0 conditions, got %d: %v", len(conditions), conditions)
	}
	if len(args) != 0 {
		t.Errorf("empty filter: expected 0 args, got %d", len(args))
	}
}

func TestBuildBlogPostFilterConditions_ByStatus(t *testing.T) {
	status := db.BlogStatusDraft
	filter := &db.BlogPostFilter{Status: &status}
	args := pgx.NamedArgs{}
	conditions, err := db.BuildBlogPostFilterConditionsForTest(filter, &args)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(conditions) != 1 {
		t.Fatalf("expected 1 condition, got %d", len(conditions))
	}
	if !strings.Contains(conditions[0], "status") {
		t.Errorf("condition %q should reference status", conditions[0])
	}
	if args["filterStatus"] != status {
		t.Errorf("filterStatus arg = %v, want %v", args["filterStatus"], status)
	}
}

func TestBuildBlogPostFilterConditions_ByAuthor(t *testing.T) {
	authorID := "some-author-uuid"
	filter := &db.BlogPostFilter{AuthorID: &authorID}
	args := pgx.NamedArgs{}
	conditions, err := db.BuildBlogPostFilterConditionsForTest(filter, &args)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(conditions) != 1 {
		t.Fatalf("expected 1 condition, got %d", len(conditions))
	}
	if args["filterAuthorID"] != authorID {
		t.Errorf("filterAuthorID arg = %v, want %v", args["filterAuthorID"], authorID)
	}
}

func TestBuildBlogPostFilterConditions_Search(t *testing.T) {
	q := "turismo"
	filter := &db.BlogPostFilter{Search: &q}
	args := pgx.NamedArgs{}
	conditions, err := db.BuildBlogPostFilterConditionsForTest(filter, &args)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(conditions) != 1 {
		t.Fatalf("expected 1 condition, got %d", len(conditions))
	}
	// Confirm the arg wraps the term in % wildcards
	searchArg, ok := args["filterSearch"].(string)
	if !ok {
		t.Fatalf("filterSearch arg is not a string: %T", args["filterSearch"])
	}
	if !strings.HasPrefix(searchArg, "%") || !strings.HasSuffix(searchArg, "%") {
		t.Errorf("filterSearch arg %q must be wrapped in %%...%%", searchArg)
	}
	if !strings.Contains(searchArg, "turismo") {
		t.Errorf("filterSearch arg %q must contain the original term", searchArg)
	}
}

func TestBuildBlogPostFilterConditions_Combined(t *testing.T) {
	status := db.BlogStatusPublished
	authorID := "u1"
	search := "tips"
	filter := &db.BlogPostFilter{Status: &status, AuthorID: &authorID, Search: &search}
	args := pgx.NamedArgs{}
	conditions, err := db.BuildBlogPostFilterConditionsForTest(filter, &args)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(conditions) != 3 {
		t.Errorf("expected 3 conditions, got %d: %v", len(conditions), conditions)
	}
	if len(args) != 3 {
		t.Errorf("expected 3 args, got %d", len(args))
	}
}

func TestBuildBlogPostFilterConditions_NilFilter(t *testing.T) {
	args := pgx.NamedArgs{}
	if _, err := db.BuildBlogPostFilterConditionsForTest(nil, &args); err == nil {
		t.Error("expected error for nil filter, got nil")
	}
}

func TestBuildBlogPostFilterConditions_EmptySearch(t *testing.T) {
	empty := ""
	filter := &db.BlogPostFilter{Search: &empty}
	args := pgx.NamedArgs{}
	conditions, err := db.BuildBlogPostFilterConditionsForTest(filter, &args)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(conditions) != 0 {
		t.Errorf("empty search string must produce 0 conditions, got %d", len(conditions))
	}
}

// ── Integration tests (require TEST_DATABASE_URL) ─────────────────────────────

// connectTestDB connects to the test database or skips the test if the
// TEST_DATABASE_URL environment variable is not set.
func connectTestDB(t *testing.T) *pgxpool.Pool {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL not set — skipping integration tests")
	}

	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connecting to test DB: %v", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		t.Fatalf("pinging test DB: %v", err)
	}

	// Wire the package-level pool so db.GetPoolWithCtx and db.GetTxAndPool work.
	db.DB = pool
	t.Cleanup(func() { pool.Close() })
	return pool
}

// testAuthorID looks up any user from the test DB to use as author_id.
// The blog_posts table requires a valid FK to users(id).
func testAuthorID(t *testing.T) string {
	t.Helper()
	conn, err := db.GetPool()
	if err != nil {
		t.Fatalf("acquiring pool for author lookup: %v", err)
	}
	defer conn.Release()

	var id string
	err = conn.QueryRow(context.Background(),
		`SELECT id FROM users LIMIT 1`,
	).Scan(&id)
	if err != nil {
		if err == pgx.ErrNoRows {
			t.Skip("no users in test DB — skipping (blog_posts requires a valid author_id FK)")
		}
		t.Fatalf("looking up test author: %v", err)
	}
	return id
}

func TestIntegration_BlogPost_CreateGetDelete(t *testing.T) {
	connectTestDB(t)
	authorID := testAuthorID(t)

	post := db.NewBlogPost("Integration Test Post", "integration-test-post-"+time.Now().Format("20060102150405"), authorID, "2026/05/integration-test.md")
	post.Snippet = "A test post"
	post.ReadingTime = 3

	ctx := context.Background()

	// Create
	if err := db.CreateBlogPost(ctx, post); err != nil {
		t.Fatalf("CreateBlogPost: %v", err)
	}

	t.Cleanup(func() {
		// Best-effort cleanup — ignore error if already deleted by the test
		db.DeleteBlogPost(ctx, post.ID)
	})

	// GetByID
	got, err := db.GetBlogPostByID(ctx, post.ID)
	if err != nil {
		t.Fatalf("GetBlogPostByID: %v", err)
	}
	if got.Title != post.Title {
		t.Errorf("Title: got %q, want %q", got.Title, post.Title)
	}
	if got.Status != db.BlogStatusDraft {
		t.Errorf("Status: got %q, want %q", got.Status, db.BlogStatusDraft)
	}
	if got.ReadingTime != 3 {
		t.Errorf("ReadingTime: got %d, want 3", got.ReadingTime)
	}

	// Not visible in public API while draft
	_, err = db.GetBlogPostBySlug(ctx, post.Slug)
	if err == nil {
		t.Error("GetBlogPostBySlug: draft post must not be visible publicly")
	}

	// Delete — must return content_path
	contentPath, err := db.DeleteBlogPost(ctx, post.ID)
	if err != nil {
		t.Fatalf("DeleteBlogPost: %v", err)
	}
	if contentPath != post.ContentPath {
		t.Errorf("DeleteBlogPost contentPath: got %q, want %q", contentPath, post.ContentPath)
	}

	// Must be gone
	_, err = db.GetBlogPostByID(ctx, post.ID)
	if err == nil {
		t.Error("GetBlogPostByID: post must not exist after deletion")
	}
}

func TestIntegration_BlogPost_StatusTransitions(t *testing.T) {
	connectTestDB(t)
	authorID := testAuthorID(t)

	slug := "status-transition-test-" + time.Now().Format("20060102150405")
	post := db.NewBlogPost("Status Test", slug, authorID, "2026/05/"+slug+".md")
	ctx := context.Background()

	if err := db.CreateBlogPost(ctx, post); err != nil {
		t.Fatalf("CreateBlogPost: %v", err)
	}
	t.Cleanup(func() { db.DeleteBlogPost(ctx, post.ID) })

	// draft → published
	if err := db.UpdateBlogPostStatus(ctx, post.ID, db.BlogStatusPublished); err != nil {
		t.Fatalf("UpdateBlogPostStatus(published): %v", err)
	}

	got, _ := db.GetBlogPostByID(ctx, post.ID)
	if got.Status != db.BlogStatusPublished {
		t.Errorf("Status after publish: got %q, want %q", got.Status, db.BlogStatusPublished)
	}
	if got.PublishedAt.IsZero() {
		t.Error("PublishedAt must be set after publishing")
	}
	if !got.ArchivedAt.IsZero() {
		t.Error("ArchivedAt must be zero before archiving")
	}

	// published → published again must not change published_at
	firstPublishedAt := got.PublishedAt
	if err := db.UpdateBlogPostStatus(ctx, post.ID, db.BlogStatusPublished); err != nil {
		t.Fatalf("UpdateBlogPostStatus(published again): %v", err)
	}
	got2, _ := db.GetBlogPostByID(ctx, post.ID)
	if !got2.PublishedAt.Equal(firstPublishedAt) {
		t.Error("PublishedAt must not change on repeated publish")
	}

	// published → archived
	if err := db.UpdateBlogPostStatus(ctx, post.ID, db.BlogStatusArchived); err != nil {
		t.Fatalf("UpdateBlogPostStatus(archived): %v", err)
	}
	got3, _ := db.GetBlogPostByID(ctx, post.ID)
	if got3.Status != db.BlogStatusArchived {
		t.Errorf("Status after archive: got %q, want %q", got3.Status, db.BlogStatusArchived)
	}
	if got3.ArchivedAt.IsZero() {
		t.Error("ArchivedAt must be set after archiving")
	}

	// Now visible via slug admin, not via public slug
	_, err := db.GetBlogPostBySlugAdmin(ctx, slug)
	if err != nil {
		t.Errorf("GetBlogPostBySlugAdmin: archived post must be accessible: %v", err)
	}
	_, err = db.GetBlogPostBySlug(ctx, slug)
	if err == nil {
		t.Error("GetBlogPostBySlug: archived post must not be publicly visible")
	}
}

func TestIntegration_BlogPost_SlugExists(t *testing.T) {
	connectTestDB(t)
	authorID := testAuthorID(t)

	slug := "slug-exists-test-" + time.Now().Format("20060102150405")
	post := db.NewBlogPost("Slug Test", slug, authorID, "2026/05/"+slug+".md")
	ctx := context.Background()

	if err := db.CreateBlogPost(ctx, post); err != nil {
		t.Fatalf("CreateBlogPost: %v", err)
	}
	t.Cleanup(func() { db.DeleteBlogPost(ctx, post.ID) })

	exists, err := db.BlogPostSlugExists(ctx, slug)
	if err != nil {
		t.Fatalf("BlogPostSlugExists: %v", err)
	}
	if !exists {
		t.Error("BlogPostSlugExists: must return true for existing slug")
	}

	notExists, err := db.BlogPostSlugExists(ctx, "definitely-does-not-exist-xyz")
	if err != nil {
		t.Fatalf("BlogPostSlugExists (missing): %v", err)
	}
	if notExists {
		t.Error("BlogPostSlugExists: must return false for non-existent slug")
	}
}

func TestIntegration_BlogTag_CRUD(t *testing.T) {
	connectTestDB(t)

	ctx := context.Background()
	tagSlug := "test-tag-" + time.Now().Format("20060102150405")
	tag := db.NewBlogTag("Test Tag", tagSlug)

	if err := db.CreateBlogTag(ctx, tag); err != nil {
		t.Fatalf("CreateBlogTag: %v", err)
	}
	t.Cleanup(func() { db.DeleteBlogTag(ctx, tag.ID) })

	tags, err := db.ListBlogTags(ctx)
	if err != nil {
		t.Fatalf("ListBlogTags: %v", err)
	}

	found := false
	for _, tg := range tags {
		if tg.ID == tag.ID {
			found = true
			break
		}
	}
	if !found {
		t.Error("ListBlogTags: created tag not found in list")
	}

	if err := db.DeleteBlogTag(ctx, tag.ID); err != nil {
		t.Fatalf("DeleteBlogTag: %v", err)
	}

	// Must return ErrBlogTagNotFound on second delete
	if err := db.DeleteBlogTag(ctx, tag.ID); !isErrBlogTagNotFound(err) {
		t.Errorf("DeleteBlogTag (already deleted): expected ErrBlogTagNotFound, got %v", err)
	}
}

func TestIntegration_SetBlogPostTags(t *testing.T) {
	connectTestDB(t)
	authorID := testAuthorID(t)

	ctx := context.Background()
	slug := "tag-assoc-test-" + time.Now().Format("20060102150405")
	post := db.NewBlogPost("Tag Assoc", slug, authorID, "2026/05/"+slug+".md")
	tag1 := db.NewBlogTag("TagA", "taga-"+time.Now().Format("20060102150405"))
	tag2 := db.NewBlogTag("TagB", "tagb-"+time.Now().Format("20060102150405"))

	for _, setup := range []func() error{
		func() error { return db.CreateBlogPost(ctx, post) },
		func() error { return db.CreateBlogTag(ctx, tag1) },
		func() error { return db.CreateBlogTag(ctx, tag2) },
	} {
		if err := setup(); err != nil {
			t.Fatalf("setup: %v", err)
		}
	}
	t.Cleanup(func() {
		db.DeleteBlogPost(ctx, post.ID) // cascades blog_post_tags
		db.DeleteBlogTag(ctx, tag1.ID)
		db.DeleteBlogTag(ctx, tag2.ID)
	})

	// Set two tags
	if err := db.SetBlogPostTags(ctx, post.ID, []string{tag1.ID, tag2.ID}); err != nil {
		t.Fatalf("SetBlogPostTags: %v", err)
	}
	tags, err := db.GetBlogPostTags(ctx, post.ID)
	if err != nil {
		t.Fatalf("GetBlogPostTags: %v", err)
	}
	if len(tags) != 2 {
		t.Errorf("expected 2 tags, got %d", len(tags))
	}

	// Replace with just one tag
	if err := db.SetBlogPostTags(ctx, post.ID, []string{tag1.ID}); err != nil {
		t.Fatalf("SetBlogPostTags (replace): %v", err)
	}
	tags2, _ := db.GetBlogPostTags(ctx, post.ID)
	if len(tags2) != 1 {
		t.Errorf("after replace: expected 1 tag, got %d", len(tags2))
	}
	if tags2[0].ID != tag1.ID {
		t.Errorf("after replace: unexpected tag ID %q", tags2[0].ID)
	}

	// Clear all tags
	if err := db.SetBlogPostTags(ctx, post.ID, []string{}); err != nil {
		t.Fatalf("SetBlogPostTags (clear): %v", err)
	}
	tags3, _ := db.GetBlogPostTags(ctx, post.ID)
	if len(tags3) != 0 {
		t.Errorf("after clear: expected 0 tags, got %d", len(tags3))
	}
}

func isErrBlogTagNotFound(err error) bool {
	return err != nil && err.Error() == db.ErrBlogTagNotFound.Error()
}
