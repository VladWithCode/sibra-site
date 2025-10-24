package db

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type RequestType string

const (
	RequestTypeInfo  RequestType = "informacion"
	RequestTypeQuote RequestType = "cita"
)

type RequestStatus string

const (
	RequestStatusPending   RequestStatus = "pendiente"
	RequestStatusConfirmed RequestStatus = "confirmada"
	RequestStatusDone      RequestStatus = "atendida"
	RequestStatusRepeat    RequestStatus = "volver a atender"
)

type Request struct {
	Id            string        `json:"id" db:"id"`
	Type          RequestType   `json:"type" db:"type"`
	Phone         string        `json:"phone" db:"phone"`
	Name          string        `json:"name" db:"name"`
	ScheduledDate time.Time     `json:"scheduledDate" db:"scheduled_date"`
	Status        RequestStatus `json:"status" db:"status"`
	Agent         string        `json:"agent" db:"agent"`
	Property      string        `json:"property,omitempty" db:"property"`
	WspSent       bool          `json:"wspSent" db:"wsp_sent"`

	CreatedAt time.Time `json:"date" db:"date"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

func NewRequest(reqType RequestType) *Request {
	return &Request{
		Id:        uuid.Must(uuid.NewV7()).String(),
		Type:      reqType,
		Status:    RequestStatusPending,
		CreatedAt: time.Now(),
	}
}

type QuoteSchedule string

const (
	QuoteScheduleWeekend QuoteSchedule = "fin de semana"
	QuoteScheduleMidWeek QuoteSchedule = "entre semana"
	QuoteScheduleOther   QuoteSchedule = "otro"
)

type ConqsRequest struct {
	Request

	Schedule QuoteSchedule `json:"quoteSchedule" db:"quote_schedule"`
}

type RequestFilter struct {
	Type          *RequestType
	ScheduledDate *time.Time
	Status        *RequestStatus
	Agent         *string
	Property      *string
	CreatedAt     *time.Time
}

func CreateRequest(ctx context.Context, req *Request) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	req.Id = uuid.Must(uuid.NewV7()).String()

	args := pgx.NamedArgs{
		"id":     req.Id,
		"type":   req.Type,
		"phone":  req.Phone,
		"name":   req.Name,
		"status": req.Status,
		"scheduled_date": sql.NullTime{
			Time:  req.ScheduledDate,
			Valid: !req.ScheduledDate.IsZero(),
		},
		"agent": sql.NullString{
			String: req.Agent,
			Valid:  req.Agent != "",
		},
		"property": sql.NullString{
			String: req.Property,
			Valid:  req.Property != "",
		},
	}
	_, err = conn.Exec(
		ctx,
		`INSERT INTO
            requests (id, type, phone, name, status, agent, scheduled_date, property)
        VALUES (@id, @type, @phone, @name, @status, @agent, @scheduled_date, @property)`,
		args,
	)

	if err != nil {
		return err
	}

	return nil
}

func GetRequestsPagination(filter *RequestFilter, limit, page int) (paginationData *Pagination, err error) {
	conn, err := GetPool()
	if err != nil {
		return
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	var queryParams []any
	var queryConditions []string

	if filter.Type != nil {
		queryConditions = append(queryConditions, `r.type = $1`)
		queryParams = append(queryParams, *filter.Type)
	}

	if filter.Status != nil {
		queryConditions = append(queryConditions, `r.status = $2`)
		queryParams = append(queryParams, *filter.Status)
	}

	if filter.Property != nil {
		queryConditions = append(queryConditions, `r.property = $3`)
		queryParams = append(queryParams, *filter.Property)
	}

	if filter.CreatedAt != nil {
		queryConditions = append(queryConditions, `r.date = $4`)
		queryParams = append(queryParams, *filter.CreatedAt)
	}

	if filter.Agent != nil {
		queryConditions = append(queryConditions, `r.agent = $5`)
		queryParams = append(queryParams, *filter.Agent)
	}

	if filter.ScheduledDate != nil {
		queryConditions = append(queryConditions, `r.scheduled_date = $6`)
		queryParams = append(queryParams, *filter.ScheduledDate)
	}

	baseQuery := `
		SELECT r.id, r.type, r.phone, r.name, r.date, r.status, r.scheduled_date
			u.name || ' ' || u.lastname AS agent,
			p.address || ', ' || p.nb_hood || ' ' || p.zip_code AS property
		FROM requests r
		LEFT JOIN users u ON r.agent = u.id
		LEFT JOIN properties p ON r.property = p.id
		WHERE 1 = 1
	`

	if len(queryParams) > 0 {
		baseQuery = baseQuery + " AND " + strings.Join(queryConditions, " AND ")
	}

	rows, err := conn.Query(
		ctx,
		baseQuery,
		queryParams...,
	)
	if err != nil {
		return
	}
	defer rows.Close()

	var reqCount int
	for rows.Next() {
		err = rows.Scan(&reqCount)

		if err != nil {
			return
		}
	}

	paginationData = NewPagination(reqCount, limit, page)

	return
}

func FindRequests(filter *RequestFilter, limit, page int) (requests []*Request, err error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	requests = []*Request{}
	var paginateOpts string

	if limit > 0 {
		paginateOpts = fmt.Sprintf(" LIMIT %v", limit)
	}
	if page > 0 {
		paginateOpts = fmt.Sprintf(" OFFSET %v", limit*(page-1))
	}

	var queryParams []any
	var queryConditions []string

	if filter.Type != nil {
		queryConditions = append(queryConditions, `r.type = $1`)
		queryParams = append(queryParams, *filter.Type)
	}

	if filter.Status != nil {
		queryConditions = append(queryConditions, `r.status = $2`)
		queryParams = append(queryParams, *filter.Status)
	}

	if filter.Property != nil {
		queryConditions = append(queryConditions, `r.property = $3`)
		queryParams = append(queryParams, *filter.Property)
	}

	if filter.CreatedAt != nil {
		queryConditions = append(queryConditions, `r.date = $4`)
		queryParams = append(queryParams, *filter.CreatedAt)
	}

	if filter.Agent != nil {
		queryConditions = append(queryConditions, `r.agent = $5`)
		queryParams = append(queryParams, *filter.Agent)
	}

	if filter.ScheduledDate != nil {
		queryConditions = append(queryConditions, `r.scheduled_date = $6`)
		queryParams = append(queryParams, *filter.ScheduledDate)
	}

	baseQuery := `
		SELECT r.id, r.type, r.phone, r.name, r.date, r.status, r.scheduled_date
			u.name || ' ' || u.lastname AS agent,
			p.address || ', ' || p.nb_hood || ' ' || p.zip_code AS property
		FROM requests r
		LEFT JOIN users u ON r.agent = u.id
		LEFT JOIN properties p ON r.property = p.id
		WHERE 1 = 1
	`
	var query string
	if len(queryParams) > 0 {
		query = baseQuery + " AND " + strings.Join(queryConditions, " AND ") + paginateOpts
	} else {
		query = baseQuery + paginateOpts
	}

	rows, err := conn.Query(
		ctx,
		query,
		queryParams...,
	)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var r Request
		err = rows.Scan(
			r.Id,
			r.Type,
			r.Phone,
			r.Name,
			r.CreatedAt,
			r.Status,
			r.ScheduledDate,
			r.Agent,
			r.Property,
		)

		if err != nil {
			return
		}

		requests = append(requests, &r)
	}

	return
}

func FindRequestById(id string) (*Request, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	var req Request
	row := conn.QueryRow(
		ctx,
		`SELECT r.id, r.phone, r.name, r.date, r.scheduled_date, r.status, r.type,
			u.name || ' ' || u.lastname AS agent,
			p.address || ', ' || p.nb_hood || ' ' || p.zip_code AS property
		FROM requests r
		LEFT JOIN users u ON r.agent = u.id
		LEFT JOIN properties p ON r.property = p.id
		WHERE r.id = $1`,
		id,
	)

	err = row.Scan(
		&req.Id,
		&req.Phone,
		&req.Name,
		&req.CreatedAt,
		&req.ScheduledDate,
		&req.Status,
		&req.Type,
		&req.Agent,
		&req.Property,
	)

	if err != nil {
		return nil, err
	}

	return &req, nil
}

func UpdateRequest(ctx context.Context, req *Request) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	args := pgx.NamedArgs{
		"id":             req.Id,
		"type":           req.Type,
		"phone":          req.Phone,
		"name":           req.Name,
		"scheduled_date": req.ScheduledDate,
		"status":         req.Status,
		"agent":          req.Agent,
		"property":       req.Property,
		"wsp_sent":       req.WspSent,
	}

	_, err = conn.Exec(
		ctx,
		`UPDATE requests SET
            type = $1,
            phone = $2,
            name = $3,
            scheduled_date = $4,
            status = $5,
            agent = $6,
            property = $7,
            wsp_sent = $8
        WHERE id = $9`,
		args,
	)

	if err != nil {
		return err
	}

	return nil
}
