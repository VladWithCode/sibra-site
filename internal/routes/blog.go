package routes

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/vladwithcode/sibra-site/internal/auth"
	"github.com/vladwithcode/sibra-site/internal/blogfs"
	"github.com/vladwithcode/sibra-site/internal/db"
	"github.com/vladwithcode/sibra-site/internal/uploads"
)

func RegisterBlogRoutes(router *customServeMux) {
	// ── Public (no auth) ──────────────────────────────────────────────────────
	router.HandleFunc("GET /api/blog/posts", handleListPublishedPosts)
	router.HandleFunc("GET /api/blog/posts/{slug}", handleGetPublishedPost)
	router.HandleFunc("GET /api/blog/tags", handleListTagsPublic)

	// ── Admin (editor+ for reads/create/edit, admin for archive/delete) ──────
	router.HandleFunc("GET /api/admin/blog/posts", auth.WithAuthAccessLevelMiddleware(handleAdminListPosts, auth.AccessLevelEditor))
	router.HandleFunc("GET /api/admin/blog/posts/{id}", auth.WithAuthAccessLevelMiddleware(handleAdminGetPost, auth.AccessLevelEditor))
	router.HandleFunc("POST /api/admin/blog/posts", auth.WithAuthAccessLevelMiddleware(handleAdminCreatePost, auth.AccessLevelEditor))
	router.HandleFunc("PUT /api/admin/blog/posts/{id}", auth.WithAuthAccessLevelMiddleware(handleAdminUpdatePost, auth.AccessLevelEditor))
	router.HandleFunc("PATCH /api/admin/blog/posts/{id}/status", auth.WithAuthAccessLevelMiddleware(handleAdminUpdatePostStatus, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/admin/blog/posts/{id}", auth.WithAuthAccessLevelMiddleware(handleAdminDeletePost, auth.AccessLevelAdmin))

	router.HandleFunc("GET /api/admin/blog/tags", auth.WithAuthAccessLevelMiddleware(handleAdminListTags, auth.AccessLevelEditor))
	router.HandleFunc("POST /api/admin/blog/tags", auth.WithAuthAccessLevelMiddleware(handleAdminCreateTag, auth.AccessLevelEditor))
	router.HandleFunc("DELETE /api/admin/blog/tags/{id}", auth.WithAuthAccessLevelMiddleware(handleAdminDeleteTag, auth.AccessLevelAdmin))

	router.HandleFunc("POST /api/admin/blog/uploads", auth.WithAuthAccessLevelMiddleware(handleAdminBlogUpload, auth.AccessLevelEditor))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

var nonAlphanumRe = regexp.MustCompile(`[^a-z0-9]+`)

func blogSlugify(title string) string {
	s := strings.ToLower(title)
	s = nonAlphanumRe.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if len(s) > 512 {
		s = s[:512]
		s = strings.TrimRight(s, "-")
	}
	return s
}

func blogStorageDir() string {
	if d := os.Getenv("BLOG_STORAGE_DIR"); d != "" {
		return d
	}
	return "storage/blog"
}

func calculateReadingTime(content string) int {
	words := len(strings.Fields(content))
	rt := words / 200
	if rt < 1 {
		rt = 1
	}
	return rt
}

func isPgUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func isPgFKViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23503"
}

const blogPaginationMaxLimit = 100

// blogJSONMaxSize is the maximum accepted size for JSON request bodies on blog
// endpoints. Upload bodies are limited separately via blogUploadMaxSize.
const blogJSONMaxSize = 2 << 20 // 2 MB

// limitJSONBody caps the request body at blogJSONMaxSize.
// Must be called before json.Decoder reads from r.Body.
func limitJSONBody(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, blogJSONMaxSize)
}

func blogParsePagination(r *http.Request) (limit, page int) {
	limit = db.DefaultPageSize
	page = 1
	if l, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && l >= 1 {
		limit = l
	}
	if limit > blogPaginationMaxLimit {
		limit = blogPaginationMaxLimit
	}
	if p, err := strconv.Atoi(r.URL.Query().Get("page")); err == nil && p >= 1 {
		page = p
	}
	return
}

func isBlogNotFound(err error) bool {
	return errors.Is(err, db.ErrBlogPostNotFound) || errors.Is(err, db.ErrBlogTagNotFound)
}

func uniqueBlogSlug(ctx context.Context, base string) (string, error) {
	candidate := base
	for i := 2; i <= 99; i++ {
		taken, err := db.BlogPostSlugExists(ctx, candidate)
		if err != nil {
			return "", err
		}
		if !taken {
			return candidate, nil
		}
		candidate = base + "-" + strconv.Itoa(i)
	}
	return "", errors.New("no unique slug found after 99 attempts")
}

// ── Public handlers ───────────────────────────────────────────────────────────

// GET /api/blog/posts?page=1&limit=10
func handleListPublishedPosts(w http.ResponseWriter, r *http.Request) {
	limit, page := blogParsePagination(r)
	ctx := context.Background()

	posts, err := db.ListPublishedBlogPosts(ctx, limit, page)
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al obtener los posts"})
		log.Printf("err: %v\n", err)
		return
	}

	pagination, err := db.GetPublishedBlogPostPagination(ctx, limit, page)
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al obtener la paginación"})
		log.Printf("err: %v\n", err)
		return
	}

	for _, p := range posts {
		tags, err := db.GetBlogPostTags(ctx, p.ID)
		if err != nil {
			log.Printf("err getting tags for post %s: %v\n", p.ID, err)
		} else {
			p.Tags = tags
		}
	}

	respondWithJSON(w, 200, map[string]any{
		"posts":      posts,
		"pagination": pagination,
	})
}

