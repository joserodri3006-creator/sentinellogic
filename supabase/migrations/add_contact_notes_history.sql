-- Create enum types
CREATE TYPE note_type AS ENUM ('manual', 'system', 'dialfire_sync', 'activity');
CREATE TYPE note_category AS ENUM ('general', 'dialfire', 'klicktipp', 'internal', 'follow_up', 'call', 'email', 'meeting');

-- Create contact_notes_history table
CREATE TABLE contact_notes_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type note_type NOT NULL DEFAULT 'manual',
  category note_category NOT NULL DEFAULT 'general',
  created_by TEXT DEFAULT 'system', -- User ID or "system"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',

  -- Constraints
  CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- Create indexes for performance
CREATE INDEX idx_contact_notes_contact_id ON contact_notes_history(contact_id);
CREATE INDEX idx_contact_notes_created_at ON contact_notes_history(created_at DESC);
CREATE INDEX idx_contact_notes_type ON contact_notes_history(type);
CREATE INDEX idx_contact_notes_archived ON contact_notes_history(is_archived);

-- Create composite index for common queries
CREATE INDEX idx_contact_notes_lookup
  ON contact_notes_history(contact_id, is_archived, created_at DESC);

-- Enable RLS
ALTER TABLE contact_notes_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see all notes for contacts they have access to
CREATE POLICY "Users can view contact notes"
  ON contact_notes_history FOR SELECT
  USING (true);

CREATE POLICY "Users can insert contact notes"
  ON contact_notes_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update contact notes"
  ON contact_notes_history FOR UPDATE
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_contact_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_notes_updated_at_trigger
BEFORE UPDATE ON contact_notes_history
FOR EACH ROW
EXECUTE FUNCTION update_contact_notes_updated_at();
