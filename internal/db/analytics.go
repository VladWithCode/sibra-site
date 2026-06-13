package db

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PageView struct {
	Id        string    `json:"id" db:"id"`
	Path      string    `json:"path" db:"path"`
	Url       string    `json:"url" db:"url"`
	Title     string    `json:"title" db:"title"`
	Referrer  string    `json:"referrer" db:"referrer"`
	Source    string    `json:"source" db:"source"`
	Site      string    `json:"site" db:"site"`
	UserAgent string    `json:"userAgent" db:"user_agent"`
	IpHash    string    `json:"ipHash" db:"ip_hash"`
	SessionID string    `json:"sessionId" db:"session_id"`
	VisitorID string    `json:"visitorId" db:"visitor_id"`
	Origin    string    `json:"origin" db:"origin"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

// VisitInput carries a single visit to be persisted. Client-supplied fields come
// from the request payload; UserAgent/IpHash/Origin are derived server-side.
type VisitInput struct {
	Path      string
	Url       string
	Title     string
	Referrer  string
	Source    string
	Site      string
	SessionID string
	VisitorID string
	UserAgent string
	IpHash    string
	Origin    string
}

// RecordVisit persists a visit. Used by both the internal SPA tracker and the
// generalized external ingestion endpoint.
func RecordVisit(ctx context.Context, in VisitInput) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	id := uuid.Must(uuid.NewV7()).String()
	_, err = conn.Exec(ctx, `
		INSERT INTO page_views (
			id, path, url, title, referrer, source, site,
			user_agent, ip_hash, session_id, visitor_id, origin
		)
		VALUES (
			@id, @path, @url, @title, @referrer, @source, @site,
			@userAgent, @ipHash, @sessionId, @visitorId, @origin
		)
	`, pgx.NamedArgs{
		"id":        id,
		"path":      in.Path,
		"url":       in.Url,
		"title":     in.Title,
		"referrer":  in.Referrer,
		"source":    in.Source,
		"site":      in.Site,
		"userAgent": in.UserAgent,
		"ipHash":    in.IpHash,
		"sessionId": in.SessionID,
		"visitorId": in.VisitorID,
		"origin":    in.Origin,
	})
	return err
}

// AnalyticsFilter is the shared filter for read endpoints (stats + visits list).
type AnalyticsFilter struct {
	From   time.Time
	To     time.Time
	URL    string   // exact match against path or url
	URLs   []string // match any of (path or url)
	Q      string   // partial (ILIKE) match against path/url/title
	Source string
	Site   string
}

// where builds the SQL WHERE body (without the "WHERE" keyword) and its args.
func (f AnalyticsFilter) where() (string, pgx.NamedArgs) {
	conds := []string{"created_at >= @from", "created_at < @to"}
	args := pgx.NamedArgs{"from": f.From, "to": f.To}

	if f.URL != "" {
		conds = append(conds, "(path = @url OR url = @url)")
		args["url"] = f.URL
	}
	if len(f.URLs) > 0 {
		conds = append(conds, "(path = ANY(@urls) OR url = ANY(@urls))")
		args["urls"] = f.URLs
	}
	if f.Q != "" {
		conds = append(conds, "(path ILIKE @q OR url ILIKE @q OR title ILIKE @q)")
		args["q"] = "%" + f.Q + "%"
	}
	if f.Source != "" {
		conds = append(conds, "source = @source")
		args["source"] = f.Source
	}
	if f.Site != "" {
		conds = append(conds, "site = @site")
		args["site"] = f.Site
	}

	return strings.Join(conds, " AND "), args
}

// effectivePage prefers the full url, falling back to the path, so external and
// internal visits aggregate under a meaningful key.
const effectivePage = "COALESCE(NULLIF(url, ''), path)"

type AnalyticsStats struct {
	TotalViews     int             `json:"totalViews"`
	UniqueSessions int             `json:"uniqueSessions"`
	ViewsPerDay    []DayViewCount  `json:"viewsPerDay"`
	TopPages       []PageViewCount `json:"topPages"`
	TopReferrers   []LabelCount    `json:"topReferrers"`
	BySource       []LabelCount    `json:"bySource"`
	BySite         []LabelCount    `json:"bySite"`
}

type DayViewCount struct {
	Date  string `json:"date"`
	Views int    `json:"views"`
}

type PageViewCount struct {
	Path  string `json:"path"`
	Views int    `json:"views"`
}

type LabelCount struct {
	Label string `json:"label"`
	Views int    `json:"views"`
}

type HourViewCount struct {
	Hour  int `json:"hour"`
	Views int `json:"views"`
}

func GetAnalyticsStats(ctx context.Context, filter AnalyticsFilter) (*AnalyticsStats, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	stats := &AnalyticsStats{}
	where, args := filter.where()

	err = conn.QueryRow(ctx, fmt.Sprintf(`
		SELECT COUNT(*) AS total_views, COUNT(DISTINCT session_id) AS unique_sessions
		FROM page_views
		WHERE %s
	`, where), args).Scan(&stats.TotalViews, &stats.UniqueSessions)
	if err != nil {
		return nil, err
	}

	rows, err := conn.Query(ctx, fmt.Sprintf(`
		SELECT created_at::date::text AS date, COUNT(*) AS views
		FROM page_views
		WHERE %s
		GROUP BY created_at::date
		ORDER BY created_at::date
	`, where), args)
	if err != nil {
		return nil, err
	}
	stats.ViewsPerDay, err = pgx.CollectRows(rows, func(row pgx.CollectableRow) (DayViewCount, error) {
		var d DayViewCount
		err := row.Scan(&d.Date, &d.Views)
		return d, err
	})
	if err != nil {
		return nil, err
	}

	rows, err = conn.Query(ctx, fmt.Sprintf(`
		SELECT %s AS page, COUNT(*) AS views
		FROM page_views
		WHERE %s
		GROUP BY page
		ORDER BY views DESC
		LIMIT 20
	`, effectivePage, where), args)
	if err != nil {
		return nil, err
	}
	stats.TopPages, err = pgx.CollectRows(rows, func(row pgx.CollectableRow) (PageViewCount, error) {
		var p PageViewCount
		err := row.Scan(&p.Path, &p.Views)
		return p, err
	})
	if err != nil {
		return nil, err
	}

	stats.TopReferrers, err = labelCounts(ctx, conn, where, args, "referrer")
	if err != nil {
		return nil, err
	}
	stats.BySource, err = labelCounts(ctx, conn, where, args, "source")
	if err != nil {
		return nil, err
	}
	stats.BySite, err = labelCounts(ctx, conn, where, args, "site")
	if err != nil {
		return nil, err
	}

	return stats, nil
}

// labelCounts groups by a single non-empty text column. column is a fixed
// identifier (never user input), so interpolation here is safe.
func labelCounts(ctx context.Context, conn *pgxpool.Conn, where string, args pgx.NamedArgs, column string) ([]LabelCount, error) {
	rows, err := conn.Query(ctx, fmt.Sprintf(`
		SELECT %[1]s AS label, COUNT(*) AS views
		FROM page_views
		WHERE %[2]s AND %[1]s <> ''
		GROUP BY %[1]s
		ORDER BY views DESC
		LIMIT 10
	`, column, where), args)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (LabelCount, error) {
		var l LabelCount
		err := row.Scan(&l.Label, &l.Views)
		return l, err
	})
}

// ListVisits returns the most recent visits matching the filter, paginated.
func ListVisits(ctx context.Context, filter AnalyticsFilter, limit, offset int) ([]PageView, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	where, args := filter.where()
	args["limit"] = limit
	args["offset"] = offset

	rows, err := conn.Query(ctx, fmt.Sprintf(`
		SELECT id, path, url, title, referrer, source, site,
			user_agent, ip_hash, session_id, visitor_id, origin, created_at
		FROM page_views
		WHERE %s
		ORDER BY created_at DESC
		LIMIT @limit OFFSET @offset
	`, where), args)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, pgx.RowToStructByName[PageView])
}

func GetAnalyticsHourly(ctx context.Context, date time.Time) ([]HourViewCount, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	nextDay := date.Add(24 * time.Hour)
	rows, err := conn.Query(ctx, `
		SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*) AS views
		FROM page_views
		WHERE created_at >= @from AND created_at < @to
		GROUP BY hour
		ORDER BY hour
	`, pgx.NamedArgs{"from": date, "to": nextDay})
	if err != nil {
		return nil, err
	}

	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (HourViewCount, error) {
		var h HourViewCount
		err := row.Scan(&h.Hour, &h.Views)
		return h, err
	})
}