// GET /api/blog/posts/{slug}
func handleGetPublishedPost(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	ctx := context.Background()

	post, err := db.GetBlogPostBySlug(ctx, slug)
	if err != nil {
		if isBlogNotFound(err) {
			respondWithError(w, 404, ErrorParams{ErrorMessage: "Post no encontrado"})
			return
		}
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al obtener el post"})
		log.Printf("err: %v\n", err)
		return
	}

	content, err := blogfs.Read(blogStorageDir(), post.ContentPath)
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al leer el contenido del post"})
		log.Printf("err reading blog content %s: %v\n", post.ContentPath, err)
		return
	}

	tags, err := db.GetBlogPostTags(ctx, post.ID)
	if err != nil {
		log.Printf("err getting tags for post %s: %v\n", post.ID, err)
	} else {
		post.Tags = tags
	}

	respondWithJSON(w, 200, map[string]any{
		"post":    post,
		"content": content,
	})
}

// GET /api/blog/tags
func handleListTagsPublic(w http.ResponseWriter, r *http.Request) {
	tags, err := db.ListBlogTags(context.Background())
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al obtener los tags"})
		log.Printf("err: %v\n", err)
		return
	}
	respondWithJSON(w, 200, map[string]any{"tags": tags})
}

// ── Admin: list/get ───────────────────────────────────────────────────────────

// GET /api/admin/blog/posts?page=1&limit=10&status=draft&author=...&search=...
func handleAdminListPosts(w http.ResponseWriter, r *http.Request) {
	limit, page := blogParsePagination(r)
	ctx := context.Background()

	filter := &db.BlogPostFilter{}
	if s := r.URL.Query().Get("status"); s != "" {
		st := db.BlogPostStatus(s)
		filter.Status = &st
	}
	if a := r.URL.Query().Get("author"); a != "" {
		filter.AuthorID = &a
	}
	if q := r.URL.Query().Get("search"); q != "" {
		filter.Search = &q
	}

	posts, err := db.ListAllBlogPosts(ctx, filter, limit, page)
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al obtener los posts"})
		log.Printf("err: %v\n", err)
		return
	}

	pagination, err := db.GetBlogPostPagination(ctx, filter, limit, page)
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al obtener la paginación"})
		log.Printf("err: %v\n", err)
		return
	}

	respondWithJSON(w, 200, map[string]any{
		"posts":      posts,
		"pagination": pagination,
	})
}

