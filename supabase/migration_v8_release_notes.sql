-- ============================================================
-- Migration v8 — Release Notes Tracking
-- Im Supabase SQL-Editor ausführen
-- ============================================================

-- Tabelle für Release Notes Views (User-Tracking)
CREATE TABLE IF NOT EXISTS release_notes_views (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID,
  version         TEXT NOT NULL,
  viewed_at       TIMESTAMPTZ DEFAULT NOW(),
  dismissed_at    TIMESTAMPTZ,
  is_new          BOOLEAN DEFAULT true,
  helpful_rating  INTEGER CHECK (helpful_rating IS NULL OR helpful_rating BETWEEN 1 AND 5),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle User + Version Abfragen
CREATE INDEX IF NOT EXISTS idx_release_notes_views_user_version
  ON release_notes_views(user_id, version);

CREATE INDEX IF NOT EXISTS idx_release_notes_views_user_is_new
  ON release_notes_views(user_id, is_new);

-- Comment für Dokumentation
COMMENT ON TABLE release_notes_views IS 'Tracks which users have viewed which release notes versions';
COMMENT ON COLUMN release_notes_views.version IS 'Semantic version string (e.g., "0.2.0")';
COMMENT ON COLUMN release_notes_views.is_new IS 'Whether the user has marked this as read';
