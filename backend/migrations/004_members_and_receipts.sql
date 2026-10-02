-- Join-us photos are uploaded by the public, so an asset may have no administrator uploader.
ALTER TABLE cms_assets ALTER COLUMN uploaded_by DROP NOT NULL;

CREATE SEQUENCE member_number_seq START 1;

CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_type text NOT NULL CHECK (member_type IN ('individual', 'organization')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  full_name text NOT NULL,
  organization_name text,
  email text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  photo_asset_id uuid REFERENCES cms_assets(id) ON DELETE SET NULL,
  member_code text UNIQUE,
  designation text NOT NULL DEFAULT '',
  show_on_team boolean NOT NULL DEFAULT true,
  approved_at timestamptz,
  valid_until date,
  admin_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT members_name_length CHECK (char_length(full_name) BETWEEN 2 AND 120),
  CONSTRAINT members_details_object CHECK (jsonb_typeof(details) = 'object'),
  CONSTRAINT members_organization_name CHECK (
    member_type <> 'organization' OR char_length(coalesce(organization_name, '')) >= 2
  ),
  CONSTRAINT members_approval_fields CHECK (
    status <> 'approved' OR (member_code IS NOT NULL AND approved_at IS NOT NULL)
  )
);

CREATE INDEX members_status_created_idx ON members (status, created_at DESC);
CREATE INDEX members_team_idx ON members (approved_at) WHERE status = 'approved' AND show_on_team = true;

CREATE TRIGGER members_set_updated_at
BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Receipts issued from the admin panel for donations received by UPI, bank transfer, cheque or cash.
CREATE SEQUENCE donation_receipt_seq START 1;

ALTER TABLE donations
  ADD COLUMN donor_pan text,
  ADD COLUMN donor_address text,
  ADD COLUMN payment_mode text,
  ADD COLUMN payment_reference text,
  ADD COLUMN notes text,
  ADD COLUMN receipt_issued_at timestamptz;

CREATE INDEX donations_receipt_issued_idx ON donations (receipt_issued_at DESC) WHERE receipt_number IS NOT NULL;
