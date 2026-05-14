package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ── Sentinel errors ───────────────────────────────────────────────────────────

var (
	ErrBlogPostNotFound  = errors.New("blog post not found")
	ErrBlogTagNotFound   = errors.New("blog tag not found")
	ErrBlogSlugExists    = errors.New("blog post slug already in use")
	ErrBlogTagSlugExists = errors.New("blog tag slug already in use")
)

// ── Types ─────────────────────────────────────────────────────────────────────

type BlogPostStatus string

const (
	BlogStatusDraft     BlogPostStatus = "draft"
	BlogStatusPublished BlogPostStatus = "published"
	BlogStatusArchived  BlogPostStatus = "archived"
)

// blogPostSelectCols is the fixed column list used in every SELECT query.
// The order must match the arguments in scanBlogPost exactly.
const blogPostSelectCols = `
    bp.id, bp.slug, bp.title, bp.snippet, bp.status, bp.reading_time,
    bp.author_id, bp.content_path, bp.cover_image,
    bp.published_at, bp.archived_at, bp.created_at, bp.updated_at`

// ── Structs ───────────────────────────────────────────────────────────────────

// BlogPost holds the metadata of a blog post.
// Content is stored on the filesystem; ContentPath is the relative path to it.
// Tags is populated only by queries that explicitly join blog_post_tags.
type BlogPost struct {
	ID          string         `json:"id"`
	Slug        string         `json:"slug"`
	Title       string         `json:"title"`
	Snippet     string         `json:"snippet"`
	Status      BlogPostStatus `json:"status"`
	ReadingTime int            `json:"readingTime"`
	AuthorID    string         `json:"authorId"`
	ContentPath string         `json:"contentPath"`
	CoverImage  string         `json:"coverImage"`
	PublishedAt time.Time      `json:"publishedAt"`
	ArchivedAt  time.Time      `json:"archivedAt"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	Tags        []BlogTag      `json:"tags"`
}

type BlogTag struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// NewBlogPost returns a BlogPost with a generated ID and default draft status.
func NewBlogPost(title, slug, authorID, contentPath string) *BlogPost {
	now := time.Now()
	return &BlogPost{
		ID:          uuid.Must(uuid.NewV7()).String(),
		Title:       title,
		Slug:        slug,
		Status:      BlogStatusDraft,
		AuthorID:    authorID,
		ContentPath: contentPath,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}

// NewBlogTag returns a BlogTag with a generated ID.
func NewBlogTag(name, slug string) *BlogTag {
	now := time.Now()
	return &BlogTag{
		ID:        uuid.Must(uuid.NewV7()).String(),
		Name:      name,
		Slug:      slug,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// ── Filters ───────────────────────────────────────────────────────────────────

type BlogPostFilter struct {
	Status   *BlogPostStatus
	AuthorID *string
	Search   *string // ILIKE on title or snippet
}

func buildBlogPostFilterConditions(filter *BlogPostFilter, args *pgx.NamedArgs) ([]string, error) {
	if filter == nil {
		return nil, errors.New("blog post filter must not be nil")
	}
	if args == nil {
		return nil, errors.New("blog post filter args must not be nil")
	}
	if *args == nil {
		*args = pgx.NamedArgs{}
	}
	locArgs := *args

	var conditions []string

	if filter.Status != nil {
		conditions = append(conditions, "bp.status = @filterStatus")
		locArgs["filterStatus"] = *filter.Status
	}
	if filter.AuthorID != nil && *filter.AuthorID != "" {
		conditions = append(conditions, "bp.author_id = @filterAuthorID")
		locArgs["filterAuthorID"] = *filter.AuthorID
	}
	if filter.Search != nil && *filter.Search != "" {
		conditions = append(conditions, "(bp.title ILIKE @filterSearch OR bp.snippet ILIKE @filterSearch)")
		locArgs["filterSearch"] = "%" + *filter.Search + "%"
	}

	return conditions, nil
}

// ── Scan helper ───────────────────────────────────────────────────────────────

// rowScanner is satisfied by both pgx.Row (QueryRow) and pgx.Rows (Query loop).
type rowScanner interface {
	Scan(dest ...any) error
}

// scanBlogPost maps a DB row to a BlogPost. Nullable columns use sql.Null* types
// and fall back to zero values in the struct, consistent with the rest of the
// codebase (see User.Img, Request.Property).
func scanBlogPost(s rowScanner) (*BlogPost, error) {
	var (
		p           BlogPost
		snippet     sql.NullString
		coverImage  sql.NullString
		readingTime sql.NullInt32
		publishedAt sql.NullTime
		archivedAt  sql.NullTime
	)
	err := s.Scan(
		&p.ID,
		&p.Slug,
		&p.Title,
		&snippet,
		&p.Status,
		&readingTime,
		&p.AuthorID,
		&p.ContentPath,
		&coverImage,
		&publishedAt,
		&archivedAt,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if snippet.Valid {
		p.Snippet = snippet.String
	}
	if coverImage.Valid {
		p.CoverImage = coverImage.String
	}
	if readingTime.Valid {
		p.ReadingTime = int(readingTime.Int32)
	}
	if publishedAt.Valid {
		p.PublishedAt = publishedAt.Time
	}
	if archivedAt.Valid {
		p.ArchivedAt = archivedAt.Time
	}
	return &p, nil
}

// ── Blog Posts ────────────────────────────────────────────────────────────────

// CreateBlogPost inserts a new blog post record. The ID must be pre-generated
// with NewBlogPost or uuid.Must(uuid.NewV7()).String().
func CreateBlogPost(ctx context.Context, post *BlogPost) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := pgx.NamedArgs{
		"id":          post.ID,
		"slug":        post.Slug,
		"title":       post.Title,
		"snippet":     sql.NullString{String: post.Snippet, Valid: post.Snippet != ""},
		"status":      post.Status,
		"readingTime": sql.NullInt32{Int32: int32(post.ReadingTime), Valid: post.ReadingTime > 0},
		"authorId":    post.AuthorID,
		"contentPath": post.ContentPath,
		"coverImage":  sql.NullString{String: post.CoverImage, Valid: post.CoverImage != ""},
	}

	_, err = conn.Exec(ctx, `
		INSERT INTO blog_posts
			(id, slug, title, snippet, status, reading_time, author_id, content_path, cover_image)
		VALUES
			(@id, @slug, @title, @snippet, @status, @readingTime, @authorId, @contentPath, @coverImage)`,
		args,
	)
	return err
}

// GetBlogPostByID returns a post regardless of its status. Used in admin operations.
func GetBlogPostByID(ctx context.Context, id string) (*BlogPost, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	row := conn.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s FROM blog_posts bp WHERE bp.id = $1`, blogPostSelectCols),
		id,
	)
	return scanBlogPost(row)
}

