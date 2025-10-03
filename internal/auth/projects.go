package auth

import (
	"fmt"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

type ProjectAccessClaims struct {
	ProjectID   string
	AssociateID string
	LotNum      string
	AppleNum    string

	jwt.RegisteredClaims
}

type ProjectAccessTokenData struct {
	ProjectID   string
	AssociateID string
	LotNum      string
	AppleNum    string
	ExpiresAt   *jwt.NumericDate
}

func CreateProjectToken(tkData *ProjectAccessTokenData) (string, error) {
	var (
		t *jwt.Token
		k = os.Getenv("JWT_SECRET")
	)

	t = jwt.NewWithClaims(jwt.SigningMethodHS256, ProjectAccessClaims{
		tkData.ProjectID,
		tkData.AssociateID,
		tkData.LotNum,
		tkData.AppleNum,

		jwt.RegisteredClaims{
			ExpiresAt: tkData.ExpiresAt,
		},
	})

	return t.SignedString([]byte(k))
}

func ParseProjectToken(tokenStr string) (*jwt.Token, error) {
	var (
		t *jwt.Token
		k = os.Getenv("JWT_SECRET")
	)

	t, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signing method %v", t.Header["alg"])
		}

		return []byte(k), nil
	})

	if err != nil {
		return nil, err
	}

	return t, nil
}
