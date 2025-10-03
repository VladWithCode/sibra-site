package auth

import (
	"errors"
	"fmt"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrMalformedProjectTokenClaims = errors.New("project access token claims are malformed")
	ErrInvalidProjectToken         = errors.New("project access token is invalid")
)

type ProjectAccessClaims struct {
	ProjectID   string
	AssociateID string
	IDCode      string
	LotNum      string
	AppleNum    string

	jwt.RegisteredClaims
}

type ProjectAccessTokenData struct {
	ProjectID   string
	AssociateID string
	IDCode      string
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
		tkData.IDCode,
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

func ExtractProjectAccessDataFromToken(tk *jwt.Token) (*ProjectAccessTokenData, error) {
	if claims, ok := tk.Claims.(jwt.MapClaims); ok && tk.Valid {
		var (
			projectID, pidOk   = claims["ProjectID"].(string)
			associateID, aidOk = claims["AssociateID"].(string)
			idcode, icOk       = claims["IDCode"].(string)
			lotNum, lnOk       = claims["LotNum"].(string)
			appleNum, anOk     = claims["AppleNum"].(string)
		)

		if !pidOk || !aidOk || !lnOk || !anOk || !icOk {
			return nil, ErrMalformedProjectTokenClaims
		}

		return &ProjectAccessTokenData{
			ProjectID:   projectID,
			AssociateID: associateID,
			IDCode:      idcode,
			LotNum:      lotNum,
			AppleNum:    appleNum,
		}, nil
	}

	return nil, ErrInvalidProjectToken
}