// GetBlogPostBySlug returns a published post by slug. Returns pgx.ErrNoRows if
// the post does not exist or is not published. Used by the public API.
func GetBlogPostBySlug(ctx context.Context, slug string) (*BlogPost, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	row := conn.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s FROM blog_posts bp
		             WHERE bp.slug = $1 AND bp.status = 'published'`, blogPostSelectCols),
		slug,
	)
	return scanBlogPost(row)
}

// GetBlogPostBySlugAdmin returns a post by slug regardless of status.
// Used in admin operations where editors need to access their drafts.
func GetBlogPostBySlugAdmin(ctx context.Context, slug string) (*BlogPost, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	row := conn.QueryRow(ctx,
		fmt.Sprintf(`SELECT %s FROM blog_posts bp WHERE bp.slug = $1`, blogPostSelectCols),
		slug,
	)
	return scanBlogPost(row)
}

// ListPublishedBlogPosts returns paginated published posts ordered by published_at DESC.
func ListPublishedBlogPosts(ctx context.Context, limit, page int) ([]*BlogPost, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := pgx.NamedArgs{}
	query := fmt.Sprintf(`SELECT %s FROM blog_posts bp
	                       WHERE bp.status = 'published'
	                       ORDER BY bp.published_at DESC`, blogPostSelectCols)

	if limit > 0 {
		query += " LIMIT @limit"
		args["limit"] = limit
		if page > 0 {
			query += " OFFSET @offset"
			args["offset"] = limit * (page - 1)
		}
	}

	rows, err := conn.Query(ctx, query, args)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return collectBlogPostRows(rows)
}

// GetPublishedBlogPostPagination returns pagination metadata for the published posts list.
func GetPublishedBlogPostPagination(ctx context.Context, limit, page int) (*Pagination, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var count int
	err = conn.QueryRow(ctx,
		`SELECT COUNT(*) FROM blog_posts WHERE status = 'published'`,
	).Scan(&count)
	if err != nil {
		return nil, err
	}

	return NewPagination(count, limit, page), nil
}

// ListAllBlogPosts returns paginated posts for the admin panel, with optional filters.
func ListAllBlogPosts(ctx context.Context, filter *BlogPostFilter, limit, page int) ([]*BlogPost, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := pgx.NamedArgs{}
	conditions, err := buildBlogPostFilterConditions(filter, &args)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(`SELECT %s FROM blog_posts bp`, blogPostSelectCols)
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY bp.created_at DESC"

	if limit > 0 {
		query += " LIMIT @limit"
		args["limit"] = limit
		if page > 0 {
			query += " OFFSET @offset"
			args["offset"] = limit * (page - 1)
		}
	}

	rows, err := conn.Query(ctx, query, args)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return collectBlogPostRows(rows)
}

// GetBlogPostPagination returns pagination metadata for admin listing with filters.
func GetBlogPostPagination(ctx context.Context, filter *BlogPostFilter, limit, page int) (*Pagination, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := pgx.NamedArgs{}
	conditions, err := buildBlogPostFilterConditions(filter, &args)
	if err != nil {
		return nil, err
	}

	query := `SELECT COUNT(*) FROM blog_posts bp`
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}

	var count int
	if err := conn.QueryRow(ctx, query, args).Scan(&count); err != nil {
		return nil, err
	}

	return NewPagination(count, limit, page), nil
}

// UpdateBlogPost updates the editable fields of an existing post.
// Status, author_id, published_at, archived_at, and created_at are not touched here;
// use UpdateBlogPostStatus for status transitions.
func UpdateBlogPost(ctx context.Context, post *BlogPost) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := pgx.NamedArgs{
		"id":          post.ID,
		"title":       post.Title,
		"snippet":     sql.NullString{String: post.Snippet, Valid: post.Snippet != ""},
		"readingTime": sql.NullInt32{Int32: int32(post.ReadingTime), Valid: post.ReadingTime > 0},
		"coverImage":  sql.NullString{String: post.CoverImage, Valid: post.CoverImage != ""},
	}

	_, err = conn.Exec(ctx, `
		UPDATE blog_posts SET
			title        = @title,
			snippet      = @snippet,
			reading_time = @readingTime,
			cover_image  = @coverImage,
			updated_at   = NOW()
		WHERE id = @id`,
		args,
	)
	return err
}

// UpdateBlogPostStatus transitions a post to a new status.
// The DB sets published_at on first publication and archived_at on archiving.
// Permission validation (who may call this) is handled in the HTTP handlers.
func UpdateBlogPostStatus(ctx context.Context, id string, newStatus BlogPostStatus) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := pgx.NamedArgs{
		"id":        id,
		"newStatus": newStatus,
	}

	tag, err := conn.Exec(ctx, `
		UPDATE blog_posts SET
            status = @newStatus::text,
			published_at = CASE
				WHEN @newStatus = 'published' AND published_at IS NULL THEN NOW()
				ELSE published_at
			END,
			archived_at = CASE
				WHEN @newStatus = 'archived' AND archived_at IS NULL THEN NOW()
				ELSE archived_at
			END,
			updated_at = NOW()
		WHERE id = @id`,
		args,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrBlogPostNotFound
	}
	return nil
}

// ArchiveBlogPost atomically sets a post to archived with a new slug and content_path.
// The caller is responsible for moving the .md file before calling this.
// Returns ErrBlogPostNotFound if no row matched.
func ArchiveBlogPost(ctx context.Context, id, newSlug, newContentPath string) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := pgx.NamedArgs{
		"id":             id,
		"newSlug":        newSlug,
		"newContentPath": newContentPath,
	}

	tag, err := conn.Exec(ctx, `
		UPDATE blog_posts SET
			slug         = @newSlug,
			content_path = @newContentPath,
			status       = 'archived',
			archived_at  = CASE WHEN archived_at IS NULL THEN NOW() ELSE archived_at END,
			updated_at   = NOW()
		WHERE id = @id`,
		args,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrBlogPostNotFound
	}
	return nil
}

// BlogPostSlugExists returns true if any blog post (any status) uses the given slug.
func BlogPostSlugExists(ctx context.Context, slug string) (bool, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return false, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var count int
	err = conn.QueryRow(ctx,
		`SELECT COUNT(*) FROM blog_posts WHERE slug = $1`, slug,
	).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// BlogPostContentPathExists returns true if any blog post uses the given content_path.
func BlogPostContentPathExists(ctx context.Context, contentPath string) (bool, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return false, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var count int
	err = conn.QueryRow(ctx,
		`SELECT COUNT(*) FROM blog_posts WHERE content_path = $1`, contentPath,
	).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// DeleteBlogPost removes a post and returns its content_path so the caller can
// delete the corresponding .md file from the filesystem.
// Returns ErrBlogPostNotFound if no row matched.
func DeleteBlogPost(ctx context.Context, id string) (contentPath string, err error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return "", err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	err = conn.QueryRow(ctx,
		`DELETE FROM blog_posts WHERE id = $1 RETURNING content_path`, id,
	).Scan(&contentPath)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrBlogPostNotFound
		}
		return "", err
	}
	return contentPath, nil
}

// collectBlogPostRows scans all rows from a blog_posts query into a slice.
func collectBlogPostRows(rows pgx.Rows) ([]*BlogPost, error) {
	posts := make([]*BlogPost, 0)
	for rows.Next() {
		p, err := scanBlogPost(rows)
		if err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return posts, nil
}

// ── Blog Tags ─────────────────────────────────────────────────────────────────

// CreateBlogTag inserts a new tag. Slugs are unique case-insensitively.
func CreateBlogTag(ctx context.Context, tag *BlogTag) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if tag.ID == "" {
		tag.ID = uuid.Must(uuid.NewV7()).String()
	}

	_, err = conn.Exec(ctx, `
		INSERT INTO blog_tags (id, name, slug)
		VALUES (@id, @name, @slug)`,
		pgx.NamedArgs{
			"id":   tag.ID,
			"name": tag.Name,
			"slug": tag.Slug,
		},
	)
	return err
}

// ListBlogTags returns all tags ordered by name.
func ListBlogTags(ctx context.Context) ([]*BlogTag, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := conn.Query(ctx,
		`SELECT id, name, slug, created_at, updated_at FROM blog_tags ORDER BY name`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tags := make([]*BlogTag, 0)
	for rows.Next() {
		var t BlogTag
		if err := rows.Scan(&t.ID, &t.Name, &t.Slug, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		tags = append(tags, &t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return tags, nil
}

// DeleteBlogTag removes a tag. The DB will reject the delete (FK violation) if
// the tag is still referenced by any post; the handler should convert that to a 409.
func DeleteBlogTag(ctx context.Context, id string) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	tag, err := conn.Exec(ctx, `DELETE FROM blog_tags WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrBlogTagNotFound
	}
	return nil
}