// GET /api/admin/blog/posts/{id}
func handleAdminGetPost(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ctx := context.Background()

	post, err := db.GetBlogPostByID(ctx, id)
	if err != nil {
		if isBlogNotFound(err) {
			respondWithError(w, 404, ErrorParams{ErrorMessage: "Post no encontrado"})
			return
		}
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al obtener el post"})
		log.Printf("err: %v\n", err)
		return
	}

	content, err := blogfs.Read(blogStorageDir(), post.ContentPath)
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al leer el contenido del post"})
		log.Printf("err reading blog content %s: %v\n", post.ContentPath, err)
		return
	}

	tags, err := db.GetBlogPostTags(ctx, post.ID)
	if err != nil {
		log.Printf("err getting tags for post %s: %v\n", post.ID, err)
	} else {
		post.Tags = tags
	}

	respondWithJSON(w, 200, map[string]any{
		"post":    post,
		"content": content,
	})
}

// ── Admin: create ─────────────────────────────────────────────────────────────

type createBlogPostRequest struct {
	Title      string   `json:"title"`
	Snippet    string   `json:"snippet"`
	Content    string   `json:"content"`
	CoverImage string   `json:"coverImage"`
	TagIDs     []string `json:"tagIds"`
}

// POST /api/admin/blog/posts
func handleAdminCreatePost(w http.ResponseWriter, r *http.Request) {
	limitJSONBody(w, r)
	var req createBlogPostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			respondWithError(w, 413, ErrorParams{ErrorMessage: "El cuerpo de la solicitud supera el tamaño máximo permitido (2MB)"})
			return
		}
		respondWithError(w, 400, ErrorParams{ErrorMessage: "El formulario contiene información errónea"})
		return
	}
	defer r.Body.Close()

	if strings.TrimSpace(req.Title) == "" {
		respondWithError(w, 422, ErrorParams{ErrorMessage: "El título es obligatorio"})
		return
	}
	if strings.TrimSpace(req.Content) == "" {
		respondWithError(w, 422, ErrorParams{ErrorMessage: "El contenido es obligatorio"})
		return
	}

	user, err := auth.ExtractAuthDataFromRequest(r)
	if err != nil {
		respondWithError(w, 401, ErrorParams{ErrorMessage: "No se pudo autenticar el usuario"})
		log.Printf("err extracting auth: %v\n", err)
		return
	}

	slug := blogSlugify(req.Title)
	if err := blogfs.ValidateSlug(slug); err != nil {
		respondWithError(w, 422, ErrorParams{ErrorMessage: "El título no genera un slug válido"})
		return
	}

	ctx := context.Background()

	slug, err = uniqueBlogSlug(ctx, slug)
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al generar el slug"})
		log.Printf("err: %v\n", err)
		return
	}

	contentPath, err := blogfs.BuildContentPath(time.Now(), slug)
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al construir la ruta del contenido"})
		log.Printf("err: %v\n", err)
		return
	}

	rt := calculateReadingTime(req.Content)

	post := db.NewBlogPost(req.Title, slug, user.Id, contentPath)
	post.Snippet = req.Snippet
	post.CoverImage = req.CoverImage
	post.ReadingTime = rt

	// FS first.
	if err := blogfs.Write(blogStorageDir(), contentPath, req.Content); err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al guardar el contenido"})
		log.Printf("err writing blog file: %v\n", err)
		return
	}

	if err := db.CreateBlogPost(ctx, post); err != nil {
		// Compensation: remove orphan file.
		if delErr := blogfs.Delete(blogStorageDir(), contentPath); delErr != nil {
			log.Printf("CRITICAL compensation failed — orphan blog file %s: %v\n", contentPath, delErr)
		}
		if isPgUniqueViolation(err) {
			respondWithError(w, 409, ErrorParams{ErrorMessage: "El slug del post ya existe"})
			return
		}
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al crear el post"})
		log.Printf("err: %v\n", err)
		return
	}

	// If SetBlogPostTags fails, roll back the whole post (DB + FS).
	if len(req.TagIDs) > 0 {
		if err := db.SetBlogPostTags(ctx, post.ID, req.TagIDs); err != nil {
			log.Printf("err setting tags, rolling back post %s: %v\n", post.ID, err)
			if _, delErr := db.DeleteBlogPost(ctx, post.ID); delErr != nil {
				log.Printf("CRITICAL rollback DB failed for post %s: %v\n", post.ID, delErr)
			}
			if delErr := blogfs.Delete(blogStorageDir(), contentPath); delErr != nil {
				log.Printf("CRITICAL rollback FS failed for %s: %v\n", contentPath, delErr)
			}
			if isPgFKViolation(err) {
				respondWithError(w, 422, ErrorParams{ErrorMessage: "Uno o más tags no existen"})
				return
			}
			respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al asignar tags al post"})
			return
		}
	}

	respondWithJSON(w, 201, map[string]any{
		"post":    post,
		"success": true,
	})
}

