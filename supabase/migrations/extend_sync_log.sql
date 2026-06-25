-- Extend sync_log table with detailed error and duplicate tracking
ALTER TABLE sync_log
  ADD COLUMN error_details JSONB DEFAULT '[]',  -- Array of {lead_id, email, error_message}
  ADD COLUMN duplicate_details JSONB DEFAULT '[]';  -- Array of {facebook_id, email, existing_contact_id, action}

-- Add index for faster queries
CREATE INDEX idx_sync_log_source_created ON sync_log(source, created_at DESC);
