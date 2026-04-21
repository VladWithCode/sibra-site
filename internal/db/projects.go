package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/vladwithcode/sibra-site/internal"
)

var (
	ErrAssociateMissingIDs = errors.New("RFC or CURP must be set")
	ErrAssociateBatchError = errors.New("error inserting associates")

	ErrProjectAssociateFilterInvalid = errors.New("invalid project associate filter")
	ErrProjectAssociateArgsInvalid   = errors.New("invalid project associate args")
)

type ProjectAmenity struct {
	ID   string `json:"id" db:"id"`
	Name string `json:"name" db:"name"`
	Icon string `json:"icon,omitempty" db:"icon"`
	Img  string `json:"img,omitempty" db:"img"`
}

type ProjectAssociate struct {
	ID             string `json:"id" db:"id"`
	Name           string `json:"name" db:"name"`
	Phone          string `json:"phone" db:"phone"`
	RFC            string `json:"rfc" db:"rfc"`
	CURP           string `json:"curp" db:"curp"`
	LotNum         string `json:"lotNum,omitempty" db:"lot_num"`
	AppleNum       string `json:"appleNum,omitempty" db:"apple_num"`
	PendingPayment bool   `json:"pendingPayment" db:"pending_payment"`
}

type ProjectDoc struct {
	ID          string `json:"id" db:"id"`
	Name        string `json:"name" db:"name"`
	Description string `json:"description" db:"description"`

	CreatedAt time.Time `json:"created_at,omitzero" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at,omitzero" db:"updated_at"`
}

type ProjectAppealItem struct {
	ID          string `json:"id" db:"id"`
	Name        string `json:"name" db:"name"`
	Description string `json:"description" db:"description"`
}

