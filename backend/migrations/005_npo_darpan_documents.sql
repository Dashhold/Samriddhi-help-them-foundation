-- Adds the NITI Aayog NPO Darpan registration profile and affidavit to the document centre.
-- The live site reads documents from site_content, so they are appended here rather than in
-- src/content/default-content.json (editing that file would change migration 002's checksum).
-- A document an administrator already added with the same id is left untouched.
WITH additions AS (
  SELECT coalesce(jsonb_agg(doc.item ORDER BY doc.ord), '[]'::jsonb) AS items
  FROM jsonb_array_elements($documents$[
    {
      "id": "npo-darpan-registration",
      "title": "NPO Darpan Registration Profile",
      "category": "NPO Darpan",
      "description": "The foundation's profile on NITI Aayog's NPO Darpan portal, showing its Darpan ID, registration details, office bearers, working area and achievements.",
      "reference": "Darpan ID HR/2025/0863511",
      "issuedAt": "2025-10-28",
      "validThrough": "Current",
      "url": "documents/npo-darpan-registration-profile.pdf",
      "fileType": "PDF",
      "fileSize": "947 KB",
      "isPublic": true,
      "featured": false
    },
    {
      "id": "npo-darpan-affidavit",
      "title": "NPO Darpan Affidavit",
      "category": "NPO Darpan",
      "description": "Affidavit submitted to NITI Aayog for NPO Darpan registration, confirming the foundation's particulars and its office bearers and key functionaries.",
      "reference": "Declared by Jagbir Singh, President",
      "issuedAt": "2025-10-28",
      "validThrough": "Current",
      "url": "documents/npo-darpan-affidavit.pdf",
      "fileType": "PDF",
      "fileSize": "579 KB",
      "isPublic": true,
      "featured": false
    }
  ]$documents$::jsonb) WITH ORDINALITY AS doc(item, ord)
  WHERE NOT EXISTS (
    SELECT 1
    FROM site_content sc, jsonb_array_elements(sc.content -> 'documents') AS existing(entry)
    WHERE sc.id = 'main' AND existing.entry ->> 'id' = doc.item ->> 'id'
  )
)
UPDATE site_content
SET content = jsonb_set(content, '{documents}', coalesce(content -> 'documents', '[]'::jsonb) || additions.items),
    revision = revision + 1,
    updated_at = now()
FROM additions
WHERE site_content.id = 'main' AND jsonb_array_length(additions.items) > 0;

INSERT INTO site_content_revisions (site_id, revision, schema_version, content, changed_at)
SELECT id, revision, schema_version, content, updated_at
FROM site_content
WHERE id = 'main'
ON CONFLICT (site_id, revision) DO NOTHING;
