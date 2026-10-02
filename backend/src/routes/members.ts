import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { AppConfig } from "../config.js";
import type { Database } from "../db.js";
import { AppError } from "../errors.js";
import { recordAudit } from "../audit.js";
import { insertAsset } from "../assets/repository.js";
import {
  findApprovedMemberByCode,
  findMemberById,
  formatMemberCode,
  insertMember,
  listMembers,
  listTeamMembers,
  MEMBER_CODE_PATTERN,
  oneYearFrom,
  toAdminMember,
  toPublicMember,
  type MemberType,
} from "../members/repository.js";

export const MAX_MEMBER_PHOTO_BYTES = 5 * 1024 * 1024;
const MEMBER_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const requiredText = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalText = (max: number) => z.string().trim().max(max).default("");
const email = z.string().trim().toLowerCase().max(160).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
const phone = z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,18}$/);
const pincode = z.string().trim().regex(/^(\d{6})?$/).default("");

const individualSchema = z.object({
  memberType: z.literal("individual"),
  fullName: requiredText(2, 120),
  email,
  phone,
  dateOfBirth: z.string().trim().regex(/^(\d{4}-\d{2}-\d{2})?$/).default(""),
  gender: z.enum(["", "female", "male", "other"]).default(""),
  occupation: optionalText(120),
  address: requiredText(5, 300),
  city: requiredText(2, 80),
  state: requiredText(2, 80),
  pincode,
  joinAs: z.enum(["volunteer", "member", "professional", "fundraiser", "other"]),
  availability: z.enum(["", "weekdays", "weekends", "flexible", "occasional"]).default(""),
  skills: optionalText(500),
  motivation: optionalText(1500),
  consent: z.literal(true),
}).strict();

const organizationSchema = z.object({
  memberType: z.literal("organization"),
  organizationName: requiredText(2, 160),
  organizationType: z.enum([
    "private-limited",
    "public-limited",
    "llp",
    "proprietorship",
    "trust-society",
    "educational",
    "government",
    "other",
  ]),
  registrationNumber: optionalText(60),
  gstin: z.string().trim().toUpperCase().regex(/^([0-9A-Z]{15})?$/).default(""),
  pan: z.string().trim().toUpperCase().regex(/^([A-Z]{5}[0-9]{4}[A-Z])?$/).default(""),
  website: optionalText(200),
  contactName: requiredText(2, 120),
  contactDesignation: requiredText(2, 80),
  email,
  phone,
  address: requiredText(5, 300),
  city: requiredText(2, 80),
  state: requiredText(2, 80),
  pincode,
  collaboration: z.enum(["csr", "sponsorship", "volunteering", "in-kind", "other"]),
  about: optionalText(1500),
  consent: z.literal(true),
}).strict();

const joinSchema = z.discriminatedUnion("memberType", [individualSchema, organizationSchema]);

const fieldLabels: Record<string, string> = {
  fullName: "full name",
  organizationName: "organisation name",
  organizationType: "organisation type",
  contactName: "contact person",
  contactDesignation: "designation",
  email: "email",
  phone: "phone number",
  dateOfBirth: "date of birth",
  address: "address",
  city: "city",
  state: "state",
  pincode: "PIN code",
  joinAs: "how you would like to join",
  collaboration: "type of collaboration",
  gstin: "GSTIN",
  pan: "PAN",
  consent: "consent",
};

const individualDesignations: Record<string, string> = {
  volunteer: "Volunteer",
  member: "Member",
  professional: "Skilled volunteer",
  fundraiser: "Fundraising volunteer",
  other: "Supporter",
};

const organizationDesignations: Record<string, string> = {
  csr: "CSR partner",
  sponsorship: "Sponsor",
  volunteering: "Volunteering partner",
  "in-kind": "In-kind partner",
  other: "Partner organisation",
};

const idParamsSchema = z.object({ id: z.string().uuid() });
const codeParamsSchema = z.object({ code: z.string().trim().max(40) });
const listQuerySchema = z.object({
  status: z.enum(["all", "pending", "approved", "rejected"]).default("all"),
}).strict();

const updateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  designation: z.string().trim().max(80).optional(),
  showOnTeam: z.boolean().optional(),
  validUntil: z.string().trim().regex(/^(\d{4}-\d{2}-\d{2})?$/).optional(),
  adminNote: z.string().trim().max(1000).optional(),
}).strict();

