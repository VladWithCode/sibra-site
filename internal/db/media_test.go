package db_test

import (
	"context"
	"errors"
	"testing"

	"github.com/vladwithcode/sibra-site/internal/db"
)

// createMediaTestProperty inserts a draft property and removes it (and its
// media) when the test ends.
func createMediaTestProperty(t *testing.T) string {
	t.Helper()
	agent := &db.User{Id: db.NewMediaID(), Fullname: "Media Test", Username: "mt-" + db.NewMediaID()[24:],
		Password: "x", Role: db.RoleEditor, Email: db.NewMediaID() + "@example.test"}
	if _, err := db.CreateUser(agent); err != nil {
		t.Fatalf("CreateUser: %v", err)
	}
	prop := &db.Property{
		Id: db.NewMediaID(), Agent: agent.Id, Address: "Media Test 1", City: "Durango", State: "Durango",
		Zip: "34000", Country: "México", PropertyType: "casa", Contract: "venta",
		Status: db.PropertyStatusDraft,
	}
	if err := db.CreateProperty(prop); err != nil {
		t.Fatalf("CreateProperty: %v", err)
	}
	t.Cleanup(func() {
		ctx := context.Background()
		_, _ = db.DB.Exec(ctx, `
			WITH gone AS (DELETE FROM property_media WHERE property_id = $1 RETURNING asset_id)
			DELETE FROM media_assets WHERE id IN (SELECT asset_id FROM gone)`, prop.Id)
		_, _ = db.DB.Exec(ctx, `DELETE FROM properties WHERE id = $1`, prop.Id)
		_, _ = db.DB.Exec(ctx, `DELETE FROM users WHERE id = $1`, agent.Id)
	})
	return prop.Id
}

func TestPropertyMediaLifecycle(t *testing.T) {
	connectTestDB(t)
	ctx := context.Background()
	propID := createMediaTestProperty(t)

	img, vid1, vid2 := db.NewMediaID(), db.NewMediaID(), db.NewMediaID()
	items, err := db.AddPropertyMedia(ctx, propID, []db.NewMediaUpload{
		{AssetID: img, Kind: "image"}, {AssetID: vid1, Kind: "video"}, {AssetID: vid2, Kind: "video"},
	})
	if err != nil {
		t.Fatalf("AddPropertyMedia: %v", err)
	}
	if len(items) != 3 || items[2].Position != 2 {
		t.Fatalf("unexpected items %+v", items)
	}

	// Appending continues positions.
	more, err := db.AddPropertyMedia(ctx, propID, []db.NewMediaUpload{{AssetID: db.NewMediaID(), Kind: "image"}})
	if err != nil || more[0].Position != 3 {
		t.Fatalf("append: %+v %v", more, err)
	}

	// Cover: images rejected, one video at a time.
	if err := db.SetPropertyCover(ctx, propID, items[0].ID, true); !errors.Is(err, db.ErrMediaCoverKind) {
		t.Errorf("image cover: got %v", err)
	}
	if err := db.SetPropertyCover(ctx, propID, items[1].ID, true); err != nil {
		t.Fatal(err)
	}
	if err := db.SetPropertyCover(ctx, propID, items[2].ID, true); err != nil {
		t.Fatal(err)
	}
	state, err := db.GetPropertyMediaState(ctx, propID)
	if err != nil {
		t.Fatal(err)
	}
	covers := 0
	for _, m := range state.Media {
		if m.IsCover {
			covers++
			if m.ID != items[2].ID {
				t.Errorf("wrong cover %s", m.ID)
			}
		}
	}
	if covers != 1 {
		t.Errorf("covers = %d", covers)
	}

	// Reorder must list every item exactly once.
	if err := db.ReorderPropertyMedia(ctx, propID, []string{items[0].ID}); !errors.Is(err, db.ErrMediaOrderSet) {
		t.Errorf("partial order: %v", err)
	}
	order := []string{more[0].ID, items[2].ID, items[1].ID, items[0].ID}
	if err := db.ReorderPropertyMedia(ctx, propID, order); err != nil {
		t.Fatal(err)
	}
	state, _ = db.GetPropertyMediaState(ctx, propID)
	for i, m := range state.Media {
		if m.ID != order[i] {
			t.Fatalf("order[%d] = %s, want %s", i, m.ID, order[i])
		}
	}

	// Worker lifecycle: claim, fail with retry, complete.
	claimed, err := db.ClaimPendingMediaAsset(ctx, "video")
	if err != nil || claimed == nil {
		t.Fatalf("claim: %v %v", claimed, err)
	}
	final, err := db.FailMediaAssetAttempt(ctx, claimed.ID, "boom")
	if err != nil || final {
		t.Fatalf("first failure should retry: final=%v err=%v", final, err)
	}
	ok, err := db.CompleteMediaAsset(ctx, claimed.ID, 1920, 1080, 6000, true, db.MediaVariants{Videos: []int{1080, 720}, Poster: []int{480}})
	if err != nil || !ok {
		t.Fatalf("complete: %v %v", ok, err)
	}
	a, err := db.GetMediaAsset(ctx, claimed.ID)
	if err != nil || a.Status != db.MediaStatusReady || a.Variants.Videos[0] != 1080 || a.Error != "" {
		t.Fatalf("asset after complete: %+v %v", a, err)
	}

	// Delete removes the item and its asset; completing a deleted asset reports false.
	assetID, err := db.DeletePropertyMedia(ctx, propID, items[0].ID)
	if err != nil || assetID != img {
		t.Fatalf("delete: %s %v", assetID, err)
	}
	if ok, err := db.CompleteMediaAsset(ctx, img, 1, 1, 0, false, db.MediaVariants{}); err != nil || ok {
		t.Errorf("complete deleted: ok=%v err=%v", ok, err)
	}
	if _, err := db.DeletePropertyMedia(ctx, propID, items[0].ID); !errors.Is(err, db.ErrMediaNotFound) {
		t.Errorf("double delete: %v", err)
	}
}

func TestNamedImagesOnlyReferenceOwnImages(t *testing.T) {
	connectTestDB(t)
	ctx := context.Background()
	propID := createMediaTestProperty(t)
	otherID := createMediaTestProperty(t)

	items, err := db.AddPropertyMedia(ctx, propID, []db.NewMediaUpload{
		{AssetID: db.NewMediaID(), Kind: "image"}, {AssetID: db.NewMediaID(), Kind: "video"},
	})
	if err != nil {
		t.Fatal(err)
	}
	foreign, err := db.AddPropertyMedia(ctx, otherID, []db.NewMediaUpload{{AssetID: db.NewMediaID(), Kind: "image"}})
	if err != nil {
		t.Fatal(err)
	}

	prop, err := db.FindPropertyById(ctx, propID)
	if err != nil {
		t.Fatal(err)
	}
	prop.NamedImages = []db.PropertyNamedImage{
		{Category: "interior", MediaID: items[0].ID, Caption: "ok"},
		{Category: "interior", MediaID: items[1].ID, Caption: "video"},
		{Category: "interior", MediaID: foreign[0].ID, Caption: "foreign"},
		{Category: "interior", MediaID: "not-a-uuid", Caption: "junk"},
	}
	if err := db.UpdateProperty(prop); err != nil {
		t.Fatal(err)
	}
	var n int
	if err := db.DB.QueryRow(ctx, `SELECT count(*) FROM property_named_images WHERE property_id = $1`, propID).Scan(&n); err != nil {
		t.Fatal(err)
	}
	if n != 1 {
		t.Errorf("named images stored = %d, want 1", n)
	}
}
