-- +goose Up
-- +goose StatementBegin
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    slug VARCHAR(256) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    main_img VARCHAR(256) NOT NULL,
    gallery VARCHAR(256)[] NOT NULL,
    availability_img VARCHAR(256),
    amenities JSONB,
    docs JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE associates (
    id UUID PRIMARY KEY,
    name VARCHAR(160),
    phone VARCHAR(16),
    rfc VARCHAR(13) UNIQUE,
    curp VARCHAR(18) UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure either RFC or CURP is set
    CONSTRAINT associates_either_rfc_or_curp CHECK (
        rfc IS NOT NULL AND char_length(rfc) = 13
        OR curp IS NOT NULL AND char_length(curp) = 18
    )
);

CREATE TABLE project_associates (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    associate_id UUID REFERENCES associates(id) ON DELETE CASCADE NOT NULL,
    pending_payment BOOLEAN NOT NULL,
    lot_num VARCHAR(10) NOT NULL,
    apple_num VARCHAR(10) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (project_id, associate_id)
);

CREATE INDEX project_associates_project_id_idx ON project_associates (project_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX project_associates_project_id_idx;
DROP TABLE project_associates;
DROP TABLE associates;
DROP TABLE projects;
-- +goose StatementEnd
