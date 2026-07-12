package model

import (
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestLogQueryIndexesAreMigrated(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:log-indexes?mode=memory&cache=shared"), &gorm.Config{})
	require.NoError(t, err)

	require.NoError(t, db.AutoMigrate(&Log{}))
	migrator := db.Migrator()
	require.True(t, migrator.HasIndex(&Log{}, "idx_logs_user_created_at_id"))
	require.True(t, migrator.HasIndex(&Log{}, "idx_logs_type_created_at"))
}
