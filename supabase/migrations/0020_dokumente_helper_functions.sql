-- Helper function to update contact dokumente statistics
CREATE OR REPLACE FUNCTION update_kontakt_dokumente_stats(p_kontakt_id UUID)
RETURNS void AS $$
DECLARE
  v_count INTEGER;
  v_total_size INTEGER;
  v_last_upload TIMESTAMP;
BEGIN
  SELECT
    COUNT(*),
    COALESCE(SUM(compressed_size), 0),
    MAX(created_at)
  INTO v_count, v_total_size, v_last_upload
  FROM dokumente_metadata
  WHERE kontakt_id = p_kontakt_id AND ordner_archived = false;

  UPDATE contacts
  SET
    dokumente_count = v_count,
    dokumente_total_size = v_total_size,
    dokumente_last_upload = v_last_upload,
    updated_at = NOW()
  WHERE id = p_kontakt_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stats when dokumente change
CREATE OR REPLACE FUNCTION trigger_update_dokumente_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_kontakt_dokumente_stats(NEW.kontakt_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dokumente_stats_insert ON dokumente_metadata;
CREATE TRIGGER trigger_dokumente_stats_insert
AFTER INSERT ON dokumente_metadata
FOR EACH ROW
EXECUTE FUNCTION trigger_update_dokumente_stats();

DROP TRIGGER IF EXISTS trigger_dokumente_stats_update ON dokumente_metadata;
CREATE TRIGGER trigger_dokumente_stats_update
AFTER UPDATE ON dokumente_metadata
FOR EACH ROW
EXECUTE FUNCTION trigger_update_dokumente_stats();

DROP TRIGGER IF EXISTS trigger_dokumente_stats_delete ON dokumente_metadata;
CREATE TRIGGER trigger_dokumente_stats_delete
AFTER DELETE ON dokumente_metadata
FOR EACH ROW
EXECUTE FUNCTION trigger_update_dokumente_stats();

-- Function to archive contact documents when contact is deleted
CREATE OR REPLACE FUNCTION archive_dokumente_on_contact_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE dokumente_metadata
  SET
    ordner_archived = true,
    kontakt_deleted_at = NOW()
  WHERE kontakt_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Note: Trigger for contact deletion needs to be set in contacts table handling
-- This function is available for manual use when needed