// ── Post-Tag junction ─────────────────────────────────────────────────────────

// SetBlogPostTags replaces all tag associations for a post in a single transaction.
// Pass an empty slice to remove all tags.
func SetBlogPostTags(ctx context.Context, postID string, tagIDs []string) error {
	tx, conn, err := GetTxAndPool(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if _, err := tx.Exec(ctx,
		`DELETE FROM blog_post_tags WHERE post_id = $1`, postID,
	); err != nil {
		tx.Rollback(ctx)
		return err
	}

	if len(tagIDs) > 0 {
		batch := pgx.Batch{}
		seen := make(map[string]struct{}, len(tagIDs))
		for _, tid := range tagIDs {
			if _, dup := seen[tid]; dup {
				continue
			}
			seen[tid] = struct{}{}
			batch.Queue(
				`INSERT INTO blog_post_tags (post_id, tag_id) VALUES (@postID, @tagID)`,
				pgx.NamedArgs{"postID": postID, "tagID": tid},
			)
		}

		bres := tx.SendBatch(ctx, &batch)
		for i := 0; i < batch.Len(); i++ {
			if _, err := bres.Exec(); err != nil {
				bres.Close()
				tx.Rollback(ctx)
				return err
			}
		}
		if err := bres.Close(); err != nil {
			tx.Rollback(ctx)
			return err
		}
	}

	return tx.Commit(ctx)
}

// GetBlogPostTags returns all tags associated with a post, ordered by name.
func GetBlogPostTags(ctx context.Context, postID string) ([]BlogTag, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := conn.Query(ctx, `
		SELECT t.id, t.name, t.slug, t.created_at, t.updated_at
		FROM blog_tags t
		JOIN blog_post_tags pt ON pt.tag_id = t.id
		WHERE pt.post_id = $1
		ORDER BY t.name`,
		postID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tags := make([]BlogTag, 0)
	for rows.Next() {
		var t BlogTag
		if err := rows.Scan(&t.ID, &t.Name, &t.Slug, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return tags, nil
}
