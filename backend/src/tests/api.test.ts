import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { AppConfig } from "../config.js";
import { siteContentSchema, type SiteContent } from "../content/site-content-schema.js";
import type { Database } from "../db.js";
import { hashPassword } from "../auth/password.js";
import { hashSessionToken } from "../auth/sessions.js";
import { MAX_ASSET_BYTES } from "../assets/repository.js";
import { discoverMigrations } from "../migrate.js";
import { buildApp } from "../app.js";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const SESSION_ID = "22222222-2222-4222-8222-222222222222";
const ASSET_ID = "33333333-3333-4333-8333-333333333333";
const DONATION_ID = "44444444-4444-4444-8444-444444444444";
const MEMBER_ID = "55555555-5555-4555-8555-555555555555";
const RECEIPT_ID = "66666666-6666-4666-8666-666666666666";
const TOKEN = "A".repeat(43);

type FakeMember = {
  id: string;
  member_type: "individual" | "organization";
  status: "pending" | "approved" | "rejected";
  full_name: string;
  organization_name: string | null;
  email: string;
  phone: string;
  city: string;
  state: string;
  details: Record<string, string>;
  photo_asset_id: string | null;
  photo_filename: string | null;
  member_code: string | null;
  designation: string;
  show_on_team: boolean;
  approved_at: Date | null;
  valid_until: string | null;
  admin_note: string;
  created_at: Date;
};

type FakeOptions = {
  appliedMigrationMissingFromSource?: boolean;
  authorized?: boolean;
  loginPasswordHash?: string;
  latestMigration?: string | null;
  members?: FakeMember[];
  migrationNameMismatch?: boolean;
  revision?: number;
};

function pendingMember(): FakeMember {
  return {
    id: MEMBER_ID,
    member_type: "individual",
    status: "pending",
    full_name: "Asha Verma",
    organization_name: null,
    email: "asha@example.org",
    phone: "+91 98765 43210",
    city: "Hisar",
    state: "Haryana",
    details: { address: "12 Model Town", joinAs: "volunteer" },
    photo_asset_id: ASSET_ID,
    photo_filename: "photo.png",
    member_code: null,
    designation: "Volunteer",
    show_on_team: true,
    approved_at: null,
    valid_until: null,
    admin_note: "",
    created_at: new Date("2026-09-01T10:00:00.000Z"),
  };
}

type QueryRecord = { query: string; values: unknown[] };

type StoredAsset = {
  id: string;
  original_filename: string;
  safe_filename: string;
  mime_type: string;
  byte_size: number;
  sha256: string;
  data: Buffer;
};

function config(): AppConfig {
  return {
    nodeEnv: "test",
    host: "127.0.0.1",
    port: 3000,
    publicApiUrl: "https://api.example.org",
    frontendOrigins: ["https://www.example.org"],
    adminUsername: "administrator",
    adminPassword: "a-strong-test-password",
    sessionTtlHours: 8,
    requestBodyLimitBytes: 11 * 1024 * 1024,
    databaseUrl: "postgres://unused",
    databaseSsl: false,
  };
}

async function defaultContent() {
  const raw = await readFile(new URL("../../src/content/default-content.json", import.meta.url), "utf8");
  return siteContentSchema.parse(JSON.parse(raw));
}