type RouteOptions = {
  sql: Database;
  config: AppConfig;
  requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
};

function fieldValue(field: unknown) {
  const entry = Array.isArray(field) ? field[0] : field;
  if (entry && typeof entry === "object" && "value" in entry) {
    const value = (entry as { value: unknown }).value;
    if (typeof value === "string") return value;
  }
  return "";
}

function joinErrorMessage(error: z.ZodError) {
  const field = String(error.issues[0]?.path[0] ?? "");
  if (field === "consent") return "Please confirm the consent statement to submit your application.";
  const label = fieldLabels[field];
  return label ? `Please check the ${label} field.` : "Please check the form and try again.";
}

function isRealDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export default async function memberRoutes(app: FastifyInstance, options: RouteOptions) {
  const { sql, config, requireAdmin } = options;

  app.post("/api/join", { config: { rateLimit: { max: 10, timeWindow: "1 hour" } } }, async (request, reply) => {
    const part = await request.file({ limits: { files: 1, fileSize: MAX_MEMBER_PHOTO_BYTES } });
    if (!part) throw new AppError(400, "BAD_REQUEST", "Add a photo or logo to continue.");
    const bytes = await part.toBuffer();
    if (part.file.truncated) {
      throw new AppError(413, "PAYLOAD_TOO_LARGE", "The photo is larger than the 5 MB limit.");
    }

    let payload: unknown;
    try {
      payload = JSON.parse(fieldValue(part.fields.data));
    } catch {
      throw new AppError(400, "BAD_REQUEST", "The application form could not be read. Please try again.");
    }
    const parsed = joinSchema.safeParse(payload);
    if (!parsed.success) throw new AppError(400, "BAD_REQUEST", joinErrorMessage(parsed.error));
    if (!MEMBER_PHOTO_TYPES.has(part.mimetype)) {
      throw new AppError(400, "BAD_REQUEST", "Upload the photo or logo as a JPG, PNG or WebP image.");
    }
    const application = parsed.data;
    const memberType: MemberType = application.memberType;
    let fullName: string;
    let organizationName: string | null = null;
    let designation: string;
    let details: Record<string, string>;
    // Name, contact and location have their own columns; everything else is kept as application details.
    if (application.memberType === "organization") {
      const {
        memberType: _type, consent: _consent, email: _email, phone: _phone, city: _city, state: _state,
        organizationName: name, contactName, ...extra
      } = application;
      fullName = contactName;
      organizationName = name;
      designation = organizationDesignations[application.collaboration] ?? "Partner organisation";
      details = extra;
    } else {
      if (application.dateOfBirth && !isRealDate(application.dateOfBirth)) {
        throw new AppError(400, "BAD_REQUEST", "Please check the date of birth field.");
      }
      const {
        memberType: _type, consent: _consent, email: _email, phone: _phone, city: _city, state: _state,
        fullName: name, ...extra
      } = application;
      fullName = name;
      designation = individualDesignations[application.joinAs] ?? "Member";
      details = extra;
    }

    const id = await sql.begin(async (transaction) => {
      const database = transaction as Database;
      const photo = await insertAsset(database, {
        originalFilename: part.filename || "photo",
        mimeType: part.mimetype,
        bytes,
        adminId: null,
      });
      return insertMember(database, {
        memberType,
        fullName,
        organizationName,
        email: application.email,
        phone: application.phone,
        city: application.city,
        state: application.state,
        details,
        photoAssetId: photo.id,
        designation,
      });
    });
    return reply.status(201).send({ id, status: "pending", reference: id.slice(0, 8).toUpperCase() });
  });

  app.get("/api/team", async (_request, reply) => {
    reply.header("Cache-Control", "no-cache");
    const rows = await listTeamMembers(sql);
    return { members: rows.map((row) => toPublicMember(row, config.publicApiUrl)) };
  });

  app.get("/api/team/:code", async (request, reply) => {
    reply.header("Cache-Control", "no-cache");
    const parsed = codeParamsSchema.safeParse(request.params);
    const code = parsed.success ? parsed.data.code.toUpperCase() : "";
    if (!MEMBER_CODE_PATTERN.test(code)) throw new AppError(404, "NOT_FOUND", "This ID card was not found.");
    const row = await findApprovedMemberByCode(sql, code);
    if (!row) throw new AppError(404, "NOT_FOUND", "This ID card was not found or is no longer valid.");
    return { member: toPublicMember(row, config.publicApiUrl) };
  });

  app.get("/api/admin/members", { preHandler: requireAdmin }, async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    const parsed = listQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) throw new AppError(400, "BAD_REQUEST", "Choose a valid member status.");
    const rows = await listMembers(sql, parsed.data.status);
    return { members: rows.map((row) => toAdminMember(row, config.publicApiUrl)) };
  });

  app.put("/api/admin/members/:id", { preHandler: requireAdmin }, async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    if (!request.admin) throw new AppError(401, "AUTH_REQUIRED", "Administrator authentication is required.");
    const params = idParamsSchema.safeParse(request.params);
    if (!params.success) throw new AppError(404, "NOT_FOUND", "This application was not found.");
    const body = updateSchema.safeParse(request.body ?? {});
    if (!body.success) throw new AppError(400, "BAD_REQUEST", "Please check the approval details.");
    const current = await findMemberById(sql, params.data.id);
    if (!current) throw new AppError(404, "NOT_FOUND", "This application was not found.");

    const status = body.data.status ?? current.status;
    const designation = body.data.designation ?? current.designation;
    const showOnTeam = body.data.showOnTeam ?? current.show_on_team;
    const adminNote = body.data.adminNote ?? current.admin_note;
    let validUntil = body.data.validUntil !== undefined ? body.data.validUntil || null : current.valid_until;
    if (status === "approved" && !validUntil) validUntil = oneYearFrom(new Date());
    if (validUntil && !isRealDate(validUntil)) throw new AppError(400, "BAD_REQUEST", "Please check the valid until date.");
    const approvedAt = current.approved_at
      ? new Date(current.approved_at)
      : status === "approved" ? new Date() : null;
    const adminId = request.admin.id;

    await sql.begin(async (transaction) => {
      const database = transaction as Database;
      let memberCode = current.member_code;
      if (status === "approved" && !memberCode) {
        const next = await database<{ value: string }[]>`SELECT nextval('member_number_seq') AS value`;
        memberCode = formatMemberCode(current.member_type, Number(next[0]?.value ?? 0));
      }
      await database`
        UPDATE members
        SET status = ${status}, designation = ${designation}, show_on_team = ${showOnTeam},
            admin_note = ${adminNote}, valid_until = ${validUntil}, member_code = ${memberCode},
            approved_at = ${approvedAt}
        WHERE id = ${current.id}
      `;
      await recordAudit(database, request, {
        adminId,
        action: status !== current.status ? `member.${status}` : "member.update",
        resourceType: "member",
        resourceId: current.id,
        metadata: { status, memberCode: memberCode ?? null },
      });
    });

    const updated = await findMemberById(sql, current.id);
    if (!updated) throw new AppError(404, "NOT_FOUND", "This application was not found.");
    return { member: toAdminMember(updated, config.publicApiUrl) };
  });

  app.delete("/api/admin/members/:id", { preHandler: requireAdmin }, async (request, reply) => {
    if (!request.admin) throw new AppError(401, "AUTH_REQUIRED", "Administrator authentication is required.");
    const params = idParamsSchema.safeParse(request.params);
    if (!params.success) throw new AppError(404, "NOT_FOUND", "This application was not found.");
    const adminId = request.admin.id;
    const deleted = await sql.begin(async (transaction) => {
      const database = transaction as Database;
      const rows = await database<{ id: string; photo_asset_id: string | null }[]>`
        DELETE FROM members WHERE id = ${params.data.id} RETURNING id, photo_asset_id
      `;
      const row = rows[0];
      if (!row) return null;
      if (row.photo_asset_id) {
        await database`DELETE FROM cms_assets WHERE id = ${row.photo_asset_id} AND uploaded_by IS NULL`;
      }
      await recordAudit(database, request, {
        adminId,
        action: "member.delete",
        resourceType: "member",
        resourceId: row.id,
      });
      return row;
    });
    if (!deleted) throw new AppError(404, "NOT_FOUND", "This application was not found.");
    return reply.status(204).send();
  });
}
