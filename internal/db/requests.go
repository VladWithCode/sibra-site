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

var (
	ErrRequestFilterInvalid     = errors.New("invalid request filter")
	ErrRequestFilterArgsInvalid = errors.New("invalid request filter args")
)

type RequestType string

const (
	RequestTypeInfo  RequestType = "informacion"
	RequestTypeQuote RequestType = "cita"
	RequestTypeSell  RequestType = "venta"
	RequestTypePreq  RequestType = "precalificacion"
	RequestTypeProj  RequestType = "proyecto"
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
	Project       string        `json:"project,omitempty" db:"project"`

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
	Project       *string
	CreatedAt     *time.Time
}

func buildRequestFilterConditions(filter *RequestFilter, args *pgx.NamedArgs) ([]string, error) {
	var queryConditions []string

	if filter == nil {
		return queryConditions, ErrRequestFilterInvalid
	}

	if args == nil {
		return nil, ErrRequestFilterArgsInvalid
	}
	if *args == nil {
		*args = pgx.NamedArgs{}
	}
	locArgs := *args

	if filter.Type != nil {
		queryConditions = append(queryConditions, "r.type = @filterType")
		locArgs["filterType"] = *filter.Type
	}

	if filter.Status != nil {
		queryConditions = append(queryConditions, "r.status = @filterStatus")
		locArgs["filterStatus"] = *filter.Status
	}

	if filter.Property != nil {
		queryConditions = append(queryConditions, "r.property = @filterProperty")
		locArgs["filterProperty"] = *filter.Property
	}

	if filter.Project != nil {
		queryConditions = append(queryConditions, "r.project = @filterProject")
		locArgs["filterProject"] = *filter.Project
	}

	if filter.CreatedAt != nil {
		queryConditions = append(queryConditions, "r.date = @filterCreatedAt")
		locArgs["filterCreatedAt"] = *filter.CreatedAt
	}

	if filter.Agent != nil {
		queryConditions = append(queryConditions, "r.agent = @filterAgent")
		locArgs["filterAgent"] = *filter.Agent
	}

	if filter.ScheduledDate != nil {
		queryConditions = append(queryConditions, "r.scheduled_date = @filterScheduledDate")
		locArgs["filterScheduledDate"] = *filter.ScheduledDate
	}

	return queryConditions, nil
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
		"project": sql.NullString{
			String: req.Project,
			Valid:  req.Project != "",
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

	args := pgx.NamedArgs{}
	queryConditions, err := buildRequestFilterConditions(filter, &args)
	if err != nil {
		return
	}

	baseQuery := `
		SELECT COUNT(*)
		FROM requests r
	`

	if len(queryConditions) > 0 {
		baseQuery = baseQuery + " WHERE " + strings.Join(queryConditions, " AND ")
	}

	var reqCount int
	err = conn.QueryRow(ctx, baseQuery, args).Scan(&reqCount)
	if err != nil {
		return
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
		paginateOpts += fmt.Sprintf(" OFFSET %v", limit*(page-1))
	}

	args := pgx.NamedArgs{}
	queryConditions, err := buildRequestFilterConditions(filter, &args)
	if err != nil {
		return
	}

	baseQuery := `
		SELECT r.id, r.type, r.phone, r.name, r.date, r.status, r.scheduled_date,
            r.project, r.property,
			COALESCE(u.name || ' ' || u.lastname, '') AS agent
		FROM requests r
		LEFT JOIN users u ON r.agent = u.id
	`

	if len(queryConditions) > 0 {
		baseQuery = baseQuery + " WHERE " + strings.Join(queryConditions, " AND ")
	}

	query := baseQuery + paginateOpts

	rows, err := conn.Query(ctx, query, args)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var r Request
		err = rows.Scan(
			&r.Id,
			&r.Type,
			&r.Phone,
			&r.Name,
			&r.CreatedAt,
			&r.Status,
			&r.ScheduledDate,
			&r.Project,
			&r.Property,
			&r.Agent,
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
            r.project, r.property,
			COALESCE(u.name || ' ' || u.lastname, '') AS agent
		FROM requests r
		LEFT JOIN users u ON r.agent = u.id
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
		&req.Project,
		&req.Property,
		&req.Agent,
	)

	if err != nil {
		return nil, err
	}

	return &req, nil
}

type InfoRequest struct {
	Id       string        `json:"id" db:"id"`
	Name     string        `json:"name" db:"name"`
	Phone    string        `json:"phone" db:"phone"`
	Property string        `json:"property" db:"property"`
	Status   RequestStatus `json:"status" db:"status"`

	CreatedAt time.Time `json:"date" db:"date"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

func (req *InfoRequest) ToRequest() *Request {
	return &Request{
		Id:        req.Id,
		Type:      RequestTypeInfo,
		Phone:     req.Phone,
		Name:      req.Name,
		Status:    req.Status,
		Property:  req.Property,
		CreatedAt: req.CreatedAt,
		UpdatedAt: req.UpdatedAt,
	}
}

func NewInfoRequest(name, phone, property string) *InfoRequest {
	return &InfoRequest{
		Id:        uuid.Must(uuid.NewV7()).String(),
		Name:      name,
		Phone:     phone,
		Property:  property,
		Status:    RequestStatusPending,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}
