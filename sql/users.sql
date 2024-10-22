CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY,
	name varchar(255) NOT NULL,
	lastname varchar(255) NOT NULL,
	password varchar(255) NOT NULL,
	username varchar(24) UNIQUE NOT NULL,
	role varchar(16) NOT NULL,
	email varchar(255) UNIQUE NOT NULL,
	phone varchar(255),
	email_verified bool DEFAULT false,
	phone_verified bool DEFAULT false,
	golden_boy bool DEFAULT false,
	img varchar(255) DEFAULT ''
);