// ── Admin: update (slug is immutable after creation) ──────────────────────────

type updateBlogPostRequest struct {
	Title      string   `json:"title"`
	Snippet    string   `json:"snippet"`
	Content    string   `json:"content"`
	CoverImage string   `json:"coverImage"`
	TagIDs     []string `json:"tagIds"`
}

// PUT /api/admin/blog/posts/{id}
// Slug is not changeable — it is set once at creation. The title can be updated
// freely but does not affect the slug or content_path.
func handleAdminUpdatePost(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ctx := context.Background()

	existing, err := db.GetBlogPostByID(ctx, id)
	if err != nil {
		if isBlogNotFound(err) {
			respondWithError(w, 404, ErrorParams{ErrorMessage: "Post no encontrado"})
			return
		}
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al obtener el post"})
		log.Printf("err: %v\n", err)
		return
	}

	if existing.Status == db.BlogStatusArchived {
		respondWithError(w, 409, ErrorParams{ErrorMessage: "Los posts archivados no se pueden editar"})
		return
	}

	user, err := auth.ExtractAuthDataFromRequest(r)
	if err != nil {
		respondWithError(w, 401, ErrorParams{ErrorMessage: "No se pudo autenticar el usuario"})
		return
	}

	// Editors can only edit their own drafts. Admin can edit any non-archived post.
	if !user.HasAccess(auth.AccessLevelAdmin) {
		if existing.AuthorID != user.Id {
			respondWithError(w, 403, ErrorParams{ErrorMessage: "No tienes permiso para editar este post"})
			return
		}
		if existing.Status != db.BlogStatusDraft {
			respondWithError(w, 403, ErrorParams{ErrorMessage: "Los editores solo pueden modificar sus propios borradores"})
			return
		}
	}

	limitJSONBody(w, r)
	var req updateBlogPostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			respondWithError(w, 413, ErrorParams{ErrorMessage: "El cuerpo de la solicitud supera el tamaño máximo permitido (2MB)"})
			return
		}
		respondWithError(w, 400, ErrorParams{ErrorMessage: "El formulario contiene información errónea"})
		return
	}
	defer r.Body.Close()

	if strings.TrimSpace(req.Title) == "" {
		respondWithError(w, 422, ErrorParams{ErrorMessage: "El título es obligatorio"})
		return
	}
	if strings.TrimSpace(req.Content) == "" {
		respondWithError(w, 422, ErrorParams{ErrorMessage: "El contenido es obligatorio"})
		return
	}

	rt := calculateReadingTime(req.Content)

	// Stage the file write. The temp file is only renamed after DB confirms,
	// so a DB failure leaves the existing .md intact (F1 fix).
	commit, discard, err := blogfs.WriteStaged(blogStorageDir(), existing.ContentPath, req.Content)
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al preparar el contenido para guardar"})
		log.Printf("err staging blog file: %v\n", err)
		return
	}

	existing.Title = req.Title
	existing.Snippet = req.Snippet
	existing.CoverImage = req.CoverImage
	existing.ReadingTime = rt

	if err := db.UpdateBlogPost(ctx, existing); err != nil {
		discard()
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al actualizar el post"})
		log.Printf("err: %v\n", err)
		return
	}

	if err := commit(); err != nil {
		// DB is updated but the rename failed — content on disk is stale.
		log.Printf("CRITICAL blog update commit failed — DB updated but .md not renamed — post_id=%s contentPath=%s err=%v\n",
			existing.ID, existing.ContentPath, err)
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error crítico al guardar el contenido del post; contacte al administrador"})
		return
	}

	// B1: propagate tag errors — do not silently return 200.
	if err := db.SetBlogPostTags(ctx, existing.ID, req.TagIDs); err != nil {
		log.Printf("err setting tags for post %s: %v\n", existing.ID, err)
		if isPgFKViolation(err) {
			respondWithError(w, 422, ErrorParams{ErrorMessage: "Uno o más tags no existen"})
			return
		}
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al asignar los tags del post"})
		return
	}

	respondWithJSON(w, 200, map[string]any{
		"post":    existing,
		"success": true,
	})
}

