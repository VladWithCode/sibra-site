package db

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"
)

type Request struct {
	Id            string         `json:"id" db:"id"`
	Type          string         `json:"type" db:"type"`
	Phone         string         `json:"phone" db:"phone"`
	Name          string         `json:"name" db:"name"`
	Date          time.Time      `json:"date" db:"date"`
	ScheduledDate sql.NullTime   `json:"scheduledDate" db:"scheduled_date"`
	Status        string         `json:"status" db:"status"`
	Agent         string         `json:"agent" db:"status"`
	Property      sql.NullString `json:"property" db:"property"`
}

type RequestFilter struct {
	Type          *string
	Date          *time.Time
	ScheduledDate *time.Time
	Status        *string
	Agent         *string
	Property      *string
}

const (
	RequestTypeInfo  string = "informacion"
	RequestTypeQuote string = "cita"
)

const (
	RequestStatusPending   string = "pendiente"
	RequestStatusDone      string = "atendida"
	RequestStatusScheduled string = "agendada"
	RequestStatusRe        string = "volver a atender"
)

func CreateRequest(req *Request) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	_, err = conn.Exec(
		ctx,
		`
		INSERT INTO
			requests (id, type, phone, name, date, status, agent, scheduled_date, property) 
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)	
		`,
		req.Id,
		req.Type,
		req.Phone,
		req.Name,
		req.Date,
		req.Status,
		req.Agent,
		req.ScheduledDate,
		req.Property,
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

	var queryParams []interface{}
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

	if filter.Date != nil {
		queryConditions = append(queryConditions, `r.date = $4`)
		queryParams = append(queryParams, *filter.Date)
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

	var queryParams []interface{}
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

	if filter.Date != nil {
		queryConditions = append(queryConditions, `r.date = $4`)
		queryParams = append(queryParams, *filter.Date)
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
			r.Date,
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
		&req.Date,
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
