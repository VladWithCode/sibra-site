package db_test

import (
	"context"
	"testing"

	"github.com/vladwithcode/sibra-site/internal/db"
)

// createStatusTestProperty inserts a property with the given status at a fixed
// location (so the pair are "nearby") and removes it when the test ends.
func createStatusTestProperty(t *testing.T, agentID string, status db.PropertyStatus) string {
	t.Helper()
	prop := &db.Property{
		Id: db.NewMediaID(), Agent: agentID, Address: "Status Test " + string(status), City: "Durango",
		State: "Durango", Zip: "34000", Country: "México", PropertyType: "casa", Contract: "venta",
		Status: status, Lat: 24.0277, Lon: -104.6532,
	}
	if err := db.CreateProperty(prop); err != nil {
		t.Fatalf("CreateProperty(%s): %v", status, err)
	}
	t.Cleanup(func() {
		_, _ = db.DB.Exec(context.Background(), `DELETE FROM properties WHERE id = $1`, prop.Id)
	})
	return prop.Id
}

func TestPropertyStatusFilteringAndNearby(t *testing.T) {
	connectTestDB(t)
	ctx := context.Background()

	agent := &db.User{Id: db.NewMediaID(), Fullname: "Status Test", Username: "st-" + db.NewMediaID()[24:],
		Password: "x", Role: db.RoleEditor, Email: db.NewMediaID() + "@example.test"}
	if _, err := db.CreateUser(agent); err != nil {
		t.Fatalf("CreateUser: %v", err)
	}
	t.Cleanup(func() { _, _ = db.DB.Exec(context.Background(), `DELETE FROM users WHERE id = $1`, agent.Id) })

	pubA := createStatusTestProperty(t, agent.Id, db.PropertyStatusPublished)
	pubB := createStatusTestProperty(t, agent.Id, db.PropertyStatusPublished)
	draft := createStatusTestProperty(t, agent.Id, db.PropertyStatusDraft)
	ids := []string{pubA, pubB, draft}

	list := func(status *db.PropertyStatus) map[string]bool {
		t.Helper()
		f := db.NewPropertyFilter()
		f.Ids = &ids
		f.Status = status
		props, err := db.GetProperties(ctx, f, 50, 1)
		if err != nil {
			t.Fatalf("GetProperties: %v", err)
		}
		pg, err := db.GetPaginationData(f, 50, 1)
		if err != nil {
			t.Fatalf("GetPaginationData: %v", err)
		}
		if pg.Total != len(props) {
			t.Errorf("pagination total %d != %d returned", pg.Total, len(props))
		}
		got := map[string]bool{}
		for _, p := range props {
			got[p.Id] = true
		}
		return got
	}

	published := db.PropertyStatusPublished
	if got := list(&published); got[draft] || !got[pubA] || !got[pubB] {
		t.Errorf("published filter: got %v", got)
	}
	draftStatus := db.PropertyStatusDraft
	if got := list(&draftStatus); !got[draft] || len(got) != 1 {
		t.Errorf("draft filter: got %v", got)
	}
	if got := list(nil); len(got) != 3 {
		t.Errorf("no status filter (panel): got %v", got)
	}

	nearby, err := db.FindNearbyProperties(pubA, db.NearbyDistanceNormal)
	if err != nil {
		t.Fatalf("FindNearbyProperties: %v", err)
	}
	foundB := false
	for _, p := range nearby {
		if p.Id == draft {
			t.Errorf("nearby returned draft property %s", draft)
		}
		if p.Id == pubB {
			foundB = true
		}
	}
	if !foundB {
		t.Errorf("nearby did not return published neighbour %s", pubB)
	}

	// orderBy is interpolated into SQL; non-whitelisted values must be ignored.
	evil := "(CASE WHEN (SELECT true) THEN price END)"
	f := db.NewPropertyFilter()
	f.Ids = &ids
	f.Status = &published
	f.OrderBy = &evil
	if props, err := db.GetProperties(ctx, f, 50, 1); err != nil || len(props) != 2 {
		t.Errorf("non-whitelisted orderBy: %d props, err %v", len(props), err)
	}
}
