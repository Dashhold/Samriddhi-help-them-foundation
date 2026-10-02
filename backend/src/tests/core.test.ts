import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { bootstrapAdmin } from "../auth/bootstrap.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { createOpaqueToken, hashSessionToken, SESSION_TOKEN_BYTES } from "../auth/sessions.js";
import { hasValidSignature, safeAssetFilename } from "../assets/repository.js";
import { loadAppConfig, type AppConfig } from "../config.js";
import { siteContentSchema } from "../content/site-content-schema.js";
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

test("site content validation rejects impossible dates and unknown fields", async () => {
  const defaults = await loadDefaultContent();
  const invalidDate = structuredClone(defaults) as unknown as Record<string, unknown>;
  const news = invalidDate.news as Array<Record<string, unknown>>;
  news[0]!.publishedAt = "2026-02-30";
  assert.equal(siteContentSchema.safeParse(invalidDate).success, false);
  assert.equal(siteContentSchema.safeParse({ ...defaults, unexpected: true }).success, false);
});

test("runtime configuration normalizes origins and applies Railway defaults", () => {
  const environment = {
    DATABASE_URL: "postgres://example/test",
    DATABASE_SSL: "disable",
    PUBLIC_API_URL: "https://API.example.org:443/",
    FRONTEND_ORIGINS: "https://SITE.example.org:443/,http://localhost:8443",
    ADMIN_USERNAME: "administrator",
    ADMIN_PASSWORD: "a-strong-test-password",
    NODE_ENV: "test",
  };
  const config = loadAppConfig(environment);
  assert.equal(config.publicApiUrl, "https://api.example.org");
  assert.deepEqual(config.frontendOrigins, ["https://site.example.org", "http://localhost:8443"]);
  assert.deepEqual(loadAppConfig({ ...environment, FRONTEND_ORIGINS: undefined }).frontendOrigins, []);
  assert.doesNotThrow(() => loadAppConfig({ ...environment, NODE_ENV: "production" }));
  assert.deepEqual(
    loadAppConfig({ ...environment, NODE_ENV: "production", FRONTEND_ORIGINS: undefined }).frontendOrigins,
    [],
  );
  assert.equal(loadAppConfig({ ...environment, PUBLIC_API_URL: "api.example.org" }).publicApiUrl, "https://api.example.org");
  assert.deepEqual(
    loadAppConfig({ ...environment, FRONTEND_ORIGINS: "site.up.railway.app" }).frontendOrigins,
    ["https://site.up.railway.app"],
  );
  assert.equal(
    loadAppConfig({ ...environment, PUBLIC_API_URL: undefined, RAILWAY_PUBLIC_DOMAIN: "api.up.railway.app" }).publicApiUrl,
    "https://api.up.railway.app",
  );

  for (const origin of [
    "https://user:password@site.example.org",
    "https://*.example.org",
    "https://site.example.org/base",
    "https://site.example.org?next=other",
    "https://site.example.org#fragment",
    "http://site.example.org",
    "ftp://site.example.org",
  ]) {
    assert.throws(() => loadAppConfig({ ...environment, FRONTEND_ORIGINS: origin }), origin);
  }
  assert.throws(() => loadAppConfig({ ...environment, PUBLIC_API_URL: "https://api.example.org/base" }));
  assert.throws(() => loadAppConfig({ ...environment, PUBLIC_API_URL: "http://api.example.org" }));
  assert.throws(() => loadAppConfig({ ...environment, ADMIN_PASSWORD: "too-short" }));
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
