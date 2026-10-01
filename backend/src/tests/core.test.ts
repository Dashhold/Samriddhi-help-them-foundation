import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { bootstrapAdmin } from "../auth/bootstrap.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { createOpaqueToken, hashSessionToken, SESSION_TOKEN_BYTES } from "../auth/sessions.js";
import { hasValidSignature, safeAssetFilename } from "../assets/repository.js";
import { loadAppConfig, type AppConfig } from "../config.js";
import { siteContentSchema, type SiteContent } from "../content/site-content-schema.js";
import type { Database } from "../db.js";
import { donationDateRange } from "../donations/repository.js";
import { applyMigrations, discoverMigrations } from "../migrate.js";

type QueryHandler = (query: string, values: unknown[]) => unknown[] | Promise<unknown[]>;

function fakeDatabase(handler: QueryHandler) {
  const query = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    return handler(strings.join("?"), values);
  };
  const sql = query as unknown as Database;
  Object.assign(sql, {
    begin: async (callback: (transaction: Database) => unknown) => callback(sql),
    json: (value: unknown) => value,
    unsafe: async (statement: string) => handler(statement, []),
  });
  return sql;
}

function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
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
    ...overrides,
  };
}

async function loadDefaultContent() {
  const raw = await readFile(new URL("../../src/content/default-content.json", import.meta.url), "utf8");
  return siteContentSchema.parse(JSON.parse(raw));
}

test("bundled server defaults exactly match the frontend schema-v2 defaults", async () => {
  const serverDefaults = await loadDefaultContent();
  const frontendSource = await readFile(new URL("../../../frontend/src/cms/defaultContent.ts", import.meta.url), "utf8");
  const frontendJavaScript = transpileModule(frontendSource, {
    compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 },
  }).outputText;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(frontendJavaScript).toString("base64")}`;
  const frontendModule = await import(dataUrl) as { defaultSiteContent: SiteContent };

  assert.deepEqual(serverDefaults, frontendModule.defaultSiteContent);
  assert.equal(serverDefaults.documents.length, 8);
  assert.equal(serverDefaults.news.length, 3);
});

test("site content validation rejects impossible dates and unknown fields", async () => {
  const defaults = await loadDefaultContent();
  const invalidDate = structuredClone(defaults) as unknown as Record<string, unknown>;
  const news = invalidDate.news as Array<Record<string, unknown>>;
  news[0]!.publishedAt = "2026-02-30";
  assert.equal(siteContentSchema.safeParse(invalidDate).success, false);
  assert.equal(siteContentSchema.safeParse({ ...defaults, unexpected: true }).success, false);
});

test("runtime configuration requires exact origins and server-only credentials", () => {
  const environment = {
    DATABASE_URL: "postgres://example/test",
    DATABASE_SSL: "disable",
    PUBLIC_API_URL: "https://api.example.org",
    FRONTEND_ORIGINS: "https://site.example.org,http://localhost:8443",
    ADMIN_USERNAME: "administrator",
    ADMIN_PASSWORD: "a-strong-test-password",
    NODE_ENV: "test",
  };
  const config = loadAppConfig(environment);
  assert.deepEqual(config.frontendOrigins, ["https://site.example.org", "http://localhost:8443"]);
  assert.deepEqual(loadAppConfig({ ...environment, FRONTEND_ORIGINS: undefined }).frontendOrigins, []);
  assert.throws(() => loadAppConfig({ ...environment, PUBLIC_API_URL: "https://api.example.org/base" }));
  assert.throws(() => loadAppConfig({ ...environment, ADMIN_PASSWORD: "too-short" }));
});

test("production API routing ignores a foreign VITE_API_URL", async () => {
  const source = await readFile(new URL("../../../frontend/src/lib/api-origin.ts", import.meta.url), "utf8");
  const javascript = transpileModule(source, {
    compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 },
  }).outputText;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`;
  const module = await import(dataUrl) as {
    resolveApiBaseUrl: (environment: {
      development: boolean;
      production: boolean;
      configuredUrl?: string;
    }) => string | null;
  };

  const productionBaseUrl = module.resolveApiBaseUrl({
    development: false,
    production: true,
    configuredUrl: "https://attacker.example",
  });
  assert.equal(productionBaseUrl, "");
  assert.equal(`${productionBaseUrl}/api/auth/login`, "/api/auth/login");
  assert.equal(module.resolveApiBaseUrl({
    development: true,
    production: false,
    configuredUrl: "http://localhost:3000/",
  }), "http://localhost:3000");
});

