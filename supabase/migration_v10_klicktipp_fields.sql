-- ============================================================
-- Migration v10 — KlickTipp Integration Fields
-- ============================================================
-- Zweck: Speichern von KlickTipp Synchronisierungsdaten
-- - klicktipp_tags: Array of tags synced to KlickTipp
-- - klicktipp_last_sync: Zeitstempel der letzten erfolgreichen Sync
-- ============================================================

-- 1. Spalten zu contacts Tabelle hinzufügen
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS klicktipp_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS klicktipp_last_sync TIMESTAMPTZ;

-- 2. Index auf klicktipp_id hinzufügen (falls noch nicht vorhanden)
CREATE INDEX IF NOT EXISTS idx_contacts_klicktipp_id ON public.contacts(klicktipp_id);

-- 3. Index auf klicktipp_last_sync für Queries nach unsychronisierten Kontakten
CREATE INDEX IF NOT EXISTS idx_contacts_klicktipp_last_sync ON public.contacts(klicktipp_last_sync DESC);

-- 4. Comment hinzufügen für Dokumentation
COMMENT ON COLUMN public.contacts.klicktipp_id IS 'KlickTipp Subscriber ID (externe Integration)';
COMMENT ON COLUMN public.contacts.klicktipp_tags IS 'Array of tags synced to KlickTipp (z.B. ["csv-import", "kalt-akquise"])';
COMMENT ON COLUMN public.contacts.klicktipp_last_sync IS 'Zeitstempel der letzten erfolgreichen Sync zu KlickTipp';

-- ============================================================
-- Migration Verification Queries
-- ============================================================
-- Um diese Migration zu verifizieren, führe in der Supabase SQL Console aus:
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'contacts' AND column_name LIKE 'klicktipp%';
--
-- Expected output:
-- | column_name         | data_type | is_nullable |
-- |-------------------|-----------|------------|
-- | klicktipp_id      | text      | YES        |
-- | klicktipp_tags    | text[]    | YES        |
-- | klicktipp_last_sync| timestamptz| YES        |
-- ============================================================
