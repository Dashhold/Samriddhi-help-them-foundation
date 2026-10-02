import type { Database } from "../db.js";

export type MemberType = "individual" | "organization";
export type MemberStatus = "pending" | "approved" | "rejected";

// Member IDs printed on ID cards: SHTF-M-0001 for people, SHTF-P-0002 for partner organisations.
export const MEMBER_CODE_PATTERN = /^SHTF-[MP]-\d{4,}$/;

export function formatMemberCode(memberType: MemberType, sequence: number) {
  if (!Number.isSafeInteger(sequence) || sequence < 1) throw new Error("Invalid member sequence number.");
  return `SHTF-${memberType === "organization" ? "P" : "M"}-${String(sequence).padStart(4, "0")}`;
}

export function oneYearFrom(date: Date) {
  const next = new Date(Date.UTC(date.getUTCFullYear() + 1, date.getUTCMonth(), date.getUTCDate()));
  return next.toISOString().slice(0, 10);
}

export type MemberRow = {
  id: string;
  member_type: MemberType;
  status: MemberStatus;
  full_name: string;
  organization_name: string | null;
  email: string;
  phone: string;
  city: string;
  state: string;
  details: unknown;
  photo_asset_id: string | null;
  photo_filename: string | null;
  member_code: string | null;
  designation: string;
  show_on_team: boolean;
  approved_at: Date | string | null;
  valid_until: string | null;
  admin_note: string;
  created_at: Date | string;
};

export type NewMember = {
  memberType: MemberType;
  fullName: string;
  organizationName: string | null;
  email: string;
  phone: string;
  city: string;
  state: string;
  details: Record<string, string>;
  photoAssetId: string;
  designation: string;
};

function isoTimestamp(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : "";
}

function stringDetails(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

export function memberPhotoUrl(publicApiUrl: string, row: Pick<MemberRow, "photo_asset_id" | "photo_filename">) {
  if (!row.photo_asset_id || !row.photo_filename) return "";
  return `${publicApiUrl}/api/assets/${row.photo_asset_id}/${encodeURIComponent(row.photo_filename)}`;
}

// Only what is printed on the ID card is public; contact details and the application stay private.
export function toPublicMember(row: MemberRow, publicApiUrl: string) {
  return {
    memberCode: row.member_code ?? "",
    memberType: row.member_type,
    name: row.full_name,
    organizationName: row.organization_name ?? "",
    designation: row.designation,
    photoUrl: memberPhotoUrl(publicApiUrl, row),
    city: row.city,
    state: row.state,
    memberSince: isoTimestamp(row.approved_at),
    validUntil: row.valid_until ?? "",
  };
}

export function toAdminMember(row: MemberRow, publicApiUrl: string) {
  return {
    id: row.id,
    memberType: row.member_type,
    status: row.status,
    name: row.full_name,
    organizationName: row.organization_name ?? "",
    email: row.email,
    phone: row.phone,
    city: row.city,
    state: row.state,
    details: stringDetails(row.details),
    photoUrl: memberPhotoUrl(publicApiUrl, row),
    memberCode: row.member_code ?? "",
    designation: row.designation,
    showOnTeam: row.show_on_team,
    approvedAt: isoTimestamp(row.approved_at),
    validUntil: row.valid_until ?? "",
    adminNote: row.admin_note,
    createdAt: isoTimestamp(row.created_at),
  };
}

export async function insertMember(sql: Database, member: NewMember) {
  const rows = await sql<{ id: string }[]>`
    INSERT INTO members (
      member_type, full_name, organization_name, email, phone, city, state, details, photo_asset_id, designation
    ) VALUES (
      ${member.memberType}, ${member.fullName}, ${member.organizationName}, ${member.email}, ${member.phone},
      ${member.city}, ${member.state}, ${sql.json(member.details)}, ${member.photoAssetId}, ${member.designation}
    )
    RETURNING id
  `;
  const id = rows[0]?.id;
  if (!id) throw new Error("The application could not be stored.");
  return id;
}

export async function listMembers(sql: Database, status: MemberStatus | "all") {
  return sql<MemberRow[]>`
    SELECT m.id, m.member_type, m.status, m.full_name, m.organization_name, m.email, m.phone, m.city, m.state,
           m.details, m.photo_asset_id, a.safe_filename AS photo_filename, m.member_code, m.designation,
           m.show_on_team, m.approved_at, to_char(m.valid_until, 'YYYY-MM-DD') AS valid_until,
           m.admin_note, m.created_at
    FROM members m
    LEFT JOIN cms_assets a ON a.id = m.photo_asset_id
    WHERE (${status} = 'all' OR m.status = ${status})
    ORDER BY m.created_at DESC
    LIMIT 1000
  `;
}

export async function findMemberById(sql: Database, id: string) {
  const rows = await sql<MemberRow[]>`
    SELECT m.id, m.member_type, m.status, m.full_name, m.organization_name, m.email, m.phone, m.city, m.state,
           m.details, m.photo_asset_id, a.safe_filename AS photo_filename, m.member_code, m.designation,
           m.show_on_team, m.approved_at, to_char(m.valid_until, 'YYYY-MM-DD') AS valid_until,
           m.admin_note, m.created_at
    FROM members m
    LEFT JOIN cms_assets a ON a.id = m.photo_asset_id
    WHERE m.id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function listTeamMembers(sql: Database) {
  return sql<MemberRow[]>`
    SELECT m.id, m.member_type, m.status, m.full_name, m.organization_name, m.email, m.phone, m.city, m.state,
           m.details, m.photo_asset_id, a.safe_filename AS photo_filename, m.member_code, m.designation,
           m.show_on_team, m.approved_at, to_char(m.valid_until, 'YYYY-MM-DD') AS valid_until,
           m.admin_note, m.created_at
    FROM members m
    LEFT JOIN cms_assets a ON a.id = m.photo_asset_id
    WHERE m.status = 'approved' AND m.show_on_team = true
    ORDER BY m.approved_at ASC, m.member_code ASC
    LIMIT 1000
  `;
}

export async function findApprovedMemberByCode(sql: Database, code: string) {
  const rows = await sql<MemberRow[]>`
    SELECT m.id, m.member_type, m.status, m.full_name, m.organization_name, m.email, m.phone, m.city, m.state,
           m.details, m.photo_asset_id, a.safe_filename AS photo_filename, m.member_code, m.designation,
           m.show_on_team, m.approved_at, to_char(m.valid_until, 'YYYY-MM-DD') AS valid_until,
           m.admin_note, m.created_at
    FROM members m
    LEFT JOIN cms_assets a ON a.id = m.photo_asset_id
    WHERE m.status = 'approved' AND m.member_code = ${code}
    LIMIT 1
  `;
  return rows[0] ?? null;
}
