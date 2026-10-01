CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE donation_status AS ENUM ('created', 'pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  username_normalized text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  environment_managed boolean NOT NULL DEFAULT true,
  credential_version integer NOT NULL DEFAULT 1 CHECK (credential_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admins_username_length CHECK (char_length(username) BETWEEN 3 AND 100),
  CONSTRAINT admins_normalized_username CHECK (username_normalized = lower(btrim(username_normalized))),
  CONSTRAINT admins_argon2id_hash CHECK (password_hash LIKE '$argon2id$%')
);

CREATE UNIQUE INDEX admins_single_environment_managed_idx
ON admins ((environment_managed))
WHERE environment_managed = true;

CREATE TABLE admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash char(64) NOT NULL UNIQUE,
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  credential_version integer NOT NULL CHECK (credential_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CONSTRAINT admin_sessions_expiry CHECK (expires_at > created_at),
  CONSTRAINT admin_sessions_revocation CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

CREATE INDEX admin_sessions_admin_idx ON admin_sessions (admin_id);
CREATE INDEX admin_sessions_expiry_idx ON admin_sessions (expires_at) WHERE revoked_at IS NULL;

CREATE TABLE site_content (
  id text PRIMARY KEY DEFAULT 'main' CHECK (id = 'main'),
  schema_version integer NOT NULL DEFAULT 2 CHECK (schema_version = 2),
  content jsonb NOT NULL,
  published boolean NOT NULL DEFAULT true,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  CONSTRAINT site_content_object CHECK (jsonb_typeof(content) = 'object')
);

CREATE TABLE site_content_revisions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id text NOT NULL REFERENCES site_content(id) ON DELETE CASCADE,
  revision bigint NOT NULL CHECK (revision > 0),
  schema_version integer NOT NULL DEFAULT 2 CHECK (schema_version = 2),
  content jsonb NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid REFERENCES admins(id) ON DELETE RESTRICT,
  CONSTRAINT site_content_revisions_object CHECK (jsonb_typeof(content) = 'object'),
  UNIQUE (site_id, revision)
);

CREATE INDEX site_content_revisions_changed_idx ON site_content_revisions (site_id, changed_at DESC);

CREATE TABLE cms_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_filename text NOT NULL,
  safe_filename text NOT NULL,
  mime_type text NOT NULL,
  byte_size integer NOT NULL,
  sha256 char(64) NOT NULL,
  data bytea NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cms_assets_filename_length CHECK (
    char_length(original_filename) BETWEEN 1 AND 255
    AND char_length(safe_filename) BETWEEN 1 AND 255
  ),
  CONSTRAINT cms_assets_safe_filename CHECK (safe_filename ~ '^[A-Za-z0-9][A-Za-z0-9._-]*$'),
  CONSTRAINT cms_assets_mime_allowlist CHECK (mime_type IN (
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'
  )),
  CONSTRAINT cms_assets_size_limit CHECK (byte_size BETWEEN 1 AND 10485760),
  CONSTRAINT cms_assets_data_size CHECK (octet_length(data) = byte_size),
  CONSTRAINT cms_assets_sha256 CHECK (sha256 ~ '^[0-9a-f]{64}$')
);

CREATE INDEX cms_assets_sha256_idx ON cms_assets (sha256);
CREATE INDEX cms_assets_uploader_idx ON cms_assets (uploaded_by, created_at DESC);

CREATE TABLE donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_order_id text NOT NULL,
  provider_payment_id text,
  donor_type text NOT NULL CHECK (donor_type IN ('individual', 'company')),
  donor_name text NOT NULL,
  company_name text,
  email text NOT NULL,
  phone text,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  campaign_id text,
  purpose text NOT NULL DEFAULT 'General donation',
  status donation_status NOT NULL DEFAULT 'created',
  receipt_number text,
  receipt_url text,
  provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT donations_provider_order_unique UNIQUE (provider, provider_order_id),
  CONSTRAINT donations_provider_payment_unique UNIQUE (provider, provider_payment_id),
  CONSTRAINT donations_receipt_unique UNIQUE (receipt_number),
  CONSTRAINT donations_provider_payload_object CHECK (jsonb_typeof(provider_payload) = 'object'),
  CONSTRAINT donations_paid_timestamp CHECK (status <> 'paid' OR paid_at IS NOT NULL)
);

CREATE INDEX donations_paid_period_idx ON donations (paid_at DESC) WHERE status = 'paid';
CREATE INDEX donations_campaign_idx ON donations (campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX donations_created_idx ON donations (created_at DESC);

CREATE TABLE payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_error text,
  CONSTRAINT payment_webhook_events_unique UNIQUE (provider, provider_event_id),
  CONSTRAINT payment_webhook_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX payment_webhook_received_idx ON payment_webhook_events (received_at DESC);
CREATE INDEX payment_webhook_unprocessed_idx ON payment_webhook_events (received_at) WHERE processed_at IS NULL;

CREATE TABLE admin_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id uuid REFERENCES admins(id) ON DELETE RESTRICT,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  request_id text,
  request_ip inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_audit_metadata_object CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT admin_audit_text_lengths CHECK (
    char_length(action) BETWEEN 1 AND 120
    AND char_length(resource_type) BETWEEN 1 AND 120
    AND (user_agent IS NULL OR char_length(user_agent) <= 500)
  )
);

CREATE INDEX admin_audit_admin_idx ON admin_audit_log (admin_id, created_at DESC);
CREATE INDEX admin_audit_resource_idx ON admin_audit_log (resource_type, resource_id, created_at DESC);
CREATE INDEX admin_audit_created_idx ON admin_audit_log (created_at DESC);

CREATE OR REPLACE FUNCTION reject_append_only_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER site_content_revisions_append_only
BEFORE UPDATE OR DELETE ON site_content_revisions
FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();

CREATE TRIGGER admin_audit_log_append_only
BEFORE UPDATE OR DELETE ON admin_audit_log
FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER admins_set_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER donations_set_updated_at
BEFORE UPDATE ON donations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE VIEW monthly_donation_reports AS
SELECT
  date_trunc('month', paid_at) AS period_start,
  count(*) AS donation_count,
  sum(amount_minor) AS total_amount_minor,
  currency
FROM donations
WHERE status = 'paid' AND paid_at IS NOT NULL
GROUP BY date_trunc('month', paid_at), currency;

CREATE OR REPLACE VIEW yearly_donation_reports AS
SELECT
  date_trunc('year', paid_at) AS period_start,
  count(*) AS donation_count,
  sum(amount_minor) AS total_amount_minor,
  currency
FROM donations
WHERE status = 'paid' AND paid_at IS NOT NULL
GROUP BY date_trunc('year', paid_at), currency;
