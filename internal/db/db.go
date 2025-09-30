package db

import (
	"context"
	"math"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Pagination struct {
	Total   int  `json:"total"`
	Page    int  `json:"page"`
	PerPage int  `json:"perPage"`
	HasNext bool `json:"hasNext"`
	HasPrev bool `json:"hasPrev"`
}

func NewPagination(total, perPage, page int) *Pagination {
	pag := Pagination{
		Total:   total,
		PerPage: perPage,
		Page:    page,
	}
	pageCount := int(math.Ceil(float64(pag.Total) / float64(pag.PerPage)))
	pag.HasNext = pageCount > page
	pag.HasPrev = page > 1

	return &pag
}

type InvalidFields map[string]bool

var DB *pgxpool.Pool

func Connect() (*pgxpool.Pool, error) {
	var err error
	DB, err = pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, err
	}

	return DB, nil
}

func GetPool() (*pgxpool.Conn, error) {
	conn, err := DB.Acquire(context.Background())

	if err != nil {
		return nil, err
	}

	return conn, nil
}

func GetPoolWithCtx(ctx context.Context) (*pgxpool.Conn, error) {
	conn, err := DB.Acquire(ctx)

	if err != nil {
		return nil, err
	}

	return conn, nil
}

func GetTxAndPool(ctx context.Context) (pgx.Tx, *pgxpool.Conn, error) {
	conn, err := DB.Acquire(context.Background())

	if err != nil {
		return nil, nil, err
	}

	tx, err := conn.Begin(ctx)
	if err != nil {
		return nil, nil, err
	}

	return tx, conn, nil
}
