package templates

import "github.com/google/uuid"

// Map of [fieldName]: validateMsg fields of a form
type InvalidFields map[string]string

const DEFAULT_FIELD_VALIDATE_MSG = "Campo invalido. Corrige el valor proporcionado"

func CmpStr(str1, str2 string) bool {
	return str1 == str2
}

func SelectClassName(condition bool, cn1, cn2 string) string {
	if condition {
		return cn1
	}

	return cn2
}

func NewUUID() string {
	return uuid.NewString()
}
