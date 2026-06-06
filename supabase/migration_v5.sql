-- ============================================================
-- Migration v5 — Vertriebs-Pipeline (12 Prozessschritte pro Lead)
-- Im Supabase SQL-Editor ausführen
-- ============================================================

-- ── Neue Tabelle: pipeline_stages (Konfigurierbar) ────────────

create table if not exists pipeline_stages (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  position        int not null,                    -- Sortierposition
  key             text not null unique,            -- Stabile ID (z.B. 'lead_in', 'offer_send')
  label           text not null,                   -- Editierbar in UI
  is_optional     bool default false,              -- Optional-Flag für Step 4
  maps_to_status  lead_status not null,            -- Status-Derivation: new|contacted|qualified|customer
  active          bool default true                -- Aktiviert/Deaktiviert
);

-- Index für häufige Abfragen
create index pipeline_stages_position_idx on pipeline_stages(position);
create index pipeline_stages_key_idx on pipeline_stages(key);

-- ── Seed-Daten: 12 Standard-Schritte ────────────────────────

insert into pipeline_stages (position, key, label, is_optional, maps_to_status) values
  (1, 'lead_in', 'Lead kommt rein', false, 'new'),
  (2, 'contacted', 'Lead wird kontaktiert', false, 'contacted'),
  (3, 'data_gathering', 'Daten werden eingeholt', false, 'contacted'),
  (4, 'wait_policies', 'Warten auf Policen', true, 'contacted'),
  (5, 'calc_offers', 'Angebote berechnen', false, 'qualified'),
  (6, 'download_offers', 'Angebote herunterladen & ablegen', false, 'qualified'),
  (7, 'contract_overview', 'Vertragsübersicht erstellen', false, 'qualified'),
  (8, 'send_offers', 'Angebote senden', false, 'qualified'),
  (9, 'offer_meeting', 'Angebotsbesprechung (Termin)', false, 'qualified'),
  (10, 'sales_talk', 'Verkaufsgespräch', false, 'qualified'),
  (11, 'contracts_store', 'Verträge ablegen', false, 'customer'),
  (12, 'aftercare', 'Nachbereitung', false, 'customer');

-- ── Neue Spalten in leads-Tabelle ────────────────────────────

alter table leads
  add column if not exists pipeline_stage text,                         -- Aktueller Schritt-Key
  add column if not exists pipeline_steps jsonb default '[]';           -- [{key, done, completed_at, due_date}]

-- Index für Pipeline-Abfragen
create index if not exists leads_pipeline_stage_idx on leads(pipeline_stage);