// ── Admin: status change ──────────────────────────────────────────────────────

type updateStatusRequest struct {
	Status string `json:"status"`
}

// PATCH /api/admin/blog/posts/{id}/status
//
// Transitions:
//   - draft    → published  (editor: own drafts only; admin: any)
//   - published → draft     (admin only — unpublish)
//   - draft/published → archived (admin only, triggers slug/file rename)
//   - archived → *          (not allowed)
func handleAdminUpdatePostStatus(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ctx := context.Background()

	limitJSONBody(w, r)
	var req updateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			respondWithError(w, 413, ErrorParams{ErrorMessage: "El cuerpo de la solicitud supera el tamaño máximo permitido (2MB)"})
			return
		}
		respondWithError(w, 400, ErrorParams{ErrorMessage: "El formulario contiene información errónea"})
		return
	}
	defer r.Body.Close()

	newStatus := db.BlogPostStatus(req.Status)
	if newStatus != db.BlogStatusDraft && newStatus != db.BlogStatusPublished && newStatus != db.BlogStatusArchived {
		respondWithError(w, 422, ErrorParams{ErrorMessage: "Estado inválido"})
		return
	}

	existing, err := db.GetBlogPostByID(ctx, id)
	if err != nil {
		if isBlogNotFound(err) {
			respondWithError(w, 404, ErrorParams{ErrorMessage: "Post no encontrado"})
			return
		}
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al obtener el post"})
		log.Printf("err: %v\n", err)
		return
	}

	if existing.Status == db.BlogStatusArchived {
		respondWithError(w, 409, ErrorParams{ErrorMessage: "Los posts archivados no pueden cambiar de estado"})
		return
	}

	user, err := auth.ExtractAuthDataFromRequest(r)
	if err != nil {
		respondWithError(w, 401, ErrorParams{ErrorMessage: "No se pudo autenticar el usuario"})
		return
	}

	// Archive is admin-only and follows a special flow.
	if newStatus == db.BlogStatusArchived {
		if !user.HasAccess(auth.AccessLevelAdmin) {
			respondWithError(w, 403, ErrorParams{ErrorMessage: "Solo los administradores pueden archivar posts"})
			return
		}
		handleArchivePost(w, ctx, existing)
		return
	}

	// Editors: can only publish their own drafts. Cannot unpublish.
	if !user.HasAccess(auth.AccessLevelAdmin) {
		if existing.AuthorID != user.Id {
			respondWithError(w, 403, ErrorParams{ErrorMessage: "No tienes permiso para cambiar el estado de este post"})
			return
		}
		if existing.Status != db.BlogStatusDraft || newStatus != db.BlogStatusPublished {
			respondWithError(w, 403, ErrorParams{ErrorMessage: "Los editores solo pueden publicar sus propios borradores"})
			return
		}
	}

	if err := db.UpdateBlogPostStatus(ctx, id, newStatus); err != nil {
		if errors.Is(err, db.ErrBlogPostNotFound) {
			respondWithError(w, 404, ErrorParams{ErrorMessage: "Post no encontrado"})
			return
		}
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al actualizar el estado"})
		log.Printf("err: %v\n", err)
		return
	}

	respondWithJSON(w, 200, map[string]any{
		"id":      id,
		"status":  newStatus,
		"success": true,
	})
}

