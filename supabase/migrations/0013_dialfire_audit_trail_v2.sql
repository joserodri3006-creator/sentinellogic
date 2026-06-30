-- Migration v2: Dialfire Audit Trail (SIMPLIFIED)
-- Created: 2026-06-30

-- TABLE 1: dialfire_sync_log (Audit Trail)
CREATE TABLE IF NOT EXISTS dialfire_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  dialfire_id VARCHAR NOT NULL,
  sync_timestamp TIMESTAMP DEFAULT NOW(),
  sync_status VARCHAR DEFAULT 'success',
  changed_fields JSONB,
  changes JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dialfire_sync_contact ON dialfire_sync_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_dialfire_sync_timestamp ON dialfire_sync_log(sync_timestamp DESC);

---

-- TABLE 2: dialfire_sync_snapshots (Before/After State)
CREATE TABLE IF NOT EXISTS dialfire_sync_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  dialfire_id VARCHAR NOT NULL,
  before_snapshot JSONB,
  dialfire_flat_view JSONB,
  after_snapshot JSONB,
  snapshot_timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dialfire_snapshots_contact ON dialfire_sync_snapshots(contact_id);

---

-- TABLE 3: contact_notes_history (Versioned Notes)
CREATE TABLE IF NOT EXISTS contact_notes_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source VARCHAR DEFAULT 'manual',
  source_metadata JSONB,
  version INT DEFAULT 1,
  created_by VARCHAR DEFAULT 'system',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_notes_contact ON contact_notes_history(contact_id);

---

-- ADD FIELDS TO contacts TABLE (Safe: IF NOT EXISTS checks)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dialfire_id VARCHAR UNIQUE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dialfire_campaign_id VARCHAR;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dialfire_task_name_field VARCHAR;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dialfire_last_call_at TIMESTAMP;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dialfire_last_call_status VARCHAR;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dialfire_call_duration INT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dialfire_retry_count INT DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dialfire_disposition VARCHAR;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dialfire_updated_at TIMESTAMP;

---

-- CREATE INDEXES ON CONTACTS
CREATE INDEX IF NOT EXISTS idx_contacts_dialfire_id ON contacts(dialfire_id);
CREATE INDEX IF NOT EXISTS idx_contacts_dialfire_campaign ON contacts(dialfire_campaign_id);

---

-- VIEW: Latest Sync Info
DROP VIEW IF EXISTS v_dialfire_latest_sync;
CREATE VIEW v_dialfire_latest_sync AS
SELECT
  c.id as contact_id,
  c.dialfire_id,
  c.dialfire_campaign_id,
  c.first_name,
  c.last_name,
  c.email,
  c.dialfire_last_call_at,
  c.dialfire_last_call_status,
  c.dialfire_retry_count,
  (SELECT json_build_object('id', id, 'sync_timestamp', sync_timestamp, 'sync_status', sync_status, 'changed_fields', changed_fields)
   FROM dialfire_sync_log
   WHERE contact_id = c.id
   ORDER BY sync_timestamp DESC LIMIT 1) as latest_sync
FROM contacts c
WHERE c.dialfire_id IS NOT NULL;
