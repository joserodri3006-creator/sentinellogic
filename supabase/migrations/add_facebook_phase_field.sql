-- Add facebook_phase field to contacts table
ALTER TABLE contacts ADD COLUMN facebook_phase TEXT;

CREATE INDEX idx_contacts_facebook_phase ON contacts(facebook_phase);
