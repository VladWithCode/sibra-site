package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/vladwithcode/sibra-site/internal"
)

var (
	ErrAssociateMissingIDs = errors.New("RFC or CURP must be set")
	ErrAssociateBatchError = errors.New("error inserting associates")
)

type ProjectAmenity struct {
	ID   string `json:"id" db:"id"`
	Name string `json:"name" db:"name"`
	Icon string `json:"icon" db:"icon"`
	Img  string `json:"img" db:"img"`
}

type ProjectAssociate struct {
	ID             string `json:"id" db:"id"`
	Name           string `json:"name" db:"name"`
	Phone          string `json:"phone" db:"phone"`
	RFC            string `json:"rfc" db:"rfc"`
	CURP           string `json:"curp" db:"curp"`
	LotNum         string `json:"lot_num,omitempty" db:"lot_num"`
	AppleNum       string `json:"apple_num,omitempty" db:"apple_num"`
	PendingPayment bool   `json:"pending_payment" db:"pending_payment"`
}

type ProjectDoc struct {
	ID          string `json:"id" db:"id"`
	Name        string `json:"doc" db:"doc"`
	Description string `json:"description" db:"description"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type Project struct {
	ID          string `json:"id" db:"id"`
	Slug        string `json:"slug" db:"slug"`
	Name        string `json:"name" db:"name"`
	Description string `json:"description" db:"description"`
	// Images are the filename of the corresponding image as stored in server
	MainImg         string   `json:"main_img" db:"main_img"`
	AvailabilityImg string   `json:"availability_img" db:"availability_img"`
	Gallery         []string `json:"gallery" db:"gallery"`

	Amenities  []ProjectAmenity   `json:"amenities" db:"amenities"`
	Associates []ProjectAssociate `json:"associates" db:"associates"`
	Docs       []ProjectDoc       `json:"docs" db:"docs"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

func (p *Project) GetSlug() string {
	p.Slug = internal.Slugify(p.Name)
	return p.Slug
}

// FindProjects queries all projects from the database.
//
// It only returns the data of the projects.
func FindProjects(ctx context.Context) ([]*Project, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var projects []*Project

	rows, err := conn.Query(
		ctx,
		`SELECT
            id, slug, name, description, main_img, gallery, availability_img,
            amenities, docs, created_at, updated_at
        FROM projects`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var project Project
		err = rows.Scan(
			&project.ID,
			&project.Slug,
			&project.Name,
			&project.Description,
			&project.MainImg,
			&project.Gallery,
			&project.AvailabilityImg,
			&project.Amenities,
			&project.Docs,
			&project.CreatedAt,
			&project.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		projects = append(projects, &project)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return projects, nil
}

// FindProject is a wrapper around FindProjectByID and FindProjectBySlug that will
// determine whether the id passed is a uuid or not, and call the appropriate query function
func FindProject(ctx context.Context, id string) (*Project, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var findFn func(context.Context, string) (*Project, error)
	if _, err := uuid.Parse(id); err != nil {
		findFn = FindProjectBySlug
	} else {
		findFn = FindProjectByID
	}

	return findFn(ctx, id)
}

func FindProjectByID(ctx context.Context, id string) (*Project, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	row := conn.QueryRow(ctx, `
		SELECT
			p.id, p.slug, p.name, p.description, p.main_img, p.gallery, p.availability_img,
			p.amenities, p.docs, p.created_at, p.updated_at
		FROM projects p
		WHERE p.id = $1
	`, id)

	var proj Project
	err = row.Scan(
		&proj.ID,
		&proj.Slug,
		&proj.Name,
		&proj.Description,
		&proj.MainImg,
		&proj.Gallery,
		&proj.AvailabilityImg,
		&proj.Amenities,
		&proj.Docs,
		&proj.CreatedAt,
		&proj.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &proj, nil
}

func FindProjectBySlug(ctx context.Context, slug string) (*Project, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	row := conn.QueryRow(ctx, `
        SELECT
            p.id, p.slug, p.name, p.description, p.main_img, p.gallery, p.availability_img,
            p.amenities, p.docs, p.created_at, p.updated_at
        FROM projects p
        WHERE p.slug = $1
    `, slug)

	var proj Project
	err = row.Scan(
		&proj.ID,
		&proj.Slug,
		&proj.Name,
		&proj.Description,
		&proj.MainImg,
		&proj.Gallery,
		&proj.AvailabilityImg,
		&proj.Amenities,
		&proj.Docs,
		&proj.CreatedAt,
		&proj.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &proj, nil
}

// CreateProject creates a new project. It also creates associates and project-associates relationships
// if there are any associates in the provided project
func CreateProject(ctx context.Context, project *Project) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()
	ctx, cancel := context.WithTimeout(ctx, time.Second*5)
	defer cancel()
	tx, err := conn.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if project.ID == "" {
		project.ID = uuid.Must(uuid.NewV7()).String()
	}

	jsonb_amenities, err := json.Marshal(project.Amenities)
	if err != nil {
		return err
	}

	jsonb_docs, err := json.Marshal(project.Docs)
	if err != nil {
		return err
	}

	if project.Slug == "" {
		project.GetSlug()
	}

	args := pgx.NamedArgs{
		"id":               project.ID,
		"slug":             project.Slug,
		"name":             project.Name,
		"description":      project.Description,
		"main_img":         project.MainImg,
		"gallery":          project.Gallery,
		"availability_img": project.AvailabilityImg,
		"amenities":        jsonb_amenities,
		"docs":             jsonb_docs,
	}
	_, err = tx.Exec(
		ctx,
		`INSERT INTO projects (
            id, slug, name, description, main_img, gallery, availability_img
        ) VALUES (
            @id, @slug, @name, @description, @main_img, @gallery, @availability_img
        )`,
		args,
	)

	if err != nil {
		return err
	}

	// If there are no associates, we can just commit the transaction
	if len(project.Associates) == 0 {
		return tx.Commit(ctx)
	}

	// Batch insert associates
	assBatch := pgx.Batch{}
	// Batch insert project-associates relations
	pAssBatch := pgx.Batch{}

	for _, a := range project.Associates {
		if a.ID == "" {
			a.ID = uuid.Must(uuid.NewV7()).String()
		}

		if a.RFC == "" && a.CURP == "" {
			return ErrAssociateMissingIDs
		}

		// Fields are inserted as nullable strings to allow for empty values (not zero values)
		args := pgx.NamedArgs{
			"id": a.ID,
			"name": sql.NullString{
				String: a.Name,
				Valid:  a.Name != "",
			},
			"phone": sql.NullString{
				String: a.Phone,
				Valid:  a.Phone != "",
			},
			"rfc": sql.NullString{
				String: a.RFC,
				Valid:  a.RFC != "",
			},
			"curp": sql.NullString{
				String: a.CURP,
				Valid:  a.CURP != "",
			},
		}

		// On conflict, we'll update the existing associate with the new values
		// This is because associates may already exist from other projects
		assBatch.Queue(
			`INSERT INTO associates (
                id, name, phone, rfc, curp
            ) VALUES (
                @id, @name, @phone, @rfc, @curp
            ) ON CONFLICT (rfc, curp) DO UPDATE`,
			args,
		)

		pAssArgs := pgx.NamedArgs{
			"project_id":      project.ID,
			"associate_id":    a.ID,
			"pending_payment": a.PendingPayment,
		}
		pAssBatch.Queue(
			`INSERT INTO project_associates (
                project_id, associate_id, pending_payment
            ) VALUES (
                @project_id, @associate_id, @pending_payment
            )`,
			pAssArgs,
		)
	}

	bres := tx.SendBatch(ctx, &assBatch)
	for i := 0; i < assBatch.Len(); i++ {
		_, err = bres.Exec()
		if err != nil {
			return errors.Join(ErrAssociateBatchError, err)
		}
	}
	err = bres.Close()
	if err != nil {
		return err
	}

	bres = tx.SendBatch(ctx, &pAssBatch)
	for i := 0; i < pAssBatch.Len(); i++ {
		_, err = bres.Exec()
		if err != nil {
			return errors.Join(ErrAssociateBatchError, err)
		}
	}
	err = bres.Close()
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// UpdateProject updates a project. It does not update associates or project-associates relationships
func UpdateProject(ctx context.Context, project *Project) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if project.ID == "" {
		return errors.New("project id is required")
	}

	jsonb_amenities, err := json.Marshal(project.Amenities)
	if err != nil {
		return err
	}

	jsonb_docs, err := json.Marshal(project.Docs)
	if err != nil {
		return err
	}
	args := pgx.NamedArgs{
		"id":               project.ID,
		"name":             project.Name,
		"description":      project.Description,
		"main_img":         project.MainImg,
		"gallery":          project.Gallery,
		"availability_img": project.AvailabilityImg,
		"amenities":        jsonb_amenities,
		"docs":             jsonb_docs,
	}
	_, err = conn.Exec(
		ctx,
		`UPDATE projects SET
            name = @name, description = @description, main_img = @main_img, gallery = @gallery,
            availability_img = @availability_img, amenities = @amenities, docs = @docs
		WHERE id = @id`,
		args,
	)

	if err != nil {
		return err
	}

	return nil
}

func DeleteProject(ctx context.Context, id string) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	_, err = conn.Exec(ctx, "DELETE FROM projects WHERE id = $1", id)

	if err != nil {
		return err
	}

	return nil
}

func FindAssociateByID(ctx context.Context, id string) (*ProjectAssociate, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	row := conn.QueryRow(ctx, `
		SELECT
			id, name, phone, rfc, curp
		FROM associates
		WHERE id = $1
	`, id)

	var assoc ProjectAssociate
	err = row.Scan(
		&assoc.ID,
		&assoc.Name,
		&assoc.Phone,
		&assoc.RFC,
		&assoc.CURP,
	)

	if err != nil {
		return nil, err
	}

	return &assoc, nil
}

func FindAssociateWithData(ctx context.Context, projectId, idcode, lotNum, appleNum string) (*ProjectAssociate, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := pgx.NamedArgs{
		"idcode":     idcode,
		"lot_num":    lotNum,
		"apple_num":  appleNum,
		"project_id": projectId,
	}
	row := conn.QueryRow(ctx, `
        SELECT
            a.id, a.name, a.phone, a.rfc, a.curp, pa.pending_payment
        FROM project_associates pa
        LEFT JOIN associates a ON a.id = pa.associate_id
        WHERE
            (pa.project_id = @project_id AND a.rfc = @idcode OR a.curp = @idcode)
            AND pa.lot_num = @lot_num AND pa.apple_num = @apple_num
    `, args)

	var assoc ProjectAssociate
	err = row.Scan(
		&assoc.ID,
		&assoc.Name,
		&assoc.Phone,
		&assoc.RFC,
		&assoc.CURP,
		&assoc.PendingPayment,
	)

	if err != nil {
		return nil, err
	}

	return &assoc, nil
}

// CreateAssociate creates a new associate.
func CreateAssociate(ctx context.Context, associate *ProjectAssociate) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if associate.ID == "" {
		associate.ID = uuid.Must(uuid.NewV7()).String()
	}

	args := pgx.NamedArgs{
		"id": associate.ID,
		"name": sql.NullString{
			String: associate.Name,
			Valid:  associate.Name != "",
		},
		"phone": sql.NullString{
			String: associate.Phone,
			Valid:  associate.Phone != "",
		},
		"rfc": sql.NullString{
			String: associate.RFC,
			Valid:  associate.RFC != "",
		},
		"curp": sql.NullString{
			String: associate.CURP,
			Valid:  associate.CURP != "",
		},
	}
	_, err = conn.Exec(
		ctx,
		`INSERT INTO associates (
            id, name, phone, rfc, curp
        ) VALUES (
            @id, @name, @phone, @rfc, @curp
        )`,
		args,
	)

	if err != nil {
		return err
	}

	return nil
}

// UpdateAssociate updates an associate's personal data.
func UpdateAssociate(ctx context.Context, associate *ProjectAssociate) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := pgx.NamedArgs{
		"id": associate.ID,
		"name": sql.NullString{
			String: associate.Name,
			Valid:  associate.Name != "",
		},
		"phone": sql.NullString{
			String: associate.Phone,
			Valid:  associate.Phone != "",
		},
		"rfc": sql.NullString{
			String: associate.RFC,
			Valid:  associate.RFC != "",
		},
		"curp": sql.NullString{
			String: associate.CURP,
			Valid:  associate.CURP != "",
		},
	}
	_, err = conn.Exec(
		ctx,
		`UPDATE associates SET
            name = @name, phone = @phone, rfc = @rfc, curp = @curp
        WHERE id = @id`,
		args,
	)

	if err != nil {
		return err
	}

	return nil
}

// DeleteAssociate deletes an associate. project-associates relationships are
// handled by the Database
func DeleteAssociate(ctx context.Context, id string) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	_, err = conn.Exec(ctx, "DELETE FROM associates WHERE id = $1", id)

	if err != nil {
		return err
	}

	return nil
}

