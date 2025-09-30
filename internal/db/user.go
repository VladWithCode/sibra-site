package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

type UserRole string

const (
	RoleAdmin  UserRole = "admin"
	RoleEditor UserRole = "editor"
	RoleUser   UserRole = "user"
)

type User struct {
	Id            string         `db:"id" json:"id"`
	Fullname      string         `db:"name" json:"name"`
	Password      string         `db:"password" json:"password"`
	Username      string         `db:"username" json:"username"`
	Role          UserRole       `db:"role" json:"role"`
	Email         string         `db:"email" json:"email"`
	Phone         sql.NullString `json:"phone" db:"phone"`
	EmailVerified bool           `json:"emailVerified" db:"email_verified"`
	PhoneVerified bool           `json:"phoneVerified" db:"phone_verified"`
	Img           string         `json:"img" db:"img"`

	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

func (u *User) ValidatePass(pw string) error {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(pw))

	if err != nil {
		return err
	}

	return nil
}

func (u *User) HashPass(pw string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)

	if err != nil {
		return err
	}

	u.Password = string(hashedPassword)

	return nil
}

func CreateUser(user *User) (string, error) {
	conn, err := GetPool()
	if err != nil {
		return "", err
	}
	defer conn.Release()
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)

	if err != nil {
		return "", err
	}

	tag, err := conn.Exec(
		ctx,
		"INSERT INTO users (id, fullname, password, username, role, email, phone, img) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
		user.Id,
		user.Fullname,
		hashedPassword,
		user.Username,
		user.Role,
		user.Email,
		user.Phone,
		user.Img,
	)

	if err != nil {
		return "", err
	}

	if tag.RowsAffected() == 0 {
		return "", errors.New("No se creó el usuario")
	}

	return user.Id, nil
}

func GetUserById(id string) (*User, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	var user User

	err = conn.QueryRow(
		ctx,
		`SELECT
            id, fullname, password, username, role, email, phone, email_verified,
            phone_verified, img, created_at, updated_at
        FROM users
        WHERE id = $1`,
		id,
	).Scan(
		&user.Id,
		&user.Fullname,
		&user.Password,
		&user.Username,
		&user.Role,
		&user.Email,
		&user.Phone,
		&user.EmailVerified,
		&user.PhoneVerified,
		&user.Img,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func GetUserByUsername(username string) (*User, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	var user User

	err = conn.QueryRow(
		ctx,
		`SELECT
            id, fullname, password, username, role, email, phone, email_verified,
            phone_verified, img, created_at, updated_at
        FROM users
        WHERE username = $1`,
		username,
	).Scan(
		&user.Id,
		&user.Fullname,
		&user.Password,
		&user.Username,
		&user.Role,
		&user.Email,
		&user.Phone,
		&user.EmailVerified,
		&user.PhoneVerified,
		&user.Img,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func UpdateUser(user *User) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	_, err = conn.Exec(
		ctx,
		"UPDATE users SET name = $1, password = $2, username = $3, role = $4, email = $5, phone = $6, img = $7 WHERE id = $8",
		user.Fullname,
		user.Password,
		user.Username,
		user.Role,
		user.Email,
		user.Phone,
		user.Img,
		user.Id,
	)

	if err != nil {
		return err
	}

	return nil
}

func TxVerifyUserEmail(ctx context.Context, tx pgx.Tx, userId string) error {
	tag, err := tx.Exec(
		ctx,
		"UPDATE users SET email_verified = TRUE WHERE id = $1",
		userId,
	)

	if err != nil {
		return err
	}

	if tag.RowsAffected() == 0 {
		return fmt.Errorf("No se encontró usuario con id %v", userId)
	}

	return nil
}

func VerifyUserEmail(userId string) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	tag, err := conn.Exec(
		ctx,
		"UPDATE users SET email_verified = TRUE WHERE id = $1",
		userId,
	)
	if err != nil {
		return err
	}

	if tag.RowsAffected() == 0 {
		return fmt.Errorf("No se encontró usuario con id %v", userId)
	}

	return nil
}