// handleArchivePost performs the full archive flow:
//  1. Generate newSlug = old-{unix}-{original_slug}
//  2. Generate newContentPath = {year}/{month}/{newSlug}.md
//  3. Verify no collisions in slug or content_path
//  4. Move file via blogfs.Move
//  5. Update DB via db.ArchiveBlogPost
//  6. If DB fails, attempt to revert the file move; log CRITICAL on failure
func handleArchivePost(w http.ResponseWriter, ctx context.Context, post *db.BlogPost) {
	ts := time.Now().Unix()
	newSlug := fmt.Sprintf("old-%d-%s", ts, post.Slug)

	if len(newSlug) > 512 {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "El slug archivado excede el largo máximo"})
		return
	}

	newContentPath, err := blogfs.BuildContentPath(post.CreatedAt, newSlug)
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al construir la ruta del archivo archivado"})
		log.Printf("err: %v\n", err)
		return
	}

	// Check slug collision.
	slugTaken, err := db.BlogPostSlugExists(ctx, newSlug)
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al verificar el slug"})
		log.Printf("err: %v\n", err)
		return
	}
	if slugTaken {
		respondWithError(w, 409, ErrorParams{ErrorMessage: "El slug archivado ya existe"})
		return
	}

	// Check content_path collision.
	cpTaken, err := db.BlogPostContentPathExists(ctx, newContentPath)
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al verificar la ruta del archivo"})
		log.Printf("err: %v\n", err)
		return
	}
	if cpTaken {
		respondWithError(w, 409, ErrorParams{ErrorMessage: "La ruta del archivo archivado ya existe"})
		return
	}

	// Move file first (blogfs.Move rejects overwrite).
	oldContentPath := post.ContentPath
	if err := blogfs.Move(blogStorageDir(), oldContentPath, newContentPath); err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al mover el archivo del post"})
		log.Printf("err moving blog file %s → %s: %v\n", oldContentPath, newContentPath, err)
		return
	}

	// Update DB.
	if err := db.ArchiveBlogPost(ctx, post.ID, newSlug, newContentPath); err != nil {
		// Attempt to revert the file move.
		if revertErr := blogfs.Move(blogStorageDir(), newContentPath, oldContentPath); revertErr != nil {
			log.Printf("CRITICAL archive revert failed — post_id=%s oldPath=%s newPath=%s oldSlug=%s newSlug=%s moveRevertErr=%v dbErr=%v\n",
				post.ID, oldContentPath, newContentPath, post.Slug, newSlug, revertErr, err)
		}
		if isPgUniqueViolation(err) {
			respondWithError(w, 409, ErrorParams{ErrorMessage: "Conflicto al archivar: slug o ruta ya existen"})
			return
		}
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al archivar el post"})
		log.Printf("err: %v\n", err)
		return
	}

	respondWithJSON(w, 200, map[string]any{
		"id":      post.ID,
		"status":  db.BlogStatusArchived,
		"slug":    newSlug,
		"success": true,
	})
}

// ── Admin: delete (admin only) ────────────────────────────────────────────────

// DELETE /api/admin/blog/posts/{id}
func handleAdminDeletePost(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ctx := context.Background()

	contentPath, err := db.DeleteBlogPost(ctx, id)
	if err != nil {
		if errors.Is(err, db.ErrBlogPostNotFound) {
			respondWithError(w, 404, ErrorParams{ErrorMessage: "Post no encontrado"})
			return
		}
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al eliminar el post"})
		log.Printf("err: %v\n", err)
		return
	}

	if err := blogfs.Delete(blogStorageDir(), contentPath); err != nil {
		log.Printf("warn — could not delete blog file %s after DB delete: %v\n", contentPath, err)
	}

	respondWithJSON(w, 200, map[string]any{
		"id":      id,
		"success": true,
	})
}

// ── Admin: tags ───────────────────────────────────────────────────────────────

// GET /api/admin/blog/tags
func handleAdminListTags(w http.ResponseWriter, r *http.Request) {
	tags, err := db.ListBlogTags(context.Background())
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al obtener los tags"})
		log.Printf("err: %v\n", err)
		return
	}
	respondWithJSON(w, 200, map[string]any{"tags": tags})
}

type createBlogTagRequest struct {
	Name string `json:"name"`
}

// POST /api/admin/blog/tags
func handleAdminCreateTag(w http.ResponseWriter, r *http.Request) {
	limitJSONBody(w, r)
	var req createBlogTagRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			respondWithError(w, 413, ErrorParams{ErrorMessage: "El cuerpo de la solicitud supera el tamaño máximo permitido (2MB)"})
			return
		}
		respondWithError(w, 400, ErrorParams{ErrorMessage: "El formulario contiene información errónea"})
		return
	}
	defer r.Body.Close()

	if strings.TrimSpace(req.Name) == "" {
		respondWithError(w, 422, ErrorParams{ErrorMessage: "El nombre del tag es obligatorio"})
		return
	}

	slug := blogSlugify(req.Name)
	if err := blogfs.ValidateSlug(slug); err != nil {
		respondWithError(w, 422, ErrorParams{ErrorMessage: "El nombre del tag no genera un slug válido"})
		return
	}

	tag := db.NewBlogTag(req.Name, slug)
	if err := db.CreateBlogTag(context.Background(), tag); err != nil {
		if isPgUniqueViolation(err) {
			respondWithError(w, 409, ErrorParams{ErrorMessage: "Ya existe un tag con ese nombre"})
			return
		}
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al crear el tag"})
		log.Printf("err: %v\n", err)
		return
	}

	respondWithJSON(w, 201, map[string]any{
		"tag":     tag,
		"success": true,
	})
}

