package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/url"
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

type RequestDTO struct {
	Id        string `json:"id"`
	Type      string `json:"type"`
	Name      string `json:"name"`
	Phone     string `json:"phone"`
	Scheduled string `json:"scheduledDate"`
	Status    string `json:"status"`
	Agent     string `json:"agent"`
	Property  string `json:"property"`
	Project   string `json:"project"`
}

func (dto *RequestDTO) ToRequest() *Request {
	loc := time.FixedZone("GTM-6", -6*60*60)
	schDate, _ := time.ParseInLocation("2006-01-02T15:04", dto.Scheduled, loc)

	return &Request{
		Id:            dto.Id,
		Type:          RequestType(dto.Type),
		Name:          dto.Name,
		Phone:         dto.Phone,
		ScheduledDate: schDate,
		Status:        RequestStatus(dto.Status),
		Agent:         dto.Agent,
		Property:      dto.Property,
		Project:       dto.Project,
	}
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

	// Selling-page attribution (not persisted; surfaced in the WhatsApp notice).
	PageSlug string `json:"pageSlug" db:"-"`
	PageName string `json:"pageName" db:"-"`
}

type RequestFilter struct {
	Type          *RequestType
	Name          *string
	Phone         *string
	ScheduledDate *time.Time
	Status        *RequestStatus
	CreatedAt     *time.Time
}

func NewRequestFilterFromQuery(query *url.Values) *RequestFilter {
	filter := &RequestFilter{}
	if query == nil {
		return filter
	}
	if name := query.Get("name"); name != "" {
		filter.Name = &name
	}
	if phone := query.Get("phone"); phone != "" {
		filter.Phone = &phone
	}
	if reqType := query.Get("type"); reqType != "" {
		t := RequestType(reqType)
		filter.Type = &t
	}
	if status := query.Get("status"); status != "" {
		s := RequestStatus(status)
		filter.Status = &s
	}
	if scheduledDate := query.Get("scheduledDate"); scheduledDate != "" {
		if t, err := time.Parse("2006-01-02", scheduledDate); err == nil {
			filter.ScheduledDate = &t
		}
	}
	if createdAt := query.Get("createdAt"); createdAt != "" {
		if t, err := time.Parse("2006-01-02", createdAt); err == nil {
			filter.CreatedAt = &t
		}
	}
	return filter
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

	if filter.CreatedAt != nil {
		queryConditions = append(queryConditions, "r.created_at::date = @filterCreatedAt")
		locArgs["filterCreatedAt"] = *filter.CreatedAt
	}

	if filter.ScheduledDate != nil {
		queryConditions = append(queryConditions, "r.scheduled_date::date = @filterScheduledDate")
		locArgs["filterScheduledDate"] = *filter.ScheduledDate
	}

	if filter.Name != nil {
		queryConditions = append(queryConditions, "r.name ILIKE @filterName")
		locArgs["filterName"] = "%" + *filter.Name + "%"
	}

	if filter.Phone != nil {
		queryConditions = append(queryConditions, "r.phone ILIKE @filterPhone")
		locArgs["filterPhone"] = "%" + *filter.Phone + "%"
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

	if req.Status == "" {
		req.Status = RequestStatusPending
	}
	if req.Name == "" {
		req.Name = "N/A"
	}

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
		SELECT r.id, r.type, r.phone, r.name, r.created_at, r.status, r.scheduled_date, r.property,
			u.fullname AS agent
		FROM requests r
		LEFT JOIN users u ON r.agent = u.id
	`

	if len(queryConditions) > 0 {
		baseQuery = baseQuery + " WHERE " + strings.Join(queryConditions, " AND ")
	}

	query := baseQuery + " ORDER BY r.created_at DESC" + paginateOpts

	rows, err := conn.Query(ctx, query, args)
	if err != nil {
		return
	}
	defer rows.Close()

	var (
		scheduledDate sql.NullTime
		property      sql.NullString
		agent         sql.NullString
	)
	for rows.Next() {
		var r Request
		err = rows.Scan(
			&r.Id,
			&r.Type,
			&r.Phone,
			&r.Name,
			&r.CreatedAt,
			&r.Status,
			&scheduledDate,
			&property,
			&agent,
		)

		if err != nil {
			return
		}

		if scheduledDate.Valid {
			r.ScheduledDate = scheduledDate.Time
		}
		if property.Valid {
			r.Property = property.String
		}
		if agent.Valid {
			r.Agent = agent.String
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
		`SELECT r.id, r.phone, r.name, r.created_at, r.scheduled_date, r.status, r.type, r.property,
			u.fullname AS agent
		FROM requests r
		LEFT JOIN users u ON r.agent = u.id
		WHERE r.id = $1`,
		id,
	)

	var (
		scheduledDate sql.NullTime
		property      sql.NullString
		agent         sql.NullString
	)
	err = row.Scan(
		&req.Id,
		&req.Phone,
		&req.Name,
		&req.CreatedAt,
		&scheduledDate,
		&req.Status,
		&req.Type,
		&property,
		&agent,
	)

	if err != nil {
		return nil, err
	}

	if scheduledDate.Valid {
		req.ScheduledDate = scheduledDate.Time
	}
	if property.Valid {
		req.Property = property.String
	}
	if agent.Valid {
		req.Agent = agent.String
	}

	return &req, nil
}

func UpdateRequest(ctx context.Context, req *Request) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := pgx.NamedArgs{
		"id":     req.Id,
		"name":   req.Name,
		"phone":  req.Phone,
		"status": req.Status,
		"type":   req.Type,
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
		`UPDATE requests SET
			name = @name,
			phone = @phone,
			status = @status,
			type = @type,
			scheduled_date = @scheduled_date,
			agent = @agent,
			property = @property,
			updated_at = NOW()
		WHERE id = @id`,
		args,
	)

	return err
}

func SetDoneRequest(ctx context.Context, id string) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := pgx.NamedArgs{
		"id":     id,
		"status": RequestStatusDone,
	}
	_, err = conn.Exec(
		ctx,
		"UPDATE requests SET status = @status WHERE id = @id",
		args,
	)

	if err != nil {
		return err
	}

	return nil
}

func DeleteRequestById(id string) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	_, err = conn.Exec(ctx, "DELETE FROM requests WHERE id = $1", id)

	return err
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
