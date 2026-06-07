-- ============================================================
-- Migration v7 — Kontakte mit 12-Schritt-Pipeline
-- Im Supabase SQL-Editor ausführen
-- ============================================================

-- Erweitere contacts-Tabelle mit Pipeline-Spalten
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'lead_in',
  ADD COLUMN IF NOT EXISTS pipeline_steps JSONB DEFAULT '[]';

-- Index für häufige Pipeline-Abfragen
CREATE INDEX IF NOT EXISTS contacts_pipeline_stage_idx ON contacts(pipeline_stage);

-- Initialisiere pipeline_steps für bestehende Kontakte
UPDATE contacts
SET pipeline_steps = jsonb_build_array(
  jsonb_build_object('key', 'lead_in', 'done', false, 'completed_at', NULL::text, 'due_date', NULL::text),
  jsonb_build_object('key', 'contacted', 'done', false, 'completed_at', NULL::text, 'due_date', NULL::text),
  jsonb_build_object('key', 'data_gathering', 'done', false, 'completed_at', NULL::text, 'due_date', NULL::text),
  jsonb_build_object('key', 'wait_policies', 'done', false, 'completed_at', NULL::text, 'due_date', NULL::text),
  jsonb_build_object('key', 'calc_offers', 'done', false, 'completed_at', NULL::text, 'due_date', NULL::text),
  jsonb_build_object('key', 'download_offers', 'done', false, 'completed_at', NULL::text, 'due_date', NULL::text),
  jsonb_build_object('key', 'contract_overview', 'done', false, 'completed_at', NULL::text, 'due_date', NULL::text),
  jsonb_build_object('key', 'send_offers', 'done', false, 'completed_at', NULL::text, 'due_date', NULL::text),
  jsonb_build_object('key', 'offer_meeting', 'done', false, 'completed_at', NULL::text, 'due_date', NULL::text),
  jsonb_build_object('key', 'sales_talk', 'done', false, 'completed_at', NULL::text, 'due_date', NULL::text),
  jsonb_build_object('key', 'contracts_store', 'done', false, 'completed_at', NULL::text, 'due_date', NULL::text),
  jsonb_build_object('key', 'aftercare', 'done', false, 'completed_at', NULL::text, 'due_date', NULL::text)
)
WHERE pipeline_steps = '[]' OR pipeline_steps IS NULL;
