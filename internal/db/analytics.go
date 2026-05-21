package db

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type PageView struct {
	Id        string    `json:"id" db:"id"`
	Path      string    `json:"path" db:"path"`
	Referrer  string    `json:"referrer" db:"referrer"`
	UserAgent string    `json:"userAgent" db:"user_agent"`
	IpHash    string    `json:"ipHash" db:"ip_hash"`
	SessionID string    `json:"sessionId" db:"session_id"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

func RecordPageView(ctx context.Context, path, referrer, userAgent, ipHash, sessionID string) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	id := uuid.Must(uuid.NewV7()).String()
	_, err = conn.Exec(ctx, `
		INSERT INTO page_views (id, path, referrer, user_agent, ip_hash, session_id)
		VALUES (@id, @path, @referrer, @userAgent, @ipHash, @sessionId)
	`, pgx.NamedArgs{
		"id":        id,
		"path":      path,
		"referrer":  referrer,
		"userAgent": userAgent,
		"ipHash":    ipHash,
		"sessionId": sessionID,
	})
	return err
}

type AnalyticsStats struct {
	TotalViews     int              `json:"totalViews"`
	UniqueSessions int              `json:"uniqueSessions"`
	ViewsPerDay    []DayViewCount   `json:"viewsPerDay"`
	TopPages       []PageViewCount  `json:"topPages"`
}

type DayViewCount struct {
	Date  string `json:"date"`
	Views int    `json:"views"`
}

type PageViewCount struct {
	Path  string `json:"path"`
	Views int    `json:"views"`
}

type HourViewCount struct {
	Hour  int `json:"hour"`
	Views int `json:"views"`
}

func GetAnalyticsStats(ctx context.Context, from, to time.Time) (*AnalyticsStats, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	stats := &AnalyticsStats{}

	args := pgx.NamedArgs{"from": from, "to": to}

	err = conn.QueryRow(ctx, `
		SELECT
			COUNT(*) AS total_views,
			COUNT(DISTINCT session_id) AS unique_sessions
		FROM page_views
		WHERE created_at >= @from AND created_at < @to
	`, args).Scan(&stats.TotalViews, &stats.UniqueSessions)
	if err != nil {
		return nil, err
	}

	rows, err := conn.Query(ctx, `
		SELECT created_at::date::text AS date, COUNT(*) AS views
		FROM page_views
		WHERE created_at >= @from AND created_at < @to
		GROUP BY created_at::date
		ORDER BY created_at::date
	`, args)
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

	rows, err = conn.Query(ctx, `
		SELECT path, COUNT(*) AS views
		FROM page_views
		WHERE created_at >= @from AND created_at < @to
		GROUP BY path
		ORDER BY views DESC
		LIMIT 10
	`, args)
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

	return stats, nil
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
