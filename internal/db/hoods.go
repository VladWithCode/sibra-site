package db

import (
	"context"
	"math/big"
	"time"

	"github.com/google/uuid"
	"github.com/paulmach/orb"
	"github.com/paulmach/orb/encoding/wkb"
)

type Hood struct {
	Id               string       `sql,json:"id"`
	Name             string       `sql,json:"name"`
	Boundaries       [][2]float64 `sql,json:"boundaries"`
	SqMeterPrice     big.Float    `sql:"sq_meter_price" json:"sqMeterPrice"`
	Location         *orb.Point   `sql,json:"location"`
	Lon              *float64     `sql,json:"lon"`
	Lat              *float64     `sql,json:"lat"`
	AvgPropertyPrice *big.Float   `sql:"avg_property_price" json:"avgPropertyPrice"`
	MaxPropertyPrice *big.Float   `sql:"max_property_price" json:"maxPropertyPrice"`
	MinPropertyPrice *big.Float   `sql:"min_property_price" json:"minPropertyPrice"`
	AvgLandSize      *float64     `sql:"avg_land_size" json:"avgLandSize"`
	MaxLandSize      *float64     `sql:"max_land_size" json:"maxLandSize"`
	MinLandSize      *float64     `sql:"min_land_size" json:"minLandSize"`
	PropertyCount    *int         `sql:"property_count" json:"propertyCount"`
}

func (h *Hood) GetCoords() (wkbCoords []byte, err error) {
	if h.Location != nil {
		wkbCoords, err = wkb.Marshal(*h.Location)
		if err != nil {
			return
		}
	}

	return
}

func CreateHood(hood *Hood) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	wkbCoords, err := hood.GetCoords()

	if err != nil {
		return err
	}

	id, _ := uuid.NewV7()

	_, err = conn.Exec(
		ctx,
		"INSERT INTO hoods (id, name, boundaries, sq_meter_price, location, lon, lat) VALUES $1, $2, $3, $4, $5, $6, $7",
		id,
		hood.Name,
		hood.Boundaries,
		hood.SqMeterPrice,
		wkbCoords,
		hood.Lon,
		hood.Lat,
	)

	if err != nil {
		return err
	}

	return nil
}

func FindHoods() (hoods []*Hood, err error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	rows, err := conn.Query(
		ctx,
		"SELECT * FROM hoods",
	)
	if err != nil {
		return nil, err
	}

	hoods = []*Hood{}
	var price float64
	for rows.Next() {
		hood := Hood{}
		var coords []byte
		rows.Scan(
			&hood.Id,
			&hood.Name,
			&hood.Boundaries,
			&price,
			&coords,
			&hood.Lon,
			&hood.Lat,
		)
		hood.SqMeterPrice = *big.NewFloat(price)

		hoods = append(hoods, &hood)
	}

	return
}
