-- Corrects the registered address shown in the contact section, legal pages, receipts and ID cards.
-- The live site reads contact details from site_content, so the stored value is updated here rather
-- than in src/content/default-content.json (editing that file would change migration 002's checksum).
-- A migration runs once, so an address an administrator saves in Settings later is not overwritten.
UPDATE site_content
SET content = jsonb_set(
      content,
      '{contact,address}',
      to_jsonb('H.No 01 second floor VPO, KULERI HISAR, Kuleri, Hisar, Hisar- 125047, Haryana'::text)
    ),
    revision = revision + 1,
    updated_at = now()
WHERE id = 'main'
  AND content #>> '{contact,address}' IS DISTINCT FROM 'H.No 01 second floor VPO, KULERI HISAR, Kuleri, Hisar, Hisar- 125047, Haryana';

INSERT INTO site_content_revisions (site_id, revision, schema_version, content, changed_at)
SELECT id, revision, schema_version, content, updated_at
FROM site_content
WHERE id = 'main'
ON CONFLICT (site_id, revision) DO NOTHING;
