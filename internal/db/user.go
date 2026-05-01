package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserFilterInvalid = errors.New("invalid user filter")
	ErrUserArgsInvalid   = errors.New("invalid user args")
)

type UserRole string

const (
	RoleAdmin  UserRole = "admin"
	RoleEditor UserRole = "editor"
	RoleUser   UserRole = "user"
)

type User struct {
	Id            string   `db:"id" json:"id"`
	Fullname      string   `db:"name" json:"name"`
	Password      string   `db:"password" json:"password"`
	Username      string   `db:"username" json:"username"`
	Role          UserRole `db:"role" json:"role"`
	Email         string   `db:"email" json:"email"`
	Phone         string   `json:"phone" db:"phone"`
	EmailVerified bool     `json:"emailVerified" db:"email_verified"`
	PhoneVerified bool     `json:"phoneVerified" db:"phone_verified"`
	Img           string   `json:"img" db:"img"`

	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

func (u *User) ValidatePass(pw string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(pw))
}

func (u *User) HashPass(pw string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(pw), 12)

	if err != nil {
		return err
	}

	u.Password = string(hashedPassword)

	return nil
}

func (u *User) ToPublicUser() PublicUser {
	return PublicUser{
		Name:  u.Fullname,
		Email: u.Email,
		Phone: u.Phone,
		Img:   u.Img,
	}
}

type PublicUser struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
	Img   string `json:"img"`
}

type UserFilters struct {
	Search string `json:"search"`
	Role   string `json:"role"`
}

func NewUserFilters() *UserFilters {
	return &UserFilters{}
}

func NewUserFilterFromQuery(query *url.Values) *UserFilters {
	filter := NewUserFilters()
	if query == nil {
		return filter
	}
	if search := query.Get("search"); search != "" {
		filter.Search = search
	}
	return filter
}

func buildUserFilterConditions(filters *UserFilters, args *pgx.NamedArgs) ([]string, error) {
	var queryConditions []string

	if filters == nil {
		return queryConditions, ErrUserFilterInvalid
	}

	if args == nil {
		return nil, ErrUserArgsInvalid
	}
	if *args == nil {
		*args = pgx.NamedArgs{}
	}
	locArgs := *args

	if filters.Search != "" {
		queryConditions = append(queryConditions, "fullname ILIKE @search OR phone ILIKE @search OR email ILIKE @search")
		locArgs["search"] = "%" + filters.Search + "%"
	}

	if filters.Role != "" {
		queryConditions = append(queryConditions, "role = @searchRole")
		locArgs["searchRole"] = filters.Role
	}

	return queryConditions, nil
}

func GetUsers(ctx context.Context, filters *UserFilters, limit, page int) (users []*User, err error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	baseQuery := `
        SELECT
            id, fullname, username, role, email, phone, email_verified,
            phone_verified, img, created_at, updated_at
        FROM users
    `
	args := pgx.NamedArgs{}
	queryConditions, err := buildUserFilterConditions(filters, &args)
	if err != nil {
		return nil, err
	}

	if len(args) > 0 {
		baseQuery = baseQuery + " WHERE " + strings.Join(queryConditions, " AND ")
	}

	var paginateOpts string = ""
	if limit > 0 {
		paginateOpts = " LIMIT @limit"
		args["limit"] = limit
		if page > 0 {
			paginateOpts += " OFFSET @offset"
			args["offset"] = limit * (page - 1)
		}
	}

	baseQuery = baseQuery + paginateOpts

	rows, err := conn.Query(ctx, baseQuery, args)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			user  User
			img   sql.NullString
			phone sql.NullString
		)
		err = rows.Scan(
			&user.Id,
			&user.Fullname,
			&user.Username,
			&user.Role,
			&user.Email,
			&phone,
			&user.EmailVerified,
			&user.PhoneVerified,
			&img,
			&user.CreatedAt,
			&user.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		if phone.Valid {
			user.Phone = phone.String
		}
		if img.Valid {
			user.Img = img.String
		}

		users = append(users, &user)
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return users, nil
}

