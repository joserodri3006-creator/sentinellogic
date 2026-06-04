-- ============================================================
-- Migration v4 — 'manuell' zu lead_source Enum hinzufügen
-- Im Supabase SQL-Editor ausführen
-- HINWEIS: ALTER TYPE ... ADD VALUE kann nicht in einer Transaktion
-- ausgeführt werden — direkt im SQL-Editor (nicht in einem BEGIN/COMMIT Block)
-- ============================================================

alter type lead_source add value if not exists 'manuell';
