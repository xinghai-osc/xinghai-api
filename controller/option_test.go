package controller

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewAnnouncementEmailItemsOnlyReturnsAddedItems(t *testing.T) {
	oldRaw := `[
		{"content":"existing","extra":"old extra","publishDate":"2026-06-19T00:00:00Z","type":"default"},
		{"content":"duplicate","publishDate":"2026-06-19T00:00:00Z","type":"warning"}
	]`
	newRaw := `[
		{"content":"existing","extra":"old extra","publishDate":"2026-06-19T00:00:00Z","type":"default"},
		{"content":"duplicate","publishDate":"2026-06-19T00:00:00Z","type":"warning"},
		{"content":"new announcement","extra":"details","publishDate":"2026-06-20T00:00:00Z","type":"success"}
	]`

	items := newAnnouncementEmailItems(oldRaw, newRaw)

	require.Len(t, items, 1)
	assert.Equal(t, "new announcement", items[0].Content)
	assert.Equal(t, "details", items[0].Extra)
	assert.Equal(t, "2026-06-20T00:00:00Z", items[0].PublishDate)
	assert.Equal(t, "success", items[0].Type)
}

func TestNewAnnouncementEmailItemsHandlesDuplicateAnnouncements(t *testing.T) {
	oldRaw := `[{"content":"same","publishDate":"2026-06-19T00:00:00Z","type":"default"}]`
	newRaw := `[
		{"content":"same","publishDate":"2026-06-19T00:00:00Z","type":"default"},
		{"content":"same","publishDate":"2026-06-19T00:00:00Z","type":"default"}
	]`

	items := newAnnouncementEmailItems(oldRaw, newRaw)

	require.Len(t, items, 1)
	assert.Equal(t, "same", items[0].Content)
}