type Project struct {
	ID          string `json:"id" db:"id"`
	Slug        string `json:"slug" db:"slug"`
	Name        string `json:"name" db:"name"`
	Description string `json:"description" db:"description"`
	Quote       string `json:"quote" db:"quote"`
	Summary     string `json:"summary" db:"summary"`
	Location    string `json:"location" db:"location"`
	// Images are the filename of the corresponding image as stored in server
	MainImg         string   `json:"main_img" db:"main_img"`
	AvailabilityImg string   `json:"availability_img" db:"availability_img"`
	Gallery         []string `json:"gallery" db:"gallery"`

	Amenities  []ProjectAmenity   `json:"amenities" db:"amenities"`
	Associates []ProjectAssociate `json:"associates" db:"associates"`
	Docs       []ProjectDoc       `json:"docs" db:"docs"`

	TotalArea     float64             `json:"total_area" db:"total_area"`
	LotCount      int                 `json:"lot_count" db:"lot_count"`
	AvailableLots int                 `json:"available_lots" db:"available_lots"`
	AppealList    []ProjectAppealItem `json:"appeal_list" db:"appeal_list"`
	Coords        *Point              `json:"coords" db:"earth_coords"`
	Lat           float64             `json:"lat" db:"lat"`
	Lon           float64             `json:"lon" db:"lon"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

func (p *Project) GetSlug() string {
	p.Slug = internal.Slugify(p.Name)
	return p.Slug
}

func (p *Project) SetCoords() {
	p.Coords = &Point{
		Lat: p.Lat,
		Lon: p.Lon,
	}
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
            id, slug, name, description, quote, summary, location,
            main_img, gallery, availability_img,
            total_area, lot_count, available_lots,
            lat, lon, earth_coords,
            amenities, docs, p.created_at, p.updated_at,
            COALESCE(pa.associates, '{}'::uuid[]) AS associates
        FROM projects p
        LEFT JOIN (
            SELECT project_id, array_agg(associate_id) AS associates
            FROM project_associates
            GROUP BY project_id
        ) pa ON pa.project_id = p.id
        `,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var (
		rawDocs      []byte
		rawAmenities []byte
		associates   []string
	)
	for rows.Next() {
		var project Project
		err = rows.Scan(
			&project.ID,
			&project.Slug,
			&project.Name,
			&project.Description,
			&project.Quote,
			&project.Summary,
			&project.Location,
			&project.MainImg,
			&project.Gallery,
			&project.AvailabilityImg,
			&project.TotalArea,
			&project.LotCount,
			&project.AvailableLots,
			&project.Lat,
			&project.Lon,
			&project.Coords,
			&rawAmenities,
			&rawDocs,
			&project.CreatedAt,
			&project.UpdatedAt,
			&associates,
		)

		if err != nil {
			return nil, err
		}

		if rawAmenities != nil {
			project.Amenities = make([]ProjectAmenity, 0)
			err = json.Unmarshal(rawAmenities, &project.Amenities)
			if err != nil {
				return nil, err
			}
		}

		if rawDocs != nil {
			project.Docs = make([]ProjectDoc, 0)
			err = json.Unmarshal(rawDocs, &project.Docs)
			if err != nil {
				return nil, err
			}
		}

		if assocLen := len(associates); assocLen > 0 {
			project.Associates = make([]ProjectAssociate, assocLen)
			for i, a := range associates {
				project.Associates[i] = ProjectAssociate{
					ID: a,
				}
			}
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
			p.id, p.slug, p.name, p.description, p.quote, p.summary, p.location,
			p.main_img, p.gallery, p.availability_img,
			p.total_area, p.lot_count, p.available_lots,
			p.lat, p.lon, p.earth_coords,
			p.amenities, p.docs,
			COALESCE((
				SELECT jsonb_agg(
					jsonb_build_object(
						'id', ai.id,
						'name', ai.name,
						'description', ai.description
					) ORDER BY pai.position
				)
				FROM project_appeal_items pai
				JOIN appeal_items ai ON ai.id = pai.appeal_item_id
				WHERE pai.project_id = p.id
			), '[]'::jsonb) AS appeal_list,
			p.created_at, p.updated_at
		FROM projects p
		WHERE p.id = $1
	`, id)

	var (
		rawDocs       []byte
		rawAmenities  []byte
		rawAppealList []byte
		proj          Project
	)
	err = row.Scan(
		&proj.ID,
		&proj.Slug,
		&proj.Name,
		&proj.Description,
		&proj.Quote,
		&proj.Summary,
		&proj.Location,
		&proj.MainImg,
		&proj.Gallery,
		&proj.AvailabilityImg,
		&proj.TotalArea,
		&proj.LotCount,
		&proj.AvailableLots,
		&proj.Lat,
		&proj.Lon,
		&proj.Coords,
		&rawAmenities,
		&rawDocs,
		&rawAppealList,
		&proj.CreatedAt,
		&proj.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if rawAmenities != nil {
		proj.Amenities = make([]ProjectAmenity, 0)
		err = json.Unmarshal(rawAmenities, &proj.Amenities)
		if err != nil {
			return nil, err
		}
	}

	if rawDocs != nil {
		proj.Docs = make([]ProjectDoc, 0)
		err = json.Unmarshal(rawDocs, &proj.Docs)
		if err != nil {
			return nil, err
		}
	}

	if rawAppealList != nil {
		proj.AppealList = make([]ProjectAppealItem, 0)
		err = json.Unmarshal(rawAppealList, &proj.AppealList)
		if err != nil {
			return nil, err
		}
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
            p.id, p.slug, p.name, p.description, p.quote, p.summary, p.location,
            p.main_img, p.gallery, p.availability_img,
            p.total_area, p.lot_count, p.available_lots,
            p.lat, p.lon, p.earth_coords,
            p.amenities, p.docs,
            COALESCE((
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', ai.id,
                        'name', ai.name,
                        'description', ai.description
                    ) ORDER BY pai.position
                )
                FROM project_appeal_items pai
                JOIN appeal_items ai ON ai.id = pai.appeal_item_id
                WHERE pai.project_id = p.id
            ), '[]'::jsonb) AS appeal_list,
            p.created_at, p.updated_at
        FROM projects p
        WHERE p.slug = $1
    `, slug)

	var (
		rawDocs       []byte
		rawAmenities  []byte
		rawAppealList []byte
		proj          Project
	)
	err = row.Scan(
		&proj.ID,
		&proj.Slug,
		&proj.Name,
		&proj.Description,
		&proj.Quote,
		&proj.Summary,
		&proj.Location,
		&proj.MainImg,
		&proj.Gallery,
		&proj.AvailabilityImg,
		&proj.TotalArea,
		&proj.LotCount,
		&proj.AvailableLots,
		&proj.Lat,
		&proj.Lon,
		&proj.Coords,
		&rawAmenities,
		&rawDocs,
		&rawAppealList,
		&proj.CreatedAt,
		&proj.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if rawAmenities != nil {
		proj.Amenities = make([]ProjectAmenity, 0)
		err = json.Unmarshal(rawAmenities, &proj.Amenities)
		if err != nil {
			return nil, err
		}
	}

	if rawDocs != nil {
		proj.Docs = make([]ProjectDoc, 0)
		err = json.Unmarshal(rawDocs, &proj.Docs)
		if err != nil {
			return nil, err
		}
	}

	if rawAppealList != nil {
		proj.AppealList = make([]ProjectAppealItem, 0)
		err = json.Unmarshal(rawAppealList, &proj.AppealList)
		if err != nil {
			return nil, err
		}
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

	if len(project.Gallery) == 0 {
		project.Gallery = []string{}
	}

	project.SetCoords()

	args := pgx.NamedArgs{
		"id":               project.ID,
		"slug":             project.Slug,
		"name":             project.Name,
		"description":      project.Description,
		"quote":            project.Quote,
		"summary":          project.Summary,
		"location":         project.Location,
		"main_img":         project.MainImg,
		"gallery":          project.Gallery,
		"availability_img": project.AvailabilityImg,
		"total_area":       project.TotalArea,
		"lot_count":        project.LotCount,
		"available_lots":   project.AvailableLots,
		"lat":              project.Lat,
		"lon":              project.Lon,
		"earth_coords":     project.Coords,
		"amenities":        jsonb_amenities,
		"docs":             jsonb_docs,
	}
	_, err = tx.Exec(
		ctx,
		`INSERT INTO projects (
            id, slug, name, description, quote, summary, location,
            main_img, gallery, availability_img,
            total_area, lot_count, available_lots,
            lat, lon, earth_coords,
            amenities, docs
        ) VALUES (
            @id, @slug, @name, @description, @quote, @summary, @location,
            @main_img, @gallery, @availability_img,
            @total_area, @lot_count, @available_lots,
            @lat, @lon, @earth_coords,
            @amenities, @docs
        )`,
		args,
	)

	if err != nil {
		return err
	}

	if err := upsertProjectAppealList(ctx, tx, project.ID, project.AppealList); err != nil {
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

// UpdateProject updates a project. It does not update associates or project-associates relationships.
// The appeal list is fully replaced with the provided slice.
func UpdateProject(ctx context.Context, project *Project) error {
	conn, err := GetPoolWithCtx(ctx)
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

	project.SetCoords()

	if project.Gallery == nil {
		project.Gallery = make([]string, 0)
	}

	tx, err := conn.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	args := pgx.NamedArgs{
		"id":               project.ID,
		"name":             project.Name,
		"description":      project.Description,
		"quote":            project.Quote,
		"summary":          project.Summary,
		"location":         project.Location,
		"main_img":         project.MainImg,
		"gallery":          project.Gallery,
		"availability_img": project.AvailabilityImg,
		"total_area":       project.TotalArea,
		"lot_count":        project.LotCount,
		"available_lots":   project.AvailableLots,
		"lat":              project.Lat,
		"lon":              project.Lon,
		"earth_coords":     project.Coords,
		"amenities":        jsonb_amenities,
		"docs":             jsonb_docs,
	}
	_, err = tx.Exec(
		ctx,
		`UPDATE projects SET
            name = @name, description = @description, quote = @quote, summary = @summary,
            location = @location, main_img = @main_img, gallery = @gallery,
            availability_img = @availability_img,
            total_area = @total_area, lot_count = @lot_count, available_lots = @available_lots,
            lat = @lat, lon = @lon, earth_coords = @earth_coords,
            amenities = @amenities, docs = @docs,
            updated_at = NOW()
        WHERE id = @id`,
		args,
	)

	if err != nil {
		return err
	}

	// Replace the appeal list junction rows and upsert the referenced items
	if _, err := tx.Exec(ctx, `DELETE FROM project_appeal_items WHERE project_id = $1`, project.ID); err != nil {
		return err
	}

	if err := upsertProjectAppealList(ctx, tx, project.ID, project.AppealList); err != nil {
		return err
	}

	return tx.Commit(ctx)
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

type ProjectAssociateFilter struct {
	RfcOrCurp      *string `json:"rfcOrCurp"`
	Name           *string `json:"name"`
	Phone          *string `json:"phone"`
	LotNum         *string `json:"lotNum"`
	AppleNum       *string `json:"appleNum"`
	PendingPayment *bool   `json:"pendingPayment"`
}

func NewProjectAssociateFilter() *ProjectAssociateFilter {
	return &ProjectAssociateFilter{}
}

func FindProjectAssociates(ctx context.Context, projectID string, associateFilter *ProjectAssociateFilter) ([]*ProjectAssociate, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := pgx.NamedArgs{
		"projectId": projectID,
	}
	baseQuery := `SELECT a.id, a.name, a.phone, a.rfc, a.curp, pa.pending_payment, pa.lot_num, pa.apple_num
        FROM project_associates pa
        LEFT JOIN associates a ON a.id = pa.associate_id
        WHERE pa.project_id = @projectId`
	queryConditions, err := buildProjectAssociateFilterConditions(associateFilter, &args)
	if err != nil {
		return nil, err
	}
	if len(queryConditions) > 0 {
		baseQuery = baseQuery + " AND " + strings.Join(queryConditions, " AND ")
	}

	baseQuery = baseQuery + " ORDER BY pa.apple_num, pa.lot_num ASC"
	rows, err := conn.Query(ctx, baseQuery, args)

	if err != nil {
		return nil, err
	}

	associates := []*ProjectAssociate{}
	for rows.Next() {
		associate := ProjectAssociate{}
		err = rows.Scan(
			&associate.ID,
			&associate.Name,
			&associate.Phone,
			&associate.RFC,
			&associate.CURP,
			&associate.PendingPayment,
			&associate.LotNum,
			&associate.AppleNum,
		)

		if err != nil {
			return nil, err
		}
		associates = append(associates, &associate)
	}

	if rows.Err() != nil {
		return nil, rows.Err()
	}

	return associates, nil
}

func FindProjectAssociateByID(ctx context.Context, projectID string, id string) (*ProjectAssociate, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	row := conn.QueryRow(ctx, `
		SELECT
			a.id, a.name, a.phone, a.rfc, a.curp,
            pa.pending_payment, pa.lot_num, pa.apple_num
		FROM associates a
        LEFT JOIN project_associates pa ON pa.associate_id = a.id
		WHERE
        pa.project_id = $1 AND pa.associate_id = $2
	`, projectID, id)

	var assoc ProjectAssociate
	err = row.Scan(
		&assoc.ID,
		&assoc.Name,
		&assoc.Phone,
		&assoc.RFC,
		&assoc.CURP,
		&assoc.PendingPayment,
		&assoc.LotNum,
		&assoc.AppleNum,
	)

	if err != nil {
		return nil, err
	}

	return &assoc, nil
}

// buildProjectAssociateFilterConditions builds the conditions for the project-associate relationship query
// and populates the provided args with the values for the conditions.
//
// Providing a nil filter will return an error.
// Providing a nil args will return an error.
func buildProjectAssociateFilterConditions(filter *ProjectAssociateFilter, args *pgx.NamedArgs) ([]string, error) {
	var queryConditions []string

	if filter == nil {
		return queryConditions, ErrProjectAssociateFilterInvalid
	}

	if args == nil {
		return nil, ErrProjectAssociateArgsInvalid
	}
	if *args == nil {
		*args = pgx.NamedArgs{}
	}
	locArgs := *args

	if filter.PendingPayment != nil {
		queryConditions = append(queryConditions, "pending_payment = @searchPendPayment")
		locArgs["searchPendPayment"] = *filter.PendingPayment
	}

	if filter.LotNum != nil {
		queryConditions = append(queryConditions, "lot_num = @searchLotNum")
		locArgs["searchLotNum"] = *filter.LotNum
	}

	if filter.AppleNum != nil {
		queryConditions = append(queryConditions, "apple_num = @searchAppleNum")
		locArgs["searchAppleNum"] = *filter.AppleNum
	}

	if filter.RfcOrCurp != nil {
		queryConditions = append(queryConditions, "rfc ILIKE @searchRfc OR curp ILIKE @searchRfc")
		locArgs["searchRfc"] = *filter.RfcOrCurp
	}

	if filter.Name != nil {
		queryConditions = append(queryConditions, "name ILIKE @searchName")
		locArgs["searchName"] = *filter.Name
	}

	if filter.Phone != nil {
		queryConditions = append(queryConditions, "phone ILIKE @searchPhone")
		locArgs["searchPhone"] = *filter.Phone
	}

	return queryConditions, nil
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

// upsertProjectAppealList upserts the referenced appeal items and inserts the
// project-appeal-item junction rows with a sequential position. It is intended
// to run inside an existing transaction (use both by CreateProject and
// UpdateProject). The caller is responsible for deleting existing junction
// rows when replacing the list.
func upsertProjectAppealList(ctx context.Context, tx pgx.Tx, projectID string, items []ProjectAppealItem) error {
	if len(items) == 0 {
		return nil
	}

	itemBatch := pgx.Batch{}
	junctionBatch := pgx.Batch{}

	for i := range items {
		if items[i].ID == "" {
			items[i].ID = uuid.Must(uuid.NewV7()).String()
		}

		itemBatch.Queue(
			`INSERT INTO appeal_items (id, name, description)
             VALUES (@id, @name, @description)
             ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                updated_at = NOW()`,
			pgx.NamedArgs{
				"id":          items[i].ID,
				"name":        items[i].Name,
				"description": items[i].Description,
			},
		)

		junctionBatch.Queue(
			`INSERT INTO project_appeal_items (project_id, appeal_item_id, position)
             VALUES (@project_id, @appeal_item_id, @position)`,
			pgx.NamedArgs{
				"project_id":     projectID,
				"appeal_item_id": items[i].ID,
				"position":       i,
			},
		)
	}

	bres := tx.SendBatch(ctx, &itemBatch)
	for i := 0; i < itemBatch.Len(); i++ {
		if _, err := bres.Exec(); err != nil {
			bres.Close()
			return err
		}
	}
	if err := bres.Close(); err != nil {
		return err
	}

	bres = tx.SendBatch(ctx, &junctionBatch)
	for i := 0; i < junctionBatch.Len(); i++ {
		if _, err := bres.Exec(); err != nil {
			bres.Close()
			return err
		}
	}
	return bres.Close()
}

func FindAppealItems(ctx context.Context) ([]*ProjectAppealItem, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := conn.Query(ctx, `SELECT id, name, description FROM appeal_items ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]*ProjectAppealItem, 0)
	for rows.Next() {
		var item ProjectAppealItem
		if err := rows.Scan(&item.ID, &item.Name, &item.Description); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func FindAppealItemByID(ctx context.Context, id string) (*ProjectAppealItem, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	row := conn.QueryRow(ctx, `SELECT id, name, description FROM appeal_items WHERE id = $1`, id)

	var item ProjectAppealItem
	if err := row.Scan(&item.ID, &item.Name, &item.Description); err != nil {
		return nil, err
	}
	return &item, nil
}

func CreateAppealItem(ctx context.Context, item *ProjectAppealItem) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if item.ID == "" {
		item.ID = uuid.Must(uuid.NewV7()).String()
	}

	_, err = conn.Exec(
		ctx,
		`INSERT INTO appeal_items (id, name, description)
         VALUES (@id, @name, @description)`,
		pgx.NamedArgs{
			"id":          item.ID,
			"name":        item.Name,
			"description": item.Description,
		},
	)
	return err
}

func UpdateAppealItem(ctx context.Context, item *ProjectAppealItem) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if item.ID == "" {
		return errors.New("appeal item id is required")
	}

	_, err = conn.Exec(
		ctx,
		`UPDATE appeal_items SET
            name = @name, description = @description, updated_at = NOW()
        WHERE id = @id`,
		pgx.NamedArgs{
			"id":          item.ID,
			"name":        item.Name,
			"description": item.Description,
		},
	)
	return err
}

func DeleteAppealItem(ctx context.Context, id string) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	_, err = conn.Exec(ctx, `DELETE FROM appeal_items WHERE id = $1`, id)
	return err
}
