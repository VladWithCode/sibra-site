package db

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type TeamMember struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	Bio      string `json:"bio"`
	PhotoURL string `json:"photoUrl"`
	Position int    `json:"position"`
}

func ListTeamMembers(ctx context.Context) ([]*TeamMember, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := conn.Query(ctx, `SELECT id, name, role, bio, photo_url, position FROM team_members ORDER BY position`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]*TeamMember, 0)
	for rows.Next() {
		var m TeamMember
		if err := rows.Scan(&m.ID, &m.Name, &m.Role, &m.Bio, &m.PhotoURL, &m.Position); err != nil {
			return nil, err
		}
		items = append(items, &m)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func FindTeamMemberByID(ctx context.Context, id string) (*TeamMember, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	row := conn.QueryRow(ctx, `SELECT id, name, role, bio, photo_url, position FROM team_members WHERE id = $1`, id)

	var m TeamMember
	if err := row.Scan(&m.ID, &m.Name, &m.Role, &m.Bio, &m.PhotoURL, &m.Position); err != nil {
		return nil, err
	}
	return &m, nil
}

func GetNextTeamMemberPosition(ctx context.Context) (int, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return 0, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var maxPos int
	err = conn.QueryRow(ctx, `SELECT COALESCE(MAX(position), -1) FROM team_members`).Scan(&maxPos)
	if err != nil {
		return 0, err
	}
	return maxPos + 1, nil
}

func CreateTeamMember(ctx context.Context, m *TeamMember) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if m.ID == "" {
		m.ID = uuid.Must(uuid.NewV7()).String()
	}
	m.Name = strings.TrimSpace(m.Name)
	if m.Name == "" {
		return errors.New("team member name is required")
	}

	_, err = conn.Exec(
		ctx,
		`INSERT INTO team_members (id, name, role, bio, photo_url, position)
         VALUES (@id, @name, @role, @bio, @photo_url, @position)`,
		pgx.NamedArgs{
			"id":        m.ID,
			"name":      m.Name,
			"role":      m.Role,
			"bio":       m.Bio,
			"photo_url": m.PhotoURL,
			"position":  m.Position,
		},
	)
	return err
}

func UpdateTeamMember(ctx context.Context, m *TeamMember) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if m.ID == "" {
		return errors.New("team member id is required")
	}
	m.Name = strings.TrimSpace(m.Name)
	if m.Name == "" {
		return errors.New("team member name is required")
	}

	_, err = conn.Exec(
		ctx,
		`UPDATE team_members SET
            name = @name, role = @role, bio = @bio, photo_url = @photo_url, position = @position, updated_at = NOW()
        WHERE id = @id`,
		pgx.NamedArgs{
			"id":        m.ID,
			"name":      m.Name,
			"role":      m.Role,
			"bio":       m.Bio,
			"photo_url": m.PhotoURL,
			"position":  m.Position,
		},
	)
	return err
}

func DeleteTeamMember(ctx context.Context, id string) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	_, err = conn.Exec(ctx, `DELETE FROM team_members WHERE id = $1`, id)
	return err
}