// AddProjectAssociate adds a project-associate relationship
func AddProjectAssociate(ctx context.Context, projectID string, associate *ProjectAssociate) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := pgx.NamedArgs{
		"project_id":      projectID,
		"associate_id":    associate.ID,
		"pending_payment": associate.PendingPayment,
		"lot_num":         associate.LotNum,
		"apple_num":       associate.AppleNum,
	}
	_, err = conn.Exec(
		ctx,
		`INSERT INTO project_associates
            (project_id, associate_id, pending_payment, lot_num, apple_num)
        VALUES (@project_id, @associate_id, @pending_payment, @lot_num, @apple_num)`,
		args,
	)

	if err != nil {
		return err
	}

	return nil
}

// UpdateProjectAssociate is used to update the pending_payment field of a project-associate relationship
// This may change in the future
func UpdateProjectAssociate(ctx context.Context, projectID, associateID string, pendingPayment bool) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := pgx.NamedArgs{
		"project_id":      projectID,
		"associate_id":    associateID,
		"pending_payment": pendingPayment,
	}
	_, err = conn.Exec(
		ctx,
		`UPDATE project_associates
            SET pending_payment = @pending_payment
        WHERE project_id = @project_id AND associate_id = @associate_id`,
		args,
	)

	if err != nil {
		return err
	}

	return nil
}

// RemoveProjectAssociate removes a project-associate relationship
func RemoveProjectAssociate(ctx context.Context, projectID, associateID string) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	_, err = conn.Exec(
		ctx,
		`DELETE FROM project_associates
            WHERE project_id = $1 AND associate_id = $2`,
		projectID,
		associateID,
	)

	if err != nil {
		return err
	}

	return nil
}