test("passwords use Argon2id and opaque session tokens are stored only as hashes", async () => {
  const hash = await hashPassword("a-strong-test-password");
  assert.match(hash, /^\$argon2id\$/);
  assert.equal(await verifyPassword(hash, "a-strong-test-password"), true);
  assert.equal(await verifyPassword(hash, "wrong-password"), false);
  const token = createOpaqueToken();
  assert.ok(Buffer.from(token, "base64url").length >= SESSION_TOKEN_BYTES);
  assert.match(hashSessionToken(token), /^[0-9a-f]{64}$/);
  assert.equal(hashSessionToken(token).includes(token), false);
});

test("administrator bootstrap hashes rotations and revokes prior sessions", async () => {
  const previousHash = await hashPassword("the-old-test-password");
  const statements: Array<{ query: string; values: unknown[] }> = [];
  const sql = fakeDatabase(async (query, values) => {
    statements.push({ query, values });
    if (query.includes("FROM admins")) {
      return [{
        id: "11111111-1111-4111-8111-111111111111",
        username: "administrator",
        username_normalized: "administrator",
        password_hash: previousHash,
        credential_version: 1,
      }];
    }
    return [];
  });

  await bootstrapAdmin(sql, testConfig({ adminPassword: "the-new-test-password" }));
  const credentialUpdate = statements.find((statement) => statement.query.includes("password_hash ="));
  assert.ok(credentialUpdate);
  assert.equal(await verifyPassword(String(credentialUpdate.values[2]), "the-new-test-password"), true);
  assert.ok(statements.some((statement) => statement.query.includes("UPDATE admin_sessions")));
});

test("donation report periods reject malformed and out-of-range dates", () => {
  const [start, end] = donationDateRange("monthly", "2026-02");
  assert.equal(start.toISOString(), "2026-02-01T00:00:00.000Z");
  assert.equal(end.toISOString(), "2026-03-01T00:00:00.000Z");
  assert.throws(() => donationDateRange("monthly", "2026-13"));
  assert.throws(() => donationDateRange("yearly", "26"));
  assert.throws(() => donationDateRange("yearly", "1999"));
});

test("CSV exports neutralize spreadsheet formulas after whitespace and controls", async () => {
  const source = await readFile(new URL("../../../frontend/src/payments/contracts.ts", import.meta.url), "utf8");
  const javascript = transpileModule(source, {
    compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 },
  }).outputText;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`;
  const module = await import(dataUrl) as {
    donationRecordsToCsv: (records: Array<Record<string, unknown>>) => string;
  };
  const csv = module.donationRecordsToCsv([{
    id: "=2+2",
    providerOrderId: "order-1",
    providerPaymentId: "@SUM(1,1)",
    donorType: "individual",
    donorName: " \t=HYPERLINK(\"https://example.invalid\")",
    companyName: "+1+1",
    email: "\t@malicious.example",
    amount: 123.45,
    currency: "INR",
    purpose: "\u0001-2+3",
    status: "paid",
    receiptNumber: "safe-receipt",
    createdAt: "2026-02-10T10:00:00.000Z",
  }]);

  assert.ok(csv.includes("\"'=2+2\""));
  assert.ok(csv.includes("\"'+1+1\""));
  assert.ok(csv.includes("\"'\t@malicious.example\""));
  assert.ok(csv.includes("\"'\u0001-2+3\""));
  assert.ok(csv.includes("\"'@SUM(1,1)\""));
  assert.ok(csv.includes("\"safe-receipt\""));
});

test("certificate details stay sample-only until a donation is confirmed paid", async () => {
  const source = await readFile(new URL("../../../frontend/src/payments/certificate.ts", import.meta.url), "utf8");
  const javascript = transpileModule(source, {
    compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 },
  }).outputText;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`;
  const module = await import(dataUrl) as {
    certificateDetails: (record?: Record<string, unknown>) => {
      supporterName: string;
      reference: string;
      isPreview: boolean;
    };
  };

  const unpaid = module.certificateDetails({
    id: "donation-1",
    donorName: "Real Donor",
    status: "pending",
    paidAt: "2026-02-10T10:05:00.000Z",
  });
  assert.equal(unpaid.isPreview, true);
  assert.equal(unpaid.supporterName, "Supporter Name");
  assert.equal(unpaid.reference, "SAMPLE-PREVIEW-001");

  const paid = module.certificateDetails({
    id: "donation-1",
    providerOrderId: "order-1",
    providerPaymentId: "payment-1",
    donorType: "individual",
    donorName: "Confirmed Donor",
    purpose: "General donation",
    status: "paid",
    paidAt: "2026-02-10T10:05:00.000Z",
  });
  assert.equal(paid.isPreview, false);
  assert.equal(paid.supporterName, "Confirmed Donor");
  assert.equal(paid.reference, "payment-1");
});

