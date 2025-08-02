-- +goose Up
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY,
    fullName varchar(120) NOT NULL,
	password varchar(255) NOT NULL,
	username varchar(32) UNIQUE NOT NULL,
	role varchar(16) NOT NULL,
	email varchar(255) UNIQUE NOT NULL,
	phone varchar(255),
	email_verified bool DEFAULT false,
	phone_verified bool DEFAULT false,
	img varchar(255) DEFAULT ''
);

-- +goose Down
DROP TABLE IF EXISTS users;