function fakeDatabase(initialContent: SiteContent, options: FakeOptions = {}) {
  const queries: QueryRecord[] = [];
  const members: FakeMember[] = structuredClone(options.members ?? []);
  const loginAttemptCounts = new Map<string, number>();
  let content = structuredClone(initialContent);
  let revision = options.revision ?? 3;
  let asset: StoredAsset = {
    id: ASSET_ID,
    original_filename: "minutes.pdf",
    safe_filename: "minutes.pdf",
    mime_type: "application/pdf",
    byte_size: 9,
    sha256: "a".repeat(64),
    data: Buffer.from("%PDF-1.7"),
  };

  const execute = async (rawQuery: string, values: unknown[]) => {
    const query = rawQuery.replace(/\s+/g, " ").trim();
    queries.push({ query, values });
    if (query.includes("SELECT 1 AS ready")) return [{ ready: 1 }];
    if (query.includes("nextval('member_number_seq')")) return [{ value: "1" }];
    if (query.includes("nextval('donation_receipt_seq')")) return [{ value: "7" }];
    if (query.includes("INSERT INTO members")) {
      members.push({
        ...pendingMember(),
        member_type: values[0] as FakeMember["member_type"],
        full_name: String(values[1]),
        organization_name: values[2] as string | null,
        email: String(values[3]),
        phone: String(values[4]),
        city: String(values[5]),
        state: String(values[6]),
        details: values[7] as Record<string, string>,
        photo_asset_id: values[8] as string,
        designation: String(values[9]),
      });
      return [{ id: MEMBER_ID }];
    }
    if (query.startsWith("UPDATE members")) {
      const member = members.find((item) => item.id === values[7]);
      if (member) {
        Object.assign(member, {
          status: values[0],
          designation: values[1],
          show_on_team: values[2],
          admin_note: values[3],
          valid_until: values[4],
          member_code: values[5],
          approved_at: values[6],
        });
      }
      return [];
    }
    if (query.startsWith("DELETE FROM members")) {
      const index = members.findIndex((item) => item.id === values[0]);
      if (index < 0) return [];
      const [removed] = members.splice(index, 1);
      return [{ id: removed!.id, photo_asset_id: removed!.photo_asset_id }];
    }
    if (query.includes("FROM members m")) {
      let rows = members;
      if (query.includes("m.status = 'approved'")) rows = rows.filter((item) => item.status === "approved");
      if (query.includes("m.show_on_team = true")) rows = rows.filter((item) => item.show_on_team);
      if (query.includes("m.member_code =")) rows = rows.filter((item) => item.member_code === values[0]);
      if (query.includes("m.id =")) rows = rows.filter((item) => item.id === values[0]);
      if (query.includes("= 'all' OR m.status =") && values[0] !== "all") {
        rows = rows.filter((item) => item.status === values[0]);
      }
      return rows.map((item) => ({ ...item }));
    }
    if (query.startsWith("INSERT INTO donations")) {
      return [{
        id: RECEIPT_ID,
        provider: "offline",
        receipt_number: values[8],
        donor_type: values[1],
        donor_name: values[2],
        company_name: values[3],
        email: values[4],
        phone: values[5],
        donor_pan: values[10],
        donor_address: values[11],
        amount_minor: values[6],
        currency: "INR",
        purpose: values[7],
        payment_mode: values[12],
        payment_reference: values[13],
        provider_payment_id: null,
        notes: values[14],
        paid_at: values[9],
        receipt_issued_at: new Date("2026-10-02T09:00:00.000Z"),
        created_at: new Date("2026-10-02T09:00:00.000Z"),
      }];
    }
    if (query.includes("FROM schema_migrations ORDER BY version")) {
      const migrations = await discoverMigrations();
      const selected = options.latestMigration === null
        ? []
        : typeof options.latestMigration === "string"
          ? migrations.filter((migration) => migration.version <= options.latestMigration!)
          : migrations;
      const applied = selected.map((migration, index) => ({
        version: migration.version,
        name: options.migrationNameMismatch && index === 0 ? "001_renamed.sql" : migration.name,
        checksum: migration.checksum,
      }));
      if (options.appliedMigrationMissingFromSource) {
        applied.unshift({
          version: "000",
          name: "000_deleted.sql",
          checksum: "d".repeat(64),
        });
      }
      return applied;
    }
    if (query.includes("DELETE FROM admin_login_rate_limits")) return [];
    if (query.includes("INSERT INTO admin_login_rate_limits")) {
      const identityHash = String(values[0]);
      const attemptCount = (loginAttemptCounts.get(identityHash) ?? 0) + 1;
      loginAttemptCounts.set(identityHash, attemptCount);
      return [{ attempt_count: attemptCount }];
    }
    if (query.includes("FROM admin_sessions s")) {
      if (options.authorized === false) return [];
      return [{
        session_id: SESSION_ID,
        admin_id: ADMIN_ID,
        username: "administrator",
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      }];
    }
    if (query.includes("FROM admins") && query.includes("password_hash")) {
      return options.loginPasswordHash ? [{
        id: ADMIN_ID,
        username: "administrator",
        password_hash: options.loginPasswordHash,
        credential_version: 1,
      }] : [];
    }
    if (query.includes("INSERT INTO admin_sessions")) return [];
    if (query.includes("UPDATE admin_sessions") && query.includes("RETURNING admin_id")) {
      return [{ admin_id: ADMIN_ID, id: SESSION_ID }];
    }
    if (query.includes("UPDATE admin_sessions")) return [];
    if (query.includes("FROM site_content") && !query.includes("site_content_revisions")) {
      return [{ content, revision, updated_at: new Date("2026-01-01T00:00:00.000Z") }];
    }
    if (query.startsWith("UPDATE site_content")) {
      content = structuredClone(values[0] as SiteContent);
      revision = Number(values[1]);
      return [{ content, revision, updated_at: new Date("2026-01-02T00:00:00.000Z") }];
    }
    if (query.includes("INSERT INTO site_content_revisions")) return [];
    if (query.includes("INSERT INTO cms_assets")) {
      asset = {
        id: ASSET_ID,
        original_filename: String(values[0]),
        safe_filename: String(values[1]),
        mime_type: String(values[2]),
        byte_size: Number(values[3]),
        sha256: String(values[4]),
        data: values[5] as Buffer,
      };
      return [asset];
    }
    if (query.includes("FROM cms_assets WHERE id")) return [asset];
    if (query.includes("FROM donations")) {
      return [{
        id: DONATION_ID,
        provider_order_id: "order-1",
        provider_payment_id: "payment-1",
        donor_type: "individual",
        donor_name: "Example Donor",
        company_name: null,
        email: "donor@example.org",
        phone: null,
        amount_minor: 12345,
        currency: "INR",
        campaign_id: null,
        purpose: "General donation",
        status: "paid",
        receipt_number: "R-1",
        receipt_url: null,
        created_at: new Date("2026-02-10T10:00:00.000Z"),
        paid_at: new Date("2026-02-10T10:05:00.000Z"),
      }];
    }
    if (query.includes("INSERT INTO admin_audit_log")) return [];
    return [];
  };

  const tagged = async (strings: TemplateStringsArray, ...values: unknown[]) => execute(strings.join("?"), values);
  const sql = tagged as unknown as Database;
  Object.assign(sql, {
    begin: async (callback: (transaction: Database) => unknown) => callback(sql),
    json: (value: unknown) => value,
    unsafe: async (statement: string) => execute(statement, []),
  });
  return { sql, queries, members };
}

