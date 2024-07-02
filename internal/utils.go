package internal

import (
	"fmt"
	"math/big"
	"regexp"
	"strings"
	"time"

	"github.com/leekchan/accounting"
)

func FormatMoney(amount float64) string {
	bFloat := big.NewFloat(amount)
	ac := accounting.Accounting{Symbol: "$", Precision: 0}

	return ac.FormatMoneyBigFloat(bFloat)
}

func FormatDate(d time.Time) string {
	return d.Format("02/01/2006")
}

func Slugify(inp string) string {
	reg := regexp.MustCompile("[^a-zA-Z0-9]+")

	str := reg.ReplaceAllString(inp, " ")
	str = strings.TrimSpace(str)
	str = strings.ReplaceAll(str, " ", "-")

	str = strings.ToLower(str)
	return str
}

func SetField(m map[string]any, k string, v any) map[string]any {
	m[k] = v
	return m
}

func GetImgSpan(idx int) string {
	isSpan2 := idx%6 == 0 || idx-1%6 == 0
	isSpan3 := idx-2%6 == 0 || idx-3%6 == 0 || idx-4%6 == 0
	isSpanFull := idx-5%6 == 0

	if idx == 0 || idx == 1 || isSpan2 {
		return fmt.Sprintf("col-span-%v", 3)
	}
	if isSpan3 {
		return fmt.Sprintf("col-span-%v", 2)
	}
	if isSpanFull {
		return "col-span-full"
	}

	return ""
}

func PrintRole(r string) string {
	switch r {
	case "user":
		return "Usuario"
	case "editor":
		return "Asesor"
	case "admin":
		return "Administrador"
	default:
		return "N/D"
	}
}

func GetPlainMap(m map[string][]any) map[string]any {
	plainM := map[string]any{}
	for k, v := range m {
		plainM[k] = v[0]
	}

	return plainM
}
