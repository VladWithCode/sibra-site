// Package meta reports conversions to Meta's Conversions API, the server-side
// companion of the browser Pixel. Events sent with the same event ID as the
// browser event are deduplicated by Meta.
package meta

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

const (
	// PixelID is the website's Meta Pixel (same ID as frontend/src/lib/metaPixel.ts).
	PixelID = "441188577077416"

	EnvVarAccessToken   = "META_CAPI_ACCESS_TOKEN"
	EnvVarTestEventCode = "META_CAPI_TEST_EVENT_CODE"
)

var (
	eventsURL  = "https://graph.facebook.com/v24.0/" + PixelID + "/events"
	httpClient = &http.Client{Timeout: 10 * time.Second}
)

// Lead describes one lead submitted through a website form.
type Lead struct {
	EventID   string
	SourceURL string
	IP        string
	UserAgent string
	Fbp       string // _fbp cookie
	Fbc       string // _fbc cookie
	Phone     string
	Name      string
}

// SendLead reports a Lead event. It is a no-op when META_CAPI_ACCESS_TOKEN is
// not set, so the site works without Conversions API credentials.
func SendLead(lead Lead) error {
	token := os.Getenv(EnvVarAccessToken)
	if token == "" {
		return nil
	}

	payload := map[string]any{"data": []any{leadEvent(lead, time.Now())}}
	if code := os.Getenv(EnvVarTestEventCode); code != "" {
		payload["test_event_code"] = code
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, eventsURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	res, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		msg, _ := io.ReadAll(io.LimitReader(res.Body, 1024))
		return fmt.Errorf("meta conversions api: status %d: %s", res.StatusCode, msg)
	}
	return nil
}

func leadEvent(lead Lead, now time.Time) map[string]any {
	userData := map[string]any{}
	set := func(key, value string) {
		if value != "" {
			userData[key] = value
		}
	}
	setHashed := func(key, value string) {
		if value != "" {
			userData[key] = []string{hash(value)}
		}
	}

	set("client_ip_address", lead.IP)
	set("client_user_agent", lead.UserAgent)
	set("fbp", lead.Fbp)
	set("fbc", lead.Fbc)
	setHashed("ph", normalizePhone(lead.Phone))
	first, last, _ := strings.Cut(strings.ToLower(strings.TrimSpace(lead.Name)), " ")
	setHashed("fn", first)
	setHashed("ln", strings.TrimSpace(last))

	event := map[string]any{
		"event_name":    "Lead",
		"event_time":    now.Unix(),
		"action_source": "website",
		"user_data":     userData,
	}
	if lead.EventID != "" {
		event["event_id"] = lead.EventID
	}
	if lead.SourceURL != "" {
		event["event_source_url"] = lead.SourceURL
	}
	return event
}

// normalizePhone returns digits only with country code. The forms take
// 10-digit Mexican numbers, so those get the 52 prefix.
func normalizePhone(phone string) string {
	digits := strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, phone)
	if len(digits) == 10 {
		return "52" + digits
	}
	return digits
}

func hash(s string) string {
	return fmt.Sprintf("%x", sha256.Sum256([]byte(s)))
}
