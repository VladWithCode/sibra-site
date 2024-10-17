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

type User struct {
	Id            string         `db:"id" json:"id"`
	Name          string         `db:"name" json:"name"`
	Lastname      string         `db:"lastname" json:"lastname"`
	Password      string         `db:"password" json:"password"`
	Username      string         `db:"username" json:"username"`
	Role          string         `db:"role" json:"role"`
	Email         string         `db:"email" json:"email"`
	Phone         sql.NullString `json:"phone" db:"phone_number"`
	EmailVerified bool           `json:"emailVerified" db:"email_verified"`
	PhoneVerified bool           `json:"phoneVerified" db:"phone_verified"`
	GoldenBoy     bool           `db:"golden_boy"`
	Img           string         `json:"img" db:"img"`
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

const (
	RoleAdmin  string = "admin"
	RoleEditor string = "editor"
	RoleUser   string = "user"
)

type UserDTO struct {
	Id       string `json:"id"`
	Name     string `json:"name"`
	Lastname string `json:"lastname"`
	Password string `json:"password"`
	Username string `json:"username"`
	Role     string `json:"role"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Img      string `json:"img"`
}

func CreateUser(user *User) (string, error) {
	conn, err := GetPool()
	if err != nil {
		return "", err
	}
	defer conn.Release()
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err != nil {
		return "", err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)

	if err != nil {
		return "", err
	}

	tag, err := conn.Exec(
		ctx,
		"INSERT INTO users (id, name, lastname, password, username, role, email, phone_number, img) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
		user.Id,
		user.Name,
		user.Lastname,
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
		"SELECT * FROM users WHERE id = $1",
		id,
	).Scan(
		&user.Id,
		&user.Name,
		&user.Lastname,
		&user.Password,
		&user.Username,
		&user.Role,
		&user.Email,
		&user.Phone,
		&user.EmailVerified,
		&user.PhoneVerified,
		&user.GoldenBoy,
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
		"SELECT * FROM users WHERE username = $1",
		username,
	).Scan(
		&user.Id,
		&user.Name,
		&user.Lastname,
		&user.Password,
		&user.Username,
		&user.Role,
		&user.Email,
		&user.Phone,
		&user.EmailVerified,
		&user.PhoneVerified,
		&user.GoldenBoy,
		&user.Img,
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
		"UPDATE users SET name = $1, lastname = $2, password = $3, username = $4, role = $5, email = $6, phone_number = $7, img = $8 WHERE id = $9",
		user.Name,
		user.Lastname,
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
		return errors.New(fmt.Sprintf("No se encontró usuario con id %v", userId))
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
		return errors.New(fmt.Sprintf("No se encontró usuario con id %v", userId))
	}

	return nil
}
