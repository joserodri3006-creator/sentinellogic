-- Add Dialfire integration fields to contacts table
ALTER TABLE public.contacts
ADD COLUMN dialfire_id TEXT,
ADD COLUMN dialfire_external_ref TEXT,
ADD COLUMN dialfire_task_name TEXT,
ADD COLUMN dialfire_updated_at TIMESTAMPTZ,
ADD COLUMN dialfire_sync_error TEXT;

-- Create indexes for Dialfire lookups
CREATE INDEX idx_contacts_dialfire_id ON public.contacts(dialfire_id);
CREATE INDEX idx_contacts_dialfire_external_ref ON public.contacts(dialfire_external_ref);