func FindAgents(ctx context.Context) ([]*User, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := conn.Query(ctx, `
        SELECT fullname, email, phone, img FROM users
        WHERE role = 'editor' OR role = 'admin'
    `)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*User
	for rows.Next() {
		var user User
		err = rows.Scan(
			&user.Fullname,
			&user.Email,
			&user.Phone,
			&user.Img,
		)

		if err != nil {
			return nil, err
		}

		users = append(users, &user)
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return users, nil
}

func GetUserPagination(filter *UserFilters, limit, page int) (paginationData *Pagination, err error) {
	conn, err := GetPool()
	if err != nil {
		return
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	baseQuery := `
        SELECT count(*) FROM users
    `
	args := pgx.NamedArgs{}
	queryConditions, err := buildUserFilterConditions(filter, &args)

	if len(queryConditions) > 0 {
		baseQuery = baseQuery + " WHERE " + strings.Join(queryConditions, " AND ")
	}

	rows, err := conn.Query(ctx, baseQuery, args)
	if err != nil {
		return
	}
	defer rows.Close()

	var userCount int
	for rows.Next() {
		err = rows.Scan(&userCount)
		if err != nil {
			return
		}
	}

	paginationData = NewPagination(userCount, limit, page)

	return
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

	args := pgx.NamedArgs{
		"id":       user.Id,
		"fullname": user.Fullname,
		"password": hashedPassword,
		"username": user.Username,
		"role":     user.Role,
		"email":    user.Email,
		"phone":    user.Phone,
		"img":      user.Img,
	}

	_, err = conn.Exec(
		ctx,
		"INSERT INTO users (id, fullname, password, username, role, email, phone, img) VALUES (@id, @fullname, @password, @username, @role, @email, @phone, @img)",
		args,
	)

	if err != nil {
		return "", err
	}

	return user.Id, nil
}

func GetUserById(ctx context.Context, id string) (*User, error) {
	conn, err := GetPool()
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var (
		user  User
		img   sql.NullString
		phone sql.NullString
	)

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
		&phone,
		&user.EmailVerified,
		&user.PhoneVerified,
		&img,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if phone.Valid {
		user.Phone = phone.String
	}
	if img.Valid {
		user.Img = img.String
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

	var (
		phone sql.NullString
		img   sql.NullString
	)
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
		&phone,
		&user.EmailVerified,
		&user.PhoneVerified,
		&img,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if phone.Valid {
		user.Phone = phone.String
	}
	if img.Valid {
		user.Img = img.String
	}

	return &user, nil
}

func UpdateUser(ctx context.Context, user *User) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var (
		phone sql.NullString
	)
	phone.String = user.Phone
	phone.Valid = user.Phone != ""

	args := pgx.NamedArgs{
		"name":     user.Fullname,
		"username": user.Username,
		"role":     user.Role,
		"email":    user.Email,
		"phone":    phone,
		"img":      user.Img,
		"id":       user.Id,
	}

	_, err = conn.Exec(
		ctx,
		"UPDATE users SET fullname = @name, username = @username, role = @role, email = @email, phone = @phone, img = @img WHERE id = @id",
		args,
	)

	if err != nil {
		return err
	}

	return nil
}

func UpdateUserPassword(ctx context.Context, user *User) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)

	if err != nil {
		return err
	}

	args := pgx.NamedArgs{
		"password": hashedPassword,
		"id":       user.Id,
	}

	_, err = conn.Exec(
		ctx,
		"UPDATE users SET password = @password WHERE id = @id",
		args,
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

func DeleteUser(ctx context.Context, id string) error {
	conn, err := GetPool()
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	_, err = conn.Exec(ctx, "DELETE FROM users WHERE id = $1", id)

	if err != nil {
		return err
	}

	return nil
}