function joinMultipart(data: unknown, filename: string, mimeType: string, bytes: Buffer) {
  const boundary = "----samriddhi-join-test-boundary";
  const field = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="data"\r\n\r\n${JSON.stringify(data)}\r\n`,
  );
  const filePrefix = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`,
  );
  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
  return {
    payload: Buffer.concat([field, filePrefix, bytes, suffix]),
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
  };
}

const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from("test-image-body"),
]);

function multipart(filename: string, mimeType: string, bytes: Buffer) {
  const boundary = "----samriddhi-focused-test-boundary";
  const prefix = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`,
  );
  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
  return {
    payload: Buffer.concat([prefix, bytes, suffix]),
    headers: { "content-type": `multipart/form-data; boundary=${boundary}`, authorization: `Bearer ${TOKEN}` },
  };
}

function assertError(
  response: { statusCode: number; json: () => unknown },
  statusCode: number,
  code: string,
) {
  assert.equal(response.statusCode, statusCode);
  const payload = response.json() as { error: { code: string; message: string; requestId: string } };
  assert.equal(payload.error.code, code);
  assert.equal(typeof payload.error.message, "string");
  assert.equal(typeof payload.error.requestId, "string");
  assert.deepEqual(Object.keys(payload.error).sort(), ["code", "message", "requestId"]);
  return payload.error;
}

test("API-only composition starts without frontend files and returns JSON 404 responses", async () => {
  const content = await defaultContent();
  const database = fakeDatabase(content);
  const app = await buildApp({ sql: database.sql, config: config() });

  try {
    for (const url of ["/", "/admin/settings", "/assets/app.js", "/not-a-client-route"]) {
      const response = await app.inject({ method: "GET", url, headers: { accept: "text/html" } });
      assertError(response, 404, "NOT_FOUND");
      assert.match(String(response.headers["content-type"]), /^application\/json/);
      assert.doesNotMatch(response.body, /<!doctype html>/i);
    }

    const api = await app.inject({ method: "GET", url: "/api/content", headers: { accept: "text/html" } });
    assert.equal(api.statusCode, 200);
    assert.equal(api.json().schemaVersion, 2);

    const missingApi = await app.inject({ method: "GET", url: "/api/not-a-route", headers: { accept: "text/html" } });
    assertError(missingApi, 404, "NOT_FOUND");
  } finally {
    await app.close();
  }
});

test("public content hides private records while authenticated editors receive the full document", async () => {
  const content = await defaultContent();
  const storedContent = structuredClone(content);
  storedContent.focusAreas[0]!.enabled = false;
  storedContent.focusAreas[0]!.imageUrl = "https://example.org/private-focus.jpg";
  storedContent.news[0]!.status = "draft";
  storedContent.news[0]!.imageUrl = "https://example.org/private-news.jpg";
  storedContent.documents[0]!.isPublic = false;
  storedContent.documents[0]!.url = "https://example.org/private-document.pdf";
  storedContent.fundraising.campaigns.push(
    {
      id: "draft-appeal",
      title: "Private appeal",
      summary: "Not ready for publication",
      imageUrl: "https://example.org/private-appeal.jpg",
      imageAlt: "Private appeal",
      goalAmount: 1000,
      raisedAmount: 0,
      status: "draft",
      featured: false,
    },
    {
      id: "active-appeal",
      title: "Public appeal",
      summary: "Ready for publication",
      imageUrl: "https://example.org/public-appeal.jpg",
      imageAlt: "Public appeal",
      goalAmount: 1000,
      raisedAmount: 100,
      status: "active",
      featured: true,
    },
  );
  storedContent.reports.push({
    id: "draft-report",
    title: "Draft report",
    periodType: "monthly",
    periodLabel: "January 2026",
    summary: "Not ready for publication",
    documentUrl: "https://example.org/private-report.pdf",
    publishedAt: "2026-01-31",
    status: "draft",
  });
  const hiddenAssetUrls = [
    "https://example.org/private-focus.jpg",
    "https://example.org/private-news.jpg",
    "https://example.org/private-document.pdf",
    "https://example.org/private-appeal.jpg",
    "https://example.org/private-report.pdf",
  ];
  const database = fakeDatabase(storedContent);
  const app = await buildApp({ sql: database.sql, config: config() });

  const publicContent = await app.inject({ method: "GET", url: "/api/content" });
  assert.equal(publicContent.statusCode, 200);
  assert.equal(publicContent.json().revision, 3);
  const projected = publicContent.json().content as SiteContent;
  assert.equal(projected.focusAreas.some((item) => item.id === storedContent.focusAreas[0]!.id), false);
  assert.equal(projected.news.some((item) => item.id === storedContent.news[0]!.id), false);
  assert.equal(projected.documents.some((item) => item.id === storedContent.documents[0]!.id), false);
  assert.deepEqual(projected.fundraising.campaigns.map((item) => item.id), ["active-appeal"]);
  assert.equal(projected.reports.some((item) => item.id === "draft-report"), false);
  for (const hiddenUrl of hiddenAssetUrls) {
    assert.equal(publicContent.body.includes(hiddenUrl), false, `public response leaked ${hiddenUrl}`);
  }

  const adminContent = await app.inject({
    method: "GET",
    url: "/api/admin/content",
    headers: { authorization: `Bearer ${TOKEN}` },
  });
  assert.equal(adminContent.statusCode, 200);
  assert.equal(adminContent.headers["cache-control"], "no-store");
  assert.deepEqual(adminContent.json().content, storedContent);
  for (const hiddenUrl of hiddenAssetUrls) {
    assert.equal(adminContent.body.includes(hiddenUrl), true, `admin response omitted ${hiddenUrl}`);
  }

  const health = await app.inject({ method: "GET", url: "/health" });
  assert.equal(health.statusCode, 200);
  assert.equal(health.json().migrations.current, true);
  assert.equal(health.json().migrations.expected, "004");

  assert.equal(publicContent.headers["access-control-allow-origin"], undefined);

  const allowed = await app.inject({
    method: "OPTIONS",
    url: "/api/content",
    headers: {
      origin: "https://www.example.org",
      "access-control-request-method": "PUT",
      "access-control-request-headers": "authorization, content-type, if-none-match",
    },
  });
  assert.equal(allowed.statusCode, 204);
  assert.equal(allowed.headers["access-control-allow-origin"], "https://www.example.org");
  assert.equal(allowed.headers["access-control-allow-credentials"], undefined);
  const allowedMethods = String(allowed.headers["access-control-allow-methods"])
    .split(",")
    .map((method) => method.trim());
  assert.deepEqual(allowedMethods, ["GET", "PUT", "POST", "DELETE", "OPTIONS"]);
  const allowedHeaders = String(allowed.headers["access-control-allow-headers"])
    .toLowerCase()
    .split(",")
    .map((header) => header.trim());
  assert.deepEqual(allowedHeaders, ["authorization", "content-type", "if-none-match"]);

  for (const origin of [
    "https://api.example.org",
    "https://attacker.example",
    "https://www.example.org.evil.invalid",
    "https://www.example.org/",
  ]) {
    const denied = await app.inject({
      method: "OPTIONS",
      url: "/api/content",
      headers: { origin, "access-control-request-method": "GET" },
    });
    assert.equal(denied.headers["access-control-allow-origin"], undefined, origin);
    assert.equal(denied.headers["access-control-allow-credentials"], undefined, origin);
  }
  await app.close();
});

test("public content redacts values behind disabled parent publication switches", async () => {
  const storedContent = structuredClone(await defaultContent());
  storedContent.announcement = {
    enabled: false,
    label: "PRIVATE ANNOUNCEMENT LABEL",
    message: "PRIVATE ANNOUNCEMENT MESSAGE",
    link: {
      label: "PRIVATE ANNOUNCEMENT LINK",
      href: "https://private.example/announcement",
    },
    tone: "teal",
  };
  storedContent.fundraising = {
    enabled: false,
    eyebrow: "PRIVATE FUNDRAISING EYEBROW",
    title: "PRIVATE FUNDRAISING TITLE",
    body: "PRIVATE FUNDRAISING BODY",
    campaigns: [{
      id: "private-disabled-campaign",
      title: "PRIVATE CAMPAIGN TITLE",
      summary: "PRIVATE CAMPAIGN SUMMARY",
      imageUrl: "https://private.example/campaign.jpg",
      imageAlt: "PRIVATE CAMPAIGN IMAGE ALT",
      goalAmount: 500_000,
      raisedAmount: 125_000,
      status: "active",
      featured: true,
    }],
  };
  Object.assign(storedContent.donation, {
    acceptingDonations: false,
    minimumAmount: 25_000,
    qrImageUrl: "https://private.example/paused-donation-qr.png",
    upiId: "private-paused-transfer@upi",
    payeeName: "PRIVATE PAUSED PAYEE",
    bankName: "PRIVATE PAUSED BANK",
    accountName: "PRIVATE PAUSED ACCOUNT NAME",
    accountNumber: "PRIVATE-PAUSED-ACCOUNT-1234",
    ifsc: "PRIVATEIFSC",
    branch: "PRIVATE PAUSED BRANCH",
    accountType: "PRIVATE PAUSED ACCOUNT TYPE",
    gatewayEnabled: true,
  });
  const privateValues = [
    storedContent.announcement.label,
    storedContent.announcement.message,
    storedContent.announcement.link.label,
    storedContent.announcement.link.href,
    storedContent.fundraising.eyebrow,
    storedContent.fundraising.title,
    storedContent.fundraising.body,
    storedContent.fundraising.campaigns[0]!.id,
    storedContent.fundraising.campaigns[0]!.title,
    storedContent.fundraising.campaigns[0]!.summary,
    storedContent.fundraising.campaigns[0]!.imageUrl,
    storedContent.fundraising.campaigns[0]!.imageAlt,
    storedContent.donation.qrImageUrl,
    storedContent.donation.upiId,
    storedContent.donation.payeeName,
    storedContent.donation.bankName,
    storedContent.donation.accountName,
    storedContent.donation.accountNumber,
    storedContent.donation.ifsc,
    storedContent.donation.branch,
    storedContent.donation.accountType,
  ];
  const database = fakeDatabase(storedContent);
  const app = await buildApp({ sql: database.sql, config: config() });

  const publicResponse = await app.inject({ method: "GET", url: "/api/content" });
  assert.equal(publicResponse.statusCode, 200);
  const projected = publicResponse.json().content as SiteContent;
  assert.deepEqual(projected.announcement, {
    enabled: false,
    label: "",
    message: "",
    link: { label: "", href: "" },
    tone: "pink",
  });
  assert.deepEqual(projected.fundraising, {
    enabled: false,
    eyebrow: "",
    title: "Fundraising",
    body: "",
    campaigns: [],
  });
  assert.deepEqual(
    {
      minimumAmount: projected.donation.minimumAmount,
      qrImageUrl: projected.donation.qrImageUrl,
      upiId: projected.donation.upiId,
      payeeName: projected.donation.payeeName,
      bankName: projected.donation.bankName,
      accountName: projected.donation.accountName,
      accountNumber: projected.donation.accountNumber,
      ifsc: projected.donation.ifsc,
      branch: projected.donation.branch,
      accountType: projected.donation.accountType,
      gatewayEnabled: projected.donation.gatewayEnabled,
    },
    {
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
    },
  );
  assert.equal(siteContentSchema.safeParse(projected).success, true);
  for (const privateValue of privateValues) {
    assert.equal(publicResponse.body.includes(privateValue), false, `public response leaked ${privateValue}`);
  }

  const adminResponse = await app.inject({
    method: "GET",
    url: "/api/admin/content",
    headers: { authorization: `Bearer ${TOKEN}` },
  });
  assert.equal(adminResponse.statusCode, 200);
  assert.deepEqual(adminResponse.json().content, storedContent);
  for (const privateValue of privateValues) {
    assert.equal(adminResponse.body.includes(privateValue), true, `admin response omitted ${privateValue}`);
  }

  await app.close();
});

test("health reports not ready for incomplete, deleted, or renamed migration history", async () => {
  const content = await defaultContent();
  const staleDatabase = fakeDatabase(content, { latestMigration: "002" });
  const staleApp = await buildApp({ sql: staleDatabase.sql, config: config() });
  const stale = await staleApp.inject({ method: "GET", url: "/health" });
  assert.equal(stale.statusCode, 503);
  assert.equal(stale.json().database, "ready");
  assert.equal(stale.json().migrations.current, false);
  await staleApp.close();

  const deletedDatabase = fakeDatabase(content, { appliedMigrationMissingFromSource: true });
  const deletedApp = await buildApp({ sql: deletedDatabase.sql, config: config() });
  const deleted = await deletedApp.inject({ method: "GET", url: "/health" });
  assert.equal(deleted.statusCode, 503);
  assert.equal(deleted.json().database, "ready");
  assert.equal(deleted.json().migrations.current, false);
  await deletedApp.close();

  const renamedDatabase = fakeDatabase(content, { migrationNameMismatch: true });
  const renamedApp = await buildApp({ sql: renamedDatabase.sql, config: config() });
  const renamed = await renamedApp.inject({ method: "GET", url: "/health" });
  assert.equal(renamed.statusCode, 503);
  assert.equal(renamed.json().database, "ready");
  assert.equal(renamed.json().migrations.current, false);
  await renamedApp.close();
});

test("login failures are generic and the shared account limit spans source IPs", async () => {
  const content = await defaultContent();
  const database = fakeDatabase(content);
  const app = await buildApp({ sql: database.sql, config: config() });

  const malformed = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    remoteAddress: "192.0.2.1",
    payload: { username: "administrator" },
  });
  const wrong = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    remoteAddress: "192.0.2.2",
    payload: { username: "administrator", password: "wrong-password" },
  });
  const malformedError = assertError(malformed, 401, "AUTH_FAILED");
  const wrongError = assertError(wrong, 401, "AUTH_FAILED");
  assert.equal(malformedError.message, wrongError.message);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      remoteAddress: `192.0.2.${attempt + 3}`,
      payload: { username: "administrator" },
    });
    assert.equal(response.statusCode, 401);
  }
  const limited = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    remoteAddress: "192.0.2.6",
    payload: { username: "administrator" },
  });
  assertError(limited, 429, "RATE_LIMITED");
  const accountAttempts = database.queries.filter((record) => record.query.includes("INSERT INTO admin_login_rate_limits"));
  assert.equal(accountAttempts.length, 6);
  assert.equal(new Set(accountAttempts.map((record) => record.values[0])).size, 1);
  await app.close();
});

test("successful login returns an opaque token while the database receives only its hash", async () => {
  const content = await defaultContent();
  const passwordHash = await hashPassword("a-strong-test-password");
  const database = fakeDatabase(content, { loginPasswordHash: passwordHash });
  const app = await buildApp({ sql: database.sql, config: config() });

  const login = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { username: "administrator", password: "a-strong-test-password" },
  });
  assert.equal(login.statusCode, 200);
  assert.equal(login.headers["cache-control"], "no-store");
  const session = login.json() as { token: string; expiresAt: string; admin: { username: string } };
  assert.equal(session.admin.username, "administrator");
  const insert = database.queries.find((record) => record.query.includes("INSERT INTO admin_sessions"));
  assert.ok(insert);
  assert.equal(insert.values[0], hashSessionToken(session.token));
  assert.notEqual(insert.values[0], session.token);

  const verification = await app.inject({
    method: "GET",
    url: "/api/auth/session",
    headers: { authorization: `Bearer ${session.token}` },
  });
  assert.equal(verification.statusCode, 200);
  assert.equal(verification.headers["cache-control"], "no-store");

  const logout = await app.inject({
    method: "POST",
    url: "/api/auth/logout",
    headers: { authorization: `Bearer ${session.token}` },
  });
  assert.equal(logout.statusCode, 204);
  assert.ok(database.queries.some((record) => record.query.includes("SET revoked_at")));
  await app.close();
});

test("all protected CMS, upload, and financial routes reject missing or revoked sessions", async () => {
  const content = await defaultContent();
  const database = fakeDatabase(content, { authorized: false });
  const app = await buildApp({ sql: database.sql, config: config() });

  assertError(await app.inject({ method: "GET", url: "/api/admin/content" }), 401, "AUTH_REQUIRED");
  assertError(await app.inject({ method: "PUT", url: "/api/admin/content", payload: {} }), 401, "AUTH_REQUIRED");
  assertError(await app.inject({ method: "POST", url: "/api/admin/assets" }), 401, "AUTH_REQUIRED");
  assertError(
    await app.inject({
      method: "GET",
      url: "/api/admin/donations?period=monthly&value=2026-02",
      headers: { authorization: `Bearer ${TOKEN}` },
    }),
    401,
    "AUTH_REQUIRED",
  );
  for (const [method, url] of [
    ["GET", "/api/admin/members"],
    ["PUT", `/api/admin/members/${MEMBER_ID}`],
    ["DELETE", `/api/admin/members/${MEMBER_ID}`],
    ["GET", "/api/admin/receipts"],
    ["POST", "/api/admin/receipts"],
    ["DELETE", `/api/admin/receipts/${RECEIPT_ID}`],
  ] as const) {
    assertError(
      await app.inject({ method, url, headers: { authorization: `Bearer ${TOKEN}` }, payload: {} }),
      401,
      "AUTH_REQUIRED",
    );
  }
  const sessionLookup = database.queries.find((record) => record.query.includes("FROM admin_sessions s"));
  assert.ok(sessionLookup?.query.includes("s.revoked_at IS NULL"));
  assert.ok(sessionLookup?.query.includes("s.expires_at > now()"));
  assert.ok(sessionLookup?.query.includes("a.active = true"));
  assert.ok(sessionLookup?.query.includes("s.credential_version = a.credential_version"));
  await app.close();
});

test("content writes validate the full document and enforce optimistic revisions", async () => {
  const content = await defaultContent();
  const database = fakeDatabase(content, { revision: 3 });
  const app = await buildApp({ sql: database.sql, config: config() });
  const headers = { authorization: `Bearer ${TOKEN}` };

  assertError(
    await app.inject({ method: "PUT", url: "/api/admin/content", headers, payload: { expectedRevision: 3, content: {} } }),
    400,
    "BAD_REQUEST",
  );
  assertError(
    await app.inject({ method: "PUT", url: "/api/admin/content", headers, payload: { expectedRevision: 2, content } }),
    409,
    "CONFLICT",
  );
  const saved = await app.inject({
    method: "PUT",
    url: "/api/admin/content",
    headers,
    payload: { expectedRevision: 3, content: { ...content, announcement: { ...content.announcement, enabled: true } } },
  });
  assert.equal(saved.statusCode, 200);
  assert.equal(saved.json().revision, 4);
  assert.equal(saved.json().content.announcement.enabled, true);
  assert.ok(database.queries.some((record) => record.query.includes("INSERT INTO site_content_revisions")));
  assert.ok(database.queries.some((record) => record.query.includes("action") && record.values.includes("content.update")));
  await app.close();
});

test("asset upload rejects MIME and size violations and serves immutable validated bytes", async () => {
  const content = await defaultContent();
  const database = fakeDatabase(content);
  const app = await buildApp({ sql: database.sql, config: config() });

  const badType = multipart("notes.txt", "text/plain", Buffer.from("plain text"));
  assertError(await app.inject({ method: "POST", url: "/api/admin/assets", ...badType }), 400, "BAD_REQUEST");

  const oversizedBytes = Buffer.alloc(MAX_ASSET_BYTES + 1);
  oversizedBytes.write("%PDF-");
  const oversized = multipart("large.pdf", "application/pdf", oversizedBytes);
  assertError(await app.inject({ method: "POST", url: "/api/admin/assets", ...oversized }), 413, "PAYLOAD_TOO_LARGE");

  const valid = multipart("minutes.PDF", "application/pdf", Buffer.from("%PDF-1.7\n"));
  const uploaded = await app.inject({ method: "POST", url: "/api/admin/assets", ...valid });
  assert.equal(uploaded.statusCode, 201);
  assert.equal(uploaded.json().url, `https://api.example.org/api/assets/${ASSET_ID}/minutes.pdf`);

  const served = await app.inject({ method: "GET", url: `/api/assets/${ASSET_ID}/minutes.pdf` });
  assert.equal(served.statusCode, 200);
  assert.equal(served.headers["content-type"], "application/pdf");
  assert.equal(served.headers["cache-control"], "public, max-age=31536000, immutable");
  assert.equal(served.headers["x-content-type-options"], "nosniff");
  assert.equal(served.headers["content-disposition"], 'inline; filename="minutes.pdf"');
  assert.match(String(served.headers.etag), /^"[0-9a-f]{64}"$/);

  const cached = await app.inject({
    method: "GET",
    url: `/api/assets/${ASSET_ID}/minutes.pdf`,
    headers: { "if-none-match": String(served.headers.etag) },
  });
  assert.equal(cached.statusCode, 304);
  await app.close();
});

