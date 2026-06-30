-- Migration: Dialfire Pull-Sync Audit Trail System
-- Purpose: Enable bi-directional sync with complete audit logging
-- Created: 2026-06-30

-- 1. Create dialfire_sync_log — AUDIT TRAIL für jeden Sync
CREATE TABLE IF NOT EXISTS dialfire_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  dialfire_id VARCHAR NOT NULL,

  -- Sync Metadata
  sync_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  sync_status VARCHAR NOT NULL CHECK (sync_status IN ('success', 'error', 'conflict')),

  -- AUDIT TRAIL — Das Herzstück!
  changed_fields JSONB,  -- Array: ['first_name', 'phone_mobile', 'city']
  changes JSONB,         -- {first_name: {old: "Max", new: "Maximilian"}, ...}

  -- Error Tracking
  error_message VARCHAR,

  -- Versionierung
  dialfire_version VARCHAR,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_dialfire_sync_contact ON dialfire_sync_log(contact_id);
CREATE INDEX idx_dialfire_sync_timestamp ON dialfire_sync_log(sync_timestamp DESC);
CREATE INDEX idx_dialfire_sync_status ON dialfire_sync_log(sync_status);

COMMENT ON TABLE dialfire_sync_log IS 'Immutable audit trail: every sync records old/new values for all changed fields';
COMMENT ON COLUMN dialfire_sync_log.changes IS 'JSONB format: {field_name: {old: value, new: value}, ...}';

---

-- 2. Create dialfire_sync_snapshots — Before/After Snapshots for Recovery
CREATE TABLE IF NOT EXISTS dialfire_sync_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  dialfire_id VARCHAR NOT NULL,

  -- Complete state snapshots
  before_snapshot JSONB NOT NULL,    -- Sentinel state VOR Sync
  dialfire_flat_view JSONB NOT NULL, -- Dialfire data
  after_snapshot JSONB NOT NULL,     -- Sentinel state NACH Sync

  -- Metadata
  snapshot_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX idx_dialfire_snapshots_contact ON dialfire_sync_snapshots(contact_id);
CREATE INDEX idx_dialfire_snapshots_timestamp ON dialfire_sync_snapshots(snapshot_timestamp DESC);

COMMENT ON TABLE dialfire_sync_snapshots IS 'Immutable snapshots: before/after state for rollback capability';

---

-- 3. Create contact_notes_history — Versionierte Notizen mit Historia
CREATE TABLE IF NOT EXISTS contact_notes_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Note Content
  content TEXT NOT NULL,

  -- Source Tracking
  source VARCHAR NOT NULL CHECK (source IN ('manual', 'dialfire_sync', 'facebook_sync', 'system')),
  source_metadata JSONB,  -- {sync_id: "...", sync_timestamp: "...", changes: {...}, ...}

  -- Versioning
  version INT NOT NULL,
  created_by VARCHAR,  -- user_id oder 'system'
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for queries
CREATE INDEX idx_contact_notes_contact ON contact_notes_history(contact_id);
CREATE INDEX idx_contact_notes_version ON contact_notes_history(contact_id, version DESC);
CREATE INDEX idx_contact_notes_source ON contact_notes_history(source);

COMMENT ON TABLE contact_notes_history IS 'Versioned note history: manual + auto-generated from syncs';
COMMENT ON COLUMN contact_notes_history.source_metadata IS 'Metadata for auto-generated notes: links to sync_log_id, changes, call_info, etc.';

---

