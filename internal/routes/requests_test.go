package routes

import "testing"

func TestLeadContactError(t *testing.T) {
	for _, tc := range []struct {
		name, phone  string
		nameRequired bool
		valid        bool
	}{
		{"Ana", "6181594681", true, true},
		{"Ana", "618 159 4681", true, true},
		{"", "6181594681", false, true},
		{"", "6181594681", true, false},
		{"   ", "6181594681", true, false},
		{"Ana", "", true, false},
		{"Ana", "618159468", true, false},
		{"Ana", "abcdefghij", true, false},
	} {
		got := leadContactError(tc.name, tc.phone, tc.nameRequired)
		if (got == "") != tc.valid {
			t.Errorf("leadContactError(%q, %q, %v) = %q, want valid=%v",
				tc.name, tc.phone, tc.nameRequired, got, tc.valid)
		}
	}
}