test("donation reports are non-cacheable, validated, paid-only, and capped", async () => {
  const content = await defaultContent();
  const database = fakeDatabase(content);
  const app = await buildApp({ sql: database.sql, config: config() });
  const headers = { authorization: `Bearer ${TOKEN}` };

  assertError(
    await app.inject({ method: "GET", url: "/api/admin/donations?period=monthly&value=2026-13", headers }),
    400,
    "BAD_REQUEST",
  );
  const response = await app.inject({
    method: "GET",
    url: "/api/admin/donations?period=monthly&value=2026-02",
    headers,
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["cache-control"], "no-store");
  assert.equal(response.json().records.length, 1);
  assert.equal(response.json().records[0].status, "paid");
  assert.equal(response.json().records[0].amount, 123.45);
  const reportQuery = database.queries.find((record) => record.query.includes("FROM donations"));
  assert.ok(reportQuery?.query.includes("LIMIT 5000"));
  await app.close();
});

test("join applications store the photo and stay off the public team until approved", async () => {
  const content = await defaultContent();
  const database = fakeDatabase(content);
  const app = await buildApp({ sql: database.sql, config: config() });
  const application = {
    memberType: "individual",
    fullName: "Asha Verma",
    email: "Asha@Example.org",
    phone: "+91 98765 43210",
    address: "12 Model Town",
    city: "Hisar",
    state: "Haryana",
    joinAs: "volunteer",
    consent: true,
  };

  const submitted = await app.inject({
    method: "POST",
    url: "/api/join",
    ...joinMultipart(application, "asha.png", "image/png", PNG_BYTES),
  });
  assert.equal(submitted.statusCode, 201);
  assert.equal(submitted.json().status, "pending");
  assert.equal(submitted.json().reference, MEMBER_ID.slice(0, 8).toUpperCase());
  const stored = database.members[0];
  assert.ok(stored);
  assert.equal(stored.status, "pending");
  assert.equal(stored.email, "asha@example.org");
  assert.equal(stored.designation, "Volunteer");
  assert.equal(stored.photo_asset_id, ASSET_ID);
  assert.deepEqual(stored.details, {
    dateOfBirth: "",
    gender: "",
    occupation: "",
    address: "12 Model Town",
    pincode: "",
    joinAs: "volunteer",
    availability: "",
    skills: "",
    motivation: "",
  });
  const photoInsert = database.queries.find((record) => record.query.includes("INSERT INTO cms_assets"));
  assert.equal(photoInsert?.values[6], null);

  const team = await app.inject({ method: "GET", url: "/api/team" });
  assert.equal(team.statusCode, 200);
  assert.deepEqual(team.json().members, []);

  assertError(
    await app.inject({
      method: "POST",
      url: "/api/join",
      ...joinMultipart({ ...application, consent: false }, "asha.png", "image/png", PNG_BYTES),
    }),
    400,
    "BAD_REQUEST",
  );
  assertError(
    await app.inject({
      method: "POST",
      url: "/api/join",
      ...joinMultipart(application, "notes.txt", "text/plain", Buffer.from("plain text")),
    }),
    400,
    "BAD_REQUEST",
  );
  const organization = await app.inject({
    method: "POST",
    url: "/api/join",
    ...joinMultipart({
      memberType: "organization",
      organizationName: "Haryana Steel Works",
      organizationType: "private-limited",
      contactName: "Rohit Jain",
      contactDesignation: "CSR Head",
      email: "csr@example.org",
      phone: "+91 90000 00000",
      address: "Industrial Area, Phase 2",
      city: "Hisar",
      state: "Haryana",
      collaboration: "csr",
      pan: "abcde1234f",
      consent: true,
    }, "logo.png", "image/png", PNG_BYTES),
  });
  assert.equal(organization.statusCode, 201);
  const company = database.members[1];
  assert.equal(company?.member_type, "organization");
  assert.equal(company?.full_name, "Rohit Jain");
  assert.equal(company?.organization_name, "Haryana Steel Works");
  assert.equal(company?.designation, "CSR partner");
  assert.equal(company?.details.pan, "ABCDE1234F");
  await app.close();
});

test("approval issues a member ID card whose public view hides contact details", async () => {
  const content = await defaultContent();
  const database = fakeDatabase(content, { members: [pendingMember()] });
  const app = await buildApp({ sql: database.sql, config: config() });
  const headers = { authorization: `Bearer ${TOKEN}` };

  const pending = await app.inject({ method: "GET", url: "/api/admin/members?status=pending", headers });
  assert.equal(pending.statusCode, 200);
  assert.equal(pending.headers["cache-control"], "no-store");
  assert.equal(pending.json().members[0].email, "asha@example.org");
  assert.equal(pending.json().members[0].photoUrl, `https://api.example.org/api/assets/${ASSET_ID}/photo.png`);

  const approved = await app.inject({
    method: "PUT",
    url: `/api/admin/members/${MEMBER_ID}`,
    headers,
    payload: { status: "approved", designation: "Field volunteer" },
  });
  assert.equal(approved.statusCode, 200);
  const member = approved.json().member;
  assert.equal(member.status, "approved");
  assert.equal(member.memberCode, "SHTF-M-0001");
  assert.equal(member.designation, "Field volunteer");
  assert.match(member.validUntil, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(member.approvedAt);
  assert.ok(database.queries.some((record) => record.values.includes("member.approved")));

  const card = await app.inject({ method: "GET", url: "/api/team/shtf-m-0001" });
  assert.equal(card.statusCode, 200);
  assert.equal(card.json().member.name, "Asha Verma");
  assert.equal(card.json().member.designation, "Field volunteer");
  for (const privateValue of ["asha@example.org", "98765", "12 Model Town"]) {
    assert.equal(card.body.includes(privateValue), false, `public ID card leaked ${privateValue}`);
  }
  const team = await app.inject({ method: "GET", url: "/api/team" });
  assert.equal(team.json().members.length, 1);
  assertError(await app.inject({ method: "GET", url: "/api/team/SHTF-M-9999" }), 404, "NOT_FOUND");
  assertError(await app.inject({ method: "GET", url: "/api/team/not-a-code" }), 404, "NOT_FOUND");

  const rejected = await app.inject({
    method: "PUT",
    url: `/api/admin/members/${MEMBER_ID}`,
    headers,
    payload: { status: "rejected" },
  });
  assert.equal(rejected.json().member.memberCode, "SHTF-M-0001");
  assertError(await app.inject({ method: "GET", url: "/api/team/SHTF-M-0001" }), 404, "NOT_FOUND");

  const removed = await app.inject({ method: "DELETE", url: `/api/admin/members/${MEMBER_ID}`, headers });
  assert.equal(removed.statusCode, 204);
  assert.equal(database.members.length, 0);
  assert.ok(database.queries.some((record) => record.query.includes("DELETE FROM cms_assets")));
  await app.close();
});

test("receipts are numbered by financial year and list issued donations", async () => {
  const content = await defaultContent();
  const database = fakeDatabase(content);
  const app = await buildApp({ sql: database.sql, config: config() });
  const headers = { authorization: `Bearer ${TOKEN}` };
  const receipt = {
    donorType: "individual",
    donorName: "Ravi Kumar",
    pan: "abcde1234f",
    amount: 5000,
    paymentDate: "2026-04-01",
    paymentMode: "UPI",
    paymentReference: "UTR123456",
    purpose: "General donation",
  };

  const issued = await app.inject({ method: "POST", url: "/api/admin/receipts", headers, payload: receipt });
  assert.equal(issued.statusCode, 201);
  assert.equal(issued.json().receipt.receiptNumber, "SHTF/2026-27/0007");
  assert.equal(issued.json().receipt.pan, "ABCDE1234F");
  assert.equal(issued.json().receipt.amount, 5000);
  assert.equal(issued.json().receipt.paymentDate, "2026-04-01");
  assert.equal(issued.json().receipt.source, "offline");
  const insert = database.queries.find((record) => record.query.startsWith("INSERT INTO donations"));
  assert.ok(insert?.query.includes("'offline'"));
  assert.ok(insert?.query.includes("'paid'"));
  assert.equal(insert?.values[6], 500000);

  const march = await app.inject({
    method: "POST",
    url: "/api/admin/receipts",
    headers,
    payload: { ...receipt, paymentDate: "2026-03-31" },
  });
  assert.equal(march.json().receipt.receiptNumber, "SHTF/2025-26/0007");

  for (const invalid of [
    { ...receipt, pan: "BAD" },
    { ...receipt, paymentDate: "2999-01-01" },
    { ...receipt, paymentDate: "2026-02-30" },
    { ...receipt, amount: 0 },
    { ...receipt, donorType: "company", companyName: "" },
  ]) {
    assertError(await app.inject({ method: "POST", url: "/api/admin/receipts", headers, payload: invalid }), 400, "BAD_REQUEST");
  }

  const list = await app.inject({ method: "GET", url: "/api/admin/receipts", headers });
  assert.equal(list.statusCode, 200);
  assert.equal(list.headers["cache-control"], "no-store");
  assert.equal(list.json().receipts[0].receiptNumber, "R-1");
  assert.equal(list.json().receipts[0].source, "online");

  const removed = await app.inject({ method: "DELETE", url: `/api/admin/receipts/${RECEIPT_ID}`, headers });
  assert.equal(removed.statusCode, 204);
  const deleteQuery = database.queries.find((record) => record.query.startsWith("DELETE FROM donations"));
  assert.ok(deleteQuery?.query.includes("provider = 'offline'"));
  await app.close();
});
