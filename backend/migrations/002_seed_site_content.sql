-- The migration runner replaces the token below with the validated, versioned
-- JSON document in src/content/default-content.json and includes that document
-- in this migration's checksum.
INSERT INTO site_content (id, schema_version, content, published, revision)
VALUES ('main', 2, /*__DEFAULT_CONTENT_JSON__*/::jsonb, true, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO site_content_revisions (site_id, revision, schema_version, content, changed_at)
SELECT id, revision, schema_version, content, updated_at
FROM site_content
WHERE id = 'main'
ON CONFLICT (site_id, revision) DO NOTHING;
