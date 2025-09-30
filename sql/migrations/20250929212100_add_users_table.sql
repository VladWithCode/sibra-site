-- +goose Up
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    fullName VARCHAR(120) NOT NULL,
	password VARCHAR(255) NOT NULL,
	username VARCHAR(32) UNIQUE NOT NULL,
	role VARCHAR(16) NOT NULL,
	email VARCHAR(255) UNIQUE NOT NULL,
	phone VARCHAR(255),
	email_verified BOOL DEFAULT false,
	phone_verified BOOL DEFAULT false,
	img VARCHAR(255) DEFAULT '',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS users;
