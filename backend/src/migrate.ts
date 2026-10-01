import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createDatabase, closeDatabase, type Database } from "./db.js";
import { loadDatabaseConfig } from "./config.js";
import { siteContentSchema } from "./content/site-content-schema.js";

const migrationPattern = /^(\d{3})_[a-z0-9_-]+\.sql$/;
const seedToken = "/*__DEFAULT_CONTENT_JSON__*/";

export type Migration = {
  version: string;
  name: string;
  checksum: string;
  sql: string;
};

export type AppliedMigration = Pick<Migration, "version" | "name" | "checksum">;

export async function discoverMigrations(
  migrationsDirectory = fileURLToPath(new URL("../migrations/", import.meta.url)),
  defaultContentFile = fileURLToPath(new URL("../src/content/default-content.json", import.meta.url)),
): Promise<Migration[]> {
  const names = (await readdir(migrationsDirectory)).filter((name) => migrationPattern.test(name)).sort();
  if (names.length === 0) throw new Error("No database migrations were found.");

  const versions = new Set<string>();
  const defaultContentRaw = await readFile(defaultContentFile, "utf8");
  const defaultContent = siteContentSchema.parse(JSON.parse(defaultContentRaw));
  const defaultContentSql = `$site_content$${JSON.stringify(defaultContent)}$site_content$`;

  return Promise.all(names.map(async (name) => {
    const match = migrationPattern.exec(name);
    const version = match?.[1];
    if (!version) throw new Error(`Invalid migration filename: ${name}`);
    if (versions.has(version)) throw new Error(`Duplicate migration version: ${version}`);
    versions.add(version);
    const rawSql = await readFile(join(migrationsDirectory, name), "utf8");
    const sql = rawSql.includes(seedToken) ? rawSql.replace(seedToken, defaultContentSql) : rawSql;
    const checksum = createHash("sha256").update(name).update("\0").update(sql).digest("hex");
    return { version, name, checksum, sql };
  }));
}

export function assertAppliedMigrationHistory(
  appliedMigrations: AppliedMigration[],
  sourceMigrations: AppliedMigration[],
) {
  const sourceByVersion = new Map(sourceMigrations.map((migration) => [migration.version, migration]));
  if (sourceByVersion.size !== sourceMigrations.length) {
    throw new Error("Source migration history contains duplicate versions.");
  }

  for (const applied of appliedMigrations) {
    const source = sourceByVersion.get(applied.version);
    if (!source) {
      throw new Error(`Applied migration ${applied.name} (${applied.version}) is missing from source history.`);
    }
    if (source.name !== applied.name) {
      throw new Error(
        `Migration version ${applied.version} was applied as ${applied.name} but source history names it ${source.name}.`,
      );
    }
    if (source.checksum !== applied.checksum) {
      throw new Error(`Migration ${source.name} has changed after it was applied.`);
    }
  }
}

export function migrationHistoryIsCurrent(
  appliedMigrations: AppliedMigration[],
  sourceMigrations: AppliedMigration[],
) {
  try {
    assertAppliedMigrationHistory(appliedMigrations, sourceMigrations);
    return appliedMigrations.length === sourceMigrations.length;
  } catch {
    return false;
  }
}

export async function applyMigrations(sql: Database, migrations?: Migration[]) {
  const pendingMigrations = migrations ?? await discoverMigrations();
  const appliedNames = await sql.begin(async (transaction) => {
    await transaction`SELECT pg_advisory_xact_lock(hashtext('samriddhi_schema_migrations'))`;
    await transaction.unsafe(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        name text NOT NULL UNIQUE,
        checksum char(64) NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT schema_migrations_checksum CHECK (checksum ~ '^[0-9a-f]{64}$')
      )
    `);

    const applied = await transaction<AppliedMigration[]>`
      SELECT version, name, checksum FROM schema_migrations ORDER BY version
    `;
    assertAppliedMigrationHistory(applied, pendingMigrations);
    const appliedByVersion = new Map(applied.map((item) => [item.version, item]));
    const names: string[] = [];

    for (const migration of pendingMigrations) {
      if (appliedByVersion.has(migration.version)) continue;
      await transaction.unsafe(migration.sql);
      await transaction`
        INSERT INTO schema_migrations (version, name, checksum)
        VALUES (${migration.version}, ${migration.name}, ${migration.checksum})
      `;
      names.push(migration.name);
    }
    return names;
  });

  for (const name of appliedNames) process.stdout.write(`Applied migration ${name}\n`);
}

async function main() {
  const sql = createDatabase(loadDatabaseConfig());
  try {
    await applyMigrations(sql);
    process.stdout.write("Database migrations are current.\n");
  } finally {
    await closeDatabase(sql);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Database migration failed."}\n`);
    process.exitCode = 1;
  });
}