test("asset metadata is sanitized and file signatures are checked", () => {
  assert.equal(safeAssetFilename("../Board minutes (final).PDF", "application/pdf"), "Board-minutes-final.pdf");
  assert.equal(hasValidSignature("application/pdf", Buffer.from("%PDF-1.7\n")), true);
  assert.equal(hasValidSignature("application/pdf", Buffer.from("not a pdf")), false);
  assert.equal(hasValidSignature("image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47])), false);
});

test("migration discovery is ordered, checksummed, and contains the full schema inventory", async () => {
  const migrations = await discoverMigrations();
  assert.deepEqual(migrations.map((item) => item.version), ["001", "002", "003"]);
  assert.match(migrations[0]!.checksum, /^[0-9a-f]{64}$/);
  assert.equal(migrations[1]!.sql.includes("__DEFAULT_CONTENT_JSON__"), false);
  assert.ok(migrations[1]!.sql.includes("samriddhihelpteam@gmail.com"));

  const schema = migrations.map((migration) => migration.sql).join("\n");
  for (const name of [
    "admins",
    "admin_sessions",
    "admin_login_rate_limits",
    "site_content",
    "site_content_revisions",
    "cms_assets",
    "donations",
    "payment_webhook_events",
    "admin_audit_log",
    "monthly_donation_reports",
    "yearly_donation_reports",
  ]) assert.ok(schema.includes(name), `missing schema object: ${name}`);
  assert.ok(schema.includes("data bytea NOT NULL"));
  assert.ok(schema.includes("reject_append_only_mutation"));
});

test("migration execution rejects changed, deleted, and renamed history", async () => {
  const statements: string[] = [];
  const migration = {
    version: "999",
    name: "999_test.sql",
    checksum: "a".repeat(64),
    sql: "SELECT 1",
  };
  const sql = fakeDatabase(async (query) => {
    statements.push(query);
    if (query.includes("FROM schema_migrations ORDER BY version")) return [];
    return [];
  });
  await applyMigrations(sql, [migration]);
  assert.ok(statements.some((statement) => statement.includes("pg_advisory_xact_lock")));
  assert.equal(statements.some((statement) => statement.includes("pg_advisory_unlock")), false);

  const changed = fakeDatabase(async (query) => {
    if (query.includes("FROM schema_migrations ORDER BY version")) {
      return [{ version: "999", name: "999_test.sql", checksum: "b".repeat(64) }];
    }
    return [];
  });
  await assert.rejects(() => applyMigrations(changed, [migration]), /changed after it was applied/);

  const deleted = fakeDatabase(async (query) => {
    if (query.includes("FROM schema_migrations ORDER BY version")) {
      return [{ version: "998", name: "998_deleted.sql", checksum: "b".repeat(64) }];
    }
    return [];
  });
  await assert.rejects(() => applyMigrations(deleted, [migration]), /missing from source history/);

  const renamed = fakeDatabase(async (query) => {
    if (query.includes("FROM schema_migrations ORDER BY version")) {
      return [{ version: "999", name: "999_old-name.sql", checksum: "a".repeat(64) }];
    }
    return [];
  });
  await assert.rejects(() => applyMigrations(renamed, [migration]), /was applied as 999_old-name.sql/);
});