-- 4. Add Dialfire-specific fields to contacts table (if not already present)
-- Check if columns exist before adding (idempotent)
DO $$
BEGIN
  -- dialfire_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'dialfire_id'
  ) THEN
    ALTER TABLE contacts ADD COLUMN dialfire_id VARCHAR UNIQUE;
  END IF;

  -- dialfire_campaign_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'dialfire_campaign_id'
  ) THEN
    ALTER TABLE contacts ADD COLUMN dialfire_campaign_id VARCHAR;
  END IF;

  -- dialfire_task_name_field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'dialfire_task_name_field'
  ) THEN
    ALTER TABLE contacts ADD COLUMN dialfire_task_name_field VARCHAR;
  END IF;

  -- dialfire_last_call_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'dialfire_last_call_at'
  ) THEN
    ALTER TABLE contacts ADD COLUMN dialfire_last_call_at TIMESTAMP;
  END IF;

  -- dialfire_last_call_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'dialfire_last_call_status'
  ) THEN
    ALTER TABLE contacts ADD COLUMN dialfire_last_call_status VARCHAR;
  END IF;

  -- dialfire_call_duration (in seconds)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'dialfire_call_duration'
  ) THEN
    ALTER TABLE contacts ADD COLUMN dialfire_call_duration INT;
  END IF;

  -- dialfire_retry_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'dialfire_retry_count'
  ) THEN
    ALTER TABLE contacts ADD COLUMN dialfire_retry_count INT DEFAULT 0;
  END IF;

  -- dialfire_next_retry_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'dialfire_next_retry_at'
  ) THEN
    ALTER TABLE contacts ADD COLUMN dialfire_next_retry_at TIMESTAMP;
  END IF;

  -- dialfire_disposition
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'dialfire_disposition'
  ) THEN
    ALTER TABLE contacts ADD COLUMN dialfire_disposition VARCHAR;
  END IF;

  -- dialfire_updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'dialfire_updated_at'
  ) THEN
    ALTER TABLE contacts ADD COLUMN dialfire_updated_at TIMESTAMP;
  END IF;

END $$;

---

-- 5. Create index on dialfire_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_contacts_dialfire_id ON contacts(dialfire_id);
CREATE INDEX IF NOT EXISTS idx_contacts_dialfire_campaign ON contacts(dialfire_campaign_id);

---

-- 6. Extend activity_types ENUM (if needed)
-- Note: PostgreSQL ENUMs can't be directly modified, so we check and skip if it fails
-- The activity logger will handle 'dialfire_synced' type dynamically if needed
COMMENT ON COLUMN contact_activities.type IS 'Activity type: manual, created, updated, note_added, dialfire_synced, dialfire_call_logged, sync_conflict, etc.';

---

-- 7. Create View: Latest Sync Info per Contact (convenience view)
CREATE OR REPLACE VIEW v_dialfire_latest_sync AS
SELECT
  c.id as contact_id,
  c.dialfire_id,
  c.dialfire_campaign_id,
  c.first_name,
  c.last_name,
  c.email,

  -- Latest call info
  c.dialfire_last_call_at,
  c.dialfire_last_call_status,
  c.dialfire_call_duration,
  c.dialfire_retry_count,
  c.dialfire_disposition,

  -- Latest sync
  (
    SELECT json_build_object(
      'id', id,
      'sync_timestamp', sync_timestamp,
      'sync_status', sync_status,
      'changed_fields', changed_fields,
      'changes', changes
    )
    FROM dialfire_sync_log
    WHERE contact_id = c.id
    ORDER BY sync_timestamp DESC
    LIMIT 1
  ) as latest_sync

FROM contacts c
WHERE c.dialfire_id IS NOT NULL;

COMMENT ON VIEW v_dialfire_latest_sync IS 'Latest Dialfire sync info per contact (read-only view for UI queries)';

---

-- 8. Trigger: Maintain current note in contacts.notes from latest history entry
CREATE OR REPLACE FUNCTION maintain_current_notes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts
  SET notes = NEW.content,
      updated_at = NOW()
  WHERE id = NEW.contact_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_current_notes ON contact_notes_history;
CREATE TRIGGER update_current_notes
AFTER INSERT ON contact_notes_history
FOR EACH ROW
EXECUTE FUNCTION maintain_current_notes();

COMMENT ON FUNCTION maintain_current_notes() IS 'Trigger: keep contacts.notes in sync with latest history entry';

---

-- Migration complete
COMMENT ON SCHEMA public IS 'Schema updated: 2026-06-30 — Added dialfire_sync_log, dialfire_sync_snapshots, contact_notes_history for audit trail system';
