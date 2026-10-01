import type { FastifyRequest } from "fastify";
import type { Database } from "../db.js";
import { AppError } from "../errors.js";
import { recordAudit } from "../audit.js";
import { siteContentSchema, type SiteContent } from "./site-content-schema.js";

export type ContentSnapshot = {
  schemaVersion: 2;
  revision: number;
  updatedAt: string;
  content: SiteContent;
};

type ContentRow = {
  content: unknown;
  revision: number | string;
  updated_at: Date | string;
};

function toSnapshot(row: ContentRow): ContentSnapshot {
  return {
    schemaVersion: 2,
    revision: Number(row.revision),
    updatedAt: new Date(row.updated_at).toISOString(),
    content: siteContentSchema.parse(row.content),
  };
}

export function projectPublicContent(content: SiteContent): SiteContent {
  const announcement = content.announcement.enabled
    ? content.announcement
    : {
        enabled: false,
        label: "",
        message: "",
        link: { label: "", href: "" },
        tone: "pink" as const,
      };
  const fundraising = content.fundraising.enabled
    ? {
        ...content.fundraising,
        campaigns: content.fundraising.campaigns.filter((item) => item.status === "active"),
      }
    : {
        enabled: false,
        eyebrow: "",
        title: "Fundraising",
        body: "",
        campaigns: [],
      };
  const donation = content.donation.acceptingDonations
    ? content.donation
    : {
        ...content.donation,
        minimumAmount: 1,
        qrImageUrl: "",
        upiId: "",
        payeeName: "",
        bankName: "",
        accountName: "",
        accountNumber: "",
        ifsc: "",
        branch: "",
        accountType: "",
        gatewayEnabled: false,
      };

  return {
    announcement,
    pageBanners: content.pageBanners,
    about: content.about,
    story: content.story,
    focusAreas: content.focusAreas.filter((item) => item.enabled),
    fundraising,
    impactMetrics: content.impactMetrics,
    news: content.news.filter((item) => item.status === "published"),
    donation,
    documents: content.documents.filter((item) => item.isPublic),
    reports: content.reports.filter((item) => item.status === "published"),
    contact: content.contact,
  };
}

export async function getPublishedContent(sql: Database) {
  const rows = await sql<ContentRow[]>`
    SELECT content, revision, updated_at
    FROM site_content
    WHERE id = 'main' AND published = true
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) throw new AppError(503, "SERVICE_UNAVAILABLE", "Published content is not available.");
  const snapshot = toSnapshot(row);
  return { ...snapshot, content: projectPublicContent(snapshot.content) };
}

export async function getAdminContent(sql: Database) {
  const rows = await sql<ContentRow[]>`
    SELECT content, revision, updated_at
    FROM site_content
    WHERE id = 'main'
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) throw new AppError(503, "SERVICE_UNAVAILABLE", "Content is not available.");
  return toSnapshot(row);
}

export async function updatePublishedContent(
  sql: Database,
  request: FastifyRequest,
  content: SiteContent,
  expectedRevision: number,
  adminId: string,
) {
  return sql.begin(async (transaction) => {
    const currentRows = await transaction<ContentRow[]>`
      SELECT content, revision, updated_at
      FROM site_content
      WHERE id = 'main'
      FOR UPDATE
    `;
    const current = currentRows[0];
    if (!current) throw new AppError(503, "SERVICE_UNAVAILABLE", "Published content is not available.");
    if (Number(current.revision) !== expectedRevision) {
      throw new AppError(409, "CONFLICT", "Content changed in another session. Refresh the dashboard before saving again.");
    }
    const nextRevision = expectedRevision + 1;
    const updatedRows = await transaction<ContentRow[]>`
      UPDATE site_content
      SET content = ${transaction.json(content)}, schema_version = 2, published = true,
          revision = ${nextRevision}, updated_at = now(), updated_by = ${adminId}
      WHERE id = 'main'
      RETURNING content, revision, updated_at
    `;
    await transaction`
      INSERT INTO site_content_revisions (site_id, revision, schema_version, content, changed_by)
      VALUES ('main', ${nextRevision}, 2, ${transaction.json(content)}, ${adminId})
    `;
    await recordAudit(transaction as Database, request, {
      adminId,
      action: "content.update",
      resourceType: "site_content",
      resourceId: "main",
      metadata: { revision: nextRevision },
    });
    const updated = updatedRows[0];
    if (!updated) throw new AppError(500, "INTERNAL_ERROR", "Content could not be saved.");
    return toSnapshot(updated);
  });
}
