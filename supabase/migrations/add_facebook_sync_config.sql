-- Facebook Sync Configuration Table
CREATE TABLE facebook_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT false,
  interval_type TEXT DEFAULT '15min' CHECK (interval_type IN ('15min', '30min', '60min', 'daily', 'weekly')),
  daily_hour INT DEFAULT 8,  -- UTC hour for daily (0-23)
  weekly_day INT DEFAULT 1,  -- weekday for weekly (0=Sunday, 1=Monday, etc.)
  weekly_hour INT DEFAULT 8, -- UTC hour for weekly (0-23)
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure only one config entry (one-to-one relationship)
CREATE UNIQUE INDEX idx_facebook_sync_config_single ON facebook_sync_config ((1)) WHERE id IS NOT NULL;

-- Insert default config
INSERT INTO facebook_sync_config (enabled, interval_type, daily_hour, weekly_day, weekly_hour)
VALUES (false, '15min', 8, 1, 8)
ON CONFLICT DO NOTHING;