// DELETE /api/admin/blog/tags/{id} — admin only
func handleAdminDeleteTag(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := db.DeleteBlogTag(context.Background(), id); err != nil {
		if errors.Is(err, db.ErrBlogTagNotFound) {
			respondWithError(w, 404, ErrorParams{ErrorMessage: "Tag no encontrado"})
			return
		}
		if isPgFKViolation(err) {
			respondWithError(w, 409, ErrorParams{ErrorMessage: "El tag está en uso y no puede ser eliminado"})
			return
		}
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al eliminar el tag"})
		log.Printf("err: %v\n", err)
		return
	}
	respondWithJSON(w, 200, map[string]any{"id": id, "success": true})
}

// ── Admin: image upload ───────────────────────────────────────────────────────

var blogAllowedMIME = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

const blogUploadMaxSize = uploads.MaxImageUploadSize // 8MB

// POST /api/admin/blog/uploads
//
// Accepts a single image (field name "image"). Saves it under
// web/static/uploads/blog/ with a UUID-based filename and returns
// the public URL and ready-to-paste Markdown.
func handleAdminBlogUpload(w http.ResponseWriter, r *http.Request) {
	// Enforce size at HTTP level (file + multipart overhead).
	r.Body = http.MaxBytesReader(w, r.Body, blogUploadMaxSize+1<<20)

	if err := r.ParseMultipartForm(blogUploadMaxSize); err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			respondWithError(w, 413, ErrorParams{ErrorMessage: "La imagen excede el tamaño máximo permitido (8MB)"})
			return
		}
		respondWithError(w, 400, ErrorParams{ErrorMessage: "Error al procesar el archivo"})
		return
	}

	file, _, err := r.FormFile("image")
	if err != nil {
		respondWithError(w, 400, ErrorParams{ErrorMessage: "No se encontró ninguna imagen en la solicitud"})
		return
	}
	defer file.Close()

	// Detect MIME from first 512 bytes — do not trust the filename or Content-Type header.
	buf := make([]byte, 512)
	n, err := file.Read(buf)
	if err != nil && !errors.Is(err, io.EOF) {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al leer el archivo"})
		return
	}
	mimeType := http.DetectContentType(buf[:n])

	ext, allowed := blogAllowedMIME[mimeType]
	if !allowed {
		respondWithError(w, 415, ErrorParams{ErrorMessage: "Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG o WebP"})
		return
	}

	// Generate a safe, collision-free filename.
	id, err := uuid.NewV7()
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al generar el nombre del archivo"})
		log.Printf("err generating uuid for blog upload: %v\n", err)
		return
	}
	filename := id.String() + ext

	// Ensure the directory exists.
	dir := filepath.Join("web", "static", "uploads", "blog")
	if err := os.MkdirAll(dir, 0755); err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al preparar el directorio de imágenes"})
		log.Printf("err mkdir blog uploads: %v\n", err)
		return
	}

	// Seek back to start so we copy the full file, not just the bytes after the sniff.
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al procesar el archivo"})
		return
	}

	writePath := filepath.Join(dir, filename)
	out, err := os.Create(writePath)
	if err != nil {
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al guardar la imagen"})
		log.Printf("err creating blog image file: %v\n", err)
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		_ = os.Remove(writePath)
		respondWithError(w, 500, ErrorParams{ErrorMessage: "Error al guardar la imagen"})
		log.Printf("err writing blog image: %v\n", err)
		return
	}

	url := "/static/uploads/blog/" + filename
	respondWithJSON(w, 200, map[string]any{
		"url":      url,
		"markdown": fmt.Sprintf("![imagen](%s)", url),
	})
}
