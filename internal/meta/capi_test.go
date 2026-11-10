package meta

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSendLead(t *testing.T) {
	var got map[string]any
	var auth string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth = r.Header.Get("Authorization")
		body, _ := io.ReadAll(r.Body)
		json.Unmarshal(body, &got)
	}))
	defer srv.Close()
	eventsURL = srv.URL

	lead := Lead{EventID: "evt-1", Phone: "618 159 4681", Name: " Martin Felix ", IP: "1.2.3.4"}

	t.Setenv(EnvVarAccessToken, "")
	if err := SendLead(lead); err != nil || got != nil {
		t.Fatalf("without token: want no-op, got err=%v payload=%v", err, got)
	}

	t.Setenv(EnvVarAccessToken, "tok")
	if err := SendLead(lead); err != nil {
		t.Fatal(err)
	}
	if auth != "Bearer tok" {
		t.Errorf("Authorization = %q", auth)
	}
	event := got["data"].([]any)[0].(map[string]any)
	user := event["user_data"].(map[string]any)
	if event["event_name"] != "Lead" || event["event_id"] != "evt-1" {
		t.Errorf("event = %v", event)
	}
	if ph := user["ph"].([]any)[0]; ph != hash("526181594681") {
		t.Errorf("ph = %v", ph)
	}
	if user["fn"].([]any)[0] != hash("martin") || user["ln"].([]any)[0] != hash("felix") {
		t.Errorf("name hashes wrong: %v", user)
	}
	if _, ok := user["fbp"]; ok {
		t.Errorf("empty fbp must be omitted")
	}
}
