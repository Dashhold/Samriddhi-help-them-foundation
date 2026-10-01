CREATE TABLE admin_login_rate_limits (
  identity_hash char(64) PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  attempt_count integer NOT NULL DEFAULT 1 CHECK (attempt_count > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_login_rate_limits_identity_hash CHECK (identity_hash ~ '^[0-9a-f]{64}$')
);

CREATE INDEX admin_login_rate_limits_updated_idx
ON admin_login_rate_limits (updated_at);
